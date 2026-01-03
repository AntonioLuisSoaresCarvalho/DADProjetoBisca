<script setup>
import { useRouter } from 'vue-router'
import SessionFriendsList from '@/components/SessionFriendList.vue'

const router = useRouter()

// const handleInviteFriend = (friend) => {
//   console.log('Inviting friend:', friend)
//   router.push({ 
//     name: 'Lobby', 
//     query: { inviteId: friend.id } 
//   })
// }

// const handleViewProfile = (friend) => {
//   router.push(`/profile/${friend.id}`)
// }
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- <h1 class="text-3xl font-bold text-gray-800 mb-6">
        🎮 Jogadores Recentes
      </h1> -->
      
      <SessionFriendsList 
      />
      <!-- @invite-friend="handleInviteFriend"
        @view-profile="handleViewProfile" -->
    </div>
  </div>
</template>