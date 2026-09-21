# u2web

支持多源多线程下载的 P2P 视频分享站点

> 支持多线程下载
>
> 支持多源下载
>
> CDN 缓存友好,全部接口均可长缓存

技术栈:Vue 3 (`<script setup>`) + TypeScript + Tailwind CSS 4 + Vite,播放引擎为 [fastloadjs](https://github.com/suconghou/fastloadjs)(MSE DASH + WebRTC P2P)。

DEMO https://u2web.pages.dev/

## 快速开始

```bash
pnpm install        # 或 npm install
pnpm dev            # 本地开发 http://localhost:5173
pnpm build          # 类型检查 + 生产构建 (dist/)
pnpm typecheck      # 仅 vue-tsc 类型检查
make release        # 指定 VITE_BASE 构建后上传静态资源服务器
```

## 自动发布

推送到 `master`/`main`(或手动触发 "Build and publish")时,GitHub Actions 自动构建并把 `dist/` 同步到 [suconghou/static](https://github.com/suconghou/static) 仓库的 `u2web/` 目录,由 `static.feds.club` 提供服务。

- 构建时注入 `VITE_BASE=https://static.feds.club/u2web/`,`index.html` 与产物内的资源引用都基于该前缀
- 部署目录取仓库名(`github.event.repository.name`),改名会自动跟随
- 需要在仓库 Settings → Secrets 配置 `STATIC_TOKEN`(对 `suconghou/static` 有写权限的 PAT),否则发布步骤无权限推送

本地手动发布到其他静态服务时,同样通过 `VITE_BASE` 指定资源根地址,如:

```bash
VITE_BASE='https://assets.suconghou.cn/u2web/static/dist/' pnpm build
```

默认后端地址在 `src/service/index.ts`,可被浏览器 localStorage 覆盖(站点"设置"页)。

### 开发时对接真实后端

后端接口地址均可在站点"设置"页填写(存于 localStorage):

- 内容API服务(localStorage `apibaseurl`),如 `https://your-api.example.com/video/api/v3`
- 视频解析服务(localStorage `baseurl`),多源用 `;` 隔开,支持相对路径(同源部署)
- 信令服务器(localStorage `ws`)

若后端部署在本机且希望走同源代理(免 CORS),取消 `vite.config.ts` 中 `server.proxy` 注释并填入后端地址。

## P2P 说明

P2P 分享使用的信令服务器 https://github.com/suconghou/signalserver

P2P 分享使用的网络库 https://github.com/suconghou/libwebrtc

P2P 分享当在线客户端播放的是同一资源(Chrome/Firefox 播放 webm,Safari 播放 mp4)、同一清晰度时才会相互分享。`level` 参数控制清晰度分组,分组越小越容易聚合到同一清晰度。

## 网站里的设置说明

这些设置一般无需更改,如播放卡顿,可修改视频解析服务。

**内容API服务**(localStorage `apibaseurl`)

资源提供接口,调用有次数限制,一般使用默认值无需修改。

可用的后端项目:

- https://github.com/suconghou/videoproxy (Go 全功能版本,包含视频解析和资源 API)
- https://github.com/suconghou/u2proxyapi (Python 版,工作于 GAE+cf,内建缓存)

**视频解析服务**(localStorage `baseurl`,多源用 `;` 隔开)

可用的后端项目:

- https://github.com/suconghou/videoproxy
- https://github.com/suconghou/u2worker (cf workers 中转)
- https://github.com/suconghou/netlifyworker (netlify functions 中转)

多源负载均衡示例:

```
/video;https://stream.pull.workers.dev/video
```

代表当前域名与部署在 cf workers 的两个地址负载均衡。注意第一个地址始终占有更高的权重,地址不可用后会自动重试到其他地址。

**信令服务器**(localStorage `ws`)

一般无需修改,可用的后端项目:https://github.com/suconghou/signalserver

同一信令服务器下的用户才会相互分享。

## 嵌入播放页

站点提供独立的嵌入页 `/play`,通过 URL 参数配置,适合 iframe 引用:

```html
<iframe src="https://your-domain/play?v=视频ID&audio=false&level=0&nop2p=false&screenshot=true&playlist=播放列表ID"></iframe>
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `v` | 必填 | 视频 ID |
| `audio` | `false` | 音频模式(带播放列表面板) |
| `level` | `0` | 清晰度分组 `1`/`2`/`3` |
| `nop2p` | `false` | 关闭 P2P |
| `screenshot` | `true` | 截图按钮(快捷键 `s`,Safari 不支持 MSE 截图已屏蔽) |
| `playlist` | 空 | 播放列表 ID,`audio` 模式下自动连播 |

## 浏览器支持

播放依赖 MSE,需现代浏览器(Chrome/Firefox/Edge/Safari 桌面版均可;iOS 移动端 Safari 不支持 MSE,iPadOS 13+ 支持)。

本项目仅作为学习使用,切勿用作其他用途。

更多说明可参考 https://blog.suconghou.cn/post/mse-p2p-player/
