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
        // Generic, anonymized platform aggregates
        return response()->json([
            'platform' => [
                'total_registered_players' => User::where('type', 'P')->whereNull('deleted_at')->count(),
                'total_games_played' => Game::whereIn('status', ['Ended', 'Interrupted'])->count(),
                'total_matches_played' => GameMatch::whereIn('status', ['Ended', 'Interrupted'])->count(),
                'games_today' => Game::whereIn('status', ['Ended', 'Interrupted'])
                    ->whereDate('ended_at', Carbon::today())
                    ->count(),
                'games_this_week' => Game::whereIn('status', ['Ended', 'Interrupted'])
                    ->whereBetween('ended_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
                    ->count(),
            ],
            'recent_activity' => $this->getRecentActivityPublic(),
        ]);
    }

    private function getRecentActivityPublic()
    {
        // Games played in last 7 days
        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = Game::whereIn('status', ['Ended', 'Interrupted'])
                ->whereDate('ended_at', $date)
                ->count();
            
            $last7Days[] = [
                'date' => $date->format('Y-m-d'),
                'games' => $count
            ];
        }
        return $last7Days;
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

        // Time-series: games by day (use ended_at for finished games)
        $gamesByDay = DB::table('games')
            ->selectRaw('DATE(ended_at) as day, COUNT(*) as total')
            ->whereIn('status', ['Ended', 'Interrupted'])
            ->whereNotNull('ended_at')
            ->where('ended_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Time-series: matches by day (table: matches)
        $matchesByDay = DB::table('matches')
            ->selectRaw('DATE(ended_at) as day, COUNT(*) as total')
            ->whereIn('status', ['Ended', 'Interrupted'])
            ->whereNotNull('ended_at')
            ->where('ended_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Breakdown: top players by number of games (count participation without duplicates using UNION ALL)
        $part1 = DB::table('games')
            ->selectRaw('player1_user_id as user_id')
            ->whereIn('status', ['Ended', 'Interrupted'])
            ->whereNotNull('ended_at')
            ->where('ended_at', '>=', $from);

        $part2 = DB::table('games')
            ->selectRaw('player2_user_id as user_id')
            ->whereIn('status', ['Ended', 'Interrupted'])
            ->whereNotNull('ended_at')
            ->where('ended_at', '>=', $from);

        $union = $part1->unionAll($part2);

        $topPlayers = DB::query()
            ->fromSub($union, 'participations')
            ->join('users', 'users.id', '=', 'participations.user_id')
            ->selectRaw('users.id as user_id, users.nickname, users.name, COUNT(*) as games')
            ->groupBy('users.id', 'users.nickname', 'users.name')
            ->orderByDesc('games')
            ->limit(10)
            ->get();

        // Purchases time-series and top purchasers
        $purchasesByDay = DB::table('coin_purchases')
            ->selectRaw('DATE(purchase_datetime) as day, COUNT(*) as count, SUM(euros) as total_euros')
            ->where('purchase_datetime', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $topPurchasers = DB::table('coin_purchases')
            ->join('users', 'users.id', '=', 'coin_purchases.user_id')
            ->selectRaw('users.id as user_id, users.nickname, users.name, COUNT(*) as purchases, SUM(euros) as total_euros')
            ->where('coin_purchases.purchase_datetime', '>=', $from)
            ->groupBy('users.id', 'users.nickname', 'users.name')
            ->orderByDesc('total_euros')
            ->limit(10)
            ->get();

        return response()->json([
            'range' => ['days' => $days, 'from' => $from->toDateString()],
            'timeSeries' => [
                'usersByDay' => $usersByDay,
                'gamesByDay' => $gamesByDay,
                'matchesByDay' => $matchesByDay,
                'purchasesByDay' => $purchasesByDay,
            ],
            'breakdowns' => [
                'topPlayersByGames' => $topPlayers,
                'topPurchasers' => $topPurchasers,
            ],
        ]);
    }
}
