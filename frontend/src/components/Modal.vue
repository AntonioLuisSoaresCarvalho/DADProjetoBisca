<script setup>
const props = defineProps({
  show: { type: Boolean, required: true }
})

const emit = defineEmits(['close'])
</script>

<template>
  <transition name="modal-fade">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
    >
      <transition name="modal-zoom">
        <div v-if="show" class="bg-white p-10 rounded-xl w-96 text-center shadow-xl">
          <slot />
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
/* Fade do fundo */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Zoom do content */
.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: all 0.25s ease;
}
.modal-zoom-enter-from,
.modal-zoom-leave-to {
  transform: scale(0.85);
  opacity: 0;
}
</style>
