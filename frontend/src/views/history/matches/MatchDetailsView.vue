<template>
  <div class="min-h-screen bg-green-900 py-12 px-4">
    <div class="max-w-5xl mx-auto">

      <!-- Loading -->
      <div
        v-if="historyStore.matchesLoading"
        class="bg-white border border-green-300 rounded-2xl p-12 text-center shadow-lg"
      >
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p class="text-green-800 font-semibold text-lg">Loading match details...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="historyStore.matchesError"
        class="bg-red-50 border border-red-300 rounded-2xl p-8 text-center shadow-lg"
      >
        <p class="text-red-700 font-semibold mb-4">{{ historyStore.matchesError }}</p>

        <div class="flex gap-4 justify-center">
          <button
            @click="loadMatch"
            class="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Retry
          </button>
          <button
            @click="goBack"
            class="px-6 py-3 bg-white text-green-700 font-semibold border border-green-300 rounded-xl hover:bg-green-50 transition"
          >
            Go Back
          </button>
        </div>
      </div>

      <!-- Match Details -->
      <div v-else-if="match">

        <!-- Back btn -->
        <button
          @click="goBack"
          class="mb-6 px-5 py-2 bg-white border border-green-300 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <!-- Admin viewing indicator -->
        <div v-if="viewingAsAdmin && perspectivePlayer" class="mb-6 bg-blue-100 border border-blue-300 rounded-xl p-4">
          <p class="text-blue-800 font-semibold">
            👤 Viewing as: <strong>{{ perspectivePlayer.nickname }}</strong> ({{ perspectivePlayer.name }})
          </p>
        </div>

        <!-- Header -->
        <h1 class="text-4xl font-extrabold text-white mb-8">Match Details</h1>

        <!-- Result Banner -->
        <div
          class="rounded-2xl p-10 text-center mb-10 shadow-xl border-2"
          :class="{
            'bg-white border-green-300': match.result === 'win',
            'bg-white border-red-300': match.result === 'loss',
            'bg-white border-gray-300': match.result === 'draw'
          }"
        >
          <div class="text-7xl mb-4">
            {{ match.result === 'win' ? '🏆' : match.result === 'draw' ? '🤝' : '😞' }}
          </div>

          <div class="text-4xl font-extrabold text-green-800 mb-2">
            {{
              match.result === 'win'
                ? 'Victory!'
                : match.result === 'draw'
                ? 'Draw'
                : 'Defeat'
            }}
          </div>

          <div
            v-if="match.match_type"
            class="inline-block mt-4 px-5 py-2 bg-green-100 border border-green-300 rounded-full text-green-800 font-bold uppercase tracking-wide"
          >
            {{ match.match_type }}
          </div>
        </div>

        <!-- Main Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

          <!-- Match Information -->
          <div class="bg-white border border-green-300 rounded-2xl p-8 shadow-lg">
            <h3 class="text-2xl font-extrabold text-green-900 mb-6">Match Information</h3>

            <div class="space-y-4 text-green-800 font-medium">
              <div class="flex justify-between py-2">
                <span class="font-semibold">Type:</span>
                <span>{{ match.type }}</span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-semibold">Stake:</span>
                <span class="font-bold text-orange-600">{{ match.stake }} coins</span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-semibold">Status:</span>
                <span
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                  :class="{
                    'bg-green-200 text-green-900': match.status === 'Ended',
                    'bg-red-200 text-red-900': match.status === 'Interrupted'
                  }"
                >
                  {{ match.status }}
                </span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-semibold">Started:</span>
                <span>{{ formatDate(match.began_at) }}</span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-semibold">Ended:</span>
                <span>{{ formatDate(match.ended_at) }}</span>
              </div>

              <div class="flex justify-between py-2">
                <span class="font-semibold">Duration:</span>
                <span>{{ formatDuration(match.total_time) }}</span>
              </div>

              <!-- Games inside the match -->
              <div v-if="match.games && match.games.length > 0" class="pt-5 mt-5 border-t border-green-200">
                <h4 class="text-lg font-bold mb-3 text-green-900">Games in this Match</h4>

                <div class="space-y-3">
                  <div
                    v-for="g in match.games"
                    :key="g.id"
                    class="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl hover:bg-green-100 transition"
                  >
                    <div class="flex items-center gap-3">
                      <span class="font-semibold text-green-900">Game #{{ g.id }}</span>
                      <span
                        class="px-2 py-1 text-xs font-semibold rounded-full"
                        :class="{
                          'bg-green-200 text-green-900': g.result === 'win',
                          'bg-red-200 text-red-900': g.result === 'loss',
                          'bg-gray-200 text-gray-800': g.result === 'draw'
                        }"
                      >
                        {{ formatResult(g.result) }}
                      </span>
                    </div>

                    <button
                      @click="viewGameDetails(g.id)"
                      class="text-green-700 font-semibold hover:underline"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Match Score -->
          <div class="bg-white border border-green-300 rounded-2xl p-8 shadow-lg">
            <h3 class="text-2xl font-extrabold text-green-900 mb-6">Players & Marks</h3>

            <!-- Perspective Player -->
            <div class="p-5 bg-green-100 border border-green-300 rounded-xl mb-6">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-4">
                  <img
                    :src="getAvatarUrl(perspectivePlayer?.photo_avatar_filename)"
                    class="w-16 h-16 rounded-full border-4 border-green-300 object-cover"
                  />
                  <div>
                    <div class="font-bold text-green-900 text-lg">{{ perspectivePlayer?.nickname }}</div>
                    <div class="text-sm text-green-700">{{ viewingAsAdmin ? 'Player' : 'You' }}</div>
                  </div>
                </div>

                <div class="text-5xl font-extrabold text-green-700">
                  {{ match.user_marks }}
                </div>
              </div>

              <div class="text-sm text-green-700 mt-2 pt-2 border-t border-green-200">
                Total Points: <span class="font-bold">{{ match.user_points }}</span>
              </div>
            </div>

            <!-- VS -->
            <div class="text-center text-3xl font-extrabold text-green-600 my-3">VS</div>

            <!-- Opponent -->
            <div class="p-5 bg-gray-100 border border-green-300 rounded-xl">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-4">
                  <img
                    :src="getAvatarUrl(match.opponent?.photo_avatar_filename)"
                    class="w-16 h-16 rounded-full border-4 border-green-300 object-cover"
                  />
                  <div>
                    <div class="font-bold text-green-900 text-lg">{{ match.opponent?.nickname }}</div>
                    <div class="text-sm text-green-700">Opponent</div>
                  </div>
                </div>

                <div
                  class="text-5xl font-extrabold"
                  :class="match.result === 'loss' ? 'text-red-600' : 'text-green-700'"
                >
                  {{ match.opponent_marks }}
                </div>
              </div>

              <div class="text-sm text-green-700 mt-2 pt-2 border-t border-green-200">
                Total Points: <span class="font-bold">{{ match.opponent_points }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Info -->
        <div v-if="match.custom" class="bg-white border border-green-300 rounded-2xl p-8 shadow-lg">
          <h3 class="text-2xl font-extrabold text-green-900 mb-4">Additional Information</h3>

          <pre class="bg-green-50 p-4 rounded-xl border border-green-200 text-sm text-green-800 overflow-x-auto">
{{ JSON.stringify(match.custom, null, 2) }}
          </pre>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHistoryStore } from '@/stores/history'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const historyStore = useHistoryStore()
const authStore = useAuthStore()

const match = ref(null)
const perspectivePlayer = ref(null)
const viewingAsAdmin = ref(false)

onMounted(async () => {
  await loadMatch()
})

const loadMatch = async () => {
  const matchId = route.params.id
  const playerId = route.query.playerId || null

  // Check if admin is viewing another player's history
  if (playerId) {
    viewingAsAdmin.value = true
  }

  try {
    // fetchMatchDetails now returns the full response object from backend
    const response = await historyStore.fetchMatchDetails(matchId, playerId)
    match.value = response.match

    // The backend now returns perspective_player in the response (after updating backend)
    if (response.perspective_player) {
      perspectivePlayer.value = response.perspective_player
    } else {
      // Fallback to current user if backend doesn't provide it
      perspectivePlayer.value = authStore.currentUser
    }
  } catch (error) {
    console.error('Error loading match:', error)
  }
}

const viewGameDetails = (gameId) => {
  const query = {}
  // CRITICAL: Preserve the playerId query parameter when navigating
  if (route.query.playerId) {
    query.playerId = route.query.playerId
  }
  router.push({ name: 'GameDetails', params: { id: gameId }, query })
}

const goBack = () => {
  // If viewing as admin, go back to the player's history with playerId preserved
  if (viewingAsAdmin.value && route.query.playerId) {
    router.push({
      name: 'MatchHistory',
      query: { playerId: route.query.playerId }
    })
  } else {
    router.go(-1)
  }
}

const formatResult = (result) => {
  const results = {
    win: 'Win',
    loss: 'Loss',
    draw: 'Draw'
  }
  return results[result] || result
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return '-'
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
