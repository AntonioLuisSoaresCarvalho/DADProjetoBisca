<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CoinController;
use App\Http\Controllers\CoinPurchaseController;

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

});
