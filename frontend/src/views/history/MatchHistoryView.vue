<template>
  <div class="min-h-screen bg-green-900 text-white py-10 px-4">

    <!-- HEADER -->
    <section class="text-center mb-12">
      <h1 class="text-4xl font-extrabold mb-3 drop-shadow">
        Histórico de Matches
      </h1>
      <p class="opacity-80">
        Consulta todos os matches multiplayer que jogaste.
      </p>
    </section>

    <div class="max-w-6xl mx-auto">

      <!-- FILTERS -->
      <div class="bg-white text-green-800 p-5 rounded-lg shadow border border-green-300 mb-8">
        <div class="flex items-center gap-4">
          <label class="font-semibold">Filtrar por variante:</label>
          <select
            v-model="selectedType"
            @change="loadMatches(1)"
            class="px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none"
          >
            <option value="">Todas</option>
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
        <p>A carregar matches...</p>
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
          Tentar novamente
        </button>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="historyStore.matches.length === 0"
        class="bg-white text-green-800 p-12 rounded-lg shadow border border-green-300 text-center"
      >
        <div class="text-6xl mb-4">🏆</div>
        <p class="text-lg font-semibold">Nenhum match encontrado</p>
        <p class="opacity-70 mt-2">Joga matches para começar o teu histórico!</p>
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
                  :class="match.result === 'win' ? 'text-green-700' : 'text-gray-600'">
                  {{ match.user_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">As tuas marcas</div>
              </div>

              <div class="text-2xl font-bold opacity-40">vs</div>

              <div class="text-center">
                <div class="text-4xl font-bold mb-1"
                  :class="match.result === 'loss' ? 'text-red-700' : 'text-gray-600'">
                  {{ match.opponent_marks }}
                </div>
                <div class="text-xs opacity-70 uppercase font-medium">Oponente</div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '@/stores/history'

const router = useRouter()
const historyStore = useHistoryStore()

const selectedType = ref('')

onMounted(() => {
  loadMatches(1)
})

const loadMatches = async (page = 1) => {
  const params = { page, per_page: 10 }
  if (selectedType.value) params.type = selectedType.value
  await historyStore.fetchUserMatches(params)
}

const viewMatchDetails = (matchId) => {
  router.push({ name: 'MatchDetails', params: { id: matchId } })
}

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
  if (!filename) return '/default-avatar.png'
  return `/storage/avatars/${filename}`
}
</script>
