<template>
  <div class="p-6 bg-green-50 min-h-screen">
    <h1 class="text-3xl font-bold text-green-700 mb-6">My Coins</h1>

    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-green-300">
        <h2 class="text-xl font-semibold text-green-800 mb-2">Current Balance</h2>
        <p class="text-3xl font-bold text-green-700">
          {{ coinStore.balance }} <span class="text-base font-normal">coins</span>
        </p>
        <p class="text-sm text-green-600 mt-2">
          1€ = 10 coins
        </p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-green-300 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold text-green-800 mb-2">Buy Coins</h2>
          <p class="text-sm text-green-700">
            Add funds to your account through various payment methods.
          </p>
        </div>
        <router-link
          to="/coins/buy"
          class="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
        >
          Buy Coins
        </router-link>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-green-300 flex flex-col justify-between">
        <div>
          <h2 class="text-xl font-semibold text-green-800 mb-2">History</h2>
          <p class="text-sm text-green-700">
            Consult all coin movements in your account.
          </p>
        </div>
        <router-link
          to="/coins/history"
          class="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
        >
          View History
        </router-link>
      </div>
    </div>

    <p v-if="coinStore.loading" class="mt-4 text-green-700">Loading...</p>
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
