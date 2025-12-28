import { defineStore } from "pinia";
import axios from "axios";

const API_URL = 'http://localhost:8000/api'

export const useLeaderboardStore = defineStore("leaderboards", {
  state: () => ({
    activeTab: "games",
    variantFilter: "",
    loading: false,
    loadingPersonal: false,

    leaders: [],

    personalStats: {
      games: {
        total: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        capotes: 0,
        bandeiras: 0,
        win_rate: 0,
      },
      matches: {
        total: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
      },
    },
  }),

  actions: {
    async loadData(isAuthenticated) {
      if (this.activeTab === "personal" && isAuthenticated) {
        await this.loadPersonalStats();
      } else {
        await this.loadGlobalLeaderboard();
      }
    },

    async loadPersonalStats() {
      this.loadingPersonal = true;

      try {
        const params = {};
        if (this.variantFilter) params.type = this.variantFilter;

        const response = await axios.get(`${API_URL}/leaderboards/personal`, { params });
        this.personalStats = response.data;

      } catch (error) {
        console.error("Error loading personal stats:", error);
      } finally {
        this.loadingPersonal = false;
      }
    },

    async loadGlobalLeaderboard() {
      this.loading = true;

      try {
        const params = {};
        if (this.variantFilter) params.type = this.variantFilter;

        const endpoints = {
          games: `${API_URL}/leaderboards/global/games`,
          matches: `${API_URL}/leaderboards/global/matches`,
          capotes: `${API_URL}/leaderboards/global/capotes`,
          bandeiras: `${API_URL}/leaderboards/global/bandeiras`,
        };

        const response = await axios.get(endpoints[this.activeTab], { params });
        this.leaders = response.data;

      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        this.loading = false;
      }
    },

    getScoreLabel() {
      const labels = {
        games: "Wins",
        matches: "Wins",
        capotes: "Capotes",
        bandeiras: "Bandeiras",
      };
      return labels[this.activeTab] || "Score";
    },

    getScore(leader) {
      return leader.wins || leader.capotes || leader.bandeiras || 0;
    },
  },
});
