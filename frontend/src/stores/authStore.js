import { defineStore } from "pinia";
import authApi from '../api/auth';
import axios from "axios";

const api_url = 'http://localhost:8000/api';

export const useAuthStore = defineStore("auth",{
    state:() => ({
        user:null,
        token:localStorage.getItem("token") || null,
        isAutenticated : false,
    }), 

    getters:{
        isAdmin: (state) => state.user?.type === 'A',
        isPlayer: (state) => state.user?.type === 'P',
    },

    actions : {
        async initAuth(){
            const token = localStorage.getItem('token');
            if(token){
                this.token = token;
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    await this.fetchProfile();
                } catch (error) {
                    this.clearAuth();
                }
            }
        },

        async login(data){
            try {
                const res = await axios.post(`${api_url}/login`,data);
                this.token = res.data.token;
                this.user = res.data.user;
                this.isAutenticated = true;

                localStorage.setItem('token',this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

                return { success : true, message : res.data.message};
            } catch (error) {
                return {
                    success : false,
                    message : error.response?.data?.message || 'Login failed',
                    errors : error.response?.data?.errors || {}
                } 
            }
        },

        async register(data){
            try {
                const form_data = new FormData();
                Object.keys(data).forEach(key => {
                    if(data[key] !== null && data[key] !== undefined && data[key] !== '') {
                        form_data.append(key,data[key]);
                    }
                })
                
                const res = await axios.post(`${api_url}/register`,form_data,{
                    headers: {'Content-Type' : 'multipart/form-data'}
                })

                this.token = res.data.token;
                this.user = res.data.user;
                this.isAutenticated = true;

                localStorage.setItem("token",this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

                return {success : true, message : res.data.message};

            } catch (error) {
                return {
                    success : false,
                    message : error.response?.data?.message || 'Resgister failed',
                    errors : error.response?.data?.errors || {}
                }                
            }
            //return authApi.register(data);
        },

        async fetchProfile() {
            try {
                const res = await axios.get(`${api_url}/me`);
                this.user = res.data.user;
                this.isAutenticated = true;
            } catch (error) {
                this.clearAuth();
                throw error;
            }
        },

        async updateProfile(data) {
            try {
                const form_data = new FormData();
                Object.keys(data).forEach(key => {
                    if(data[key] !== null && data[key] !== undefined && data[key] !== '') {
                        form_data.append(key,data[key]);
                    }
                });

                const res = await axios.post(`${api_url}/profile`,form_data,{
                    headers: {'Content-Type' : 'multipart/form-data','X-HTTP-Method-Override': 'PUT'}
                })
                this.user = res.data.user;
                return { success : true , message : res.data.message}
            } catch (error) {
                return { success : false , message : res.data?.message || 'Update failed',
                    errors : error.response?.data?.errors || {}
                }
            }
        },

        async logout() {
            try {
            await axios.post(`${api_url}/logout`);
            } catch(error) {
                console.error('Erro ao fazer logout:', error);
            } finally {
                this.clearAuth();
            }
        },

        async deleteAccount(confirmation){
            try {
                //await authApi.deleteAccount(confirmation);~
                await axios.delete(`${api_url}/profile`,{data : {confirmation}});
                //console.log("Sucesso ao eliminar");

                this.clearAuth()
                return {sucess : true , message : res.data.message}
            } catch (error) {
                return {
                    success : false,
                    message : error.response?.data?.message || 'deletion failed',
                    //errors : error.response?.data?.errors || {}
                } 
            }
        },

        clearAuth(){
            this.user = null;
            this.token = null;
            this.isAutenticated = false;
            localStorage.removeItem("token");
            delete axios.defaults.headers.common['Authorization'];
        }
}

})