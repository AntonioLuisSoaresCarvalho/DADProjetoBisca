<template>
  <div class="bg-green-900 text-green-800">

    <section class="text-center bg-green-700 py-15 bg-linear-to-b text-white">
      <h1 class="text-5xl font-extrabold mb-4 drop-shadow-md">
        Bem-vindo à Plataforma Bisca
      </h1>

      <p class="text-lg opacity-90 max-w-2xl mx-auto mb-8">
        Joga Bisca de forma rápida, divertida e segura — sozinho ou contra outros jogadores online!
      </p>
    </section>

    <section class="py-16 px-6 mx-auto">
      <h2 class="text-3xl font-bold text-white  text-center mb-10">O que é Bisca?</h2>

      <p class="text-lg text-center text-white max-w-3xl mx-auto mb-8">
        Bisca é um dos jogos de cartas portugueses mais populares. Fácil de aprender, rápido de jogar,
        e cheio de estratégia — perfeito para desafiar amigos ou competir com jogadores online!
      </p>

      <div class="grid md:grid-cols-3 gap-10 mt-10">

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3">🃏</div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Cartas</h3>
          <p class="text-sm">Jogo tradicional com baralho de 40 cartas (sem 8, 9 e 10).</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3">⚔️</div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Duelo</h3>
          <p class="text-sm">Partidas sempre entre dois jogadores — simples e competitivo.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3">🏆</div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Vitória</h3>
          <p class="text-sm">Ganha pontos, vence vazas e domina as partidas de Bisca.</p>
        </div>

      </div>
    </section>

    
    <section class="bg-green-900 py-16 px-6">
      <h2 class="text-3xl font-bold text-center text-white mb-10">
        Como Funciona a Plataforma?
      </h2>

      <div class="grid md:grid-cols-3 gap-10  mx-auto">

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3">🧍</div>
          <h3 class="font-bold text-xl mb-2">Cria a tua conta</h3>
          <p class="text-sm">
            Regista-te gratuitamente e recebe 10 moedas de boas-vindas!
          </p>
        </div>

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3">🎮</div>
          <h3 class="font-bold text-xl mb-2">Escolhe como jogar</h3>
          <p class="text-sm">
            Joga sozinho contra o bot ou desafia outros jogadores online.
          </p>
        </div>

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3">⭐</div>
          <h3 class="font-bold text-xl mb-2">Sobe no ranking</h3>
          <p class="text-sm">
            Acumula vitórias e sobe nos leaderboards globais!
          </p>
        </div>

      </div>
    </section>

    <section class="py-16 px-6  mx-auto">
      <h2 class="text-3xl font-bold text-white text-center mb-12">Funcionalidades</h2>

      <div class="grid md:grid-cols-2 gap-8">

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">✔ Single-player</h3>
          <p>Desafia o bot e treina a tua estratégia.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">✔ Multiplayer</h3>
          <p>Joga em tempo real contra outros jogadores.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">✔ Histórico e Estatísticas</h3>
          <p>Acompanha as tuas vitórias, capotes e bandeiras.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">✔ Economia de Moedas</h3>
          <p>Ganha, aposta e compra moedas através da plataforma.</p>
        </div>

      </div>
    </section>

     <template v-if="!auth.user">
        <section class="text-center py-16 bg-green-700 text-white">
          <h2 class="text-3xl font-bold mb-4">Pronto para Começar?</h2>

          <p class="opacity-90 mb-8">
            Cria já a tua conta e entra no mundo competitivo da Bisca online.
          </p>

          <router-link
            to="/register"
            class="px-10 py-3 bg-white text-green-700 rounded-lg font-semibold shadow hover:bg-green-100 transition"
          >
            Criar Conta Gratuitamente
          </router-link>
        </section>
     </template>

  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore";
const auth = useAuthStore();

</script>
