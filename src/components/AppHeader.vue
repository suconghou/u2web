<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Home, MessageCircle, Info, Settings, Globe } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { chatStore } from '@/stores/chat'
import { saveLang, type LangCode } from '@/locales'
import SearchBox from './SearchBox.vue'

const { t, locale } = useI18n()
const router = useRouter()
const open = ref(false)
const langOpen = ref(false)
const langRef = ref<HTMLElement>()

const links = [
  { to: '/', label: 'header.home', icon: Home },
  { to: '/chat', label: 'header.chat', icon: MessageCircle },
  { to: '/about', label: 'header.about', icon: Info },
  { to: '/setting', label: 'header.setting', icon: Settings },
]

const langs: { code: LangCode; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
]

function go(to: string) {
  open.value = false
  router.push(to)
}

function setLang(code: LangCode) {
  locale.value = code
  saveLang(code)
  langOpen.value = false
}

function onDocPointerDown(e: PointerEvent) {
  if (!langOpen.value) return
  if (!langRef.value?.contains(e.target as Node)) langOpen.value = false
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointerDown))
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-[9401] bg-brand-600 text-white shadow">
    <div class="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
      <button
        class="cursor-pointer rounded p-2 hover:bg-white/10 md:hidden"
        :aria-label="t('header.menu')"
        @click="open = !open"
      >
        <Menu class="h-5 w-5" />
      </button>
      <router-link to="/" class="text-lg font-bold tracking-wide">USTREAM</router-link>
      <div class="flex-1"></div>
      <SearchBox class="hidden sm:flex" />
      <div class="relative" ref="langRef">
        <button
          class="cursor-pointer rounded p-2 hover:bg-white/10"
          :aria-label="t('header.lang')"
          @click="langOpen = !langOpen"
        >
          <Globe class="h-5 w-5" />
        </button>
        <div
          v-if="langOpen"
          class="absolute top-12 right-0 z-[9600] w-32 overflow-hidden rounded-lg bg-white py-1 text-sm text-zinc-700 shadow-lg"
        >
          <button
            v-for="l in langs"
            :key="l.code"
            class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 hover:bg-brand-50"
            :class="locale === l.code ? 'font-medium text-brand-600' : ''"
            @click="setLang(l.code)"
          >
            {{ l.label }}
          </button>
        </div>
      </div>
      <nav class="hidden items-center gap-1 md:flex">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="relative rounded px-3 py-2 text-sm hover:bg-white/10"
        >
          {{ t(l.label) }}
          <span
            v-if="l.to === '/chat' && chatStore.unread > 0"
            class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px]"
          >
            {{ chatStore.unread }}
          </span>
        </router-link>
      </nav>
    </div>

    <!-- 移动端抽屉 -->
    <transition name="drawer">
      <div v-if="open" class="absolute inset-x-0 top-14 border-t border-white/10 bg-brand-700 shadow-lg md:hidden">
        <div class="p-3">
          <SearchBox class="mb-2 sm:hidden" />
          <div class="mb-2 flex gap-1">
            <button
              v-for="l in langs"
              :key="l.code"
              class="flex-1 cursor-pointer rounded px-2 py-1 text-xs hover:bg-white/10"
              :class="locale === l.code ? 'bg-white/20 font-medium' : ''"
              @click="setLang(l.code)"
            >
              {{ l.label }}
            </button>
          </div>
          <button
            v-for="l in links"
            :key="l.to"
            class="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-2.5 text-sm hover:bg-white/10"
            @click="go(l.to)"
          >
            <component :is="l.icon" class="h-4 w-4" />
            {{ t(l.label) }}
            <span
              v-if="l.to === '/chat' && chatStore.unread > 0"
              class="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px]"
            >
              {{ chatStore.unread }}
            </span>
          </button>
        </div>
      </div>
    </transition>
    <button v-if="open" class="fixed inset-0 -z-10 cursor-default" :aria-label="t('header.closeMenu')" @click="open = false"></button>
  </header>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
