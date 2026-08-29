<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { channels } from '@/service'
import { timeBefore, formatCount } from '@/utils'
import type { VideoItem } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const res = ref<VideoItem>({})

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
  return tabs.some((t) => t.name === n) ? n : 'channel.uploads'
})

async function init(id: string) {
  const { ok, data } = await channels(id)
  if (!ok) return
  res.value = data.items[0] ?? {}
  if (title.value) {
    setTimeout(() => (document.title = title.value), 0)
  } else {
    setTimeout(() => (document.title = t('site.suffix')), 0)
  }
}

function initroute() {
  init(channelId.value)
  const valid = ['channel.uploads', 'channel.fav', 'channel.list', 'channel.list.items']
  if (!valid.includes(route.name as string)) {
    router.replace({ name: 'channel.uploads', params: { id: channelId.value } })
  }
}

watch(() => route.path, () => initroute())
onMounted(() => initroute())
onBeforeUnmount(() => (document.title = t('site.suffix')))
</script>

<template>
  <div v-if="snippet.title" class="pt-4">
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
