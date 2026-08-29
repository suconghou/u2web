# u2web 项目 Review

升级完成:Vue 2 + vue-cli(Webpack) → Vue 3 + TypeScript + Tailwind CSS 4 + Vite 8.2 全量重写。
Review 时间:2026-08-11,基于 `vue-tsc` 通过、`vite build` 通过、Playwright 冒烟测试(首页/视频/频道/搜索/嵌入页/404)全部通过的状态。

## 架构

- Vue 3.5 `<script setup>` + TypeScript ~5.9 + Tailwind CSS 4(`@tailwindcss/vite`)+ Vite 8.2 + vue-router 5.2
- 旧工具链与 CDN externals(vue/axios 全局依赖)已彻底移除,全部依赖打包进产物
- 分层清晰:
  - `src/service/`:axios 实例 + filter 拦截器 + 多源 failover;baseurl/apibaseurl/ws 均可由 localStorage 覆盖(设置页)
  - `src/components/player/`:DASH 音视频轨分离、MSE、webm(Chrome/Firefox)/mp4(Safari)按浏览器分流、level 1/2/3 清晰度分组、P2P 统计面板
  - `src/views/` + `src/views/channel/`:按路由组织;`/play` 嵌入模式复用 VPlayer 且隐藏站点框架
  - `scripts/mock-server.mjs`:本地开发假数据后端(vite 代理 /video 资源请求)
- 生产构建约 120KB JS gzip,路由级 code-splitting

## 依赖

全部为最新稳定版:vite 8.2.1 / vue 3.5.41 / vue-router 5.2.0 / axios 1.19.0 / tailwindcss 4.3.3 / @vitejs/plugin-vue 6.0.8 / vue-tsc 3.3.9 / lucide-vue-next 1.0.0。无弃用或冗余包。

## 安全

- fastloadjs 经 jsdelivr CDN 加载,URL 锁定 commit hash(`assets@8a64290`),但缺少 SRI integrity 属性,建议补充
- 无用户数据、无鉴权、无服务端存储,攻击面小;后端接口数据均为只读拉取

## 可维护性

### 上线前必须处理

1. **默认后端全部失效**:`r.suconghou.cn`(Deno Deploy 2026-07-20 停服)、`stream.pull.workers.dev`、`ustream.vercel.app`、`video.feds.club` 均无有效响应;信令服务器 `wss://ws.feds.club` 返回 521。默认配置下线上无法播放与聊天。
   → 部署自有 videoproxy/workers + signalserver,更新 `src/service/index.ts` 默认值与设置页文案
2. **P2P 无法端到端验证**:需真实信令服务器 + 多个同清晰度客户端才能验证互享;mock 环境仅验证 UI 与播放器挂载

### 建议项

- README.md 仍描述旧时代内容(`yarn buildwc`、web component、public/index.html 手改版本号等),建议重写为当前工具链
- fastloadjs 建议本地 vendoring 或加 SRI,避免 CDN 不可达时播放器完全不可用

### mock 环境已知限制(预期行为)

- 缩略图为 1x1 透明图(卡片显示灰底)
- 上传页显示 0 次观看(playlistItems 无 statistics 字段)
- 视频流为空文件,播放器仅验证挂载与 UI,不验证真实播放

## 结论

代码层面可交付。上线唯一硬性前置:配置可用的内容/解析后端与信令服务器。
