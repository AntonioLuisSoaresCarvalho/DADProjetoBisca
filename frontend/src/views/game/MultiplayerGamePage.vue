<script setup>
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useSocketStore } from '@/stores/socketStore'
import { useAuthStore } from '@/stores/authStore'
import { useFriendStore } from '@/stores/friendStore'
import { useApiStore } from '@/stores/api'
import CardHand from '@/components/game/CardHand.vue'
import CardPlayed from '@/components/game/CardPlayed.vue'
import CardBack from '@/components/game/CardBack.vue'
import AddFriendButton from '@/components/AddFriendButton.vue'
import GameChat from '@/components/game/GameChat.vue'

const router = useRouter()
const gameStore = useGameStore()
const socketStore = useSocketStore()
const authStore = useAuthStore()
const friendStore = useFriendStore()
const opponentData = ref(null)

const roundKey = ref(0)
const showGameResult = ref(false)
const friendAdded = ref(false)
const turnTimer = ref(20)
let timerInterval = null

/* ------------------ COMPUTED ------------------ */

const game = computed(() => gameStore.multiplayerGame)

const gameID = computed(() => game.value?.id)

const isMatch = computed(() => game.value?.is_match || false)

const gameCardWrapper = ref(null)

const myPlayerNumber = computed(() => {
    if (!game.value || !authStore.user) return null
    return game.value.player1 === authStore.user.id ? 1 : 2
})

const opponentPlayerNumber = computed(() => myPlayerNumber.value === 1 ? 2 : 1)

const opponentInfo = computed(() => {
    if (!game.value) return null

    if (!opponentData.value) {
        return {
            id: null,
            nickname: 'Opponent',
            name: 'Opponent',
            photo_avatar_filename: null
        }
    }

    return {
        id: opponentData.value.id,
        nickname: opponentData.value.nickname || 'Opponent',
        name: opponentData.value.name || 'Opponent',
        photo_avatar_filename: opponentData.value.photo_avatar_filename
    }
})

const myTurn = computed(() => {
    if (!game.value) return false
    return game.value.turn_player === myPlayerNumber.value && !game.value.round_in_progress
})

const myHand = computed(() => {
    if (!game.value) return []
    return [...(myPlayerNumber.value === 1 ? game.value.hand_player1 : game.value.hand_player2)]
})

const opponentHand = computed(() => {
    if (!game.value) return []
    return [...(myPlayerNumber.value === 1 ? game.value.hand_player2 : game.value.hand_player1)]
})

const myCardPlayed = computed(() => {
    if (!game.value) return null
    return myPlayerNumber.value === 1
        ? game.value.card_played_player1 ? { ...game.value.card_played_player1 } : null
        : game.value.card_played_player2 ? { ...game.value.card_played_player2 } : null
})

const opponentCardPlayed = computed(() => {
    if (!game.value) return null
    return opponentPlayerNumber.value === 1
        ? game.value.card_played_player1 ? { ...game.value.card_played_player1 } : null
        : game.value.card_played_player2 ? { ...game.value.card_played_player2 } : null
})

const myPoints = computed(() => {
    if (!game.value) return 0
    return myPlayerNumber.value === 1 ? game.value.points_player1 : game.value.points_player2
})

const opponentPoints = computed(() => {
    if (!game.value) return 0
    return opponentPlayerNumber.value === 1 ? game.value.points_player1 : game.value.points_player2
})

const myMarks = computed(() => {
    if (!game.value || !isMatch.value) return 0
    return myPlayerNumber.value === 1 ? game.value.player1_marks : game.value.player2_marks
})

const opponentMarks = computed(() => {
    if (!game.value || !isMatch.value) return 0
    return opponentPlayerNumber.value === 1 ? game.value.player1_marks : game.value.player2_marks
})

const myTotalPoints = computed(() => {
    if (!game.value || !isMatch.value) return 0
    return myPlayerNumber.value === 1 ? game.value.player1_total_points : game.value.player2_total_points
})

const opponentTotalPoints = computed(() => {
    if (!game.value || !isMatch.value) return 0
    return opponentPlayerNumber.value === 1 ? game.value.player1_total_points : game.value.player2_total_points
})

const marksDisplay = computed(() => {
    if (!isMatch.value) return null
    let myMarksValue = myMarks.value
    let opponentMarksValue = opponentMarks.value
    if (myMarksValue > 4) myMarksValue = 4
    if (opponentMarksValue > 4) opponentMarksValue = 4
    const myDisplay = '●'.repeat(myMarksValue) + '○'.repeat(4 - myMarksValue)
    const oppDisplay = '●'.repeat(opponentMarksValue) + '○'.repeat(4 - opponentMarksValue)
    return { my: myDisplay, opponent: oppDisplay }
})

const isGameOver = computed(() => game.value?.game_over || false)

const isMatchOver = computed(() => game.value?.match_over || false)

const lastGameMarks = computed(() => {
    if (!game.value?.games_history || game.value.games_history.length === 0) return 0
    const lastGame = game.value.games_history[game.value.games_history.length - 1]
    return lastGame.marks_awarded || 0
})

// Follow suit rule computeds

const mustFollowSuitNow = computed(() => {
    if (!game.value) return false
    // Check if there are no more cards in the deck
    const noMoreCards = game.value.deck_index >= game.value.deck?.length
    // And if opponent has already played a card
    const opponentPlayed = opponentCardPlayed.value !== null
    return noMoreCards && opponentPlayed
})

const validCards = computed(() => {
    if (!game.value || !myTurn.value || isGameOver.value) return []

    const hand = myHand.value
    const leadCard = opponentCardPlayed.value

    // If there are still cards in the deck OR opponent hasn't played, all cards are valid
    if (!mustFollowSuitNow.value || !leadCard) {
        return hand
    }

    // Check if player has cards of the same suit
    const sameSuitCards = hand.filter(card => card.suit === leadCard.suit)

    if (sameSuitCards.length > 0) {
        // Has cards of the same suit - MUST play one of them
        console.log(`Must follow suit: ${leadCard.suit}`)
        return sameSuitCards
    }

    // Doesn't have cards of the same suit - can play any
    console.log(`No cards of suit ${leadCard.suit} - can play any`)
    return hand
})

const isCardValid = (card) => {
    return validCards.value.some(c => c.id === card.id)
}

const gameWinnerText = computed(() => {
    if (!isGameOver.value) return ''

    // Check if game ended by resignation
    if (game.value.resigned_player) {
        const resignedPlayer = game.value.resigned_player
        if (resignedPlayer === myPlayerNumber.value) {
            if (isMatch.value) {
                return 'RESIGNED! You lost the Match 4-0'
            }
            return 'You resigned! You lost the game'
        } else {
            if (isMatch.value) {
                return 'Opponent resigned! You won the Match 4-0!'
            }
            return 'Opponent resigned! You won!'
        }
    }

    const winner = game.value.winner

    if (winner === 'draw') {
        return 'Draw - No goals scored!'
    }

    const marks = lastGameMarks.value
    const isWinner = winner === myPlayerNumber.value

    if (marks === 4) {
        return isWinner ? 'BANDEIRA! Automatic victory!' : 'BANDEIRA! You lost!'
    } else if (marks === 2) {
        return isWinner ? 'CAPOTE! +2 marks!' : 'CAPOTE! Opponent +2 marks'
    } else if (marks === 1) {
        return isWinner ? 'RISCA! +1 mark' : 'You lost - Opponent +1 mark'
    } else {
        return isWinner ? 'You won the game' : 'You lost the game'
    }
})

const matchWinnerText = computed(() => {
    if (!isMatchOver.value) return ''
    const winner = game.value.match_winner
    if (winner === myPlayerNumber.value) return 'YOU WON THE MATCH!'
    return 'You lost the match'
})

const gamesHistoryFormatted = computed(() => {
    if (!game.value?.games_history) return []
    return game.value.games_history.map(g => {
        const winnerName = g.winner === myPlayerNumber.value ? 'You' : 'Opponent'
        let description = `Game ${g.game_number}: `

        if (g.is_draw) {
            description += `Draw (${g.points_player1}-${g.points_player2}) - No marks`
        } else {
            const marks = g.marks_awarded
            let marksText = ''
            if (marks === 4) marksText = 'BANDEIRA (4 marks)'
            else if (marks === 2) marksText = 'CAPOTE (2 marks)'
            else if (marks === 1) marksText = 'RISCA (1 mark)'
            else marksText = 'No marks'

            description += `${winnerName} won ${marksText} (${g.points_player1}-${g.points_player2})`
        }

        return { ...g, description }
    })
})

const timerColor = computed(() => {
    if (turnTimer.value <= 5) return 'text-red-600 font-bold'
    if (turnTimer.value <= 10) return 'text-orange-600 font-bold'
    return 'text-gray-700'
})

/* ------------------ METHODS ------------------ */

const playCard = (card) => {
    if (!myTurn.value || showGameResult.value) {
        console.log('Not your turn or game result showing')
        return
    }

    if (!gameID.value) {
        console.error('[Game] Cannot play card - game ID is undefined')
        return
    }

    // VALIDATION: Check if card is valid
    if (!isCardValid(card)) {
        console.log('Invalid card! Must follow suit when possible.')
        alert('You must play a card of the same suit!')
        return
    }

    socketStore.emitPlayCard(gameID.value, card, authStore.user)
}

const resignGame = () => {
    if (isGameOver.value || !gameID.value) return

    let confirmMessage = 'Are you sure you want to resign?'

    if (isMatch.value) {
        confirmMessage = 'ATTENTION: Resigning from a MATCH means losing AUTOMATICALLY 4-0!\n\nAre you absolutely sure you want to resign?'
    } else {
        confirmMessage = 'Are you sure you want to resign? You will lose this game!'
    }

    const confirmed = confirm(confirmMessage)
    if (confirmed) {
        console.log('[Game] Player resigning...')
        socketStore.emitResignGame(gameID.value, authStore.user)
    }
}

const backToLobby = () => {
    stopTimer()

    // If game is still active, resign before leaving
    if (!isGameOver.value && !isMatchOver.value && gameID.value) {
        console.log('[Game] Leaving active game - auto-resigning')
        socketStore.emitResignGame(gameID.value, authStore.user)
    }

    router.push('/lobby')
}

const handleFriendAdded = (friend) => {
    friendAdded.value = true
    console.log(`${friend.nickname} added to friends list!`)
}

const startTimer = () => {
    stopTimer()
    turnTimer.value = 20

    timerInterval = setInterval(() => {
        turnTimer.value--

        if (turnTimer.value <= 0) {
            console.log('[Game] Timer expired! Auto-resigning...')
            stopTimer()
            // Auto-resign
            socketStore.emitResignGame(game.value.id, authStore.user)
        }
    }, 1000)
}

const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

/* ------------------ WATCHERS ------------------ */

watch(
    () => game.value?.current_round,
    (newRound, oldRound) => {
        if (newRound !== oldRound) {
            roundKey.value = newRound
            console.log(`Round changed: ${oldRound} → ${newRound}`)
        }
    }
)

// Watch for turn changes to reset timer
watch(
    () => [game.value?.turn_player, game.value?.round_in_progress],
    ([newTurn, roundInProgress]) => {
        if (!game.value || isGameOver.value || isMatchOver.value) {
            stopTimer()
            return
        }

        if (roundInProgress) {
            stopTimer()
        } else if (newTurn === myPlayerNumber.value) {
            startTimer()
        } else {
            stopTimer()
        }
    },
    { immediate: true }
)

// Watch for game end in match mode
watch(
    () => game.value?.game_over,
    (isOver) => {
        if (isOver) {
            stopTimer()

            if (isMatch.value && !isMatchOver.value) {
                showGameResult.value = true
                console.log('Game ended in match, waiting 3 seconds...')

                setTimeout(() => {
                    if (!isMatchOver.value) {
                        showGameResult.value = false
                    }
                }, 3000)
            }
        }
    }
)

// Watch only for initial game setup (not every state change)
watch(
  () => game.value?.id,
  (newId) => {
    if (newId) {
      // New game started - let chat resize after render
      nextTick(() => {
        setTimeout(() => {
          console.log('New game detected, ID:', newId)
        }, 300)
      })
    }
  }
)

/* ------------------ LIFECYCLE ------------------ */

onMounted(async () => {
    console.log('[Game] Component mounted, game:', game.value)
    if (game.value) {
        const opponentId = opponentPlayerNumber.value === 1
            ? game.value.player1
            : game.value.player2

        try {
            const api = useApiStore()
            const response = await api.getUser(opponentId)
            opponentData.value = response.data
        } catch (error) {
            console.error('Error fetching opponent data:', error)
            // Set fallback data
            opponentData.value = {
                id: opponentId,
                nickname: 'Opponent',
                name: 'Opponent',
                photo_avatar_filename: null
            }
        }
    }
    if (myTurn.value && !isGameOver.value) {
        startTimer()
    }
})

onUnmounted(() => {
    stopTimer()

    // If leaving an active game, auto-resign
    if (gameID.value && game.value && !game.value.game_over && !game.value.match_over) {
        console.log('[Game] Component unmounting during active game - auto-resigning')
        socketStore.emitResignGame(gameID.value, authStore.user)
    }
})
</script>

<template>
    <div v-if="game" class="flex justify-center mt-10 px-4">
        <!-- Main Container with 2 columns -->
        <div class="flex gap-6 w-full max-w-[1400px] items-start" style="min-height: 800px;">

            <!-- LEFT COLUMN: Game Area (Cards) -->
            <div class="flex-1 min-w-0" ref="gameCardWrapper">
                <Card>
                    <CardHeader>
                        <div class="flex justify-between items-center">
                            <CardTitle class="text-center text-3xl font-bold flex-1">
                                {{ isMatch ? 'Multiplayer Match' : 'Multiplayer Game' }} - Bisca of {{ game.game_type }}
                            </CardTitle>
                            <Button
                                v-if="!isGameOver && !isMatchOver"
                                @click="resignGame"
                                variant="destructive"
                                size="sm">
                                Resign
                            </Button>
                        </div>

                        <!-- Timer Display -->
                        <div v-if="myTurn && !isGameOver && !isMatchOver" class="text-center mt-2">
                            <div :class="['text-2xl', timerColor]">
                                {{ turnTimer }}s
                            </div>
                        </div>

                        <!-- Match Info -->
                        <div v-if="isMatch" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 mt-5">
                            <div class="text-md text-center font-bold text-green-900 mb-1">
                                Match - First to 4 marks wins | Stake: {{ game.stake }} coins
                            </div>
                            <div class="flex justify-between items-center text-xs text-green-800">
                                <div>
                                    <span class="font-bold">You:</span>
                                    <span class="text-lg ml-1">{{ marksDisplay?.my }}</span>
                                    <span class="ml-2 text-gray-600">({{ myTotalPoints }} total points)</span>
                                </div>
                                <div class="text-center text-lg font-bold">
                                    Game {{ game.current_game_number || 1 }}
                                </div>
                                <div class="text-right">
                                    <span class="font-bold">Opponent:</span>
                                    <span class="text-lg ml-1">{{ marksDisplay?.opponent }}</span>
                                    <span class="ml-2 text-gray-600">({{ opponentTotalPoints }} total points)</span>
                                </div>
                            </div>
                        </div>

                        <!-- Current Game Info -->
                        <div class="bg-white backdrop-blur-md rounded-xl p-4 text-center shadow-md border border-white/30 mt-3">
                            <div class="text-xl font-bold mb-2">
                                Round
                                <span :class="game.current_round > 15 ? 'text-red-500' : 'text-black'">
                                    {{ game.current_round || 0 }}
                                </span>
                                / 20
                            </div>
                            <div class="text-lg text-green-900 mb-1">
                                Trump:
                                <span class="font-semibold capitalize">{{ game.trump_card?.suit || 'N/A' }}</span>
                            </div>
                            <div class="text-base text-green-900">
                                <span class="font-semibold">You:</span> {{ myPoints }} points
                            </div>
                            <div class="text-base text-green-900">
                                <span class="font-semibold">Opponent:</span> {{ opponentPoints }} points
                            </div>
                            <div class="text-sm text-green-900 mt-1">
                                (Cards in hand: {{ myHand.length }})
                            </div>

                            <!-- Follow suit warning -->
                            <div v-if="mustFollowSuitNow" class="mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded-lg">
                                <div class="text-sm font-bold text-yellow-800 animate-pulse">
                                    You must follow suit: {{ opponentCardPlayed?.suit }}!
                                </div>
                                <div class="text-xs text-yellow-700">
                                    There are no more cards in the deck
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <!-- Opponent hand -->
                    <div class="flex justify-center gap-2 mb-4">
                        <CardBack v-for="(_, i) in opponentHand" :key="i" />
                    </div>

                    <!-- Played cards -->
                    <CardContent class="flex justify-center gap-20">
                        <div class="flex flex-col items-center gap-2">
                            <CardPlayed :card="myCardPlayed" :key="roundKey" />
                            <span class="text-xl font-semibold">You</span>
                        </div>
                        <div class="flex flex-col items-center gap-2">
                            <CardPlayed :card="opponentCardPlayed" :key="roundKey" />
                            <span class="text-xl font-semibold text-red-700">Opponent</span>
                        </div>
                    </CardContent>

                    <!-- Your hand -->
                    <CardFooter class="flex flex-col gap-4 items-center">
                        <CardHand
                            :key="roundKey"
                            :cards="myHand"
                            :disabled="!myTurn || isGameOver || showGameResult"
                            :validCards="validCards"
                            @playCard="playCard"
                        />

                        <!-- Game result (shown briefly in match mode) -->
                        <div v-if="showGameResult && !isMatchOver" class="text-center bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                            <div class="text-2xl font-bold mb-2">
                                {{ gameWinnerText }}
                            </div>
                            <div class="text-lg">
                                You: {{ myPoints }} | Opponent: {{ opponentPoints }}
                            </div>
                            <div class="text-sm text-gray-600 mt-2">
                                Starting next game...
                            </div>
                        </div>

                        <!-- Turn indicator -->
                        <div v-if="!isGameOver && !showGameResult" class="text-3xl font-bold">
                            <span v-if="myTurn" class="text-green-600">
                                It's your turn!
                            </span>
                            <span v-else class="text-orange-600">
                                Opponent is playing...
                            </span>
                        </div>

                        <!-- Game Over (simple game) -->
                        <div v-if="isGameOver && !isMatch" class="text-center">
                            <div class="text-3xl font-bold mb-3">
                                {{ gameWinnerText }}
                            </div>
                            <div class="text-lg text-gray-700 mb-3">
                                You: <span class="font-bold">{{ myPoints }}</span> points |
                                Opponent: <span class="font-bold">{{ opponentPoints }}</span> points
                            </div>
                            <div v-if="opponentInfo" class="bg-linear-to-r from-green-50 to-green-50 p-6 rounded-lg border-2 border-green-200">
                                <p class="text-gray-700 mb-3 font-medium">
                                    Did you enjoy playing with this opponent?
                                </p>
                                <div class="flex justify-center">
                                    <AddFriendButton
                                        :opponent="opponentInfo"
                                        @added="handleFriendAdded"
                                    />
                                </div>
                            </div>
                            <Button @click="backToLobby" class="mt-3 bg-green-600" variant="default">
                                Back to Lobby
                            </Button>
                        </div>

                        <!-- Match Over -->
                        <div v-if="isMatchOver" class="text-center">
                            <div class="text-4xl font-bold mb-3">
                                {{ matchWinnerText }}
                            </div>
                            <div class="text-lg mb-2">
                                <span class="font-bold">You:</span> {{ myMarks }} marks
                                <span class="mx-2">|</span>
                                <span class="font-bold">Opponent:</span> {{ opponentMarks }} marks
                            </div>
                            <div class="text-sm text-gray-600 mb-2">
                                Total points: {{ myTotalPoints }} - {{ opponentTotalPoints }}
                            </div>
                            <div class="text-lg font-semibold text-green-600 mb-3">
                                Payout: {{ game.winner_payout || 0 }} coins
                            </div>

                            <div v-if="opponentInfo" class="bg-linear-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
                                <p class="text-gray-700 mb-3 font-medium">
                                    Did you enjoy playing this match?
                                </p>
                                <div class="flex justify-center">
                                    <AddFriendButton
                                        :opponent="opponentInfo"
                                        @added="handleFriendAdded"
                                    />
                                </div>
                            </div>

                            <Button @click="backToLobby" class="mt-3 bg-green-600" variant="default">
                                Back to Lobby
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <!-- RIGHT COLUMN: Chat Sidebar -->
            <div class="w-80 shrink-0">
                <GameChat v-if="gameID" :gameId="gameID" :gameCardRef="gameCardWrapper" />
            </div>

        </div>
    </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
