<template>
  <div class="p-6 bg-green-50 min-h-screen">
    <h1 class="text-3xl font-bold text-green-700 mb-6">As Minhas Moedas</h1>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-green-300">
        <h2 class="text-xl font-semibold text-green-800 mb-2">Saldo atual</h2>
        <p class="text-3xl font-bold text-green-700">
          {{ coinStore.balance }} <span class="text-base font-normal">moedas</span>
        </p>
        <p class="text-sm text-green-600 mt-2">
          1€ = 10 moedas
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-green-300 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold text-green-800 mb-2">Comprar moedas</h2>
          <p class="text-sm text-green-700">
            Adiciona saldo à tua conta através de vários métodos de pagamento.
          </p>
        </div>
        <router-link
          to="/coins/buy"
          class="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
        >
          Comprar moedas
        </router-link>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-green-300 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold text-green-800 mb-2">Histórico</h2>
          <p class="text-sm text-green-700">
            Consulta todos os movimentos de moedas da tua conta.
          </p>
        </div>
        <router-link
          to="/coins/history"
          class="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
        >
          Ver histórico
        </router-link>
      </div>
    </div>

    <p v-if="coinStore.loading" class="mt-4 text-green-700">A carregar...</p>
    <p v-if="coinStore.error" class="mt-2 text-red-600">{{ coinStore.error }}</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCoinStore } from "@/stores/coinStore";

const coinStore = useCoinStore();

onMounted(() => {
  coinStore.balance;
});
</script>
