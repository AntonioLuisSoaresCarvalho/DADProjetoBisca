<template>
  <div class="min-h-screen bg-green-900 text-white py-12 px-6">
    <div class="max-w-7xl mx-auto">

      <!-- Header / Hero small -->
      <header class="mb-8 text-center">
        <h1 class="text-4xl font-extrabold drop-shadow-md">Administration Panel</h1>
        <p class="mt-2 text-green-100/90 max-w-2xl mx-auto">Manage users, transactions, games and matches and statistics.</p>
      </header>

      <!-- Tabs Card -->
      <div class="bg-white border border-green-300 rounded-2xl shadow p-5 mb-8 text-green-900">
        <nav class="flex flex-wrap gap-2 items-center">
          <button
            @click="activeTab = 'users'"
            :class="tabClass('users')"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Users
          </button>

          <button
            @click="activeTab = 'transactions'"
            :class="tabClass('transactions')"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Transactions
          </button>

          <button
            @click="activeTab = 'games'"
            :class="tabClass('games')"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Games
          </button>

          <button
            @click="activeTab = 'statistics'"
            :class="tabClass('statistics')"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Statistics
          </button>

          <button
            @click="activeTab = 'create-admin'"
            :class="tabClass('create-admin')"
            class="ml-auto px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Create Admin
          </button>
        </nav>
      </div>

      <!-- CONTENT AREA (white card) -->
      <section class="bg-white border border-green-300 rounded-2xl shadow p-8 text-green-900">

        <!-- USERS -->
        <div v-if="activeTab === 'users'">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold">User Management</h2>
              <p class="text-sm text-green-700/80 mt-1">Procura, filtra e gere utilizadores.</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <select v-model="userFilters.type" @change="loadUsers" class="px-3 py-2 border rounded-lg text-sm border-green-200">
                <option value="">All Types</option>
                <option value="P">Players</option>
                <option value="A">Administrators</option>
              </select>

              <select v-model="userFilters.blocked" @change="loadUsers" class="px-3 py-2 border rounded-lg text-sm border-green-200">
                <option value="">All Status</option>
                <option value="0">Active</option>
                <option value="1">Blocked</option>
              </select>

              <input
                v-model="userFilters.search"
                @input="debounceSearch"
                placeholder="Search by name, email, nickname..."
                type="text"
                class="px-3 py-2 border rounded-lg text-sm w-64 border-green-200"
              />
            </div>
          </div>

          <div v-if="loading" class="py-12 text-center text-green-600">Loading users...</div>

          <div v-else-if="users.length === 0" class="py-12 text-center text-green-600">No users found</div>

          <div v-else class="overflow-x-auto -mx-4">
            <table class="min-w-full divide-y divide-green-100">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Name</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Email</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Nickname</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Type</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Coins</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Status</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-green-50">
                <tr v-for="user in users" :key="user.id" class="hover:bg-green-50/30">
                  <td class="px-4 py-3 text-sm text-green-800">{{ user.id }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ user.name }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ user.email }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ user.nickname }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      :class="user.type === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-50 text-pink-700'"
                    >
                      {{ user.type === 'A' ? 'Admin' : 'Player' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ user.coins_balance }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      :class="user.blocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'"
                    >
                      {{ user.blocked ? 'Blocked' : 'Active' }}
                    </span>
                    <span
                        v-if="user.deleted_at"
                        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"
                      >
                        Deleted
                      </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-if="user.deleted_at"
                        @click="handleRestoreUser(user.id)"
                        class="px-3 py-1 rounded-lg border border-blue-300 text-blue-800 text-sm font-semibold bg-blue-50 hover:bg-blue-100"
                      >
                        Restore
                      </button>
                      <button
                        v-if="!user.blocked && user.type === 'P' && !user.deleted_at"
                        @click="handleBlockUser(user.id)"
                        class="px-3 py-1 rounded-lg border border-amber-300 text-amber-800 text-sm font-semibold bg-amber-50 hover:bg-amber-100"
                      >
                        Block
                      </button>

                      <button
                        v-if="user.blocked && !user.deleted_at"
                        @click="handleUnblockUser(user.id)"
                        class="px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800 text-sm font-semibold bg-emerald-50 hover:bg-emerald-100"
                      >
                        Unblock
                      </button>

                      <button
                        v-if="!user.deleted_at"
                        @click="handleDeleteUser(user.id)"
                        class="px-3 py-1 rounded-lg border border-red-200 text-red-700 text-sm font-semibold bg-red-50 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- PAGINAÇÃO -->
            <Pagination
        :currentPage="adminStore.currentPage"
        :lastPage="adminStore.lastPage"
        :changePage="changePage"
      />
        </div>

        <!-- TRANSACTIONS -->
        <div v-if="activeTab === 'transactions'">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div class="mb-6">
              <h2 class="text-2xl font-bold">All Transactions</h2>
              <p class="text-sm text-green-700/80 mt-1">Registo cronológico de operações com moedas.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
              <select v-model="transactionFilters.transaction_type_id" @change="loadTransactions" class="px-3 py-2 border rounded-lg text-sm border-green-200">
                <option value="">All Types</option>
                <option value="C">Credit</option>
                <option value="D">Debit</option>
              </select>

              <input
                v-model="transactionFilters.search"
                @input="debounceTransactionSearch"
                placeholder="Search by user nickname..."
                type="text"
                class="px-3 py-2 border rounded-lg text-sm w-64 border-green-200"
              />
            </div>
          </div>
          
          <div v-if="loading" class="py-12 text-center text-green-600">Loading transactions...</div>

          <div v-else-if="transactions.length === 0" class="py-12 text-center text-green-600">No transactions found</div>

          <div v-else class="overflow-x-auto -mx-4">
            <table class="min-w-full divide-y divide-green-100">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Date</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">User</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Type</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Amount</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Game/Match</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-green-50">
                <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-green-50/30">
                  <td class="px-4 py-3 text-sm text-green-800">{{ transaction.id }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ formatDate(transaction.transaction_datetime) }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ transaction.user?.nickname || 'N/A' }}</td>
                  <td class="px-4 py-3 text-sm text-green-800">{{ transaction.type?.name || 'N/A' }} 
                    <span class="font-bold text-green-700">
                      ({{ transaction.type?.type }})
                    </span> </td>
                  <td class="px-4 py-3 text-sm" :class="transaction.coins > 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'">
                    {{ transaction.coins > 0 ? '+' : '' }}{{ transaction.coins }}
                  </td>
                  <td class="px-4 py-3 text-sm text-green-800">
                    <span v-if="transaction.game_id">Game #{{ transaction.game_id }}</span>
                    <span v-else-if="transaction.match_id">Match #{{ transaction.match_id }}</span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- PAGINAÇÃO TRANSACTIONS -->
          <Pagination
        :currentPage="transactionsPagination.currentPage"
        :lastPage="transactionsPagination.lastPage"
        :changePage="loadTransactionsPage"
      />
        </div>

        <!-- GAMES -->
        <div v-if="activeTab === 'games'">
        <!-- Header + filtros -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
            <h2 class="text-2xl font-bold">Game Management</h2>
            <p class="text-sm text-green-700/80 mt-1">Procura e filtra partidas registadas.</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <!-- Tipo de jogo -->
            <select v-model="gameFilters.type" @change="loadGames" class="px-3 py-2 border rounded-lg text-sm border-green-200">
                <option value="">All Types</option>
                <option value="3">Bisca de 3</option>
                <option value="9">Bisca de 9</option>
            </select>

            <!-- Status do jogo -->
            <select v-model="gameFilters.status" @change="loadGames" class="px-3 py-2 border rounded-lg text-sm border-green-200">
                <option value="">All Status</option>
                <option value="Ended">Ended</option>
                <option value="Playing">Playing</option>
                <option value="Pending">Pending</option>
                <option value="Interrupted">Interrupted</option>
            </select>

            <!-- Search por nickname dos jogadores -->
            <input
                v-model="gameFilters.search"
                @input="debounceGameSearch"
                placeholder="Search by player nickname..."
                type="text"
                class="px-3 py-2 border rounded-lg text-sm w-64 border-green-200"
            />
            </div>
        </div>

        <!-- Loading / empty -->
        <div v-if="loading" class="py-12 text-center text-green-600">Loading games...</div>
        <div v-else-if="games.length === 0" class="py-12 text-center text-green-600">No games found</div>

        <!-- Tabela de games -->
        <div v-else class="overflow-x-auto -mx-4">
            <table class="min-w-full divide-y divide-green-100">
            <thead>
                <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">ID</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Type</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Player 1</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Player 2</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Winner</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Match</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-green-700">Started</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-green-50">
                <tr v-for="game in games" :key="game.id" class="hover:bg-green-50/30">
                <td class="px-4 py-3 text-sm text-green-800">{{ game.id }}</td>
                <td class="px-4 py-3 text-sm text-green-800">Bisca de {{ game.type }}</td>
                <td class="px-4 py-3 text-sm text-green-800">{{ game.player1?.nickname || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-green-800">{{ game.player2?.nickname || 'N/A' }}</td>
                <td class="px-4 py-3 text-sm text-green-800">{{ game.winner?.nickname || (game.is_draw ? 'Draw' : 'N/A') }}</td>
                <td class="px-4 py-3 text-sm text-green-800">
                  <div v-if="game.match" class="space-y-1">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                      Match #{{ game.match.id }}
                    </span>
                    <div class="text-xs text-gray-600">
                      Stake: {{ game.match.stake }} coins
                    </div>
                  </div>
                  <span v-else class="text-gray-400">N/A</span>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    :class="getGameStatusClass(game.status)">
                    {{ game.status }}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-green-800">{{ formatDate(game.began_at) }}</td>
                </tr>
            </tbody>
            </table>
        </div>

        <!-- Paginação -->
        <Pagination
        :currentPage="gamesPagination.currentPage"
        :lastPage="gamesPagination.lastPage"
        :changePage="loadGamesPage"
      />
        </div>

        <!-- STATISTICS -->
        <div v-if="activeTab === 'statistics'">
          <div class="mb-6">
            <h2 class="text-2xl font-bold">Platform Statistics</h2>
            <p class="text-sm text-green-700/80 mt-1">Resumo rápido de métricas essenciais.</p>
          </div>

          <div v-if="loading" class="py-12 text-center text-green-600">Loading statistics...</div>

          <div v-else-if="statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-emerald-800">👥 Users</h3>
              <div class="mt-3 space-y-2 text-sm text-emerald-900">
                <div class="flex justify-between"><span>Total Users:</span><strong>{{ statistics.users.total }}</strong></div>
                <div class="flex justify-between"><span>Players:</span><strong>{{ statistics.users.players }}</strong></div>
                <div class="flex justify-between"><span>Administrators:</span><strong>{{ statistics.users.administrators }}</strong></div>
                <div class="flex justify-between"><span>Blocked:</span><strong>{{ statistics.users.blocked }}</strong></div>
              </div>
            </div>

            
            <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-emerald-800">🎮 Games</h3>
              <div class="mt-3 space-y-2 text-sm text-emerald-900">
                <div class="flex justify-between"><span>Total Games:</span><strong>{{ statistics.games.total }}</strong></div>
                <div class="flex justify-between"><span>Today:</span><strong>{{ statistics.games.today }}</strong></div>
                <div class="flex justify-between"><span>This Week:</span><strong>{{ statistics.games.this_week }}</strong></div>
                <div class="flex justify-between"><span>This Month:</span><strong>{{ statistics.games.this_month }}</strong></div>
              </div>
            </div>

            
            <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-emerald-800">💰 Coins</h3>
              <div class="mt-3 space-y-2 text-sm text-emerald-900">
                <div class="flex justify-between"><span>Total in Circulation:</span><strong>{{ statistics.coins.total_in_circulation }}</strong></div>
                <div class="flex justify-between"><span>Average Balance:</span><strong>{{ statistics.coins.average_balance }}</strong></div>
              </div>
            </div>

            
            <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-emerald-800">💳 Transactions</h3>
              <div class="mt-3 space-y-2 text-sm text-emerald-900">
                <div class="flex justify-between"><span>Total Transactions:</span><strong>{{ statistics.transactions.total }}</strong></div>
                <div class="flex justify-between"><span>Coins Purchased:</span><strong>{{ statistics.transactions.total_coins_purchased }}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CREATE ADMIN -->
        <div v-if="activeTab === 'create-admin'">
          <div class="mb-6">
            <h2 class="text-2xl font-bold">Create New Administrator</h2>
            <p class="text-sm text-green-700/80 mt-1">Cria um administrador com acesso ao painel.</p>
          </div>

          <form @submit.prevent="handleCreateAdmin" class="max-w-xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-green-700 mb-1" for="admin_name">Full Name *</label>
                <input id="admin_name" v-model="adminForm.name" type="text" required placeholder="John Doe"
                       class="w-full px-3 py-2 border rounded-lg text-green-900 border-green-200" />
              </div>

              <div>
                <label class="block text-sm font-medium text-green-700 mb-1" for="admin_email">Email *</label>
                <input id="admin_email" v-model="adminForm.email" type="email" required placeholder="admin@bisca.com"
                       class="w-full px-3 py-2 border rounded-lg text-green-900 border-green-200" />
              </div>

              <div>
                <label class="block text-sm font-medium text-green-700 mb-1" for="admin_nickname">Nickname *</label>
                <input id="admin_nickname" v-model="adminForm.nickname" type="text" required placeholder="admin_nickname"
                       class="w-full px-3 py-2 border rounded-lg text-green-900 border-green-200" />
              </div>

              <div>
                <label class="block text-sm font-medium text-green-700 mb-1" for="admin_password">Password *</label>
                <input id="admin_password" v-model="adminForm.password" type="password" required placeholder="Minimum 3 characters"
                       class="w-full px-3 py-2 border rounded-lg text-green-900 border-green-200" />
              </div>
            </div>

            <div v-if="adminMessage" class="mt-4">
              <div v-if="adminMessage.type === 'success'" class="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                {{ adminMessage.text }}
              </div>
              <div v-else class="p-3 rounded-lg bg-red-50 border border-red-100 text-red-900">
                {{ adminMessage.text }}
              </div>
            </div>

            <div class="mt-6">
              <button type="submit" :disabled="loadingAdmin"
                      class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition shadow-sm
                             bg-white text-green-900 hover:bg-green-50 disabled:opacity-60">
                <span v-if="loadingAdmin">Creating...</span>
                <span v-else>Create Administrator</span>
              </button>
            </div>
          </form>
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import Pagination from '@/components/Pagination.vue'

const adminStore = useAdminStore()

const activeTab = ref('users')


const loading = computed(() => adminStore.loading)
const users = computed(() => adminStore.users)
const transactions = computed(() => adminStore.transactions)
const games = computed(() => adminStore.games)
const statistics = computed(() => adminStore.statistics)



const userFilters = ref({
  type: '',
  blocked: '',
  search: ''
})

const gameFilters = ref({
  type: '',
  status: '',
  search: ''
})

const transactionFilters = ref({
  transaction_type_id: '',           
  search:''
})



const gamesPagination = ref({
  currentPage: 1,
  lastPage: 1
})

const transactionsPagination = ref({
  currentPage: 1,
  lastPage: 1
})



const adminForm = ref({
  name: '',
  email: '',
  nickname: '',
  password: ''
})

const adminMessage = ref(null)
const loadingAdmin = ref(false)



let searchTimeout = null
let gameSearchTimeout = null
let transactionSearchTimeout = null



onMounted(() => {
  loadUsers()
})

// ========================================
// LOAD DATA FUNCTIONS
// ========================================
const loadUsers = async () => {
  await adminStore.fetchUsers(userFilters.value)
}

const loadTransactions = async (page = 1) => {
  const response = await adminStore.fetchTransactions({
    ...transactionFilters.value,
    page
  })

  if (response.success) {
    transactionsPagination.value.currentPage = adminStore.currentPage
    transactionsPagination.value.lastPage = adminStore.lastPage
  }
}

const loadGames = async () => {
  const response = await adminStore.fetchGames({
    ...gameFilters.value,
    page: gamesPagination.value.currentPage
  })

  if (response.success) {
    gamesPagination.value.currentPage = adminStore.currentPage
    gamesPagination.value.lastPage = adminStore.lastPage
  }
}

const loadStatistics = async () => {
    await adminStore.fetchStatistics()
  }


// ========================================
// PAGINATION FUNCTIONS
// ========================================
const changePage = (page) => {
  adminStore.fetchUsers({ ...userFilters.value, page })
}

const loadTransactionsPage = (page) => {
  transactionsPagination.value.currentPage = page
  loadTransactions(page)
}

// Função para trocar de página
const loadGamesPage = (page) => {
  gamesPagination.value.currentPage = page
  loadGames()
}

// ========================================
// DEBOUNCE SEARCH FUNCTIONS
// ========================================

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers()
  }, 500)
}

const debounceGameSearch = () => {
  clearTimeout(gameSearchTimeout)
  gameSearchTimeout = setTimeout(() => {
    gamesPagination.value.currentPage = 1
    loadGames()
  }, 500)
}

const debounceTransactionSearch = () => {
  clearTimeout(transactionSearchTimeout)
  transactionSearchTimeout = setTimeout(() => {
    transactionsPagination.value.currentPage = 1
    loadTransactions()
  }, 500)
}



// ========================================
// USER MANAGEMENT HANDLERS
// ========================================

const handleBlockUser = async (userId) => {
  if (!confirm('Are you sure you want to block this user?')) return

  const result = await adminStore.blockUser(userId)
  if (result.success) {
    alert(result.message)
  } else {
    alert('Error: ' + result.message)
  }
}

const handleUnblockUser = async (userId) => {
  const result = await adminStore.unblockUser(userId)
  if (result.success) {
    alert(result.message)
  } else {
    alert('Error: ' + result.message)
  }
}

const handleDeleteUser = async (userId) => {
  if (!confirm('Are you sure you want to delete this user? This action may be irreversible.')) return

  const result = await adminStore.deleteUser(userId)
  if (result.success) {
    alert(result.message)
  } else {
    alert('Error: ' + result.message)
  }
}

const handleRestoreUser = async (userId) => {
  if (!confirm('Are you sure you want to restore this user?')) return

  const result = await adminStore.restoreUser(userId)
  if (result.success) {
    alert(result.message)
    loadUsers() // Reload users list
  } else {
    alert('Error: ' + result.message)
  }
}

const handleCreateAdmin = async () => {
  loadingAdmin.value = true
  adminMessage.value = null

  const result = await adminStore.createAdmin(adminForm.value)

  if (result.success) {
    adminMessage.value = { type: 'success', text: result.message }
    adminForm.value = { name: '', email: '', nickname: '', password: '' }

    setTimeout(() => {
      adminMessage.value = null
      activeTab.value = 'users'
      loadUsers()
    }, 2000)
  } else {
    adminMessage.value = { type: 'error', text: result.message }
  }

  loadingAdmin.value = false
}



const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getGameStatusClass = (status) => {
  const map = {
    'Ended': 'bg-emerald-50 text-emerald-800',
    'Playing': 'bg-amber-50 text-amber-800',
    'Pending': 'bg-sky-50 text-sky-800',
    'Interrupted': 'bg-red-50 text-red-800'
  }
  return map[status] || 'bg-gray-50 text-gray-800'
}

const watchTab = () => {
  if (activeTab.value === 'transactions') {
    loadTransactions()
  } else if (activeTab.value === 'games') {
    loadGames()
  } else if (activeTab.value === 'statistics') {
    loadStatistics()
  } else if (activeTab.value === 'users') {
    loadUsers()
  }
}

watch(activeTab, watchTab)

// helper for tab class styling
const tabClass = (tabName) => {
  return activeTab.value === tabName
    ? 'bg-green-700 text-white shadow'
    : 'bg-white/60 text-green-900 hover:bg-green-50'
}
</script>
