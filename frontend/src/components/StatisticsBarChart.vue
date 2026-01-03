<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  totalUsers: { type: Number, required: true },
  totalGames: { type: Number, required: true },
  totalFinished: { type: Number, required: true },
})

const canvasRef = ref(null)
let chart = null

const values = computed(() => [props.totalUsers, props.totalGames, props.totalFinished])

const fmt = (n) => new Intl.NumberFormat('pt-PT').format(n)

const renderChart = () => {
  if (!canvasRef.value) return
  if (chart) chart.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: ['Utilizadores', 'Jogos', 'Partidas concluídas'],
      datasets: [
        {
          label: 'Resumo',
          data: values.value,
          borderRadius: 10,
          barThickness: 38,
          maxBarThickness: 46,
          // Colores discretos (no se mezclan con el verde)
          backgroundColor: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.70)', 'rgba(255,255,255,0.60)'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ para que respete la altura del contenedor
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${fmt(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.85)', font: { weight: '600' } },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255,255,255,0.65)',
            callback: (v) => fmt(v),
          },
          grid: { color: 'rgba(255,255,255,0.10)' },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(renderChart)

watch(
  () => values.value,
  () => renderChart()
)

onBeforeUnmount(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <section class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
    <header class="mb-4">
      <h2 class="text-lg font-bold text-white">Visão Geral</h2>
      <p class="text-sm text-white/70">Distribuição agregada da plataforma.</p>
    </header>

    <!-- ✅ altura fija para que no se haga gigante -->
    <div class="h-[320px]">
      <canvas ref="canvasRef"></canvas>
    </div>
  </section>
</template>
