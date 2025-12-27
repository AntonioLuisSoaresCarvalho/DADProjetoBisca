<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'nickname',
        'email',
        'password',
        'type',                  
        'blocked',                
        'photo_avatar_filename',
        'coins_balance',
    ];

    
    protected $hidden = [
        'password',
        'remember_token',
        //'deleted_at',
    ];

    
    protected $casts = [
        'email_verified_at' => 'datetime',
        'blocked' => 'boolean',
        'coins_balance' => 'integer',
        'password' => 'hashed'
    ];

    
    public function transactions()
    {
        return $this->hasMany(CoinTransaction::class, 'user_id');
    }

    public function purchases()
    {
        return $this->hasMany(CoinPurchase::class, 'user_id');
    }

    public function games()
    {
        return $this->hasMany(Game::class, 'player1_user_id')
                    ->orWhere('player2_user_id', $this->id);
    }

    /**
     * Relação: partidas (matches) em que participou
     */
    public function matches()
    {
        return $this->hasMany(GameMatch::class, 'player1_user_id')
                    ->orWhere('player2_user_id', $this->id);
    }

    
    public function isAdmin()
    {
        return $this->type === 'A';
    }

    public function getAvatarUrl()
    {
        if ($this->photo_avatar_filename) {
            return url('/storage/photos_avatars/' . $this->photo_avatar_filename);
        }
            return null;
    }
}
