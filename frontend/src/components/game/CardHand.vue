<script setup>
import { defineProps, defineEmits,computed } from 'vue'
import Card from '@/components/game/Card.vue'

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['playCard'])

function handleCardClick(card) {
  if (props.disabled) return
  emit('playCard', card)
}

const maxCols = computed(() => Math.min(props.cards.length, 9))
</script>

<template>
  <div class="m-auto pt-10 grid gap-3 p-4 max-w-7xl justify-center"
    :style="{
      gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`
    }">
    <Card
      v-for="item in props.cards"
      :key="item.id"
      :card="item"
      :disabled="props.disabled"
      @clicked="handleCardClick"
    />
  </div>
</template>
