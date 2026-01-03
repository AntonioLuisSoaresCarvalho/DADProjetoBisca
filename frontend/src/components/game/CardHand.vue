<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import Card from '@/components/game/Card.vue'

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  validCards: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['playCard'])

function isCardValid(card) {
  // Se não há cartas válidas especificadas, todas são válidas
  if (props.validCards.length === 0) return true
  
  // Verificar se a carta está na lista de válidas
  return props.validCards.some(c => c.id === card.id)
}

function handleCardClick(card) {
  if (props.disabled) {
    console.log('Cards are disabled')
    return
  }
  
  if (!isCardValid(card)) {
    console.log('❌ Invalid card! Must follow suit.')
    return
  }
  
  emit('playCard', card)
}

const maxCols = computed(() => Math.min(props.cards.length, 9))
</script>

<template>
  <div class="m-auto pt-10 grid gap-3 p-4 max-w-7xl justify-center"
    :style="{
      gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`
    }">
    <div 
      v-for="item in props.cards"
      :key="item.id"
      class="relative"
    >
      <!-- Carta com validação visual -->
      <Card
        :card="item"
        :disabled="props.disabled || !isCardValid(item)"
        :class="[
          isCardValid(item) && !props.disabled ? 'ring-2 ring-green-500 ring-offset-2 transition-all' : '',
          !isCardValid(item) && !props.disabled && validCards.length > 0 ? 'opacity-40' : ''
        ]"
        @clicked="handleCardClick"
      />
      
      <!-- Indicador visual de carta válida -->
      <div
        v-if="isCardValid(item) && !props.disabled && validCards.length > 0"
        class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg z-10 animate-pulse"
      >
        ✓
      </div>
      
      <!-- Indicador visual de carta inválida -->
      <div
        v-if="!isCardValid(item) && !props.disabled && validCards.length > 0"
        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg z-10"
      >
        ✗
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>