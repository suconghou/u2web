<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Loading from '@/components/Loading.vue'
import { channels } from '@/service'
import { timeBefore, formatCount } from '@/utils'
import { toast } from '@/utils/toast'
import type { VideoItem } from '@/types'

const { t, locale } = useI18n()
const route = useRoute()

const res = ref<VideoItem>({})
const loading = ref(true)
const error = ref('')

const channelId = computed(() => route.params.id as string)
const snippet = computed(() => res.value.snippet ?? {})
const stats = computed(() => res.value.statistics)

const title = computed(() => snippet.value.title ?? '')
const desc = computed(() => snippet.value.description ?? '')
const pubdate = computed(() => timeBefore(snippet.value.publishedAt))
const viewcount = computed(() => formatCount(stats.value?.viewCount))
const videocount = computed(() => t('channel.videos', { n: stats.value?.videoCount ?? 0 }))
const subscriberCount = computed(() => {
  const v = Number(stats.value?.subscriberCount ?? 0)
  if (!Number.isFinite(v) || v < 0) return ''
  if (locale.value === 'en') {
    const n = v < 1e3 ? String(v) : v < 1e6 ? `${Math.floor(v / 1e3)}K` : `${Math.floor(v / 1e6)}M`
    return t('channel.subscribers', { n })
  }
  if (v < 1e4) return t('channel.subscribers', { n: v })
  return t('channel.subscribersShort', { n: (v / 1e4).toFixed(1) })
})

const tabs = [
  { name: 'channel.uploads', key: 'channel.uploads' },
  { name: 'channel.fav', key: 'channel.fav' },
  { name: 'channel.list', key: 'channel.playlists' },
]

const activeTab = computed(() => {
  const n = route.name as string
  if (n === 'channel.list.items') return 'channel.list'
  return tabs.some((tab) => tab.name === n) ? n : 'channel.uploads'
})

let seq = 0

async function init(id: string) {
  const cur = ++seq
  loading.value = true
  error.value = ''
  res.value = {}
  try {
    const { ok, data } = await channels(id)
    if (cur !== seq) return
    const item = data.items[0]
    if (!ok || !item?.snippet) {
      error.value = t('channel.notFound')
      return
    }
    res.value = item
    document.title = title.value || t('site.suffix')
  } catch (e) {
    if (cur !== seq) return
    error.value = e instanceof Error ? e.message : String(e)
    toast.error(error.value)
  } finally {
    if (cur === seq) loading.value = false
  }
}

// 仅在频道 ID 变化时重新拉取,同频道内切换 tab 不重取
watch(channelId, (id) => id && init(id), { immediate: true })
onBeforeUnmount(() => (document.title = t('site.suffix')))
</script>

<template>
  <Loading v-if="loading" />
  <div v-else-if="error" class="flex min-h-[300px] items-center justify-center rounded bg-zinc-200 text-lg text-zinc-600">
    {{ error }}
  </div>
  <div v-else-if="snippet.title" class="pt-4">
    <div class="mb-6">
      <div class="text-2xl font-semibold text-zinc-800">{{ title }}</div>
      <div class="mt-1 text-sm text-zinc-500">{{ t('channel.createdOn', { date: pubdate }) }}</div>
      <div class="mt-2 flex flex-wrap gap-2 text-xs">
        <span v-if="stats && !stats.hiddenSubscriberCount" class="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
          {{ subscriberCount }}
        </span>
        <span class="rounded-full bg-brand-100 px-2.5 py-1 text-brand-700">{{ viewcount }}</span>
        <span class="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{{ videocount }}</span>
      </div>
      <div class="mt-3 text-sm whitespace-pre-line text-zinc-600">{{ desc }}</div>
    </div>

    <div class="mb-6 flex gap-1 border-b border-zinc-200">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name, params: { id: channelId } }"
        class="px-4 py-2.5 text-sm transition-colors"
        :class="
          activeTab === tab.name
            ? 'border-b-2 border-brand-600 font-medium text-brand-600'
            : 'text-zinc-500 hover:text-zinc-800'
        "
      >
        {{ t(tab.key) }}
      </router-link>
    </div>

    <router-view :res="res" :channel-id="channelId" />
  </div>
</template>
