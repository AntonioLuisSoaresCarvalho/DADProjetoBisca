<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'

const props = defineProps({
  gameId: {
    type: Number,
    required: true
  }
})

const authStore = useAuthStore()
const socketStore = useSocketStore()

const messages = ref([])
const newMessage = ref('')
const chatContainer = ref(null)

const currentUserId = computed(() => authStore.currentUser?.id)

const sendMessage = () => {
  const text = newMessage.value.trim()
  if (!text || !props.gameId) return

  socketStore.emitChatMessage(props.gameId, text, authStore.currentUser)
  newMessage.value = ''
}

const handleKeyPress = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// Listen for incoming messages
socketStore.socket.on('chat-message', (message) => {
  messages.value.push(message)
  scrollToBottom()
})

watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg border shadow-sm">
    <!-- Header -->
    <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
      <h3 class="font-semibold text-gray-800">💬 Chat</h3>
    </div>

    <!-- Messages Container -->
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      style="max-height: 400px;">

      <div v-if="messages.length === 0" class="text-center text-gray-400 text-sm py-8">
        No messages yet. Say hi! 👋
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="[
          'flex',
          msg.userId === currentUserId ? 'justify-end' : 'justify-start'
        ]">
        <div
          :class="[
            'max-w-[75%] rounded-lg px-3 py-2 break-words',
            msg.userId === currentUserId
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          ]">
          <div class="text-xs opacity-75 mb-1">
            {{ msg.userName }}
          </div>
          <div class="text-sm">
            {{ msg.message }}
          </div>
          <div class="text-xs opacity-60 mt-1">
            {{ new Date(msg.timestamp).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit'
            }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-3 border-t bg-gray-50 rounded-b-lg">
      <div class="flex gap-2">
        <input
          v-model="newMessage"
          @keypress="handleKeyPress"
          type="text"
          placeholder="Type a message..."
          class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          maxlength="200"
        />
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium">
          Send
        </button>
      </div>
    </div>
  </div>
</template>
