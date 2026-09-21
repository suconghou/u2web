<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VideoCard from '@/components/VideoCard.vue'
import { playlistItems } from '@/service'
import { videoIdOf } from '@/utils'
import type { ListResponse, VideoItem } from '@/types'

const { t } = useI18n()
const props = defineProps<{ res: VideoItem; channelId: string }>()

const listdata = ref<ListResponse>({ pageInfo: {}, items: [] })
const disabled = ref(false)

const playlistId = computed(() => props.res.contentDetails?.relatedPlaylists?.favorites ?? '')

let seq = 0

async function getPlayList(pageToken?: string) {
  const cur = ++seq
  window.scrollTo(0, 0)
  disabled.value = true
  try {
    const { ok, data } = await playlistItems(playlistId.value, pageToken)
    if (cur !== seq) return
    listdata.value = ok ? data : { pageInfo: {}, items: [] }
  } finally {
    if (cur === seq) disabled.value = false
  }
}

watch(
  playlistId,
  (id) => {
    if (id) void getPlayList()
    else listdata.value = { pageInfo: {}, items: [] }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="mb-3 text-sm text-zinc-500">{{ t('fav.results', { count: listdata.pageInfo?.totalResults ?? 0 }) }}</div>
    <div v-if="!playlistId" class="py-10 text-center text-sm text-zinc-400">{{ t('fav.private') }}</div>
    <div v-else class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      <VideoCard v-for="item in listdata.items" :key="item.etag ?? videoIdOf(item)" :item="item" />
    </div>
    <div class="my-10 flex justify-end gap-3">
      <button
        v-if="listdata.prevPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
        @click="getPlayList(listdata.prevPageToken)"
      >
        {{ t('common.prev') }}
      </button>
      <button
        v-if="listdata.nextPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
        @click="getPlayList(listdata.nextPageToken)"
      >
        {{ t('common.next') }}
      </button>
    </div>
  </div>
</template>
