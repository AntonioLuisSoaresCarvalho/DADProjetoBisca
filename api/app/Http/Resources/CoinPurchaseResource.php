<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoinPurchaseResource extends JsonResource
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
            'euros' => $this->euros,
            'coins' => $this->coins,
            'payment_type' => $this->payment_type,
            'payment_reference' => $this->payment_reference,
            'user' => new UserResource($this->whenLoaded('user')),
            'purchase_datetime' => $this->purchase_datetime?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
