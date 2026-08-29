<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/VideoCard.vue'
import Loading from '@/components/Loading.vue'
import { mostPopularVideos } from '@/service'
import type { VideoItem } from '@/types'

const items = ref<VideoItem[]>([])
const loading = ref(true)

async function videoList(videoCategoryId: number, regionCode = 'HK') {
  const { ok, data } = await mostPopularVideos(regionCode, videoCategoryId)
  if (!ok) return
  const seen = new Set<string>()
  for (const i of items.value) {
    const key = typeof i.id === 'string' ? i.id : i.id?.videoId ?? ''
    if (key) seen.add(key)
  }
  const merged = [...items.value]
  for (const item of data.items) {
    const key = typeof item.id === 'string' ? item.id : item.id?.videoId
    if (key && !seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  }
  items.value = merged
}

onMounted(async () => {
  loading.value = true
  await videoList(10, 'TW')
  await videoList(10)
  loading.value = false
})
</script>

<template>
  <Loading v-if="loading" />
  <div v-else class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    <VideoCard v-for="item in items" :key="item.etag ?? (typeof item.id === 'string' ? item.id : item.id?.videoId ?? '')" :item="item" />
  </div>
</template>
