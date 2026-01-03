<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br bg-green-900 p-5 rounded-lg">
    <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <h1 class="text-5xl font-bold text-green-800 text-center mb-2">Create Account</h1>
      <p class="text-gray-600 text-center mt-5 mb-8 text-sm">
        Join the Bisca Platform and get 10 bonus coins!
      </p>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="space-y-4">

        <div>
          <label for="name" class="block text-sm font-semibold text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="João Silva"
            :class="[
              'w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none',
              errors.name ? 'border-red-500' : 'border-gray-300 focus:border-green-600'
            ]"
          />
          <span v-if="errors.name" class="text-red-500 text-xs mt-1 block">
            {{ errors.name[0] }}
          </span>
        </div>


        <div>
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">
            Email *
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
          <label for="nickname" class="block text-sm font-semibold text-gray-700 mb-1">
            Nickname *
          </label>
          <input
            id="nickname"
            v-model="form.nickname"
            type="text"
            required
            placeholder="Your game nickname"
            :class="[
              'w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none',
              errors.nickname ? 'border-red-500' : 'border-gray-300 focus:border-green-600'
            ]"
          />
          <span v-if="errors.nickname" class="text-red-500 text-xs mt-1 block">
            {{ errors.nickname[0] }}
          </span>
        </div>


        <div>
          <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">
            Password *
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


        <div>
          <label for="password_confirmation" class="block text-sm font-semibold text-gray-700 mb-1">
            Confirm Password *
          </label>
          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            required
            placeholder="Confirm your password"
            :class="[
              'w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none',
              passwordMismatch ? 'border-red-500' : 'border-gray-300 focus:border-green-600'
            ]"
          />
          <span v-if="passwordMismatch" class="text-red-500 text-xs mt-1 block">
            The passwords do not match
          </span>
        </div>


        <div>
          <label for="photo_avatar" class="block text-sm font-semibold text-gray-700 mb-1">
            Profile photo (optional)
          </label>
          <input
            id="photo_avatar"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <span v-if="errors.photo_avatar" class="text-red-500 text-xs mt-1 block">
            {{ errors.photo_avatar[0] }}
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
          :disabled="loading || passwordMismatch"
          class="w-full bg-linear-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span v-if="loading">Creating account...</span>
          <span v-else>Register</span>
        </button>
      </form>


      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Already have an account?</span>
        </div>
      </div>


      <router-link
        to="/login"
        class="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold text-center hover:bg-gray-200 transition-colors"
      >
        Login Here
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSocketStore } from '@/stores/socketStore'

const router = useRouter()
const authStore = useAuthStore()
const socketStore = useSocketStore()

const form = ref({
  name: '',
  email: '',
  nickname: '',
  password: '',
  password_confirmation: '',
  photo_avatar: null,
})

const errors = ref({})
const errorMessage = ref('')
const loading = ref(false)

const passwordMismatch = computed(() => {
  return form.value.password &&
         form.value.password_confirmation &&
         form.value.password !== form.value.password_confirmation
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.value.photo_avatar = file
  }
}

const handleRegister = async () => {
  if (passwordMismatch.value) return

  loading.value = true
  errors.value = {}
  errorMessage.value = ''

  const result = await authStore.register(form.value)

  if (result.success) {
    socketStore.emitJoin(authStore.currentUser)
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Erro ao registar'
    errors.value = result.errors || {}

    console.error('❌ Erro de registo:', {
      message: result.message,
      errors: result.errors
    })
  }

  loading.value = false
}
</script>
