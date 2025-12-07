<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSocketStore } from '@/stores/socket'

const socketStore = useSocketStore()

const status = ref('Disconnected')
const messageToSend = ref('')
const messages = ref([])

const onEcho = (msg) => {
  messages.value.push('Servidor: ' + msg)
}

onMounted(() => {
  status.value = socketStore.isConnected ? 'Connected' : 'Disconnected'

  socketStore.socket.on('connect', () => {
    status.value = 'Connected'
  })
  socketStore.socket.on('disconnect', () => {
    status.value = 'Disconnected'
  })

  socketStore.socket.on('echo', onEcho)
})

function sendMessage() {
  if (!messageToSend.value.trim()) return

  messages.value.push('Tu: ' + messageToSend.value)
  socketStore.socket.emit('echo', messageToSend.value)
  messageToSend.value = ''
}

onBeforeUnmount(() => {
  socketStore.socket.off('echo', onEcho)
})
</script>

<template>
  <section class="bg-green-700 text-white text-center py-16 px-4">
    <div class="max-w-[700px] mx-auto">
      <h2 class="text-3xl font-semibold mb-2">Comunicação em Tempo Real</h2>
      <p class="mb-8 opacity-90">
        Esta secção demonstra o canal de WebSockets usado pela plataforma Bisca
        para trocar mensagens em tempo real entre os jogadores.
      </p>

      <div class="bg-white text-gray-900 rounded-lg p-6 shadow-lg text-left">
        <p class="mb-4">
          Estado:
          <strong
            :class="status === 'Connected' ? 'text-green-600' : 'text-red-600'"
          >
            {{ status }}
          </strong>
        </p>

        <label class="block text-sm mb-2">
          Mensagem de teste
          <input
            v-model="messageToSend"
            placeholder="Escreve uma mensagem"
            class="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 focus:border-green-600 focus:ring focus:ring-green-400/40 outline-none"
          />
        </label>

        <button
          @click="sendMessage"
          class="mt-3 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Enviar
        </button>

        <ul class="mt-4 list-none p-0 text-sm">
          <li
            v-for="(m, i) in messages"
            :key="i"
            class="border-b last:border-none py-1 border-gray-200"
          >
            {{ m }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
