import type { Rtc } from '@/types'
import { chatStore } from '@/stores/chat'

export interface ChatMessage {
  uid: string
  text: string
}

/** 跨页面保留的消息列表(切换路由不丢失) */
export const msgList: ChatMessage[] = []

let chatPageActive = false
let rtc: Rtc | null = null
let listening = false

export function setChatPageActive(active: boolean) {
  chatPageActive = active
  if (active) chatStore.clear()
}

/** 获取(并惰性初始化)rtc 实例,注册全局 chat 监听 */
export function getRtc(): Rtc | null {
  if (!window.fastloadjs) return null
  if (!rtc) rtc = window.fastloadjs.rtc()
  if (rtc && !listening) {
    listening = true
    rtc.listen('chat', ({ uid, data }) => {
      msgList.push({ uid, text: data.text })
      if (!chatPageActive) chatStore.bump()
    })
  }
  return rtc
}

/** 广播一条聊天消息,返回是否成功 */
export function sendChat(text: string): boolean {
  const r = getRtc()
  if (!r) return false
  r.broadcast(JSON.stringify({ event: 'chat', data: { text } }))
  return true
}
