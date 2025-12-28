import { defineStore } from "pinia";
import axios from "axios";

const API_URL = 'http://localhost:8000/api'

export const useHistoryStore = defineStore("history",{
    state: () => ({
    // Games
    games: [],
    gamesPagination: null,
    currentGame: null,
    gamesLoading: false,
    gamesError: null,

    // Matches
    matches: [],
    matchesPagination: null,
    currentMatch: null,
    matchesLoading: false,
    matchesError: null,
  }),

  getters: {
    // Helper to get stats by variant
    getStatsByVariant: (state) => (variant) => {
      if (!state.personalStats) return null
      return state.personalStats[variant] || null
    },

    // Check if user has played any games
    hasGames: (state) => state.games.length > 0,
    
    // Check if user has played any matches
    hasMatches: (state) => state.matches.length > 0
  },

  actions: {
    // ==========================================
    // GAMES HISTORY
    // ==========================================
    async fetchUserGames(params = {}) {
      this.gamesLoading = true
      this.gamesError = null

      try {
        const response = await axios.get(`${API_URL}/history/games`, { params })
        this.games = response.data.data
        this.gamesPagination = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        }
      } catch (error) {
        this.gamesError = error.response?.data?.message || 'Failed to load games'
        console.error('Error fetching games:', error)
        throw error
      } finally {
        this.gamesLoading = false
      }
    },

    async fetchGameDetails(gameId) {
      this.gamesLoading = true
      this.gamesError = null

      try {
        const response = await axios.get(`${API_URL}/history/games/${gameId}`)
        this.currentGame = response.data.game
        return response.data.game
      } catch (error) {
        this.gamesError = error.response?.data?.message || 'Failed to load game details'
        console.error('Error fetching game details:', error)
        throw error
      } finally {
        this.gamesLoading = false
      }
    },

    // Admin - fetch any player's games
    async fetchPlayerGames(userId, params = {}) {
      this.gamesLoading = true
      this.gamesError = null

      try {
        const response = await axios.get(`${API_URL}/admin/history/games/${userId}`, { params })
        this.games = response.data.data
        this.gamesPagination = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        }
      } catch (error) {
        this.gamesError = error.response?.data?.message || 'Failed to load player games'
        console.error('Error fetching player games:', error)
        throw error
      } finally {
        this.gamesLoading = false
      }
    },

    // ==========================================
    // MATCHES HISTORY
    // ==========================================
    async fetchUserMatches(params = {}) {
      this.matchesLoading = true
      this.matchesError = null

      try {
        const response = await axios.get(`${API_URL}/history/matches`, { params })
        this.matches = response.data.data
        this.matchesPagination = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        }
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load matches'
        console.error('Error fetching matches:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    async fetchMatchDetails(matchId) {
      this.matchesLoading = true
      this.matchesError = null

      try {
        const response = await apiClient.get(`${API_URL}/history/matches/${matchId}`)
        this.currentMatch = response.data.match
        return response.data.match
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load match details'
        console.error('Error fetching match details:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    // Admin - fetch any player's matches
    async fetchPlayerMatches(userId, params = {}) {
      this.matchesLoading = true
      this.matchesError = null

      try {
        const response = await apiClient.get(`${API_URL}/admin/history/matches/${userId}`, { params })
        this.matches = response.data.data
        this.matchesPagination = {
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        }
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load player matches'
        console.error('Error fetching player matches:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    // ==========================================
    // UTILITY ACTIONS
    // ==========================================
    clearGames() {
      this.games = []
      this.gamesPagination = null
      this.currentGame = null
    },

    clearMatches() {
      this.matches = []
      this.matchesPagination = null
      this.currentMatch = null
    },

    clearAll() {
      this.clearGames()
      this.clearMatches()
    }
  }





})