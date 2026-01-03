<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useApiStore } from '@/stores/api'

const loading = ref(true)
const updatedAt = ref(null)

const stats = reactive({
  platform: {
    total_registered_players: 0,
    total_games_played: 0,
    total_matches_played: 0,
    games_today: 0,
    games_this_week: 0,
  },
  recent_activity: [],
  admin: {
    timeSeries: {},
    breakdowns: {}
  }
})

const authStore = useAuthStore()
const apiStore = useApiStore()
const isAdmin = computed(() => authStore.isAdmin)

const loadStats = async () => {
  try {
    loading.value = true
    
    // Load public stats
    const res = await fetch('http://127.0.0.1:8000/api/statistics')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    // Public stats
    if (data.platform) {
      stats.platform = data.platform
    }
    if (data.recent_activity) {
      stats.recent_activity = data.recent_activity
    }

    // Load admin stats if user is admin
    if (isAdmin.value) {
      const token = apiStore.token
      console.log('Admin token:', token)
      const adminRes = await fetch('http://127.0.0.1:8000/api/admin/statistics?days=30', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      console.log('Admin response status:', adminRes.status)
      if (adminRes.ok) {
        const adminData = await adminRes.json()
        if (adminData.timeSeries) {
          stats.admin.timeSeries = adminData.timeSeries
        }
        if (adminData.breakdowns) {
          stats.admin.breakdowns = adminData.breakdowns
        }
        console.log('Admin stats loaded:', adminData)
      } else {
        const errText = await adminRes.text()
        console.error('Admin stats failed:', adminRes.status, errText)
      }
    }

    updatedAt.value = new Date()
    console.log('Public stats loaded:', data)
  } catch (e) {
    console.error('Error loading stats:', e)
  } finally {
    loading.value = false
  }
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
      <p v-if="updatedAt" class="mt-2 text-xs text-white/60">
        Última atualização: {{ updatedAt.toLocaleString() }}
      </p>
    </div>

    <!-- PUBLIC STATS: Key Metrics -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Utilizadores Registados</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.platform.total_registered_players }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Jogos Totais</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.platform.total_games_played }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Partidas Concluídas</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.platform.total_matches_played }}</p>
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
          <tr v-for="day in stats.recent_activity" :key="day.date" class="border-b border-white/10 hover:bg-white/5">
            <td class="py-2 px-2">{{ new Date(day.date).toLocaleDateString('pt-PT') }}</td>
            <td class="py-2 px-2 text-right font-semibold">{{ day.games }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ADMIN ONLY: Detailed Breakdowns -->
    <div v-if="isAdmin" class="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 backdrop-blur">
      <h2 class="text-xl font-bold text-white mb-2">
        Estatísticas Detalhadas (Admin)
      </h2>
      <p class="text-white/70 mb-6">
        Dados não anonimizados e análises avançadas da plataforma.
      </p>

      <!-- Admin: Top Players -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-white mb-4">Top Jogadores (últimos dias)</h3>
        <table v-if="stats.admin.breakdowns?.topPlayersByGames?.length" class="w-full text-white text-sm">
          <thead>
            <tr class="border-b border-white/20">
              <th class="text-left py-2 px-2">Nickname</th>
              <th class="text-left py-2 px-2">Nome</th>
              <th class="text-right py-2 px-2">Jogos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in stats.admin.breakdowns.topPlayersByGames" :key="player.user_id" class="border-b border-white/10 hover:bg-white/5">
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
        <h3 class="text-lg font-semibold text-white mb-4">Top Compradores (últimos dias)</h3>
        <table v-if="stats.admin.breakdowns?.topPurchasers?.length" class="w-full text-white text-sm">
          <thead>
            <tr class="border-b border-white/20">
              <th class="text-left py-2 px-2">Nickname</th>
              <th class="text-left py-2 px-2">Nome</th>
              <th class="text-right py-2 px-2">Compras</th>
              <th class="text-right py-2 px-2">Total €</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="buyer in stats.admin.breakdowns.topPurchasers" :key="buyer.user_id" class="border-b border-white/10 hover:bg-white/5">
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
        :disabled="loading"
      >
        {{ loading ? 'A atualizar...' : 'Atualizar' }}
      </button>
    </div>
  </section>
</template>
