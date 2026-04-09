import mitt, { Emitter, EventType } from 'mitt'

/**
 * 事件系统类，基于 mitt 封装
 * 提供事件的订阅、发布和取消订阅功能
 */
export class EventSystem {
  private emitter: Emitter

  constructor() {
    if (!this.emitter) {
      this.emitter = mitt()
    }
  }

  /**
   * 订阅事件
   * @param event 事件名称或事件名称数组
   * @param handler 事件处理函数
   */
  public on<T = any>(event: EventType, handler: (event: T) => void): void {
    this.emitter.on(event, handler)
  }

  /**
   * 订阅事件，只触发一次
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  public once<T = any>(event: EventType, handler: (event: T) => void): void {
    const onceHandler = (event: T) => {
      handler(event)
      this.off(event, onceHandler)
    }
    this.emitter.on(event, onceHandler)
  }

  /**
   * 取消订阅事件
   * @param event 事件名称或事件名称数组
   * @param handler 事件处理函数
   */
  public off<T = any>(event: EventType, handler: (event: T) => void): void {
    this.emitter.off(event, handler)
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public emit<T = any>(event: EventType, data?: T): void {
    this.emitter.emit(event, data)
  }

  /**
   * 清空所有事件订阅
   */
  public clear(): void {
    this.emitter.all.clear()
  }

  /**
   * 获取当前所有事件订阅数量
   */
  public getEventCount(): number {
    return this.emitter.all.size
  }
}

// 默认导出单例
const eventSystem = new EventSystem()
export default eventSystem
