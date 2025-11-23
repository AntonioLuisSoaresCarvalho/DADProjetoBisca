<template>
  <div class="flex justify-center items-center min-h-screen bg-green-50 p-4">
    <BuyCoinsForm
      :loading="coinStore.loading"
      :error="coinStore.error"
      @submit="submit"
    />
      
  </div>
</template>

<script setup>
import { useCoinStore } from "@/stores/coinStore";
import BuyCoinsForm from "@/components/coins/BuyCoinsForm.vue";
import { useRouter } from "vue-router";

const coinStore = useCoinStore();
const router = useRouter();

async function submit(formData) {
  await coinStore.buyCoins(formData)
  router.push("/coins");
}
</script>
