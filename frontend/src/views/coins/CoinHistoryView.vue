<template>
  <div class="p-6 bg-green-50 min-h-screen">
    <h1 class="text-3xl font-bold text-green-700 mb-6">Histórico de Moedas</h1>

    <p v-if="coinStore.loading" class="text-green-700 mb-4">A carregar...</p>
    <p v-if="coinStore.error" class="text-red-600 mb-4">{{ coinStore.error }}</p>

    <div v-if="!coinStore.loading && coinStore.transactions.length === 0" class="text-green-700">
      Ainda não tens transações de moedas.
    </div>

    <TransactionsTable
      v-else
      :transactions="coinStore.transactions"
    />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCoinStore } from "@/stores/coinStore";
import TransactionsTable from "@/components/coins/TransactionsTable.vue";

const coinStore = useCoinStore();

onMounted(() => {
  coinStore.fetchTransactions();
});

</script>
