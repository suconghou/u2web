<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VPlayer from '@/components/player/VPlayer.vue'
import PlaylistPanel from '@/components/PlaylistPanel.vue'
import { imgSrc, playerInfo } from '@/service'
import { toast } from '@/utils/toast'
import type { PlayerInfo } from '@/types'

const { t } = useI18n()
const route = useRoute()

const vid = computed(() => (route.query.v as string) || '')
const audio = route.query.audio === 'true' || route.query.audio === '1'
const level = Number(route.query.level) || 0
const nop2p = route.query.nop2p === 'true' || route.query.nop2p === '1'
const screenshot = route.query.screenshot !== 'false' && route.query.screenshot !== '0'
const playlist = (route.query.playlist as string) || ''

const pinfo = ref<Partial<PlayerInfo>>({})
const showlist = ref(false)
const playlistPanel = useTemplateRef<InstanceType<typeof PlaylistPanel>>('playlist')

const errMsg = computed(() => pinfo.value.error || pinfo.value.msg)

async function init(id: string) {
  try {
    pinfo.value = {}
    const { ok, data } = await playerInfo(id)
    if (!ok) {
      pinfo.value = { error: data.msg || t('video.parseFailed') }
      return
    }
    pinfo.value = data
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}

function toggleList() {
  showlist.value = !showlist.value
}

function playNext(info: PlayerInfo) {
  playlistPanel.value?.playNext(info.id)
}

onMounted(() => {
  if (!vid.value) return
  setTimeout(() => init(vid.value), 50)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-black p-2">
    <div class="w-full max-w-5xl">
      <div v-if="errMsg" class="py-20 text-center text-rose-400">{{ errMsg }}</div>
      <template v-else-if="pinfo.id">
        <div class="relative">
          <VPlayer
            :player-info="(pinfo as PlayerInfo)"
            :audio="audio"
            :level="level"
            :nop2p="nop2p"
            :screenshot="screenshot"
            @list="toggleList"
            @ended="playNext"
          />
          <PlaylistPanel
            v-if="playlist"
            ref="playlist"
            v-show="showlist"
            :playlist="playlist"
            class="absolute right-0 bottom-12 left-0 z-20"
            @play="init"
          />
        </div>
      </template>
      <div
        v-else
        class="relative flex aspect-video items-center justify-center bg-cover bg-center"
        :style="{ backgroundImage: `url(${imgSrc(vid)})` }"
      >
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
      </div>
    </div>
  </div>
</template>
