<template>
  <div class="min-h-screen flex flex-col bg-green-700 relative">

    <!-- NAVBAR -->
    <Navbar @toggleSidebar="sidebarOpen = true" />

    <!-- SIDEBAR DRAWER -->
    <Sidebar :visible="sidebarOpen" @close="sidebarOpen = false" />

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-4 transition-all">
      <router-view />
    </main>

    <!-- FOOTER -->
    <Footer />

  </div>
</template>

<script setup>
import { ref,onMounted } from "vue";
import Navbar from "@/components/layout/Navbar.vue";
import Sidebar from "@/components/layout/Sidebar.vue";
import Footer from "@/components/layout/Footer.vue";
import { useAuthStore } from "./stores/authStore";

const sidebarOpen = ref(false);

const authStore = useAuthStore();

onMounted(async ()=> {
  await authStore.initAuth();
})

</script>
