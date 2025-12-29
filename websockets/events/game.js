import { getUser } from "../state/connection.js"
import { 
    createGame, 
    getGames, 
    joinGame, 
    cancelGamesByUser, 
    getGameById, 
    playCard,
    startGameSession,
    continueMatch,
    resignGame,
    removeGame
} from "../state/game.js"

export const handleGameEvents = (io, socket) => {
    socket.on("create-game", (gameConfig) => {
        const user = getUser(socket.id)
        const game = createGame(gameConfig, user)
        socket.join(`game-${game.id}`)
        console.log(`[Game] ${user.name} created a new ${game.is_match ? 'MATCH' : 'game'} - ID: ${game.id}`)
        if (game.is_match) {
            console.log(`[Game] Match stake: ${game.stake} coins`)
        }
        io.emit("games", getGames())
    })
    
    socket.on("get-games", () => {
        socket.emit("games", getGames())
    })
    
    socket.on("join-game", (gameID, userID) => {
        joinGame(gameID, userID)
        socket.join(`game-${gameID}`)
        console.log(`[Game] User ${userID} joined game ${gameID}`)
        io.emit("games", getGames())
    })
    
    socket.on("start-game", (gameID) => {
        console.log(`[Game] Host starting game ${gameID}`)
        const user = getUser(socket.id)
        const game = getGameById(gameID)
        if (!user || !game) return
        if (game.creator !== user.id) return
        if (!game.player2) return
        
        // Start the first game session
        startGameSession(game)
        
        console.log(`[Game] Game ${gameID} started`)
        
        // Notify both players
        io.to(`game-${gameID}`).emit('game-started', gameID)
        // Send initial game state
        io.to(`game-${gameID}`).emit('game-change', game)
    })
    
    socket.on("cancel-game", (user) => {
        if (!user || !user.id) return
        const removedCount = cancelGamesByUser(user.id)
        if (removedCount > 0) {
            io.emit("games", getGames())
        }
    })
    
    socket.on("play-card", (gameID, card, user) => {
        console.log('play-card event received:', gameID, card.name, 'from user', user.id)
        const game = getGameById(gameID)
        if (!game) {
            console.log('Game not found!')
            return
        }
        
        const player = game.player1 === user.id ? 1 : 2
        const success = playCard(game, card, player)
        
        if (!success) {
            console.log('Play card failed!')
            return
        }
        
        console.log('Card played successfully. Round in progress:', game.round_in_progress)
        
        // Emit immediate state update (card placed on table)
        io.to(`game-${gameID}`).emit("game-change", game)
        
        // If both cards are played, the round will resolve after timeout
        if (game.card_played_player1 && game.card_played_player2) {
            console.log('Both cards played, round will resolve in 800ms')
            
            // Wait for the resolution timeout to complete, then emit again
            setTimeout(() => {
                console.log('Round resolved, emitting updated state')
                io.to(`game-${gameID}`).emit("game-change", game)
                
                // If game ended and it's a match that's not over, auto-continue
                if (game.game_over && game.is_match && !game.match_over) {
                    console.log('[Match] Game ended, will start next game in 3 seconds...')
                    setTimeout(() => {
                        continueMatch(game)
                        console.log('[Match] Next game started automatically')
                        io.to(`game-${gameID}`).emit("game-change", game)
                    }, 3000)
                } else if (game.game_over && game.complete) {
                    // Game/Match is completely over, remove it after delay
                    console.log('[Game] Game completed, will remove in 5 seconds...')
                    setTimeout(() => {
                        removeGame(gameID)
                        console.log(`[Game] Removed completed game ${gameID}`)
                        io.emit("games", getGames())
                    }, 5000)
                }
            }, 850)
        }
    })
    
    socket.on("continue-match", (gameID) => {
        console.log(`[Match] Manual continue request for game ${gameID}`)
        const game = getGameById(gameID)
        if (!game) return
        
        const success = continueMatch(game)
        if (success) {
            io.to(`game-${gameID}`).emit("game-change", game)
        }
    })
    
    socket.on("resign-game", (gameID, user) => {
        console.log(`[Game] Resign request from user ${user.id} in game ${gameID}`)
        const game = getGameById(gameID)
        if (!game) {
            console.log('Game not found!')
            return
        }
        
        const player = game.player1 === user.id ? 1 : 2
        const success = resignGame(game, player)
        
        if (success) {
            console.log(`[Game] Player ${player} resigned successfully`)
            
            // Notify both players of the resignation
            io.to(`game-${gameID}`).emit("game-change", game)
            
            // Remove the game after a short delay to let clients see the result
            setTimeout(() => {
                removeGame(gameID)
                console.log(`[Game] Removed completed game ${gameID}`)
                io.emit("games", getGames())
            }, 2000)
        }
    })
}