import { triggerPlayCardDelay } from "../events/game.js"

const games = new Map()
let currentGameID = 0

export const createGame = (game_type, user) => {
    currentGameID++

    const game = {
        id: currentGameID,
        game_type,
        creator: user.id,
        player1: user.id,
        player2: null,
        winner: null,
        currentPlayer: user.id,
        deck: generateDeck(),
        //
        hand_player1: [],
        hand_player2: [],
        deck_index = null,
        card_played_player1 = null,
        card_played_player2 = null,
        turn_player = null,
        trump_suit = null,
        game_over = null,
        points_player1 = 0,
        points_player2 = 0,
        winner = null,
        current_round = 0,
        round_starter = null,
        game_mode = 'game'
        //
        playedCards: [],
        started: false,
        complete: false,
        rounds: 0,
        beganAt: null,
        endedAt: null
    }

    game.deck = shuffle(game.deck)
    games.set(currentGameID, game)
    return game
}

export const getGames = () => {
    return games.values().toArray()
}

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

function startGame(type = 3, mode = 'game') {
    const newDeck = shuffle(generateDeck())
    deck.value = newDeck

    // Guarda o tipo e modo do jogo
    game_type.value = type
    game_mode.value = mode

    // Set trump card (last card in deck)
    trump_card.value = deck.value[deck.value.length - 1]
    trump_suit.value = trump_card.value.suit

    // Deal 3 cards to each player
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
    if (game_over.value) return false
    if (turn_player.value !== player) return false

    const hand = player === 1 ? hand_player1.value : hand_player2.value
    const idx = hand.findIndex(c => c.id === card.id)
    if (idx === -1) return false

    // Remove card from hand
    hand.splice(idx, 1)

    // Place card on table
    if (player === 1) {
        card_played_player1.value = card
        console.log(`Player 1 played: ${card.name}`)
    } else {
        card_played_player2.value = card
        console.log(`Player 2 (Bot) played: ${card.name}`)
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

function endGame() {
    game_over.value = true
    
    if (points_player1.value > points_player2.value) {
        winner = 1
    } else if (points_player2.value > points_player1.value) {
        winner = 2
    } else {
        winner = 'draw'
    }

    //AAAAAAAAAAA
    game.complete = true
    game.endedAt = new Date()

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

//

export const joinGame = (gameID, player2) => {
    games.get(gameID).player2 = player2
}


