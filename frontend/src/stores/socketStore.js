import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './authStore'
import { useGameStore } from './gameStore'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  const joined = ref(false)
  
  const emitJoin = (user) => {
    if (joined.value) return
    console.log(`[Socket] Joining Server`)
    socket.emit('join', user)
    joined.value = true
  }
  
  const emitLeave = () => {
    socket.emit('leave')
    console.log(`[Socket] Leaving Server`)
    joined.value = false
  }
  
  const handleConnection = () => {
    if (socket.connected) {
      console.log('[Socket] Already connected on mount')
      if (authStore.isLoggedIn && !joined.value) {
        emitJoin(authStore.currentUser)
      }
    }
    
    socket.on('connect', () => {
      console.log(`[Socket] Connected -- ${socket.id}`)
      if (authStore.isLoggedIn && !joined.value) {
        emitJoin(authStore.currentUser)
      }
    })
    
    socket.on('disconnect', () => {
      joined.value = false
      console.log(`[Socket] Disconnected -- ${socket.id}`)
    })
  }
  
  const emitGetGames = () => {
    console.log('[Socket] Requesting games list')
    socket.emit('get-games')
  }
  
  const cancelMatchMaking = (user) => {
    console.log('[Socket] Canceling games for user:', user?.id)
    socket.emit('cancel-game', user)
  }
  
  const handleGameEvents = () => {
    socket.on('games', (games) => {
      console.log(`[Socket] Received games | count: ${games.length}`)
      gameStore.setGames(games)
    })
    
    socket.on('game-change', (game) => {
      console.log(`[Socket] Game state changed | game: ${game.id}`)
      gameStore.setMultiplayerGame(game)
    })
    
    socket.on('error', (error) => {
      console.error('[Socket] Server error:', error)
    })
  }
  
  const emitJoinGame = (game) => {
    console.log(`[Socket] Joining Game ${game.id}`)
    socket.emit('join-game', game.id, authStore.currentUser.id)
  }
  
  const emitStartGame = (game) => {
    console.log(`[Socket] Starting Game ${game.id}`)
    socket.emit('start-game', game.id)
  }
  
  const emitPlayCard = (gameID, card, user) => {
    console.log(`[Socket] Playing card ${card.name} in game ${gameID}`)
    socket.emit('play-card', gameID, card, user)
  }
  
  const emitContinueMatch = (gameID) => {
    console.log(`[Socket] Continue match for game ${gameID}`)
    socket.emit('continue-match', gameID)
  }
  
  const emitResignGame = (gameID, user) => {
    console.log(`[Socket] Player ${user.id} resigning from game ${gameID}`)
    socket.emit('resign-game', gameID, user)
  }
  
  return {
    socket,
    emitJoin,
    emitLeave,
    handleConnection,
    emitGetGames,
    handleGameEvents,
    cancelMatchMaking,
    emitJoinGame,
    emitStartGame,
    emitPlayCard,
    emitContinueMatch,
    emitResignGame,
    joined,
  }
})