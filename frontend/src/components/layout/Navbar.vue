<template>
  <nav class="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
    <div class="flex items-center gap-4">
      <button
        @click="$emit('toggleSidebar')"
        class="text-white text-2xl hover:text-green-200 cursor-pointer"
      >
        ☰
      </button>
      <router-link to="/" @click="handleLogoClick" class="text-xl font-bold hover:text-green-200">
        Bisca
      </router-link>
    </div>
    <div class="flex gap-4">
      <router-link to="/statistics" class="hover:text-green-200 cursor-pointer ">Estatísticas</router-link>
      <template v-if="auth.user">
        <router-link to="/profile" class="hover:text-green-200 cursor-pointer ">
          {{ auth.user.nickname }}
        </router-link>
        <button @click="logout" class="hover:text-green-200 cursor-pointer">
          Sair
        </button>
      </template>
      <template v-else>
        <router-link to="/login" class="rounded hover:text-green-200 cursor-pointer ">Entrar</router-link>
        <router-link to="/register" class="rounded hover:text-green-200 cursor-pointer ">Criar Conta</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import router from "@/router"
import { useAuthStore } from "@/stores/authStore"
import { useSocketStore } from "@/stores/socketStore"

const auth = useAuthStore()
const socket = useSocketStore()


// Define emit - THIS WAS MISSING!
const emit = defineEmits(['toggleSidebar', 'cancelGames'])

const handleLogoClick = () => {
  emit('cancelGames')
  router.push('/')
}

const logout = async () => {
  await auth.logout()
  socket.emitLeave()
  router.push('/')
}
</script>