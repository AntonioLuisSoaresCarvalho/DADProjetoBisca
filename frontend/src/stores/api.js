import { defineStore } from "pinia";
import axios from "axios";
import { inject,ref} from "vue";

export const useApiStore = defineStore("api", () => {
    const API_BASE_URL = inject('apiBaseURL');

    const token = ref(localStorage.getItem("token") || null)

    const apiClient = axios.create({
        baseURL: 'http://127.0.0.1:8000/api',
        withCredentials: true,
    })

    apiClient.interceptors.request.use(
        (config) => {
            const currentToken = token.value || localStorage.getItem("token");
            if (currentToken) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    const initAuth = async () => {
        const storedToken = localStorage.getItem("token");
        if(storedToken){
            token.value = storedToken;
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            try {
                return await fetchProfile();
            } catch (error) {
                console.error('Erro no initAuth:', error);
                clearAuth();
            }
        }
    }

    const login = async (data) => {
        const res = await apiClient.post(`/login`,data);
        token.value = res.data.token;
        localStorage.setItem('token',token.value);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
        console.log(token.value)
        return res;
    }

    const register = async (data) => {
        const form_data = new FormData();
        Object.keys(data).forEach(key => {
            if(data[key] !== null && data[key] !== undefined && data[key] !== '') {
                form_data.append(key,data[key]);
            }
        })

        const res = await apiClient.post(`/register`,form_data,{
            headers: {'Content-Type' : 'multipart/form-data'}
        })

        token.value = res.data.token

        localStorage.setItem("token",token.value);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

        return res;
    }

    const fetchProfile = async () => {
        const res = await apiClient.get(`/me`);
        return res;
    }

    const updateProfile = async (data) => {
        const form_data = new FormData();
        Object.keys(data).forEach(key => {
            if(data[key] !== null && data[key] !== undefined && data[key] !== '') {
                form_data.append(key,data[key]);
            }
        });

        const res = await apiClient.post(`/profile`,form_data,{
            headers: {'Content-Type' : 'multipart/form-data','X-HTTP-Method-Override': 'PUT'}
        })

        return res
    }

    const logout = async () => {
        await apiClient.post(`/logout`);
        clearAuth();
    }

    const deleteAccount = async (confirmation) => {
        await apiClient.delete(`/profile`,{data : {confirmation}});
        clearAuth();
    }

    const clearAuth = () => {
        localStorage.removeItem("token");
        token.value = null
        delete axios.defaults.headers.common['Authorization'];
    }

    const getTransactions = async (page = 1) => {
        const response = await apiClient.get(`/transactions?page=${page}`)
        return response.data
    }

    const getTransactionById = async (id) => {
        const response = await apiClient.get(`/transactions/${id}`)
        return response.data
    }

    const createTransaction = async (data) => {
        const response = await apiClient.post(`/transactions`, data)
        return response.data
    }

    const getPurchases = async (page = 1) =>{
        const response = await apiClient.get(`/purchases?page=${page}`)
        return response.data
    }

    const purchaseCoins = async (data) =>  {
        const response = await apiClient.post(`/purchases`, data)
        return response.data
    }

    const getUsers = async (filters = {}) => {
        const response = await apiClient.get(`/admin/users`, { params: filters })
        return response.data
    }

    const blockUser = async (id) => {
        const response = await apiClient.post(`/admin/users/${id}/block`)
        return response.data
    }

    const unblockUser = async (id) => {
        const response = await apiClient.post(`/admin/users/${id}/unblock`)
        return response.data
    }

    const createGame = async (data) => {
        const response = await apiClient.post(`/games`, data)
        return response.data
    }

    const updateGame = async (id, data) => {
        const response = await apiClient.put(`/games/${id}`, data)
        return response.data
    }

    const createMatch = async (data) => {
        const response = await apiClient.post(`/matches`, data)
        return response.data
    }

    const updateMatch = async (id, data) => {
        const response = await apiClient.put(`/matches/${id}`, data)
        return response.data
    }

    const createAdmin = async (data) => {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key])
          }
        })
                const response = await apiClient.post(`/admin/users`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    }

    const deleteUser = async (id) => {
        const response = await apiClient.delete(`/admin/users/${id}`)
        return response.data
    }

    const restoreUser = async (id) => {
        const response = await apiClient.post(`/admin/users/${id}/restore`)
        return response.data
    }

    const fetchTransactions = async (filters = {}) => {
        const response = await apiClient.get(`/admin/transactions`, { params: filters })
        return response.data
    }

    const fetchGames = async (filters = {}) => {
        const response = await apiClient.get(`/admin/games`, { params: filters })
        return response.data
    }

    const fetchStatistics = async () => {
        const response = await apiClient.get(`/admin/statistics`)
        return response.data
    }

    // ==========================================
    // HISTORY ENDPOINTS
    // ==========================================

    const getUserGames = async (params = {}) => {
        const response = await apiClient.get(`/history/games`, { params })
        return response.data
    }

    const getGameDetails = async (gameId, params = {}) => {
        const response = await apiClient.get(`/history/games/${gameId}`, { params })
        return response.data
    }

    const getPlayerGames = async (userId, params = {}) => {
        const response = await apiClient.get(`/admin/history/games/${userId}`, { params })
        return response.data
    }

    const getUserMatches = async (params = {}) => {
        const response = await apiClient.get(`/history/matches`, { params })
        return response.data
    }

    const getMatchDetails = async (matchId, params = {}) => {
        const response = await apiClient.get(`/history/matches/${matchId}`, { params })
        return response.data
    }

    const getPlayerMatches = async (userId, params = {}) => {
        const response = await apiClient.get(`/admin/history/matches/${userId}`, { params })
        return response.data
    }

    const getUser = async (userId) => {
        const response = await apiClient.get(`/users/${userId}`)
        return response.data
    }

    // ==========================================
    // LEADERBOARD ENDPOINTS
    // ==========================================

    const getPersonalStats = async (params = {}) => {
        const response = await apiClient.get(`/leaderboards/personal`, { params })
        return response.data
    }

    const getGlobalLeaderboard = async (type, params = {}) => {
        const endpoints = {
            games: `${API_BASE_URL}/leaderboards/global/games`,
            matches: `${API_BASE_URL}/leaderboards/global/matches`,
            capotes: `${API_BASE_URL}/leaderboards/global/capotes`,
            bandeiras: `${API_BASE_URL}/leaderboards/global/bandeiras`,
        }
        const response = await apiClient.get(endpoints[type], { params })
        return response.data
    }

    return {
        token,
        initAuth,
        login,
        register,
        fetchProfile,
        updateProfile,
        logout,
        deleteAccount,
        clearAuth,
        getTransactions,
        getTransactionById,
        createTransaction,
        getPurchases,
        purchaseCoins,
        getUsers,
        blockUser,
        restoreUser,
        unblockUser,
        createAdmin,
        deleteUser,
        fetchTransactions,
        fetchGames,
        fetchStatistics,
        getUserGames,
        getGameDetails,
        getPlayerGames,
        getUserMatches,
        getMatchDetails,
        getPlayerMatches,
        getUser,
        getPersonalStats,
        getGlobalLeaderboard,
        updateMatch,
        updateGame,
        createGame, 
        createMatch
    }
})
