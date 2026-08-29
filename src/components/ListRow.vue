<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { VideoItem } from '@/types'
import { imgSrc, defaultImg } from '@/service'
import { timeBefore } from '@/utils'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    item: VideoItem
    /** true: 播放列表中的视频条目(带频道); false: 播放列表本身 */
    video?: boolean
    /** 紧凑模式(视频页侧栏) */
    mini?: boolean
  }>(),
  { video: false, mini: false },
)

const router = useRouter()
const loading = ref(true)
const loaderr = ref(false)

const v = computed(() => props.item.snippet ?? {})

const videoId = computed(() => {
  if (v.value.resourceId?.videoId) return v.value.resourceId.videoId
  const m = v.value.thumbnails?.high?.url?.match(/\/([\w-]{5,20})\//)
  return m ? m[1] : ''
})

const src = computed(() => (videoId.value ? imgSrc(videoId.value) : ''))

const pubdate = computed(() => {
  if (props.video && props.item.contentDetails?.videoPublishedAt) {
    return timeBefore(props.item.contentDetails.videoPublishedAt)
  }
  return timeBefore(v.value.publishedAt)
})

function toList() {
  if (props.video) {
    router.push({
      name: 'video',
      params: { id: videoId.value },
      query: { list: v.value.playlistId ?? '' },
    })
    return
  }
  const listId = typeof props.item.id === 'string' ? props.item.id : ''
  router.push({ name: 'channel.list.items', params: { id: v.value.channelId ?? '', listId } })
}

function toChannel() {
  if (!v.value.channelId) return
  router.push({ name: 'channel.uploads', params: { id: v.value.channelId } })
}
</script>

<template>
  <div
    class="my-4 cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    @click="toList"
  >
    <div class="flex gap-3" :class="mini ? '' : 'sm:flex-row flex-col'">
      <div class="relative shrink-0 overflow-hidden rounded bg-zinc-200" :class="mini ? 'w-1/2 aspect-video' : 'w-full sm:w-1/3 aspect-video'">
        <img :src="defaultImg" class="absolute inset-0 h-full w-full object-cover" :class="{ hidden: loaderr }" />
        <img
          v-if="src"
          :src="src"
          class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          :class="loading ? 'opacity-0' : 'opacity-100'"
          loading="lazy"
          @load="loading = false"
          @error="loaderr = true"
        />
      </div>
      <div class="min-w-0 flex-1" :class="mini ? '' : 'sm:pl-2'">
        <div class="clamp-2 text-sm font-medium text-zinc-800" :class="mini ? 'text-xs' : 'sm:text-base'">
          {{ v.title }}
        </div>
        <div
          v-if="mini && v.channelTitle"
          class="mt-1 truncate text-xs text-zinc-500 transition-colors hover:text-emerald-600"
          @click.stop="toChannel"
        >
          {{ v.channelTitle }}
        </div>
        <div class="mt-1 text-xs text-zinc-400">{{ t('listRow.publishedOn', { date: pubdate }) }}</div>
        <div v-if="!mini" class="clamp-2 mt-1.5 hidden text-xs text-zinc-500 sm:block">
          {{ v.description }}
        </div>
      </div>
    </div>
  </div>
</template>
