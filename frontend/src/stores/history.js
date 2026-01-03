import { defineStore } from "pinia";
import { useApiStore } from "./api";

export const useHistoryStore = defineStore("history",{
    state: () => ({

    games: [],
    gamesPagination: null,
    currentGame: null,
    gamesLoading: false,
    gamesError: null,

    matches: [],
    matchesPagination: null,
    currentMatch: null,
    matchesLoading: false,
    matchesError: null,
  }),

  getters: {
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
    async fetchUserGames(params = {}) {
      const api = useApiStore()
      this.gamesLoading = true
      this.gamesError = null

      try {
        const response = await api.getUserGames(params)
        this.games = response.data
        this.gamesPagination = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        }
      } catch (error) {

        this.gamesError = error.response?.data?.message || 'Failed to load games'
        console.error('Error fetching games:', error)
        throw error

      } finally {
        this.gamesLoading = false
      }
    },

    async fetchGameDetails(gameId, playerId = null) {
      const api = useApiStore()
      this.gamesLoading = true
      this.gamesError = null

      try {
        const params = playerId ? { playerId } : {}
        const response = await api.getGameDetails(gameId, params)
        this.currentGame = response.game
        return response

      } catch (error) {
        
        this.gamesError = error.response?.data?.message || 'Failed to load game details'
        console.error('Error fetching game details:', error)
        throw error

      } finally {
        this.gamesLoading = false
      }
    },

    async fetchPlayerGames(userId, params = {}) {
      const api = useApiStore()
      this.gamesLoading = true
      this.gamesError = null

      try {
        const response = await api.getPlayerGames(userId, params)
        this.games = response.data
        this.gamesPagination = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        }
      } catch (error) {
        this.gamesError = error.response?.data?.message || 'Failed to load player games'
        console.error('Error fetching player games:', error)
        throw error
      } finally {
        this.gamesLoading = false
      }
    },

    
    async fetchUserMatches(params = {}) {
      const api = useApiStore()
      this.matchesLoading = true
      this.matchesError = null

      try {
        const response = await api.getUserMatches(params)
        this.matches = response.data
        this.matchesPagination = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        }
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load matches'
        console.error('Error fetching matches:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    async fetchMatchDetails(matchId, playerId = null) {
      const api = useApiStore()
      this.matchesLoading = true
      this.matchesError = null

      try {
        const params = playerId ? { playerId } : {}
        const response = await api.getMatchDetails(matchId, params)
        this.currentMatch = response.match
        // Return the FULL response object, not just response.match
        return response 
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load match details'
        console.error('Error fetching match details:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    async fetchPlayerMatches(userId, params = {}) {
      const api = useApiStore()
      this.matchesLoading = true
      this.matchesError = null

      try {
        const response = await api.getPlayerMatches(userId, params)
        this.matches = response.data
        this.matchesPagination = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        }
      } catch (error) {
        this.matchesError = error.response?.data?.message || 'Failed to load player matches'
        console.error('Error fetching player matches:', error)
        throw error
      } finally {
        this.matchesLoading = false
      }
    },

    //Helper functions to help clear data
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
