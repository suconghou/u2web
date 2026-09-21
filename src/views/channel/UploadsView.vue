<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VideoCard from '@/components/VideoCard.vue'
import { playlistItems, search } from '@/service'
import { videoIdOf } from '@/utils'
import { useI18n } from 'vue-i18n'
import { Search, X } from '@lucide/vue'
import type { ListResponse, VideoItem } from '@/types'

const { t } = useI18n()
const props = defineProps<{ res: VideoItem; channelId: string }>()
const route = useRoute()
const router = useRouter()

const listdata = ref<ListResponse>({ pageInfo: {}, items: [] })
const filter = ref('')
const disabled = ref(false)

const page = computed(() => route.query.page as string | undefined)
const q = computed(() => route.query.q as string | undefined)
const playlistId = computed(() => props.res.contentDetails?.relatedPlaylists?.uploads ?? '')

/** 请求序号:连续操作时丢弃过期响应 */
let seq = 0

async function getList() {
  const cur = ++seq
  disabled.value = true
  window.scrollTo(0, 0)
  try {
    if (filter.value) {
      const { ok, data } = await search(filter.value, page.value, props.channelId)
      if (cur !== seq) return
      listdata.value = ok ? data : { pageInfo: {}, items: [] }
      return
    }
    if (!playlistId.value) {
      if (cur === seq) listdata.value = { pageInfo: {}, items: [] }
      return
    }
    const { ok, data } = await playlistItems(playlistId.value, page.value)
    if (cur !== seq) return
    listdata.value = ok ? data : { pageInfo: {}, items: [] }
  } finally {
    if (cur === seq) disabled.value = false
  }
}

function doSearch() {
  const q = filter.value.trim()
  router.push({ name: route.name as string, query: q ? { q } : {} })
}

function clearSearch() {
  filter.value = ''
  router.push({ name: route.name as string })
}

function prev() {
  router.push({ name: route.name as string, query: { page: listdata.value.prevPageToken, q: q.value } })
}

function next() {
  router.push({ name: route.name as string, query: { page: listdata.value.nextPageToken, q: q.value } })
}

// 翻页/搜索词/上传列表 ID 变化时重新拉取;同步输入框(覆盖浏览器前进/后退)
watch(
  [page, q, playlistId],
  () => {
    filter.value = q.value ?? ''
    void getList()
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-zinc-500">{{ t('uploads.results', { count: listdata.pageInfo?.totalResults ?? 0 }) }}</div>
      <div class="flex w-full max-w-xs items-center rounded-full border border-zinc-300 bg-white px-3 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <Search class="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          v-model="filter"
          class="w-full bg-transparent px-2 py-1.5 text-sm outline-none"
          :placeholder="t('uploads.placeholder')"
          @keydown.enter="doSearch"
        />
        <button
          v-if="filter"
          class="shrink-0 cursor-pointer p-0.5 text-zinc-400 hover:text-zinc-600"
          :aria-label="t('uploads.clear')"
          @click="clearSearch"
        >
          <X class="h-4 w-4" />
        </button>
        <button
          class="shrink-0 cursor-pointer rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click="doSearch"
        >
          {{ t('uploads.search') }}
        </button>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      <VideoCard v-for="item in listdata.items" :key="item.etag ?? videoIdOf(item)" :item="item" />
    </div>
    <div class="my-10 flex justify-end gap-3">
      <button
        v-if="listdata.prevPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="prev"
      >
        {{ t('common.prev') }}
      </button>
      <button
        v-if="listdata.nextPageToken"
        :disabled="disabled"
        class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="next"
      >
        {{ t('common.next') }}
      </button>
    </div>
  </div>
</template>
