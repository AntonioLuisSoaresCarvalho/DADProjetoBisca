import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './authStore'
import { useGameStore } from './gameStore'
import { useMatchStore } from './matchStore'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  const matchStore = useMatchStore()
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

  //Function to handle game state changes
  const handleMatchGameState = async (game) => {

    //Starts match
    if (!matchStore.db_match_id && game.is_match) {

      try {
        await matchStore.startMatch(
          game.game_type,
          game.player1,
          game.player2,
          game.stake
        )
      } catch (error) {
        console.error('Failed to create match:', error)
      }
    }
    else {  
      if (matchStore.db_match_id) console.log('DB_MATCH_ID already exists:', matchStore.db_match_id)
    }

    // Save each game of the match to the database
    if (game.started && !game.game_over && !game.db_game_id) {

      await gameStore.saveGameStart({
        id: game.id,
        type: game.game_type,
        player1: game.player1,
        player2: game.player2,
        match_id: matchStore.db_match_id,
        began_at: new Date().toISOString()
      })

    }

    // Update ended game on the database
    if (game.game_over && game.db_game_id) {

      await gameStore.saveGameEnd({
        db_game_id: game.db_game_id,
        player1: game.player1,
        player2: game.player2,
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        resigned_player: game.resigned_player || null
      })

      const shouldContinue = await matchStore.processGameResult({
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        is_draw: game.winner === 'draw'
      })

      if (game.match_over) {
        console.log('Match has ended!')
        console.log(`   Winner: Player ${game.match_winner}`)
      }
    }
  }

  /**
   * Handles database operations for standalone games
   */
  const handleStandaloneGameState = async (game) => {

    //Save game start to database
    if (game.started && !game.game_over && !game.db_game_id) {

      await gameStore.saveGameStart({
        id: game.id,
        type: game.game_type,
        player1: game.player1,
        player2: game.player2,
        match_id: null,
        began_at: new Date().toISOString()
      })
    }

    // Update ended game on the database
    if (game.game_over && game.complete && game.db_game_id) {

      await gameStore.saveGameEnd({
        db_game_id: game.db_game_id,
        player1: game.player1,
        player2: game.player2,
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        resigned_player: game.resigned_player || null
      })

      console.log('Game ended')
      console.log(`   Winner: ${game.winner === 'draw' ? 'Draw' : 'Player ' + game.winner}`)
    }
  }

  const handleGameStateChange = async (game) => {
    const currentUserId = authStore.currentUser?.id
    const isPlayer1 = currentUserId === game.player1

    // Only Player 1 saves to database
    if (!isPlayer1) {
      console.log('I am Player 2 - will NOT save to database')
      return
    }

    //if players are in a match
    if (game.is_match) {
      await handleMatchGameState(game)
    }
    //if players are in a standalone game
    else {
      await handleStandaloneGameState(game)
    }
  }
  //================================================

  const handleGameEvents = () => {
    socket.on('games', (games) => {
      console.log(`[Socket] Received games | count: ${games.length}`)
      gameStore.setGames(games)
      handleChatEvents()
    })

    socket.on('game-change', async (game) => {
      console.log(`[Socket] Game state changed | game: ${game.id}`)
      gameStore.setMultiplayerGame(game)
      await handleGameStateChange(game)
    })

    // NEW: Handle player join request notification
    socket.on('player-join-request', (data) => {
      console.log(`[Socket] Player join request:`, data)
      // Refresh games list to show pending player
      emitGetGames()
    })

    // NEW: Handle offer acceptance
    socket.on('offer-accepted', (data) => {
      console.log(`[Socket] Offer accepted:`, data)
      // Refresh games list to show accepted status
      emitGetGames()
    })

    // NEW: Handle offer rejection
    socket.on('offer-rejected', (data) => {
      console.log(`[Socket] Offer rejected:`, data)
      // Refresh games list to remove pending player
      emitGetGames()
    })

    socket.on('error', (error) => {
      console.error('[Socket] Server error:', error)
    })
  }

  const emitJoinGame = (game) => {
    console.log(`[Socket] Joining Game ${game.id}`)
    socket.emit('join-game', game.id, authStore.currentUser.id)
  }

  // NEW: Accept offer
  const emitAcceptOffer = (gameID) => {
    console.log(`[Socket] Accepting offer for game ${gameID}`)
    socket.emit('accept-offer', gameID, authStore.currentUser.id)
  }

  // NEW: Reject offer
  const emitRejectOffer = (gameID) => {
    console.log(`[Socket] Rejecting offer for game ${gameID}`)
    socket.emit('reject-offer', gameID, authStore.currentUser.id)
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

  const emitChatMessage = (gameID, message, user) => {
    console.log(`[Socket] Sending chat message to game ${gameID}`)
    socket.emit('send-chat-message', gameID, message, user)
  }

  const handleChatEvents = () => {
    socket.on('chat-message', (message) => {
      console.log(`[Socket] Received chat message:`, message)
      // The message will be handled by the component directly
    })
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
    emitAcceptOffer,
    emitRejectOffer,
    emitStartGame,
    emitPlayCard,
    emitContinueMatch,
    emitResignGame,
    emitChatMessage,
    handleChatEvents,
    joined,
  }
})
