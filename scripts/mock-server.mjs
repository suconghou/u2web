// 本地开发/测试用假后端 (vite dev 代理到 127.0.0.1:6060)
// 用法: node scripts/mock-server.mjs (或 npm run mock)
// 前端配置: localStorage.setItem('baseurl','/video'); localStorage.setItem('apibaseurl','/video/api/v3')
import { createServer } from 'node:http'

const PORT = 6060
const now = Date.now()
const iso = (daysAgo) => new Date(now - daysAgo * 86400e3).toISOString()

const V = (id, title, ch, chId, daysAgo = 3, duration = 'PT5M30S', views = '12345') => ({
  etag: `etag-${id}`,
  id,
  snippet: {
    publishedAt: iso(daysAgo),
    channelId: chId,
    title,
    description: `${title} - mock 数据描述,仅用于本地开发测试。`,
    thumbnails: { medium: { url: `http://127.0.0.1:${PORT}/video/${id}.jpg` }, high: { url: `http://127.0.0.1:${PORT}/video/${id}.jpg` } },
    channelTitle: ch,
    tags: ['测试', 'mock'],
    categoryId: '1',
  },
  contentDetails: { duration, definition: 'hd', videoPublishedAt: iso(daysAgo) },
  statistics: { viewCount: views, likeCount: '100' },
})

const vids = [
  V('mockVideo001', '示例视频一:本地播放测试', '示例频道A', 'mockChannelA', 1, 'PT2M10S', '100000'),
  V('mockVideo002', '示例视频二:P2P 分享演示', '示例频道A', 'mockChannelA', 2, 'PT8M45S', '52000'),
  V('mockVideo003', '示例视频三:多源负载均衡', '示例频道B', 'mockChannelB', 3, 'PT1H5M30S', '1000000'),
  V('mockVideo004', '示例视频四:清晰度切换测试', '示例频道B', 'mockChannelB', 4, 'PT12M3S', '8800'),
  V('mockVideo005', '示例视频五:音频模式', '示例频道C', 'mockChannelC', 5, 'PT3M20S', '4300'),
  V('mockVideo006', '示例视频六:统计面板展示', '示例频道C', 'mockChannelC', 6, 'PT25M', '66000'),
]

const channels = [
  {
    etag: 'etag-ch-A',
    id: 'mockChannelA',
    snippet: { title: '示例频道A', description: '这是一个测试频道,仅用于本地开发。', publishedAt: iso(365), thumbnails: { high: { url: '' } } },
    statistics: { subscriberCount: '5000', viewCount: '123456', videoCount: '2', hiddenSubscriberCount: false },
    contentDetails: { relatedPlaylists: { uploads: 'mockPlaylistA', favorites: 'mockPlaylistFav' } },
  },
  {
    etag: 'etag-ch-B',
    id: 'mockChannelB',
    snippet: { title: '示例频道B', description: '另一个测试频道。', publishedAt: iso(700), thumbnails: { high: { url: '' } } },
    statistics: { subscriberCount: '12000', viewCount: '999999', videoCount: '2', hiddenSubscriberCount: false },
    contentDetails: { relatedPlaylists: { uploads: 'mockPlaylistB', favorites: 'mockPlaylistFav' } },
  },
  {
    etag: 'etag-ch-C',
    id: 'mockChannelC',
    snippet: { title: '示例频道C', description: '第三个测试频道。', publishedAt: iso(100), thumbnails: { high: { url: '' } } },
    statistics: { subscriberCount: '800', viewCount: '50000', videoCount: '2', hiddenSubscriberCount: false },
    contentDetails: { relatedPlaylists: { uploads: 'mockPlaylistC', favorites: 'mockPlaylistFav' } },
  },
]

const playlists = [
  { etag: 'etag-pl-A', id: 'mockPlaylistA', snippet: { channelId: 'mockChannelA', title: '频道A上传列表', description: '上传', publishedAt: iso(1), channelTitle: '示例频道A' } },
  { etag: 'etag-pl-B', id: 'mockPlaylistB', snippet: { channelId: 'mockChannelB', title: '频道B上传列表', description: '上传', publishedAt: iso(1), channelTitle: '示例频道B' } },
  { etag: 'etag-pl-C', id: 'mockPlaylistC', snippet: { channelId: 'mockChannelC', title: '频道C上传列表', description: '上传', publishedAt: iso(1), channelTitle: '示例频道C' } },
  { etag: 'etag-pl-Fav', id: 'mockPlaylistFav', snippet: { channelId: 'mockChannelA', title: '收藏列表', description: '收藏', publishedAt: iso(1), channelTitle: '示例频道A' } },
]

const playlistItems = (plId) => {
  const map = { mockPlaylistA: [0, 1], mockPlaylistB: [2, 3], mockPlaylistC: [4, 5], mockPlaylistFav: [1, 3, 5] }
  return (map[plId] ?? []).map((i) => {
    const v = vids[i]
    return {
      etag: `etag-pli-${plId}-${v.id}`,
      snippet: { ...v.snippet, resourceId: { videoId: v.id }, playlistId: plId },
      contentDetails: { ...v.contentDetails, videoId: v.id },
    }
  })
}

// 伪造播放信息:流数据让播放器能进入"资源不存在或不支持"以外的分支
const streamsFor = (id) => {
  const s = {}
  const mk = (itag, quality, type, len) => ({
    itag,
    quality,
    type,
    len,
    initRange: { start: '0', end: '1000' },
    indexRange: { start: '1001', end: '2000' },
  })
  s[134] = mk(134, '360p', 'video/mp4; codecs="avc1.4d401f"', 1000000)
  s[136] = mk(136, '720p', 'video/mp4; codecs="avc1.4d401f"', 2000000)
  s[137] = mk(137, '1080p', 'video/mp4; codecs="avc1.640028"', 3000000)
  s[140] = mk(140, 'tiny', 'audio/mp4; codecs="mp4a.40.2"', 500000)
  return s
}

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

const json = (res, data, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const q = url.searchParams

  // 图片
  if (/\.(jpg|webp)$/.test(path)) {
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=86400' })
    res.end(png1x1)
    return
  }

  // 播放信息: /video/{id}.json
  let m = path.match(/^\/video\/([\w-]+)\.json$/)
  if (m) {
    const id = m[1]
    if (!vids.some((v) => v.id === id)) return json(res, { error: 'not found' }, 404)
    return json(res, {
      id,
      title: vids.find((v) => v.id === id).snippet.title,
      duration: 330,
      streams: streamsFor(id),
    })
  }

  // 视频分片: 返回空(播放器将报错,便于测试错误分支)
  m = path.match(/^\/video\/([\w-]+)\/\d+\.(mp4|webm)$/)
  if (m) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Accept-Ranges': 'bytes' })
    res.end(Buffer.alloc(0))
    return
  }

  // 内容 API
  if (path === '/video/api/v3/videos') {
    const id = q.get('id')
    if (id) {
      const item = vids.find((v) => v.id === id)
      return json(res, { items: item ? [item] : [], pageInfo: { totalResults: item ? 1 : 0 } })
    }
    return json(res, { items: vids.slice(0, 30), pageInfo: { totalResults: vids.length } })
  }
  if (path === '/video/api/v3/search') {
    const ch = q.get('channelId')
    let items = [...vids]
    if (ch) items = items.filter((v) => v.snippet.channelId === ch)
    const k = q.get('q')
    if (k) items = items.filter((v) => v.snippet.title.includes(k))
    // 对齐真实 YouTube search API: 不返回 statistics(viewCount 等)
    const strip = ({ statistics, ...rest }) => rest
    return json(res, { items: items.map(strip), pageInfo: { totalResults: items.length }, nextPageToken: undefined })
  }
  if (path === '/video/api/v3/channels') {
    const ch = channels.find((c) => c.id === q.get('id'))
    return json(res, { items: ch ? [ch] : [] })
  }
  if (path === '/video/api/v3/playlists') {
    const chId = q.get('channelId')
    let items = playlists
    if (chId) items = playlists.filter((p) => p.snippet.channelId === chId)
    return json(res, { items, pageInfo: { totalResults: items.length } })
  }
  if (path === '/video/api/v3/playlistItems') {
    const items = playlistItems(q.get('playlistId'))
    return json(res, { items, pageInfo: { totalResults: items.length } })
  }

  json(res, { error: { errors: [{ message: `mock: no route ${path}` }] } }, 404)
}).listen(PORT, () => {
  console.log(`[mock] http://127.0.0.1:${PORT} (vite 代理目标)`)
})
