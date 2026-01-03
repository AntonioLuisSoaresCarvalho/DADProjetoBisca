<template>
  <div class="min-h-screen flex flex-col bg-green-700 relative">
    <Navbar @toggleSidebar="sidebarOpen = true" @cancelGames="handleCancelGames" />
    <Sidebar :visible="sidebarOpen" @close="sidebarOpen = false" />
    <main class="flex-1 p-4 transition-all">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import 'vue-sonner/style.css'
import Navbar from "@/components/layout/Navbar.vue"
import Sidebar from "@/components/layout/Sidebar.vue"
import Footer from "@/components/layout/Footer.vue"
import { useAuthStore } from "./stores/authStore.js"
import { useSocketStore } from "./stores/socketStore"
import { useGameStore } from "./stores/gameStore.js"

const route = useRoute()
const sidebarOpen = ref(false)
const authStore = useAuthStore()
const socketStore = useSocketStore()
const gameStore = useGameStore()

// Watch for navigation to home page and cancel games
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === '/' && authStore.currentUser) {
      handleCancelGames()
      
      // If leaving an active multiplayer game, resign
      if (oldPath?.includes('/multiplayer/game')) {
        const game = gameStore.multiplayerGame
        if (game && !game.game_over && !game.match_over) {
          console.log('[App] Leaving active game via navbar - auto-resigning')
          socketStore.emitResignGame(game.id, authStore.currentUser)
        }
      }
    }
  }
)

const handleCancelGames = () => {
  if (authStore.currentUser && gameStore.myGames.length > 0) {
    console.log('[App] Canceling all pending games on home navigation')
    socketStore.cancelMatchMaking(authStore.currentUser)
  }
}

onMounted(async () => {
  await authStore.initAuth()
  //console.log('[App] Socket injected:', socketStore.socket)
  console.log('[App] User logged in:', authStore.isLoggedIn)
  //console.log('[App] Current user:', authStore.currentUser)
  socketStore.handleConnection()
  console.log('[App] Socket connected:', socketStore.joined)
   socketStore.handleGameEvents()
  // console.log(gameStore.games)
})
</script>