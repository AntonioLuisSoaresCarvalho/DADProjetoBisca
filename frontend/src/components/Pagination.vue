<template>
  <div class="flex justify-center items-center gap-3 mt-6">
    <button
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
      class="px-4 py-2 bg-white text-green-900 rounded-lg hover:bg-green-50 disabled:opacity-50 cursor-pointer"
    >
      Anterior
    </button>

    <span class="px-2 text-sm font-medium">
      Página {{ currentPage }} de {{ lastPage }}
    </span>

    <button
      :disabled="currentPage === lastPage"
      @click="changePage(currentPage + 1)"
      class="px-4 py-2 bg-white text-green-900 rounded-lg hover:bg-green-50 disabled:opacity-50 cursor-pointer"
    >
      Seguinte
    </button>
  </div>
</template>

<script>
export default {
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    lastPage: {
      type: Number,
      required: true
    },
    changePage: {
      type: Function,
      required: true
    }
  }
}
</script>