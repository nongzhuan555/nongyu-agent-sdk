import { Message } from '../types/Message'

/**
 * 上下文管理器，用于管理 Agent 的短期记忆
 */
export class ContextManager {
  private messages: Message[] = []
  private maxTokens: number = 4000 // 默认最大上下文限制

  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens
  }

  /**
   * 添加消息到上下文
   * @param message 消息对象
   */
  addMessage(message: Message) {
    this.messages.push(message)
    this.manageContext()
  }

  /**
   * 获取当前所有上下文消息
   */
  getMessages(): Message[] {
    return [...this.messages]
  }

  /**
   * 清除上下文
   */
  clear() {
    this.messages = []
  }

  /**
   * 上下文管理策略：滑动窗口
   * 暂时简单实现为保留最近的消息，后续可引入 token 计数和压缩策略
   */
  private manageContext() {
    // 简单的滑动窗口，保留最近的 20 条消息作为短期记忆
    const MAX_MESSAGES = 20
    if (this.messages.length > MAX_MESSAGES) {
      // 保留系统提示词（假设第一条是系统提示词）
      const systemMessage = this.messages.find(m => m.role === 'system')
      const recentMessages = this.messages.slice(-MAX_MESSAGES)
      
      this.messages = systemMessage 
        ? [systemMessage, ...recentMessages.filter(m => m.role !== 'system')]
        : recentMessages
    }
  }

  /**
   * 压缩上下文（待实现）
   */
  compress() {
    // 根据 Tech.md，未来可引入上下文压缩算法
    console.log('Context compression not implemented yet.')
  }
}
