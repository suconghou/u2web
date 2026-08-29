import { reactive } from 'vue'

export interface ToastItem {
  id: number
  text: string
  type: 'error' | 'success' | 'info'
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })
let seq = 0

const push = (text: string, type: ToastItem['type'], duration: number) => {
  const id = ++seq
  state.items.push({ id, text, type })
  setTimeout(() => {
    const i = state.items.findIndex((t) => t.id === id)
    if (i >= 0) state.items.splice(i, 1)
  }, duration)
}

export const toast = {
  error(text: string, duration = 4000) {
    push(text, 'error', duration)
  },
  success(text: string, duration = 2000) {
    push(text, 'success', duration)
  },
  info(text: string, duration = 2000) {
    push(text, 'info', duration)
  },
}

export const toastState = state
