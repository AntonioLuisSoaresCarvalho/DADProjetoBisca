<template>
  <div class="p-6 bg-green-50 min-h-screen">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <h1 class="text-3xl font-bold text-green-700 mb-6">👤 O Meu Perfil</h1>

      
      <div class="bg-white rounded-lg shadow-md border border-green-300 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          <div class="flex items-center gap-4">
            
            <div class="shrink-0">
              <img 
                v-if="user?.photo_avatar_filename" 
                :src="user.photo_avatar_url" 
                :alt="user.nickname"
                class="w-24 h-24 rounded-full object-cover border-4 border-green-600"
              />
              <div 
                v-else 
                class="w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-green-600"
              >
                {{ user?.nickname?.charAt(0).toUpperCase() }}
              </div>
            </div>

            <!-- User Info -->
            <div>
              <h2 class="text-2xl font-bold text-gray-800">{{ user?.nickname }}</h2>
              <p class="mt-1">
                <span 
                  v-if="isAdmin" 
                  class="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-semibold"
                >
                  🛡️ Administrador
                </span>
                <span 
                  v-else 
                  class="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-semibold"
                >
                  🎮 Jogador
                </span>
              </p>
              <p v-if="isPlayer" class="mt-2 text-gray-600 text-lg">
                💰 <strong>{{ user?.coins_balance || 0 }}</strong> moedas
              </p>
            </div>
          </div>

          
          <div class="flex gap-3">
            <button 
              v-if="!editMode" 
              @click="enableEditMode" 
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              ✏️ Editar Perfil
            </button>
            <button 
              v-if="editMode" 
              @click="cancelEdit" 
              class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
      <div v-if="editMode" class="bg-white rounded-lg shadow-md border border-green-300 p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Editar Informações do Perfil</h3>
        
        <form @submit.prevent="handleUpdate" class="space-y-4">
          
          <div>
            <label for="name" class="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
            <input
              id="name"
              v-model="editForm.name"
              type="text"
              placeholder="Seu nome completo"
              :class="[
                'w-full px-4 py-2 border-2 rounded-lg transition-colors',
                errors.name ? 'border-red-500' : 'border-gray-300 focus:border-green-600 focus:outline-none'
              ]"
            />
            <span v-if="errors.name" class="text-red-500 text-xs mt-1 block">{{ errors.name[0] }}</span>
          </div>

          
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              id="email"
              v-model="editForm.email"
              type="email"
              placeholder="seu@email.com"
              :class="[
                'w-full px-4 py-2 border-2 rounded-lg transition-colors',
                errors.email ? 'border-red-500' : 'border-gray-300 focus:border-green-600 focus:outline-none'
              ]"
            />
            <span v-if="errors.email" class="text-red-500 text-xs mt-1 block">{{ errors.email[0] }}</span>
          </div>

          
          <div>
            <label for="nickname" class="block text-sm font-semibold text-gray-700 mb-1">Nickname</label>
            <input
              id="nickname"
              v-model="editForm.nickname"
              type="text"
              placeholder="Seu nickname de jogo"
              :class="[
                'w-full px-4 py-2 border-2 rounded-lg transition-colors',
                errors.nickname ? 'border-red-500' : 'border-gray-300 focus:border-green-600 focus:outline-none'
              ]"
            />
            <span v-if="errors.nickname" class="text-red-500 text-xs mt-1 block">{{ errors.nickname[0] }}</span>
          </div>

          
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">
              Nova Password (deixe vazio para manter a atual)
            </label>
            <input
              id="password"
              v-model="editForm.password"
              type="password"
              placeholder="Mínimo 3 caracteres"
              :class="[
                'w-full px-4 py-2 border-2 rounded-lg transition-colors',
                errors.password ? 'border-red-500' : 'border-gray-300 focus:border-green-600 focus:outline-none'
              ]"
            />
            <span v-if="errors.password" class="text-red-500 text-xs mt-1 block">{{ errors.password[0] }}</span>
          </div>

          
          <div>
            <label for="photo_avatar" class="block text-sm font-semibold text-gray-700 mb-1">Foto de Perfil</label>
            <input
              id="photo_avatar"
              type="file"
              accept="image/*"
              @change="handleFileUpload"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
            />
            <span v-if="errors.photo_avatar" class="text-red-500 text-xs mt-1 block">{{ errors.photo_avatar[0] }}</span>
          </div>

          
          <div 
            v-if="updateMessage" 
            :class="[
              'p-3 rounded-lg text-sm font-semibold',
              updateMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
            ]"
          >
            {{ updateMessage.text }}
          </div>

          
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-semibold"
          >
            <span v-if="loading">A atualizar...</span>
            <span v-else>💾 Guardar Alterações</span>
          </button>
        </form>
      </div>

      <!-- Display Mode -->
      <div v-else class="bg-white rounded-lg shadow-md border border-green-300 p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Informações do Perfil</h3>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Nome Completo:</span>
            <span class="text-gray-800 font-semibold">{{ user?.name }}</span>
          </div>
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Email:</span>
            <span class="text-gray-800 font-semibold">{{ user?.email }}</span>
          </div>
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Nickname:</span>
            <span class="text-gray-800 font-semibold">{{ user?.nickname }}</span>
          </div>
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Tipo de Conta:</span>
            <span class="text-gray-800 font-semibold">{{ isAdmin ? 'Administrador' : 'Jogador' }}</span>
          </div>
          <div v-if="isPlayer" class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Saldo de Moedas:</span>
            <span class="text-gray-800 font-semibold">{{ user?.coins_balance || 0 }} moedas</span>
          </div>
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span class="text-gray-600 font-medium">Membro Desde:</span>
            <span class="text-gray-800 font-semibold">{{ formatDate(user?.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="bg-white rounded-lg shadow-md border border-green-300 p-6 mb-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Links Rápidos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <router-link 
            v-if="isPlayer" 
            to="/coins" 
            class="block p-4 bg-gray-50 rounded-lg text-green-600 font-semibold text-center hover:bg-green-600 hover:text-white transition-colors"
          >
            💰 Gerir Moedas
          </router-link>
        </div>
      </div>
    
      <div class="bg-white rounded-lg shadow-md border-2 border-red-500 p-6">
        <h3 class="text-xl font-bold text-red-600 mb-2">⚠️ Zona de Perigo</h3>
        <p class="text-gray-600 mb-4">
          Uma vez que apague a sua conta, não há volta atrás. Todas as suas moedas serão perdidas.
        </p>
        
        <button 
          v-if="!showDeleteConfirm" 
          @click="showDeleteConfirm = true" 
          class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          🗑️ Apagar Conta
        </button>

        <!-- Delete Confirmation -->
        <div v-if="showDeleteConfirm" class="mt-4 p-4 bg-red-50 rounded-lg">
          <p class="font-semibold text-gray-800 mb-2">Tem a certeza? Esta ação não pode ser revertida.</p>
          <p class="text-gray-600 mb-3">
            Insira a sua {{ confirmationType}} para confirmar:
          </p>
          
          <div class="flex gap-4 mb-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="password" 
                v-model="confirmationType"
                class="text-green-600 focus:ring-green-600"
              />
              <span class="text-sm">Confirmar com password</span>
            </label>
          </div>

          <input
            v-model="deleteConfirmation"
            :type="confirmationType === 'password' ? 'password' : 'text'"
            :placeholder="confirmationType === 'nickname' ? 'Insira o seu nickname' : 'Insira a sua password'"
            class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none mb-3"
          />

          <div v-if="deleteMessage" class="p-3 bg-red-100 text-red-800 border border-red-300 rounded-lg text-sm mb-3">
            {{ deleteMessage }}
          </div>

          <div class="flex flex-col md:flex-row gap-3">
            <button 
              @click="handleDelete" 
              :disabled="loadingDelete"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <span v-if="loadingDelete">A apagar...</span>
              <span v-else>Confirmar Eliminação</span>
            </button>
            <button 
              @click="cancelDelete" 
              class="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isPlayer = computed(() => authStore.isPlayer)

const editMode = ref(false)
const editForm = ref({
  name: '',
  email: '',
  nickname: '',
  password: '',
  photo_avatar: null,
})

const errors = ref({})
const updateMessage = ref(null)
const loading = ref(false)

const showDeleteConfirm = ref(false)
const confirmationType = ref('password')
const deleteConfirmation = ref('')
const deleteMessage = ref('')
const loadingDelete = ref(false)

onMounted(() => {
  if (!authStore.user) {
    authStore.fetchProfile()
  }
})

const enableEditMode = () => {
  editForm.value = {
    name: user.value.name,
    email: user.value.email,
    nickname: user.value.nickname,
    password: '',
    photo_avatar: null,
  }
  editMode.value = true
  updateMessage.value = null
  errors.value = {}
}

const cancelEdit = () => {
  editMode.value = false
  editForm.value = {
    name: '',
    email: '',
    nickname: '',
    password: '',
    photo_avatar: null,
  }
  updateMessage.value = null
  errors.value = {}
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    editForm.value.photo_avatar = file
  }
}

const handleUpdate = async () => {
  loading.value = true
  updateMessage.value = null
  errors.value = {}

  const result = await authStore.updateProfile(editForm.value)

  if (result.success) {
    updateMessage.value = { type: 'success', text: result.message }
    
    setTimeout(() => {
      editMode.value = false
      updateMessage.value = null
    }, 2000)
  } else {
    updateMessage.value = { type: 'error', text: result.message }
    errors.value = result.errors || {}
  }

  loading.value = false
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteConfirmation.value = ''
  deleteMessage.value = ''
}

const handleDelete = async () => {
  if (!deleteConfirmation.value) {
    deleteMessage.value = 'Por favor insira a confirmação'
    return
  }

  loadingDelete.value = true
  deleteMessage.value = ''

  const result = await authStore.deleteAccount(deleteConfirmation.value)

  if (result.success) {
    alert(result.message)
    router.push('/')
  } else {
    deleteMessage.value = result.message
  }

  loadingDelete.value = false
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>