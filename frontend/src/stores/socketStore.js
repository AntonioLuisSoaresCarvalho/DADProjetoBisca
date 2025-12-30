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

  /* HELPERS */
  const handleMatchGameState = async (game) => {
    console.log('🏆 [Match Mode] Processing game state...')
    
    // 1. Start match if not already started
    if (!matchStore.db_match_id && game.started && !game.game_over) {
      console.log('🆕 [Match] Creating match in database...')
      
      const player1Data = game.player1
      const player2Data = game.player2
      
      await matchStore.startMatch(
        game.game_type,
        player1Data,
        player2Data,
        game.stake
      )
      
      console.log('✅ [Match] Match created with ID:', matchStore.db_match_id)
    }

    // 2. Save individual game start within the match
    if (game.started && !game.game_over && !game.db_game_id) {
      console.log(`🎲 [Match Game ${game.current_game_number}] Saving game start...`)
      
      await gameStore.saveGameStart({
        id: game.id,
        type: game.game_type,
        player1: game.player1,
        player2: game.player2,
        match_id: matchStore.db_match_id,
        began_at: new Date().toISOString()
      })
      
      console.log('✅ [Match Game] Game start saved')
    }

    // 3. Save game end and process match result
    if (game.game_over && game.db_game_id) {
      console.log(`🏁 [Match Game ${game.current_game_number}] Game ended, saving results...`)
      
      // Save the game end to database
      await gameStore.saveGameEnd({
        db_game_id: game.db_game_id,
        player1: game.player1,
        player2: game.player2,
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        resigned_player: game.resigned_player || null
      })
      
      console.log('✅ [Match Game] Game end saved')

      // Process the result in the match (calculates marks, updates match state)
      const shouldContinue = await matchStore.processGameResult({
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        is_draw: game.winner === 'draw'
      })

      console.log(`📊 [Match] Game result processed. Continue: ${shouldContinue}`)
      
      // If match is over, it's already saved by matchStore.endMatch()
      if (game.match_over) {
        console.log('🏆 [Match] Match has ended!')
        console.log(`   Winner: Player ${game.match_winner}`)
        console.log(`   Marks: ${game.player1_marks} - ${game.player2_marks}`)
        console.log(`   Payout: ${game.winner_payout} coins`)
      }
    }
  }

  /**
   * Handles database operations for standalone games
   */
  const handleStandaloneGameState = async (game) => {
    console.log('🎮 [Standalone Game] Processing game state...')
    
    // 1. Save game start
    if (game.started && !game.game_over && !game.db_game_id) {
      console.log('🆕 [Standalone] Saving game start...')
      
      await gameStore.saveGameStart({
        id: game.id,
        type: game.game_type,
        player1: game.player1,
        player2: game.player2,
        match_id: null, // No match for standalone games
        began_at: new Date().toISOString()
      })
      
      console.log('✅ [Standalone] Game start saved')
    }

    // 2. Save game end
    if (game.game_over && game.complete && game.db_game_id) {
      console.log('🏁 [Standalone] Game ended, saving results...')
      
      await gameStore.saveGameEnd({
        db_game_id: game.db_game_id,
        player1: game.player1,
        player2: game.player2,
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        resigned_player: game.resigned_player || null
      })
      
      console.log('✅ [Standalone] Game end saved')
      console.log(`   Winner: ${game.winner === 'draw' ? 'Draw' : 'Player ' + game.winner}`)
      console.log(`   Score: ${game.points_player1} - ${game.points_player2}`)
    }
  }

  const handleGameStateChange = async (game) => {
    const currentUserId = authStore.currentUser?.id
    const isPlayer1 = currentUserId === game.player1
    
    console.log(`🎮 [Socket] Current User ID: ${currentUserId}`)
    console.log(`🎮 [Socket] Game Player1 ID: ${game.player1}`)
    console.log(`🎮 [Socket] Game Player2 ID: ${game.player2}`)
    console.log(`🎮 [Socket] Am I Player 1? ${isPlayer1}`)
    
    // Only Player 1 saves to database to avoid duplicates
    if (!isPlayer1) {
      console.log('👀 [Socket] I am Player 2 - will NOT save to database')
      return
    }

    console.log('💾 [Socket] I am Player 1 - handling database operations')

    // === MATCH MODE ===
    if (game.is_match) {
      await handleMatchGameState(game)
    } 
    // === STANDALONE GAME MODE ===
    else {
      await handleStandaloneGameState(game)
    }
  }
  //================================================
  
  const handleGameEvents = () => {
    socket.on('games', (games) => {
      console.log(`[Socket] Received games | count: ${games.length}`)
      gameStore.setGames(games)
    })
    
    socket.on('game-change', async (game) => {
      console.log(`[Socket] Game state changed | game: ${game.id}`)
      gameStore.setMultiplayerGame(game)
      await handleGameStateChange(game)
      
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