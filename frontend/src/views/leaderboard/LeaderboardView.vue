<template>
  <div class="max-w-6xl mx-auto p-6 text-white">

    <!-- TABS -->
    <div class="flex gap-2 mb-6 border-b border-green-500 pb-2">
      <button
        v-if="auth.user"
        class="px-4 py-2 font-semibold rounded-t-md border-b-4 transition
          text-white bg-green-700 border-green-700
          hover:bg-green-600"
        :class="{ 'bg-white! text-green-800! border-white!': board.activeTab === 'personal' }"
        @click="board.activeTab = 'personal'"
      >
        My Stats
      </button>

      <button
        v-for="tab in [
          { key:'games', label:'Top Games'},
          { key:'matches', label:'Top Matches'},
          { key:'capotes', label:'Top Capotes'},
          { key:'bandeiras', label:'Top Bandeiras'},
        ]"
        :key="tab.key"
        class="px-4 py-2 font-semibold rounded-t-md border-b-4 transition
          text-white bg-green-700 border-green-700
          hover:bg-green-600"
        :class="{ 'bg-white! text-green-800! border-white!': board.activeTab === tab.key }"
        @click="board.activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- VARIANT FILTER -->
    <div class="flex items-center gap-3 mb-6">
      <label class="font-semibold text-white">Variant:</label>

      <select
        v-model="board.variantFilter"
        @change="board.loadData(!!auth.user)"
        class="bg-white text-green-800 border border-green-400 rounded-lg p-2"
      >
        <option value="">All</option>
        <option value="3">Bisca de 3</option>
        <option value="9">Bisca de 9</option>
      </select>
    </div>

    <!-- PERSONAL STATS -->
    <div v-if="board.activeTab === 'personal' && auth.user">

      <div v-if="board.loadingPersonal" class="text-center py-10 text-lg text-green-200">
        Loading your statistics...
      </div>

      <div v-else class="grid gap-10">

        <!-- GAME STATS -->
        <section>
          <h3 class="text-3xl font-bold mb-6">Game Statistics</h3>

          <div class="grid md:grid-cols-3 gap-6">

            <!-- CARD -->
            <div class="bg-white text-green-900 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.total }}</div>
              <div class="text-sm font-semibold mt-1">Total Games</div>
            </div>

            <div class="bg-green-100 text-green-800 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.wins }}</div>
              <div class="text-sm font-semibold mt-1">Wins</div>
            </div>

            <div class="bg-white text-green-900 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.losses }}</div>
              <div class="text-sm font-semibold mt-1">Losses</div>
            </div>

            <div class="bg-white text-green-900 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.draws }}</div>
              <div class="text-sm font-semibold mt-1">Draws</div>
            </div>

            <div class="bg-yellow-100 text-yellow-800 p-6 rounded-xl shadow border border-yellow-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.capotes }}</div>
              <div class="text-sm font-semibold mt-1">Capotes</div>
            </div>

            <div class="bg-yellow-100 text-yellow-800 p-6 rounded-xl shadow border border-yellow-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.games.bandeiras }}</div>
              <div class="text-sm font-semibold mt-1">Bandeiras</div>
            </div>

            <div class="bg-blue-100 text-blue-800 p-6 rounded-xl shadow border border-blue-300 text-center md:col-span-3">
              <div class="text-4xl font-bold">{{ board.personalStats.games.win_rate }}%</div>
              <div class="text-sm font-semibold mt-1">Win Rate</div>
            </div>

          </div>
        </section>

        <!-- MATCH STATS -->
        <section>
          <h3 class="text-3xl font-bold mb-6">Match Statistics</h3>

          <div class="grid md:grid-cols-3 gap-6">

            <div class="bg-white text-green-900 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.matches.total }}</div>
              <div class="text-sm font-semibold mt-1">Total Matches</div>
            </div>

            <div class="bg-green-100 text-green-800 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.matches.wins }}</div>
              <div class="text-sm font-semibold mt-1">Wins</div>
            </div>

            <div class="bg-white text-green-900 p-6 rounded-xl shadow border border-green-300 text-center">
              <div class="text-4xl font-bold">{{ board.personalStats.matches.losses }}</div>
              <div class="text-sm font-semibold mt-1">Losses</div>
            </div>

          </div>
        </section>

      </div>
    </div>

    <!-- GLOBAL LEADERBOARD -->
    <div v-else>

      <div v-if="board.loading" class="text-center py-10 text-lg text-green-200">
        Loading leaderboard...
      </div>

      <div v-else-if="board.leaders.length === 0" class="text-center py-10 text-green-200">
        No data available
      </div>

      <div v-else class="overflow-hidden rounded-xl shadow border border-green-500">
        <table class="w-full border-collapse text-white">

          <thead class="bg-green-700">
            <tr>
              <th class="p-4 text-left">Rank</th>
              <th class="p-4 text-left">Player</th>
              <th class="p-4 text-center">{{ board.getScoreLabel() }}</th>
            </tr>
          </thead>

          <tbody class="bg-green-900">

            <tr
              v-for="leader in board.leaders"
              :key="leader.rank"
              class="border-b border-green-700 hover:bg-green-800 transition"
            >
              <td class="p-4 font-bold">
                {{ leader.rank }}
              </td>

              <td class="p-4 flex items-center gap-3">
                <img
                  v-if="leader.photo"
                  :src="leader.photo"
                  class="w-10 h-10 rounded-full border border-green-400 object-cover"
                >
                <div v-else class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-lg font-bold">
                  {{ leader.nickname[0].toUpperCase() }}
                </div>
                {{ leader.nickname }}
              </td>

              <td class="p-4 text-center font-bold text-green-300">
                {{ board.getScore(leader) }}
              </td>

            </tr>

          </tbody>

        </table>
      </div>

    </div>

  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useLeaderboardStore } from "@/stores/leaderboardStore";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const board = useLeaderboardStore();

onMounted(() => {
  if (auth.user) board.activeTab = "personal";
  board.loadData(!!auth.user);
});

// recarregar sempre que trocar de tab
watch(() => board.activeTab, () => {
  board.loadData(!!auth.user);
});
</script>
