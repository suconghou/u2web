// 站点级配置

/**
 * 下载跳转地址:点击视频页"下载视频"按钮时,携带当前视频 ID 跳转到该站点。
 * 占位符 {id} 会被替换为当前视频 ID。
 * 留空表示未配置,此时视频页不显示下载按钮。
 */
export const DOWNLOAD_BASE_URL = ''

export const downloadUrl = (videoId: string) => DOWNLOAD_BASE_URL.replace('{id}', encodeURIComponent(videoId))

/** 是否已配置下载跳转地址(未配置时视频页不显示下载按钮) */
export const downloadEnabled = DOWNLOAD_BASE_URL !== ''
