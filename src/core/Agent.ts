import { LLMClient } from './LLMClient'
import { ContextManager } from './ContextManager'
import { ToolManager } from './ToolManager'
import { initTools } from './ToolManager'
import composeSystemPrompt from '../prompts/systemPrompt'
import { BASE_URL, API_KEY } from '../../config/LLMConfig'
import eventSystem from './EventSystem'

/**
 * Agent 主类，负责协调上下文管理、大模型调用及 ReAct 逻辑循环
 */
export class Agent {
  private llmClient: LLMClient
  private contextManager: ContextManager
  private toolManager: ToolManager
  private maxRetries: number = 15 // 最大 ReAct 循环次数
  private baseURL: string = BASE_URL // 默认基础 URL，后续可根据需要修改
  private apiKey: string = API_KEY // 默认 API Key，后续可根据需要修改

  /**
   * 初始化 Agent
   * @param options 配置选项，包含 API Key、基础 URL、最大 ReAct 循环次数
   */
  constructor(options?: { baseURL?: string; apiKey?: string; maxTokens?: number }) {
    this.llmClient = new LLMClient(options?.baseURL || this.baseURL, options?.apiKey || this.apiKey)
    this.contextManager = new ContextManager(options?.maxTokens)
    this.toolManager = new ToolManager()
    initTools(this.toolManager) // 初始化工具

    // 初始化上下文，加入系统提示词，系统提示词中加入工具列表
    const systemPrompt = composeSystemPrompt(this.toolManager.getTools())
    this.contextManager.addMessage({
      role: 'system',
      content: systemPrompt,
    } as any)
  }

  /**
   * 处理用户提问的主入口
   * @param userInput 用户输入内容
   * @param stream 是否启用流式响应
   * @returns 最终回答内容
   */
  async chat(userInput: string, stream: boolean = false): Promise<string> {
    // 将用户输入添加到上下文
    this.contextManager.addMessage({
      role: 'user',
      content: userInput,
    } as any)

    // 触发开始事件
    eventSystem.emit('chat:start', { userInput })

    // 主循环
    let loopCount = 0
    while (loopCount++ < this.maxRetries) {
      // 触发循环开始事件
      eventSystem.emit('chat:loop:start', { loopCount })

      // 调用大模型进行推理和行动决策
      const messages = this.contextManager.getMessages()
      let response = ''

      if (stream) {
        // 流式响应模式
        await this.llmClient.chatStream(messages, (token) => {
          response += token
          // 触发流式 token 事件
          eventSystem.emit('chat:stream:token', { token, accumulatedResponse: response })
        })
      } else {
        // 非流式响应模式
        response = await this.llmClient.chat(messages)
      }

      // 触发模型回复完成事件
      eventSystem.emit('chat:response:complete', { response })

      // 将模型的回复添加到上下文
      this.contextManager.addMessage({
        role: 'assistant',
        content: response,
      } as any)

      // 解析模型的回复，判断是工具调用还是最终回答
      // 简单逻辑：如果包含 Final Answer 字样，则结束循环并返回
      if (response.includes('Final Answer:') || response.includes('最终回答：')) {
        const finalAnswer = response.split(/Final Answer:|最终回答：/)[1]?.trim() || response
        // 触发完成事件
        eventSystem.emit('chat:complete', { finalAnswer })
        return finalAnswer
      }

      // 检查是否需要调用工具 (待后续工具注册与执行逻辑完善)
      const actionMatch = response.match(/Action:\s*(\{.*\})/s)
      if (actionMatch) {
        try {
          // 触发工具调用开始事件
          eventSystem.emit('chat:tool:start', { actionMatch: actionMatch[1] })
          
          const action = JSON.parse(actionMatch[1])
          const toolName = action.name
          const toolArgs = action.arguments

          const tool = this.toolManager.getTool(toolName)
          let observation: any

          if (tool) {
            observation = await tool.function(toolArgs)
          } else {
            observation = `未找到名为 ${toolName} 的工具`
          }

          this.contextManager.addMessage({
            role: 'tool',
            content: typeof observation === 'string' ? observation : JSON.stringify(observation),
            tool_call_id: action.id || 'temp_id',
          } as any)

          // 触发工具调用完成事件
          eventSystem.emit('chat:tool:complete', { observation })

          continue // 继续下一轮循环
        } catch (e) {
          console.error('Action parsing error:', e)
          // 触发工具调用错误事件
          eventSystem.emit('chat:tool:error', { error: e })
        }
      }

      // 如果既没有工具调用也没有明确的最终回答，默认作为回答返回
      eventSystem.emit('chat:complete', { finalAnswer: response })
      return response
    }

    const errorMessage = 'Agent 运行超过最大循环次数，无法获取回答。'
    eventSystem.emit('chat:error', { message: errorMessage })
    return errorMessage
  }

  /**
   * 清除当前 Agent 的上下文记忆
   */
  clearContext() {
    this.contextManager.clear()
    const systemPrompt = composeSystemPrompt(this.toolManager.getTools())
    this.contextManager.addMessage({
      role: 'system',
      content: systemPrompt,
    } as any)
  }
}
