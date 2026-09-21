<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { VideoItem } from '@/types'
import { imgSrc, defaultImg } from '@/service'
import { timeBefore, formatCount, formatDuration } from '@/utils'

const { t } = useI18n()
const props = defineProps<{ item: VideoItem }>()
const router = useRouter()
const loading = ref(true)
const loaderr = ref(false)

const v = computed(() => props.item.snippet ?? {})

const id = computed(() => {
  if (v.value.resourceId?.videoId) return v.value.resourceId.videoId
  const iid = props.item.id
  if (typeof iid === 'object') return iid?.videoId ?? ''
  return iid ?? ''
})

const src = computed(() => imgSrc(id.value))
const duration = computed(() => formatDuration(props.item.contentDetails?.duration))
const hd = computed(() => {
  const d = props.item.contentDetails?.definition
  if (!d) return ''
  return { hd: t('videoCard.hd'), sd: t('videoCard.sd') }[d] ?? ''
})
const viewcount = computed(() => (props.item.statistics?.viewCount ? formatCount(props.item.statistics.viewCount) : ''))
const date = computed(() => timeBefore(v.value.publishedAt))

function toVideo() {
  const query: Record<string, string> = {}
  if (v.value.playlistId) query.list = v.value.playlistId
  router.push({ name: 'video', params: { id: id.value }, query })
}

function toChannel() {
  if (!v.value.channelId) return
  router.push({ name: 'channel.uploads', params: { id: v.value.channelId } })
}
</script>

<template>
  <div class="cursor-pointer" @click="toVideo">
    <div class="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
      <div class="relative aspect-video overflow-hidden bg-zinc-200">
        <img :src="defaultImg" class="absolute inset-0 h-full w-full object-cover" :class="{ hidden: !loading && !loaderr }" />
        <img
          v-if="src"
          :src="src"
          class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          :class="loading ? 'opacity-0' : 'opacity-100'"
          loading="lazy"
          @load="loading = false"
          @error="loaderr = true; loading = false"
        />
        <span v-if="duration" class="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
          {{ duration }}
        </span>
        <span v-if="hd" class="absolute left-1.5 bottom-1.5 rounded bg-brand-500 px-1.5 py-0.5 text-xs text-white">
          {{ hd }}
        </span>
      </div>
      <div class="clamp-2 h-[52px] overflow-hidden px-3 pt-2 text-sm leading-[1.5] text-zinc-700 transition-colors hover:text-black">
        {{ v.title }}
      </div>
      <div class="px-3 pt-1.5 pb-2.5 text-xs">
        <div class="truncate text-zinc-500 transition-colors hover:text-emerald-600" @click.stop="toChannel">
          {{ v.channelTitle }}
        </div>
        <div class="mt-1.5 flex items-center justify-between text-zinc-400">
          <span>{{ date }}</span>
          <span v-if="viewcount">{{ viewcount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
