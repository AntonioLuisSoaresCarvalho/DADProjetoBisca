<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CoinTransactionRequest extends FormRequest
{
    /**
     * Only administrators can create transactions directly.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->type === 'A';
    }

    /**
     * Rules for validating coin transaction requests.
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'coin_transaction_type_id' => ['required', 'exists:coin_transaction_types,id'],
            'coins' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Messages displayed when an error occurs.
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'É necessário indicar o utilizador.',
            'user_id.exists' => 'O utilizador especificado não existe.',
            'coin_transaction_type_id.required' => 'Deve indicar o tipo de transação.',
            'coin_transaction_type_id.exists' => 'O tipo de transação indicado é inválido.',
            'coins.required' => 'Deve indicar o número de moedas.',
            'coins.integer' => 'O valor das moedas deve ser um número inteiro.',
            'coins.min' => 'O número mínimo de moedas é 1.',
        ];
    }
}
