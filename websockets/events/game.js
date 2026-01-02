import { getUser } from "../state/connection.js"
import { 
    createGame, 
    getGames, 
    joinGame,
    acceptOffer,      // NEW
    rejectOffer,      // NEW
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
        const game = getGameById(gameID)
        if (!game) {
            console.log(`[Game] Game ${gameID} not found`)
            return
        }
        
        // For matches: use offer review system
        if (game.is_match) {
            joinGame(gameID, userID)
            socket.join(`game-${gameID}`)
            console.log(`[Match] User ${userID} requested to join match ${gameID} - pending review`)
            
            // Notify all clients about the join request
            io.emit("games", getGames())
            
            // Notify the game room about pending player
            io.to(`game-${gameID}`).emit('player-join-request', {
                gameID,
                player2: userID,
                stake: game.stake,
                gameType: game.game_type,
                isMatch: game.is_match
            })
        } 
        // For standalone games: auto-accept immediately
        else {
            game.player2 = userID
            game.offer_status = 'accepted' // Mark as accepted for consistency
            socket.join(`game-${gameID}`)
            console.log(`[Game] User ${userID} joined standalone game ${gameID} - auto-accepted`)
            
            // Notify all clients with updated games list
            io.emit("games", getGames())
            
            // Also emit to the game room so both players see the update immediately
            io.to(`game-${gameID}`).emit('player-joined', {
                gameID,
                player2: userID
            })
        }
    })
    
    // NEW: Handle offer acceptance
    socket.on("accept-offer", (gameID, userID) => {
        console.log(`[Game] User ${userID} accepting offer for game ${gameID}`)
        const success = acceptOffer(gameID, userID)
        
        if (success) {
            console.log(`[Game] Offer accepted for game ${gameID}`)
            
            // Broadcast updated games list to everyone
            io.emit("games", getGames())
            
            // Notify everyone in the game room
            io.to(`game-${gameID}`).emit('offer-accepted', {
                gameID,
                player2: userID
            })
            
            console.log(`[Game] Emitted offer-accepted event to all clients`)
        } else {
            console.log(`[Game] Failed to accept offer for game ${gameID}`)
        }
    })
    
    // NEW: Handle offer rejection
    socket.on("reject-offer", (gameID, userID) => {
        console.log(`[Game] User ${userID} rejecting offer for game ${gameID}`)
        const success = rejectOffer(gameID, userID)
        
        if (success) {
            console.log(`[Game] Offer rejected for game ${gameID}`)
            
            // Broadcast updated games list to everyone
            io.emit("games", getGames())
            
            // Notify everyone in the game room
            io.to(`game-${gameID}`).emit('offer-rejected', {
                gameID,
                player2: userID
            })
            
            console.log(`[Game] Emitted offer-rejected event to all clients`)
            
            // Player 2 leaves the game room
            const userSocket = Array.from(io.sockets.sockets.values())
                .find(s => getUser(s.id)?.id === userID)
            if (userSocket) {
                userSocket.leave(`game-${gameID}`)
                console.log(`[Game] Player ${userID} left game room ${gameID}`)
            }
        } else {
            console.log(`[Game] Failed to reject offer for game ${gameID}`)
        }
    })
    
    socket.on("start-game", (gameID) => {
        console.log(`[Game] Host starting game ${gameID}`)
        const user = getUser(socket.id)
        const game = getGameById(gameID)
        if (!user || !game) {
            console.log('[Game] User or game not found')
            return
        }
        if (game.creator !== user.id) {
            console.log('[Game] Only creator can start game')
            return
        }
        
        // For matches: check if offer was accepted
        if (game.is_match && (!game.player2 || game.offer_status !== 'accepted')) {
            console.log(`[Match] Cannot start - player2: ${game.player2}, offer_status: ${game.offer_status}`)
            return
        }
        
        // For standalone games: just check if player2 exists
        if (!game.is_match && !game.player2) {
            console.log('[Game] Cannot start - no player 2')
            return
        }
        
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