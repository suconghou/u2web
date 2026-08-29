<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VideoCard from '@/components/VideoCard.vue'
import ListRow from '@/components/ListRow.vue'
import { List, LayoutGrid } from '@lucide/vue'
import { playlistItems } from '@/service'
import type { ListResponse, VideoItem } from '@/types'

const { t } = useI18n()
defineProps<{ res: VideoItem }>()
const route = useRoute()
const router = useRouter()

const listdata = ref<ListResponse>({ pageInfo: {}, items: [] })
const disabled = ref(false)
const listview = ref(true)

const playlistId = computed(() => route.params.listId as string)
const page = computed(() => route.query.page as string | undefined)

async function getPlayList() {
  window.scrollTo(0, 0)
  disabled.value = true
  const { ok, data } = await playlistItems(playlistId.value, page.value)
  disabled.value = false
  if (!ok) return
  listdata.value = data
}

function prev() {
  router.push({ name: route.name as string, query: { page: listdata.value.prevPageToken } })
}

function next() {
  router.push({ name: route.name as string, query: { page: listdata.value.nextPageToken } })
}

watch(page, () => getPlayList())
onMounted(() => getPlayList())
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <div class="text-sm text-zinc-500">{{ t('playlistItems.results', { count: listdata.pageInfo?.totalResults ?? 0 }) }}</div>
      <div class="flex gap-2">
        <button
          class="cursor-pointer rounded p-1.5"
          :class="listview ? 'text-brand-600' : 'text-zinc-400'"
          :aria-label="t('playlistItems.listView')"
          @click="listview = true"
        >
          <List class="h-5 w-5" />
        </button>
        <button
          class="cursor-pointer rounded p-1.5"
          :class="!listview ? 'text-brand-600' : 'text-zinc-400'"
          :aria-label="t('playlistItems.gridView')"
          @click="listview = false"
        >
          <LayoutGrid class="h-5 w-5" />
        </button>
      </div>
    </div>

    <div v-if="listview">
      <ListRow v-for="item in listdata.items" :key="item.etag" :item="item" :video="true" />
    </div>
    <div v-else class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      <VideoCard v-for="item in listdata.items" :key="item.etag" :item="item" />
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
  </div>
</template>
