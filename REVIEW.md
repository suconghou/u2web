# u2web 项目 Review

Review 时间:2026-09-22。
基线:`pnpm typecheck`、`pnpm build` 通过;播放器选流逻辑对真实模块跑 32 条断言全部通过。

## 架构

- Vue 3.5 `<script setup>` + TypeScript 5.9 + Tailwind CSS 4(`@tailwindcss/vite`)+ Vite 8.2
  + vue-router 5.2 + vue-i18n 11
- 全部依赖打包进产物,无 CDN 运行时依赖(仅 `public/fastload.min.js` 一个本地 vendoring 的播放引擎)
- 分层:
  - `src/service/`:axios 实例 + 响应拦截器 + 多源 failover;`baseurl` / `apibaseurl` / `ws` 由设置页维护,
    `imgServer` 亦可覆盖但未在设置页暴露
  - `src/components/player/`:DASH 音视频轨分离、MSE、webm(Chrome/Firefox)与 mp4(Safari)按浏览器分流、
    level 1/2/3 清晰度分组、P2P 统计面板
  - `src/views/` + `src/views/channel/`:按路由组织;`/play` 为 iframe 嵌入页,复用 VPlayer 且隐藏站点框架
  - `src/types/`:上游 API 数据模型 + 播放引擎类型契约
- 路由级 code-splitting,生产构建约 110KB JS gzip

## 依赖

vite 8.2.1 / vue 3.5.41 / vue-router 5.2.0 / vue-i18n 11.4.8 / axios 1.19.0 / tailwindcss 4.3.3 /
@tailwindcss/vite 4.3.3 / @vitejs/plugin-vue 6.0.8 / vue-tsc 3.3.9 / typescript 5.9.3 / @lucide/vue 1.31.0。
无弃用或冗余包。

## 播放器与 fastloadjs 对接

### 引擎产物(vendoring)

`public/fastload.min.js` 由 [fastloadjs](https://github.com/suconghou/fastloadjs) 源码构建而来,
UMD 格式,全局名 `fastloadjs`,由 `index.html` 以 `<script defer>` 引入。重新构建:

```bash
cd <fastloadjs> && make build        # tsc -> rollup UMD -> esbuild
cp fastload.min.js <u2web>/public/fastload.min.js
cd <u2web> && pnpm build
```

产物自检——缺任一项说明构建已过时:`rtcRef`、`mirrors:[]`、`wrap(...,n=!0)`、`forgetInuse`,
且不应再出现 `1e9`。`index.html` 注释中记录了当前产物的 sha256 前 12 位,便于比对。

### 构造配置

对应 `FastloadConfig`(`src/types/index.ts`),缺省项由引擎内部 `defaultOpts` 补齐:

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `thread` | 2 | 每路流的并发下载线程数 |
| `wsize` | 12 | 预读窗口大小(分块数) |
| `retry` | 5 | 单个分块下载失败的重试次数 |
| `tracker` | — | **P2P 信令服务地址;留空即纯 HTTP 下载** |
| `rtcConf` | — | 启用 P2P 时提供 `iceServers` |

`VPlayer.init()` 的实际构造:

```ts
const tracker = props.nop2p ? '' : signalURL()
loader.value = new fastload({
  thread: 2,
  tracker,
  rtcConf: tracker ? { iceServers: ICE_SERVERS } : undefined,
})
```

- 引擎以 **`tracker` 是否为空** 判断是否启用 P2P,故 `nop2p` 参数通过「传空 tracker」实现;
  未配置信令服务时为纯 HTTP 多源多线程下载
- `signalURL()` 读 localStorage `ws`(设置页「信令服务器」),`DEFAULT_SIGNAL` 为空
- `ICE_SERVERS` 为三个公共 STUN,仅在启用 P2P 时注入

### attach 单元(streamItem)

对应 `LoadItem`。引擎只解构 `req` / `init` / `index` / `mimeCodec` / `len` / `meta` / `mirrors`;
`itag` / `quality` 是本站点附加给统计面板与清晰度菜单使用的展示字段。

`meta` 形如 `videoId:itag`,启用 P2P 时作为 swarmId —— **只有同一 meta 的客户端之间才会互相分享**。

### 事件契约

| 事件 | 回传 | 用途 |
| --- | --- | --- |
| `ready` | `(loaders, dispatchs)` | 各路流就绪,统计面板据此绑定 |
| `error` | `(err)` | 致命错误,播放器展示错误层 |
| `http.start` / `http.done` | `(item)` / `(res)` | 分块 HTTP 下载状态 |
| `rtc.start` / `rtc.done` / `rtc.progress` | `(item)` / `(res)` | P2P 探测与传输状态 |
| `rtc.stat` | `(stat, uid?)` | 对端节点表;**仅轮询时带 uid**,`open`/`close`/`error` 触发时只有一个参数 |

### 选流与清晰度分组

`buildQualityList()` 按 `level` 分组,每个分组选出一档:组内按候选顺序取第一个「有可播放 itag」的清晰度,
整组都选不出来则跳过该组;结果再反转,使菜单按清晰度从高到低展示。

- `level` 取 1 / 2 / 3 控制分组粒度,`0` 或非法值回落 `KEY_GROUPS[2]`
- 默认播放档位是 `qlist.at(-1)`,即**该分组的较低档**(level 2 下为 360p)。这是
  「分组越小越容易聚合到同一清晰度、提升 P2P 命中率」的设计取向,用户可在菜单中手动切到高清

## 安全

- 无用户数据、无鉴权、无服务端存储;后端接口均为只读拉取,攻击面小
- 引擎本地 vendoring,无第三方 CDN 运行时依赖,不存在 CDN 不可达导致播放器整体失效的风险
- 设置页可覆盖后端地址属预期能力,仅参与请求 URL 拼接

## 已知限制

1. **P2P 默认关闭**:`DEFAULT_SIGNAL` 为空,需在设置页填写信令服务器地址才会启用。启用后仍需
   同一信令服务器下、播放同一资源且同一清晰度的客户端才相互分享。
2. **`canplay` 判定偏宽**:条件为「`initRange` 与 `indexRange` 键数之和 > 0」,只有 `initRange` 时
   也会判为可播放,`format()` 随之产出 `index: {start: NaN, end: NaN}`。收紧判定会改变 itag 选择结果,
   故保持现状。
3. **切换清晰度丢失播放进度**:`switchQuality(item, true)` 走 `pauseVideo()` + `init()`,进度归零。
   如需改善,可在 `init()` 前记录 `currentTime`、在 `loadedmetadata` 后 seek 回去。
4. **播放出错后无法原地重试**:错误层「关闭」仅清 `video.error`,而引擎已 `pause()`,需刷新页面。
5. **音频模式下统计面板的「视频统计」卡片恒为空**:`loadItems` 只含音频轨,`names.vtitle` 为空串。
6. **引擎侧 P2P 门控偏松**:门控基于 `window.RTCPeerConnection` 而非 `tracker`,未配置信令时每个 loader
   仍会起一个 2s 空轮询(引擎内部 `enable = false`,无实际传输)。3 个 loader 约 90 次/分钟唤醒。

## 复核通过项

- `vue-tsc --noEmit` 零错误;`pnpm build` 通过
- 四个语言包(en / ja / ko / zh)顶层键与 `player` 等子键完全对齐
- `window.fastloadjs` 缺失时有 `player.noFastload` 兜底;`initGen` 序号守卫可防快速切视频的竞态;
  `onBeforeUnmount` 完整清理文档监听、Delayer 与引擎实例
- `dist/` 未被 git 跟踪

## 验证与环境限制

- 选流逻辑(`buildQualityList` / `buildLoadItems` / `canplay`)对真实模块跑 32 条断言,覆盖分组回落、
  字段对齐与边界输入(含 `streams` 缺失/为 `null`/为空对象)
- 浏览器端到端播放未验证:本机对 `stream.pull.workers.dev`、`ustream.vercel.app`、`video.feds.club`、
  `static.feds.club` 均解析到异常地址且 TCP 不可达(疑似网络层拦截),故解析服务与信令服务无法就地联调;
  内容 API `r.suconghou.cn/video/api/v3` 本机可正常返回
- P2P 端到端需真实信令服务器 + 多个同清晰度客户端
