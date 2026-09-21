<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ListRow from '@/components/ListRow.vue'
import { playlistsInChannel } from '@/service'
import type { ListResponse, VideoItem } from '@/types'

const { t } = useI18n()
const props = defineProps<{ res: VideoItem; channelId: string }>()
const route = useRoute()
const router = useRouter()

const listdata = ref<ListResponse>({ pageInfo: {}, items: [] })
const disabled = ref(false)

const isListRoot = computed(() => route.name === 'channel.list')
const page = computed(() => route.query.page as string | undefined)

let seq = 0

async function getPlayList() {
  const cur = ++seq
  window.scrollTo(0, 0)
  disabled.value = true
  try {
    const { ok, data } = await playlistsInChannel(props.channelId, page.value)
    if (cur !== seq) return
    listdata.value = ok ? data : { pageInfo: {}, items: [] }
  } finally {
    if (cur === seq) disabled.value = false
  }
}

function prev() {
  router.push({ name: route.name as string, query: { page: listdata.value.prevPageToken } })
}

function next() {
  router.push({ name: route.name as string, query: { page: listdata.value.nextPageToken } })
}

watch(
  [() => props.channelId, page, isListRoot],
  () => {
    if (isListRoot.value) void getPlayList()
  },
  { immediate: true },
)
</script>

<template>
  <template v-if="isListRoot">
    <div class="mb-3 text-sm text-zinc-500">{{ t('playlistItems.results', { count: listdata.pageInfo?.totalResults ?? 0 }) }}</div>
    <div>
      <ListRow v-for="item in listdata.items" :key="item.etag" :item="item" />
    </div>
    <div class="my-10 flex justify-end gap-3">
      <button
        v-if="listdata.prevPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
        @click="prev"
      >
        {{ t('common.prev') }}
      </button>
      <button
        v-if="listdata.nextPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
        @click="next"
      >
        {{ t('common.next') }}
      </button>
    </div>
  </template>
  <router-view v-else :res="res" />
</template>
