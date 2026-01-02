<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import StatisticsBarChart from '@/components/StatisticsBarChart.vue'

const loading = ref(true)
const updatedAt = ref(null)

const stats = reactive({
  totalUsers: 0,
  totalGames: 0,
  totalFinished: 0,
})

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)

const loadStats = async () => {
  try {
    loading.value = true
    const res = await fetch('http://127.0.0.1:8000/api/statistics')
    const data = await res.json()

    stats.totalUsers = data.totalUsers ?? 0
    stats.totalGames = data.totalGames ?? 0
    stats.totalFinished = data.totalFinished ?? 0
    updatedAt.value = new Date()
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
        Resumo de métricas agregadas da plataforma Bisca.
      </p>
      <p v-if="updatedAt" class="mt-2 text-xs text-white/60">
        Última atualização: {{ updatedAt.toLocaleString() }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Utilizadores</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.totalUsers }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Jogos</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.totalGames }}</p>
      </div>

      <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur hover:bg-white/15 transition">
        <p class="text-sm text-white/70">Partidas concluídas</p>
        <p class="mt-2 text-4xl font-extrabold text-white">{{ stats.totalFinished }}</p>
      </div>
    </div>

    <StatisticsBarChart
      :totalUsers="stats.totalUsers"
      :totalGames="stats.totalGames"
      :totalFinished="stats.totalFinished"
    />

    <!-- ADMIN ONLY -->
    <div v-if="isAdmin" class="mt-10 rounded-xl border border-white/20 bg-white/10 p-6">
      <h2 class="text-white text-xl font-bold mb-2">
        Estatísticas detalhadas (Admin)
      </h2>

      <p class="text-white/70 mb-4">
        Dados não anonimizados e análises avançadas da plataforma.
      </p>

      <!-- Tabla simple -->
      <table class="w-full text-white">
        <thead>
          <tr class="border-b border-white/20">
            <th class="text-left py-2">Métrica</th>
            <th class="text-left py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2">Total de utilizadores</td>
            <td class="py-2 font-semibold">{{ stats.totalUsers }}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2">Total de jogos</td>
            <td class="py-2 font-semibold">{{ stats.totalGames }}</td>
          </tr>
          <tr>
            <td class="py-2">Partidas concluídas</td>
            <td class="py-2 font-semibold">{{ stats.totalFinished }}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
