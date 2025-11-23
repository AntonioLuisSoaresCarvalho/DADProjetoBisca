<template>
  <transition name="slide">
    <aside
      v-if="visible && auth.user"
      class="fixed top-0 left-0 z-50 w-64 h-full bg-green-700 text-white shadow-xl p-6"
    >
      <h2 class="text-2xl font-bold mb-6">Menu</h2>

      <button
        class="absolute top-4 right-4 text-white text-xl hover:text-green-200 cursor-pointer"
        @click="$emit('close')"
      >
        ✕
      </button>

      <nav class="flex flex-col gap-4">

        <router-link
          to="/"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
          🏠 Home
        </router-link>

        <router-link
          to="/profile"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
          👤 Perfil
        </router-link>

        <router-link
          to="/coins"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
          🪙 Purchase Coins
        </router-link>

      </nav>
    </aside>
  </transition>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore";

const props = defineProps({
  visible: Boolean
});

const auth = useAuthStore();
</script>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
