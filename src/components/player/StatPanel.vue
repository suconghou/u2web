<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Fastloader, LoadItem, RtcPeerStat, SegmentItem } from '@/types'
import { byteFormat } from '@/utils'
import StatCard from './StatCard.vue'

const { t } = useI18n()
const props = defineProps<{
  title: string
  loadItems: LoadItem[]
}>()

const vCard = useTemplateRef<InstanceType<typeof StatCard>>('vcard')
const aCard = useTemplateRef<InstanceType<typeof StatCard>>('acard')

const vdispatch = ref<Record<number, SegmentItem>>({})
const adispatch = ref<Record<number, SegmentItem>>({})
const stat = ref<Record<string, RtcPeerStat>>({})
const mid = ref('')

const names = computed(() => {
  const [v, a] = props.loadItems
  let vtitle = ''
  let atitle = ''
  if (v) {
    const ext = /webm/.test(v.mimeCodec) ? 'webm' : 'mp4'
    vtitle = `${props.title}-${v.itag}.${ext}`
  }
  if (a) {
    const ext = /webm/.test(a.mimeCodec) ? 'webm' : 'mp4'
    atitle = `${props.title}-${a.itag}.${ext}`
  }
  return { vtitle, atitle }
})

const statOnNum = computed(() =>
  Object.values(stat.value).filter((s) => s.state === 'open').length,
)

const LEGEND: { cls: string; key: string }[] = [
  { cls: 'http-start', key: 'stats.httpStart' },
  { cls: 'rtc-start', key: 'stats.rtcProbe' },
  { cls: 'http-start http-done', key: 'stats.httpDone' },
  { cls: 'rtc-start rtc-done', key: 'stats.rtcDone' },
  { cls: 'http-error', key: 'stats.httpError' },
  { cls: 'http-start rtc-start http-done', key: 'stats.bothHttp' },
  { cls: 'http-start rtc-start rtc-done', key: 'stats.bothRtc' },
]

function bindLoader(loader: Fastloader | undefined, card: InstanceType<typeof StatCard> | null) {
  if (!loader) return
  loader.listen('rtc.stat', (s, m) => {
    stat.value = (s as Record<string, RtcPeerStat>) ?? {}
    mid.value = String(m ?? '')
  })
  loader.listen('http.start', (item) => {
    card?.statusupdate('http-start', item as SegmentItem)
  })
  loader.listen('http.done', (res) => {
    const r = res as SegmentItem & { err?: unknown }
    card?.statusupdate(r.err ? 'http-error' : 'http-done', r)
  })
  loader.listen('rtc.start', (item) => {
    card?.statusupdate('rtc-start', item as SegmentItem)
  })
  loader.listen('rtc.done', (res) => {
    card?.statusupdate('rtc-done', res as SegmentItem)
  })
  loader.listen('rtc.progress', (res) => {
    const r = res as { i?: number; n?: number; part?: number }
    card?.statusupdate('progress', { no: r.part ?? 0, i: r.i, n: r.n } as SegmentItem)
  })
}

/** fastloadjs 的分块对象用 start/end 表示字节区间,StatCard 需要 m/n */
function toSegments(raw: unknown): Record<number, SegmentItem> {
  const src = (raw ?? {}) as Record<number, { no: number; start: number; end: number }>
  const out: Record<number, SegmentItem> = {}
  for (const k of Object.keys(src)) {
    const s = src[Number(k)]
    out[Number(k)] = { no: s.no, m: s.start, n: s.end }
  }
  return out
}

/** 由播放页在 loadersready 事件后调用 */
function onLoadersready(loaders: Fastloader[], dispatchs: unknown[]) {
  const [vloader, aloader] = loaders
  const [vd, ad] = dispatchs as [unknown, unknown]
  vdispatch.value = toSegments(vd)
  adispatch.value = toSegments(ad)
  bindLoader(vloader, vCard.value)
  bindLoader(aloader, aCard.value)
}

defineExpose({ onLoadersready })
</script>

<template>
  <div class="my-8">
    <!-- 图例 -->
    <div class="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600">
      <div v-for="l in LEGEND" :key="l.key" class="flex items-center gap-2">
        <span class="stat-box inline-block h-3 w-3 border border-white" :class="l.cls"></span>
        <span>{{ t(l.key) }}</span>
      </div>
    </div>

    <!-- P2P 节点 -->
    <div class="mb-4 font-mono text-xs">
      <div class="mb-2 flex items-center gap-4">
        <span class="max-w-[340px] truncate uppercase text-brand-600">{{ mid }}</span>
        <span v-if="mid">{{ statOnNum }}/{{ Object.keys(stat).length }}</span>
      </div>
      <div
        v-for="(item, key) in stat"
        :key="key"
        class="mb-1.5 flex flex-wrap items-center gap-4 rounded bg-zinc-200 px-2 py-1"
        :class="{
          'bg-green-300': item.state === 'open',
          'bg-yellow-200': item.state === 'connecting',
          'bg-rose-200': item.state === 'closing' || item.state === 'closed',
          'bg-red-400 text-white': item.cstate === 'failed' || item.istate === 'failed',
        }"
      >
        <span class="max-w-[300px] truncate uppercase">{{ t('stats.node', { key }) }}</span>
        <span>{{ t('stats.sent', { n: byteFormat(item.tx) }) }}</span>
        <span>{{ t('stats.received', { n: byteFormat(item.rx) }) }}</span>
      </div>
    </div>

    <!-- 视频/音频分块统计 -->
    <div class="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="text-base font-medium">{{ t('stats.video') }}</div>
      <StatCard ref="vcard" :title="names.vtitle" :segments="vdispatch" />
    </div>
    <div class="mt-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="text-base font-medium">{{ t('stats.audio') }}</div>
      <StatCard ref="acard" :title="names.atitle" :segments="adispatch" />
    </div>
  </div>
</template>

<style scoped>
.stat-box.http-start {
  background: #e6af13;
}
.stat-box.http-start.http-done {
  background: #070;
}
.stat-box.http-start.http-done.rtc-start {
  background: #0d0;
}
.stat-box.rtc-start {
  opacity: 0.3;
  background: #0dd6e0;
}
.stat-box.rtc-start.rtc-done {
  background: #e50bff;
  opacity: 1;
}
.stat-box.rtc-start.rtc-done.http-start {
  background: #fe03bb;
}
.stat-box.http-start.rtc-start:not(.http-done):not(.rtc-done):not(.http-error) {
  background: #e6af13;
}
.stat-box.http-error {
  background: #a00;
  opacity: 1;
}
</style>
