// ---------------------------------------------------------------------------
// 数据模型:与上游 API (r.suconghou.cn/video/api/v3 及同类实现) 返回结构对应
// ---------------------------------------------------------------------------

export interface Thumbnail {
  url: string
  width?: number
  height?: number
}

export interface ResourceId {
  kind?: string
  videoId?: string
  playlistId?: string
}

export interface Snippet {
  publishedAt?: string
  channelId?: string
  title?: string
  description?: string
  thumbnails?: Record<string, Thumbnail>
  channelTitle?: string
  tags?: string[]
  categoryId?: string
  resourceId?: ResourceId
  playlistId?: string
}

export interface ContentDetails {
  duration?: string
  definition?: string
  videoPublishedAt?: string
  videoId?: string
  videoCount?: string
  relatedPlaylists?: {
    uploads?: string
    favorites?: string
  }
}

export interface Statistics {
  viewCount?: string
  subscriberCount?: string
  videoCount?: string
  hiddenSubscriberCount?: boolean
}

/** 视频/播放列表/频道条目的通用形态(不同接口字段有差异) */
export interface VideoItem {
  etag?: string
  id?: string | { videoId?: string }
  snippet?: Snippet
  contentDetails?: ContentDetails
  statistics?: Statistics
}

export interface PageInfo {
  totalResults?: number
  resultsPerPage?: number
}

export interface ListResponse<T = VideoItem> {
  kind?: string
  etag?: string
  items: T[]
  pageInfo?: PageInfo
  prevPageToken?: string
  nextPageToken?: string
  code?: number
  msg?: string
}

// ---------------------------------------------------------------------------
// 播放器:视频解析服务返回的流信息与 fastloadjs 加载单元
// ---------------------------------------------------------------------------

export interface StreamItem {
  itag: number
  quality: string
  /** mime+codec,如 video/mp4; codecs="avc1.4d401f" */
  type: string
  len: number
  initRange: { start: string; end: string }
  indexRange: { start: string; end: string }
}

export interface PlayerInfo {
  id: string
  title: string
  duration: number
  streams: Record<number, StreamItem>
  error?: string
  msg?: string
}

/** 传给 fastloadjs.loader.attach() 的加载单元 */
export interface LoadItem {
  itag: number
  quality: string
  /** 主请求地址 */
  req: string
  init: { start: number; end: number }
  index: { start: number; end: number }
  mimeCodec: string
  len: number
  duration: number
  /** 资源标识:videoId:itag */
  meta: string
  /** 多源镜像地址 */
  mirrors: string[]
}

/** 文件块状态(statcard 用) */
export interface SegmentItem {
  no: number
  m: number
  n: number
  i?: number
}

export interface RtcPeerStat {
  state: string
  cstate?: string
  istate?: string
  gstate?: string
  tx: number
  rx: number
}

/** fastloadjs 加载器实例(CDN 全局库,按使用面收窄类型) */
export interface Fastloader {
  listen(event: string, cb: (a?: unknown, b?: unknown) => void): void
  attach(video: HTMLVideoElement, items: LoadItem[]): void
  seekTo(time: number): void
  pause(): void
  destroy(): void
}

export interface FastloaderCtor {
  new (opts: {
    req: string
    thread: number
    thunk: number
    start: number
    end: number
    nop2p?: boolean
  }): Fastloader
}

declare global {
  interface Window {
    fastloadjs?: FastloaderCtor
  }
}
