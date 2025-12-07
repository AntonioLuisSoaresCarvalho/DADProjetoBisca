import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { io } from 'socket.io-client'

const API_BASE_URL = 'http://localhost:8000/api'
const SERVER_BASE_URL = 'http://localhost:3000'

const app = createApp(App)
const socket = io(SERVER_BASE_URL) 

app.provide('socket', socket)
app.provide('apiBaseUrl', API_BASE_URL)
app.use(createPinia())
app.use(router)

app.mount('#app')
