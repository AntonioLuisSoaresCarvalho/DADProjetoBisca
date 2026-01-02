<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Game;
use App\Models\GameMatch;
use App\Models\CoinPurchase;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function publicStats(): JsonResponse
    {
        return response()->json([
            'totalUsers' => User::count(),
            'totalGames' => Game::count(),
            'totalFinished' => GameMatch::count(), // matches/jogos concluídos (ajustamos si tienen status)
        ]);
    }

    public function adminStats(Request $request)
    {
        // Require admin
        if (!$request->user() || $request->user()->type !== 'A') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $days = max(7, min((int) $request->query('days', 30), 365));
        $from = Carbon::now()->subDays($days - 1)->startOfDay();

        // Time-series: users by day
        $usersByDay = DB::table('users')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Time-series: games by day
        $gamesByDay = DB::table('games')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Time-series: matches by day
        $matchesByDay = DB::table('game_matches')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Breakdown: top players by number of games (adjust join column if needed)
        $topPlayers = DB::table('games')
            ->join('users', 'users.id', '=', 'games.player_id')
            ->selectRaw('users.id as user_id, users.name, users.email, COUNT(games.id) as games')
            ->where('games.created_at', '>=', $from)
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('games')
            ->limit(10)
            ->get();

        return response()->json([
            'range' => ['days' => $days, 'from' => $from->toDateString()],
            'timeSeries' => [
                'usersByDay' => $usersByDay,
                'gamesByDay' => $gamesByDay,
                'matchesByDay' => $matchesByDay,
            ],
            'breakdowns' => [
                'topPlayersByGames' => $topPlayers,
            ],
        ]);
    }
}
