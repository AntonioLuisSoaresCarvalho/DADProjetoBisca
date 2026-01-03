import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useApiStore } from '@/stores/api'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ProfileView from '@/views/user/ProfileView.vue'
import CoinsView from '@/views/coins/CoinsView.vue'
import BuyCoinsView from '@/views/coins/BuyCoinsView.vue'
import CoinHistoryView from '@/views/coins/CoinHistoryView.vue'
import AdminView from "@/views/admin/AdminView.vue"
import SinglePlayerView from "@/views/game/SinglePlayerPage.vue"
import MultiplayerLobbyPage from "@/views/game/MultiplayerLobbyPage.vue"
import MultiplayerGamePage from "@/views/game/MultiplayerGamePage.vue"

import LeaderboardView from "@/views/leaderboard/LeaderboardView.vue";
import GameHistoryView from "@/views/history/games/GameHistoryView.vue";
import MatchHistoryView from "@/views/history/matches/MatchHistoryView.vue";
import GameDetailsView from "@/views/history/games/GameDetailsView.vue";
import MatchDetailsView from "@/views/history/matches/MatchDetailsView.vue";
import PlayView from "@/views/game/StartGameView.vue"

import FriendsPage from '@/views/user/FriendsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: HomeView },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },
    { path: "/profile", component: ProfileView, meta: { requiresAuth: true } },
    { path: "/coins", component: CoinsView, meta: { requiresAuth: true, requirePlayer: true } },
    { path: "/coins/buy", component: BuyCoinsView, meta: { requiresAuth: true, requirePlayer: true } },
    { path: "/coins/history", component: CoinHistoryView, meta: { requiresAuth: true, requirePlayer: true } },
    {
      path: '/admin',
      name: 'Admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/play',
      name: 'Play',
      component: PlayView,
      meta: { requiresAuth: true, title: 'Play - Choose Game Mode' }
    },
    {
      path: '/games/singleplayer',
      name: 'SinglePlayer',
      component: SinglePlayerView,
      meta: { requiresAuth: true }
    },
    {
      path: '/lobby',
      name: 'Lobby',
      component: MultiplayerLobbyPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/multiplayer',
      name: 'Multiplayer',
      component: MultiplayerGamePage,
      meta: { requiresAuth: true }
    },

    {
      path: '/leaderboard',
      component: LeaderboardView,
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/statistics/StatisticsView.vue'),
    },

    {
      path: '/history/games',
      name: 'GameHistory',
      component: GameHistoryView,
      meta: { requiresAuth: true }
    },

    {
      path: '/history/matches',
      name: 'MatchHistory',
      component: MatchHistoryView,
      meta: { requiresAuth: true }
    },

    {
      path: '/history/games/:id',
      name: 'GameDetails',
      component: GameDetailsView,
      meta: { requiresAuth: true, title: 'Game Details' }
    },

    {
      path: '/history/matches/:id',
      name: 'MatchDetails',
      component: MatchDetailsView,
      meta: { requiresAuth: true, title: 'Match Details' }
    },

    {
      path: '/admin',
      name: 'Admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
      {
      path: '/friends',
      name: 'Friends',
      component: FriendsPage,
      meta: { requiresAuth: true,requirePlayer: true }
    }
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const api = useApiStore()

  // Load user profile if token exists but user not loaded
  if (api.token && !auth.user) {
    await auth.fetchProfile()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !api.token) {
    return "/login"
  }

  // Check if route requires player type
  if (to.meta.requirePlayer && auth.user?.type !== 'P') {
    return "/"
  }

  // Check if route requires admin type
  if (to.meta.requiresAdmin && auth.user?.type !== 'A') {
    return "/"
  }
})

export default router
