<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const URLS = {
  webui: 'https://github.com/suconghou/u2web',
  loader: 'https://github.com/suconghou/fastloadjs',
  p2p: 'https://github.com/suconghou/libwebrtc',
  mediaparse: 'https://github.com/suconghou/mediaparse',
  videoproxy: 'https://github.com/suconghou/videoproxy',
  youtubevideoparser: 'https://github.com/suconghou/youtubevideoparser',
  u2proxyapi: 'https://github.com/suconghou/u2proxyapi',
  u2parse: 'https://github.com/suconghou/u2parse',
  u2worker: 'https://github.com/suconghou/u2worker',
  ujparse: 'https://github.com/suconghou/ujparse',
  ustream: 'https://github.com/suconghou/ustream',
  videortc: 'https://github.com/suconghou/videortc',
  u2flutter: 'https://github.com/suconghou/u2flutter',
  signalserver: 'https://github.com/suconghou/signalserver',
} as const

const sections = [
  {
    title: 'about.frontend',
    items: ['webui', 'loader', 'p2p', 'mediaparse'].map((k) => ({ key: k, url: URLS[k as keyof typeof URLS] })),
  },
  {
    title: 'about.backend',
    items: ['videoproxy', 'youtubevideoparser', 'u2proxyapi', 'u2parse', 'u2worker', 'ujparse', 'ustream', 'videortc', 'u2flutter'].map(
      (k) => ({ key: k, url: URLS[k as keyof typeof URLS] }),
    ),
  },
  {
    title: 'about.signal',
    items: ['signalserver'].map((k) => ({ key: k, url: URLS[k as keyof typeof URLS] })),
  },
]
</script>

<template>
  <div class="mx-auto max-w-3xl pt-6">
    <div class="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <p class="mb-1 text-zinc-700">{{ t('about.license') }}</p>
      <p class="mb-6 text-zinc-700">{{ t('about.star') }}</p>
      <div v-for="sec in sections" :key="sec.title" class="mb-6">
        <h2 class="mb-3 text-xl font-semibold text-zinc-800">{{ t(sec.title) }}:</h2>
        <div v-for="it in sec.items" :key="it.key" class="mb-4">
          <h4 class="text-sm font-medium text-zinc-800">{{ t(`about.items.${it.key}.name`) }}</h4>
          <p class="text-sm text-zinc-600">{{ t(`about.items.${it.key}.desc`) }}</p>
          <a :href="it.url" target="_blank" rel="noopener" class="text-sm text-brand-600 break-all hover:underline">
            {{ it.url }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
