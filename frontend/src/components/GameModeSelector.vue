<template>
  <div class="flex justify-center items-center min-h-[60vh]">
    <Card class="w-[350px]">
      <CardHeader>
        <CardTitle>🎮 Escolher Jogo</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-6">
        <!-- MODE -->
        <div>
          <label class="text-sm font-medium mb-2 block">Modo de Jogo</label>
          <RadioGroup v-model="mode" class="flex gap-4">
            <div class="flex items-center gap-2">
              <RadioGroupItem value="single" id="single" />
              <Label for="single">Singleplayer</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="multi" id="multi" />
              <Label for="multi">Multiplayer</Label>
            </div>
          </RadioGroup>
        </div>

        <!-- BISCA TYPE -->
        <div>
          <label class="text-sm font-medium mb-2 block">Tipo de Bisca</label>
          <RadioGroup v-model="variant" class="flex gap-4">
            <div class="flex items-center gap-2">
              <RadioGroupItem value="3" id="b3" />
              <Label for="b3">Bisca de 3</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem value="9" id="b9" />
              <Label for="b9">Bisca de 9</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>

      <CardFooter>
        <Button @click="startGame" class="w-full">
          Começar Jogo
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useGameStore } from '@/stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const mode = ref('single')
const variant = ref('3')

const startGame = () => {
  const gameType = parseInt(variant.value)
  
  if (mode.value === 'single') {
    // Start singleplayer game
    gameStore.startGame(gameType, 'game')
    router.push({
      name: 'SinglePlayer',
      query: { type: gameType, mode: 'game' }
    })
  } else {
    // Go to multiplayer lobby
    router.push({
      name: 'Lobby',
      query: { type: gameType }
    })
  }
}
</script>