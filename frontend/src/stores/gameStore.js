import { defineStore } from 'pinia'
import { ref, inject, computed } from 'vue'
import { useAuthStore } from './authStore'
import { useApiStore } from './api'
import { toast } from 'vue-sonner'

export const useGameStore = defineStore('game', () => {
  const hand_player1 = ref([])
  const hand_player2 = ref([])
  const deck = ref([])
  const deck_index = ref(0)
  const card_played_player1 = ref(null)
  const card_played_player2 = ref(null)
  const turn_player = ref(null)
  const trump_suit = ref(null)
  const trump_card = ref(null)
  const game_over = ref(false)
  const points_player1 = ref(0)
  const points_player2 = ref(0)
  const winner = ref(null)
  const current_round = ref(0)
  const total_rounds = ref(20)
  const round_starter = ref(null)

  const game_type = ref(9) // 3 ou 9
  const game_mode = ref('game') // 'game' ou 'match'
  const player1_id = ref(null)
  const player2_id = ref(null)

  const types_of_games = [3, 9]
  const types_of_matches = ['game', 'match']

  const currentDbGameId = ref(null)
  const previousGameNumber = ref(0)

  const authStore = useAuthStore()
  const apiStore = useApiStore()
  const socket = inject('socket')

  const SUITS = [
    { key: 'hearts', name: 'Copas', symbol: '♥' },
    { key: 'diamonds', name: 'Ouros', symbol: '♦' },
    { key: 'clubs', name: 'Paus', symbol: '♣' },
    { key: 'spades', name: 'Espadas', symbol: '♠' }
  ]

  const RANKS = [
    { rank: 'A', name: 'Ás', points: 11 },
    { rank: '7', name: '7', points: 10 },
    { rank: 'K', name: 'Rei', points: 4 },
    { rank: 'J', name: 'Valete', points: 3 },
    { rank: 'Q', name: 'Rainha', points: 2 },
    { rank: '6', name: '6', points: 0 },
    { rank: '5', name: '5', points: 0 },
    { rank: '4', name: '4', points: 0 },
    { rank: '3', name: '3', points: 0 },
    { rank: '2', name: '2', points: 0 }
  ]

  function generateDeck() {
    const newDeck = []
    for (const suit of SUITS) {
      for (let i = 0; i < RANKS.length; i++) {
        const rank = RANKS[i]
        newDeck.push({
          id: `${rank.rank}_of_${suit.key}`,
          suit: suit.key,
          suitSymbol: suit.symbol,
          rank: rank.rank,
          name: `${rank.name} de ${suit.name}`,
          points: rank.points,
          order: i
        })
      }
    }
    return newDeck
  }

  function shuffle(array) {
    const a = array.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /**
   * Verifica se é obrigatório seguir o naipe
   * Retorna true quando não há mais cartas para comprar do baralho
   */
  function mustFollowSuit() {
    return deck_index.value >= deck.value.length
  }

  /**
   * Obtém as cartas válidas que um jogador pode jogar
   * @param {Array} playerHand - Mão do jogador
   * @param {Object} leadCard - Primeira carta jogada na rodada (ou null)
   * @returns {Array} - Cartas que o jogador pode jogar
   */
  function getValidCards(playerHand, leadCard) {
    // Se ainda há cartas no deck OU ninguém jogou ainda, todas as cartas são válidas
    if (!mustFollowSuit() || !leadCard) {
      return playerHand
    }
    
    // Verificar se o jogador tem cartas do mesmo naipe da carta jogada
    const sameSuitCards = playerHand.filter(card => card.suit === leadCard.suit)
    
    if (sameSuitCards.length > 0) {
      // Tem cartas do mesmo naipe - DEVE jogar uma delas
      console.log(`⚠️ Must follow suit: ${leadCard.suit}`)
      return sameSuitCards
    }
    
    // Não tem cartas do mesmo naipe - pode jogar qualquer carta
    console.log(`✓ No cards of suit ${leadCard.suit} - can play any card`)
    return playerHand
  }

  function startGame(type = 3, mode = 'game') {
    const newDeck = shuffle(generateDeck())
    deck.value = newDeck

    // Guarda o tipo e modo do jogo
    game_type.value = type
    game_mode.value = mode

    // Set trump card (last card in deck)
    trump_card.value = deck.value[deck.value.length - 1]
    trump_suit.value = trump_card.value.suit

    // Deal cards to each player
    hand_player1.value = deck.value.slice(0, type)
    hand_player2.value = deck.value.slice(type, type * 2)
    deck_index.value = type * 2 // Next card to draw

    // Random first player
    turn_player.value = Math.random() < 0.5 ? 1 : 2
    round_starter.value = turn_player.value

    // Reset game state
    current_round.value = 0
    points_player1.value = 0
    points_player2.value = 0
    card_played_player1.value = null
    card_played_player2.value = null
    game_over.value = false
    winner.value = null

    console.log(`Game started! Bisca de ${type} | Mode: ${mode}`)
    console.log(`Game started! Player ${turn_player.value} goes first`)
    console.log(`Trump card: ${trump_card.value.name}`)
  }

  function determineTrickWinner(card1, card2) {
    // Same suit: higher rank wins (lower order = higher rank)
    if (card1.suit === card2.suit) {
      return card1.order < card2.order ? 1 : 2
    }
    // Player 1's card is trump
    if (card1.suit === trump_suit.value) return 1
    // Player 2's card is trump
    if (card2.suit === trump_suit.value) return 2
    // No trump: first player wins
    return round_starter.value
  }

  function playCard(card, player) {
    if (game_over.value) {
      console.log('❌ Game is over')
      return false
    }
    
    if (turn_player.value !== player) {
      console.log('❌ Not your turn')
      return false
    }

    const hand = player === 1 ? hand_player1.value : hand_player2.value
    const idx = hand.findIndex(c => c.id === card.id)
    
    if (idx === -1) {
      console.log('❌ Card not in hand')
      return false
    }

    // ===== NOVA VALIDAÇÃO: Verificar regra de assistir =====
    if (player === 1) { // Validação apenas para jogador humano
      const leadCard = card_played_player2.value // Se o bot jogou primeiro
      const validCards = getValidCards(hand, leadCard)
      
      if (!validCards.find(c => c.id === card.id)) {
        console.log('❌ Invalid card! Must follow suit when possible.')
        toast.error('Deve jogar uma carta do mesmo naipe!')
        return false
      }
    }
    // ======================================================

    // Remove card from hand
    hand.splice(idx, 1)

    // Place card on table
    if (player === 1) {
      card_played_player1.value = card
      console.log(`✓ Player 1 played: ${card.name}`)
    } else {
      card_played_player2.value = card
      console.log(`✓ Player 2 (Bot) played: ${card.name}`)
    }

    // Check if round is complete
    if (card_played_player1.value && card_played_player2.value) {
      resolveRound()
    } else {
      // Switch turn to other player
      turn_player.value = player === 1 ? 2 : 1
      console.log(`Turn switched to Player ${turn_player.value}`)
    }

    return true
  }

  function resolveRound() {
    const c1 = card_played_player1.value
    const c2 = card_played_player2.value
    if (!c1 || !c2) return

    console.log(`Resolving round ${current_round.value + 1}...`)

    const winnerPlayer = determineTrickWinner(c1, c2)
    const totalPoints = (c1.points || 0) + (c2.points || 0)

    if (winnerPlayer === 1) {
      points_player1.value += totalPoints
    } else {
      points_player2.value += totalPoints
    }

    console.log(`Player ${winnerPlayer} wins the round! (+${totalPoints} points)`)
    console.log(`Score: P1=${points_player1.value} P2=${points_player2.value}`)

    current_round.value++

    // Wait before drawing cards and starting next round
    setTimeout(() => {
      drawCards(winnerPlayer)
      startNextRound(winnerPlayer)
    }, 2000)
  }

  function drawCards(winnerPlayer) {
    // Check if there are cards left to draw
    if (deck_index.value >= deck.value.length) {
      console.log('No more cards to draw')
      return
    }

    // Winner draws first
    if (winnerPlayer === 1) {
      if (deck_index.value < deck.value.length) {
        hand_player1.value.push(deck.value[deck_index.value])
        console.log(`Player 1 draws: ${deck.value[deck_index.value].name}`)
        deck_index.value++
      }
      if (deck_index.value < deck.value.length) {
        hand_player2.value.push(deck.value[deck_index.value])
        console.log(`Player 2 draws: ${deck.value[deck_index.value].name}`)
        deck_index.value++
      }
    } else {
      if (deck_index.value < deck.value.length) {
        hand_player2.value.push(deck.value[deck_index.value])
        console.log(`Player 2 draws: ${deck.value[deck_index.value].name}`)
        deck_index.value++
      }
      if (deck_index.value < deck.value.length) {
        hand_player1.value.push(deck.value[deck_index.value])
        console.log(`Player 1 draws: ${deck.value[deck_index.value].name}`)
        deck_index.value++
      }
    }
  }

  function startNextRound(lastWinner) {
    // Check if game is over (no cards left in both hands)
    if (hand_player1.value.length === 0 && hand_player2.value.length === 0) {
      endGame()
      return
    }

    // Clear table
    card_played_player1.value = null
    card_played_player2.value = null

    // Winner of last round starts next round
    turn_player.value = lastWinner
    round_starter.value = lastWinner

    console.log(`Starting round ${current_round.value + 1}`)
    console.log(`Player ${turn_player.value} starts this round`)
    console.log(`Cards in deck: ${deck.value.length - deck_index.value}`)

    // If bot starts, trigger bot play
    if (turn_player.value === 2) {
      setTimeout(() => botPlay(), 800)
    }
  }

  function botPlay() {
    if (game_over.value || turn_player.value !== 2) {
      console.log(`Bot cannot play: game_over=${game_over.value}, turn=${turn_player.value}`)
      return
    }

    const hand = hand_player2.value
    if (!hand.length) {
      console.log('Bot has no cards!')
      return
    }

    // ===== NOVA LÓGICA: Obter cartas válidas considerando a regra de assistir =====
    const leadCard = card_played_player1.value
    const validCards = getValidCards(hand, leadCard)

    console.log(`🤖 Bot choosing from ${validCards.length} valid cards`)
    // =============================================================================

    let chosen = null

    if (card_played_player1.value === null) {
      // Bot is starting: play lowest non-trump card from valid cards
      const nonTrump = validCards.filter(c => c.suit !== trump_suit.value)
      const pool = nonTrump.length ? nonTrump : validCards
      chosen = pool.sort((a, b) => a.points - b.points)[0]
      console.log('🤖 Bot is starting the round')
    } else {
      // Bot is responding: try to win if possible, mas apenas com cartas válidas
      const c1 = card_played_player1.value
      const canWin = validCards.filter(c => determineTrickWinner(c1, c) === 2)

      if (canWin.length > 0) {
        // Play weakest winning card from valid cards
        chosen = canWin.sort((a, b) => b.order - a.order)[0]
        console.log('🤖 Bot trying to win the trick with valid card')
      } else {
        // Can't win: play lowest point card from valid cards
        chosen = validCards.sort((a, b) => a.points - b.points)[0]
        console.log('🤖 Bot cannot win, playing lowest valid card')
      }
    }

    if (chosen) {
      console.log(`🤖 Bot chose: ${chosen.name}`)
      playCard(chosen, 2)
    }
  }

  function endGame() {
    game_over.value = true

    if (points_player1.value > points_player2.value) {
      winner.value = 1
    } else if (points_player2.value > points_player1.value) {
      winner.value = 2
    } else {
      winner.value = 'draw'
    }

    console.log('Game Over!')
    console.log(`Final Score: P1=${points_player1.value} P2=${points_player2.value}`)
    console.log(`Winner: ${winner.value}`)
  }

  function getGameResult() {
    return {
      winner: winner.value === 'draw' ? null : winner.value,
      points_player1: points_player1.value,
      points_player2: points_player2.value,
      is_draw: winner.value === 'draw'
    }
  }

  // ----- ---------------------------- -----------
  // ----- Added for multiplayer games: -----------
  // ----- ---------------------------- -----------

  const games = ref([])

  const createGame = (gameConfig) => {
    if (!authStore.currentUser) {
      toast.error('You must be logged in to create a game')
      return
    }

    if (!socket || !socket.connected) {
      toast.error('Not connected to server. Please refresh the page.')
      return
    }

    socket.emit('create-game', {
      type: gameConfig.type,
      mode: gameConfig.mode,
      stake: gameConfig.stake,
      creator: authStore.currentUser.id
    })
  }

  const setGames = (newGames) => {
    games.value = newGames
    console.log(`[Game] Games changed | game count ${games.value.length}`)
  }

  const myGames = computed(() => {
    return games.value.filter((game) => game.creator == authStore.currentUser.id)
  })

  const availableGames = computed(() => {
    return games.value.filter((game) => game.creator != authStore.currentUser.id)
  })

  const multiplayerGame = ref({})

  const setMultiplayerGame = (game) => {
    if (game.is_match) {
      if (game.current_game_number > previousGameNumber.value) {
        currentDbGameId.value = null
        previousGameNumber.value = game.current_game_number
      }
    } else {
      // For standalone games - clear the currentDbGameId
      if (multiplayerGame.value && multiplayerGame.value.id !== game.id) {
        currentDbGameId.value = null
      }
    }
    
    // Atribui o currentDbGameId ao objeto game para uso nas condições
    game.db_game_id = currentDbGameId.value

    multiplayerGame.value = game
    console.log(`[Game] Multiplayer Game changed | round ${game.current_round}`)
  }

  const saveGameStart = async (gameData) => {
    if (currentDbGameId.value) {
      console.log('⚠️ Game already saved with ID:', currentDbGameId.value)
      return { game: { id: currentDbGameId.value } }
    }
    
    try {
      const response = await apiStore.createGame({
        type: gameData.type,
        player1_user_id: gameData.player1,
        player2_user_id: gameData.player2,
        match_id: gameData.match_id || null,
        began_at: new Date().toISOString(),
        status: 'Playing'
      })

      console.log('✅ [saveGameStart] Game saved to database:', response.game)
      
      const gameId = response.game.id
      currentDbGameId.value = gameId
      
      // Sync multiplayer game
      if (multiplayerGame.value?.id === gameData.id) {
        multiplayerGame.value.db_game_id = gameId
      }

      return response
    } catch (error) {
      console.error('❌ [saveGameStart] Failed to save game start:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      throw error 
    }
  }

  const saveGameEnd = async (gameData) => {
    try {
      const dbGameId = gameData.db_game_id
      
      if (!dbGameId) {
        console.error('❌ No database game ID found')
        return
      }

      // Determine winner and loser
      let winnerUserId = null
      let loserUserId = null
      let isDraw = false

      if (gameData.resigned_player) {
        // Resignation case
        const resignedIsPlayer1 = gameData.resigned_player === 1
        winnerUserId = resignedIsPlayer1 ? gameData.player2 : gameData.player1
        loserUserId = resignedIsPlayer1 ? gameData.player1 : gameData.player2
      } else if (gameData.winner === 'draw') {
        isDraw = true
      } else {
        winnerUserId = gameData.winner === 1 ? gameData.player1 : gameData.player2
        loserUserId = gameData.winner === 1 ? gameData.player2 : gameData.player1
      }

      const response = await apiStore.updateGame(dbGameId, {
        status: 'Ended',
        player1_points: gameData.points_player1,
        player2_points: gameData.points_player2,
        is_draw: isDraw,
        winner_user_id: winnerUserId,
        loser_user_id: loserUserId,
        ended_at: new Date().toISOString(),
        resigned_player: gameData.resigned_player || null
      })

      console.log('✅ Game end saved to database:', response.game)
      return response.game
    } catch (error) {
      console.error('❌ Failed to save game end:', error)
      toast.error('Failed to update game in database')
    }
  }

  return {
    hand_player1,
    hand_player2,
    card_played_player1,
    card_played_player2,
    trump_suit,
    trump_card,
    turn_player,
    game_over,
    points_player1,
    points_player2,
    winner,
    current_round,
    deck_index,
    deck,
    startGame,
    playCard,
    botPlay,
    getGameResult,
    types_of_games,
    types_of_matches,
    getValidCards,
    mustFollowSuit,

    // Multiplayer
    games,
    createGame,
    setGames,
    myGames,
    availableGames,
    multiplayerGame,
    setMultiplayerGame,
    saveGameStart,
    saveGameEnd
  }
})