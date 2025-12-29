<?php
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CoinController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LeaderboardController;
//Game History controla a history de games e matches
use App\Http\Controllers\GameHistoryController;
use App\Http\Controllers\GameMatchController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',[AuthController::class,'show']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::put('/profile',[ProfileController::class,'update']);
    Route::delete('/profile',[ProfileController::class,'destroy']);

    Route::get('/transactions', [CoinController::class, 'index']);
    Route::get('/transactions/{transaction}', [CoinController::class, 'show']);
    Route::post('/transactions', [CoinController::class, 'store']);

    // 🔹 Compras de moedas (utilizador normal)
    Route::get('/purchases', [CoinPurchaseController::class, 'index']);
    Route::post('/purchases', [CoinPurchaseController::class, 'store']);

    Route::get('/admin/users', [AdminController::class, 'listUsers']);
    Route::post('/admin/users/{id}/block', [AdminController::class, 'blockUser']);
    Route::post('/admin/users/{id}/unblock', [AdminController::class, 'unblockUser']);
    Route::post('/admin/users', [AdminController::class, 'createAdmin']);
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
    Route::post('/admin/users/{id}/restore', [AdminController::class, 'restoreUser']);
    Route::get('/admin/transactions', [AdminController::class, 'getAllTransactions']);
    Route::get('/admin/games', [AdminController::class, 'getAllGames']);
    Route::get('/admin/statistics', [AdminController::class, 'getStatistics']);

    Route::prefix('history')->group(function () {
        // History dos games do user
        Route::get('/games', [GameHistoryController::class, 'getUserGames']);
        Route::get('/games/{id}', [GameHistoryController::class, 'getGameDetails']);

        // History dos matches do user
        Route::get('/matches', [GameHistoryController::class, 'getUserMatches']);
        Route::get('/matches/{id}', [GameHistoryController::class, 'getMatchDetails']);
    });

    Route::post('/games', [GameMatchController::class, 'storeGame']);
    Route::put('/games/{id}', [GameMatchController::class, 'updateGame']);
    Route::post('/matches', [GameMatchController::class, 'storeMatch']);
    Route::put('/matches/{id}', [GameMatchController::class, 'updateMatch']);

    // Game/Match History só do admin
    Route::get('/admin/history/games/{userId}', [GameHistoryController::class, 'getPlayerGames']);
    Route::get('/admin/history/matches/{userId}', [GameHistoryController::class, 'getPlayerMatches']);

    // Detailed Game/Match History, o admin tem acesso a todos
    Route::get('/admin/games/{id}', [GameHistoryController::class, 'getGameDetails']);
    Route::get('/admin/matches/{id}', [GameHistoryController::class, 'getMatchDetails']);

    Route::get('/users/{id}', [AuthController::class, 'getUserById']);

    Route::get('/leaderboards/personal', [LeaderboardController::class, 'personal']);
    Route::get('/admin/users/{user}/leaderboards', [LeaderboardController::class, 'userStats']);

    Route::get('/leaderboards/global/games', [LeaderboardController::class, 'globalGames']);
    Route::get('/leaderboards/global/matches', [LeaderboardController::class, 'globalMatches']);
    Route::get('/leaderboards/global/capotes', [LeaderboardController::class, 'globalCapotes']);
    Route::get('/leaderboards/global/bandeiras', [LeaderboardController::class, 'globalBandeiras']);

});
