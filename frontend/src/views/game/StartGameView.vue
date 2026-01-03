<template>
  <div class="container mx-auto p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 text-white">Bisca</h1>
        <p class="text-white">Pick the game mode you want to play!</p>
      </div>

      <!-- Game Mode Selector Component -->
      <GameModeSelector />

      <!-- Optional: Quick Stats or Info Section -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl mb-2">🤖</div>
              <h3 class="font-bold mb-2">Singleplayer mode</h3>
              <p class="text-sm text-gray-600">
                Play against our AI bot. Challenge yourself and improve your skills!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl mb-2">👥</div>
              <h3 class="font-bold mb-2">Multiplayer mode</h3>
              <p class="text-sm text-gray-600">
                Challenge other players online and win exciting prizes!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl mb-2">🏆</div>
              <h3 class="font-bold mb-2">Matches & Stakes</h3>
              <p class="text-sm text-gray-600">
                Play matches until you obtain 4 marks with stakes from 3 until 100 coins!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Optional: How to Play Section -->
      <Card class="mt-12">
        <CardHeader>
          <CardTitle>📖 How to play</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold mb-2">🎯 Main goal</h4>
              <p class="text-sm text-gray-600 mb-4">
                Win more points than your opponent by gaining the best cards during tricks. 
                The player with more points in the final round wins!
              </p>
              
              <h4 class="font-semibold mb-2">🃏 Cards' values</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Ás: 11 points</li>
                <li>• 7: 10 points</li>
                <li>• King: 4 points</li>
                <li>• Valet: 3 points</li>
                <li>• Queen: 2 points</li>
                <li>• Other cards: 0 points</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold mb-2">🏁 Marcas em Matches</h4>
              <ul class="text-sm text-gray-600 space-y-1 mb-4">
                <li>• <strong>BANDEIRA (120 pts):</strong> 4 marcas - vitória imediata!</li>
                <li>• <strong>CAPOTE (91-119 pts):</strong> 2 marcas</li>
                <li>• <strong>RISCA (61-90 pts):</strong> 1 marca</li>
                <li>• <strong>Menos de 61 pts:</strong> Sem marca</li>
              </ul>
              
              <h4 class="font-semibold mb-2">💰 Sistema de Moedas</h4>
              <p class="text-sm text-gray-600">
                Jogos custam 2 moedas. Matches têm apostas de 3-100 moedas. 
                O vencedor leva quase tudo (comissão de 1 moeda)!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import GameModeSelector from '@/components/GameModeSelector.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
</script>