<script setup>
import { useRouter } from 'vue-router'
import SessionFriendsList from '@/components/SessionFriendList.vue'

const router = useRouter()

</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <SessionFriendsList 
      />
    </div>
  </div>
</template>