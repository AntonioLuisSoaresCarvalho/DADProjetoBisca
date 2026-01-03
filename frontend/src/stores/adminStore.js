import { defineStore } from 'pinia'
import { useApiStore } from './api'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    transactions: [],
    games: [],
    statistics: null,
    loading: false,
    currentPage: 1,
    lastPage: 1,
    currentUserFilters: {}
  }),

  actions: {
    /**
     * Fetch all users
     */
    
    async fetchUsers(filters) {
      const api = useApiStore()
      this.loading = true
      this.currentUserFilters = { ...filters }
      try {
        const response = await api.getUsers(filters)
        this.users = response.data
        this.currentPage = response.current_page
        this.lastPage = response.last_page
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch users'
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Block a user
     */
    async blockUser(userId) {
      const api = useApiStore()
      try {
        const response = await api.blockUser(userId)
        
        // Update user in list
        const userIndex = this.users.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].blocked = true
        }
        
        return {
          success: true,
          message: response.message
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to block user'
        }
      }
    },

    /**
     * Unblock a user
     */
    async unblockUser(userId) {
      const api = useApiStore()
      try {
        const response = await api.unblockUser(userId)
        
        // Update user in list
        const userIndex = this.users.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex].blocked = false
        }
        
        return {
          success: true,
          message: response.message
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to unblock user'
        }
      }
    },

    /**
     * Create a new administrator
     */
    async createAdmin(adminData) {
      const api = useApiStore()
      try {
        const response = await api.createAdmin(adminData)
        
        return {
          success: true,
          message: response.message,
          user: response.user
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create administrator',
          errors: error.response?.data?.errors || {}
        }
      }
    },

    async restoreUser(userId) {
      const api = useApiStore()
      this.loading = true
      try {
        const response = await api.restoreUser(userId)
        
        // Reload users after restore
        await this.fetchUsers(this.currentUserFilters)
        
        return {
          success: true,
          message: response.message || 'User restored successfully'
        }
      } catch (error) {
        console.error('Error restoring user:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to restore user'
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a user
     */
    async deleteUser(userId) {
      const api = useApiStore()
      this.loading = true
      try {
        const response = await api.deleteUser(userId)
        
        // Instead of filtering out, reload the entire list to get updated data (including deleted_at)
        await this.fetchUsers(this.currentUserFilters)
        
        return {
          success: true,
          message: response.message
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete user'
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch all transactions
     */
    async fetchTransactions(filters) {
      const api = useApiStore()
      this.loading = true
      try {
        const response = await api.fetchTransactions(filters);
        this.transactions = response.data
        this.currentPage = response.current_page
        this.lastPage = response.last_page
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch transactions'
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch all games
     */
    async fetchGames(filters) {
      const api = useApiStore()
      this.loading = true
      try {
        const response = await api.fetchGames(filters);
        this.games = response.data
        this.currentPage = response.current_page
        this.lastPage = response.last_page
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch games'
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch platform statistics
     */
    async fetchStatistics() {
      const api = useApiStore()
      this.loading = true
      try {
        const response = await api.fetchStatistics();
        this.statistics = response
        return { success: true }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch statistics'
        }
      } finally {
        this.loading = false
      }
    },
  },
})