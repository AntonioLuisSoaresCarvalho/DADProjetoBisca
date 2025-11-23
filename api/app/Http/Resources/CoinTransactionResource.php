<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoinTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_datetime' => $this->transaction_datetime->format('Y-m-d H:i:s'),
            'user' => [
                'id' => $this->user->id,
                'nickname' => $this->user->nickname,
            ],
            'type' => [
                'id' => $this->type->id,
                'name' => $this->type->name,
                'operation' => $this->type->type, // 'C' ou 'D'
            ],
            'coins' => $this->coins,
            'custom' => $this->custom,
            'game_id' => $this->game_id,
            'match_id' => $this->match_id,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
