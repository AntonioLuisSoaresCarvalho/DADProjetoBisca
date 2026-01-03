import { defineStore } from 'pinia'
import { useApiStore } from './api'
import { useAuthStore } from './authStore'

export const useCoinStore = defineStore('coinStore', {
  state: () => ({
    transactions: [],
    purchases: [],
    loading: false,
    error: null,
    successMessage: null,
    currentPage: 1,
    lastPage: 1,
  }),

  getters: {
    balance: (state) => {
      const authStore = useAuthStore()
      return authStore.user?.coins_balance ?? 0
    },
  },

  actions: {

    //Obtém o histórico de transações

    async fetchTransactions(page = 1) {
      const api = useApiStore()
      this.loading = true
      this.error = null
      try {
        const data = await api.getTransactions(page)
        this.transactions = data.data || []
        this.currentPage = data.meta?.current_page || 1
        this.lastPage = data.meta?.last_page || 1
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao carregar transações.'
      } finally {
        this.loading = false
      }
    },


    //Obtém as compras de moedas

    async fetchPurchases(page = 1) {
      const api = useApiStore()
      this.loading = true
      this.error = null
      try {
        const data = await api.getPurchases(page)
        this.purchases = data.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao carregar compras.'
      } finally {
        this.loading = false
      }
    },

    //Efetua uma compra de moedas
    
    async buyCoins(formData) {
      this.loading = true
      this.error = null
      this.successMessage = null
      const api = useApiStore()

      try {
        const purchase = await api.purchaseCoins(formData)

        this.purchases.unshift(purchase.data)
        await this.fetchTransactions()

        const authStore = useAuthStore()
        await authStore.fetchProfile()

        this.successMessage = 'Compra efetuada com sucesso!'
        return purchase
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao processar compra.'
      } finally {
        this.loading = false
      }
    },
  },
})
