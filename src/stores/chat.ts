import { reactive } from 'vue'

/** 聊天未读消息计数(头部导航栏徽标) */
export const chatStore = reactive({
  unread: 0,
  /** 收到一条新消息 */
  bump() {
    this.unread++
  },
  /** 清除未读(进入聊天页) */
  clear() {
    this.unread = 0
  },
})
