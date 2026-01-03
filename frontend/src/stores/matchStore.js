import { defineStore } from 'pinia'
import { useApiStore } from './api'

export const useMatchStore = defineStore('match', {
  state: () => ({

    is_match_mode: false, // true if we are playing in a match
    match_id: null,
    db_match_id: null,
    match_type: 9, // 3 ou 9
    match_status: 'Pending',
    
    // Players
    player1_id: null,
    player1_name: null,
    player2_id: null,
    player2_name: null,
    
    // Match scoring
    player1_marks: 0,
    player2_marks: 0,
    player1_total_points: 0,
    player2_total_points: 0,
    
    // Stake
    stake: 3,
    
    // Games history in this match
    games_played: [],
    current_game_number: 0,
    
    // Timestamps
    began_at: null,
    ended_at: null,
    
    // Winner
    winner_id: null,
    loser_id: null,
    
    // Match is over when one player reaches 4 marks
    match_over: false,
  }),
  

  getters: {
    //Verify if match ended
    isMatchOver: (state) => {
      return state.player1_marks >= 4 || state.player2_marks >= 4
    },

    //Returns the winner of the match
    matchWinner: (state) => {
      if (state.player1_marks >= 4) return 1
      if (state.player2_marks >= 4) return 2
      return null
    },

    //Returns the info of the match
    matchInfo: (state) => ({
      isMatchMode: state.is_match_mode,
      player1: {
        id: state.player1_id,
        name: state.player1_name,
        marks: state.player1_marks,
        total_points: state.player1_total_points
      },
      player2: {
        id: state.player2_id,
        name: state.player2_name,
        marks: state.player2_marks,
        total_points: state.player2_total_points
      },
      stake: state.stake,
      games_played: state.games_played.length,
      current_game: state.current_game_number,
      status: state.match_status,
      match_over: state.match_over
    }),

    //Game history in this match
    gamesHistory: (state) => {
      return state.games_played.map(game => {
        const winnerName = game.winner === 1 ? state.player1_name : state.player2_name
        const description = game.is_draw 
          ? `Jogo ${game.game_number}: Empate (${game.points_player1}-${game.points_player2})`
          : `Jogo ${game.game_number}: ${winnerName} ganhou ${game.marks_awarded} marca(s) (${game.points_player1}-${game.points_player2})`
        
        return {
          ...game,
          description
        }
      })
    },

    //Returns the payout of the match
    winnerPayout: (state) => {
      const totalStake = state.stake * 2
      const platformCommission = 1
      return totalStake - platformCommission
    }
  },

  actions: {
    //Start a match and save it in the database
    async startMatch(matchType = 9, player1, player2, stake = 3) {

      if (this.db_match_id) {
        console.log('[MATCH] Match already exists in database')
        return
      }

      const apiStore = useApiStore()

      this.is_match_mode = true
      this.match_type = matchType
      this.match_status = 'Playing'
      
      this.player1_id = player1
      this.player2_id = player2
      
      this.stake = Math.max(3, Math.min(100, stake))
      
      this.player1_marks = 0
      this.player2_marks = 0
      this.player1_total_points = 0
      this.player2_total_points = 0
      
      this.games_played = []
      this.current_game_number = 1
      
      this.began_at = new Date().toISOString()
      this.match_over = false
      this.winner_id = null
      this.loser_id = null

      try {
        const response = await apiStore.createMatch({
          type: String(this.match_type),
          player1_user_id: this.player1_id,
          player2_user_id: this.player2_id,
          stake: this.stake,
          began_at: this.began_at,
          status: 'Playing'
        })

        this.db_match_id = response.match.id
        console.log('Match saved to database with ID:', this.db_match_id)
        return response.match

      } catch (error) {

        console.error('Failed to save match to database:', error)
        throw error
      }
    },

    //Process the result of a game and save it in the database and update the match
    async processGameResult(gameResult) {
      const { 
        winner, 
        points_player1, 
        points_player2, 
        is_draw 
      } = gameResult

      //Create game record
      const gameRecord = {
        game_number: this.current_game_number,
        winner,
        points_player1,
        points_player2,
        is_draw,
        marks_awarded: 0,
        timestamp: new Date().toISOString()
      }

      //Stores game points of each player in the match
      this.player1_total_points += points_player1
      this.player2_total_points += points_player2

      //If there is a draw
      if (is_draw) {
        console.log('Tie -> No marks')
        gameRecord.marks_awarded = 0

      } else {
        //Calculate marks for the winner
        const winnerPoints = winner === 1 ? points_player1 : points_player2
        const marks = this.calculateMarks(winnerPoints)
        
        // Award marks to winner
        if (winner === 1) {
          this.player1_marks += marks
        } else {
          this.player2_marks += marks
        }

        gameRecord.marks_awarded = marks
      }

      // Add game to games played
      this.games_played.push(gameRecord)

      // Update match in database
      await this.updateMatchInDatabase()

      // Verify if match ended
      if (this.isMatchOver) {
        this.endMatch()
        return false
      } else {
        // Advance to next game
        this.current_game_number++
        return true
      }
    },

    //Calculate marks by points for the winner
    calculateMarks(winnerPoints) {
      if (winnerPoints === 120) {
        return 4 //Bandeira
      } else if (winnerPoints >= 91 && winnerPoints <= 119) {
        return 2 // Capote
      } else if (winnerPoints >= 61 && winnerPoints <= 90) {
        return 1 // Risca/Moca
      }
      return 0
    },

    //Ends match
    async endMatch() {
      this.match_status = 'Ended'
      this.match_over = true
      this.ended_at = new Date().toISOString()

      // Defines winner and loser
      if (this.player1_marks >= 4) {
        this.winner_id = this.player1_id
        this.loser_id = this.player2_id
      } else {
        this.winner_id = this.player2_id
        this.loser_id = this.player1_id
      }
      
      // Saves match in database
      await this.updateMatchInDatabase(true)
    },

    //In case of resignation
    async forfeitMatch(playerId) {
      console.log(`Jogador ${playerId} resigned from match`)
      
      this.match_status = 'Ended'
      this.match_over = true
      this.ended_at = new Date().toISOString()

      //The player who didn't resign is the winner
      if (playerId === this.player1_id) {
        this.winner_id = this.player2_id
        this.loser_id = this.player1_id
        this.player2_marks = 4
        this.player1_marks = 0
      } else {
        this.winner_id = this.player1_id
        this.loser_id = this.player2_id
        this.player1_marks = 4
        this.player2_marks = 0
      }

      // Saves match in database
      await this.updateMatchInDatabase(true)
    },

    //Updates match in database
    async updateMatchInDatabase(isFinal = false) {
      if (!this.db_match_id) {
        console.error('No database match with this ID found')
        return
      }

      const apiStore = useApiStore()

      try {
        const updateData = {
          player1_marks: this.player1_marks,
          player2_marks: this.player2_marks,
          player1_points: this.player1_total_points,
          player2_points: this.player2_total_points,
        }

        if (isFinal) {
          updateData.status = 'Ended'
          updateData.winner_user_id = this.winner_id
          updateData.loser_user_id = this.loser_id
          updateData.ended_at = new Date().toISOString()
          this.ended_at = updateData.ended_at
        }

        const response = await apiStore.updateMatch(this.db_match_id, updateData)
        console.log('Match updated:', response)
        return response
      } catch (error) {
        console.error('Failed to update match:', error)
      }
    },

    //Reset match
    resetMatch() {
      console.log('Resetting match...')
      this.$reset()
    }
  }
})