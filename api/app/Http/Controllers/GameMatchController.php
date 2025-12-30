<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Models\GameMatch;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class GameMatchController extends Controller
{
    
    public function storeGame(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:3,9',
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'required|exists:users,id',
            'match_id' => 'nullable|exists:matches,id',
            'began_at' => 'nullable|date',
            'status' => 'nullable|in:Pending,Playing,Ended,Interrupted',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $game = Game::create([
            'type' => $request->type,
            'player1_user_id' => $request->player1_user_id,
            'player2_user_id' => $request->player2_user_id,
            'match_id' => $request->match_id,
            'status' => $request->status ?? 'Playing',
            'began_at' => $request->began_at ?? now(),
            'is_draw' => false,
            'player1_points' => 0,
            'player2_points' => 0,
        ]);

        return response()->json([
            'message' => 'Game created successfully',
            'game' => $game
        ], 201);
    }

   
    public function updateGame(Request $request, $id)
    {
        $game = Game::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:Playing,Ended,Interrupted',
            'player1_points' => 'nullable|integer|min:0|max:120',
            'player2_points' => 'nullable|integer|min:0|max:120',
            'is_draw' => 'nullable|boolean',
            'winner_user_id' => 'nullable|exists:users,id',
            'loser_user_id' => 'nullable|exists:users,id',
            'ended_at' => 'nullable|date',
            'resigned_player' => 'nullable|in:1,2',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Update game status
            if ($request->has('status')) {
                $game->status = $request->status;
            }

            // Update points
            if ($request->has('player1_points')) {
                $game->player1_points = $request->player1_points;
            }
            if ($request->has('player2_points')) {
                $game->player2_points = $request->player2_points;
            }

            // Handle game end
            if ($request->status === 'Ended') {
                $game->ended_at = $request->ended_at ?? now();
                
                // Calculate total time in seconds
                if ($game->began_at) {
                    $game->total_time = Carbon::parse($game->began_at)
                        ->diffInSeconds(Carbon::parse($game->ended_at));
                }

                // Determine winner/loser
                if ($request->has('is_draw') && $request->is_draw) {
                    $game->is_draw = true;
                    $game->winner_user_id = null;
                    $game->loser_user_id = null;
                } else {
                    if ($request->has('winner_user_id')) {
                        $game->winner_user_id = $request->winner_user_id;
                        $game->loser_user_id = $request->loser_user_id ?? 
                            ($game->player1_user_id == $request->winner_user_id 
                                ? $game->player2_user_id 
                                : $game->player1_user_id);
                    } else {
                        // Auto-determine winner by points
                        if ($game->player1_points > $game->player2_points) {
                            $game->winner_user_id = $game->player1_user_id;
                            $game->loser_user_id = $game->player2_user_id;
                        } elseif ($game->player2_points > $game->player1_points) {
                            $game->winner_user_id = $game->player2_user_id;
                            $game->loser_user_id = $game->player1_user_id;
                        } else {
                            $game->is_draw = true;
                        }
                    }
                }

                // Handle coin transactions for standalone games (not in matches)
                if (!$game->match_id) {
                    $this->processGamePayouts($game);
                }
            }

            $game->save();

            DB::commit();

            return response()->json([
                'message' => 'Game updated successfully',
                'game' => $game->fresh()
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update game',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new match
     * POST /api/matches
     */
    public function storeMatch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:3,9',
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'required|exists:users,id',
            'stake' => 'required|integer|min:3|max:100',
            'began_at' => 'nullable|date',
            'status' => 'nullable|in:Pending,Playing,Ended,Interrupted',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Deduct stake from both players
            $player1 = User::findOrFail($request->player1_user_id);
            $player2 = User::findOrFail($request->player2_user_id);

            if ($player1->coins_balance < $request->stake) {
                return response()->json([
                    'message' => 'Player 1 has insufficient coins'
                ], 400);
            }

            if ($player2->coins_balance < $request->stake) {
                return response()->json([
                    'message' => 'Player 2 has insufficient coins'
                ], 400);
            }

            // Create match
            $match = GameMatch::create([
                'type' => $request->type,
                'player1_user_id' => $request->player1_user_id,
                'player2_user_id' => $request->player2_user_id,
                'stake' => $request->stake,
                'status' => $request->status ?? 'Playing',
                'began_at' => $request->began_at ?? now(),
                'player1_marks' => 0,
                'player2_marks' => 0,
                'player1_points' => 0,
                'player2_points' => 0,
            ]);

            // Deduct stake and create transactions
            $stakeTypeId = CoinTransactionType::where('name', 'Match stake')->first()->id;

            $player1->coins_balance -= $request->stake;
            $player1->save();

            CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $player1->id,
                'match_id' => $match->id,
                'coin_transaction_type_id' => $stakeTypeId,
                'coins' => -$request->stake,
            ]);

            $player2->coins_balance -= $request->stake;
            $player2->save();

            CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $player2->id,
                'match_id' => $match->id,
                'coin_transaction_type_id' => $stakeTypeId,
                'coins' => -$request->stake,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Match created successfully',
                'match' => $match
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create match',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    
    public function updateMatch(Request $request, $id)
    {
        $match = GameMatch::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:Playing,Ended,Interrupted',
            'player1_marks' => 'nullable|integer|min:0',
            'player2_marks' => 'nullable|integer|min:0',
            'player1_points' => 'nullable|integer|min:0',
            'player2_points' => 'nullable|integer|min:0',
            'winner_user_id' => 'nullable|exists:users,id',
            'loser_user_id' => 'nullable|exists:users,id',
            'ended_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Update match data
            if ($request->has('status')) {
                $match->status = $request->status;
            }

            if ($request->has('player1_marks')) {
                $match->player1_marks = $request->player1_marks;
            }
            if ($request->has('player2_marks')) {
                $match->player2_marks = $request->player2_marks;
            }
            if ($request->has('player1_points')) {
                $match->player1_points = $request->player1_points;
            }
            if ($request->has('player2_points')) {
                $match->player2_points = $request->player2_points;
            }

            // Handle match end
            if ($request->status === 'Ended') {
                $match->ended_at = $request->ended_at ?? now();
                
                // Calculate total time
                if ($match->began_at) {
                    $match->total_time = Carbon::parse($match->began_at)
                        ->diffInSeconds(Carbon::parse($match->ended_at));
                }

                // Determine winner
                if ($request->has('winner_user_id')) {
                    $match->winner_user_id = $request->winner_user_id;
                    $match->loser_user_id = $request->loser_user_id ?? 
                        ($match->player1_user_id == $request->winner_user_id 
                            ? $match->player2_user_id 
                            : $match->player1_user_id);
                } else {
                    // Auto-determine by marks
                    if ($match->player1_marks >= 4) {
                        $match->winner_user_id = $match->player1_user_id;
                        $match->loser_user_id = $match->player2_user_id;
                    } elseif ($match->player2_marks >= 4) {
                        $match->winner_user_id = $match->player2_user_id;
                        $match->loser_user_id = $match->player1_user_id;
                    }
                }

                // Process match payout
                $this->processMatchPayout($match);
            }

            $match->save();

            DB::commit();

            return response()->json([
                'message' => 'Match updated successfully',
                'match' => $match->fresh()
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update match',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process game payouts for standalone games
     */
    private function processGamePayouts(Game $game)
    {
        $gameFeeTypeId = CoinTransactionType::where('name', 'Game fee')->first()->id;
        $gamePayoutTypeId = CoinTransactionType::where('name', 'Game payout')->first()->id;

        // Game costs 2 coins per player (already deducted when game started)
        // Payouts:
        // - Draw: 1 coin refund to each
        // - 61-90 points: 3 coins
        // - 91-119 points (capote): 4 coins
        // - 120 points (bandeira): 6 coins

        if ($game->is_draw) {
            // Refund 1 coin to each player
            $this->addCoinsAndTransaction($game->player1_user_id, 1, $gamePayoutTypeId, $game->id);
            $this->addCoinsAndTransaction($game->player2_user_id, 1, $gamePayoutTypeId, $game->id);
        } else {
            $winnerPoints = $game->winner_user_id == $game->player1_user_id 
                ? $game->player1_points 
                : $game->player2_points;

            $payout = 3; // Default for 61-90
            if ($winnerPoints == 120) {
                $payout = 6; // Bandeira
            } elseif ($winnerPoints >= 91) {
                $payout = 4; // Capote
            }

            $this->addCoinsAndTransaction($game->winner_user_id, $payout, $gamePayoutTypeId, $game->id);
        }
    }

    
    private function processMatchPayout(GameMatch $match)
    {
        if (!$match->winner_user_id) {
            return;
        }

        $matchPayoutTypeId = CoinTransactionType::where('name', 'Match payout')->first()->id;

        // Winner gets: (stake * 2) - 1 coin platform commission
        $totalStake = $match->stake * 2;
        $payout = $totalStake - 1;

        $this->addCoinsAndTransaction($match->winner_user_id, $payout, $matchPayoutTypeId, null, $match->id);
    }

    /**
     * Helper to add coins and create transaction
     */
    private function addCoinsAndTransaction($userId, $amount, $transactionTypeId, $gameId = null, $matchId = null)
    {
        $user = User::findOrFail($userId);
        $user->coins_balance += $amount;
        $user->save();

        CoinTransaction::create([
            'transaction_datetime' => now(),
            'user_id' => $userId,
            'game_id' => $gameId,
            'match_id' => $matchId,
            'coin_transaction_type_id' => $transactionTypeId,
            'coins' => $amount,
        ]);
    }
}