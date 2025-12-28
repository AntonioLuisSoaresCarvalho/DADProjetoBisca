<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    default: null
  }
})

// Converte o suit para letra
const suitLetter = computed(() => {
  const suitMap = {
    'hearts': 'c',    // copas
    'diamonds': 'o',  // ouros
    'clubs': 'p',     // paus
    'spades': 'e'     // espadas
  }
  return suitMap[props.card.suit] || 'c'
})

// Converte o rank para número/letra
const rankValue = computed(() => {
  const rankMap = {
    'A': '1',   // Ás
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    'J': '11',  // Valete (Jack)
    'Q': '12',  // Rainha (Queen)
    'K': '13'   // Rei (King)
  }
  return rankMap[props.card.rank] || props.card.rank
})

// Gera o caminho da imagem: c7.png, o1.png, p13.png
const cardImagePath = computed(() => {
  const filename = `${suitLetter.value}${rankValue.value}.png`
  
  try {
    return new URL(`../../assets/cards/${filename}`, import.meta.url).href
  } catch (error) {
    console.error('❌ Erro ao gerar URL:', error)
    return ''
  }
})

// Fallback se a imagem não carregar
function handleImageError(event) {
  console.error(`Imagem não encontrada: ${suitLetter.value}${rankValue.value}.png`)
}
</script>

<template>
  <!-- Empty placeholder when no card -->
  <div
    v-if="!card"
    class="relative w-24 h-36 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
  >
    <span class="text-gray-400 text-sm">-</span>
  </div>
  
  <!-- Card when played -->
  <div
    v-else
    class="relative w-24 h-36 rounded-lg shadow-lg select-none overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500"
  >
    <!-- Imagem da carta -->
    <img 
      :src="cardImagePath"
      :alt="`${card.name}`"
      class="w-full h-full object-cover"
      @error="handleImageError"
    />
    
    <!-- Points indicator (opcional - sobrepõe a imagem) -->
    <div 
      v-if="card.points > 0" 
      class="absolute top-1 right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md"
    >
      {{ card.points }}
    </div>
  </div>
</template>