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
import MultiplayerLobbyPage from "@/pages/MultiplayerLobbyPage.vue"
import MultiplayerGamePage from "@/pages/MultiplayerGamePage.vue"

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