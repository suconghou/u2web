<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SegmentItem } from '@/types'
import { byteFormat } from '@/utils'

const { t } = useI18n()
const props = defineProps<{
  segments: Record<number, SegmentItem>
  title: string
}>()

interface SegStatus {
  item: SegmentItem
  status: string[]
  progress: string
}

const curr = ref<SegmentItem | null>(null)
const status = ref<Record<number, SegStatus>>({})

const len = computed(() => {
  const n = Object.keys(props.segments).length
  if (n > 3000) return 'most'
  if (n > 1000) return 'more'
  return ''
})

const citem = computed(() => {
  if (!curr.value) return null
  const { m, n, no } = curr.value
  return { no, size: byteFormat(n - m), m, n }
})

const loadstatus = computed(() => {
  let loaded = 0
  let total = 0
  for (const k of Object.keys(props.segments)) {
    const item = props.segments[Number(k)]
    const s = status.value[item.no]
    const z = item.n - item.m
    total += z
    const ss = s ? s.status : []
    if (ss.includes('http-done') || ss.includes('rtc-done')) loaded += z
  }
  return { done: total === loaded, total, loaded }
})

function boxClass(no: number): string[] {
  const s = status.value[no]
  if (!s) return []
  return [...s.status, s.progress]
}

/** fastloadjs 文件块状态回调 */
function statusupdate(t: string, res: SegmentItem & { i?: number; n?: number }) {
  let s = status.value[res.no]
  if (!s) {
    s = { item: res, status: [], progress: '' }
    status.value[res.no] = s
  }
  if (t === 'progress') {
    const i = res.i ?? 0
    const n = res.n ?? 1
    const p = Math.ceil(((i + 1) / n) * 10)
    s.progress = `rtc-found p${p} p${i + 1}-${n}`
  } else {
    s.status.push(t)
  }
}

defineExpose({ statusupdate })
</script>

<template>
  <div class="my-4">
    <div class="mb-2 text-sm font-medium text-zinc-700">{{ title }}</div>
    <div class="flex flex-wrap gap-px" :class="len" @mouseleave="curr = null">
      <div
        v-for="(item, index) in segments"
        :key="index"
        class="stat-box h-3 w-3 border border-white bg-zinc-200"
        :class="boxClass(item.no)"
        @mouseenter="curr = item"
      ></div>
    </div>
    <div class="mt-2 flex h-6 items-center gap-3 text-xs text-zinc-500">
      <span v-if="loadstatus.total">
        {{ byteFormat(loadstatus.loaded) }} / {{ byteFormat(loadstatus.total) }}
      </span>
      <template v-if="citem">
        <span>{{ t('stats.fileNo', { n: citem.no }) }}</span>
        <span>{{ t('stats.size', { size: citem.size }) }}</span>
        <span>{{ t('stats.range', { start: citem.m, end: citem.n }) }}</span>
      </template>
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
.stat-box.http-start.http-done.rtc-found {
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
.stat-box:hover {
  border-color: #888;
}
.most .stat-box {
  width: 6px;
  height: 6px;
}
.more .stat-box {
  width: 10px;
  height: 10px;
}
@keyframes shining {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.3);
  }
  100% {
    transform: scale(1);
    background: #e50bff;
  }
}
.stat-box.p1,
.stat-box.p2,
.stat-box.p3,
.stat-box.p4,
.stat-box.p5,
.stat-box.p6,
.stat-box.p7,
.stat-box.p8,
.stat-box.p9,
.stat-box.p10 {
  animation: shining 0.55s 1;
}
.stat-box.p1 {
  opacity: 0.35;
}
.stat-box.p2 {
  opacity: 0.4;
}
.stat-box.p3 {
  opacity: 0.45;
}
.stat-box.p4 {
  opacity: 0.55;
}
.stat-box.p5 {
  opacity: 0.6;
}
.stat-box.p6 {
  opacity: 0.7;
}
.stat-box.p7 {
  opacity: 0.75;
}
.stat-box.p8 {
  opacity: 0.85;
}
.stat-box.p9 {
  opacity: 0.9;
}
.stat-box.p10 {
  opacity: 1;
}
</style>
