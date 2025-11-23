<?php

namespace App\Http\Controllers;

use App\Http\Requests\CoinTransactionRequest;
use App\Http\Resources\CoinTransactionResource;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CoinController extends Controller
{
    /**
     * Show authenticated user's transacitons 
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = CoinTransaction::with('type')
            ->where('user_id', $user->id)
            ->orderByDesc('transaction_datetime')
            ->paginate(10);

        return CoinTransactionResource::collection($transactions);
    }

    /**
     * Show a specific transaction
     */
    public function show(Request $request, CoinTransaction $transaction)
    {
        $user = $request->user();

        if ($transaction->user_id !== $user->id && $user->type !== 'A') {
            return response()->json(['message' => 'Acesso negado.'], 403);
        }

        return new CoinTransactionResource($transaction->load('type'));
    }

    /**
     * Create a new transaction
     */
    public function store(CoinTransactionRequest $request)
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated) {
            $user = User::findOrFail($validated['user_id']);

            // Cria a transação
            $transaction = CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => $validated['coin_transaction_type_id'],
                'coins' => $validated['coins'],
            ]);

            // Atualiza o saldo do utilizador
            $type = $transaction->type->type; // 'C' ou 'D'
            if ($type === 'C') {
                $user->increment('coins_balance', $transaction->coins);
            } else {
                $user->decrement('coins_balance', $transaction->coins);
            }

            return new CoinTransactionResource($transaction->load('type'));
        });
    }
}
