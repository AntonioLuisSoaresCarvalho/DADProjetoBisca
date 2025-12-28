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

// Flag para controlar transição entre jogos
const showingGameResult = ref(false)

//const showEndModal = ref(false)
const modalTitle = ref("")
const modalText = ref("")
const modalButton = ref("OK")

const showEndModal = computed(() => {
  return gameStore.game_over && (!isMatchMode.value || matchStore.match_over)
})

// Detecta se é modo match
const isMatchMode = computed(() => route.query.mode === 'match')

// Obtém o tipo de jogo da query string (3 ou 9)
const gameType = computed(() => {
  const type = route.query.type
  return type === '3' || type === '9' ? parseInt(type) : 9
})

// Stake para matches
const matchStake = computed(() => {
  const stake = parseInt(route.query.stake) || 3
  return stake >= 3 && stake <= 100 ? stake : 3
})

// Calcula o número total de rondas baseado no tipo de jogo
const totalRounds = computed(() => gameType.value === 3 ? 20 : 20)

// Informações visuais das marcas
const marksDisplay = computed(() => {
  if (!isMatchMode.value) return null
  
  const marks1 = '●'.repeat(matchStore.player1_marks) + '○'.repeat(4 - matchStore.player1_marks)
  const marks2 = '●'.repeat(matchStore.player2_marks) + '○'.repeat(4 - matchStore.player2_marks)
  return { marks1, marks2 }
})

function handleCardPlayed(card) {
  const success = gameStore.playCard(card, 1)
  
  if (success && gameStore.turn_player === 2 && !gameStore.game_over) {
    setTimeout(() => gameStore.botPlay(), 800)
  }
}

// Watch para quando o jogo individual terminar
watch(() => gameStore.game_over, (isOver) => {
  if (isOver && isMatchMode.value && !matchStore.match_over) {
    showingGameResult.value = true
    
    // Processa o resultado do jogo no match
    const gameResult = {
      winner: gameStore.winner === 'draw' ? null : gameStore.winner,
      points_player1: gameStore.points_player1,
      points_player2: gameStore.points_player2,
      is_draw: gameStore.winner === 'draw'
    }
    
    // Delay para mostrar o resultado antes de processar
    setTimeout(() => {
      const shouldContinue = matchStore.processGameResult(gameResult)
      
      if (shouldContinue) {
        // Match continua - inicia novo jogo
        showingGameResult.value = false
        gameStore.startGame(gameType.value, 'match')
        
        // Se bot joga primeiro, trigger
        if (gameStore.turn_player === 2) {
          setTimeout(() => gameStore.botPlay(), 1000)
        }
      } else {
        // Match acabou
        showingGameResult.value = false
      }
    }, 3000) // 3 segundos para ver o resultado do jogo
  }
})

function startNewGameOrMatch() {
  if (isMatchMode.value) {
    // Reinicia o match completo
    matchStore.resetMatch()
    matchStore.startMatch(
      gameType.value,
      { id: authStore.user?.id || 1, name: authStore.user?.nickname || 'Jogador' },
      { id: 'bot', name: 'Bot' },
      matchStake.value
    )
  }
  
  // Inicia o jogo
  gameStore.startGame(gameType.value, isMatchMode.value ? 'match' : 'game')
  
  if (gameStore.turn_player === 2) {
    setTimeout(() => gameStore.botPlay(), 1000)
  }
}

onMounted(() => {
  if (isMatchMode.value) {
    // Modo Match - inicia o match
    matchStore.startMatch(
      gameType.value,
      { id: authStore.user?.id || 1, name: authStore.user?.nickname || 'Jogador' },
      { id: 'bot', name: 'Bot' },
      matchStake.value
    )
  }
  
  // Inicia o jogo com o tipo escolhido (3 ou 9 cartas)
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
          {{ isMatchMode ? 'Match SinglePlayer' : 'Jogo SinglePlayer' }} - Bisca de {{ gameType }}
        </CardTitle>
        
        <!-- INFO DO MATCH -->
        <div v-if="isMatchMode" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 mt-5">
          <div class="text-md text-center font-bold text-green-900 mb-1">
            Match - Primeiro a 4 marcas vence | Stake: {{ matchStake }} moedas
          </div>
          <div class="flex justify-between items-center text-xs text-green-800">
            <div>
              <span class="font-bold">{{ matchStore.player1_name }}:</span> 
              <span class="text-lg ml-1">{{ marksDisplay.marks1 }}</span>
              <span class="ml-2 text-gray-600">({{ matchStore.player1_total_points }} pts)</span>
            </div>
            <div class="text-center text-lg font-bold">
              Jogo {{ matchStore.current_game_number }}
            </div>
            <div class="text-right">
              <span class="font-bold">{{ matchStore.player2_name }}:</span> 
              <span class="text-lg ml-1">{{ marksDisplay.marks2 }}</span>
              <span class="ml-2 text-gray-600">({{ matchStore.player2_total_points }} pts)</span>
            </div>
          </div>
        </div>
        
        <!-- INFO DO JOGO ATUAL -->
        <div class="bg-white backdrop-blur-md rounded-xl p-4 text-center shadow-md border border-white/30 mt-5">
          <div class="text-xl font-bold mb-2">
            Ronda
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
            <span class="font-semibold">Tu:</span> {{ gameStore.points_player1 }} pontos
          </div>

          <div class="text-base text-green-900">
            <span class="font-semibold">Bot:</span> {{ gameStore.points_player2 }} pontos
          </div>

          <div class="text-sm text-green-900 mt-1">
            (Cartas na mão: {{ gameStore.hand_player1?.length || 0 }})
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
          <span class="text-xl font-semibold text-black-700">Tu</span>
        </div>
        
        <div class="flex flex-col items-center gap-2">
          <CardPlayed :card="gameStore.card_played_player2" />
          <span class="text-xl font-semibold text-red-700">Bot</span>
        </div>
      </CardContent>
      
      <CardFooter class="flex flex-col items-center justify-center gap-4">
          <CardHand
          :cards="gameStore.hand_player1"
          :disabled="gameStore.turn_player !== 1 || gameStore.game_over || showingGameResult"
          @playCard="handleCardPlayed"
        />
        
        
        <!-- Indicador de turno -->
        <div v-if="!gameStore.game_over && !showingGameResult" class="text-3xl font-bold">
          <span v-if="gameStore.turn_player === 1" class="text-black-600">
            É a tua vez!
          </span>
          <span v-else class="text-orange-600">
            Bot a jogar...
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
            🏆 VENCESTE O MATCH!
          </span>
          <span v-else class="text-red-700">
            😔 Bot venceu o Match
          </span>
        </div>

        <div class="text-lg mb-2">
          <span class="font-bold">{{ matchStore.player1_name }}:</span> {{ matchStore.player1_marks }} marcas
          <span class="mx-2">|</span>
          <span class="font-bold">{{ matchStore.player2_name }}:</span> {{ matchStore.player2_marks }} marcas
        </div>

        <div class="text-sm text-gray-600 mb-3">
          Total de pontos: {{ matchStore.player1_total_points }} - {{ matchStore.player2_total_points }}
        </div>

        <div class="text-lg font-semibold text-green-600 mb-3">
          💰 Payout: {{ matchStore.winnerPayout }} moedas
        </div>

        <details class="text-left bg-white p-3 rounded border border-gray-200 mb-3">
          <summary class="cursor-pointer font-semibold text-sm">📋 Histórico de Jogos</summary>
          <ul class="mt-2 text-xs space-y-1">
            <li v-for="game in matchStore.gamesHistory" :key="game.game_number" class="text-gray-700">
              {{ game.description }}
            </li>
          </ul>
        </details>

        <div class="flex gap-3 justify-center mt-4">
          <button
            @click="router.push('/play')"
            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
          >
            ← Voltar
          </button>

          <button
            @click="startNewGameOrMatch"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            🔄 Novo Match
          </button>
        </div>
      </div>
    </template>

    <!-- JOGO SIMPLES -->
    <template v-else>
      <div class="text-center">
        <div class="text-2xl font-bold mb-2">
          <span v-if="gameStore.winner === 'draw'" class="text-gray-700">
            🤝 Empate!
          </span>
          <span v-else-if="gameStore.winner === 1" class="text-green-700">
            🎉 Ganhaste!
          </span>
          <span v-else class="text-red-700">
            😔 O Bot ganhou!
          </span>
        </div>

        <div class="text-lg text-gray-700 mb-3">
          Tu: <span class="font-bold">{{ gameStore.points_player1 }}</span> pontos |
          Bot: <span class="font-bold">{{ gameStore.points_player2 }}</span> pontos
        </div>

        <div class="flex gap-3 justify-center mt-4">
          <button
            @click="router.push('/play')"
            class="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition cursor-pointer "
          >
            ← Voltar
          </button>

          <button
            @click="startNewGameOrMatch"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition cursor-pointer "
          >
            🔄 Jogar Novamente
          </button>
        </div>
      </div>
    </template>

  </Modal>
</template>