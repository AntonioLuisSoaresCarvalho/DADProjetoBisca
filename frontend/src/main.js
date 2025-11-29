import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { io } from 'socket.io-client'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const socket = io('http://localhost:3000') 

app.provide('socket', socket)

app.mount('#app')
