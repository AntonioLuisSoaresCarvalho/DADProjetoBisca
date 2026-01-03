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
  title: { type: String, default: 'Visão Geral' },
  subtitle: { type: String, default: 'Distribuição agregada da plataforma.' },
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  colors: { 
    type: Array, 
    default: () => ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.70)', 'rgba(255,255,255,0.60)']
  },
  horizontal: { type: Boolean, default: false },
  valuePrefix: { type: String, default: '' },
  valueSuffix: { type: String, default: '' },
})

const canvasRef = ref(null)
let chart = null

const fmt = (n) => new Intl.NumberFormat('pt-PT').format(n)

const renderChart = () => {
  if (!canvasRef.value) return
  if (chart) chart.destroy()

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: props.title,
          data: props.values,
          borderRadius: 10,
          barThickness: 38,
          maxBarThickness: 46,
          backgroundColor: props.colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: props.horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = props.horizontal ? ctx.parsed.x : ctx.parsed.y
              return ` ${props.valuePrefix}${fmt(value)}${props.valueSuffix}`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: props.horizontal,
          ticks: { 
            color: 'rgba(255,255,255,0.85)', 
            font: { weight: '600', size: props.horizontal ? 11 : 12 },
            callback: props.horizontal ? (v) => fmt(v) : undefined,
          },
          grid: { 
            display: props.horizontal,
            color: props.horizontal ? 'rgba(255,255,255,0.10)' : undefined,
          },
          border: { display: false },
        },
        y: {
          beginAtZero: !props.horizontal,
          ticks: {
            color: props.horizontal ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
            font: { weight: props.horizontal ? '600' : '400', size: props.horizontal ? 11 : 12 },
            callback: !props.horizontal ? (v) => fmt(v) : undefined,
          },
          grid: { 
            display: !props.horizontal,
            color: !props.horizontal ? 'rgba(255,255,255,0.10)' : undefined,
          },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(renderChart)

watch(
  () => [props.labels, props.values, props.colors, props.horizontal],
  () => renderChart(),
  { deep: true }
)

onBeforeUnmount(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <section class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-sm backdrop-blur">
    <header class="mb-4">
      <h2 class="text-lg font-bold text-white">{{ title }}</h2>
      <p class="text-sm text-white/70">{{ subtitle }}</p>
    </header>

    <div class="h-80">
      <canvas ref="canvasRef"></canvas>
    </div>
  </section>
</template>