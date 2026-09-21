<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import VideoCard from '@/components/VideoCard.vue'
import Loading from '@/components/Loading.vue'
import { search } from '@/service'
import { videoIdOf } from '@/utils'
import { toast } from '@/utils/toast'
import type { ListResponse } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const disabled = ref(false)
const result = ref<ListResponse>({ items: [] })
const regionOpen = ref(false)
const regionRef = ref<HTMLElement>()

const options = computed(() => ['HK', 'TW', 'US', 'KR', 'JP'].map((v) => ({ name: t(`regions.${v}`), value: v })))

const q = computed(() => route.query.q as string | undefined)
const page = computed(() => route.query.page as string | undefined)
/** 地区直接由路由派生,前进/后退也能正确刷新结果 */
const rcode = computed(() => (route.query.regionCode as string) || '')

/** 请求序号:连续触发搜索时丢弃过期响应 */
let seq = 0

async function doSearch() {
  const cur = ++seq
  loading.value = true
  disabled.value = true
  window.scrollTo(0, 0)
  try {
    const { ok, data } = await search(q.value, page.value, undefined, rcode.value || undefined)
    if (cur !== seq) return
    result.value = ok ? data : { items: [] }
  } catch (e) {
    if (cur !== seq) return
    result.value = { items: [] }
    toast.error(e instanceof Error ? e.message : String(e))
  } finally {
    if (cur === seq) {
      disabled.value = false
      loading.value = false
    }
  }
}

function selectRegion(v: string) {
  regionOpen.value = false
  router.push({
    name: route.name as string,
    query: { ...route.query, regionCode: v || undefined, page: undefined },
  })
}

function onDocClick(e: MouseEvent) {
  if (!regionRef.value?.contains(e.target as Node)) regionOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  doSearch()
})
onUnmounted(() => document.removeEventListener('click', onDocClick))

function prev() {
  router.push({ name: route.name as string, query: { page: result.value.prevPageToken, q: q.value, regionCode: rcode.value } })
}

function next() {
  router.push({ name: route.name as string, query: { page: result.value.nextPageToken, q: q.value, regionCode: rcode.value } })
}

watch([q, page, rcode], () => doSearch())
</script>

<template>
  <div class="pt-4">
    <Loading v-if="loading" />
    <template v-else>
      <div v-if="result.pageInfo" class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-zinc-500">{{ t('searchView.results', { count: result.pageInfo.totalResults }) }}</div>
        <div class="relative" ref="regionRef">
          <button
            class="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none transition hover:border-brand-400 focus:border-brand-500"
            :aria-label="t('searchView.region')"
            @click="regionOpen = !regionOpen"
          >
            <span>{{ rcode ? t(`regions.${rcode}`) : t('searchView.allRegions') }}</span>
            <ChevronDown class="h-4 w-4 transition-transform" :class="regionOpen ? 'rotate-180' : ''" />
          </button>
          <div
            v-if="regionOpen"
            class="absolute top-full right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-sm text-zinc-700 shadow-lg"
          >
            <button
              class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 hover:bg-brand-50"
              :class="!rcode ? 'font-medium text-brand-600' : ''"
              @click="selectRegion('')"
            >
              {{ t('searchView.allRegions') }}
            </button>
            <button
              v-for="o in options"
              :key="o.value"
              class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 hover:bg-brand-50"
              :class="rcode === o.value ? 'font-medium text-brand-600' : ''"
              @click="selectRegion(o.value)"
            >
              {{ o.name }}
            </button>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <VideoCard v-for="item in result.items" :key="item.etag ?? videoIdOf(item)" :item="item" />
      </div>
      <div class="my-12 flex justify-end gap-3">
        <button
          v-if="result.prevPageToken"
          :disabled="disabled"
          class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 disabled:opacity-50"
          @click="prev"
        >
          {{ t('common.prev') }}
        </button>
        <button
          v-if="result.nextPageToken"
          :disabled="disabled"
          class="cursor-pointer rounded px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 disabled:opacity-50"
          @click="next"
        >
          {{ t('common.next') }}
        </button>
      </div>
    </template>
  </div>
</template>
