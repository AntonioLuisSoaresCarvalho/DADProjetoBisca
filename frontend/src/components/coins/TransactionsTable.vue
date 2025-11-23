<template>
  <div class="bg-white rounded-lg shadow border border-green-300 overflow-x-auto">
    <table class="min-w-full text-sm text-left">
      <thead class="bg-green-100">
        <tr>
          <th class="px-4 py-2 border-b border-green-200">Data</th>
          <th class="px-4 py-2 border-b border-green-200">Tipo</th>
          <th class="px-4 py-2 border-b border-green-200">Jogo/Partida</th>
          <th class="px-4 py-2 border-b border-green-200 text-right">Moedas</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="t in transactions"
          :key="t.id"
          class="hover:bg-green-50"
        >
          <td class="px-4 py-2 border-b border-green-100">
            {{ formatDate(t.transaction_datetime) }}
          </td>

          <td class="px-4 py-2 border-b border-green-100">
           <span class="text-green-700 font-bold " >{{ t.type.operation }}</span>  / {{ t.type.name }}
          </td>

          <td class="px-4 py-2 border-b border-green-100 text-sm text-green-700">
            <span v-if="t.game_id">Jogo #{{ t.game_id }}</span>
            <span v-else-if="t.match_id">Partida #{{ t.match_id }}</span>
            <span v-else>-</span>
          </td>

          <td
            class="px-4 py-2 border-b border-green-100 text-right font-bold"
            :class="t.coins >= 0 ? 'text-green-700' : 'text-red-600'"
          >
            {{ t.coins > 0 ? '+' : '' }}{{ t.coins }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  transactions: {
    type: Array,
    required: true
  }
});

const formatDate = (dt) => {
  if (!dt) return "-";
  return new Date(dt).toLocaleString();
};
</script>
