<template>
  <transition name="slide">
    <aside
      v-if="visible"
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
          to="/admin"
          v-if="auth.isAdmin"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
         🛡️ Admin Panel
        </router-link>

        <!-- Dropdown History -->
        <div class="dropdown-sidebar">
          <button
            @click="toggleHistoryDropdown"
            class="flex items-center justify-between w-full px-2 py-2 rounded hover:bg-green-600 text-left"
          >
            <span>📊 History</span>
            <span :class="['transform transition-transform', historyOpen ? 'rotate-180' : '']">▼</span>
          </button>

          <div v-if="historyOpen" class="dropdown-content-sidebar ml-4 mt-2 flex flex-col gap-2">
            <router-link
              to="/history/games"
              @click="closeSidebar"
              class="px-2 py-2 rounded hover:bg-green-600 text-sm"
            >
              Game History
            </router-link>
            <router-link
              to="/history/matches"
              @click="closeSidebar"
              class="px-2 py-2 rounded hover:bg-green-600 text-sm"
            >
              Match History
            </router-link>
          </div>
        </div>

        <router-link
          to="/leaderboard"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
          🏆 Leaderboard
        </router-link>


        <router-link
          to="/play"
          @click="$emit('close')"
          class="px-2 py-2 rounded hover:bg-green-600"
        >
          🎮 Jogar
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
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";

const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['close']);

const auth = useAuthStore();
const historyOpen = ref(false);

const toggleHistoryDropdown = () => {
  historyOpen.value = !historyOpen.value;
};

const closeSidebar = () => {
  historyOpen.value = false;
  emit('close');
};
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

.dropdown-content-sidebar {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
