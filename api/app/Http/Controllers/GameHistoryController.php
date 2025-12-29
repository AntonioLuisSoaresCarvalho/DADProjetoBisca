<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameHistoryController extends Controller
{
    /**
     * Get authenticated user's game history
     */
    public function getUserGames(Request $request)
    {
        $userId = Auth::id();

        // Query parameters for filtering
        $type = $request->query('type'); // '3' or '9'
        $perPage = $request->query('per_page', 15);

        $query = Game::where(function($q) use ($userId) {
            $q->where('player1_user_id', $userId)
              ->orWhere('player2_user_id', $userId);
        })
        ->where('status', 'Ended')
        ->with(['player1' => function($query) {
            $query->withTrashed()->select('id', 'nickname', 'photo_avatar_filename');
        },
        'player2' => function($query) {
            $query->withTrashed()->select('id', 'nickname', 'photo_avatar_filename');
        },
        'winner:id,nickname',
        'match:id,type'])
        ->orderBy('ended_at', 'desc');

        // Filter by type if specified
        if ($type && in_array($type, ['3', '9'])) {
            $query->where('type', $type);
        }

        $games = $query->paginate($perPage);

        $games->through(function ($game) use ($userId) {
            return $this->transformGameForUser($game, $userId);
        });

        return response()->json($games);
    }

    /**
     * Get authenticated user's match history
     */
    public function getUserMatches(Request $request)
    {
        $userId = Auth::id();

        $type = $request->query('type');
        $perPage = $request->query('per_page', 15);

        $query = GameMatch::where(function($q) use ($userId) {
            $q->where('player1_user_id', $userId)
              ->orWhere('player2_user_id', $userId);
        })
        ->where('status', 'Ended')
        ->with(['player1:id,nickname,photo_avatar_filename',
                'player2:id,nickname,photo_avatar_filename',
                'winner:id,nickname',
                'games' => function($q) {
                    $q->select('id', 'match_id', 'winner_user_id', 'player1_points', 'player2_points');
                }])
        ->orderBy('ended_at', 'desc');

        if ($type && in_array($type, ['3', '9'])) {
            $query->where('type', $type);
        }

        $matches = $query->paginate($perPage);

        $matches->getCollection()->transform(function ($match) use ($userId) {
            return $this->transformMatchForUser($match, $userId);
        });

        return response()->json($matches);
    }

    /**
     * Get detailed game information
     */
    public function getGameDetails(Request $request, $id)
    {
        $userId = Auth::id();
        $user = Auth::user();

        $game = Game::with([
            'player1:id,nickname,name,photo_avatar_filename',
            'player2:id,nickname,name,photo_avatar_filename',
            'winner:id,nickname',
            'loser:id,nickname',
            'match:id,type,stake'
        ])->findOrFail($id);

        // Check authorization: only participants or admins can view details
        $isParticipant = in_array($userId, [$game->player1_user_id, $game->player2_user_id]);
        $isAdmin = $user->type === 'A';

        if (!$isParticipant && !$isAdmin) {
            return response()->json([
                'message' => 'Unauthorized to view this game.'
            ], 403);
        }

        return response()->json([
            'game' => $this->transformGameForUser($game, $userId, true)
        ]);
    }

    /**
     * Get detailed match information
     */
    public function getMatchDetails(Request $request, $id)
    {
        $userId = Auth::id();
        $user = Auth::user();

        $match = GameMatch::with([
            'player1:id,nickname,name,photo_avatar_filename',
            'player2:id,nickname,name,photo_avatar_filename',
            'winner:id,nickname',
            'loser:id,nickname',
            'games' => function($q) {
                $q->with(['winner:id,nickname'])
                  ->orderBy('began_at', 'asc');
            }
        ])->findOrFail($id);

        $isParticipant = in_array($userId, [$match->player1_user_id, $match->player2_user_id]);
        $isAdmin = $user->type === 'A';

        if (!$isParticipant && !$isAdmin) {
            return response()->json([
                'message' => 'Unauthorized to view this match.'
            ], 403);
        }

        return response()->json([
            'match' => $this->transformMatchForUser($match, $userId, true)
        ]);
    }

    /**
     * Admin: Get any player's game history
     */
    public function getPlayerGames(Request $request, $userId)
    {
        if(!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }


        $type = $request->query('type');
        $perPage = $request->query('per_page', 15);

        $query = Game::where(function($q) use ($userId) {
            $q->where('player1_user_id', $userId)
              ->orWhere('player2_user_id', $userId);
        })
        ->where('status', 'Ended')
        ->with(['player1:id,nickname', 'player2:id,nickname', 'winner:id,nickname'])
        ->orderBy('ended_at', 'desc');

        if ($type && in_array($type, ['3', '9'])) {
            $query->where('type', $type);
        }

        $games = $query->paginate($perPage);

        $games->getCollection()->transform(function ($game) use ($userId) {
            return $this->transformGameForUser($game, $userId);
        });

        return response()->json($games);
    }

    /**
     * Admin: Get any player's match history
     */
    public function getPlayerMatches(Request $request, $userId)
    {
        if(!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $type = $request->query('type');
        $perPage = $request->query('per_page', 15);

        $query = GameMatch::where(function($q) use ($userId) {
            $q->where('player1_user_id', $userId)
              ->orWhere('player2_user_id', $userId);
        })
        ->where('status', 'Ended')
        ->with(['player1:id,nickname', 'player2:id,nickname', 'winner:id,nickname'])
        ->orderBy('ended_at', 'desc');

        if ($type && in_array($type, ['3', '9'])) {
            $query->where('type', $type);
        }

        $matches = $query->paginate($perPage);

        $matches->getCollection()->transform(function ($match) use ($userId) {
            return $this->transformMatchForUser($match, $userId);
        });

        return response()->json($matches);
    }

    /**
     * Transform game data from user perspective
     */
    private function transformGameForUser($game, $userId, $detailed = false)
    {
        $isPlayer1 = $game->player1_user_id === $userId;

        $result = 'loss';
        if ($game->is_draw) {
            $result = 'draw';
        } elseif ($game->winner_user_id === $userId) {
            $result = 'win';
        }

        // Determine if it was a capote or bandeira
        $gameType = null;
        $winnerPoints = $game->winner_user_id === $game->player1_user_id
            ? $game->player1_points
            : $game->player2_points;

        if ($result === 'win') {
            if ($winnerPoints === 120) {
                $gameType = 'bandeira';
            } elseif ($winnerPoints >= 91) {
                $gameType = 'capote';
            }
        }

        $transformed = [
            'id' => $game->id,
            'type' => $game->type === '3' ? 'Bisca de 3' : 'Bisca de 9',
            'opponent' => $isPlayer1 ? $game->player2 : $game->player1,
            'result' => $result,
            'game_type' => $gameType,
            'user_points' => $isPlayer1 ? $game->player1_points : $game->player2_points,
            'opponent_points' => $isPlayer1 ? $game->player2_points : $game->player1_points,
            'began_at' => $game->began_at,
            'ended_at' => $game->ended_at,
            'total_time' => $game->total_time,
            'is_part_of_match' => $game->match_id !== null,
        ];

        if ($detailed) {
            $transformed['match_info'] = $game->match;
            $transformed['status'] = $game->status;
        }

        return $transformed;
    }

    /**
     * Transform match data from user perspective
     */
    private function transformMatchForUser($match, $userId, $detailed = false)
    {
        $isPlayer1 = $match->player1_user_id === $userId;

        $result = $match->winner_user_id === $userId ? 'win' : 'loss';

        $transformed = [
            'id' => $match->id,
            'type' => $match->type === '3' ? 'Bisca de 3' : 'Bisca de 9',
            'opponent' => $isPlayer1 ? $match->player2 : $match->player1,
            'result' => $result,
            'user_marks' => $isPlayer1 ? $match->player1_marks : $match->player2_marks,
            'opponent_marks' => $isPlayer1 ? $match->player2_marks : $match->player1_marks,
            'user_points' => $isPlayer1 ? $match->player1_points : $match->player2_points,
            'opponent_points' => $isPlayer1 ? $match->player2_points : $match->player1_points,
            'stake' => $match->stake,
            'began_at' => $match->began_at,
            'ended_at' => $match->ended_at,
            'total_time' => $match->total_time,
        ];

        if ($detailed) {
            $transformed['games'] = $match->games->map(function($game) use ($userId) {
                return $this->transformGameForUser($game, $userId);
            });
            $transformed['status'] = $match->status;
        }

        return $transformed;
    }
}
