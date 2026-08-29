<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    align?: 'center' | 'end'
  }>(),
  { align: 'end' },
)
</script>

<template>
  <div
    class="pointer-events-none absolute bottom-full z-30"
    :class="align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'"
  >
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-1.5 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-1.5 opacity-0"
    >
      <div
        v-if="open"
        class="pointer-events-auto pb-2"
        @click.stop
      >
        <div
          class="overflow-hidden rounded-lg bg-zinc-900/95 text-[13px] text-white shadow-[0_8px_28px_rgba(0,0,0,.45)] ring-1 ring-white/10 backdrop-blur-md"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>
