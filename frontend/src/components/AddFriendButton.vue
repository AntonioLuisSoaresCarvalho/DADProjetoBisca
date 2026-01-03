<script setup>
import { useFriendStore } from '@/stores/friendStore'
import { computed } from 'vue'

const props = defineProps({
  opponent: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['added'])

const friendStore = useFriendStore()

const isAlreadyFriend = computed(() => {
  return friendStore.isFriend(props.opponent.id)
})

const handleAddFriend = () => {
  const success = friendStore.addFriend(props.opponent)
  
  if (success) {
    emit('added', props.opponent)
  }
}
</script>

<template>
  <button 
    v-if="!isAlreadyFriend"
    @click="handleAddFriend"
    class="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:-translate-y-1 hover:shadow-lg"
  >
    <span class="text-xl">➕</span>
    <span>Adicionar {{ opponent.nickname }}</span>
  </button>
  
  <div v-else class="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold border-2 border-green-300">
    <span class="text-xl">✅</span>
    <span>{{ opponent.nickname }} já está na lista</span>
  </div>
</template>