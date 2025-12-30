<template>
  <div class="min-h-screen bg-green-900 text-white py-10 px-4">

    <!-- HEADER -->
    <section class="text-center mb-12">
      <h1 class="text-4xl font-extrabold mb-3 drop-shadow">
        Match History
      </h1>
      <p class="opacity-80">
        Check match history from all users
      </p>
    </section>

    <div class="max-w-6xl mx-auto">

      <!-- ADMIN PLAYER SELECTOR -->
      <div v-if="isAdmin" class="bg-white text-green-800 p-5 rounded-lg shadow border border-green-300 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label class="font-semibold whitespace-nowrap">History: </label>
          <select
            v-model="selectedPlayerId"
            @change="onPlayerChange"
            class="flex-1 px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">My History</option>
            <option v-for="player in players" :key="player.id" :value="player.id">
              {{ player.nickname }} ({{ player.name }})
            </option>
          </select>

          <button
            v-if="selectedPlayerId"
            @click="clearPlayerSelection"
            class="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition"
          >
            Limpar
          </button>
        </div>

        <p v-if="selectedPlayerName" class="mt-3 text-sm text-green-700">
          Checking history of: <strong>{{ selectedPlayerName }}</strong>
        </p>
      </div>

      <!-- FILTERS -->
      <div class="bg-white text-green-800 p-5 rounded-lg shadow border border-green-300 mb-8">
        <div class="flex items-center gap-4">
          <label class="font-semibold">Filter by variant:</label>
          <select
            v-model="selectedType"
            @change="loadMatches(1)"
            class="px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none"
          >
            <option value="">All</option>
            <option value="3">Bisca de 3</option>
            <option value="9">Bisca de 9</option>
          </select>
        </div>
      </div>

      <!-- LOADING -->
      <div
        v-if="historyStore.matchesLoading"
        class="bg-white text-green-800 p-12 rounded-lg shadow border border-green-300 text-center"
      >
        <div class="animate-spin mb-4 inline-block w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full"></div>
        <p>Loading matches...</p>
      </div>

      <!-- ERROR -->
      <div
        v-else-if="historyStore.matchesError"
        class="bg-red-100 text-red-800 p-10 rounded-lg shadow text-center border border-red-300"
      >
        <p class="mb-4 font-semibold">{{ historyStore.matchesError }}</p>
        <button
          @click="loadMatches(1)"
          class="px-6 py-2 bg-green-700 text-white rounded-lg font-semibold shadow hover:bg-green-800 transition"
        >
          Try again
        </button>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="historyStore.matches.length === 0"
        class="bg-white text-green-800 p-12 rounded-lg shadow border border-green-300 text-center"
      >
        <div class="text-6xl mb-4">🏆</div>
        <p class="text-lg font-semibold">No matches found</p>
        <p class="opacity-70 mt-2">
          {{ selectedPlayerId ? 'This player has no history yet.' : 'Play matches to start your history!' }}
        </p>
      </div>

      <!-- MATCH LIST -->
      <div v-else class="space-y-6">

        <div
          v-for="match in historyStore.matches"
          :key="match.id"
          @click="viewMatchDetails(match.id)"
          class="bg-white text-green-900 p-6 rounded-lg shadow border border-green-300 cursor-pointer hover:shadow-lg transition"
        >
          <!-- TOP BAR -->
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-green-200">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold">{{ match.type }}</h2>

              <span
                class="px-4 py-1.5 rounded-full text-sm font-semibold"
                :class="{
                  'bg-green-600 text-white': match.result === 'win',
                  'bg-red-600 text-white': match.result === 'loss'
                }"
              >
                {{ match.result === 'win' ? 'Vitória' : 'Derrota' }}
              </span>
            </div>

            <span class="px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold">
              {{ match.stake }} moedas
            </span>
          </div>

          <!-- MATCH DETAILS -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

            <!-- OPPONENT -->
            <div class="flex items-center gap-4">
              <img
                :src="getAvatarUrl(match.opponent.photo_avatar_filename)"
                class="w-14 h-14 rounded-full border border-green-300 object-cover"
              />
              <div>
                <p class="font-semibold text-lg">{{ match.opponent.nickname }}</p>
                <p class="text-sm opacity-70">{{ match.opponent_marks }} marcas</p>
              </div>
            </div>

            <!-- MARKS -->
            <div class="flex items-center justify-center gap-6">
              <div class="text-center">
                <div class="text-4xl font-bold mb-1"
                  :class="match.result === 'loss' ? 'text-red-700' : 'text-gray-600'">
                  {{ match.opponent_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">Oponente</div>
              </div>

              <div class="text-2xl font-bold opacity-40">vs</div>

              <div class="text-center">
                <div class="text-4xl font-bold mb-1"
                  :class="match.result === 'win' ? 'text-green-700' : 'text-gray-600'">
                  {{ match.user_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">As tuas marcas</div>
              </div>         
            </div>

            <!-- META -->
            <div class="space-y-2 text-sm md:text-right">
              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Pontos totais:</span>
                <span class="font-semibold">
                  {{ match.user_points }} - {{ match.opponent_points }}
                </span>
              </div>

              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Data:</span>
                <span>{{ formatDate(match.ended_at) }}</span>
              </div>

              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Duração:</span>
                <span>{{ formatDuration(match.total_time) }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="historyStore.matchesPagination && historyStore.matchesPagination.last_page > 1"
        class="mt-10 flex items-center justify-center gap-4"
      >
        <button
          @click="loadMatches(historyStore.matchesPagination.current_page - 1)"
          :disabled="historyStore.matchesPagination.current_page === 1"
          class="px-6 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          Anterior
        </button>

        <span class="font-semibold">
          Página {{ historyStore.matchesPagination.current_page }} de {{ historyStore.matchesPagination.last_page }}
        </span>

        <button
          @click="loadMatches(historyStore.matchesPagination.current_page + 1)"
          :disabled="historyStore.matchesPagination.current_page === historyStore.matchesPagination.last_page"
          class="px-6 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          Seguinte
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/authStore'
import { useApiStore } from '@/stores/api'

const router = useRouter()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
const apiStore = useApiStore()

const selectedType = ref('')
const selectedPlayerId = ref('')
const selectedPlayerName = ref('')
const players = ref([])

const isAdmin = computed(() => authStore.currentUser?.type === 'A')

onMounted(async () => {
  if (isAdmin.value) {
    await loadPlayers()
  }
  loadMatches(1)
})

const loadPlayers = async () => {
  try {
    const response = await apiStore.getUsers({ type: 'P' })
    players.value = response.data || []
  } catch (error) {
    console.error('Error loading players:', error)
  }
}

const onPlayerChange = () => {
  if (selectedPlayerId.value) {
    const player = players.value.find(p => p.id === parseInt(selectedPlayerId.value))
    selectedPlayerName.value = player ? `${player.nickname} (${player.name})` : ''
  } else {
    selectedPlayerName.value = ''
  }
  loadMatches(1)
}

const clearPlayerSelection = () => {
  selectedPlayerId.value = ''
  selectedPlayerName.value = ''
  loadMatches(1)
}

const loadMatches = async (page = 1) => {
  const params = { page, per_page: 10 }
  if (selectedType.value) params.type = selectedType.value

  if (isAdmin.value && selectedPlayerId.value) {
    await historyStore.fetchPlayerMatches(selectedPlayerId.value, params)
  } else {
    await historyStore.fetchUserMatches(params)
  }
}

const viewMatchDetails = (matchId) => {
  const query = {};
  if (isAdmin.value && selectedPlayerId.value) {
    query.playerId = selectedPlayerId.value;
  }
  router.push({ name: 'MatchDetails', params: { id: matchId }, query });
};

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

const getAvatarUrl = (filename) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  if (!filename) return `${apiBaseUrl}/storage/photos_avatars/anonymous.png`
  return `${apiBaseUrl}/storage/photos_avatars/${filename}`
}
</script>
