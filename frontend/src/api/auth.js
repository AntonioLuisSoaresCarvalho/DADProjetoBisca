import api from './axios'

export default {
    register(data){
        return api.post("/register",data);
    },
    login(data){
        return api.post("/login",data);
    },
    logout(){
        return api.post("/logout");
    },
    me(){
        return api.get("/show");
    },
    updateProfile(data){
        return api.put("/profile",data);
    },
    deleteAccount(confirmation){
        return api.delete("/profile",{data : {confirmation}});
    }
}