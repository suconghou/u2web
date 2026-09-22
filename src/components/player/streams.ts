import type { LoadItem, PlayerInfo, StreamItem } from '@/types'
import { videoBaseURLs } from '@/service'

/**
 * itag 对照表: https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
 * 18/22 为含音频的 mp4,本播放器采用"视频轨 + 音频轨"分离加载(DASH),故不用
 */
export const TYPES: Record<
  'mp4' | 'webm',
  { video: Record<string, number[]>; audio: number[] }
> = {
  mp4: {
    video: {
      '144p': [160, 597],
      '240p': [133, 395],
      '360p': [134, 396],
      '480p': [135, 397],
      '720p': [136],
      '720p60': [398],
      '1080p': [137],
      '1080p60': [399],
      '1440p60': [400],
      '2160p60': [401],
      '4320p60': [402, 571],
    },
    audio: [140, 139, 599],
  },
  webm: {
    video: {
      '144p': [278, 598, 160, 597],
      '240p': [242, 133, 395],
      '360p': [243, 134, 396],
      '480p': [244, 135, 397],
      '720p': [247, 136],
      '720p60': [302, 398],
      '1080p': [248, 137],
      '1080p60': [303, 399],
      '1440p': [271],
      '1440p60': [308, 400],
      '2160p': [313],
      '2160p60': [315, 401],
      '4320p60': [402, 571],
    },
    audio: [250, 249, 251, 600, 140, 139, 599],
  },
}

/** 清晰度分组:level 1/2/3 控制可选的清晰度组合(P2P 同清晰度才互享,分组越小越容易聚合) */
export const KEY_GROUPS: Record<number, string[][]> = {
  1: [['240p', '144p', '360p', '480p']],
  2: [
    ['360p', '480p', '240p', '144p'],
    ['720p', '1080p', '720p60', '1080p60'],
  ],
  3: [
    ['240p', '144p'],
    ['360p'],
    ['480p'],
    ['720p', '720p60'],
    ['1080p', '1080p60'],
  ],
}

/** level 未知/非法时的默认清晰度分组 */
const DEFAULT_KEYS = KEY_GROUPS[2]

/** 该 itag 流可播放:有长度且有 init/index range */
export const canplay = (t?: StreamItem): boolean => {
  if (!t?.len || !t.initRange || !t.indexRange) return false
  return Object.keys(t.initRange).length + Object.keys(t.indexRange).length > 0
}

/** 是否优先使用 webm 容器(Chrome/Firefox;Safari 走 mp4) */
export const useWebm = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.MediaSource &&
  MediaSource.isTypeSupported('video/webm;codecs="vp9"')

export interface QualityOption {
  quality: string
  itag: number
}

/**
 * 按 level 分组顺序,每个分组选出一档清晰度:
 * 组内按候选顺序取第一个「有可播放 itag」的清晰度,整组选不出来则跳过该组。
 * 结果再反转,使菜单按清晰度从高到低展示(默认档位取列表末位)
 */
export function buildQualityList(
  playerInfo: PlayerInfo,
  level: number,
  webm: boolean,
): QualityOption[] {
  const r: QualityOption[] = []
  // 解析服务在失败或降级响应里可能不带 streams,缺失时按"无可播放流"处理
  const s: Record<number, StreamItem> = playerInfo.streams ?? {}
  const videos = webm ? TYPES.webm.video : TYPES.mp4.video
  const groups = KEY_GROUPS[level] ?? DEFAULT_KEYS
  for (const groupkeys of groups) {
    for (const q of groupkeys) {
      const itags = videos[q]
      if (!itags) continue
      // 该清晰度下取第一个可播放的 itag;全都不可播放则继续组内下一档
      const itag = itags.find((i) => canplay(s[i]))
      if (itag === undefined) continue
      r.push({ quality: q, itag })
      // 本分组已选定一档,进入下一分组
      break
    }
  }
  return r.reverse()
}

/** 单个流 → fastloadjs 加载单元(含多源镜像) */
export function format(item: StreamItem, playerInfo: PlayerInfo): LoadItem {
  const uri = `/${playerInfo.id}/${item.itag}.${/webm/.test(item.type) ? 'webm' : 'mp4'}`
  const mirrors = videoBaseURLs().map((v) => v + uri)
  return {
    itag: item.itag,
    quality: item.quality,
    req: mirrors[0],
    init: { start: Number(item.initRange.start), end: Number(item.initRange.end) },
    index: { start: Number(item.indexRange.start), end: Number(item.indexRange.end) },
    mimeCodec: item.type,
    len: Number(item.len),
    meta: `${playerInfo.id}:${item.itag}`,
    mirrors,
  }
}

const getvideo = (s: Record<number, StreamItem>, qlist: QualityOption[]): StreamItem | undefined => {
  const last = qlist.at(-1)
  return last ? s[last.itag] : undefined
}

const getaudio = (s: Record<number, StreamItem>, itags: number[]): StreamItem | undefined => {
  for (const i of itags) {
    if (canplay(s[i])) {
      return s[i]
    }
  }
  return undefined
}

/** 视频轨(视频+音频分离):返回 [视频, 音频] 加载单元 */
export function buildLoadItems(
  playerInfo: PlayerInfo,
  audio: boolean,
  firstItag: number | null,
  qlist: QualityOption[],
  webm: boolean,
): LoadItem[] {
  const r: LoadItem[] = []
  // 见 buildQualityList:streams 缺失时按无可播放流处理,由调用方走 notFound 兜底
  const s: Record<number, StreamItem> = playerInfo.streams ?? {}
  const t = webm ? TYPES.webm : TYPES.mp4
  if (!audio) {
    if (firstItag && canplay(s[firstItag]) && qlist.find((x) => x.itag === firstItag)) {
      r.push(format(s[firstItag], playerInfo))
    } else {
      const v = getvideo(s, qlist)
      if (v) r.push(format(v, playerInfo))
    }
  }
  const a = getaudio(s, t.audio)
  if (a) r.push(format(a, playerInfo))
  return r
}

/** 现代浏览器能力检测(MSE 播放所需) */
export const isModern = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.Promise &&
  !!window.ReadableStream &&
  !!window.fetch &&
  !!window.ArrayBuffer &&
  !!window.MediaSource
