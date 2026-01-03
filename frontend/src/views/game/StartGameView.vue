<template>
  <div class="container mx-auto p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 text-white">Bisca</h1>
        <p class="text-white">Escolha o modo de jogo e comece a jogar!</p>
      </div>

      <!-- Game Mode Selector Component -->
      <GameModeSelector />

      <!-- Optional: Quick Stats or Info Section -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl mb-2">🤖</div>
              <h3 class="font-bold mb-2">Modo Singleplayer</h3>
              <p class="text-sm text-gray-600">
                Jogue contra o nosso bot inteligente. Perfeito para praticar estratégias!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-center">
              <div class="text-3xl mb-2">👥</div>
              <h3 class="font-bold mb-2">Modo Multiplayer</h3>
              <p class="text-sm text-gray-600">
                Desafie outros jogadores em tempo real. Ganhe moedas e suba no ranking!
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
                Jogue matches até 4 marcas com apostas de 3 a 100 moedas!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Optional: How to Play Section -->
      <Card class="mt-12">
        <CardHeader>
          <CardTitle>📖 Como Jogar</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold mb-2">🎯 Objetivo do Jogo</h4>
              <p class="text-sm text-gray-600 mb-4">
                Ganhe mais pontos que o seu oponente capturando cartas de valor durante as rondas. 
                O jogador com mais pontos no final vence!
              </p>
              
              <h4 class="font-semibold mb-2">🃏 Valores das Cartas</h4>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Ás: 11 pontos</li>
                <li>• 7: 10 pontos</li>
                <li>• Rei: 4 pontos</li>
                <li>• Valete: 3 pontos</li>
                <li>• Rainha: 2 pontos</li>
                <li>• Outras cartas: 0 pontos</li>
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

<style scoped>
/* Optional: Add any custom styles here */
</style>