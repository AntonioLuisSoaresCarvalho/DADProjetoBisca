import { defineStore } from "pinia";
import { useApiStore } from "./api";

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
      const api = useApiStore()
      this.loadingPersonal = true;

      try {
        const params = {};
        if (this.variantFilter) params.type = this.variantFilter;

        const response = await api.getPersonalStats(params)
        this.personalStats = response;

      } catch (error) {
        console.error("Error loading personal stats:", error);
      } finally {
        this.loadingPersonal = false;
      }
    },

    async loadGlobalLeaderboard() {
      const api = useApiStore()
      this.loading = true;

      try {
        const params = {};
        if (this.variantFilter) params.type = this.variantFilter;

        const response = await api.getGlobalLeaderboard(this.activeTab, params)
        this.leaders = response;

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
