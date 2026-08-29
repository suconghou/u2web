<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Send } from '@lucide/vue'
import { byteFormat } from '@/utils'
import { getRtc, msgList, sendChat, setChatPageActive } from '@/service/rtc'
import type { Rtc, RtcPeerStat } from '@/types'

const { t } = useI18n()
const id = ref('')
const stat = ref<Record<string, RtcPeerStat>>({})
const text = ref('')
const messages = ref([...msgList])
const listEl = ref<HTMLElement | null>(null)

let rtc: Rtc | null = null
let timer: ReturnType<typeof setInterval> | undefined

const disabled = computed(() => !text.value.trim())

function render() {
  messages.value = [...msgList]
  nextTick(() => {
    const el = listEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function send() {
  const t = text.value.trim()
  if (!t) return
  if (!sendChat(t)) return
  msgList.push({ uid: id.value, text: t })
  text.value = ''
  render()
}

onMounted(() => {
  setChatPageActive(true)
  rtc = getRtc()
  if (!rtc) return
  id.value = rtc.id
  timer = setInterval(() => {
    if (rtc) stat.value = rtc.getStats()
  }, 1000)
  setTimeout(() => {
    if (rtc) stat.value = rtc.getStats()
    if (!msgList.length) {
      msgList.push({ uid: t('chat.robot'), text: t('chat.hint') })
    }
    render()
  }, 200)
})

onBeforeUnmount(() => {
  setChatPageActive(false)
  clearInterval(timer)
})
</script>

<template>
  <div class="pt-4">
    <div class="flex flex-col gap-4 lg:flex-row">
      <!-- 聊天区 -->
      <div class="flex-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div ref="listEl" class="h-[60vh] space-y-4 overflow-auto px-2 py-4">
          <div
            v-for="(item, index) in messages"
            :key="index"
            class="relative min-h-[60px] pl-14"
            :class="{ 'pr-14 pl-0 text-right': item.uid === id }"
          >
            <div class="absolute top-0 left-1" :class="{ 'right-1 left-auto': item.uid === id }">
              <img
                :src="`https://gravatar.loli.net/avatar/${item.uid}`"
                class="h-10 w-10 rounded-full bg-zinc-200"
                alt=""
              />
              <cite
                class="absolute top-[-2px] left-12 w-40 truncate text-xs text-zinc-400 not-italic uppercase sm:w-72"
                :class="{ 'right-12 left-auto text-right': item.uid === id }"
              >
                {{ item.uid }}
              </cite>
            </div>
            <div
              class="relative mt-6 inline-block rounded bg-zinc-200 px-3.5 py-2 text-left text-sm break-all text-zinc-700"
              :class="{ 'bg-emerald-500 text-white': item.uid === id }"
            >
              {{ item.text }}
            </div>
          </div>
        </div>
        <div class="relative border-t border-zinc-200 pt-2">
          <textarea
            v-model="text"
            maxlength="200"
            class="h-20 w-full resize-none rounded border-none p-2 text-sm outline-none"
            :placeholder="t('chat.placeholder')"            @keydown.enter.stop.prevent="send"
          ></textarea>
          <button
            class="absolute right-2 bottom-2 flex cursor-pointer items-center gap-1 rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
            :disabled="disabled"
            @click.stop.prevent="send"
          >
            <Send class="h-3.5 w-3.5" />
            {{ t('chat.send') }}
          </button>
        </div>
      </div>

      <!-- 节点状态 -->
      <div class="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs lg:w-72">
        <div class="mb-4 truncate text-brand-600 uppercase">{{ id }}</div>
        <div
          v-for="(item, uid) in stat"
          :key="uid"
          class="mb-1.5 rounded bg-zinc-200 px-2 py-1.5"
          :class="{
            'bg-green-300': item.state === 'open',
            'bg-yellow-200': item.state === 'connecting',
            'bg-rose-200': item.state === 'closing' || item.state === 'closed',
            'bg-red-400 text-white': item.cstate === 'failed' || item.istate === 'failed',
          }"
        >
          <div class="truncate uppercase">{{ uid }}</div>
          <div class="mt-0.5 flex gap-4">
            <span>{{ t('chat.sent', { n: byteFormat(item.tx) }) }}</span>
            <span>{{ t('chat.received', { n: byteFormat(item.rx) }) }}</span>
          </div>
        </div>
        <div v-if="!Object.keys(stat).length" class="text-zinc-400">{{ t('chat.noNodes') }}</div>
      </div>
    </div>
  </div>
</template>
