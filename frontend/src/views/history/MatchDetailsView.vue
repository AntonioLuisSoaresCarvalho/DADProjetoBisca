<template>
  <div class="min-h-screen bg-green-900 py-12 px-4">
    <div class="max-w-5xl mx-auto">

      <!-- Loading -->
      <div
        v-if="historyStore.matchLoading"
        class="bg-white border border-green-300 rounded-2xl p-12 text-center shadow-lg"
      >
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p class="text-green-800 font-semibold text-lg">Loading match details...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="historyStore.matchError"
        class="bg-red-50 border border-red-300 rounded-2xl p-8 text-center shadow-lg"
      >
        <p class="text-red-700 font-semibold mb-4">{{ historyStore.matchError }}</p>

        <div class="flex gap-4 justify-center">
          <button
            @click="loadMatch"
            class="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Retry
          </button>
          <button
            @click="$router.go(-1)"
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
          @click="$router.go(-1)"
          class="mb-6 px-5 py-2 bg-white border border-green-300 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

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
              <div class="pt-5 mt-5 border-t border-green-200">
                <h4 class="text-lg font-bold mb-3 text-green-900">Games</h4>

                <div class="space-y-3">
                  <div
                    v-for="g in match.games"
                    :key="g.id"
                    class="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-xl"
                  >
                    <span class="font-semibold text-green-900">Game #{{ g.game_number }}</span>

                    <router-link
                      :to="{ name: 'GameDetails', params: { id: g.id } }"
                      class="text-green-700 font-semibold hover:underline"
                    >
                      View →
                    </router-link>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Match Score -->
          <div class="bg-white border border-green-300 rounded-2xl p-8 shadow-lg">
            <h3 class="text-2xl font-extrabold text-green-900 mb-6">Players & Score</h3>

            <!-- You -->
            <div class="p-5 bg-green-100 border border-green-300 rounded-xl flex justify-between items-center mb-6">
              <div class="flex items-center gap-4">
                <img
                  :src="getAvatarUrl(currentUser.photo_avatar_filename)"
                  class="w-16 h-16 rounded-full border-4 border-green-300 object-cover"
                />
                <div>
                  <div class="font-bold text-green-900 text-lg">{{ currentUser.nickname }}</div>
                  <div class="text-sm text-green-700">You</div>
                </div>
              </div>

              <div class="text-5xl font-extrabold text-green-700">
                {{ match.user_points }}
              </div>
            </div>

            <!-- VS -->
            <div class="text-center text-3xl font-extrabold text-green-600 my-3">VS</div>

            <!-- Opponent -->
            <div class="p-5 bg-gray-100 border border-green-300 rounded-xl flex justify-between items-center">
              <div class="flex items-center gap-4">
                <img
                  :src="getAvatarUrl(match.opponent.photo_avatar_filename)"
                  class="w-16 h-16 rounded-full border-4 border-green-300 object-cover"
                />
                <div>
                  <div class="font-bold text-green-900 text-lg">{{ match.opponent.nickname }}</div>
                  <div class="text-sm text-green-700">Opponent</div>
                </div>
              </div>

              <div
                class="text-5xl font-extrabold"
                :class="match.result === 'loss' ? 'text-red-600' : 'text-green-700'"
              >
                {{ match.opponent_points }}
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

const route = useRoute()
const router = useRouter()
const historyStore = useHistoryStore()

const match = ref(null)
const currentUser = ref(null)

onMounted(() => {
  currentUser.value = JSON.parse(localStorage.getItem('user') || '{}')
  loadMatch()
})

const loadMatch = async () => {
  const matchId = route.params.id
  const matchData = await historyStore.fetchMatchDetails(matchId)
  match.value = matchData
}

const viewGameDetails = (gameId) => {
  router.push({ name: 'GameDetails', params: { id: gameId } })
}

const formatResult = (result) => {
  const results = {
    win: '✓ Win',
    loss: '✗ Loss',
    draw: '= Draw'
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
  if (!filename) return '/default-avatar.png'
  return `/storage/avatars/${filename}`
}
</script>