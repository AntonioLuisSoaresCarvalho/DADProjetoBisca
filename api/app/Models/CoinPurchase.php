<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    use HasFactory;

    protected $table = 'coin_purchases';

    public $timestamps = false;

    protected $fillable = [
        'purchase_datetime',
        'user_id',
        'coin_transaction_id',
        'euros',
        'payment_type',
        'payment_reference',
    ];

    protected $casts = [
        'purchase_datetime' => 'datetime',
    ];

    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    
    public function coinTransaction()
    {
        return $this->belongsTo(CoinTransaction::class, 'coin_transaction_id');
    }
}
