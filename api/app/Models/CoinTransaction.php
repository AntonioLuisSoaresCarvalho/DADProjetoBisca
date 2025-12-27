<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CoinTransaction extends Model
{
    use HasFactory;

    protected $table = 'coin_transactions';

    public $timestamps = false;

    protected $fillable = [
        'transaction_datetime',
        'user_id',
        'match_id',
        'game_id',
        'coin_transaction_type_id',
        'coins',
    ];

    protected $casts = [
        'transaction_datetime' => 'datetime',
    ];

    
    public function user()
    {
        return $this->belongsTo(User::class);
    }


    public function type()
    {
        return $this->belongsTo(CoinTransactionType::class, 'coin_transaction_type_id');
    }


    public function purchase()
    {
        return $this->hasOne(CoinPurchase::class, 'coin_transaction_id');
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    
    public function match()
    {
        return $this->belongsTo(GameMatch::class);
    }
}
