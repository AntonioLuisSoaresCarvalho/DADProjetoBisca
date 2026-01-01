// stores/match.js
import { defineStore } from 'pinia'
import { useApiStore } from './api'

export const useMatchStore = defineStore('match', {
  state: () => ({
    // Match info
    is_match_mode: false, // true se estamos em modo match, false para jogo avulso
    match_id: null,
    db_match_id: null,
    match_type: 9, // 3 ou 9
    match_status: 'Pending', // 'pending', 'playing', 'ended', 'interrupted'
    
    // Players
    player1_id: null,
    player1_name: null,
    player2_id: null,
    player2_name: null,
    
    // Match scoring
    player1_marks: 0, // marcas/riscas
    player2_marks: 0,
    player1_total_points: 0, // pontos acumulados de todos os jogos
    player2_total_points: 0,
    
    // Stake (aposta)
    stake: 3, // mínimo 3 moedas
    
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
    /**
     * Verifica se o match acabou (4 marcas)
     */
    isMatchOver: (state) => {
      return state.player1_marks >= 4 || state.player2_marks >= 4
    },

    /**
     * Retorna o vencedor do match (1, 2 ou null)
     */
    matchWinner: (state) => {
      if (state.player1_marks >= 4) return 1
      if (state.player2_marks >= 4) return 2
      return null
    },

    /**
     * Retorna informação do match atual
     */
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

    /**
     * Histórico de jogos formatado
     */
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

    /**
     * Calcula o payout do vencedor
     */
    winnerPayout: (state) => {
      const totalStake = state.stake * 2
      const platformCommission = 1
      return totalStake - platformCommission
    }
  },

  actions: {
    /**
     * Inicia um novo match
     */
    async startMatch(matchType = 9, player1, player2, stake = 3) {
      if (this.db_match_id) {
        console.log('⚠️ [MATCH] Match already exists in database, skipping creation')
        return
      }
      const apiStore = useApiStore()
      this.is_match_mode = true
      //this.match_id = `match_${Date.now()}`
      this.match_type = matchType
      this.match_status = 'Playing'
      
      this.player1_id = player1
      //this.player1_name = player1.name
      this.player2_id = player2
      //this.player2_name = player2.name
      
      this.stake = Math.max(3, Math.min(100, stake)) // Entre 3 e 100
      
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
      
      console.log(`🎮 Match iniciado: ${this.player1_id} vs ${this.player2_id}`)
      console.log(`   Tipo: Bisca de ${this.match_type}`)
      console.log(`   Stake: ${this.stake} moedas`)

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
        console.log('✅ Match saved to database with ID:', this.db_match_id)
        return response.match
      } catch (error) {
        console.error('❌ Failed to save match to database:', error)
        console.error('❌ Validation errors:', error.response?.data?.errors) // ADD THIS
        console.error('❌ Full response:', error.response?.data) // ADD THIS
        throw error
      }
    },

    /**
     * Processa o resultado de um jogo e atualiza as marcas
     * @param {Object} gameResult - { winner, points_player1, points_player2, is_draw }
     * @returns {boolean} - true se deve continuar com próximo jogo, false se match acabou
     */
    async processGameResult(gameResult) {
      const { 
        winner, 
        points_player1, 
        points_player2, 
        is_draw 
      } = gameResult

      console.log(`📊 Processando resultado do jogo ${this.current_game_number}`)

      // Cria registo do jogo
      const gameRecord = {
        game_number: this.current_game_number,
        winner,
        points_player1,
        points_player2,
        is_draw,
        marks_awarded: 0,
        timestamp: new Date().toISOString()
      }

      // Acumula pontos totais
      this.player1_total_points += points_player1
      this.player2_total_points += points_player2

      // Se foi empate, não dá marcas
      if (is_draw) {
        console.log(`   🤝 Empate - sem marcas`)
        gameRecord.marks_awarded = 0
      } else {
        // Calcula marcas baseado nos pontos do vencedor
        const winnerPoints = winner === 1 ? points_player1 : points_player2
        const marks = this.calculateMarks(winnerPoints)
        
        // Atribui as marcas ao vencedor
        if (winner === 1) {
          this.player1_marks += marks
          console.log(`   ✅ ${this.player1_name} ganhou ${marks} marca(s)`)
          console.log(`   📈 Marcas: ${this.player1_marks}/4`)
        } else {
          this.player2_marks += marks
          console.log(`   ✅ ${this.player2_name} ganhou ${marks} marca(s)`)
          console.log(`   📈 Marcas: ${this.player2_marks}/4`)
        }

        gameRecord.marks_awarded = marks
      }

      // Adiciona ao histórico
      this.games_played.push(gameRecord)

      await this.updateMatchInDatabase()

      // Verifica se o match acabou
      if (this.isMatchOver) {
        this.endMatch()
        return false // Match acabou, não continuar
      } else {
        // Próximo jogo
        this.current_game_number++
        console.log(`   ➡️ Próximo jogo: ${this.current_game_number}`)
        return true // Continuar com próximo jogo
      }
    },

    /**
     * Calcula as marcas baseado nos pontos do vencedor
     * @param {number} winnerPoints - pontos do vencedor
     * @returns {number} - número de marcas (1, 2 ou 4)
     */
    calculateMarks(winnerPoints) {
      if (winnerPoints === 120) {
        console.log(`   🏁 BANDEIRA! (120 pontos)`)
        return 4 // Bandeira - vitória automática do match
      } else if (winnerPoints >= 91 && winnerPoints <= 119) {
        console.log(`   💪 Capote! (${winnerPoints} pontos)`)
        return 2 // Capote
      } else if (winnerPoints >= 61 && winnerPoints <= 90) {
        console.log(`   ✓ Risca (${winnerPoints} pontos)`)
        return 1 // Risca/Moca
      }
      return 0
    },

    /**
     * Termina o match
     */
    async endMatch() {
      this.match_status = 'ended'
      this.match_over = true
      this.ended_at = new Date().toISOString()

      // Define vencedor e perdedor
      if (this.player1_marks >= 4) {
        this.winner_id = this.player1_id
        this.loser_id = this.player2_id
        console.log(`🏆 ${this.player1_name} VENCEU O MATCH!`)
      } else {
        this.winner_id = this.player2_id
        this.loser_id = this.player1_id
        console.log(`🏆 ${this.player2_name} VENCEU O MATCH!`)
      }

      console.log(`   Marcas finais: ${this.player1_marks} - ${this.player2_marks}`)
      console.log(`   Pontos totais: ${this.player1_total_points} - ${this.player2_total_points}`)
      console.log(`   💰 Payout: ${this.winnerPayout} moedas`)
      
      // Guarda o match no servidor
      await this.updateMatchInDatabase(true)
    },

    /**
     * Desiste do match (forfeit)
     * O jogador que desiste perde todo o match
     * @param {number|string} playerId - ID do jogador que desistiu
     */
    async forfeitMatch(playerId) {
      console.log(`❌ Jogador ${playerId} desistiu do match`)
      
      this.match_status = 'ended'
      this.match_over = true
      this.ended_at = new Date().toISOString()

      // O que não desistiu ganha automaticamente
      if (playerId === this.player1_id) {
        this.winner_id = this.player2_id
        this.loser_id = this.player1_id
        this.player2_marks = 4
      } else {
        this.winner_id = this.player1_id
        this.loser_id = this.player2_id
        this.player1_marks = 4
      }

      console.log(`   🏆 Vencedor por desistência: ${this.winner_id === this.player1_id ? this.player1_name : this.player2_name}`)

      await this.updateMatchInDatabase(true)
    },

    /**
     * Guarda o match no servidor (API)
     */
    async updateMatchInDatabase(isFinal = false) {
      if (!this.db_match_id) {
        console.error('❌ No database match ID found')
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
          updateData.ended_at = this.ended_at
        }

        const response = await apiStore.updateMatch(this.db_match_id, updateData)
        console.log('✅ Match updated in database:', response.match)
      } catch (error) {
        console.error('❌ Failed to update match:', error)
      }
    },

    /**
     * Reset do match
     */
    resetMatch() {
      console.log('🔄 A resetar match...')
      this.$reset()
    }
  }
})