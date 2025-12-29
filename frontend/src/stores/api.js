import { defineStore } from "pinia";
import axios from "axios";
import { inject,ref} from "vue";

export const useApiStore = defineStore("api", () => {
    const API_BASE_URL = inject('apiBaseUrl');

    const token = ref(localStorage.getItem("token") || null)

    axios.interceptors.request.use(
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
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            try {
                return await fetchProfile();
            } catch (error) {
                console.error('Erro no initAuth:', error);
                clearAuth();
            }
        }
    }

    const login = async (data) => {
        const res = await axios.post(`${API_BASE_URL}/login`,data);
        token.value = res.data.token;
        localStorage.setItem('token',token.value);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
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

        const res = await axios.post(`${API_BASE_URL}/register`,form_data,{
            headers: {'Content-Type' : 'multipart/form-data'}
        })

        token.value = res.data.token

        localStorage.setItem("token",token.value);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return res;
    }

    const fetchProfile = async () => {
        const res = await axios.get(`${API_BASE_URL}/me`);
        return res;
    }

    const updateProfile = async (data) => {
        const form_data = new FormData();
        Object.keys(data).forEach(key => {
            if(data[key] !== null && data[key] !== undefined && data[key] !== '') {
                form_data.append(key,data[key]);
            }
        });

        const res = await axios.post(`${API_BASE_URL}/profile`,form_data,{
            headers: {'Content-Type' : 'multipart/form-data','X-HTTP-Method-Override': 'PUT'}
        })

        return res
    }

    const logout = async () => {
        await axios.post(`${API_BASE_URL}/logout`);
        clearAuth();
    }

    const deleteAccount = async (confirmation) => {
        await axios.delete(`${API_BASE_URL}/profile`,{data : {confirmation}});
        clearAuth();
    }

    const clearAuth = () => {
        localStorage.removeItem("token");
        token.value = null
        delete axios.defaults.headers.common['Authorization'];
    }

    const getTransactions = async (page = 1) => {
        const response = await axios.get(`${API_BASE_URL}/transactions?page=${page}`)
        return response.data
    }

    const getTransactionById = async (id) => {
        const response = await axios.get(`${API_BASE_URL}/transactions/${id}`)
        return response.data
    }

    const createTransaction = async (data) => {
        const response = await axios.post(`${API_BASE_URL}/transactions`, data)
        return response.data
    }

    const getPurchases = async (page = 1) =>{
        const response = await axios.get(`${API_BASE_URL}/purchases?page=${page}`)
        return response.data
    }

    const purchaseCoins = async (data) =>  {
        const response = await axios.post(`${API_BASE_URL}/purchases`, data)
        return response.data
    }

    const getUsers = async (filters = {}) => {
        const response = await axios.get(`${API_BASE_URL}/admin/users`, { params: filters })
        return response.data
    }

    const blockUser = async (id) => {
        const response = await axios.post(`${API_BASE_URL}/admin/users/${id}/block`)
        return response.data
    }

    const unblockUser = async (id) => {
        const response = await axios.post(`${API_BASE_URL}/admin/users/${id}/unblock`)
        return response.data
    }

    const createGame = async (data) => {
        const response = await axios.post(`${API_BASE_URL}/games`, data)
        return response.data
    }

    const updateGame = async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/games/${id}`, data)
        return response.data
    }

    const createMatch = async (data) => {
        const response = await axios.post(`${API_BASE_URL}/matches`, data)
        return response.data
    }

    const updateMatch = async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/matches/${id}`, data)
        return response.data
    }

    const createAdmin = async (data) => {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key])
          }
        })
        const response = await axios.post(`${API_BASE_URL}/admin/users`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    }

    const deleteUser = async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/admin/users/${id}`)
        return response.data
    }

    const restoreUser = async (id) => {
        const response = await axios.post(`${API_BASE_URL}/admin/users/${id}/restore`)
        return response.data
    }

    const fetchTransactions = async (filters = {}) => {
        const response = await axios.get(`${API_BASE_URL}/admin/transactions`, { params: filters })
        return response.data
    }

    const fetchGames = async (filters = {}) => {
        const response = await axios.get(`${API_BASE_URL}/admin/games`, { params: filters })
        return response.data
    }

    const fetchStatistics = async () => {
        const response = await axios.get(`${API_BASE_URL}/admin/statistics`)
        return response.data
    }

    // ==========================================
    // HISTORY ENDPOINTS
    // ==========================================

    const getUserGames = async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/history/games`, { params })
        return response.data
    }

    const getGameDetails = async (gameId, params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/history/games/${gameId}`, { params })
        return response.data
    }

    const getPlayerGames = async (userId, params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/admin/history/games/${userId}`, { params })
        return response.data
    }

    const getUserMatches = async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/history/matches`, { params })
        return response.data
    }

    const getMatchDetails = async (matchId, params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/history/matches/${matchId}`, { params })
        return response.data
    }

    const getPlayerMatches = async (userId, params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/admin/history/matches/${userId}`, { params })
        return response.data
    }

    const getUser = async (userId) => {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`)
        return response.data
    }

    // ==========================================
    // LEADERBOARD ENDPOINTS
    // ==========================================

    const getPersonalStats = async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/leaderboards/personal`, { params })
        return response.data
    }

    const getGlobalLeaderboard = async (type, params = {}) => {
        const endpoints = {
            games: `${API_BASE_URL}/leaderboards/global/games`,
            matches: `${API_BASE_URL}/leaderboards/global/matches`,
            capotes: `${API_BASE_URL}/leaderboards/global/capotes`,
            bandeiras: `${API_BASE_URL}/leaderboards/global/bandeiras`,
        }
        const response = await axios.get(endpoints[type], { params })
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
