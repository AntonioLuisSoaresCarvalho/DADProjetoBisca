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
  <section class="ws-section">
    <div class="ws-container">
      <h2 class="ws-title">Comunicação em Tempo Real</h2>
      <p class="ws-text">
        Esta secção demonstra o canal de WebSockets usado pela plataforma Bisca
        para trocar mensagens em tempo real entre os jogadores.
      </p>

      <div class="ws-card">
        <p class="ws-status">
          Estado:
          <strong :class="status === 'Connected' ? 'ws-ok' : 'ws-bad'">
            {{ status }}
          </strong>
        </p>

        <label class="ws-label">
          Mensagem de teste
          <input
            v-model="messageToSend"
            placeholder="Escreve uma mensagem"
            class="ws-input"
          />
        </label>

        <button @click="sendMessage" class="ws-button">
          Enviar
        </button>

        <ul class="ws-messages">
          <li v-for="(m, i) in messages" :key="i">{{ m }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ws-section {
  background: #037b2b;
  padding: 4rem 1rem;
  color: #ffffff;
  text-align: center;
}
.ws-container {
  max-width: 700px;
  margin: 0 auto;
}
.ws-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.ws-text {
  margin-bottom: 2rem;
  opacity: 0.9;
}
.ws-card {
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: left;
}
.ws-status {
  margin-bottom: 1rem;
}
.ws-ok {
  color: #16a34a;
}
.ws-bad {
  color: #dc2626;
}
.ws-label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}
.ws-input {
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  outline: none;
}
.ws-input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 1px #16a34a33;
}
.ws-button {
  margin-top: 0.8rem;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  background: #16a34a;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.ws-button:hover {
  background: #15803d;
}
.ws-messages {
  margin-top: 1rem;
  list-style: none;
  padding: 0;
  font-size: 0.9rem;
}
</style>
