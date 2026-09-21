<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VideoCard from '@/components/VideoCard.vue'
import Loading from '@/components/Loading.vue'
import { mostPopularVideos } from '@/service'
import { toast } from '@/utils/toast'
import type { VideoItem } from '@/types'

const items = ref<VideoItem[]>([])
const loading = ref(true)

function videoKey(item: VideoItem): string {
  return typeof item.id === 'string' ? item.id : item.id?.videoId ?? ''
}

onMounted(async () => {
  loading.value = true
  try {
    const results = await Promise.all([mostPopularVideos('TW', 10), mostPopularVideos('HK', 10)])
    const seen = new Set<string>()
    const merged: VideoItem[] = []
    for (const { ok, data } of results) {
      if (!ok) continue
      for (const item of data.items) {
        const key = videoKey(item)
        if (key && !seen.has(key)) {
          seen.add(key)
          merged.push(item)
        }
      }
    }
    items.value = merged
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <Loading v-if="loading" />
  <div v-else class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    <VideoCard v-for="item in items" :key="item.etag ?? (typeof item.id === 'string' ? item.id : item.id?.videoId ?? '')" :item="item" />
  </div>
</template>
