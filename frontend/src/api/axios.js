import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
})

api.interceptors.request.use((config) => {
    const auth = useAuthStore();
    if(auth.token){
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config;
});

api.interceptors.request.use(
    (response) => response,
    (error) => {
        const auth = useAuthStore();
        if(error.response?.status === 401){
            auth.logout();
        }
        return Promise.reject(error);
    }
);

export default api;