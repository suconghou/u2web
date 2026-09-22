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

/**
 * 传给 fastloadjs.loader.attach() 的加载单元,对应引擎的 streamItem。
 * 引擎只解构 req/init/index/mimeCodec/len/meta/mirrors,itag/quality 是本项目附加的展示字段
 */
export interface LoadItem {
  itag: number
  quality: string
  /** 主请求地址 */
  req: string
  init: { start: number; end: number }
  index: { start: number; end: number }
  mimeCodec: string
  len: number
  /** 资源标识:videoId:itag,启用 P2P 时作为 swarmId */
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

/** 引擎构造配置,对应 fastConfig;缺省项由引擎内部 defaultOpts 补齐 */
export interface FastloadConfig {
  /** 每路流的并发下载线程数,默认 2 */
  thread?: number
  /** 预读窗口大小(分块数),默认 12 */
  wsize?: number
  /** 单个分块下载失败的重试次数,默认 5 */
  retry?: number
  /** 单路流的源 URL(顶层实例不下载,由 attach 的 streams 逐路提供) */
  req?: string
  /** 流标识 */
  meta?: string
  /** P2P 信令服务地址;留空即纯 HTTP 下载(引擎即以此判断是否启用 P2P) */
  tracker?: string
  /** 多源镜像地址 */
  mirrors?: string[]
  /** WebRTC 配置,启用 P2P 时提供 iceServers */
  rtcConf?: RTCConfiguration
}

/**
 * 单路流的下载器,即 attach 后由 ready 事件回传的 loaders 元素。
 * 这些实例由引擎按流创建,调用方只挂事件监听
 */
export interface Fastloader {
  listen(event: string, cb: (a?: unknown, b?: unknown) => void): Fastloader
  start(): Fastloader
  pause(): Fastloader
  setBufferHealth(t: number): Fastloader
  seekTo(time: number): void
  destroy(keepListen?: boolean): void
}

/** 顶层播放器实例:自建 MediaSource,把各路流 attach 进去 */
export interface FastloadPlayer extends Fastloader {
  attach(video: HTMLMediaElement, items: LoadItem[]): Promise<void>
  destroy(keepListen?: boolean): Promise<void>
}

export interface FastloaderCtor {
  new (opts?: FastloadConfig): FastloadPlayer
}

declare global {
  interface Window {
    fastloadjs?: FastloaderCtor
  }
}
