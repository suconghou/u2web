import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// make release 时 `production=1 npm run build`,产物部署到静态资源服务器,使用绝对路径
const base = process.env.production
  ? 'https://assets.suconghou.cn/u2web/static/dist/'
  : '/'

export default defineConfig({
  base,
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 对接真实本地后端时,取消注释并把 target 指向实际地址即可;
    // 否则开发时通过站点"设置页"(localStorage.baseurl/apibaseurl)指向真实后端
    // proxy: {
    //   // key 以 ^ 开头按正则匹配 (见 vite 的 doesProxyContextMatchUrl):
    //   // 只代理 /video/api、/video/{id}.json|ts|jpg|webp、/video/{id}/{itag}.mp4 等资源请求,
    //   // 页面导航 /video/{id} (无扩展名) 不代理,由 SPA fallback 返回 index.html
    //   '^/video/(api|.*\\.(json|ts|jpg|webp|mp4))': { target: 'http://127.0.0.1:PORT', changeOrigin: true },
    //   '/static': { target: 'http://127.0.0.1:PORT', changeOrigin: true },
    // },
  },
})
