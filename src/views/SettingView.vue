<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'

const { t } = useI18n()
const form = reactive({
  apiPath: localStorage.getItem('apibaseurl') || '',
  videoCdn: localStorage.getItem('baseurl') || '',
  wsPrefix: localStorage.getItem('ws') || '',
})
const saved = ref(false)

function save() {
  if (form.apiPath) localStorage.setItem('apibaseurl', form.apiPath)
  else localStorage.removeItem('apibaseurl')
  if (form.videoCdn) localStorage.setItem('baseurl', form.videoCdn)
  else localStorage.removeItem('baseurl')
  if (form.wsPrefix) localStorage.setItem('ws', form.wsPrefix)
  else localStorage.removeItem('ws')
  saved.value = true
  toast.success(t('setting.saved'))
  setTimeout(() => location.reload(), 1000)
}
</script>

<template>
  <div class="mx-auto max-w-2xl pt-8">
    <div class="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-6 text-lg font-semibold text-zinc-800">{{ t('setting.title') }}</h2>
      <div class="space-y-5">
        <div>
          <label class="mb-1.5 block text-sm text-zinc-600">{{ t('setting.api') }}</label>
          <input
            v-model="form.apiPath"
            class="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            :placeholder="t('setting.placeholder')"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm text-zinc-600">{{ t('setting.parser') }}</label>
          <input
            v-model="form.videoCdn"
            class="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            :placeholder="t('setting.placeholderMulti')"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm text-zinc-600">{{ t('setting.signal') }}</label>
          <input
            v-model="form.wsPrefix"
            class="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            :placeholder="t('setting.placeholder')"
          />
        </div>
        <button class="cursor-pointer rounded bg-brand-600 px-5 py-2 text-sm text-white hover:bg-brand-700" @click="save">
          {{ t('common.save') }}
        </button>
        <div v-if="saved" class="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {{ t('setting.saved') }}
        </div>
      </div>
    </div>
  </div>
</template>
