<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp } from '@lucide/vue'

const { t } = useI18n()
const show = ref(false)

function handleScroll() {
  requestAnimationFrame(() => {
    show.value = window.scrollY > window.innerHeight
  })
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <transition name="fade">
    <button
      v-if="show"
      class="fixed right-4 bottom-4 z-[101] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600"
      :aria-label="t('backtop.label')"
      @click="scrollTop"
    >
      <ArrowUp class="h-5 w-5" />
    </button>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
