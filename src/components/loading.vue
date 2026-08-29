<template>
  <div class="fixed inset-0 z-50 flex items-center">
    <div class="mx-auto flex h-4 gap-1.5">
      <span
        v-for="i in 5"
        :key="i"
        class="block h-full w-4 origin-bottom-right animate-pulse bg-brand-500"
        :style="{ animationDelay: `${i * 0.13}s` }"
      ></span>
    </div>
  </div>
</template>
