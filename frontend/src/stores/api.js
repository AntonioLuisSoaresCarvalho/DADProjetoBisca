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
        purchaseCoins
    }
})