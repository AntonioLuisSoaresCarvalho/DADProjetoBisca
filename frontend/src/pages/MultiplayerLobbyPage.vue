<template>
  <div class="container mx-auto p-4">
    <div class="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Create New Game</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Game Type Selection -->
          <div>
            <label class="text-sm font-medium mb-2 block">Escolher Tipo de Jogo</label>
            <div class="grid grid-cols-2 gap-3">
              <Button 
                v-for="type in gameStore.types_of_games" 
                :key="type" 
                @click="selectedType = type"
                :variant="selectedType === type ? 'default' : 'outline'" 
                class="h-auto py-4 px-3">
                <span class="font-semibold text-base">Bisca de {{ type }}</span>
              </Button>
            </div>
          </div>

          <!-- Mode Selection (Game vs Match) -->
          <div>
            <label class="text-sm font-medium mb-2 block">Modo de Jogo</label>
            <div class="grid grid-cols-2 gap-3">
              <Button 
                @click="selectedMode = 'game'"
                :variant="selectedMode === 'game' ? 'default' : 'outline'" 
                class="h-auto py-4 px-3">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-base">🎮 Jogo</span>
                  <span class="text-xs mt-1">Uma partida única</span>
                </div>
              </Button>
              <Button 
                @click="selectedMode = 'match'"
                :variant="selectedMode === 'match' ? 'default' : 'outline'" 
                class="h-auto py-4 px-3">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-base">🏆 Match</span>
                  <span class="text-xs mt-1">Primeiro a 4 marcas</span>
                </div>
              </Button>
            </div>
          </div>

          <!-- Stake Selection (only for matches) -->
          <div v-if="selectedMode === 'match'">
            <label class="text-sm font-medium mb-2 block">Stake (Moedas)</label>
            <input 
              v-model.number="selectedStake" 
              type="number" 
              min="3" 
              max="100" 
              class="w-full px-3 py-2 border rounded-md"
              placeholder="Entre 3 e 100"
            />
            <p class="text-xs text-gray-500 mt-1">
              Vencedor recebe: {{ (selectedStake * 2) - 1 }} moedas (comissão: 1 moeda)
            </p>
          </div>

          <Button 
            @click="createNewGame" 
            class="w-full" 
            :disabled="hasWaitingGame">
            {{ hasWaitingGame ? 'Waiting for opponent...' : 'Create Game' }}
          </Button>
        </CardContent>
      </Card>

      <!-- My Waiting Games -->
      <Card v-if="gameStore.myGames.filter(g => !g.complete && !g.started).length > 0" class="border-2 border-blue-500">
        <CardHeader>
          <CardTitle class="text-lg">Waiting for Opponent...</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div 
            class="bg-blue-50 p-4 rounded-lg flex items-center justify-between" 
            v-for="game in gameStore.myGames.filter(g => !g.complete && !g.started)"
            :key="game.id">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <div class="animate-pulse text-3xl">⏳</div>
                <Badge variant="outline">Bisca de {{ game.game_type }}</Badge>
                <Badge :variant="game.is_match ? 'default' : 'secondary'">
                  {{ game.is_match ? '🏆 Match' : '🎮 Game' }}
                </Badge>
                <Badge v-if="game.is_match" variant="outline">
                  Stake: {{ game.stake }} 💰
                </Badge>
                <Badge v-if="game.player2" variant="outline" class="bg-green-50">
                  Player 2 joined!
                </Badge>
              </div>
            </div>

            <div class="flex gap-2">
              <Button @click="cancelGame(game)" variant="outline" size="sm">
                Cancel Game
              </Button>
              <Button 
                v-if="game.player2 && game.creator === authStore.currentUser?.id" 
                @click="startGame(game)"
                variant="default" 
                size="sm">
                Start Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Available Games -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">
            Available Games ({{ gameStore.availableGames.length }})
            <Button @click="refreshGamesList" variant="outline" size="sm">Refresh</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="gameStore.availableGames.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🎮</div>
            <p>No games available</p>
            <p class="text-sm mt-1">Create a new game to get started!</p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="game in gameStore.availableGames" 
              :key="game.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">Game #{{ game.id }}</span>
                  <Badge variant="outline">Bisca de {{ game.game_type }}</Badge>
                  <Badge :variant="game.is_match ? 'default' : 'secondary'">
                    {{ game.is_match ? '🏆 Match' : '🎮 Game' }}
                  </Badge>
                  <Badge v-if="game.is_match" variant="outline">
                    Stake: {{ game.stake }} 💰
                  </Badge>
                </div>
              </div>
              <Button @click="joinGame(game)" size="sm">
                Join Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const selectedType = ref(3)
const selectedMode = ref('game')
const selectedStake = ref(10)

const hasWaitingGame = computed(() => {
  return gameStore.myGames.filter(g => !g.complete).length > 0
})

const createNewGame = () => {
  console.log('[Lobby] Create game clicked!')
  console.log('[Lobby] Selected type:', selectedType.value)
  console.log('[Lobby] Selected mode:', selectedMode.value)
  console.log('[Lobby] Selected stake:', selectedStake.value)
  
  if (hasWaitingGame.value) return
  
  const gameConfig = {
    type: selectedType.value,
    mode: selectedMode.value,
    stake: selectedMode.value === 'match' ? selectedStake.value : null
  }
  
  gameStore.createGame(gameConfig)
}

const refreshGamesList = () => {
  socketStore.emitGetGames()
}

const joinGame = (game) => {
  socketStore.emitJoinGame(game)
  // Wait a bit for server to process, then check if we're player 2
  setTimeout(() => {
    const updatedGame = gameStore.games.find(g => g.id === game.id)
    if (updatedGame && updatedGame.player2 === authStore.currentUser?.id) {
      gameStore.multiplayerGame = updatedGame
      // Don't navigate yet - wait for host to start the game
    }
  }, 500)
}

const startGame = (game) => {
  socketStore.emitStartGame(game)
  gameStore.multiplayerGame = game
  router.push({ name: 'Multiplayer', query: { gameId: game.id } })
}

const cancelGame = (game) => {
  socketStore.cancelMatchMaking(authStore.currentUser)
}

onMounted(() => {
  // Make sure user is joined to the server first
  if (authStore.currentUser && !socketStore.joined) {
    socketStore.emitJoin(authStore.currentUser)
  }
  
  // Small delay to ensure join is processed
  setTimeout(() => {
    socketStore.emitGetGames()
  }, 100)

  // Listen for game start from server
  socketStore.socket.on('game-started', (gameId) => {
    console.log('[Lobby] Game started by host:', gameId)
    const game = gameStore.games.find(g => g.id === gameId)
    if (game && game.player2 === authStore.currentUser?.id) {
      // Player 2 auto-navigates when host starts
      gameStore.multiplayerGame = game
      router.push({
        name: 'Multiplayer',
        query: { gameId }
      })
    }
  })
})
</script>