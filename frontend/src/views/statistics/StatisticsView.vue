<script setup>
import { onMounted, computed,ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import StatisticsBarChart from '@/components/StatisticsBarChart.vue'

const authStore = useAuthStore()
const statsStore = useStatisticsStore()

const isAdmin = computed(() => authStore.isAdmin)

const selectedDays = ref(30)


const recentActivityChartData = computed(() => {
  const activity = statsStore.recent_activity || []
  return {
    labels: activity.map(day => {
      const date = new Date(day.date)
      return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
    }),
    values: activity.map(day => day.games),
  }
})

const loadStats = async () => {
  await statsStore.loadStats(isAdmin.value, selectedDays.value)
}

onMounted(loadStats)
</script>

<template>
  <section class="py-10">
    <div class="mb-6">
      <h1 class="text-4xl font-extrabold text-white">Estatísticas</h1>
      <p class="mt-2 text-white/80">
        Resumo de métricas agregadas da plataforma Bisca (anonimizadas).
      </p>
      <p v-if="statsStore.updatedAt" class="mt-2 text-xs text-white/60">
        Última atualização: {{ statsStore.updatedAt.toLocaleString() }}
      </p>
    </div>

    <!-- PUBLIC STATS: Key Metrics -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Players found</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ statsStore.platform.total_registered_players }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Total games on the platform</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ statsStore.platform.total_games_played }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Total matches on the platform</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ statsStore.platform.total_matches_played }}</p>
      </div>
    </div>
    

    <!-- Recent Activity: Text/Table -->
    <div class="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur mb-8">
      <h2 class="text-xl font-bold text-white mb-4">Atividade Recente (últimos 7 dias)</h2>
      <table class="w-full text-white">
        <thead>
          <tr class="border-b border-white/20">
            <th class="text-left py-2 px-2">Data</th>
            <th class="text-right py-2 px-2">Jogos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in statsStore.recent_activity" :key="day.date" class="border-b border-white/10 hover:bg-white/5">
            <td class="py-2 px-2">{{ new Date(day.date).toLocaleDateString('pt-PT') }}</td>
            <td class="py-2 px-2 text-right font-semibold">{{ day.games }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mb-8">
      <StatisticsBarChart
        title="Atividade Recente"
        subtitle="Jogos realizados nos últimos 7 dias"
        :labels="recentActivityChartData.labels"
        :values="recentActivityChartData.values"
        :colors="['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.80)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.70)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0.60)', 'rgba(255,255,255,0.55)']"
        value-suffix=" jogos"
      />
    </div>

    <!-- ADMIN ONLY: Detailed Breakdowns -->
    <div v-if="isAdmin" class="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 backdrop-blur">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-white mb-2">
            Detailed statistics (Admin)
          </h2>
          <p class="text-white/70">
            Data not anonimized and avanced details of the platform.
          </p>
        </div>

        <!-- Range Selector -->
        <div class="flex items-center gap-3">
          <label for="days-range" class="text-white text-sm font-semibold">Período:</label>
          <select
            id="days-range"
            v-model.number="selectedDays"
            @change="loadStats"
            class="bg-green-500 text-white border border-green/20 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green/15 transition"
          >
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
            <option value="365">365 dias</option>
          </select>
        </div>
      </div>

      <!-- Admin: Top Players -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-white mb-4">Top Jogadores (últimos {{ statsStore.admin.range.days }} dias)</h3>
        <table v-if="statsStore.admin.breakdowns?.topPlayersByGames?.length" class="w-full text-white text-sm">
          <thead>
            <tr class="border-b border-white/20">
              <th class="text-left py-2 px-2">Nickname</th>
              <th class="text-left py-2 px-2">Nome</th>
              <th class="text-right py-2 px-2">Jogos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in statsStore.admin.breakdowns.topPlayersByGames" :key="player.user_id" class="border-b border-white/10 hover:bg-white/5">
              <td class="py-2 px-2 font-semibold">{{ player.nickname }}</td>
              <td class="py-2 px-2">{{ player.name }}</td>
              <td class="py-2 px-2 text-right">{{ player.games }}</td>
            </tr>
          </tbody>
        </table>
        
        <p v-else class="text-white/60">Sem dados disponíveis</p>
      </div>

      <!-- Admin: Top Purchasers -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-white mb-4">Top Compradores (últimos {{ statsStore.admin.range.days }} dias)</h3>
        <table v-if="statsStore.admin.breakdowns?.topPurchasers?.length" class="w-full text-white text-sm">
          <thead>
            <tr class="border-b border-white/20">
              <th class="text-left py-2 px-2">Nickname</th>
              <th class="text-left py-2 px-2">Nome</th>
              <th class="text-right py-2 px-2">Compras</th>
              <th class="text-right py-2 px-2">Total €</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="buyer in statsStore.admin.breakdowns.topPurchasers" :key="buyer.user_id" class="border-b border-white/10 hover:bg-white/5">
              <td class="py-2 px-2 font-semibold">{{ buyer.nickname }}</td>
              <td class="py-2 px-2">{{ buyer.name }}</td>
              <td class="py-2 px-2 text-right">{{ buyer.purchases }}</td>
              <td class="py-2 px-2 text-right font-semibold">€{{ buyer.total_euros }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-white/60">Sem dados disponíveis</p>
      </div>
    </div>

    <!-- Refresh Button -->
    <div class="mt-6">
      <button
        class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-white/90 disabled:opacity-60"
        @click="loadStats"
        :disabled="statsStore.loading"
      >
        {{ statsStore.loading ? 'A atualizar...' : 'Atualizar' }}
      </button>
    </div>
  </section>
</template>