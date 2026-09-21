import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// 部署到子路径或独立静态域时,通过 VITE_BASE 指定资源根地址(尾斜杠可省略);
// index.html 里 %BASE_URL% 会被替换为该值,用于引用 favicon / fastload.min.js 等公共资源
function assetBase() {
  const raw = process.env.VITE_BASE || '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export default defineConfig({
  base: assetBase(),
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
