<template>
  <form
    @submit.prevent="onSubmit"
    class="bg-white shadow-md border border-green-300 rounded-lg p-6 w-full max-w-md"
  >
    <h2 class="text-2xl font-bold text-green-700 mb-4 text-center">
      Comprar Moedas
    </h2>

    <div class="mb-3">
      <label class="block text-green-700 mb-1">Método de pagamento</label>
      <select
        v-model="form.payment_type"
        class="w-full p-2 border border-green-400 rounded"
      >
        <option value="">Selecione...</option>
        <option value="MBWAY">MBWAY</option>
        <option value="PAYPAL">PAYPAL</option>
        <option value="IBAN">IBAN</option>
        <option value="MB">MB</option>
        <option value="VISA">VISA</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="block text-green-700 mb-1">Referência</label>
      <input
        v-model="form.payment_reference"
        type="text"
        required
        :placeholder="placeholderText"
        class="w-full p-2 border border-green-400 rounded"
      />
      <p class="text-xs text-green-600 mt-1">{{ helperText }}</p>
    </div>

    <div class="mb-3">
      <label class="block text-green-700 mb-1">Valor (€)</label>
      <input
        v-model.number="form.euros"
        type="number"
        min="1"
        max="99"
        class="w-full p-2 border border-green-400 rounded"
        placeholder="Entre 1 e 99"
      />
      <p class="text-xs text-green-600 mt-1">
        Recebe {{ form.euros || 0 }} × 10 = <strong>{{ coinsToReceive }}</strong> moedas.
      </p>
    </div>

    <p v-if="error" class="text-red-600 text-sm mb-2">{{ error }}</p>



    <button
      :disabled="loading"
      class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span v-if="!loading">Confirmar Compra</span>
      <span v-else>A processar...</span>
    </button>
  </form>
</template>

<script setup>
import { reactive, computed } from "vue";

const props = defineProps({
  loading: Boolean,
  error: String,
});

const emit = defineEmits(["submit"]);

const form = reactive({
  euros: 1,
  payment_type: "",
  payment_reference: "",
});

const coinsToReceive = computed(() => (form.euros || 0) * 10);

const placeholderText = computed(() => {
  switch (form.payment_type) {
    case 'MBWAY':
      return 'Ex: 912345678'
    case 'PAYPAL':
      return 'Ex: email@exemplo.com'
    case 'IBAN':
      return 'Ex: PT50123456781234567812349'
    case 'MB':
      return 'Ex: 45634-123456789'
    case 'VISA':
      return 'Ex: 4321567812345678'
    default:
      return ''
  }
})

const helperText = computed(() => {
  switch (form.payment_type) {
    case 'MBWAY':
      return 'O número deve ter 9 dígitos e começar por 9.'
    case 'PAYPAL':
      return 'Introduza o email associado à sua conta PayPal.'
    case 'IBAN':
      return 'Deve conter 2 letras seguidas de 23 dígitos (ex: PT...).'
    case 'MB':
      return 'Formato: 5 dígitos, hífen, 9 dígitos (ex: 12345-987654321).'
    case 'VISA':
      return 'O número deve ter 16 dígitos e começar por 4.'
    default:
      return ''
  }
})

const onSubmit = () => {
  emit("submit", { ...form });
};
</script>
