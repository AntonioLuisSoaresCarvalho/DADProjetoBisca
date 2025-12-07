import { defineStore } from "pinia";
import { useApiStore } from "./api";

export const useAuthStore = defineStore("auth",{
    state:() => ({
        user:null,
        isAutenticated : false,
    }), 

    getters:{
        isAdmin: (state) => state.user?.type === 'A',
        isPlayer: (state) => state.user?.type === 'P',
    },

    actions : {
        
        async initAuth(){
            const apiStore = useApiStore(); 

            if (!apiStore.token) return;

            try {
                const res = await apiStore.fetchProfile();
                this.user = res.data.user;
                this.isAutenticated = true;
            } catch (e) {
                console.error('Erro ao inicializar autenticação:', e);
                this.clearAuth();
            }

        },

        async login(data){
            try {
                const apiStore = useApiStore();
                const res = await apiStore.login(data);
                this.user = res.data.user;
                this.isAutenticated = true;

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
                const apiStore = useApiStore();
                const res = await apiStore.register(data);
                this.user = res.data.user;
                this.isAutenticated = true;

                return {success : true, message : res.data.message};

            } catch (error) {
                return {
                    success : false,
                    message : error.response?.data?.message || 'Resgister failed',
                    errors : error.response?.data?.errors || {}
                }                
            }
        },

        async fetchProfile() {
            try {
                const apiStore = useApiStore();
                const res = await apiStore.fetchProfile();

                this.user = res.data.user;
                this.isAutenticated = true;

            } catch (error) {
                this.clearAuth();
                throw error;
            }
        },

        async updateProfile(data) {
            try {
                const apiStore = useApiStore();
                const res = await apiStore.updateProfile(data);
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
                const apiStore = useApiStore();
                await apiStore.logout();
            } catch(error) {
                console.error('Erro ao fazer logout:', error);
                this.clearAuth();
            }
        },

        async deleteAccount(confirmation){
            try {
               const apiStore = useApiStore();
               const res = await apiStore.deleteAccount(confirmation);
               return {sucess : true , message : res.data.message}
            } catch (error) {
                return {
                    success : false,
                    message : error.response?.data?.message || 'deletion failed',
                } 
            }
        },

        clearAuth(){
            const apiStore = useApiStore();
            apiStore.clearAuth();
            this.user = null;
            this.isAutenticated = false;            
        }
}

})