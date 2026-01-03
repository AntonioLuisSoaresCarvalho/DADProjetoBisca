import { defineStore } from 'pinia'
import { ref, computed,watch } from 'vue'

export const useFriendStore = defineStore('friends', () => {
  const savedFriends = localStorage.getItem('sessionFriends')
  const sessionFriends = ref(savedFriends ? JSON.parse(savedFriends) : [])

  const friendCount = computed(() => sessionFriends.value.length)
  
  const getFriendById = computed(() => {
    return (userId) => sessionFriends.value.find(f => f.id === userId)
  })

  const isFriend = computed(() => {
    return (userId) => sessionFriends.value.some(f => f.id === userId)
  })

  function addFriend(user) {
    if (!user || !user.id) {
      console.error('Invalid user')
      return false
    }

    if (sessionFriends.value.find(f => f.id === user.id)) {
      return false
    }

    sessionFriends.value.push({
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      photo_avatar_filename: user.photo_avatar_filename || null,
      addedAt: new Date().toISOString()
    })

    return true
  }

  function removeFriend(userId) {
    const index = sessionFriends.value.findIndex(f => f.id === userId)
    if (index !== -1) {
      sessionFriends.value.splice(index, 1)
      return true
    }
    return false
  }

  function clearAll() {
    sessionFriends.value = []
  }

  // Reset when logging out
  function $reset() {
    sessionFriends.value = []
    localStorage.removeItem('sessionFriends')
  }

  watch(
    sessionFriends,
    (newFriends) => {
      localStorage.setItem('sessionFriends', JSON.stringify(newFriends))
    },
    { deep: true }
  )

  return {
    sessionFriends,
    friendCount,
    getFriendById,
    isFriend,
    addFriend,
    removeFriend,
    clearAll,
    $reset
  }
})