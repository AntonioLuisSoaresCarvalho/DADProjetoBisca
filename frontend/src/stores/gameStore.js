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
  const round_starter = ref(null)

  const game_type = ref(9) // 3 ou 9
  const game_mode = ref('game') // 'game' ou 'match'

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

  // Verifica se é obrigatório seguir o naipe
  function mustFollowSuit() {
    return deck_index.value >= deck.value.length
  }

  function getValidCards(playerHand, leadCard) {
    // If there are still cards in the deck or no one has played yet, all cards are valid
    if (!mustFollowSuit() || !leadCard) {
      return playerHand
    }
    
    // Verify if the player has cards of the same suit as the lead card
    const sameSuitCards = playerHand.filter(card => card.suit === leadCard.suit)
    
    // If the player has cards of the same suit as the lead card, return them else return all cards
    if (sameSuitCards.length > 0) {
      // Tem cartas do mesmo naipe - DEVE jogar uma delas
      return sameSuitCards
    }
    
    // Não tem cartas do mesmo naipe - pode jogar qualquer carta
    return playerHand
  }

  function startGame(type = 3, mode = 'game') {
    const newDeck = shuffle(generateDeck())
    deck.value = newDeck

    //Set game parameters
    game_type.value = type
    game_mode.value = mode

    // Define o trunfo
    trump_card.value = deck.value[deck.value.length - 1]
    trump_suit.value = trump_card.value.suit

    // Distribui cartas aos jogadores
    hand_player1.value = deck.value.slice(0, type)
    hand_player2.value = deck.value.slice(type, type * 2)
    deck_index.value = type * 2

    // Define quem começa (50-50%)
    turn_player.value = Math.random() < 0.5 ? 1 : 2
    round_starter.value = turn_player.value

    // Reset ao estado do jogo
    current_round.value = 0
    points_player1.value = 0
    points_player2.value = 0
    card_played_player1.value = null
    card_played_player2.value = null
    game_over.value = false
    winner.value = null
  }

  function determineTrickWinner(card1, card2) {
    // Se tiverem o mesmo suit a maior carta ganha
    if (card1.suit === card2.suit) {
      return card1.order < card2.order ? 1 : 2
    }

    if (card1.suit === trump_suit.value) return 1

    if (card2.suit === trump_suit.value) return 2
    // Se não se jogar trunfos e não forem do mesmo suit o player que começou a ronda ganha
    return round_starter.value
  }

  function playCard(card, player) {
    if (game_over.value) {
      return false
    }
    
    if (turn_player.value !== player) {
      return false
    }

    const hand = player === 1 ? hand_player1.value : hand_player2.value
    const idx = hand.findIndex(c => c.id === card.id)
    
    if (idx === -1) {
      return false
    }

    if (player === 1) { // Validação apenas para jogador humano
      const leadCard = card_played_player2.value // Se o bot jogou primeiro
      const validCards = getValidCards(hand, leadCard)
      
      if (!validCards.find(c => c.id === card.id)) {
        return false
      }
    }

    // Remove carta da mão
    hand.splice(idx, 1)


    if (player === 1) {
      card_played_player1.value = card
    } else {
      card_played_player2.value = card
    }

    // Verifica se a ronda foi completa
    if (card_played_player1.value && card_played_player2.value) {
      resolveRound()
    } else {
      // Troca o turno
      turn_player.value = player === 1 ? 2 : 1
    }

    return true
  }

  function resolveRound() {
    const c1 = card_played_player1.value
    const c2 = card_played_player2.value
    if (!c1 || !c2) return

    const winnerPlayer = determineTrickWinner(c1, c2)
    const totalPoints = (c1.points || 0) + (c2.points || 0)

    if (winnerPlayer === 1) {
      points_player1.value += totalPoints
    } else {
      points_player2.value += totalPoints
    }

    current_round.value++

    // Wait before drawing cards and starting next round
    setTimeout(() => {
      drawCards(winnerPlayer)
      startNextRound(winnerPlayer)
    }, 2000)
  }

  function drawCards(winnerPlayer) {
    // Verifica se ainda existem cartas a pilha
    if (deck_index.value >= deck.value.length) {
      return
    }

    // O vencedor da ultima ronda tira uma carta primeiro
    if (winnerPlayer === 1) {
      if (deck_index.value < deck.value.length) {
        hand_player1.value.push(deck.value[deck_index.value])
        deck_index.value++
      }
      if (deck_index.value < deck.value.length) {
        hand_player2.value.push(deck.value[deck_index.value])
        deck_index.value++
      }
    } else {
      if (deck_index.value < deck.value.length) {
        hand_player2.value.push(deck.value[deck_index.value])
        deck_index.value++
      }
      if (deck_index.value < deck.value.length) {
        hand_player1.value.push(deck.value[deck_index.value])
        deck_index.value++
      }
    }
  }

  function startNextRound(lastWinner) {
    // Verifica se o jogo acabou(nenhum jogar tem cartas)
    if (hand_player1.value.length === 0 && hand_player2.value.length === 0) {
      endGame()
      return
    }

    // Limpa a mesa
    card_played_player1.value = null
    card_played_player2.value = null

    // Vencedor da ultima ronda começa
    turn_player.value = lastWinner
    round_starter.value = lastWinner

    // Se for o bot a começar, dar trigger ao mesmo
    if (turn_player.value === 2) {
      setTimeout(() => botPlay(), 800)
    }
  }

  function botPlay() {
    if (game_over.value || turn_player.value !== 2) {
      return
    }

    const hand = hand_player2.value
    if (!hand.length) {
      return
    }

    const leadCard = card_played_player1.value
    const validCards = getValidCards(hand, leadCard)

    let chosen = null

    if (card_played_player1.value === null) {
      //Se o bot esta a começar: joga a carta mais baixa não trunfo das cartas válidas
      const nonTrump = validCards.filter(c => c.suit !== trump_suit.value)
      const pool = nonTrump.length ? nonTrump : validCards
      chosen = pool.sort((a, b) => a.points - b.points)[0]
    } else {
      //Bot tenta ganhar se possível, mas apenas com cartas válidas
      const c1 = card_played_player1.value
      const canWin = validCards.filter(c => determineTrickWinner(c1, c) === 2)

      if (canWin.length > 0) {
        // Jogar a carta mais baixa que dê para ganhar
        chosen = canWin.sort((a, b) => b.order - a.order)[0]
      } else {
        // Se não consegue ganhar jogar a carta mais baixa
        chosen = validCards.sort((a, b) => a.points - b.points)[0]
      }
    }

    if (chosen) {
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
    console.clear()
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
  // ----- MULTPLAYER GAME SECTION -----------
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
  }

  const myGames = computed(() => {
    return games.value.filter((game) => game.creator == authStore.currentUser.id)
  })

  const availableGames = computed(() => {
    return games.value.filter((game) => game.creator != authStore.currentUser.id)
  })

  const multiplayerGame = ref({})

  const setMultiplayerGame = (game) => {
    // If this is a match game, check if it's a new game
    if (game.is_match) {
      if (game.current_game_number > previousGameNumber.value) {
        currentDbGameId.value = null
        previousGameNumber.value = game.current_game_number
      }
    } else {
      // if it's a standalone game ,it will clear the currentDbGameId
      if (multiplayerGame.value && multiplayerGame.value.id !== game.id) {
        currentDbGameId.value = null
      }
    }
    
    // Assign currentDbGameId to the game
    game.db_game_id = currentDbGameId.value

    multiplayerGame.value = game
  }

  const savingGameStart = ref(false)

  //Save the beginning game on the database
  const saveGameStart = async (gameData) => {

    // Check if game has already been saved
    if (currentDbGameId.value || savingGameStart.value) {
      console.log('Game already saved with ID:', currentDbGameId.value)
      return { game: { id: currentDbGameId.value } }
      //return
    }
    savingGameStart.value = true
    try {
      const response = await apiStore.createGame({
        type: gameData.type,
        player1_user_id: gameData.player1,
        player2_user_id: gameData.player2,
        match_id: gameData.match_id || null,
        began_at: new Date().toISOString(),
        status: 'Playing'
      })
      
      const gameId = response.game.id
      currentDbGameId.value = gameId
      
      // Sync multiplayer game
      if (multiplayerGame.value?.id === gameData.id) {
        multiplayerGame.value.db_game_id = gameId
      }

      return response
    } catch (error) {
      throw error 
    } finally {
      // Always clear the flag when done
      savingGameStart.value = false
    }
    
  }

  //Save the end game on the database, by updating the game
  const saveGameEnd = async (gameData) => {
    try {
      const dbGameId = gameData.db_game_id
      
      if (!dbGameId) {
        return
      }

      // Determine winner and loser
      let winnerUserId = null
      let loserUserId = null
      let isDraw = false

      if (gameData.resigned_player) {

        //Check which player resigned
        const resignedIsPlayer1 = gameData.resigned_player === 1
        winnerUserId = resignedIsPlayer1 ? gameData.player2 : gameData.player1
        loserUserId = resignedIsPlayer1 ? gameData.player1 : gameData.player2

      } else if (gameData.winner === 'draw') {
        // Game ended in a draw
        isDraw = true
      } else {
        // Game ended with a winner
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

      return response.game
    } catch (error) {
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