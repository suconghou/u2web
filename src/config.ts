// 站点级配置

/**
 * 下载跳转地址:点击视频页"下载视频"按钮时,携带当前视频 ID 跳转到该站点。
 * 占位符 {id} 会被替换为当前视频 ID。
 */
export const DOWNLOAD_BASE_URL = 'https://example.com/download?v={id}'

export const downloadUrl = (videoId: string) => DOWNLOAD_BASE_URL.replace('{id}', encodeURIComponent(videoId))
