<script setup>
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { onMounted, computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useMatchStore } from '@/stores/matchStore'
import { useAuthStore } from '@/stores/authStore'
import CardHand from '@/components/game/CardHand.vue'
import CardPlayed from '@/components/game/CardPlayed.vue'
import CardBack from '@/components/game/CardBack.vue'
import Modal from '@/components/Modal.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const matchStore = useMatchStore()
const authStore = useAuthStore()

// Flag to control transition between games
const showingGameResult = ref(false)

const modalTitle = ref("")
const modalText = ref("")
const modalButton = ref("OK")

const showEndModal = computed(() => {
  return gameStore.game_over && (!isMatchMode.value || matchStore.match_over)
})

// Detect if it's match mode
const isMatchMode = computed(() => route.query.mode === 'match')

// Get game type from query string (3 or 9)
const gameType = computed(() => {
  const type = route.query.type
  return type === '3' || type === '9' ? parseInt(type) : 9
})

// Stake for matches
const matchStake = computed(() => {
  const stake = parseInt(route.query.stake) || 3
  return stake >= 3 && stake <= 100 ? stake : 3
})

// Calculate total rounds based on game type
const totalRounds = computed(() => gameType.value === 3 ? 20 : 20)

// Visual information for marks
const marksDisplay = computed(() => {
  if (!isMatchMode.value) return null

  const marks1 = '●'.repeat(matchStore.player1_marks) + '○'.repeat(4 - matchStore.player1_marks)
  const marks2 = '●'.repeat(matchStore.player2_marks) + '○'.repeat(4 - matchStore.player2_marks)
  return { marks1, marks2 }
})

// Computed to check if cards should be disabled
const cardsDisabled = computed(() => {
  // Disable if: not your turn, game over, showing result, OR you've already played a card
  return gameStore.turn_player !== 1 ||
         gameStore.game_over ||
         showingGameResult.value ||
         gameStore.card_played_player1 !== null  // Already played a card this round
})

// Computed to get valid cards
const validCards = computed(() => {
  if (cardsDisabled.value) return []

  // If bot played first, get its card
  const leadCard = gameStore.card_played_player2

  // Check if function exists before calling
  if (typeof gameStore.getValidCards === 'function') {
    return gameStore.getValidCards(gameStore.hand_player1, leadCard)
  }

  // Fallback: if function doesn't exist, return all cards
  return gameStore.hand_player1 || []
})

// Computed to check if must follow suit
const mustFollowSuitNow = computed(() => {
  if (typeof gameStore.mustFollowSuit === 'function') {
    return gameStore.mustFollowSuit() && gameStore.card_played_player2 !== null
  }
  return false
})

// Function to check if specific card is valid
const isCardValid = (card) => {
  return validCards.value.some(c => c.id === card.id)
}

function handleCardPlayed(card) {
  // Extra check - don't allow if card already played
  if (gameStore.card_played_player1 !== null) {
    console.log('Already played a card this round!')
    return
  }

  // Validate if card is valid
  if (!isCardValid(card)) {
    console.log('Invalid card! Must follow suit when possible.')
    return
  }

  const success = gameStore.playCard(card, 1)

  if (success && gameStore.turn_player === 2 && !gameStore.game_over) {
    setTimeout(() => gameStore.botPlay(), 800)
  }
}

// Watch for when individual game ends
watch(() => gameStore.game_over, (isOver) => {
  if (isOver && isMatchMode.value && !matchStore.match_over) {
    showingGameResult.value = true

    // Process game result in match
    const gameResult = {
      winner: gameStore.winner === 'draw' ? null : gameStore.winner,
      points_player1: gameStore.points_player1,
      points_player2: gameStore.points_player2,
      is_draw: gameStore.winner === 'draw'
    }

    // Delay to show result before processing
    setTimeout(() => {
      const shouldContinue = matchStore.processGameResult(gameResult)

      if (shouldContinue) {
        // Match continues - start new game
        showingGameResult.value = false
        gameStore.startGame(gameType.value, 'match')

        // If bot plays first, trigger
        if (gameStore.turn_player === 2) {
          setTimeout(() => gameStore.botPlay(), 1000)
        }
      } else {
        // Match ended
        showingGameResult.value = false
      }
    }, 3000) // 3 seconds to see game result
  }
})

function startNewGameOrMatch() {

  // Start game
  gameStore.startGame(gameType.value, isMatchMode.value ? 'match' : 'game')

  if (gameStore.turn_player === 2) {
    setTimeout(() => gameStore.botPlay(), 1000)
  }
}

onMounted(() => {

  // Start game with chosen type (3 or 9 cards)
  gameStore.startGame(gameType.value, isMatchMode.value ? 'match' : 'game')

  // If bot goes first, trigger it
  if (gameStore.turn_player === 2) {
    setTimeout(() => gameStore.botPlay(), 1000)
  }
})
</script>

<template>
  <div class="flex flex-row justify-center items-stretch gap-5 mt-10">
    <Card class="gap-5 w-4/5 ">
      <CardHeader>
        <CardTitle class=" text-center font-bold text-3xl ">
          {{ isMatchMode ? 'Singleplayer Match' : 'Singleplayer Game' }} - Bisca of {{ gameType }}
        </CardTitle>

        <!-- MATCH INFO -->
        <div v-if="isMatchMode" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 mt-5">
          <div class="text-md text-center font-bold text-green-900 mb-1">
            Match - First to 4 marks wins | Stake: {{ matchStake }} coins
          </div>
          <div class="flex justify-between items-center text-xs text-green-800">
            <div>
              <span class="font-bold">You:</span>
              <span class="text-lg ml-1">{{ marksDisplay?.marks1 }}</span>
              <span class="ml-2 text-gray-600">({{ matchStore.player1_total_points }} pts)</span>
            </div>
            <div class="text-center text-lg font-bold">
              Game {{ matchStore.current_game_number }}
            </div>
            <div class="text-right">
              <span class="font-bold">Bot:</span>
              <span class="text-lg ml-1">{{ marksDisplay?.marks2 }}</span>
              <span class="ml-2 text-gray-600">({{ matchStore.player2_total_points }} pts)</span>
            </div>
          </div>
        </div>

        <!-- CURRENT GAME INFO -->
        <div class="bg-white backdrop-blur-md rounded-xl p-4 text-center shadow-md border border-white/30 mt-5">
          <div class="text-xl font-bold mb-2">
            Round
            <span :class="gameStore.current_round > 15 ? 'text-red-500' : 'text-black'">
              {{ gameStore.current_round }}
            </span>
            / {{ totalRounds }}
          </div>
          <div class="text-lg text-green-900 mb-1">
            Trump:
            <span class="font-semibold capitalize">{{ gameStore.trump_card?.suit || 'N/A' }}</span>
          </div>

          <div class="text-base text-green-900">
            <span class="font-semibold">You:</span> {{ gameStore.points_player1 }} points
          </div>

          <div class="text-base text-green-900">
            <span class="font-semibold">Bot:</span> {{ gameStore.points_player2 }} points
          </div>

          <div class="text-sm text-green-900 mt-1">
            (Cards in hand: {{ gameStore.hand_player1?.length || 0 }})
          </div>

          <!-- Follow suit warning -->
          <div v-if="mustFollowSuitNow" class="mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div class="text-sm font-bold text-yellow-800">
              You must follow suit: {{ gameStore.card_played_player2?.suit }}!
            </div>
            <div class="text-xs text-yellow-700">
              There are no more cards in the deck
            </div>
          </div>
        </div>
      </CardHeader>

      <div class="flex flex-col items-center gap-2 mb-5">
        <div class="flex gap-2">
          <CardBack
            v-for="(_, i) in gameStore.hand_player2"
            :key="i"
          />
        </div>
        <span class="text-xl font-semibold text-red-700">Bot</span>
      </div>

      <CardContent class="flex flex-row justify-center gap-20">
        <div class="flex flex-col items-center gap-2">
          <CardPlayed :card="gameStore.card_played_player1" />
          <span class="text-xl font-semibold text-black-700">You</span>
        </div>

        <div class="flex flex-col items-center gap-2">
          <CardPlayed :card="gameStore.card_played_player2" />
          <span class="text-xl font-semibold text-red-700">Bot</span>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col items-center justify-center gap-4">
        <CardHand
          :cards="gameStore.hand_player1"
          :disabled="cardsDisabled"
          :validCards="validCards"
          @playCard="handleCardPlayed"
        />

        <!-- Turn indicator -->
        <div v-if="!gameStore.game_over && !showingGameResult" class="text-3xl font-bold">
          <span v-if="gameStore.turn_player === 1 && !gameStore.card_played_player1" class="text-green-600">
            It's your turn!
          </span>
          <span v-else-if="gameStore.card_played_player1 && !gameStore.card_played_player2" class="text-blue-600">
            Waiting for Bot...
          </span>
          <span v-else class="text-orange-600">
            Bot is playing...
          </span>
        </div>
      </CardFooter>
    </Card>
  </div>

  <Modal :show="showEndModal"
         :title="modalTitle"
         :text="modalText"
         :buttonText="modalButton"
         @close="startNewGameOrMatch">

    <!-- MATCH -->
    <template v-if="isMatchMode">
      <div class="text-center">
        <div class="text-3xl font-bold mb-3">
          <span v-if="matchStore.matchWinner === 1" class="text-green-700">
            YOU WON THE MATCH!
          </span>
          <span v-else class="text-red-700">
            Bot won the Match
          </span>
        </div>

        <div class="text-lg mb-2">
          <span class="font-bold">{{ matchStore.player1_name }}:</span> {{ matchStore.player1_marks }} marks
          <span class="mx-2">|</span>
          <span class="font-bold">{{ matchStore.player2_name }}:</span> {{ matchStore.player2_marks }} marks
        </div>

        <div class="text-sm text-gray-600 mb-3">
          Total points: {{ matchStore.player1_total_points }} - {{ matchStore.player2_total_points }}
        </div>

        <div class="text-lg font-semibold text-green-600 mb-3">
          Payout: {{ matchStore.winnerPayout }} coins
        </div>

        <details class="text-left bg-white p-3 rounded border border-gray-200 mb-3">
          <summary class="cursor-pointer font-semibold text-sm">Game History</summary>
          <ul class="mt-2 text-xs space-y-1">
            <li v-for="game in matchStore.gamesHistory" :key="game.game_number" class="text-gray-700">
              {{ game.description }}
            </li>
          </ul>
        </details>

        <div class="flex gap-3 justify-center mt-4">
          <button
            @click="router.push('/')"
            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            Back
          </button>

          <button
            @click="startNewGameOrMatch"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            New Match
          </button>
        </div>
      </div>
    </template>

    <!-- SIMPLE GAME -->
    <template v-else>
      <div class="text-center">
        <div class="text-2xl font-bold mb-2">
          <span v-if="gameStore.winner === 'draw'" class="text-gray-700">
            Draw!
          </span>
          <span v-else-if="gameStore.winner === 1" class="text-green-700">
            You won!
          </span>
          <span v-else class="text-red-700">
            Bot won!
          </span>
        </div>

        <div class="text-lg text-gray-700 mb-3">
          You: <span class="font-bold">{{ gameStore.points_player1 }}</span> points |
          Bot: <span class="font-bold">{{ gameStore.points_player2 }}</span> points
        </div>

        <div class="flex gap-3 justify-center mt-4">
          <button
            @click="router.push('/')"
            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition cursor-pointer "
          >
            Back
          </button>

          <button
            @click="startNewGameOrMatch"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition cursor-pointer "
          >
            Play Again
          </button>
        </div>
      </div>
    </template>

  </Modal>
</template>
