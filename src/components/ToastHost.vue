<script setup lang="ts">
import { reactive } from 'vue'
import { toastState } from '@/utils/toast'
import { CircleCheck, CircleX, Info } from '@lucide/vue'

const icons = { error: CircleX, success: CircleCheck, info: Info }
const colors = {
  error: 'bg-rose-600',
  success: 'bg-emerald-600',
  info: 'bg-zinc-800',
}
void reactive
</script>

<template>
  <div class="pointer-events-none fixed top-16 left-1/2 z-[9999] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
    <transition-group name="toast">
      <div
        v-for="t in toastState.items"
        :key="t.id"
        class="flex max-w-full items-start gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg"
        :class="colors[t.type]"
      >
        <component :is="icons[t.type]" class="mt-0.5 h-4 w-4 shrink-0" />
        <span class="break-all">{{ t.text }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
