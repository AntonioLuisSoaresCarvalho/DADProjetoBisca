import { getUser } from "../state/connection.js"
import { createGame, getGames, joinGame, playCard} from "../state/game.js"


export const handleGameEvents = (io, socket) => {
    socket.on("create-game", (game_type) => {
        const user ? getUser(socket.id)
        const game = createGame(game_type, user)
        socket.join(`game-${game.id}`)
        console.log(`[Game] ${user.name} created a new game - ID: ${game.id}`)
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

    socket.on("play-card", (gameID, card, player) => {
        console.log('play-card event received:', gameID, card)
        // game = playCard(card, player)
    })
}