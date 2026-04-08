import { LLMClient } from './LLMClient'
import { ContextManager } from './ContextManager'
import systemPrompt from '../prompts/systemPrompt'
import { Message } from '../types/Message'

/**
 * Agent 主类，负责协调上下文管理、大模型调用及 ReAct 逻辑循环
 */
export class Agent {
  private llmClient: LLMClient
  private contextManager: ContextManager
  private maxRetries: number = 15 // 最大 ReAct 循环次数

  constructor(options?: { baseURL?: string; apiKey?: string; maxTokens?: number }) {
    this.llmClient = new LLMClient(options?.baseURL, options?.apiKey)
    this.contextManager = new ContextManager(options?.maxTokens)
    
    // 初始化上下文，加入系统提示词
    this.contextManager.addMessage({
      role: 'system',
      content: systemPrompt,
    } as any)
  }

  /**
   * 处理用户提问的主入口
   * @param userInput 用户输入内容
   * @returns 最终回答内容
   */
  async chat(userInput: string): Promise<string> {
    // 1. 将用户输入添加到上下文
    this.contextManager.addMessage({
      role: 'user',
      content: userInput,
    } as any)

    let loopCount = 0
    while (loopCount < this.maxRetries) {
      loopCount++

      // 2. 调用大模型进行推理和行动决策
      const messages = this.contextManager.getMessages()
      const response = await this.llmClient.chat(messages)

      // 3. 将模型的回复添加到上下文
      this.contextManager.addMessage({
        role: 'assistant',
        content: response,
      } as any)

      // 4. 解析模型的回复，判断是工具调用还是最终回答
      // 简单逻辑：如果包含 Final Answer 字样，则结束循环并返回
      if (response.includes('Final Answer:') || response.includes('最终回答：')) {
        return response.split(/Final Answer:|最终回答：/)[1]?.trim() || response
      }

      // 5. 检查是否需要调用工具 (待后续工具注册与执行逻辑完善)
      const actionMatch = response.match(/Action:\s*(\{.*\})/s)
      if (actionMatch) {
        try {
          // const action = JSON.parse(actionMatch[1])
          // TODO: 根据行动指令调用具体工具并获取观测结果
          const observation = '这是工具返回的模拟观测结果' 
          
          this.contextManager.addMessage({
            role: 'tool',
            content: observation,
            tool_call_id: 'temp_id', // 示例 ID
          } as any)
          
          continue // 继续下一轮循环
        } catch (e) {
          console.error('Action parsing error:', e)
        }
      }

      // 如果既没有工具调用也没有明确的最终回答，默认作为回答返回
      return response
    }

    return 'Agent 运行超过最大循环次数，无法获取回答。'
  }

  /**
   * 清除当前 Agent 的上下文记忆
   */
  clearContext() {
    this.contextManager.clear()
    this.contextManager.addMessage({
      role: 'system',
      content: systemPrompt,
    } as any)
  }
}
