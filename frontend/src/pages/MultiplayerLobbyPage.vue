<template>
  <div class="flex justify-center items-center min-h-[60vh]">
    <Card class="w-[450px]">
      <CardHeader>
        <CardTitle class="text-center">🎮 Lobby - Bisca de {{ gameType }}</CardTitle>
      </CardHeader>
      
      <CardContent class="flex flex-col items-center gap-6 py-8">
        <!-- Animated spinner -->
        <div class="relative">
          <div class="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center text-2xl">
            🃏
          </div>
        </div>

        <!-- Status message -->
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-2">À procura de oponente...</h3>
          <p class="text-gray-600">
            Tempo de espera: <span class="font-mono font-bold">{{ formattedTime }}</span>
          </p>
          <p class="text-xs text-gray-400 mt-2">Debug: {{ waitingTime }} segundos</p>
        </div>

        <!-- Player info -->
        <div class="w-full bg-gray-50 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {{ playerInitial }}
            </div>
            <div>
              <p class="font-semibold">{{ playerName }}</p>
              <p class="text-sm text-gray-500">À espera...</p>
            </div>
          </div>
        </div>

        <!-- Opponent slot (empty) -->
        <div class="w-full bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xl">
              ?
            </div>
            <div>
              <p class="font-semibold text-gray-400">Oponente</p>
              <p class="text-sm text-gray-400">A aguardar...</p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter class="flex justify-center">
        <Button @click="cancelSearch" variant="outline">
          Cancelar
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button/Button.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const waitingTime = ref(0)
let intervalId = null

const gameType = computed(() => route.query.type || '3')

const playerName = computed(() => authStore.user?.nickname || authStore.user?.name || 'Jogador')
const playerInitial = computed(() => playerName.value.charAt(0).toUpperCase())

const formattedTime = computed(() => {
  const minutes = Math.floor(waitingTime.value / 60)
  const seconds = waitingTime.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const startTimer = () => {
  console.log('[Lobby] Starting timer')
  waitingTime.value = 0
  intervalId = setInterval(() => {
    waitingTime.value = waitingTime.value + 1
    console.log('[Lobby] Waiting time:', waitingTime.value)
  }, 1000)
}

const stopTimer = () => {
  console.log('[Lobby] Stopping timer')
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const cancelSearch = () => {
  console.log('[Lobby] Canceling search')
  stopTimer()
  router.push('/')
  // Emit cancel event to server
  if (socketStore.socket) {
    socketStore.socket.emit('cancel-matchmaking')
  }
}

onMounted(() => {
  console.log('[Lobby] Component mounted')
  
  // Start timer
  startTimer()

  // Request matchmaking
  if (socketStore.socket) {
    socketStore.socket.emit('find-match', { 
      gameType: parseInt(gameType.value),
      playerId: authStore.user?.id,
      playerName: playerName.value
    })
    console.log('[Lobby] Emitted find-match')
  } else {
    console.error('[Lobby] Socket not available')
  }

  // Listen for match found
  socketStore.socket.on('match-found', (data) => {
    console.log('[Lobby] Match found!', data)
    stopTimer()
    
    // Redirect to multiplayer game
    router.push({
      name: 'Multiplayer',
      query: {
        type: gameType.value,
        gameId: data.gameId
      }
    })
  })

  // Listen for matchmaking errors
  socketStore.socket.on('matchmaking-error', (error) => {
    console.error('[Lobby] Matchmaking error:', error)
    stopTimer()
    alert('Erro ao procurar jogo: ' + error.message)
    router.push('/')
  })
})

// Watch for route changes to cleanup if navigating away
watch(() => route.path, (newPath, oldPath) => {
  if (oldPath === '/lobby' && newPath !== '/lobby') {
    console.log('[Lobby] Route changed, cleaning up')
    stopTimer()
    if (socketStore.socket) {
      socketStore.socket.off('match-found')
      socketStore.socket.off('matchmaking-error')
      socketStore.socket.emit('cancel-matchmaking')
    }
  }
})

onUnmounted(() => {
  console.log('[Lobby] Component unmounting')
  
  // Stop timer
  stopTimer()

  // Remove socket listeners
  if (socketStore.socket) {
    socketStore.socket.off('match-found')
    socketStore.socket.off('matchmaking-error')
    
    // Cancel matchmaking if still searching
    socketStore.socket.emit('cancel-matchmaking')
  }
})
</script>