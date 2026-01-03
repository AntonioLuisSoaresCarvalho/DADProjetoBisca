<script setup>
import { useFriendStore } from '@/stores/friendStore'

const friendStore = useFriendStore()

const handleRemove = (friendId) => {
  friendStore.removeFriend(friendId)
}

const getAvatarUrl = (filename) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  if (!filename) return `${apiBaseUrl}/storage/photos_avatars/anonymous.png`
  return `${apiBaseUrl}/storage/photos_avatars/${filename}`
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <div class="flex justify-between items-center pb-3 mb-3 border-b-2 border-gray-200">
      <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
        Recent players
      </h3>
      <span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
        {{ friendStore.friendCount }}
      </span>
    </div>

    <div v-if="friendStore.friendCount === 0" class="text-center py-8 px-4">
      <p class="text-gray-600 mb-2">You didn't played with anyone yet.</p>
      <p class="text-sm text-gray-400 italic">
        After you play with with someone and added him on the list, he will appear here.
      </p>
    </div>

    <!-- Friends List -->
    <div v-else class="space-y-2 max-h-96 overflow-y-auto">
      <div 
        v-for="friend in friendStore.sessionFriends" 
        :key="friend.id"
        class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all hover:translate-x-1"
      >
        <!-- Avatar -->
        <img 
          :src="getAvatarUrl(friend.photo_avatar_filename)" 
          :alt="friend.nickname"
          class="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
        />
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-gray-900 truncate">
            {{ friend.nickname }}
          </div>
          <div class="text-sm text-gray-600 truncate">
            {{ friend.name }}
          </div>
        </div>

        <div class="flex gap-1">         
          <button 
            @click="handleRemove(friend.id)"
            class="w-9 h-9 flex items-center justify-center bg-white rounded-lg hover:bg-red-600 hover:text-white transition-colors border border-gray-300"
            title="Remover"
          >
            ✖️
          </button>
        </div>
      </div>
    </div>

    <button 
      v-if="friendStore.friendCount > 0"
      @click="friendStore.clearAll()"
      class="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
    >
      Clear all friends
    </button>
  </div>
</template>