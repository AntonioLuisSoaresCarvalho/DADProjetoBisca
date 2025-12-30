<template>
  <div class="min-h-screen bg-green-900 text-white py-10 px-4">

    <!-- HEADER -->
    <section class="text-center mb-12">
      <h1 class="text-4xl font-extrabold mb-3 drop-shadow">
        Games History
      </h1>
      <p class="opacity-80">
        Check games on the platform from every player.
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
          Checking history from: <strong>{{ selectedPlayerName }}</strong>
        </p>
      </div>

      <!-- FILTERS -->
      <div class="bg-white text-green-800 p-5 rounded-lg shadow border border-green-300 mb-8">
        <div class="flex items-center gap-4">
          <label class="font-semibold">Filter by variant:</label>
          <select
            v-model="selectedType"
            @change="loadGames(1)"
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
        v-if="historyStore.gamesLoading"
        class="bg-white text-green-800 p-12 rounded-lg shadow border border-green-300 text-center"
      >
        <div class="animate-spin mb-4 inline-block w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full"></div>
        <p>Loading games...</p>
      </div>

      <!-- ERROR -->
      <div
        v-else-if="historyStore.gamesError"
        class="bg-red-100 text-red-800 p-10 rounded-lg shadow text-center border border-red-300"
      >
        <p class="mb-4 font-semibold">{{ historyStore.gamesError }}</p>
        <button
          @click="loadGames(1)"
          class="px-6 py-2 bg-green-700 text-white rounded-lg font-semibold shadow hover:bg-green-800 transition"
        >
          Try again
        </button>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="historyStore.games.length === 0"
        class="bg-white text-green-800 p-12 rounded-lg shadow border border-green-300 text-center"
      >
        <div class="text-6xl mb-4">🎮</div>
        <p class="text-lg font-semibold">No games found</p>
        <p class="opacity-70 mt-2">
          {{ selectedPlayerId ? 'This player has no history yet.' : 'Play matches to start your history!' }}
        </p>
      </div>

      <!-- GAMES LIST -->
      <div v-else class="space-y-5">
        <div
          v-for="game in historyStore.games"
          :key="game.id"
          @click="viewGameDetails(game.id)"
          class="bg-white text-green-900 p-6 rounded-lg shadow border border-green-300 cursor-pointer hover:shadow-lg transition"
        >
          <!-- TOP BAR -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold">{{ game.type }}</h2>

              <span
                class="px-3 py-1 text-sm font-semibold rounded-full"
                :class="{
                  'bg-green-200 text-green-900': game.result === 'win',
                  'bg-red-200 text-red-900': game.result === 'loss',
                  'bg-gray-200 text-gray-800': game.result === 'draw'
                }"
              >
                {{ formatResult(game.result) }}
              </span>

              <span
                v-if="game.game_type"
                class="px-3 py-1 text-xs font-bold rounded-full bg-orange-500 text-white"
              >
                {{ game.game_type }}
              </span>
            </div>

            <span
              v-if="game.is_part_of_match"
              class="px-3 py-1 bg-green-200 text-green-900 rounded-full text-xs font-semibold"
            >
              Jogo de Match
            </span>
          </div>

          <!-- GRID -->
          <div class="grid md:grid-cols-3 gap-4">

            <!-- OPPONENT -->
            <div v-if="game.opponent" class="flex items-center gap-3">
              <img
                :src="getAvatarUrl(game.opponent.photo_avatar_filename)"
                class="w-12 h-12 rounded-full border border-green-300 object-cover"
              />
              <div>
                <p class="font-bold">{{ game.opponent.nickname }}</p>
                <p class="text-sm opacity-70">Oponente</p>
              </div>
            </div>
            <div v-else class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full border border-green-300 bg-gray-400 flex items-center justify-center">
                <span class="text-white font-bold">?</span>
              </div>
              <div>
                <p class="font-bold text-gray-500">Unknown User</p>
                <p class="text-sm opacity-70">Oponente</p>
              </div>
            </div>

            <!-- SCORE -->
            <div class="flex items-center justify-center gap-3">
              <span
                class="text-3xl font-bold"
                :class="game.result === 'loss' ? 'text-red-700' : 'text-gray-600'"
              >
                {{ game.opponent_points }}
              </span>

              <span class="text-2xl opacity-40">-</span>

              <span
                class="text-3xl font-bold"
                :class="game.result === 'win' ? 'text-green-700' : 'text-gray-600'"
              >
                {{ game.user_points }}
              </span>

              <!-- <span
                class="text-3xl font-bold"
                :class="game.result === 'loss' ? 'text-red-700' : 'text-gray-600'"
              >
                {{ game.opponent_points }}
              </span> -->
            </div>

            <!-- META -->
            <div class="text-right">
              <p class="text-sm opacity-80">{{ formatDate(game.ended_at) }}</p>
              <p class="text-xs opacity-60">{{ formatDuration(game.total_time) }}</p>
            </div>

          </div>
        </div>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="historyStore.gamesPagination && historyStore.gamesPagination.last_page > 1"
        class="mt-10 flex items-center justify-center gap-4"
      >
        <button
          @click="loadGames(historyStore.gamesPagination.current_page - 1)"
          :disabled="historyStore.gamesPagination.current_page === 1"
          class="px-6 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          Anterior
        </button>

        <span class="font-semibold">
          Página {{ historyStore.gamesPagination.current_page }} de {{ historyStore.gamesPagination.last_page }}
        </span>

        <button
          @click="loadGames(historyStore.gamesPagination.current_page + 1)"
          :disabled="historyStore.gamesPagination.current_page === historyStore.gamesPagination.last_page"
          class="px-6 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
        >
          Seguinte
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useHistoryStore } from "@/stores/history";
import { useAuthStore } from "@/stores/authStore";
import { useApiStore } from "@/stores/api";

const router = useRouter();
const historyStore = useHistoryStore();
const authStore = useAuthStore();
const apiStore = useApiStore();

const selectedType = ref("");
const selectedPlayerId = ref("");
const selectedPlayerName = ref("");
const players = ref([]);

const isAdmin = computed(() => authStore.currentUser?.type === 'A');

onMounted(async () => {
  if (isAdmin.value) {
    await loadPlayers();
  }
  loadGames(1);
});

const loadPlayers = async () => {
  try {
    const response = await apiStore.getUsers({ type: 'P' });
    players.value = response.data || [];
  } catch (error) {
    console.error('Error loading players:', error);
  }
};

const onPlayerChange = () => {
  if (selectedPlayerId.value) {
    const player = players.value.find(p => p.id === parseInt(selectedPlayerId.value));
    selectedPlayerName.value = player ? `${player.nickname} (${player.name})` : '';
  } else {
    selectedPlayerName.value = '';
  }
  loadGames(1);
};

const clearPlayerSelection = () => {
  selectedPlayerId.value = "";
  selectedPlayerName.value = "";
  loadGames(1);
};

const loadGames = async (page = 1) => {
  const params = { page, per_page: 15 };
  if (selectedType.value) params.type = selectedType.value;

  if (isAdmin.value && selectedPlayerId.value) {
    await historyStore.fetchPlayerGames(selectedPlayerId.value, params);
  } else {
    await historyStore.fetchUserGames(params);
  }
};

const viewGameDetails = (gameId) => {
  const query = {};
  if (isAdmin.value && selectedPlayerId.value) {
    query.playerId = selectedPlayerId.value;
  }
  router.push({ name: "GameDetails", params: { id: gameId }, query });
};

const formatResult = (result) => {
  const results = {
    win: "Vitória",
    loss: "Derrota",
    draw: "Empate",
  };
  return results[result] || result;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-PT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getAvatarUrl = (filename) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  if (!filename) return `${apiBaseUrl}/storage/photos_avatars/anonymous.png`;
  return `${apiBaseUrl}/storage/photos_avatars/${filename}`;
};
</script>
