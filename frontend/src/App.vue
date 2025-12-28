<template>
  <div class="min-h-screen flex flex-col bg-green-700 relative">
    <Navbar @toggleSidebar="sidebarOpen = true" />
    <Sidebar :visible="sidebarOpen" @close="sidebarOpen = false" />
    <main class="flex-1 p-4 transition-all">
      <router-view />
      <GameModeSelector /> 
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import Navbar from "@/components/layout/Navbar.vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import Footer from "@/components/layout/Footer.vue";
import GameModeSelector from "@/components/GameModeSelector.vue"
import { useAuthStore } from "./stores/authStore.js"
import { useSocketStore } from "./stores/socketStore"
import { useGameStore } from "./stores/gameStore.js";

const sidebarOpen = ref(false)

const authStore = useAuthStore()
const socketStore = useSocketStore()
const gameStore = useGameStore()

//socketStore.setSocket(socket)

onMounted(async ()=> {
  await authStore.initAuth()
  console.log('[App] Socket injected:', socketStore.socket)
  console.log('[App] User logged in:', authStore.isLoggedIn)
  console.log('[App] Current user:', authStore.currentUser)
  socketStore.handleConnection()
  console.log('[App] Socket connected:', socketStore.joined)

  socketStore.handleGameEvents()

  console.log(gameStore.games)
})

const logout = () => {
  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Sucessfull '
    },
    error: (data) => `[API] Error logging out - ${data?.response?.data?.message}`,
  })

}

</script>
