<template>
  <div class="container mx-auto p-4">
    <div class="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Create New Game</CardTitle>
          <p class="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <span>Your balance: <span class="font-bold">{{ userCoins }}</span></span>
            <span v-if="!hasEnoughCoins" class="text-red-500">
              (Need {{ gameCost - userCoins }} more for this game)
            </span>
            <span v-else class="text-green-500">
              Sufficient balance
            </span>
          </p>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Game Type Selection -->
          <div>
            <label class="text-sm font-medium mb-2 block">Choose Game Mode</label>
            <div class="grid grid-cols-2 gap-3">
              <Button
                v-for="type in gameStore.types_of_games"
                :key="type"
                @click="selectedType = type"
                :variant="selectedType === type ? 'default' : 'outline'"
                class="h-auto py-4 px-3">
                <span class="font-semibold text-base">Bisca of {{ type }}</span>
              </Button>
            </div>
          </div>

          <!-- Mode Selection (Game vs Match) -->
          <div>
            <label class="text-sm font-medium mb-2 block">Game Mode</label>
            <div class="grid grid-cols-2 gap-3">
              <Button
                @click="selectedMode = 'game'"
                :variant="selectedMode === 'game' ? 'default' : 'outline'"
                class="h-auto py-4 px-3">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-base">Game</span>
                  <span class="text-xs mt-1">Single match (2 coins)</span>
                </div>
              </Button>
              <Button
                @click="selectedMode = 'match'"
                :variant="selectedMode === 'match' ? 'default' : 'outline'"
                class="h-auto py-4 px-3">
                <div class="flex flex-col items-center">
                  <span class="font-semibold text-base">Match</span>
                  <span class="text-xs mt-1">First to 4 marks (stake: 3-100)</span>
                </div>
              </Button>
            </div>
          </div>

          <!-- Stake Selection (only for matches) -->
          <div v-if="selectedMode === 'match'">
            <label class="text-sm font-medium mb-2 block">
              Stake (Coins)
              <span class="text-xs text-gray-500 ml-1">min: 3, max: {{ maxStakeAllowed }}</span>
            </label>

            <!-- Range slider -->
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

            <!-- Manual input -->
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

            <!-- Payout info -->
            <div class="p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-xs text-gray-600 mb-1">Total pot</div>
                  <div class="text-2xl font-bold text-blue-700">
                    {{ selectedStake * 2 }}
                  </div>
                  <div class="text-xs text-gray-500">({{ selectedStake }} x 2 players)</div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-gray-600 mb-1">Winner receives</div>
                  <div class="text-2xl font-bold text-green-700">
                    {{ (selectedStake * 2) - 1 }}
                  </div>
                  <div class="text-xs text-gray-500">(commission: 1 coin)</div>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-blue-200 text-center">
                <div class="text-xs text-gray-600">
                  Platform commission: <span class="font-medium">1 coin</span> per match
                </div>
              </div>
            </div>

            <!-- Validation messages -->
            <div v-if="!isValidStake || selectedStake > userCoins" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start">
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
                <div class="text-sm text-amber-700">
                  <div class="font-medium">Using your entire balance</div>
                  <div>If you lose, you'll need to purchase more coins to play again.</div>
                </div>
              </div>
            </div>

            <div v-else-if="selectedStake >= userCoins * 0.7" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start">
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
            :disabled="hasWaitingGame || !hasEnoughCoins">
            {{ hasWaitingGame ? 'Waiting for opponent...' : 'Create Game' }}
          </Button>
        </CardContent>
      </Card>

      <!-- My Waiting Games -->
      <Card v-if="gameStore.myGames.filter(g => !g.complete && !g.started).length > 0" class="border-2 border-blue-500" id="my-waiting-games">
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
                <Badge variant="outline">Bisca de {{ game.game_type }}</Badge>
                <Badge :variant="game.is_match ? 'default' : 'secondary'">
                  {{ game.is_match ? 'Match' : 'Game' }}
                </Badge>
                <Badge v-if="game.is_match" variant="outline">
                  Stake: {{ game.stake }}
                </Badge>

                <!-- Show different badges based on game type and status -->
                <Badge v-if="game.is_match && game.player2_pending && game.offer_status === 'pending'"
                       variant="outline"
                       class="bg-yellow-50 border-yellow-300">
                  Player reviewing offer...
                </Badge>

                <Badge v-if="game.is_match && game.player2 && game.offer_status === 'accepted'"
                       variant="outline"
                       class="bg-green-50 border-green-300">
                  Player 2 accepted!
                </Badge>

                <Badge v-if="!game.is_match && game.player2"
                       variant="outline"
                       class="bg-green-50 border-green-300">
                  Player 2 joined!
                </Badge>
              </div>
            </div>

            <div class="flex gap-2">
              <Button @click="cancelGame(game)" variant="outline" size="sm">
                Cancel Game
              </Button>
              <Button
                v-if="(game.is_match && game.player2 && game.offer_status === 'accepted') || (!game.is_match && game.player2)"
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
                    {{ game.is_match ? 'Match' : 'Game' }}
                  </Badge>
                  <Badge v-if="game.is_match" variant="outline">
                    Stake: {{ game.stake }}
                  </Badge>

                  <!-- Show reviewing badge ONLY for matches -->
                  <Badge v-if="game.is_match && game.offer_status === 'pending' && game.player2_pending === authStore.currentUser?.id"
                         variant="outline"
                         class="bg-yellow-50 border-yellow-300">
                    You're reviewing...
                  </Badge>
                </div>
              </div>

              <!-- Review button - ONLY for matches with pending status -->
              <div v-if="game.is_match && game.player2_pending === authStore.currentUser?.id && game.offer_status === 'pending'">
                <Button @click="reviewOffer(game)" size="sm" variant="default" class="animate-pulse">
                  Review Offer
                </Button>
              </div>

              <!-- Join button - for games without player2 or pending -->
              <div v-else-if="!game.player2_pending && !game.player2">
                <Button @click="joinGame(game)" size="sm">
                  Join Game
                </Button>
              </div>

              <!-- Waiting badge -->
              <div v-else>
                <Badge variant="outline" class="bg-gray-100">
                  {{ game.is_match ? 'Another player reviewing...' : 'Player 2 joined' }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Offer Review Modal - ONLY for matches -->
    <div v-if="showOfferModal && selectedOffer && selectedOffer.is_match"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         @click.self="showOfferModal = false">
      <Card class="w-full max-w-md m-4">
        <CardHeader>
          <CardTitle>Review Match Offer</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="text-center py-4">
            <h3 class="text-2xl font-bold mb-2">Match Invitation</h3>
          </div>

          <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Game Type:</span>
              <Badge variant="outline">Bisca de {{ selectedOffer.game_type }}</Badge>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-600">Mode:</span>
              <Badge variant="default">Match (First to 4 marks)</Badge>
            </div>

            <div class="flex justify-between items-center border-t pt-3">
              <span class="text-gray-600 font-medium">Your Stake:</span>
              <span class="text-2xl font-bold text-blue-600">
                {{ selectedOffer.stake }}
              </span>
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-sm text-blue-800">
              <div class="font-medium mb-2">Match Details:</div>
              <ul class="space-y-1 text-xs">
                <li>First player to reach 4 marks wins</li>
                <li>Winner receives: <strong>{{ (selectedOffer.stake * 2) - 1 }} coins</strong></li>
                <li>Total pot: {{ selectedOffer.stake * 2 }} coins (1 coin commission)</li>
              </ul>
            </div>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <div class="text-sm text-amber-800">
                <div class="font-medium">Balance Check:</div>
                <div class="mt-1">
                  Your balance: <strong>{{ authStore.coinsBalance }} coins</strong>
                  <div v-if="authStore.hasEnoughCoins(selectedOffer.stake)"
                       class="text-green-600 font-medium mt-1">
                    Sufficient balance
                  </div>
                  <div v-else class="text-red-600 font-medium mt-1">
                    Insufficient balance - Need {{ selectedOffer.stake - authStore.coinsBalance }} more coins
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardContent class="flex gap-3 pt-0">
          <Button
            @click="rejectOffer"
            variant="outline"
            class="flex-1">
            Decline
          </Button>
          <Button
            @click="acceptOffer"
            variant="default"
            class="flex-1"
            :disabled="!authStore.hasEnoughCoins(selectedOffer.stake)">
            Accept & Join
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'vue-sonner'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const selectedType = ref(3)
const selectedMode = ref('game')
const selectedStake = ref(10)

// Modal state
const showOfferModal = ref(false)
const selectedOffer = ref(null)

const userCoins = computed(() => {
  return authStore.coinsBalance
})

const gameCost = computed(() => {
  if (selectedMode.value === 'match') {
    return selectedStake.value
  }
  return 2
})

const hasEnoughCoins = computed(() => {
  return authStore.hasEnoughCoins(gameCost.value)
})

const maxStakeAllowed = computed(() => {
  const maxByRules = 100
  const maxByBalance = userCoins.value
  return Math.min(maxByRules, maxByBalance)
})

const isValidStake = computed(() => {
  if (selectedMode.value !== 'match') return true
  return selectedStake.value >= 3 && selectedStake.value <= maxStakeAllowed.value
})

watch([userCoins, selectedMode], () => {
  if (selectedMode.value === 'match') {
    if (selectedStake.value > maxStakeAllowed.value) {
      selectedStake.value = maxStakeAllowed.value
    }
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

  if (!authStore.currentUser) {
    toast.error('You must be logged in to create a game')
    return
  }

  if (hasWaitingGame.value) {
    toast.warning('You already have a waiting game. Cancel it first.')
    return
  }

  if (!hasEnoughCoins.value) {
    toast.error(`Insufficient coins! You need ${gameCost.value} but only have ${userCoins.value}.`)
    return
  }

  if (selectedMode.value === 'match') {
    if (selectedStake.value < 3 || selectedStake.value > 100) {
      toast.error('Stake must be between 3 and 100 coins')
      return
    }

    if (selectedStake.value > userCoins.value) {
      toast.error(`Cannot stake ${selectedStake.value} coins. You only have ${userCoins.value}.`)
      return
    }

    if (selectedStake.value > maxStakeAllowed.value) {
      toast.error(`Maximum stake allowed is ${maxStakeAllowed.value} coins based on your balance`)
      return
    }
  }

  if (selectedMode.value === 'game' && userCoins.value < 2) {
    toast.error('You need at least 2 coins to create a standalone game')
    return
  }

  const gameConfig = {
    type: selectedType.value,
    mode: selectedMode.value,
    stake: selectedMode.value === 'match' ? selectedStake.value : null
  }

  try {
    const newGame = gameStore.createGame(gameConfig)
    console.log('[Lobby] New game created:', newGame)
    toast.success('Game created successfully! Waiting for opponent...')
  } catch (error) {
    console.error('[Lobby] Error creating game:', error)
    toast.error('Failed to create game')
  }
}

const refreshGamesList = () => {
  socketStore.emitGetGames()
  toast.info('Refreshing games list...')
}

const joinGame = (game) => {
  const requiredCoins = game.is_match ? game.stake : 2

  if (!authStore.hasEnoughCoins(requiredCoins)) {
    toast.error(`You need ${requiredCoins} coins to join this game. You only have ${authStore.coinsBalance}.`)
    return
  }

  socketStore.emitJoinGame(game)

  if (game.is_match) {
    toast.info('Reviewing match offer...')
  } else {
    toast.success('Joined game! Waiting for host to start...')
  }
}

// Show offer review modal (only for matches)
const reviewOffer = (game) => {
  if (!game.is_match) return
  selectedOffer.value = game
  showOfferModal.value = true
}

// Accept the offer
const acceptOffer = () => {
  if (!selectedOffer.value) return

  const requiredCoins = selectedOffer.value.stake

  if (!authStore.hasEnoughCoins(requiredCoins)) {
    toast.error('Insufficient balance to accept this offer')
    return
  }

  socketStore.emitAcceptOffer(selectedOffer.value.id)
  showOfferModal.value = false
  selectedOffer.value = null

  toast.success('Offer accepted! Waiting for host to start the game.')
}

// Reject the offer
const rejectOffer = () => {
  if (!selectedOffer.value) return

  socketStore.emitRejectOffer(selectedOffer.value.id)
  showOfferModal.value = false
  selectedOffer.value = null

  toast.info('Offer declined. Looking for other games...')
}

const startGame = (game) => {
  // For matches: check offer acceptance
  if (game.is_match && (!game.player2 || game.offer_status !== 'accepted')) {
    toast.warning('Wait for player 2 to accept the offer!')
    return
  }

  // For games: just check player2 exists
  if (!game.is_match && !game.player2) {
    toast.warning('Wait for player 2 to join!')
    return
  }

  socketStore.emitStartGame(game)
  gameStore.multiplayerGame = game
  router.push({ name: 'Multiplayer', query: { gameId: game.id } })
}

const cancelGame = (game) => {
  socketStore.cancelMatchMaking(authStore.currentUser)
  toast.info('Game cancelled')
}

onMounted(() => {
  if (authStore.currentUser && !socketStore.joined) {
    socketStore.emitJoin(authStore.currentUser)
  }

  socketStore.handleGameEvents()

  setTimeout(() => {
    socketStore.emitGetGames()
  }, 100)

  // Listen for game start from server
  socketStore.socket.on('game-started', (gameId) => {
    console.log('[Lobby] Game started by host:', gameId)
    const game = gameStore.games.find(g => g.id === gameId)
    if (game && game.player2 === authStore.currentUser?.id) {
      gameStore.multiplayerGame = game
      router.push({
        name: 'Multiplayer',
        query: { gameId }
      })
    }
  })

  // Listen for offer events with toasts
  socketStore.socket.on('offer-accepted', (data) => {
    console.log('[Lobby] Offer accepted:', data)
    toast.success('Player 2 accepted the offer! You can now start the game.')
    socketStore.emitGetGames() // Refresh to show updated state
  })

  socketStore.socket.on('offer-rejected', (data) => {
    console.log('[Lobby] Offer rejected:', data)
    const currentUser = authStore.currentUser?.id

    if (data.player2 === currentUser) {
      toast.info('You declined the offer')
    } else {
      toast.warning('Player declined your offer. Create a new game or wait for another player.')
    }
    socketStore.emitGetGames() // Refresh to show updated state
  })

  // Listen for join requests
  socketStore.socket.on('player-join-request', (data) => {
    console.log('[Lobby] Player join request:', data)
    const currentUser = authStore.currentUser?.id

    if (data.gameID) {
      const game = gameStore.games.find(g => g.id === data.gameID)
      if (game && game.creator === currentUser) {
        toast.info('A player is reviewing your match offer...')
      }
    }
    socketStore.emitGetGames() // Refresh to show pending player
  })

  // Listen for game joins
  socketStore.socket.on('player-joined', (data) => {
    console.log('[Lobby] Player joined standalone game:', data)
    const currentUser = authStore.currentUser?.id

    if (data.gameID) {
      const game = gameStore.games.find(g => g.id === data.gameID)
      if (game && game.creator === currentUser) {
        toast.success('Player 2 joined! You can start the game now.')
      }
    }
    socketStore.emitGetGames() // Refresh to show player 2
  })
})
</script>
