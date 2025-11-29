import { defineStore } from 'pinia'
import { inject, ref } from 'vue'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')        
  const isConnected = ref(false)

  const handleConnection = () => {
    socket.on('connect', () => {
      isConnected.value = true
      console.log(`[Socket] Connected -- ${socket.id}`)
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      console.log(`[Socket] Disconnected -- ${socket.id}`)
    })
  }

  return {
    socket,
    isConnected,
    handleConnection,
  }
})
