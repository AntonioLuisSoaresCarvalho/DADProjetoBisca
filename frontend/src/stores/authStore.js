import { defineStore } from "pinia";
import { useApiStore } from "./api";
import { useFriendStore } from "./friendStore";

export const useAuthStore = defineStore("auth",{
    state:() => ({
        user:null,
        isAuthenticated : false,
    }), 

    getters:{
        isAdmin: (state) => state.user?.type === 'A',
        isPlayer: (state) => state.user?.type === 'P',
        isLoggedIn: (state) => state.isAuthenticated,
        currentUser: (state) => state.user, 

        coinsBalance: (state) => {
            return state.user?.coins_balance || 0
        },
        
        hasEnoughCoins: (state) => {
            return (amount) => {
                const balance = state.user?.coins_balance || 0
                return balance >= amount
            }
        }
    },

    actions : {
        
        async initAuth(){
            const apiStore = useApiStore(); 

            // Initialize the apiStore first to load the token
            await apiStore.initAuth();
            
            // Now check if there's a token
            if (!apiStore.token) {
                console.log('[AuthStore] No token found');
                return;
            }

            try {
                const res = await apiStore.fetchProfile();
                this.user = res.data.user;
                this.isAuthenticated = true;
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
                this.isAuthenticated = true;

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
                this.isAuthenticated = true;

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
            const friendStore = useFriendStore();
            try {          
                const apiStore = useApiStore();
                await apiStore.logout();
                this.clearAuth();           
                friendStore.$reset();
            } catch(error) {
                console.error('Erro ao fazer logout:', error);
                this.clearAuth();
                friendStore.$reset();
            }
        },

        async deleteAccount(confirmation){
            try {
               const apiStore = useApiStore();
               const res = await apiStore.deleteAccount(confirmation);
               this.clearAuth();
               return {success : true , message : res.data.message}
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
            this.isAuthenticated = false;            
        },

        updateCoinsBalance(newBalance) {
            if (this.user) {
                this.user.coins_balance = newBalance
            }
        },
        
        // 4. Action para atualizar saldo após transação
        async refreshCoinsBalance() {
            try {
                const apiStore = useApiStore()
                const response = await apiStore.fetchProfile()
                this.user = response.data.user
            } catch (error) {
                console.error('Erro ao atualizar saldo:', error)
            }
        },
}

})