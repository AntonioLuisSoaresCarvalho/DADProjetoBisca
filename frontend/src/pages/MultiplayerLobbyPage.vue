<template>
  <div class="container mx-auto p-4">
    <div class="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Create New Game</CardTitle>
          <p class="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <span>Your balance: <span class="font-bold">{{ userCoins }} 💰</span></span>
            <span v-if="!hasEnoughCoins" class="text-red-500">
              (Need {{ gameCost - userCoins }} more for this game)
            </span>
            <span v-else class="text-green-500">
              ✅ Sufficient balance
            </span>
          </p>
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
                  <span class="text-xs mt-1">Uma partida única (2 coins)</span>
                </div>
              </Button>
              <Button 
                @click="selectedMode = 'match'"
                :variant="selectedMode === 'match' ? 'default' : 'outline'" 
                class="h-auto py-4 px-3">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-base">🏆 Match</span>
                  <span class="text-xs mt-1">Primeiro a 4 marcas (stake: 3-100)</span>
                </div>
              </Button>
            </div>
          </div>

          <!-- Stake Selection (only for matches) -->
          <!-- <div v-if="selectedMode === 'match'">
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
          </div> -->
          <div v-if="selectedMode === 'match'">
            <label class="text-sm font-medium mb-2 block">
              Stake (Moedas)
              <span class="text-xs text-gray-500 ml-1">min: 3, max: {{ maxStakeAllowed }}</span>
            </label>
            
            <!-- Range slider com valores pré-definidos -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Select stake:</span>
                <span class="font-bold text-blue-600">{{ selectedStake }} coins</span>
              </div>
              
              <input 
                v-model.number="selectedStake" 
                type="range"
                min="3"
                :max="maxStakeAllowed"
                step="1"
                class="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                :class="{ 'opacity-50 cursor-not-allowed': maxStakeAllowed < 3 }"
                :disabled="maxStakeAllowed < 3"
              />
              
              <div class="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>3</span>
                <span>{{ Math.round(maxStakeAllowed / 4) }}</span>
                <span>{{ Math.round(maxStakeAllowed / 2) }}</span>
                <span>{{ Math.round(maxStakeAllowed * 0.75) }}</span>
                <span>{{ maxStakeAllowed }}</span>
              </div>
            </div>

            <!-- Input numérico manual -->
            <div class="mb-4">
              <div class="text-xs text-gray-600 mb-2">Or enter custom amount:</div>
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <input 
                    v-model.number="selectedStake" 
                    type="number" 
                    min="3" 
                    :max="maxStakeAllowed"
                    class="w-full px-4 py-3 border rounded-lg text-center text-lg font-semibold"
                    :class="{
                      'border-green-500 bg-green-50': isValidStake && selectedStake <= userCoins,
                      'border-red-500 bg-red-50': !isValidStake || selectedStake > userCoins,
                      'border-gray-300': !isValidStake && selectedStake <= userCoins
                    }"
                    placeholder="Enter amount"
                    :disabled="maxStakeAllowed < 3"
                  />
                </div>
                <Button 
                  @click="selectedStake = maxStakeAllowed"
                  variant="outline"
                  size="sm"
                  class="whitespace-nowrap"
                  :disabled="maxStakeAllowed < 3"
                >
                  Max
                </Button>
              </div>
            </div>

            <!-- Informação do payout -->
            <div class="p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-xs text-gray-600 mb-1">Total pot</div>
                  <div class="text-2xl font-bold text-blue-700">
                    {{ selectedStake * 2 }}
                    <span class="text-lg">💰</span>
                  </div>
                  <div class="text-xs text-gray-500">({{ selectedStake }} × 2 players)</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-600 mb-1">Winner receives</div>
                  <div class="text-2xl font-bold text-green-700">
                    {{ (selectedStake * 2) - 1 }}
                    <span class="text-lg">💰</span>
                  </div>
                  <div class="text-xs text-gray-500">(commission: 1 coin)</div>
                </div>
              </div>
              
              <!-- Aviso de comissão -->
              <div class="mt-3 pt-3 border-t border-blue-200 text-center">
                <div class="text-xs text-gray-600">
                  Platform commission: <span class="font-medium">1 coin</span> per match
                </div>
              </div>
            </div>

            <!-- Mensagens de validação -->
            <div v-if="!isValidStake || selectedStake > userCoins" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start">
                <span class="text-red-500 mr-2 mt-0.5">⚠️</span>
                <div class="text-sm text-red-700">
                  <div v-if="selectedStake > userCoins" class="font-medium">
                    Insufficient balance for this stake
                  </div>
                  <div v-if="selectedStake < 3" class="font-medium">
                    Minimum stake is 3 coins
                  </div>
                  <div v-if="selectedStake > 100" class="font-medium">
                    Maximum stake is 100 coins
                  </div>
                  <div class="mt-1">
                    Your balance: <span class="font-bold">{{ userCoins }} coins</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="selectedStake === userCoins" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-start">
                <span class="text-amber-600 mr-2 mt-0.5">💡</span>
                <div class="text-sm text-amber-700">
                  <div class="font-medium">Using your entire balance</div>
                  <div>If you lose, you'll need to purchase more coins to play again.</div>
                </div>
              </div>
            </div>
            
            <div v-else-if="selectedStake >= userCoins * 0.7" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start">
                <span class="text-blue-600 mr-2 mt-0.5">📊</span>
                <div class="text-sm text-blue-700">
                  <div class="font-medium">High stake percentage</div>
                  <div>You're using {{ Math.round((selectedStake / userCoins) * 100) }}% of your balance</div>
                </div>
              </div>
            </div>
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
      <Card v-if="gameStore.myGames.filter(g => !g.complete && !g.started).length > 0" class="border-2 border-blue-500"  id="my-waiting-games">
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
import { ref, onMounted, computed,watch } from 'vue'
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

const userCoins = computed(() => {
  return authStore.coinsBalance // Use a função que adicionou ao authStore
})

const gameCost = computed(() => {
  if (selectedMode.value === 'match') {
    return selectedStake.value
  }
  return 2 // Custo fixo para jogo standalone
})

const hasEnoughCoins = computed(() => {
  return authStore.hasEnoughCoins(gameCost.value)
})

const maxStakeAllowed = computed(() => {
  const maxByRules = 100 // Máximo por regras do jogo
  const maxByBalance = userCoins.value // Máximo pelo saldo
  return Math.min(maxByRules, maxByBalance)
})

const isValidStake = computed(() => {
  if (selectedMode.value !== 'match') return true
  return selectedStake.value >= 3 && selectedStake.value <= maxStakeAllowed.value
})

watch([userCoins, selectedMode], () => {
  if (selectedMode.value === 'match') {
    // Se o stake atual for maior que o máximo permitido, ajustar
    if (selectedStake.value > maxStakeAllowed.value) {
      selectedStake.value = maxStakeAllowed.value
    }
    // Garantir que não fica abaixo de 3
    if (selectedStake.value < 3 && maxStakeAllowed.value >= 3) {
      selectedStake.value = 3
    }
  }
}, { immediate: true })

const hasWaitingGame = computed(() => {
  return gameStore.myGames.filter(g => !g.complete).length > 0
})

const createNewGame = () => {
  console.log('[Lobby] Create game clicked!')
  console.log('[Lobby] Selected type:', selectedType.value)
  console.log('[Lobby] Selected mode:', selectedMode.value)
  console.log('[Lobby] Selected stake:', selectedStake.value)
  console.log('[Lobby] Current myGames:', gameStore.myGames)
  console.log('[Lobby] Current user ID:', authStore.currentUser?.id)

  if (!authStore.currentUser) {
    console.log('You must be logged in to create a game')
    return
  }
  
  if (hasWaitingGame.value) {
    console.log('You already have a waiting game. Cancel it first.')
    return
  }

  if (!hasEnoughCoins.value) {
    console.log(`Insufficient coins! You need ${gameCost.value} but only have ${userCoins.value}.`)
    return
  }
  
  // 4. Validações específicas para partidas
  if (selectedMode.value === 'match') {
    if (selectedStake.value < 3 || selectedStake.value > 100) {
      console.log('Stake must be between 3 and 100 coins')
      return
    }
    
    if (selectedStake.value > userCoins.value) {
      console.log(`Cannot stake ${selectedStake.value} coins. You only have ${userCoins.value}.`)
      return
    }
    
    if (selectedStake.value > maxStakeAllowed.value) {
      console.log(`Maximum stake allowed is ${maxStakeAllowed.value} coins based on your balance`)
      return
    }
  }

  if (selectedMode.value === 'game' && userCoins.value < 2) {
    console.log('You need at least 2 coins to create a standalone game')
    return
  }
  
  const gameConfig = {
    type: selectedType.value,
    mode: selectedMode.value,
    stake: selectedMode.value === 'match' ? selectedStake.value : null
  }
  
  //gameStore.createGame(gameConfig)
  try {
    // Aguarde a criação do jogo
    const newGame = gameStore.createGame(gameConfig)
    console.log('[Lobby] New game created:', newGame)
    console.log('[Lobby] Updated myGames:', gameStore.myGames)
    
    console.log(`Game created successfully! Waiting for opponent...`)
    
  } catch (error) {
    console.error('[Lobby] Error creating game:', error)
  }
}

const refreshGamesList = () => {
  socketStore.emitGetGames()
}
const joinGame = (game) => {
  const requiredCoins = game.is_match ? game.stake : 2
  
  if (!authStore.hasEnoughCoins(requiredCoins)) {
    toast.error(`You need ${requiredCoins} coins to join this game. You only have ${authStore.coinsBalance}.`)
    return
  }
  socketStore.emitJoinGame(game)
  // Wait a bit for server to process, then check if we're player 2
  toast.info(`Joining game... ${requiredCoins} coins will be deducted when game starts.`)
  setTimeout(() => {
    const updatedGame = gameStore.games.find(g => g.id === game.id)
    if (updatedGame && updatedGame.player2 === authStore.currentUser?.id) {
      gameStore.multiplayerGame = updatedGame
      // Don't navigate yet - wait for host to start the game
      toast.success('Successfully joined the game! Waiting for host to start...')
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