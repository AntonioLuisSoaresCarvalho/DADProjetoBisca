<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CoinPurchaseRequest extends FormRequest
{
    /**
     * Only authenticated users can purchase coins.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->type === 'P';
    }

    /**
     * Rules for validating coin purchase requests.
     */
    public function rules(): array
    {
        return [
            'euros' => ['required', 'integer', 'min:1', 'max:99'],
            'payment_type' => [
                'required',
                Rule::in(['MBWAY', 'PAYPAL', 'IBAN', 'MB', 'VISA']),
            ],
            'payment_reference' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Specific validation after basic rules.
     */
    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $type = strtoupper($this->input('payment_type'));
            $reference = trim($this->input('payment_reference'));

            switch ($type) {
                case 'MBWAY':
                    // 9 digits starting with 9
                    if (!preg_match('/^9\d{8}$/', $reference)) {
                        $validator->errors()->add('payment_reference', 'Número MBWAY inválido (deve ter 9 dígitos e começar por 9).');
                    }
                    break;

                case 'PAYPAL':
                    // Valid email
                    if (!filter_var($reference, FILTER_VALIDATE_EMAIL)) {
                        $validator->errors()->add('payment_reference', 'Endereço de email PayPal inválido.');
                    }
                    break;

                case 'IBAN':
                    // 2 letters + 23 digits
                    if (!preg_match('/^[A-Z]{2}\d{23}$/', strtoupper($reference))) {
                        $validator->errors()->add('payment_reference', 'IBAN inválido (deve ter 2 letras seguidas de 23 dígitos).');
                    }
                    break;

                case 'MB':
                    // 5 digits, hifen, 9 digits
                    if (!preg_match('/^\d{5}-\d{9}$/', $reference)) {
                        $validator->errors()->add('payment_reference', 'Referência MB inválida (formato: 5 dígitos, "-", e 9 dígitos).');
                    }
                    break;

                case 'VISA':
                    // 16 digits starting with 4
                    if (!preg_match('/^4\d{15}$/', $reference)) {
                        $validator->errors()->add('payment_reference', 'Número VISA inválido (deve ter 16 dígitos e começar por 4).');
                    }
                    break;
            }
        });
    }

    /**
     * Messages displayed when an error occurs.
     */
    public function messages(): array
    {
        return [
            'euros.required' => 'É necessário indicar o valor em euros.',
            'euros.integer' => 'O valor deve ser um número inteiro.',
            'euros.min' => 'O valor mínimo de compra é 1€.',
            'euros.max' => 'O valor máximo de compra é 99€.',
            'payment_type.required' => 'Deve indicar o método de pagamento.',
            'payment_type.in' => 'O método de pagamento indicado é inválido.',
            'payment_reference.required' => 'É necessária uma referência de pagamento.',
        ];
    }
}
