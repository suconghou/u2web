<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlaylistEntry } from './types'
import type { VideoItem } from '@/types'
import { playlistItems } from '@/service'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** 播放列表ID(自动拉取)或直接传入条目数组 */
    playlist?: string | PlaylistEntry[]
  }>(),
  { playlist: '' },
)

const emit = defineEmits<{ (e: 'play', id: string): void }>()

const curr = ref<PlaylistEntry | null>(null)
const lists = ref<PlaylistEntry[]>([])

/** 分页拉取上限:防止后端返回重复的 nextPageToken 时无限循环 */
const MAX_PAGES = 20
/** 请求序号:列表切换或卸载后丢弃在途请求 */
let seq = 0
let stopped = false

async function initList(listId: string) {
  const cur = ++seq
  const seen = new Set(lists.value.map((i) => i.v))
  let pageToken: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    if (cur !== seq || stopped) return
    const { ok, data } = await playlistItems(listId, pageToken, 50)
    if (cur !== seq || stopped) return
    if (!ok) return
    push(data.items, seen)
    pageToken = data.nextPageToken
    if (!pageToken) break
  }
}

function push(items: VideoItem[], seen: Set<string>) {
  const mapped = items
    .filter((item) => item.contentDetails?.videoPublishedAt)
    .map((item) => ({
      v: item.contentDetails?.videoId ?? '',
      title: item.snippet?.title ?? '',
    }))
    .filter((x) => x.v && !seen.has(x.v))
  for (const m of mapped) seen.add(m.v)
  lists.value = [...lists.value, ...mapped]
}

function toPlay(item: PlaylistEntry) {
  emit('play', item.v)
  curr.value = item
}

/** 播放下一曲(音频模式自动连播) */
function playNext(id: string) {
  const index = lists.value.findIndex((item) => item.v === id)
  const item = lists.value[index + 1]
  if (item) toPlay(item)
}

onMounted(() => {
  if (Array.isArray(props.playlist)) {
    lists.value = props.playlist
  } else if (props.playlist) {
    initList(props.playlist)
  }
})
onUnmounted(() => {
  stopped = true
  seq++
})

defineExpose({ playNext })
</script>

<template>
  <div class="max-h-[280px] overflow-auto bg-[#344] text-xs text-zinc-200">
    <div
      v-for="(item, index) in lists"
      :key="item.v"
      class="cursor-pointer truncate px-2.5 py-1.5 hover:bg-zinc-800"
      :class="{ 'bg-zinc-800 text-white': curr?.v === item.v }"
      @click="toPlay(item)"
    >
      {{ index + 1 }} {{ item.title }}
    </div>
    <div v-if="!lists.length" class="px-2.5 py-3 text-zinc-400">{{ t('playlist.empty') }}</div>
  </div>
</template>
