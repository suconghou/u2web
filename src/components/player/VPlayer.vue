<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FastloadPlayer, Fastloader, LoadItem, PlayerInfo } from '@/types'
import { buildLoadItems, buildQualityList, isModern, useWebm } from './streams'
import type { QualityOption } from './streams'
import { ICE_SERVERS, imgSrc, signalURL } from '@/service'
import { timeDuration, debounce, addEventListenerOnce } from '@/utils'
import { download } from '@/utils/download'
import Delayer from '@/utils/delayer'
import { ListMusic, MonitorPlay, Repeat, ChevronLeft, ChevronRight } from '@lucide/vue'
import {
  PlayerPlay,
  PlayerPause,
  PlayerVolume,
  PlayerMute,
  PlayerScreenshot,
  PlayerFullscreen,
  PlayerExitFullscreen,
  PlayerPip,
  PlayerWebFullscreen,
  PlayerExitWebFullscreen,
  PlayerSettings,
  PlayerSpeed,
  PlayerCheck,
} from './icons'
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
const playerRootEl = useTemplateRef<HTMLElement>('playerRoot')
const volRef = useTemplateRef<HTMLElement>('volRef')
const volTrackEl = useTemplateRef<HTMLElement>('volTrack')
const settingsRootEl = useTemplateRef<HTMLElement>('settingsRoot')
const settingsSpeedEl = useTemplateRef<HTMLElement>('settingsSpeed')
const settingsQualityEl = useTemplateRef<HTMLElement>('settingsQuality')

type MenuName = 'settings'
const openMenu = ref<MenuName | null>(null)
const settingsPage = ref<'root' | 'speed' | 'quality'>('root')
const settingsHeight = ref(88)

const ctrlBtn =
  'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/90 transition-all hover:bg-white/10 hover:text-white active:scale-90'
const menuRow =
  'flex h-10 w-full cursor-pointer items-center gap-3 px-3.5 text-left text-[13px] text-white/90 transition-colors hover:bg-white/10'

const v = ref(false)
const loader = ref<FastloadPlayer | null>(null)
const delay = ref<Delayer | null>(null)

const paused = ref(true)
const muted = ref(false)
const small = ref(true)
const webFull = ref(false)
const pip = ref(false)
const bottomHide = ref(false)
const clickplay = ref(false)
const vol = ref(60)
const tiptime = ref({ v: '', show: false, left: '' })
const currq = ref<QualityOption>({ quality: '', itag: 0 })
const firstItag = ref<number | null>(
  props.firstItag != null ? Number(props.firstItag) : localStorage.getItem('itag') ? Number(localStorage.getItem('itag')) : null,
)

/** 进度条拖拽 scrub 状态 */
const scrubbing = ref(false)
const scrubRatio = ref(0)
/** 缓冲区间(ratio 0-1),由 video.buffered 驱动 */
const bufferedRanges = ref<Array<{ start: number; end: number }>>([])
let lastSeekAt = 0
let clickTimer: ReturnType<typeof setTimeout> | undefined
let initGen = 0

/** 音量弹层:hover/drag 保持打开,延迟关闭 */
const volOpen = ref(false)
const volDrag = ref(false)
let volCloseTimer: ReturnType<typeof setTimeout> | undefined

const video = ref({
  duration: 0,
  currentTime: 0,
  played: 0,
  seeking: true,
  error: null as unknown,
  playbackRate: Number(sessionStorage.getItem('playbackRate')) || 1,
  cycle: Number(sessionStorage.getItem('cycle')) || 0,
})

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

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

const pipSupported = computed(() => !!document.pictureInPictureEnabled)

const playedStyle = computed(() => {
  const p = scrubbing.value ? scrubRatio.value : video.value.played
  return { width: `${p * 100}%` }
})
const thumbStyle = computed(() => {
  const p = scrubbing.value ? scrubRatio.value : video.value.played
  return { left: `${p * 100}%` }
})
const tipStyle = computed(() => ({ left: tiptime.value.left }))
const speedLabel = computed(() => rateLabel(video.value.playbackRate))
const volFill = computed(() => (muted.value ? 0 : vol.value))

const loadItems = computed<LoadItem[]>(() =>
  buildLoadItems(props.playerInfo, props.audio, firstItag.value, qlist.value, webm),
)

const tickEnd = debounce(() => {
  const el = videoEl.value
  if (!el) return
  if (el.duration - el.currentTime < 1) onPlayEnd()
}, 900)

/** 复位播放状态;不支持 MSE 的浏览器直接置为错误态 */
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
}

/**
 * (重)建播放:销毁旧引擎实例、重建 video 元素,再按当前选流结果挂载新的引擎实例。
 * gen 序号用于作废被连续切换打断的旧流程
 */
function init() {
  const gen = ++initGen
  emit('init')
  videoEl.value?.pause()
  loader.value?.destroy()
  loader.value = null
  v.value = false
  nextTick(() => {
    if (gen !== initGen) return
    v.value = true
    nextTick(() => {
      if (gen !== initGen) return
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
      // 引擎以 tracker 是否为空判断是否启用 P2P,故 nop2p 直接传空串
      const tracker = props.nop2p ? '' : signalURL()
      loader.value = new fastload({
        thread: 2,
        tracker,
        // 仅在启用 P2P 时需要
        rtcConf: tracker ? { iceServers: ICE_SERVERS } : undefined,
      })
      loader.value.listen('ready', (loaders, dispatchs) => {
        emit('loadersready', loaders as Fastloader[], dispatchs as unknown[])
      })
      loader.value.listen('error', (err) => {
        video.value.error = err
        loader.value?.pause()
      })
      // attach 为异步:内部 sourceOpen 失败会走 error 事件,此处兜住其余拒绝路径
      void loader.value
        .attach(el, items)
        .catch((err) => (video.value.error = err))
      if (!props.audio) {
        const first = items[0]
        switchQuality({ itag: first.itag, quality: first.quality })
      }
      reset()
      emit('load', items)
    })
  })
}

/** 把 video.buffered 转为进度条上的缓冲区间(ratio) */
function updateBuffered() {
  const el = videoEl.value
  if (!el || !el.duration || !isFinite(el.duration)) {
    bufferedRanges.value = []
    return
  }
  const ranges: Array<{ start: number; end: number }> = []
  for (let i = 0; i < el.buffered.length && ranges.length < 20; i++) {
    const s = Math.max(0, el.buffered.start(i))
    const e = Math.min(el.duration, el.buffered.end(i))
    if (e > s) ranges.push({ start: s / el.duration, end: e / el.duration })
  }
  bufferedRanges.value = ranges
}

function bindVideoEvents(el: HTMLVideoElement) {
  el.addEventListener('waiting', () => (video.value.seeking = true))
  el.addEventListener('playing', () => {
    video.value.seeking = false
    syncIdleTimer()
  })
  el.addEventListener('seeking', () => (video.value.seeking = true))
  el.addEventListener('seeked', () => {
    video.value.seeking = false
    updateBuffered()
  })
  el.addEventListener('pause', () => {
    paused.value = true
    syncIdleTimer()
  })
  el.addEventListener('play', () => {
    paused.value = false
    syncIdleTimer()
  })
  el.addEventListener('durationchange', () => {
    video.value.duration = el.duration
    updateBuffered()
  })
  el.addEventListener('progress', updateBuffered)
  el.addEventListener('timeupdate', () => {
    requestAnimationFrame(() => {
      if (!scrubbing.value) {
        video.value.played = el.duration ? el.currentTime / el.duration : 0
        video.value.currentTime = el.currentTime
      }
      updateBuffered()
    })
    tickEnd()
  })
  el.addEventListener('ended', () => onPlayEnd())
  el.addEventListener('enterpictureinpicture', () => (pip.value = true))
  el.addEventListener('leavepictureinpicture', () => (pip.value = false))
  el.addEventListener('loadedmetadata', () => {
    video.value.seeking = false
    el.volume = Math.min(1, vol.value / 60)
    el.muted = muted.value
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
  const dur = el?.duration
  if (!el || !dur || !isFinite(dur)) return
  const s = Math.min(dur, Math.max(0, el.currentTime + n))
  video.value.currentTime = s
  el.currentTime = s
  loader.value?.seekTo(s)
  syncIdleTimer()
}

function ratioFromEvent(e: PointerEvent | MouseEvent): number {
  const rect = progressLineEl.value?.getBoundingClientRect()
  if (!rect || rect.width <= 0) return 0
  return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
}

/** 更新悬停/拖拽时的时间预览气泡 */
function updateTip(e: PointerEvent | MouseEvent) {
  const rect = progressLineEl.value?.getBoundingClientRect()
  if (!rect) return
  const time = getTime(ratioFromEvent(e))
  if (!isFinite(time)) return
  const sw = timesEl.value?.clientWidth ?? 0
  let left = e.clientX - rect.left - sw / 2
  if (left < 0) left = 0
  if (left > rect.width - sw) left = rect.width - sw
  tiptime.value.v = timeDuration(time)
  tiptime.value.left = `${left}px`
}

function onProgressMove(e: PointerEvent) {
  if (scrubbing.value) return
  updateTip(e)
}

function seekCommit(ratio: number) {
  const el = videoEl.value
  const time = getTime(ratio)
  if (!el || !isFinite(time)) return
  video.value.currentTime = time
  el.currentTime = time
  loader.value?.seekTo(time)
}

/** 按住进度条拖拽 scrub:视觉实时跟随,实际 seek 节流提交,松手落定 */
function onProgressDown(e: PointerEvent) {
  const el = videoEl.value
  if (!el || !el.duration || !isFinite(el.duration)) return
  e.preventDefault()
  const ratio = ratioFromEvent(e)
  scrubbing.value = true
  scrubRatio.value = ratio
  tiptime.value.show = true
  updateTip(e)
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {
    // 指针已失效时忽略,仍走 window 监听
  }
  seekCommit(ratio)
  lastSeekAt = Date.now()
  const onMove = (ev: PointerEvent) => {
    const r = ratioFromEvent(ev)
    scrubRatio.value = r
    updateTip(ev)
    if (Date.now() - lastSeekAt > 200) {
      seekCommit(r)
      lastSeekAt = Date.now()
    }
  }
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    seekCommit(ratioFromEvent(ev))
    scrubbing.value = false
    // 松手点已不在轨道上时收起时间预览
    const rect = progressLineEl.value?.getBoundingClientRect()
    if (!rect || ev.clientX < rect.left || ev.clientX > rect.right) tiptime.value.show = false
    syncIdleTimer()
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

/** 单击延迟执行,与双击全屏区分,避免双击时播放状态闪烁 */
function togglePlayOnClick() {
  if (openMenu.value) {
    openMenu.value = null
    return
  }
  const el = videoEl.value
  if (!el || el.readyState <= 1) return
  if (props.audio) return
  clearTimeout(clickTimer)
  clickTimer = setTimeout(togglePlay, 220)
}

function onStageDblClick() {
  clearTimeout(clickTimer)
  toggleFullscreen()
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
    return
  }
  if (webFull.value) webFull.value = false
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as Node
  if (openMenu.value && !playerRootEl.value?.contains(target)) openMenu.value = null
  if (volOpen.value && !volRef.value?.contains(target)) volOpen.value = false
}

/** 设置面板滑动偏移:根/倍速/清晰度 三页 */
const settingsShift = computed(() => ({ root: 0, speed: 1, quality: 2 })[settingsPage.value] * -15.5)

async function measureSettings() {
  await nextTick()
  await nextTick()
  const el =
    settingsPage.value === 'root'
      ? settingsRootEl.value
      : settingsPage.value === 'speed'
        ? settingsSpeedEl.value
        : settingsQualityEl.value
  if (el?.offsetHeight) settingsHeight.value = el.offsetHeight
}

function togglePlay() {
  const el = videoEl.value
  if (!el) return
  if (el.paused) playVideo()
  else pauseVideo()
}

/** 倍速显示:统一 toFixed(1),不带 x 后缀 */
const rateLabel = (r: number): string => r.toFixed(1)

/** 元素全屏(双击/F 键/全屏按钮) */
function toggleFullscreen() {
  if (props.audio) return
  if (small.value) void toFull()
  else void exitFull()
}

/** 网页全屏:铺满页面视口(覆盖站点框架) */
function toggleWebFull() {
  if (props.audio) return
  webFull.value = !webFull.value
  closeMenus()
}

/** 画中画 */
async function togglePip() {
  const el = videoEl.value
  if (!el || !document.pictureInPictureEnabled) return
  try {
    if (document.pictureInPictureElement === el) await document.exitPictureInPicture()
    else await el.requestPictureInPicture()
  } catch {
    // 视频未就绪或不支持时忽略
  }
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
    // 移动端浏览器对容器全屏支持差,直接对 video 元素请求全屏
    let el: HTMLElement | null = videoEl.value
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || /MiuiBrowser/i.test(navigator.userAgent)) {
      el = videoEl.value?.closest('.vplayer') as HTMLElement | null
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

function volEnter() {
  clearTimeout(volCloseTimer)
  volOpen.value = true
}

function volLeave() {
  clearTimeout(volCloseTimer)
  volCloseTimer = setTimeout(() => {
    if (!volDrag.value) volOpen.value = false
  }, 220)
}

function dotDown(e: MouseEvent) {
  volFromClientY(e.clientY)
  volDrag.value = true
  const onMove = (ev: MouseEvent) => volFromClientY(ev.clientY)
  document.addEventListener('mousemove', onMove)
  addEventListenerOnce(document, 'mouseup', () => {
    document.removeEventListener('mousemove', onMove)
    volDrag.value = false
    volLeave()
  })
}

function idleLocked() {
  return props.audio || paused.value || !!openMenu.value || volOpen.value
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
  if (openMenu.value || volOpen.value || paused.value || props.audio) return
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

watch(webFull, (f) => {
  document.body.style.overflow = f ? 'hidden' : ''
})

watch(openMenu, (m) => {
  if (m !== 'settings') settingsPage.value = 'root'
  syncIdleTimer()
})

watch(volOpen, (open) => {
  if (open) openMenu.value = null
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
  initGen++
  clearTimeout(clickTimer)
  clearTimeout(volCloseTimer)
  delay.value?.stop()
  document.body.style.overflow = ''
  document.removeEventListener('fullscreenchange', fullscreenchange)
  document.removeEventListener('webkitfullscreenchange', fullscreenchange as EventListener)
  document.removeEventListener('pointerdown', onDocPointerDown)
  destroy()
})
</script>

<template>
  <div
    ref="playerRoot"
    class="vplayer w-full overflow-hidden bg-zinc-900 outline-none select-none"
    :class="[
      webFull ? 'fixed inset-0 z-[9500]' : 'relative',
      audio ? 'min-h-[100px]' : 'aspect-video',
      !small || webFull ? 'h-full' : '',
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
    @keydown.f.prevent="toggleFullscreen"
    @keydown.escape.stop="onEsc"
  >
    <!-- 控制层 -->
    <div
      class="absolute inset-0 z-10"
      @click.stop.prevent="togglePlayOnClick"
      @dblclick.stop.prevent="onStageDblClick"
    >
      <!-- 缓冲中 -->
      <div v-if="video.seeking && !video.error" class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
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

      <!-- 点击播放:仅圆形按钮可点,不遮挡底部栏交互 -->
      <div
        v-if="clickplay && paused && !video.error"
        class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      >
        <button
          type="button"
          class="pointer-events-auto flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-brand-500/60"
          :aria-label="t('player.play')"
          @click.stop.prevent="playVideo"
        >
          <PlayerPlay :size="32" class="text-white" />
        </button>
      </div>

      <!-- 音频模式海报 -->
      <div v-if="audio" class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${posterImg})` }"></div>

      <!-- 底部控制条 -->
      <div
        class="absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-6 pb-1.5 transition-opacity duration-300"
        :class="{ 'pointer-events-none opacity-0': bottomHide }"
        @click.stop.prevent
        @dblclick.stop
      >
        <div v-if="audio" class="mb-1 truncate text-center text-xs text-white/90">{{ playerInfo.title }}</div>

        <!-- 进度条:按住可拖拽 scrub,hover 显示时间预览 -->
        <div class="group/prog relative py-1">
          <div
            ref="times"
            v-show="tiptime.show"
            class="pointer-events-none absolute -top-6 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[11px] text-white"
            :style="tipStyle"
          >
            {{ tiptime.v }}
          </div>
          <div
            ref="progressLine"
            class="relative flex h-3.5 cursor-pointer touch-none items-center"
            @pointerdown.stop.prevent="onProgressDown"
            @pointermove="onProgressMove"
            @mouseenter="tiptime.show = true"
            @mouseleave="tiptime.show = scrubbing ? tiptime.show : false"
          >
            <div
              class="relative h-1 w-full rounded-full bg-white/20 transition-[height] duration-150 group-hover/prog:h-1.5"
              :class="scrubbing ? 'h-1.5' : ''"
            >
              <i
                v-for="(r, i) in bufferedRanges"
                :key="i"
                class="absolute inset-y-0 rounded-full bg-white/50"
                :style="{ left: r.start * 100 + '%', width: (r.end - r.start) * 100 + '%' }"
              ></i>
              <div class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-500" :style="playedStyle"></div>
              <div
                class="dot absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-150"
                :class="scrubbing ? 'scale-100' : 'scale-0 group-hover/prog:scale-100'"
                :style="thumbStyle"
              ></div>
            </div>
          </div>
        </div>

        <!-- 按钮区:左(播放/音量/时间) 右(截图/列表/清晰度/设置/全屏) -->
        <div class="flex h-9 items-center text-white">
          <button v-if="video.duration" type="button" :class="ctrlBtn" @click.stop.prevent="togglePlay">
            <PlayerPause v-if="!paused" :size="22" />
            <PlayerPlay v-else :size="22" />
          </button>
          <div v-else class="flex h-9 w-9 items-center justify-center">
            <div class="h-5 w-5 animate-pulse rounded-full bg-white/40"></div>
          </div>

          <!-- 音量 -->
          <div ref="volRef" class="relative" @mouseenter="volEnter" @mouseleave="volLeave">
            <button
              type="button"
              :class="ctrlBtn"
              :title="muted ? t('player.unmute') : t('player.mute')"
              :aria-label="muted ? t('player.unmute') : t('player.mute')"
              :aria-expanded="volOpen"
              @click.stop="muted ? muteoff() : muteon()"
            >
              <PlayerMute v-if="muted" :size="22" />
              <PlayerVolume v-else :size="22" />
            </button>
            <PlayerMenu :open="volOpen" align="center">
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

          <div class="ml-1 text-xs tabular-nums leading-none text-white/80">
            <span>{{ timeDuration(video.currentTime) }}</span>
            <span class="mx-1 text-white/40">/</span>
            <span>{{ timeDuration(video.duration) }}</span>
          </div>

          <div class="flex-1"></div>

          <!-- 截图 -->
          <button
            v-if="!audio && screenshot && !safari"
            type="button"
            :class="ctrlBtn"
            :data-tip="t('player.screenshot')"
            :aria-label="t('player.screenshot')"
            @click.stop="closeMenus(); doScreenShot()"
          >
            <PlayerScreenshot :size="22" />
          </button>

          <!-- 音频列表 -->
          <button
            v-if="audio"
            type="button"
            :class="ctrlBtn"
            :data-tip="t('player.playlist')"
            :aria-label="t('player.playlist')"
            @click.stop="$emit('list')"
          >
            <ListMusic class="h-5 w-5" />
          </button>

          <!-- 设置：清晰度 / 倍速 / 循环 -->
          <div v-if="!audio" class="relative">
            <button
              type="button"
              :class="[ctrlBtn, openMenu === 'settings' ? 'bg-white/10 text-white' : '']"
              :title="t('player.settings')"
              :aria-expanded="openMenu === 'settings'"
              @click.stop="toggleMenu('settings')"
            >
              <PlayerSettings :size="22" />
            </button>
              <PlayerMenu :open="openMenu === 'settings'">
                <div
                  class="relative overflow-hidden transition-[height] duration-200 ease-out"
                  :style="{ height: settingsHeight + 'px', width: '15.5rem' }"
                >
                  <div
                    class="flex items-start transition-transform duration-200 ease-out"
                    :style="{ transform: `translateX(${settingsShift}rem)` }"
                  >
                    <div ref="settingsRoot" class="w-[15.5rem] shrink-0 py-1">
                      <button type="button" :class="menuRow" @click.stop="settingsPage = 'quality'">
                        <MonitorPlay class="h-[18px] w-[18px] shrink-0 text-white/70" />
                        <span class="flex-1">{{ t('player.quality') }}</span>
                        <span class="text-white/50">{{ currq.quality || t('player.quality') }}</span>
                        <ChevronRight class="h-4 w-4 text-white/40" />
                      </button>
                      <button type="button" :class="menuRow" @click.stop="settingsPage = 'speed'">
                        <PlayerSpeed :size="18" class="shrink-0 text-white/70" />
                        <span class="flex-1">{{ t('player.speed') }}</span>
                        <span class="text-white/50">{{ speedLabel }}</span>
                        <ChevronRight class="h-4 w-4 text-white/40" />
                      </button>
                      <button
                        type="button"
                        :class="menuRow"
                        @click.stop="cyclePlay(video.cycle === 1 ? 0 : 1)"
                      >
                        <Repeat class="h-[18px] w-[18px] shrink-0 text-white/70" />
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
                        <span>{{ rateLabel(s) }}</span>
                        <PlayerCheck v-if="s === video.playbackRate" :size="16" class="text-brand-400" />
                        <span v-else class="inline-block h-4 w-4"></span>
                      </button>
                    </div>
                    <div ref="settingsQuality" class="w-[15.5rem] shrink-0 py-1">
                      <button type="button" :class="menuRow" @click.stop="settingsPage = 'root'">
                        <ChevronLeft class="h-4 w-4 text-white/70" />
                        <span class="flex-1">{{ t('player.quality') }}</span>
                      </button>
                      <div class="mx-3 my-1 h-px bg-white/10"></div>
                      <button
                        v-for="item in qlist"
                        :key="item.itag"
                        type="button"
                        class="flex h-9 w-full cursor-pointer items-center justify-between px-3.5 text-left text-[13px] transition-colors hover:bg-white/10"
                        :class="currq.itag === item.itag ? 'text-white' : 'text-white/80'"
                        @click.stop="switchQuality(item, true)"
                      >
                        <span>{{ item.quality }}</span>
                        <PlayerCheck v-if="currq.itag === item.itag" :size="16" class="text-brand-400" />
                        <span v-else class="inline-block h-4 w-4"></span>
                      </button>
                      <div v-if="!qlist.length" class="px-3.5 py-2.5 text-[13px] text-white/40">
                        {{ t('player.quality') }}
                      </div>
                    </div>
                  </div>
                </div>
              </PlayerMenu>
          </div>

            <!-- 画中画 -->
            <button
              v-if="!audio && pipSupported"
              type="button"
              :class="[ctrlBtn, pip ? 'bg-white/10 text-white' : '']"
              :data-tip="t('player.pip')"
              :aria-label="t('player.pip')"
              :aria-pressed="pip"
              @click.stop="closeMenus(); togglePip()"
            >
              <PlayerPip :size="22" />
            </button>

            <!-- 网页全屏 -->
            <button
              v-if="!audio"
              type="button"
              :class="[ctrlBtn, webFull ? 'bg-white/10 text-white' : '']"
              :data-tip="webFull ? t('player.exitWebFullscreen') : t('player.webFullscreen')"
              :aria-label="webFull ? t('player.exitWebFullscreen') : t('player.webFullscreen')"
              :aria-pressed="webFull"
              @click.stop="toggleWebFull"
            >
              <PlayerExitWebFullscreen v-if="webFull" :size="22" />
              <PlayerWebFullscreen v-else :size="22" />
            </button>

            <!-- 全屏 -->
            <button
              v-if="!audio"
              type="button"
              :class="[ctrlBtn, 'tip-right']"
              :data-tip="small ? t('player.fullscreen') : t('player.exitFullscreen')"
              :aria-label="small ? t('player.fullscreen') : t('player.exitFullscreen')"
              @click.stop="closeMenus(); toggleFullscreen()"
            >
              <PlayerFullscreen v-if="small" :size="22" />
              <PlayerExitFullscreen v-else :size="22" />
            </button>
        </div>
      </div>
    </div>

    <!-- 视频元素 -->
    <video
      v-if="v"
      ref="video"
      class="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain"
      :poster="posterImg"
      :autoplay="autoplay"
      playsinline
      webkit-playsinline
      preload="meta"
      x-webkit-airplay="allow"
    ></video>
  </div>
</template>

<style scoped>
/* 底部栏按钮 tooltip(延迟出现,纯 CSS) */
[data-tip] {
  position: relative;
}
[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(2px);
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(10, 10, 12, 0.92);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  z-index: 20;
  transition:
    opacity 0.12s ease 0.25s,
    transform 0.12s ease 0.25s;
}
[data-tip]:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
/* 靠右的按钮 tooltip 右对齐,避免被播放器边缘裁剪 */
[data-tip].tip-right::after {
  left: auto;
  right: 0;
  transform: translateY(2px);
}
[data-tip].tip-right:hover::after {
  transform: translateY(0);
}
</style>
