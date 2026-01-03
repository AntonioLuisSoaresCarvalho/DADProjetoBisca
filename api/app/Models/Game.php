<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Game extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'match_id',
        'status',
        'is_draw',
        'began_at',
        'ended_at',
        'total_time',
        'player1_points',
        'player2_points',
    ];

    protected $casts = [
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_draw' => 'boolean',
    ];

    //Relações
    public function match()
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function loser()
    {
        return $this->belongsTo(User::class, 'loser_user_id');
    }
}
