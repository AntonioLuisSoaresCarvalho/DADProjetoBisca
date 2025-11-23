<?php

namespace App\Http\Controllers;

use App\Http\Requests\CoinPurchaseRequest;
use App\Http\Resources\CoinPurchaseResource;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Support\Facades\DB;

class CoinPurchaseController extends Controller
{
    /**
     * List all of purchases of an authenticated user.
     */
    public function index()
    {
        $user = auth()->user();

        $purchases = CoinPurchase::with(['coinTransaction'])
            ->where('user_id', $user->id)
            ->orderByDesc('purchase_datetime')
            ->paginate(10);

        return CoinPurchaseResource::collection($purchases);
    }

    /**
     * Regist a new coin purchase.
     * Also creates an associated credit transaction.
     */
    public function store(CoinPurchaseRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        return DB::transaction(function () use ($validated, $user) {
            
            $coins = $validated['euros'] * 10;

            $type = CoinTransactionType::where('name', 'Coin purchase')->first();
            
            $transaction = CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => $type->id,
                'coins' => $coins,
            ]);
            
            $purchase = CoinPurchase::create([
                'purchase_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros' => $validated['euros'],
                'payment_type' => strtoupper($validated['payment_type']),
                'payment_reference' => $validated['payment_reference'],
            ]);

            
            $user->increment('coins_balance', $coins);

            return new CoinPurchaseResource($purchase->load(['coinTransaction']));
        });
    }
}
