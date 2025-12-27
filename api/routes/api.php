<?php
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CoinController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\AdminController;

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

});
