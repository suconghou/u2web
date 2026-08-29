<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Fastloader, LoadItem, PlayerInfo } from '@/types'
import { buildLoadItems, buildQualityList, isModern, useWebm } from './streams'
import type { QualityOption } from './streams'
import { imgSrc } from '@/service'
import { timeDuration, debounce, addEventListenerOnce, asyncQueue } from '@/utils'
import { download } from '@/utils/download'
import Delayer from '@/utils/delayer'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Camera, Settings, ListMusic, Check, ChevronLeft, ChevronRight } from '@lucide/vue'
import PlayerMenu from './PlayerMenu.vue'

const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    playerInfo: PlayerInfo
    autoplay?: boolean
    audio?: boolean
    firstItag?: number | string | null
    level?: number
    nop2p?: boolean
    screenshot?: boolean
  }>(),
  {
    autoplay: true,
    audio: false,
    firstItag: null,
    level: 0,
    nop2p: false,
    screenshot: true,
  },
)

const emit = defineEmits<{
  (e: 'init'): void
  (e: 'load', items: LoadItem[]): void
  (e: 'loadersready', loaders: Fastloader[], dispatchs: unknown[]): void
  (e: 'list'): void
  (e: 'ended', info: PlayerInfo): void
}>()

const modern = isModern()
const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
const webm = useWebm()

const videoEl = useTemplateRef<HTMLVideoElement>('video')
const progressLineEl = useTemplateRef<HTMLDivElement>('progressLine')
const timesEl = useTemplateRef<HTMLDivElement>('times')
const loadbarEl = useTemplateRef<HTMLCanvasElement>('loadbar')
const playerRootEl = useTemplateRef<HTMLElement>('playerRoot')
const volTrackEl = useTemplateRef<HTMLElement>('volTrack')
const settingsRootEl = useTemplateRef<HTMLElement>('settingsRoot')
const settingsSpeedEl = useTemplateRef<HTMLElement>('settingsSpeed')

type MenuName = 'quality' | 'settings'
const openMenu = ref<MenuName | null>(null)
const volHover = ref(false)
const settingsPage = ref<'root' | 'speed'>('root')
const settingsHeight = ref(88)

const ctrlBtn =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/15 hover:text-white'
const menuRow =
  'flex h-10 w-full cursor-pointer items-center gap-3 px-3.5 text-left text-[13px] text-white/90 transition-colors hover:bg-white/10'

const v = ref(false)
const loader = ref<Fastloader | null>(null)
const taskQueue = new asyncQueue([])
const delay = ref<Delayer | null>(null)

const paused = ref(true)
const muted = ref(false)
const small = ref(true)
const full = ref(false)
const bottomHide = ref(false)
const clickplay = ref(false)
const vol = ref(60)
const tiptime = ref({ v: '', show: false, left: '' })
const currq = ref<QualityOption>({ quality: '', itag: 0 })
const firstItag = ref<number | null>(
  props.firstItag != null ? Number(props.firstItag) : localStorage.getItem('itag') ? Number(localStorage.getItem('itag')) : null,
)

const video = ref({
  duration: 0,
  currentTime: 0,
  played: 0,
  seeking: true,
  error: null as unknown,
  playbackRate: Number(sessionStorage.getItem('playbackRate')) || 1,
  cycle: Number(sessionStorage.getItem('cycle')) || 0,
})

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const qlist = computed<QualityOption[]>(() =>
  buildQualityList(props.playerInfo, props.level, webm),
)

const posterImg = computed(() => imgSrc(props.playerInfo.id))

const unsupport = computed(() => {
  if (!modern) return true
  const e = video.value.error
  if (!e) return false
  const s = (e instanceof Error ? e.stack || e.message : String(e)) || ''
  return s.includes('type provided') && s.includes('unsupported')
})

const playedStyle = computed(() => ({ width: `${video.value.played * 100}%` }))
const dotStyle = computed(() => ({ left: `calc(${video.value.played * 100}% - 5px)` }))
const tipStyle = computed(() => ({ left: tiptime.value.left }))
const speedLabel = computed(() => {
  const r = video.value.playbackRate
  return r === 1 ? t('player.speedNormal') : `${r}x`
})
const volFill = computed(() => (muted.value ? 0 : vol.value))

const loadItems = computed<LoadItem[]>(() =>
  buildLoadItems(props.playerInfo, props.audio, firstItag.value, qlist.value, webm),
)

const tickEnd = debounce(() => {
  const el = videoEl.value
  if (!el) return
  if (el.duration - el.currentTime < 1) onPlayEnd()
}, 900)

function reset() {
  video.value = {
    duration: 0,
    currentTime: 0,
    played: 0,
    seeking: true,
    error: modern ? null : new Error('not supported'),
    playbackRate: Number(sessionStorage.getItem('playbackRate')) || 1,
    cycle: Number(sessionStorage.getItem('cycle')) || 0,
  }
  vol.value = 60
}

function init() {
  emit('init')
  taskQueue.clear()
  videoEl.value?.pause()
  loader.value?.destroy()
  loader.value = null
  v.value = false
  nextTick(() => {
    v.value = true
    nextTick(() => {
      const items = loadItems.value
      if (!items.length) {
        video.value.error = t('player.notFound')
        return
      }
      const el = videoEl.value
      if (!el) return
      bindVideoEvents(el)
      const fastload = window.fastloadjs
      if (!fastload) {
        video.value.error = t('player.noFastload')
        return
      }
      loader.value = new fastload({
        req: '',
        thread: 2,
        thunk: 1048576,
        start: 0,
        end: 1048576,
        nop2p: props.nop2p,
      })
      loader.value.listen('ready', (loaders, dispatchs) => {
        emit('loadersready', loaders as Fastloader[], dispatchs as unknown[])
        ;(loaders as Fastloader[]).forEach((l) => {
          l.listen('res.done', () => {
            taskQueue.push(
              () =>
                new Promise<void>((resolve) => {
                  setTimeout(() => {
                    if (videoEl.value) updateLoadBar(videoEl.value.buffered, videoEl.value.duration)
                    resolve()
                  }, 100)
                }),
            )
          })
        })
      })
      loader.value.listen('error', (err) => {
        video.value.error = err
        loader.value?.pause()
      })
      loader.value.attach(el, items)
      if (!props.audio) {
        const first = items[0]
        switchQuality({ itag: first.itag, quality: first.quality })
      }
      reset()
      emit('load', items)
    })
  })
}

function bindVideoEvents(el: HTMLVideoElement) {
  el.addEventListener('waiting', () => (video.value.seeking = true))
  el.addEventListener('playing', () => {
    video.value.seeking = false
    syncIdleTimer()
  })
  el.addEventListener('seeking', () => (video.value.seeking = true))
  el.addEventListener('seeked', () => (video.value.seeking = false))
  el.addEventListener('pause', () => {
    paused.value = true
    syncIdleTimer()
  })
  el.addEventListener('play', () => {
    paused.value = false
    syncIdleTimer()
  })
  el.addEventListener('durationchange', () => (video.value.duration = el.duration))
  el.addEventListener('progress', () => updateLoadBar(el.buffered, el.duration))
  el.addEventListener('timeupdate', () => {
    requestAnimationFrame(() => {
      video.value.played = el.currentTime / el.duration
      video.value.currentTime = el.currentTime
    })
    tickEnd()
  })
  el.addEventListener('ended', () => onPlayEnd())
  el.addEventListener('loadedmetadata', () => {
    video.value.seeking = false
    playSpeed()
    if (props.autoplay) {
      el.play()
        .then(() => (clickplay.value = false))
        .catch(() => (clickplay.value = true))
    } else {
      clickplay.value = true
    }
  })
  el.addEventListener('canplay', () => {
    if (props.autoplay) {
      el.play()
        .then(() => (clickplay.value = false))
        .catch(() => (clickplay.value = true))
    }
  })
}

function onPlayEnd() {
  const el = videoEl.value
  if (!el) return
  if (video.value.cycle === 1) {
    el.currentTime = 0
    video.value.currentTime = 0
  } else {
    const vol = el.volume
    el.autoplay = false
    el.currentTime = 0
    video.value.currentTime = 0
    setTimeout(() => el.pause(), 100)
    setTimeout(() => {
      el.pause()
      el.volume = vol
      setTimeout(() => (paused.value = true), 120)
    }, 180)
    if (props.audio) emit('ended', props.playerInfo)
  }
  loader.value?.seekTo(1)
}

function destroy() {
  videoEl.value?.pause()
  loader.value?.destroy()
}

function getTime(dst: number): number {
  const el = videoEl.value
  if (!el) return 0
  let time = dst * el.duration
  if (time < 0) time = 0
  else if (time > el.duration) time = el.duration
  return time
}

function seek(n: number) {
  const el = videoEl.value
  const t = el?.duration
  if (!el || !t || !isFinite(t)) return
  const s = el.currentTime + n
  if (s > 0 && s < t) {
    video.value.currentTime = s
    el.currentTime = s
    loader.value?.seekTo(s)
  }
  syncIdleTimer()
}

function seekTo(e: MouseEvent) {
  const target = e.target as HTMLElement
  let dx: number
  if (target.classList.contains('dot')) {
    dx = target.offsetLeft + e.offsetX
  } else {
    dx = e.offsetX
  }
  const w = progressLineEl.value?.clientWidth ?? 1
  const time = getTime(dx / w)
  if (!isFinite(time)) return
  video.value.currentTime = time
  if (videoEl.value) videoEl.value.currentTime = time
  tiptime.value.v = timeDuration(time)
  tiptime.value.show = true
  loader.value?.seekTo(time)
}

function showCurrTime(e: MouseEvent) {
  const target = e.target as HTMLElement
  let dx: number
  if (target.classList.contains('dot')) {
    dx = target.offsetLeft + e.offsetX
  } else {
    dx = e.offsetX
  }
  const w = progressLineEl.value?.clientWidth ?? 1
  const time = getTime(dx / w)
  const sw = timesEl.value?.clientWidth ?? 0
  let left = dx - sw / 2
  if (left < 0) left = 0
  if (left > w - sw) left = w - sw
  tiptime.value.v = timeDuration(time)
  tiptime.value.left = `${left}px`
}

function togglePlayOnClick() {
  if (openMenu.value) {
    openMenu.value = null
    return
  }
  const el = videoEl.value
  if (!el || el.readyState <= 1) return
  if (!props.audio) togglePlay()
}

function toggleMenu(name: MenuName) {
  openMenu.value = openMenu.value === name ? null : name
}

function closeMenus() {
  openMenu.value = null
}

function onEsc() {
  if (openMenu.value) {
    if (openMenu.value === 'settings' && settingsPage.value !== 'root') {
      settingsPage.value = 'root'
      return
    }
    openMenu.value = null
  }
}

function onDocPointerDown(e: PointerEvent) {
  if (!openMenu.value) return
  const root = playerRootEl.value
  if (root?.contains(e.target as Node)) return
  openMenu.value = null
}

async function measureSettings() {
  await nextTick()
  await nextTick()
  const el = settingsPage.value === 'root' ? settingsRootEl.value : settingsSpeedEl.value
  if (el?.offsetHeight) settingsHeight.value = el.offsetHeight
}

function togglePlay() {
  const el = videoEl.value
  if (!el) return
  if (el.paused) playVideo()
  else pauseVideo()
}

function toggleFull() {
  if (!props.audio) full.value = !full.value
}

function pauseVideo() {
  videoEl.value?.pause()
}

function playVideo() {
  videoEl.value
    ?.play()
    .then(() => (clickplay.value = false))
    .catch(() => (clickplay.value = true))
}

function muteon() {
  if (videoEl.value) videoEl.value.muted = true
  muted.value = true
}

function muteoff() {
  if (videoEl.value) videoEl.value.muted = false
  muted.value = false
}

async function toFull() {
  try {
    let el: HTMLElement = videoEl.value ?? (undefined as unknown as HTMLElement)
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !/MiuiBrowser/i.test(navigator.userAgent)) {
      el = videoEl.value as HTMLElement
    } else {
      el = (videoEl.value?.closest('.vplayer') as HTMLElement) ?? (videoEl.value as HTMLElement)
    }
    if (!el) return
    const rfs =
      el.requestFullscreen ||
      (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen
    await rfs.call(el)
    small.value = false
  } catch {
    small.value = true
  }
}

async function exitFull() {
  try {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>
    }
    const cfs = doc.exitFullscreen || doc.webkitExitFullscreen
    await cfs?.call(doc)
    small.value = true
  } catch {
    small.value = false
  }
}

function fullscreenchange() {
  small.value = !(
    document.fullscreenElement ||
    (document as Document & { webkitIsFullScreen?: boolean }).webkitIsFullScreen
  )
}

function setVol(n: number) {
  const el = videoEl.value
  if (!el) return
  vol.value = n
  el.volume = Math.min(1, n / 60)
  muted.value = !n
  el.muted = muted.value
}

function volFromClientY(clientY: number) {
  const track = volTrackEl.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  if (rect.height <= 0) return
  const ratio = (rect.bottom - clientY) / rect.height
  setVol(Math.round(Math.min(1, Math.max(0, ratio)) * 60))
}

function volPosNum(e: MouseEvent) {
  volFromClientY(e.clientY)
}

function dotDown(e: MouseEvent) {
  volFromClientY(e.clientY)
  const onMove = (ev: MouseEvent) => volFromClientY(ev.clientY)
  document.addEventListener('mousemove', onMove)
  addEventListenerOnce(document, 'mouseup', () => {
    document.removeEventListener('mousemove', onMove)
  })
}

function idleLocked() {
  return props.audio || paused.value || !!openMenu.value || volHover.value
}

function syncIdleTimer() {
  if (idleLocked()) delay.value?.hold()
  else delay.value?.ping()
}

function onPlayerEnter() {
  syncIdleTimer()
  requestAnimationFrame(() => {
    playerRootEl.value?.focus({ preventScroll: true })
  })
}

function onPlayerMove() {
  if (idleLocked()) delay.value?.hold()
  else delay.value?.ping()
}

function onPlayerLeave() {
  volHover.value = false
  if (openMenu.value || paused.value || props.audio) return
  delay.value?.start()
}

function switchQuality(item: QualityOption, reload = false) {
  if (reload && currq.value.itag === item.itag) {
    openMenu.value = null
    return
  }
  currq.value = item
  firstItag.value = item.itag
  openMenu.value = null
  if (reload) {
    localStorage.setItem('itag', String(item.itag))
    pauseVideo()
    init()
  }
}

function playSpeed(rate?: number) {
  const r = rate ?? (Number(sessionStorage.getItem('playbackRate')) || 1)
  const el = videoEl.value
  if (!el) return
  el.playbackRate = r
  video.value.playbackRate = r
  sessionStorage.setItem('playbackRate', String(r))
}

function cyclePlay(c: number) {
  sessionStorage.setItem('cycle', String(c))
  video.value.cycle = c
}

function updateLoadBar(buffered: TimeRanges, duration: number) {
  if (!buffered || !duration) return
  const c = loadbarEl.value
  if (!c) return
  if (c.width !== c.clientWidth) c.width = c.clientWidth
  if (c.height !== c.clientHeight) c.height = c.clientHeight
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#ddd'
  const inc = c.width / duration
  for (let i = 0; i < buffered.length; i++) {
    const startX = buffered.start(i) * inc
    const endX = buffered.end(i) * inc
    ctx.fillRect(startX, 0, endX - startX, c.height)
  }
}

function doScreenShot() {
  if (!props.screenshot || safari) return
  const el = videoEl.value
  if (!el || !el.videoWidth || !el.videoHeight) return
  const canvas = document.createElement('canvas')
  canvas.width = el.videoWidth
  canvas.height = el.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(el, 0, 0)
  canvas.toBlob((b) => {
    if (b) download(b, `screenshot-${Date.now()}.png`)
  })
}

watch(
  () => props.playerInfo.id,
  (id) => {
    if (id) init()
  },
)

watch(full, (f) => {
  document.body.style.overflow = f ? 'hidden' : 'visible'
})

watch(openMenu, (m) => {
  if (m !== 'settings') settingsPage.value = 'root'
  syncIdleTimer()
})

watch(volHover, (hover) => {
  if (hover) openMenu.value = null
  syncIdleTimer()
})

watch([openMenu, settingsPage], () => {
  if (openMenu.value === 'settings') measureSettings()
})

onMounted(() => {
  delay.value = new Delayer(
    () => {
      if (idleLocked()) return false
      bottomHide.value = true
    },
    () => (bottomHide.value = false),
    2000,
  )
  document.addEventListener('fullscreenchange', fullscreenchange)
  document.addEventListener('webkitfullscreenchange', fullscreenchange as EventListener)
  document.addEventListener('pointerdown', onDocPointerDown)
  if (!modern) return
  init()
})

onBeforeUnmount(() => {
  taskQueue.clear()
  delay.value?.stop()
  document.removeEventListener('fullscreenchange', fullscreenchange)
  document.removeEventListener('webkitfullscreenchange', fullscreenchange as EventListener)
  document.removeEventListener('pointerdown', onDocPointerDown)
  destroy()
})
</script>

<template>
  <div
    ref="playerRoot"
    class="vplayer relative w-full overflow-hidden bg-zinc-900 outline-none select-none"
    :class="[
      full ? 'fixed inset-0 z-50' : '',
      audio ? 'min-h-[100px]' : 'aspect-video',
      !small ? 'h-full' : '',
      bottomHide ? 'cursor-none' : '',
    ]"
    tabindex="0"
    @mouseenter="onPlayerEnter"
    @mousemove="onPlayerMove"
    @mouseleave="onPlayerLeave"
    @keydown.space.stop.prevent="togglePlay"
    @keydown.left.stop.prevent="seek(-5)"
    @keydown.right.stop.prevent="seek(5)"
    @keydown.s.prevent="doScreenShot"
    @keydown.f.prevent="toggleFull"
    @keydown.escape.stop="onEsc"
  >
    <!-- 控制层 -->
    <div
      class="absolute inset-0 z-10"
      @click.stop.prevent="togglePlayOnClick"
      @dblclick.stop.prevent="toggleFull"
    >
      <!-- 缓冲中 -->
      <div v-if="video.seeking && !video.error" class="absolute inset-0 z-20 flex items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
      </div>

      <!-- 错误 -->
      <div v-if="video.error" class="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
        <div class="px-8 text-center text-sm text-white">
          <template v-if="unsupport">
            <p>{{ t('player.unsupported') }}</p>
          </template>
          <template v-else>
            <p class="break-all">{{ video.error instanceof Error ? video.error.stack || video.error.message : video.error }}</p>
            <p>{{ t('player.playError') }}</p>
            <button
              class="mt-3 rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
              @click.stop="video.error = null"
            >
              {{ t('common.close') }}
            </button>
          </template>
        </div>
      </div>

      <!-- 点击播放 -->
      <div
        v-if="clickplay && paused && !video.error"
        class="absolute inset-0 z-20 flex cursor-pointer items-center justify-center"
        @click.stop.prevent="playVideo"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-black/50">
          <Play class="h-8 w-8 fill-white text-white" />
        </div>
      </div>

      <!-- 音频模式海报 -->
      <div v-if="audio" class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${posterImg})` }"></div>

      <!-- 底部控制条 -->
      <div
        class="absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 transition-opacity duration-300"
        :class="{ 'pointer-events-none opacity-0': bottomHide }"
        @click.stop.prevent
        @dblclick.stop
      >
        <div v-if="audio" class="mb-1 truncate text-center text-xs text-white/90">{{ playerInfo.title }}</div>

        <!-- 进度条 -->
        <div class="group/progress relative py-1.5">
          <div
            ref="times"
            v-show="tiptime.show"
            class="absolute -top-6 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[11px] text-white"
            :style="tipStyle"
          >
            {{ tiptime.v }}
          </div>
          <div
            ref="progressLine"
            class="relative h-1 cursor-pointer rounded bg-white/25"
            @click.stop="seekTo"
            @mousemove="showCurrTime"
            @mouseenter="tiptime.show = true"
            @mouseleave="tiptime.show = false"
          >
            <canvas ref="loadbar" class="absolute inset-0 h-full w-full opacity-60"></canvas>
            <div class="absolute inset-y-0 left-0 rounded bg-brand-500" :style="playedStyle"></div>
            <div
              class="dot absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
              :style="dotStyle"
            ></div>
          </div>
        </div>

        <!-- 按钮区 -->
        <div class="flex h-8 items-center text-white">
          <button v-if="video.duration" type="button" :class="ctrlBtn" @click.stop.prevent="togglePlay">
            <Pause v-if="!paused" class="h-5 w-5" />
            <Play v-else class="h-5 w-5" />
          </button>
          <div v-else class="flex h-8 w-8 items-center justify-center">
            <div class="h-5 w-5 animate-pulse rounded-full bg-white/40"></div>
          </div>

          <div class="ml-1 text-xs tabular-nums leading-none">
            <span>{{ timeDuration(video.currentTime) }}</span>
            <span class="mx-1 text-white/50">/</span>
            <span>{{ timeDuration(video.duration) }}</span>
          </div>

          <div class="flex-1"></div>

          <div class="flex items-center gap-0.5">
            <!-- 音量 -->
            <div
              class="relative"
              @mouseenter="volHover = true"
              @mouseleave="volHover = false"
            >
              <button
                type="button"
                :class="ctrlBtn"
                :title="muted ? t('player.unmute') : t('player.mute')"
                :aria-label="muted ? t('player.unmute') : t('player.mute')"
                @click.stop="muted ? muteoff() : muteon()"
              >
                <VolumeX v-if="muted" class="h-5 w-5" />
                <Volume2 v-else class="h-5 w-5" />
              </button>
              <PlayerMenu :open="volHover" align="center">
                <div
                  class="flex h-[104px] w-10 cursor-pointer items-center justify-center"
                  @click.stop.prevent="volPosNum"
                  @mousedown.stop.prevent="dotDown"
                >
                  <div ref="volTrack" class="relative h-[72px] w-1 rounded-full bg-white/20">
                    <div
                      class="absolute bottom-0 left-0 w-full rounded-full bg-white"
                      :style="{ height: (volFill / 60) * 100 + '%' }"
                    >
                      <div
                        class="absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                      ></div>
                    </div>
                  </div>
                </div>
              </PlayerMenu>
            </div>

            <!-- 截图 -->
            <button
              v-if="!audio && screenshot && !safari"
              type="button"
              :class="ctrlBtn"
              :title="t('player.screenshot')"
              @click.stop="closeMenus(); doScreenShot()"
            >
              <Camera class="h-5 w-5" />
            </button>

            <!-- 音频列表 -->
            <button
              v-if="audio"
              type="button"
              :class="ctrlBtn"
              :title="t('player.playlist')"
              @click.stop="$emit('list')"
            >
              <ListMusic class="h-5 w-5" />
            </button>

            <!-- 清晰度 -->
            <div v-if="!audio" class="relative">
              <button
                type="button"
                class="inline-flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md px-2 text-[13px] font-medium tracking-wide text-white/90 tabular-nums transition-colors hover:bg-white/15 hover:text-white"
                :class="{ 'bg-white/15 text-white': openMenu === 'quality' }"
                :title="t('player.quality')"
                :aria-expanded="openMenu === 'quality'"
                @click.stop="toggleMenu('quality')"
              >
                {{ currq.quality || t('player.quality') }}
              </button>
              <PlayerMenu :open="openMenu === 'quality'">
                <ul class="max-h-60 min-w-[8.5rem] overflow-y-auto py-1">
                  <li v-if="!qlist.length" class="px-3.5 py-2.5 text-white/40">{{ t('player.quality') }}</li>
                  <li
                    v-for="item in qlist"
                    :key="item.itag"
                    class="flex h-9 cursor-pointer items-center justify-between gap-6 px-3.5 text-[13px] transition-colors hover:bg-white/10"
                    :class="currq.itag === item.itag ? 'text-white' : 'text-white/80'"
                    @click.stop="switchQuality(item, true)"
                  >
                    <span>{{ item.quality }}</span>
                    <Check v-if="currq.itag === item.itag" class="h-4 w-4 text-brand-400" />
                    <span v-else class="inline-block h-4 w-4"></span>
                  </li>
                </ul>
              </PlayerMenu>
            </div>

            <!-- 设置：倍速 / 循环 -->
            <div v-if="!audio" class="relative">
              <button
                type="button"
                :class="[ctrlBtn, openMenu === 'settings' ? 'bg-white/15 text-white' : '']"
                :title="t('player.settings')"
                :aria-expanded="openMenu === 'settings'"
                @click.stop="toggleMenu('settings')"
              >
                <Settings class="h-5 w-5" />
              </button>
              <PlayerMenu :open="openMenu === 'settings'">
                <div
                  class="relative overflow-hidden transition-[height] duration-200 ease-out"
                  :style="{ height: settingsHeight + 'px', width: '15.5rem' }"
                >
                  <div
                    class="flex items-start transition-transform duration-200 ease-out"
                    :style="{ transform: settingsPage === 'speed' ? 'translateX(-15.5rem)' : 'translateX(0)' }"
                  >
                    <div ref="settingsRoot" class="w-[15.5rem] shrink-0 py-1">
                      <button type="button" :class="menuRow" @click.stop="settingsPage = 'speed'">
                        <span class="flex-1">{{ t('player.speed') }}</span>
                        <span class="text-white/50">{{ speedLabel }}</span>
                        <ChevronRight class="h-4 w-4 text-white/40" />
                      </button>
                      <button
                        type="button"
                        :class="menuRow"
                        @click.stop="cyclePlay(video.cycle === 1 ? 0 : 1)"
                      >
                        <span class="flex-1">{{ t('player.loop') }}</span>
                        <span
                          class="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                          :class="video.cycle === 1 ? 'bg-brand-500' : 'bg-white/25'"
                        >
                          <span
                            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                            :class="video.cycle === 1 ? 'translate-x-4' : ''"
                          ></span>
                        </span>
                      </button>
                    </div>
                    <div ref="settingsSpeed" class="w-[15.5rem] shrink-0 py-1">
                      <button type="button" :class="menuRow" @click.stop="settingsPage = 'root'">
                        <ChevronLeft class="h-4 w-4 text-white/70" />
                        <span class="flex-1">{{ t('player.speed') }}</span>
                      </button>
                      <div class="mx-3 my-1 h-px bg-white/10"></div>
                      <button
                        v-for="s in speeds"
                        :key="s"
                        type="button"
                        class="flex h-9 w-full cursor-pointer items-center justify-between px-3.5 text-left text-[13px] transition-colors hover:bg-white/10"
                        :class="s === video.playbackRate ? 'text-white' : 'text-white/80'"
                        @click.stop="playSpeed(s)"
                      >
                        <span>{{ s === 1 ? t('player.speedNormal') : s + 'x' }}</span>
                        <Check v-if="s === video.playbackRate" class="h-4 w-4 text-brand-400" />
                        <span v-else class="inline-block h-4 w-4"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </PlayerMenu>
            </div>

            <!-- 全屏 -->
            <button
              v-if="!audio"
              type="button"
              :class="ctrlBtn"
              :title="small ? t('player.fullscreen') : t('player.exitFullscreen')"
              @click.stop="closeMenus(); small ? toFull() : exitFull()"
            >
              <Maximize v-if="small" class="h-5 w-5" />
              <Minimize v-else class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频元素 -->
    <video
      v-if="v"
      ref="video"
      class="pointer-events-none absolute inset-0 z-0 h-full w-full"
      :poster="posterImg"
      :autoplay="autoplay"
      playsinline
      webkit-playsinline
      preload="meta"
      x-webkit-airplay="allow"
    ></video>
  </div>
</template>
