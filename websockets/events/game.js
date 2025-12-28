import { getUser } from "../state/connection.js"
import { createGame, getGames, joinGame, cancelGamesByUser } from "../state/game.js"


export const handleGameEvents = (io, socket) => {
    socket.on("create-game", (game_type) => {
        const user = getUser(socket.id)

       console.log(user)

        const game = createGame(game_type, user)

        console.log(game)

        socket.join(`game-${game.id}`)
        console.log(`[Game] ${user.name} created a new game - ID: ${game.id}`)
        io.emit("games", getGames())
    })

    socket.on("get-games", () => {
        socket.emit("games", getGames())
    })

    socket.on("join-game", (gameID, userID) => {
        console.log("AAAA")
        joinGame(gameID, userID)
        socket.join(`game-${gameID}`)
        console.log(`[Game] User ${userID} joined game ${gameID}`)
        io.emit("games", getGames())
    })

    socket.on("cancel-game", (user) => {
        if (!user || !user.id) return

        const removedCount = cancelGamesByUser(user.id)

        if (removedCount > 0) {
            io.emit("games", getGames())
        }
    })

    socket.on("play-card", (gameID, card, player) => {
        console.log('play-card event received:', gameID, card)
        // game = playCard(card, player)
    })
}