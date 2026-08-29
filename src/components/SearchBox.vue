<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search } from '@lucide/vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const text = ref((route.query.q as string) || '')

watch(
  () => route.query.q,
  (q) => {
    text.value = (q as string) || ''
  },
)

function doSearch() {
  const q = text.value.trim()
  if (!q) return
  router.push({ name: 'search', query: { q } })
}
</script>

<template>
  <div
    class="flex w-full items-center rounded-full bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-300 sm:w-44 sm:focus-within:w-56"
  >
    <button class="cursor-pointer px-2.5 text-zinc-400 hover:text-brand-600" :aria-label="t('search.search')" @click="doSearch">
      <Search class="h-4 w-4" />
    </button>
    <input
      v-model="text"
      class="w-full bg-transparent py-1.5 pr-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
      :placeholder="t('search.placeholder')"
      @keydown.enter="doSearch"
    />
  </div>
</template>
