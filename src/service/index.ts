import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { ListResponse, PlayerInfo } from '@/types'
import { toast } from '@/utils/toast'

export interface ApiResult<T> {
  ok: boolean
  data: T
  status: number
}

/** 默认视频解析服务(多源,;分隔),可被 localStorage.baseurl 覆盖 */
const DEFAULT_ABS =
  'https://stream.pull.workers.dev/video'
/** 默认内容API服务,可被 localStorage.apibaseurl 覆盖 */
const DEFAULT_API = 'https://r.suconghou.cn/video/api/v3'
/** 默认 P2P 信令服务,可被 localStorage.ws 覆盖;留空表示默认不启用 P2P(纯 HTTP 下载) */
const DEFAULT_SIGNAL = ''

/** 启用 P2P 时的 ICE 服务器(NAT 穿透);与信令服务配套,可按需替换 */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.voipbuster.com:3478' },
  { urls: 'stun:stun.voipstunt.com:3478' },
  { urls: 'stun:stun.linphone.org:3478' },
]

export const defaultImg = 'https://assets.suconghou.cn/defaultImg.png'

/**
 * P2P 信令服务地址:localStorage `ws`(设置页)优先,未配置时用 DEFAULT_SIGNAL。
 * 引擎以 tracker 是否为空判断是否启用 P2P,故返回空串即表示纯 HTTP 下载
 */
export function signalURL(): string {
  return localStorage.getItem('ws') || DEFAULT_SIGNAL
}

/** 视频解析服务镜像列表;相对路径解析为当前站点 */
export function videoBaseURLs(): string[] {
  const raw = localStorage.getItem('baseurl') || DEFAULT_ABS
  return raw
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => (/^https?:/i.test(v) ? v : `${location.protocol}//${location.host}${v}`))
}

/** 内容API服务地址 */
export function apiBaseURL(): string {
  return localStorage.getItem('apibaseurl') || DEFAULT_API
}

/** 视频封面图地址;可用 localStorage.imgServer 单独指定 */
export function imgSrc(id?: string): string {
  if (!id) return ''
  const server = localStorage.getItem('imgServer')
  const base = server || videoBaseURLs()[0] || ''
  return `${base}/${id}.jpg`
}

const reportError = (e: unknown) => {
  console.error(e)
  const text = e instanceof Error ? e.message || e.stack || String(e) : e == null ? '' : String(e)
  if (text) toast.error(text)
}

const filter = <T>(res: { status: number; statusText: string; data: T & { code?: number; msg?: string; error?: { errors?: { message?: string }[] } } }): ApiResult<T> => {
  if (res.status >= 200 && res.status < 300) {
    if (res.data && Number.isInteger(res.data.code) && res.data.code !== 0) {
      reportError(res.data.msg || res.statusText)
      return { ok: false, data: res.data, status: res.status }
    }
    return { ok: true, data: res.data, status: res.status }
  }
  const msg =
    res.data?.error?.errors?.[0]?.message || res.statusText
  reportError(msg)
  return { ok: false, data: res.data, status: res.status }
}

const httpCreate = (baseURL: string, timeout = 60e3): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout,
    validateStatus: () => true,
  })
  instance.interceptors.response.use(
    filter as unknown as (res: import('axios').AxiosResponse) => import('axios').AxiosResponse,
    (e) => Promise.reject(e),
  )
  return instance
}

export const http = httpCreate(apiBaseURL())

export const mostPopularVideos = (regionCode = 'HK', videoCategoryId = 1) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/videos', {
    params: { chart: 'mostPopular', maxResults: 30, regionCode, videoCategoryId },
  })

export const videoInfo = (id: string) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/videos', { params: { id } })

/** 拉取播放信息:按镜像顺序重试,当前镜像返回错误且还有备用镜像时尝试下一个 */
export const playerInfo = async (id: string): Promise<ApiResult<PlayerInfo>> => {
  const urls = videoBaseURLs()
  let last: ApiResult<PlayerInfo> | null = null
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await http.get<PlayerInfo, ApiResult<PlayerInfo>>(`/${id}.json`, {
        baseURL: urls[i],
      })
      if (res.ok) {
        const data = res.data as unknown as { error?: unknown; streams?: Record<string, unknown> } | null
        if (i < urls.length - 1 && (data?.error || !data?.streams || !Object.keys(data.streams).length)) {
          continue
        }
        return res
      }
      last = res
      if (i >= urls.length - 1) {
        return res
      }
    } catch (e) {
      if (i >= urls.length - 1) {
        throw e
      }
    }
  }
  return last ?? { ok: false, data: {} as PlayerInfo, status: 0 }
}

export const search = (
  q?: string,
  pageToken?: string,
  channelId?: string,
  regionCode?: string,
  type = 'video',
  maxResults = 20,
) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/search', {
    params: { q, type, order: q ? undefined : 'viewCount', channelId, regionCode, pageToken, maxResults },
  })

export const relatedVideo = (relatedToVideoId: string, pageToken?: string, type = 'video', maxResults = 30) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/search', {
    params: { type, relatedToVideoId, pageToken, maxResults },
  })

export const channels = (id: string) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/channels', { params: { id } })

export const playlistsInChannel = (channelId: string, pageToken?: string, maxResults = 20) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/playlists', { params: { channelId, maxResults, pageToken } })

export const playlistItems = (playlistId: string, pageToken?: string, maxResults = 30) =>
  http.get<ListResponse, ApiResult<ListResponse>>('/playlistItems', {
    params: { playlistId, pageToken, maxResults },
  })
