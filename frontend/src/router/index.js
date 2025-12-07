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


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: HomeView },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },

    { path: "/profile", component: ProfileView, meta: { requiresAuth: true }},

    { path: "/coins", component: CoinsView, meta: { requiresAuth: true, requirePlayer:true } },
    { path: "/coins/buy", component: BuyCoinsView, meta: { requiresAuth: true, requirePlayer:true } },
    { path: "/coins/history", component: CoinHistoryView, meta: { requiresAuth: true, requirePlayer:true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const api = useApiStore()

  if (api.token && !auth.user) {
    await auth.fetchProfile();
  }

  if (to.meta.requiresAuth && !api.token) {
    return "/login";
  }
});

export default router
