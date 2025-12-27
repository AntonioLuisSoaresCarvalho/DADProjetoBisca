<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Game;
use App\Models\CoinTransaction;
use App\Models\GameMatch;

class AdminController extends Controller
{
    /**
     * List all users (players and administrators)
     */
    public function listUsers(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }


        $query = User::query();

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by blocked status
        if ($request->filled('blocked')) {
            $query->where('blocked', $request->blocked);
        }

        $query->withTrashed();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nickname', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'asc')->paginate(20);

        return response()->json($users, 200);
    }

    /**
     * Block a user
     */
    public function blockUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ($user->type === 'A') {
            return response()->json([
                'message' => 'Cannot block administrators'
            ], 403);
        }

        $user->blocked = true;
        $user->save();

        return response()->json([
            'message' => 'User blocked successfully',
            'user' => $user
        ], 200);
    }

    /**
     * Unblock a user
     */
    public function unblockUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->blocked = false;
        $user->save();

        return response()->json([
            'message' => 'User unblocked successfully',
            'user' => $user
        ], 200);
    }

    /**
     * Create a new administrator
     */
    public function createAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'nickname' => 'required|string|max:50|unique:users',
            'password' => 'required|string|min:3',
            'photo_avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Handle photo/avatar upload
        $photoFilename = null;
        if ($request->hasFile('photo_avatar')) {
            $photo = $request->file('photo_avatar');
            $photoFilename = time() . '_' . $photo->getClientOriginalName();
            $photo->storeAs('public/avatars', $photoFilename);
        }

        // Create administrator
        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'nickname' => $request->nickname,
            'password' => Hash::make($request->password),
            'type' => 'A', // A = Administrator
            'photo_avatar_filename' => $photoFilename,
            'coins_balance' => 0, // Admins don't have coins
            'blocked' => false,
        ]);

        return response()->json([
            'message' => 'Administrator created successfully',
            'user' => $admin
        ], 201);
    }

    /**
     * Delete a user account
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Cannot delete own account
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Administrators cannot delete their own accounts'
            ], 403);
        }

        // Check if user has transactions or games (soft delete)
        $hasActivity = $user->transactions()->exists() || 
                       $user->games()->exists() || 
                       $user->matches()->exists();

        if ($hasActivity) {
            // Soft delete
            if (!$user->trashed()) {
                $user->delete();
            }
            $message = 'User soft-deleted (preserved for history)';
        } else {
            // Hard delete
            if ($user->photo_avatar_filename) {
                Storage::delete('public/avatars/' . $user->photo_avatar_filename);
            }
            $user->forceDelete();
            $message = 'User permanently deleted';
        }

        return response()->json([
            'message' => $message
        ], 200);
    }

    public function restoreUser(Request $request, int $id)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return response()->json([
            'message' => 'User restored successfully',
            'user' => $user
        ], 200);
    }

    /**
     * Get all games (read-only)
     */
    public function getAllGames(Request $request)
    {
        // $query = Game::with(['player1', 'player2', 'winner', 'loser', 'match']);

        $query = Game::with([
            'player1:id,nickname,name,photo_avatar_filename', 
            'player2:id,nickname,name,photo_avatar_filename', 
            'winner:id,nickname,name', 
            'loser:id,nickname,name',
            // Include match with players if game is part of a match
            'match' => function($q) {
                $q->select('id', 'type', 'player1_user_id', 'player2_user_id', 'winner_user_id', 'loser_user_id', 'status', 'stake', 'began_at', 'ended_at', 'player1_marks', 'player2_marks')
                  ->with([
                      'player1:id,nickname,name',
                      'player2:id,nickname,name',
                      'winner:id,nickname,name',
                      'loser:id,nickname,name'
                  ]);
            }
        ]);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('player1', function($subQ) use ($search) {
                    $subQ->where('nickname', 'like', "%{$search}%");
                })
                ->orWhereHas('player2', function($subQ) use ($search) {
                    $subQ->where('nickname', 'like', "%{$search}%");
                });
            });
        }

        // Filter by player
        if ($request->has('player_id')) {
            $playerId = $request->player_id;
            $query->where(function($q) use ($playerId) {
                $q->where('player1_user_id', $playerId)
                  ->orWhere('player2_user_id', $playerId);
            });
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('began_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('began_at', '<=', $request->end_date);
        }

        $games = $query->orderBy('began_at', 'desc')->paginate(50);

        return response()->json($games, 200);
    }

    public function getAllTransactions(Request $request)
    {
        $query = CoinTransaction::with([
            'user:id,nickname,name,email',
            'type:id,name,type', // Relação original
            'game:id,type,status,began_at',
            'match:id,type,status,began_at'
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('nickname', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by transaction type
        // if ($request->filled('transaction_type_id')) {
        //     $query->where('coin_transaction_type_id', $request->transaction_type_id);
        // }
        if ($request->filled('transaction_type_id')) {
            $typeFilter = $request->transaction_type_id;
            if (in_array($typeFilter, ['C', 'D'])) {
                $query->whereHas('type', function($q) use ($typeFilter) {
                    $q->where('type', $typeFilter);
                });
            } else {
                $query->where('coin_transaction_type_id', $typeFilter);
            }
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('transaction_datetime', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('transaction_datetime', '<=', $request->end_date);
        }

        $transactions = $query->orderBy('transaction_datetime', 'desc')->paginate(50);

        return response()->json($transactions, 200);
    }

    public function getStatistics(Request $request)
    {
        $stats = [
            'users' => [
                'total' => User::count(),
                'players' => User::where('type', 'P')->count(),
                'administrators' => User::where('type', 'A')->count(),
                'blocked' => User::where('blocked', true)->count(),
                'active_today' => User::where('updated_at', '>=', now()->subDay())->count(),
            ],
            'games' => [
                'total' => Game::count(),
                'today' => Game::whereDate('began_at', today())->count(),
                'this_week' => Game::where('began_at', '>=', now()->subWeek())->count(),
                'this_month' => Game::where('began_at', '>=', now()->subMonth())->count(),
                'by_type' => [
                    'bisca_3' => Game::where('type', '3')->count(),
                    'bisca_9' => Game::where('type', '9')->count(),
                ],
                'by_status' => [
                    'ended' => Game::where('status', 'Ended')->count(),
                    'playing' => Game::where('status', 'Playing')->count(),
                    'interrupted' => Game::where('status', 'Interrupted')->count(),
                ],
            ],
            'matches' => [
                'total' => GameMatch::count(),
                'today' => GameMatch::whereDate('began_at', today())->count(),
                'this_week' => GameMatch::where('began_at', '>=', now()->subWeek())->count(),
                'this_month' => GameMatch::where('began_at', '>=', now()->subMonth())->count(),
            ],
            'transactions' => [
                'total' => CoinTransaction::count(),
                'total_coins_purchased' => CoinTransaction::whereHas('type', function($q) {
                    $q->where('name', 'Coin purchase');
                })->sum('coins'),
                'total_coins_spent' => CoinTransaction::whereHas('type', function($q) {
                    $q->where('type', 'D');
                })->sum('coins'),
                'today' => CoinTransaction::whereDate('transaction_datetime', today())->count(),
                'this_week' => CoinTransaction::where('transaction_datetime', '>=', now()->subWeek())->count(),
            ],
            'coins' => [
                'total_in_circulation' => User::where('type', 'P')->sum('coins_balance'),
                'average_balance' => round(User::where('type', 'P')->avg('coins_balance'), 2),
            ],
        ];

        // Top players by coins
        $stats['top_players'] = User::where('type', 'P')
            ->orderBy('coins_balance', 'desc')
            ->limit(10)
            ->select('id', 'nickname', 'coins_balance')
            ->get();

        // Recent purchases
        $stats['recent_purchases'] = CoinTransaction::with(['user', 'type'])
            ->whereHas('type', function($q) {
                $q->where('name', 'Coin purchase');
            })
            ->orderBy('transaction_datetime', 'desc')
            ->limit(10)
            ->get();

        // Purchases by period (last 30 days)
        $purchasesByDay = CoinTransaction::whereHas('type', function($q) {
                $q->where('name', 'Coin purchase');
            })
            ->where('transaction_datetime', '>=', now()->subDays(30))
            ->selectRaw('DATE(transaction_datetime) as date, SUM(coins) as total_coins, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $stats['purchases_by_day'] = $purchasesByDay;

        // Games by day (last 30 days)
        $gamesByDay = Game::where('began_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(began_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $stats['games_by_day'] = $gamesByDay;

        return response()->json($stats, 200);
    }
}
