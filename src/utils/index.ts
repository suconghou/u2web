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

/** ISO8601 时长(PT1H2M3S) → 01:02:03;P0D 表示直播 */
export const formatDuration = (iso?: string): string => {
  if (!iso) return ''
  if (iso === 'P0D') return i18n.global.t('utils.live')
  const days = Number(iso.match(/P(\d+)D/)?.[1] ?? 0)
  const time = iso.split('T')[1] ?? ''
  if (!time && !days) return ''
  const h = Number(time.match(/(\d+)H/)?.[1] ?? 0) + days * 24
  const m = Number(time.match(/(\d+)M/)?.[1] ?? 0)
  const s = Number(time.match(/(\d+)S/)?.[1] ?? 0)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return h ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
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
  while (n >= 1024 && pos < name.length - 1) {
    n /= 1024
    pos++
  }
  // 字节不显示小数
  return pos === 0 ? `${n} ${name[pos]}` : `${n.toFixed(2)} ${name[pos]}`
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
