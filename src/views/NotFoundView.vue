<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="mt-40 text-center">
    <div class="text-lg text-zinc-700">{{ t('notFound.title') }}</div>
    <router-link to="/" class="mt-5 inline-block rounded bg-brand-600 px-5 py-2 text-sm text-white hover:bg-brand-700">
      {{ t('common.back') }}
    </router-link>
  </div>
</template>
