<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VPlayer from '@/components/player/VPlayer.vue'
import StatPanel from '@/components/player/StatPanel.vue'
import ListRow from '@/components/ListRow.vue'
import Loading from '@/components/Loading.vue'
import { videoInfo, playlistItems, relatedVideo, playerInfo } from '@/service'
import { downloadUrl } from '@/config'
import { timeBefore, formatCount, formatDuration } from '@/utils'
import { toast } from '@/utils/toast'
import type { Fastloader, ListResponse, LoadItem, PlayerInfo, VideoItem } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const info = ref<VideoItem>({})
const listdata = ref<ListResponse>({ items: [] })
const pinfo = ref<Partial<PlayerInfo>>({})
const showStat = ref(false)
const loadItems = ref<LoadItem[]>([])
const statPanel = ref<InstanceType<typeof StatPanel> | null>(null)

const id = computed(() => route.params.id as string)
const listId = computed(() => route.query.list as string | undefined)
const v = computed(() => info.value.snippet ?? {})
const date = computed(() => timeBefore(v.value.publishedAt))
const duration = computed(() => formatDuration(info.value.contentDetails?.duration))
const viewcount = computed(() => formatCount(info.value.statistics?.viewCount))

/** 侧栏列表:排除当前视频与未发布条目 */
const items = computed(() =>
  listdata.value.items.filter((item) => {
    if (!item.snippet) return false
    if (!item.snippet.resourceId) return true
    if (item.contentDetails && !item.contentDetails.videoPublishedAt) return false
    return item.snippet.resourceId.videoId !== id.value
  }),
)

async function getInfo(vid: string) {
  try {
    loading.value = true
    error.value = ''
    void getPlayer(vid)
    const { ok, data } = await videoInfo(vid)
    loading.value = false
    if (!ok) return
    info.value = data.items[0] ?? {}
    if (!info.value.snippet) {
      error.value = t('video.notFound')
      return
    }
    document.title = info.value.snippet.title ?? t('site.suffix')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}

async function getPlayer(vid: string) {
  try {
    pinfo.value = {}
    const { ok, data } = await playerInfo(vid)
    if (!ok) {
      pinfo.value = { error: data.msg || t('video.parseFailed') }
      return
    }
    pinfo.value = data
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}

async function getList(lid: string) {
  const { ok, data } = await playlistItems(lid)
  if (!ok) return
  listdata.value = data
}

async function getRelated(vid: string) {
  const { ok, data } = await relatedVideo(vid)
  if (!ok) return
  listdata.value = data
}

function toChannel() {
  if (!v.value.channelId) return
  router.push({ name: 'channel.uploads', params: { id: v.value.channelId } })
}

function onLoad(items: LoadItem[]) {
  loadItems.value = items
}

function onLoadersready(loaders: Fastloader[], dispatchs: unknown[]) {
  statPanel.value?.onLoadersready(loaders, dispatchs)
}

function initPlayer() {
  showStat.value = false
  nextTick(() => {
    showStat.value = true
  })
}

watch(
  id,
  (vid) => {
    if (!vid) return
    window.scrollTo(0, 0)
    void getInfo(vid)
    if (!listId.value) void getRelated(vid)
  },
  { immediate: true },
)

watch(
  listId,
  (lid) => {
    if (lid) void getList(lid)
  },
  { immediate: true },
)

watch(
  () => route.path,
  () => {
    const n = document.querySelector('.m-title')
    if (n) n.scrollIntoView({ behavior: 'smooth', block: 'end' })
    else window.scrollTo(0, 0)
  },
)

onBeforeRouteLeave(() => {
  pinfo.value = {}
  document.title = t('site.suffix')
})

onBeforeUnmount(() => {
  document.title = t('site.suffix')
})
</script>

<template>
  <div class="pt-4">
    <Loading v-if="loading" />
    <div v-else-if="error" class="flex min-h-[300px] items-center justify-center rounded bg-zinc-200 text-lg text-zinc-600">
      {{ error }}
    </div>
    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- 主区:播放器 + 信息 -->
      <div class="lg:col-span-2">
        <h1 class="m-title mb-4 mt-2 text-xl font-medium break-all text-zinc-800 sm:text-2xl">{{ v.title }}</h1>

        <div class="relative overflow-hidden rounded-lg bg-zinc-900">
          <VPlayer
            v-if="pinfo.id"
            :player-info="(pinfo as PlayerInfo)"
            @init="initPlayer"
            @load="onLoad"
            @loadersready="onLoadersready"
          />
          <div v-else-if="pinfo.error" class="flex aspect-video items-center justify-center px-6 text-center text-lg text-rose-400">
            {{ pinfo.error }}
          </div>
          <div v-else class="flex aspect-video items-center justify-center">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
          </div>
        </div>

        <div class="mt-3">
          <button class="cursor-pointer text-sm font-medium text-zinc-800 transition-colors hover:text-brand-600" @click="toChannel">
            {{ v.channelTitle }}
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span v-if="v.publishedAt" class="text-zinc-500">{{ t('listRow.publishedOn', { date }) }}</span>
          <span v-if="duration" class="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{{ duration }}</span>
          <span v-if="viewcount" class="rounded-full bg-brand-100 px-2.5 py-1 text-brand-700">{{ viewcount }}</span>
          <a
            :href="downloadUrl(id)"
            target="_blank"
            rel="noopener"
            class="cursor-pointer rounded-full bg-rose-100 px-2.5 py-1 text-rose-600 hover:bg-rose-200"
          >
            {{ t('video.download') }}
          </a>
        </div>

        <p class="mt-4 text-sm whitespace-pre-line break-all text-zinc-600">{{ v.description }}</p>

        <div v-if="v.tags?.length" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="t in v.tags" :key="t" class="rounded-full bg-zinc-300 px-2.5 py-0.5 text-xs text-white">
            {{ t }}
          </span>
        </div>

        <StatPanel
          v-if="showStat && pinfo.id"
          ref="statPanel"
          :title="pinfo.title ?? ''"
          :load-items="loadItems"
        />
      </div>

      <!-- 侧栏:相关视频/播放列表 -->
      <aside class="lg:col-span-1">
        <ListRow v-for="item in items" :key="item.etag" :item="item" :video="true" :mini="true" />
        <div v-if="!items.length" class="py-8 text-center text-sm text-zinc-400">{{ t('video.noRelated') }}</div>
      </aside>
    </div>
  </div>
</template>
