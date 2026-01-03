<template>
  <div v-if="showSelector" class="flex justify-center items-center min-h-[60vh]">
    <Card class="w-[400px]">
      <CardHeader>
        <CardTitle class="text-center text-2xl">🎮 Pick game mode</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <!-- Singleplayer Button -->
        <Button 
          @click="showSingleplayerOptions = !showSingleplayerOptions" 
          class="h-20 text-lg"
          :variant="showSingleplayerOptions ? 'default' : 'outline'">
          <div class="flex flex-col items-center">
            <span class="text-2xl mb-1">🤖</span>
            <span class="font-bold">Singleplayer</span>
            <span class="text-xs opacity-80">Play against a Bot</span>
          </div>
        </Button>

        <!-- Singleplayer Options (only shown when clicked) -->
        <div v-if="showSingleplayerOptions" class="space-y-3 pl-4 border-l-2 border-gray-300">
          <div>
            <label class="text-sm font-medium mb-2 block">Gameplay mode</label>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                @click="gameMode = 'game'"
                :variant="gameMode === 'game' ? 'default' : 'outline'" 
                size="sm">
                Game
              </Button>
              <Button 
                @click="gameMode = 'match'"
                :variant="gameMode === 'match' ? 'default' : 'outline'" 
                size="sm">
                Match
              </Button>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">Bisca Type</label>
            <div class="grid grid-cols-2 gap-2">
              <Button 
                @click="singleplayerType = 3"
                :variant="singleplayerType === 3 ? 'default' : 'outline'" 
                size="sm">
                Bisca de 3
              </Button>
              <Button 
                @click="singleplayerType = 9"
                :variant="singleplayerType === 9 ? 'default' : 'outline'" 
                size="sm">
                Bisca de 9
              </Button>
            </div>
          </div>

          <Button @click="goToSingleplayer" class="w-full" size="sm">
            Start Game →
          </Button>
        </div>

        <!-- Multiplayer Button -->
        <Button 
          @click="goToMultiplayer" 
          class="h-20 text-lg"
          variant="outline">
          <div class="flex flex-col items-center">
            <span class="text-2xl mb-1">👥</span>
            <span class="font-bold">Multiplayer</span>
            <span class="text-xs opacity-80">Play against other players</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()

// Show selector only on home/play route
const showSelector = ref(true)
const showSingleplayerOptions = ref(false)
const singleplayerType = ref(3)
const gameMode = ref('game')

// Watch for route changes
watch(
  () => route.path,
  (newPath) => {
    // Show selector only on home or play page
    showSelector.value = newPath === '/' || newPath === '/play'
    // Reset options when leaving
    if (newPath !== '/') {
      showSingleplayerOptions.value = false
    }
  },
  { immediate: true }
)

const goToSingleplayer = () => {
  showSelector.value = false
  router.push({
    name: 'SinglePlayer',
    query: { type: singleplayerType.value,mode: gameMode.value }
  })
}

const goToMultiplayer = () => {
  showSelector.value = false
  router.push({
    name: 'Lobby'
  })
}
</script>
