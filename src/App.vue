<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import BackTop from '@/components/BackTop.vue'
import ToastHost from '@/components/ToastHost.vue'

const route = useRoute()
// /play 为 iframe 嵌入页,不显示站点框架
const isEmbed = computed(() => route.name === 'play')
</script>

<template>
  <ToastHost />
  <div v-if="isEmbed" class="min-h-screen">
    <router-view />
  </div>
  <div v-else class="min-h-screen">
    <AppHeader />
    <main class="mx-auto max-w-7xl px-4 pt-16 pb-20">
      <router-view />
    </main>
    <BackTop />
  </div>
</template>
