<template>
  <div class="bg-green-900 text-green-800">

    <section class="text-center bg-green-700 py-15 bg-linear-to-b text-white">
      <h1 class="text-5xl font-extrabold mb-4 drop-shadow-md">
        Welcome to the Bisca Platform
      </h1>

      <p class="text-lg opacity-90 max-w-2xl mx-auto mb-8">
        Play Bisca in a fun, quick, and secure way — alone or against other players online!
      </p>
    </section>

    <section class="py-16 px-6 mx-auto">
      <h2 class="text-3xl font-bold text-white  text-center mb-10">What is Bisca?</h2>

      <p class="text-lg text-center text-white max-w-3xl mx-auto mb-8">
        Bisca is one of the most popular Portuguese card games. Easy to learn, quick to play,
        and full of strategy — perfect for challenging friends or competing with online players!
      </p>

      <div class="grid md:grid-cols-3 gap-10 mt-10">

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Cards</h3>
          <p class="text-sm">Traditional game played with a deck of 40 cards (without 8, 9 and 10).</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Duel</h3>
          <p class="text-sm">Matches always between two players — simple and competitive.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300 text-center">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2 text-green-800">Victory</h3>
          <p class="text-sm">Earn points, win tricks, and dominate Bisca matches.</p>
        </div>

      </div>
    </section>


    <section class="bg-green-900 py-16 px-6">
      <h2 class="text-3xl font-bold text-center text-white mb-10">
        How Does the Platform Work?
      </h2>

      <div class="grid md:grid-cols-3 gap-10  mx-auto">

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2">Create Your Account</h3>
          <p class="text-sm">
            Register for free and receive 10 welcome coins!
          </p>
        </div>

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2">Choose How to Play</h3>
          <p class="text-sm">
            Play solo against the bot or challenge other online players.
          </p>
        </div>

        <div class="text-center bg-white p-6 rounded-lg shadow border border-green-300">
          <div class="text-4xl mb-3"></div>
          <h3 class="font-bold text-xl mb-2">Climb the ranks</h3>
          <p class="text-sm">
            Accumulate victories and climb the global leaderboards!
          </p>
        </div>

      </div>
    </section>

    <section class="py-16 px-6  mx-auto">
      <h2 class="text-3xl font-bold text-white text-center mb-12">Functions</h2>

      <div class="grid md:grid-cols-2 gap-8">

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">Single-player</h3>
          <p>Challenge the bot and train your strategy.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">Multiplayer</h3>
          <p>Play in real-time against other players.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">History and Statistics</h3>
          <p>Track your victories, capotes, and bandeiras.</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow border border-green-300">
          <h3 class="font-bold text-xl text-green-800 mb-2">Coin Economy</h3>
          <p>Earn, bet, and buy coins through the platform.</p>
        </div>

      </div>
    </section>

     <template v-if="!auth.user">
        <section class="text-center py-16 bg-green-700 text-white">
          <h2 class="text-3xl font-bold mb-4">Ready to start?</h2>

          <p class="opacity-90 mb-8">
            Create your account now and enter the competitive world of online Bisca.
          </p>

          <router-link
            to="/register"
            class="px-10 py-3 bg-white text-green-700 rounded-lg font-semibold shadow hover:bg-green-100 transition"
          >
            Create a Free Account
          </router-link>
        </section>
     </template>

  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore";
const auth = useAuthStore();

</script>
