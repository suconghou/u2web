<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VideoCard from '@/components/VideoCard.vue'
import { playlistItems } from '@/service'
import type { ListResponse, VideoItem } from '@/types'

const { t } = useI18n()
const props = defineProps<{ res: VideoItem; channelId: string }>()

const listdata = ref<ListResponse>({ pageInfo: {}, items: [] })
const disabled = ref(false)

const playlistId = computed(() => props.res.contentDetails?.relatedPlaylists?.favorites ?? '')

async function getPlayList(pageToken?: string) {
  window.scrollTo(0, 0)
  disabled.value = true
  const { ok, data } = await playlistItems(playlistId.value, pageToken)
  disabled.value = false
  if (!ok) return
  listdata.value = data
}

onMounted(() => {
  if (playlistId.value) getPlayList()
})
</script>

<template>
  <div>
    <div class="mb-3 text-sm text-zinc-500">{{ t('fav.results', { count: listdata.pageInfo?.totalResults ?? 0 }) }}</div>
    <div v-if="!playlistId" class="py-10 text-center text-sm text-zinc-400">{{ t('fav.private') }}</div>
    <div v-else class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      <VideoCard v-for="item in listdata.items" :key="item.etag" :item="item" />
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
