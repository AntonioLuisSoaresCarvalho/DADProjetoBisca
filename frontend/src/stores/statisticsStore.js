import { defineStore } from 'pinia'
import { useApiStore } from '@/stores/api'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    loading: false,
    updatedAt: null,
    platform: {
      total_registered_players: 0,
      total_games_played: 0,
      total_matches_played: 0,
      games_today: 0,
      games_this_week: 0,
    },
    recent_activity: [],
    admin: {
      timeSeries: {},
      breakdowns: {},
      range: {}
    }
  }),

  actions: {
    async loadStats(isAdmin = false, days = 30) {
    const api = useApiStore()
      try {
        this.loading = true
        
        // Load public stats
        const data = await api.fetchPublicStatistics()

        // Update public stats
        if (data.platform) {
          this.platform = data.platform
        }
        if (data.recent_activity) {
          this.recent_activity = data.recent_activity
        }

        // Load admin stats if user is admin
        if (isAdmin) {
          
          const adminRes = await api.fetchAdminStatistics(days)
          
          if (adminRes.timeSeries) {
            this.admin.timeSeries = adminRes.timeSeries
          }
          if (adminRes.breakdowns) {
            this.admin.breakdowns = adminRes.breakdowns
          }
          if(adminRes.range){
            this.admin.range = adminRes.range
          }
        console.log('Admin stats loaded:', adminRes)
        }

        this.updatedAt = new Date()
        console.log('Public stats loaded:', data)
      } catch (error) {
        console.error('Error loading stats:', error)
        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data)
        }
      } finally {
        this.loading = false
      }
    }
  }
})