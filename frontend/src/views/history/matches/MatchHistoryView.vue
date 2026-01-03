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

          <!-- Button to open player selector -->
          <button
            @click="showPlayerSelector = true"
            class="flex-1 px-4 py-2 border border-green-300 rounded-lg bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-left"
          >
            {{ selectedPlayerName || 'Select a player...' }}
          </button>

          <button
            v-if="selectedPlayerId"
            @click="clearPlayerSelection"
            class="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition"
          >
            Clear
          </button>

          <button
            @click="loadMatches(1)"
            class="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
          >
            My History
          </button>
        </div>

        <p v-if="selectedPlayerName" class="mt-3 text-sm text-green-700">
          Checking history of: <strong>{{ selectedPlayerName }}</strong>
        </p>
      </div>

      <!-- PLAYER SELECTOR MODAL -->
      <div
        v-if="showPlayerSelector"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showPlayerSelector = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-green-700 text-white p-4 flex justify-between items-center">
            <h3 class="text-xl font-bold">Select Player</h3>
            <button
              @click="showPlayerSelector = false"
              class="text-white hover:text-green-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <!-- Search Bar -->
          <div class="p-4 border-b border-gray-200">
            <input
              v-model="playerSearch"
              @input="searchPlayers"
              type="text"
              placeholder="Search by nickname or name..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
            />
          </div>

          <!-- Loading State -->
          <div v-if="playersLoading" class="p-8 text-center text-green-700">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full mb-2"></div>
            <p>Loading players...</p>
          </div>

          <!-- Players List -->
          <div v-else class="overflow-y-auto max-h-96">
            <div
              v-for="player in players"
              :key="player.id"
              @click="selectPlayer(player)"
              class="p-4 hover:bg-green-50 cursor-pointer border-b border-gray-100 transition flex items-center gap-3"
              :class="{ 'bg-green-100': selectedPlayerId === player.id.toString() }"
            >
              <img
                :src="getAvatarUrl(player.photo_avatar_filename)"
                class="w-10 h-10 rounded-full border border-green-300 object-cover"
              />
              <div class="flex-1 text-green-900">
                <p class="font-semibold">{{ player.nickname }}</p>
                <p class="text-sm text-gray-600">{{ player.name }}</p>
              </div>
              <div v-if="selectedPlayerId === player.id.toString()" class="text-green-600">
                ✓
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="players.length === 0" class="p-8 text-center text-gray-500">
              No players found
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="playersPagination && playersPagination.last_page > 1"
            class="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50"
          >
            <button
              @click="loadPlayers(playersPagination.current_page - 1)"
              :disabled="playersPagination.current_page === 1"
              class="px-4 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <span class="text-sm text-gray-600">
              Page {{ playersPagination.current_page }} of {{ playersPagination.last_page }}
            </span>

            <button
              @click="loadPlayers(playersPagination.current_page + 1)"
              :disabled="playersPagination.current_page === playersPagination.last_page"
              class="px-4 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
            <button
              @click="showPlayerSelector = false"
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              v-if="selectedPlayerId"
              @click="confirmPlayerSelection"
              class="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
            >
              Confirm
            </button>
          </div>
        </div>
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
                {{ match.result === 'win' ? 'Victory' : 'Defeat' }}
              </span>
            </div>

            <span class="px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold">
              {{ match.stake }} coins
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
                <p class="text-sm opacity-70">{{ match.opponent_marks }} marks</p>
              </div>
            </div>

            <!-- MARKS -->
            <div class="flex items-center justify-center gap-6">
              <div class="text-center">
                <div class="text-4xl font-bold mb-1"
                  :class="match.result === 'loss' ? 'text-red-700' : 'text-gray-600'">
                  {{ match.opponent_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">Opponent</div>
              </div>

              <div class="text-2xl font-bold opacity-40">vs</div>

              <div class="text-center">
                <div class="text-4xl font-bold mb-1"
                  :class="match.result === 'win' ? 'text-green-700' : 'text-gray-600'">
                  {{ match.user_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">Your marks</div>
              </div>
            </div>

            <!-- META -->
            <div class="space-y-2 text-sm md:text-right">
              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Total points:</span>
                <span class="font-semibold">
                  {{ match.user_points }} - {{ match.opponent_points }}
                </span>
              </div>

              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Date:</span>
                <span>{{ formatDate(match.ended_at) }}</span>
              </div>

              <div class="flex justify-between md:justify-end gap-2">
                <span class="opacity-70">Duration:</span>
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
          Previous
        </button>

        <span class="font-semibold">
          Page {{ historyStore.matchesPagination.current_page }} of {{ historyStore.matchesPagination.last_page }}
        </span>

        <button
          @click="loadMatches(historyStore.matchesPagination.current_page + 1)"
          :disabled="historyStore.matchesPagination.current_page === historyStore.matchesPagination.last_page"
          class="px-6 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          Next
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
const playersPagination = ref(null)
const playersLoading = ref(false)
const showPlayerSelector = ref(false)
const playerSearch = ref('')
let searchTimeout = null

const isAdmin = computed(() => authStore.currentUser?.type === 'A')

onMounted(async () => {
  if (isAdmin.value) {
    await loadPlayers(1)
  }
  loadMatches(1)
})

// Load players with pagination
const loadPlayers = async (page = 1) => {
  playersLoading.value = true
  try {
    const params = {
      type: 'P',
      page: page,
      per_page: 20
    }

    // Add search if exists
    if (playerSearch.value.trim()) {
      params.search = playerSearch.value.trim()
    }

    const response = await apiStore.getUsers(params)
    players.value = response.data || []

    // Store pagination info
    playersPagination.value = {
      current_page: response.current_page,
      last_page: response.last_page,
      per_page: response.per_page,
      total: response.total
    }
  } catch (error) {
    console.error('Error loading players:', error)
  } finally {
    playersLoading.value = false
  }
}

// Search players with debounce
const searchPlayers = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadPlayers(1) // Reset to page 1 when searching
  }, 500)
}

// Select a player from the list
const selectPlayer = (player) => {
  selectedPlayerId.value = player.id.toString()
  selectedPlayerName.value = `${player.nickname} (${player.name})`
}

// Confirm player selection and close modal
const confirmPlayerSelection = () => {
  showPlayerSelector.value = false
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
