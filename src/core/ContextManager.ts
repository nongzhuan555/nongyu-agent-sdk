import { Message } from '../types/Message.js'

/**
 * 上下文管理器，用于管理 Agent 的短期记忆
 */
export class ContextManager {
  private messages: Message[] = []
  private maxTokens: number = 4000 // 默认最大上下文限制
  private mode: 'dev' | 'prod' = 'dev' // 运行模式

  constructor(maxTokens: number = 4000, mode: 'dev' | 'prod' = 'dev') {
    this.maxTokens = maxTokens
    this.mode = mode
  }

  // 内部日志方法，仅在 dev 模式下输出
  private log(...args: any[]) {
    if (this.mode === 'dev') {
      console.log(...args)
    }
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
    // 这是浅拷贝，暂时先这样写，后面调试过程中再找问题
    return [...this.messages]
  }

  /**
   * 初始化/重置上下文，并添加系统提示词
   * @param systemPrompt 系统提示词内容
   */
  init(systemPrompt: string) {
    this.clear()
    this.addMessage({
      role: 'system',
      content: systemPrompt,
    } as any)
  }

  /**
   * 清空上下文
   */
  clear() {
    this.messages.length = 0
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
   * 需要依赖模型来进行语义压缩
   * 会额外产生一次模型调用
   */
  compress() {
    // 根据 Tech.md，未来可引入上下文压缩算法
    this.log('Context compression not implemented yet.')
  }
}
