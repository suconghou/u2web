/** 无操作一段时间后隐藏控制条；用户活动时立即显示并重新计时 */
export default class Delayer {
  private timer: ReturnType<typeof setTimeout> | undefined
  private stopped = false

  constructor(
    private onHide: () => boolean | void,
    private onShow: () => void,
    private duration: number,
  ) {}

  /** 开始隐藏倒计时（不改变当前显隐） */
  start() {
    this.stopped = false
    this.arm()
  }

  stop() {
    this.stopped = true
    clearTimeout(this.timer)
    this.timer = undefined
  }

  /** 用户活动：显示控件并重新开始隐藏倒计时 */
  ping() {
    this.stopped = false
    this.onShow()
    this.arm()
  }

  /** 显示控件并暂停自动隐藏（暂停播放、菜单打开） */
  hold() {
    this.stopped = false
    this.onShow()
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private arm() {
    clearTimeout(this.timer)
    if (this.stopped) return
    this.timer = setTimeout(() => {
      if (this.stopped) return
      if (this.onHide() === false) {
        this.arm()
        return
      }
    }, this.duration)
  }
}
