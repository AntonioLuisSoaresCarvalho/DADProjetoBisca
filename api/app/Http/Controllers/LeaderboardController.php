<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Game;
use App\Models\GameMatch;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    /**
     * Personal leaderboard (only owner can see)
     */
    public function personal(Request $request)
    {
        $user = Auth::user();
        
        // Game statistics
        $gameStats = $this->calculateGameStats($user->id, $request->type);
        
        // Match statistics
        $matchStats = $this->calculateMatchStats($user->id, $request->type);
        
        return response()->json([
            'games' => $gameStats,
            'matches' => $matchStats,
        ]);
    }

    /**
     * Helper: Calculate game statistics for a user
     */
    private function calculateGameStats(int $userId, $type = null)
    {
        $query = Game::where('status', 'Ended')
            ->where(function($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                  ->orWhere('player2_user_id', $userId);
            });
        
        if ($type) {
            $query->where('type', $type);
        }

        $games = $query->get();
        
        $stats = [
            'total' => $games->count(),
            'wins' => 0,
            'losses' => 0,
            'draws' => 0,
            'capotes' => 0,
            'bandeiras' => 0,
            'total_points_scored' => 0,
            'total_points_conceded' => 0,
        ];

        foreach ($games as $game) {
            $isPlayer1 = $game->player1_user_id == $userId;
            $myPoints = $isPlayer1 ? $game->player1_points : $game->player2_points;
            $opponentPoints = $isPlayer1 ? $game->player2_points : $game->player1_points;
            
            $stats['total_points_scored'] += $myPoints;
            $stats['total_points_conceded'] += $opponentPoints;

            if ($game->is_draw) {
                $stats['draws']++;
            } elseif ($game->winner_user_id == $userId) {
                $stats['wins']++;
                
                if ($myPoints == 120) {
                    $stats['bandeiras']++;
                } elseif ($myPoints >= 91) {
                    $stats['capotes']++;
                }
            } else {
                $stats['losses']++;
            }
        }

        // Calculate win rate
        $stats['win_rate'] = $stats['total'] > 0 
            ? round(($stats['wins'] / $stats['total']) * 100, 2) 
            : 0;

        return $stats;
    }

    /**
     * Helper: Calculate match statistics for a user
     */
    private function calculateMatchStats(int $userId, $type = null)
    {
        $query = GameMatch::where('status', 'Ended')
            ->where(function($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                  ->orWhere('player2_user_id', $userId);
            });
        
        if ($type) {
            $query->where('type', $type);
        }

        $matches = $query->get();
        
        $stats = [
            'total' => $matches->count(),
            'wins' => 0,
            'losses' => 0,
            'total_marks_scored' => 0,
            'total_marks_conceded' => 0,
        ];

        foreach ($matches as $match) {
            $isPlayer1 = $match->player1_user_id == $userId;
            $myMarks = $isPlayer1 ? $match->player1_marks : $match->player2_marks;
            $opponentMarks = $isPlayer1 ? $match->player2_marks : $match->player1_marks;
            
            $stats['total_marks_scored'] += $myMarks;
            $stats['total_marks_conceded'] += $opponentMarks;

            if ($match->winner_user_id == $userId) {
                $stats['wins']++;
            } else {
                $stats['losses']++;
            }
        }

        $stats['win_rate'] = $stats['total'] > 0 
            ? round(($stats['wins'] / $stats['total']) * 100, 2) 
            : 0;

        return $stats;
    }

    /**
     * Global leaderboard - Game wins
     */
    public function globalGames(Request $request)
    {
        $type = $request->type; // '3' or '9' or null for all
        
        $query = Game::select('winner_user_id', DB::raw('COUNT(*) as wins'))
            ->where('status', 'Ended')
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id');
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $leaders = $query->orderBy('wins', 'desc')
            ->orderBy(DB::raw('MIN(ended_at)'), 'asc') // Earlier achiever ranks higher
            ->limit(100)
            ->get()
            ->map(function($item, $index) {
                $user = User::find($item->winner_user_id);
                return [
                    'rank' => $index + 1,
                    'nickname' => $user ? $user->nickname : 'Unknown',
                    'photo' => $user && $user->photo_avatar_filename 
                        ? asset('storage/photos_avatars/' . $user->photo_avatar_filename)
                        : null,
                    'wins' => $item->wins,
                ];
            });

        return response()->json($leaders);
    }

    /**
     * Global leaderboard - Match wins
     */
    public function globalMatches(Request $request)
    {
        $type = $request->type;
        
        $query = GameMatch::select('winner_user_id', DB::raw('COUNT(*) as wins'))
            ->where('status', 'Ended')
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id');
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $leaders = $query->orderBy('wins', 'desc')
            ->orderBy(DB::raw('MIN(ended_at)'), 'asc')
            ->limit(100)
            ->get()
            ->map(function($item, $index) {
                $user = User::find($item->winner_user_id);
                return [
                    'rank' => $index + 1,
                    'nickname' => $user ? $user->nickname : 'Unknown',
                    'photo' => $user ? $user->photo_avatar_filename : null,
                    'wins' => $item->wins,
                ];
            });

        return response()->json($leaders);
    }

    /**
     * Global leaderboard - Capotes
     */
    public function globalCapotes(Request $request)
    {
        $type = $request->type;
        
        $query = Game::select('winner_user_id', DB::raw('COUNT(*) as capotes'))
            ->where('status', 'Ended')
            ->whereNotNull('winner_user_id')
            ->where(function($q) {
                $q->whereRaw('(winner_user_id = player1_user_id AND player1_points >= 91 AND player1_points < 120)')
                  ->orWhereRaw('(winner_user_id = player2_user_id AND player2_points >= 91 AND player2_points < 120)');
            })
            ->groupBy('winner_user_id');
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $leaders = $query->orderBy('capotes', 'desc')
            ->orderBy(DB::raw('MIN(ended_at)'), 'asc')
            ->limit(100)
            ->get()
            ->map(function($item, $index) {
                $user = User::find($item->winner_user_id);
                return [
                    'rank' => $index + 1,
                    'nickname' => $user ? $user->nickname : 'Unknown',
                    'photo' => $user ? $user->photo_avatar_filename : null,
                    'capotes' => $item->capotes,
                ];
            });

        return response()->json($leaders);
    }

    /**
     * Global leaderboard - Bandeiras
     */
    public function globalBandeiras(Request $request)
    {
        $type = $request->type;
        
        $query = Game::select('winner_user_id', DB::raw('COUNT(*) as bandeiras'))
            ->where('status', 'Ended')
            ->whereNotNull('winner_user_id')
            ->where(function($q) {
                $q->whereRaw('(winner_user_id = player1_user_id AND player1_points = 120)')
                  ->orWhereRaw('(winner_user_id = player2_user_id AND player2_points = 120)');
            })
            ->groupBy('winner_user_id');
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $leaders = $query->orderBy('bandeiras', 'desc')
            ->orderBy(DB::raw('MIN(ended_at)'), 'asc')
            ->limit(100)
            ->get()
            ->map(function($item, $index) {
                $user = User::find($item->winner_user_id);
                return [
                    'rank' => $index + 1,
                    'nickname' => $user ? $user->nickname : 'Unknown',
                    'photo' => $user ? $user->photo_avatar_filename : null,
                    'bandeiras' => $item->bandeiras,
                ];
            });

        return response()->json($leaders);
    }

    /**
     * Admin: Get any user's personal stats
     */
    public function userStats(User $user, Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $gameStats = $this->calculateGameStats($user->id, $request->type);
        $matchStats = $this->calculateMatchStats($user->id, $request->type);
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'nickname' => $user->nickname,
                'photo' => $user->photo_avatar_filename,
            ],
            'games' => $gameStats,
            'matches' => $matchStats,
        ]);
    }
}
