<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br bg-green-900 p-5 rounded-lg">
    <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
      <!-- Header -->
      <h1 class="text-5xl font-bold text-green-800 text-center mb-2">Login</h1>
      <p class="text-gray-600 text-center mt-5 mb-8">Welcome to the Bisca Platform</p>


      <form @submit.prevent="handleLogin" class="space-y-4">

        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="your@email.com"
            :class="[
              'w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none',
              errors.email ? 'border-red-500' : 'border-gray-300 focus:border-green-600'
            ]"
          />
          <span v-if="errors.email" class="text-red-500 text-xs mt-1 block">
            {{ errors.email[0] }}
          </span>
        </div>


        <div>
          <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Minimum 3 characters"
            :class="[
              'w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none',
              errors.password ? 'border-red-500' : 'border-gray-300 focus:border-green-600'
            ]"
          />
          <span v-if="errors.password" class="text-red-500 text-xs mt-1 block">
            {{ errors.password[0] }}
          </span>
        </div>


        <div
          v-if="errorMessage"
          class="p-3 bg-red-100 text-red-800 border border-red-300 rounded-lg text-sm"
        >
          {{ errorMessage }}
        </div>


        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-linear-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
        >
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>
      </form>


      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Don't have an account?</span>
        </div>
      </div>


      <router-link
        to="/register"
        class="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold text-center hover:bg-gray-200 transition-colors"
      >
        Register Now
      </router-link>


      <router-link
        to="/"
        class="block text-center mt-6 text-green-600 hover:text-green-700 font-medium text-sm hover:underline"
      >
        Back to Home Page
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter} from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'

const router = useRouter()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const form = ref({
  email: '',
  password: '',
})

const errors = ref({})
const errorMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  errors.value = {}
  errorMessage.value = ''

  const result = await authStore.login(form.value)

  if (result.success) {
    const redirect = '/'
    socketStore.emitJoin(authStore.currentUser)
    router.push(redirect)
  } else {
    errorMessage.value = result.message || 'Error logging in'
    errors.value = result.errors || {}

    console.error('Login error:', {
      message: result.message,
      errors: result.errors
    })
  }

  loading.value = false
}
</script>
