const games = new Map()
let currentGameID = 0

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

export const createGame = (gameConfig, user) => {
    currentGameID++

    const game = {
        id: currentGameID,
        game_type: gameConfig.type,
        creator: user.id,
        player1: user.id,
        player2: null,
        player2_pending: null, // Track pending player
        offer_status: null, // null | 'pending' | 'accepted' | 'rejected'
        
        // Match-specific fields
        is_match: gameConfig.mode === 'match',
        stake: gameConfig.stake || 0,
        player1_marks: 0,
        player2_marks: 0,
        player1_total_points: 0,
        player2_total_points: 0,
        current_game_number: 1,
        games_history: [],
        match_over: false,
        match_winner: null,
        winner_payout: 0,
        
        // Game state
        deck: generateDeck(),
        hand_player1: [],
        hand_player2: [],
        deck_index: null,
        card_played_player1: null,
        card_played_player2: null,
        turn_player: null,
        trump_card: null,
        trump_suit: null,
        game_over: false,
        points_player1: 0,
        points_player2: 0,
        winner: null,
        current_round: 0,
        round_starter: null,
        started: false,
        complete: false,
        endedAt: null,
        round_in_progress: false,
        chat_messages: [],
    }
    
    game.deck = shuffle(game.deck)
    games.set(currentGameID, game)
    return game
}

export const getGames = () => {
    return Array.from(games.values())
}

export const getGameById = (gameID) => {
    return games.get(gameID)
}

export const joinGame = (gameID, player2) => {
    const game = games.get(gameID)
    if (game && !game.player2) {
        game.player2_pending = player2
        game.offer_status = 'pending'
        console.log(`[Game] Player ${player2} requested to join game ${gameID} - pending acceptance`)
    }
}

export const acceptOffer = (gameID, player2) => {
    const game = games.get(gameID)
    if (game && game.player2_pending === player2 && game.offer_status === 'pending') {
        game.player2 = player2
        game.offer_status = 'accepted'
        console.log(`[Game] Player ${player2} accepted the offer for game ${gameID}`)
        return true
    }
    return false
}

export const rejectOffer = (gameID, player2) => {
    const game = games.get(gameID)
    if (game && game.player2_pending === player2 && game.offer_status === 'pending') {
        game.player2_pending = null
        game.offer_status = null
        console.log(`[Game] Player ${player2} rejected the offer for game ${gameID}`)
        return true
    }
    return false
}

export const startGameSession = (game) => {
    startGame(game, game.game_type)
}

export const cancelGamesByUser = (userId) => {
    let removedCount = 0
    for (const [gameId, game] of games.entries()) {
        if (game.creator === userId && !game.started) {
            games.delete(gameId)
            removedCount++
            console.log(`[Game] Canceled game ${gameId} by user ${userId}`)
        }
    }
    return removedCount
}

/**
 * Verifica se é obrigatório seguir o naipe
 * Retorna true quando não há mais cartas para comprar do baralho
 */
function mustFollowSuit(game) {
    return game.deck_index >= game.deck.length
}

/**
 * Obtém as cartas válidas que um jogador pode jogar
 * @param {Object} game - Estado do jogo
 * @param {Array} playerHand - Mão do jogador
 * @param {Object} leadCard - Primeira carta jogada na rodada (ou null)
 * @returns {Array} - Cartas que o jogador pode jogar
 */
function getValidCards(game, playerHand, leadCard) {
    // Se ainda há cartas no deck OU ninguém jogou ainda, todas as cartas são válidas
    if (!mustFollowSuit(game) || !leadCard) {
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

export function playCard(game, card, player) {
    if (game.game_over) {
        console.log('❌ Game is over')
        return false
    }
    
    if (game.turn_player !== player) {
        console.log('❌ Not player turn')
        return false
    }
    
    if (game.round_in_progress) {
        console.log('❌ Round in progress')
        return false
    }

    const hand = player === 1 ? game.hand_player1 : game.hand_player2
    const idx = hand.findIndex(c => c.id === card.id)
    
    if (idx === -1) {
        console.log('❌ Card not in hand')
        return false
    }

    // ===== VALIDAÇÃO: Verificar regra de assistir =====
    // Determinar qual carta foi jogada primeiro (se houver)
    const leadCard = player === 1 ? game.card_played_player2 : game.card_played_player1
    const validCards = getValidCards(game, hand, leadCard)
    
    // Verificar se a carta jogada está na lista de válidas
    if (!validCards.find(c => c.id === card.id)) {
        console.log(`❌ Invalid card! Must follow suit ${leadCard?.suit}`)
        return false
    }
    // ==================================================

    hand.splice(idx, 1)

    if (player === 1) game.card_played_player1 = card
    else game.card_played_player2 = card

    console.log(`✓ Player ${player} played ${card.name}`)

    if (game.card_played_player1 && game.card_played_player2) {
        game.round_in_progress = true
        resolveRound(game)
    } else {
        game.turn_player = player === 1 ? 2 : 1
    }

    return true
}

export function continueMatch(game) {
    if (!game.is_match || game.match_over) return false
    
    console.log(`[Match] Starting next game in match (Game ${game.current_game_number + 1})`)
    game.current_game_number++
    startGame(game, game.game_type)
    return true
}

function sumPoints(cards = []) {
    return cards.reduce((sum, card) => sum + (card.points || 0), 0)
}


export function resignGame(game, player) {
    if (game.game_over) return false

    console.log(`[Game] Player ${player} resigned!`)

    const winner = player === 1 ? 2 : 1

    // ===== FUNÇÃO AUXILIAR =====
    const sumPoints = (cards = []) =>
        cards.reduce((sum, card) => sum + (card.points || 0), 0)

    // ===== CALCULAR TODOS OS PONTOS RESTANTES =====

    // Pontos das mãos
    const handP1Points = sumPoints(game.hand_player1)
    const handP2Points = sumPoints(game.hand_player2)

    // Pontos das cartas ainda no deck (game pile)
    const remainingDeckCards = game.deck.slice(game.deck_index)
    const deckPoints = sumPoints(remainingDeckCards)

    const remainingPoints =
        handP1Points +
        handP2Points +
        deckPoints

    console.log(`[Game] Remaining points awarded: ${remainingPoints}`)

    // Atribuir TODOS os pontos ao jogador vencedor
    if (winner === 1) {
        game.points_player1 += remainingPoints
    } else {
        game.points_player2 += remainingPoints
    }

    // ===== LIMPAR ESTADO DO JOGO =====
    game.hand_player1 = []
    game.hand_player2 = []
    game.deck_index = game.deck.length

    // ===== FINALIZAR JOGO =====
    game.winner = winner
    game.resigned_player = player
    game.game_over = true
    game.complete = true
    game.endedAt = new Date()

    console.log(`[Game] Player ${winner} wins by resignation`)
    console.log(`[Game] Final Score: P1=${game.points_player1} P2=${game.points_player2}`)

    // ===== MATCH MODE =====
    if (game.is_match) {
        console.log('[Match] Player resigned - instant match loss')

        if (winner === 1) {
            game.player1_marks = 4
            game.player2_marks = 0
        } else {
            game.player2_marks = 4
            game.player1_marks = 0
        }

        game.match_over = true
        game.match_winner = winner

        // Calcular payout
        const totalStake = game.stake * 2
        const platformCommission = 1
        game.winner_payout = totalStake - platformCommission

        console.log(`[Match] Winner: Player ${winner}`)
        console.log(`[Match] Final Marks: ${game.player1_marks} - ${game.player2_marks}`)
        console.log(`[Match] Payout: ${game.winner_payout} coins`)
    }

    return true
}


export function removeGame(gameID) {
    const deleted = games.delete(gameID)
    if (deleted) {
        console.log(`[Game] Removed game ${gameID} from active games`)
    }
    return deleted
}

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

function startGame(game, type = 3) {
    const newDeck = shuffle(generateDeck())
    game.deck = newDeck

    game.trump_card = game.deck[game.deck.length - 1]
    game.trump_suit = game.trump_card.suit

    game.hand_player1 = game.deck.slice(0, type)
    game.hand_player2 = game.deck.slice(type, type * 2)
    game.deck_index = type * 2

    game.turn_player = Math.random() < 0.5 ? 1 : 2
    game.round_starter = game.turn_player

    game.current_round = 0
    game.points_player1 = 0
    game.points_player2 = 0
    game.card_played_player1 = null
    game.card_played_player2 = null
    game.game_over = false
    game.winner = null
    game.started = true
    game.round_in_progress = false

    console.log(`Game started! Bisca de ${type}${game.is_match ? ' (Match mode)' : ''}`)
    console.log(`Player ${game.turn_player} goes first`)
    console.log(`Trump card: ${game.trump_card.name}`)
}

function determineTrickWinner(game, card1, card2) {
    if (card1.suit === card2.suit) {
        return card1.order < card2.order ? 1 : 2
    }
    if (card1.suit === game.trump_suit) return 1
    if (card2.suit === game.trump_suit) return 2
    return game.round_starter
}

function resolveRound(game) {
    const c1 = game.card_played_player1
    const c2 = game.card_played_player2
    if (!c1 || !c2) return

    const winnerPlayer = determineTrickWinner(game, c1, c2)
    const totalPoints = (c1.points || 0) + (c2.points || 0)

    if (winnerPlayer === 1) game.points_player1 += totalPoints
    else game.points_player2 += totalPoints

    game.current_round++

    console.log(`Round ${game.current_round}: Player ${winnerPlayer} wins (+${totalPoints} pts)`)
    console.log(`Score: P1=${game.points_player1} P2=${game.points_player2}`)

    game.round_in_progress = true

    setTimeout(() => {
        game.card_played_player1 = null
        game.card_played_player2 = null

        drawCards(game, winnerPlayer)

        game.turn_player = winnerPlayer
        game.round_starter = winnerPlayer

        if (game.hand_player1.length === 0 && game.hand_player2.length === 0) {
            endGame(game)
        } else {
            console.log(`Next round: Player ${game.turn_player} starts`)
        }

        game.round_in_progress = false
    }, 800)
}

function drawCards(game, winnerPlayer) {
    if (game.deck_index >= game.deck.length) {
        console.log('No more cards to draw')
        return
    }

    if (winnerPlayer === 1) {
        if (game.deck_index < game.deck.length) {
            game.hand_player1.push(game.deck[game.deck_index++])
        }
        if (game.deck_index < game.deck.length) {
            game.hand_player2.push(game.deck[game.deck_index++])
        }
    } else {
        if (game.deck_index < game.deck.length) {
            game.hand_player2.push(game.deck[game.deck_index++])
        }
        if (game.deck_index < game.deck.length) {
            game.hand_player1.push(game.deck[game.deck_index++])
        }
    }
    
    console.log(`Cards remaining in deck: ${game.deck.length - game.deck_index}`)
}

function endGame(game) {
    game.game_over = true

    if (game.points_player1 > game.points_player2) {
        game.winner = 1
    } else if (game.points_player2 > game.points_player1) {
        game.winner = 2
    } else {
        game.winner = 'draw'
    }

    console.log('=== Game Over ===')
    console.log(`Final Score: P1=${game.points_player1} P2=${game.points_player2}`)
    console.log(`Winner: ${game.winner === 'draw' ? 'Draw' : 'Player ' + game.winner}`)

    // Process match if this is match mode
    if (game.is_match) {
        processMatchResult(game)
    } else {
        game.complete = true
        game.endedAt = new Date()
    }
}

/**
 * Calcula as marcas baseado nos pontos do vencedor
 * Regras da Bisca:
 * - 120 pontos = BANDEIRA (4 marcas - vitória automática)
 * - 91-119 pontos = CAPOTE (2 marcas)
 * - 61-90 pontos = RISCA/MOCA (1 marca)
 * - 0-60 pontos = SEM MARCA
 */
function calculateMarks(winnerPoints) {
    if (winnerPoints === 120) {
        console.log(`   🏁 BANDEIRA! (120 pontos)`)
        return 4 // Vitória automática
    } else if (winnerPoints >= 91 && winnerPoints <= 119) {
        console.log(`   💪 CAPOTE! (${winnerPoints} pontos)`)
        return 2
    } else if (winnerPoints >= 61 && winnerPoints <= 90) {
        console.log(`   ✓ RISCA (${winnerPoints} pontos)`)
        return 1
    } else {
        console.log(`   ○ Sem marca (${winnerPoints} pontos)`)
        return 0
    }
}

function processMatchResult(game) {
    console.log('[Match] Processing game result...')
    
    const gameRecord = {
        game_number: game.current_game_number,
        winner: game.winner,
        points_player1: game.points_player1,
        points_player2: game.points_player2,
        is_draw: game.winner === 'draw',
        marks_awarded: 0,
        timestamp: new Date().toISOString()
    }

    // Accumulate total points
    game.player1_total_points += game.points_player1
    game.player2_total_points += game.points_player2

    // Calculate marks (empate = sem marcas)
    if (game.winner === 'draw') {
        console.log(`   🤝 Empate - sem marcas`)
        gameRecord.marks_awarded = 0
    } else {
        const winnerPoints = game.winner === 1 ? game.points_player1 : game.points_player2
        const marks = calculateMarks(winnerPoints)
        
        // Award marks to winner
        if (game.winner === 1) {
            game.player1_marks += marks
            console.log(`   ✅ Player 1 ganhou ${marks} marca(s)`)
            console.log(`   📈 Marcas: ${game.player1_marks}/4`)
        } else {
            game.player2_marks += marks
            console.log(`   ✅ Player 2 ganhou ${marks} marca(s)`)
            console.log(`   📈 Marcas: ${game.player2_marks}/4`)
        }

        gameRecord.marks_awarded = marks
    }

    // Add to history
    game.games_history.push(gameRecord)

    // Check if match is over (4 marks or bandeira)
    if (game.player1_marks >= 4 || game.player2_marks >= 4) {
        endMatch(game)
    }
}

function endMatch(game) {
    game.match_over = true
    
    if (game.player1_marks >= 4) {
        game.match_winner = 1
    } else {
        game.match_winner = 2
    }
    
    // Calculate payout (stake x 2 - commission)
    const totalStake = game.stake * 2
    const platformCommission = 1
    game.winner_payout = totalStake - platformCommission
    
    game.complete = true
    game.endedAt = new Date()
    
    console.log('=== MATCH OVER ===')
    console.log(`Winner: Player ${game.match_winner}`)
    console.log(`Final Marks: ${game.player1_marks} - ${game.player2_marks}`)
    console.log(`Total Points: ${game.player1_total_points} - ${game.player2_total_points}`)
    console.log(`Payout: ${game.winner_payout} coins`)
}

// Export helper functions for validation
export { mustFollowSuit, getValidCards }