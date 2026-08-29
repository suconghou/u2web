import { i18n } from '@/locales'

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params ?? {})

/** 发布时间: 如 "3年前" / "3y ago" / "3년 전" / "3年前" */
export const timeBefore = (time?: string): string => {
  if (!time) return ''
  const ts = new Date(time).getTime()
  const dur = (Date.now() - ts) / 1000
  const f: [number, string][] = [
    [31536000, 'utils.year'],
    [2592000, 'utils.month'],
    [604800, 'utils.week'],
    [86400, 'utils.day'],
    [3600, 'utils.hour'],
    [60, 'utils.minute'],
    [1, 'utils.second'],
  ]
  for (const [sec, key] of f) {
    const c = Math.floor(dur / sec)
    if (c > 0) {
      return t('utils.ago', { n: c, unit: t(key) })
    }
  }
  return t('utils.justNow')
}

/** ISO8601 时长(P0D/PT1H2M3S) → 01:02:03;P0D 表示直播 */
export const formatDuration = (t?: string): string => {
  if (!t) return ''
  if (t === 'P0D') return i18n.global.t('utils.live')
  const m: Record<string, string> = { H: ':00:00', M: ':00', S: '' }
  const l = m[t.slice(-1)] ?? ''
  const arr = t.match(/[0-9]\d{0,3}/g)?.map((v) => (v.length === 1 ? '0' + v : v)) ?? []
  return arr.join(':') + l
}

/** 观看次数: 中文/韩/日 用万位("1.2万次观看"),英文用 K/M("12K views") */
export const formatCount = (c?: string): string => {
  const n = Number(c ?? 0)
  if (!Number.isFinite(n) || n < 0) return ''
  if (i18n.global.locale.value === 'en') {
    if (n < 1e3) return String(n)
    if (n < 1e6) return `${Math.floor(n / 1e3)}K`
    return `${Math.floor(n / 1e6)}M`
  }
  if (n < 1e4) return t('utils.views', { n })
  if (n < 1e5) return t('utils.viewsWan', { n: (n / 1e4).toFixed(1) })
  return t('utils.viewsWan', { n: Math.round(n / 1e4) })
}

const z = (t: number): string => (t > 0 ? (t < 10 ? `0${t}` : `${t}`) : '00')

/** 秒数 → 1:02:03 / 02:03 */
export const timeDuration = (t: number): string => {
  t = Math.round(t)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t - h * 3600) / 60)
  const s = t - h * 3600 - m * 60
  return `${h ? h + ':' : ''}${z(m)}:${z(s)}`
}

export const byteFormat = (size: number): string => {
  if (!size || size <= 0) return '0 B'
  const name = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let pos = 0
  let n = size
  while (n >= 1024) {
    n /= 1024
    pos++
  }
  return `${n.toFixed(2)} ${name[pos]}`
}

export const debounce = <A extends unknown[]>(func: (...args: A) => void, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    clearTimeout(timer)
    timer = setTimeout(() => func(...args), delay)
  }
}

export const addEventListenerOnce = <K extends keyof DocumentEventMap>(
  element: Document,
  event: K,
  fn: (e: DocumentEventMap[K]) => void,
): void => {
  const func = (e: DocumentEventMap[K]) => {
    element.removeEventListener(event, func)
    fn(e)
  }
  element.addEventListener(event, func)
}

/** 串行任务队列(播放器 loadbar 刷新用,避免并发堆积) */
export class asyncQueue {
  private runing = false
  constructor(private tasks: Array<() => Promise<void>>) {
    this.run()
  }
  push(task: () => Promise<void>) {
    this.tasks.push(task)
    this.run()
  }
  clear() {
    this.tasks = []
  }
  private async run() {
    if (this.runing) return
    this.runing = true
    let item: (() => Promise<void>) | undefined
    while ((item = this.tasks.shift())) {
      try {
        await item()
      } catch {
        // 忽略单个任务错误
      }
    }
    this.runing = false
  }
}
