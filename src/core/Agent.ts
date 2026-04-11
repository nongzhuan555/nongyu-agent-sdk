import { LLMClient } from './LLMClient.js'
import { ContextManager } from './ContextManager.js'
import { ToolManager } from './ToolManager.js'
import { initTools } from './ToolManager.js'
import composeSystemPrompt from '../prompts/systemPrompt.js'
import { BASE_URL, API_KEY } from '../../config/LLMConfig.js'
import eventSystem from './EventSystem.js'
import { ToolCall, FinalAnswer, HandleStrategy } from '../types/Reply.js'

/**
 * Agent 主类，负责协调上下文管理、大模型调用及 ReAct 逻辑循环
 */
export class Agent {
  private llmClient: LLMClient
  private contextManager: ContextManager
  private toolManager: ToolManager
  private maxRetries: number = 15 // 最大 ReAct 循环次数
  private baseURL: string = BASE_URL // 默认基础 URL
  private apiKey: string = API_KEY // 默认 API Key
  private mode: 'dev' | 'prod' = 'dev' // 运行模式，可取值为 "dev" 或 "prod"

  // 内部日志方法，仅在 dev 模式下输出
  private log(...args: any[]) {
    if (this.mode === 'dev') {
      console.log(...args)
    }
  }

  // 处理工具调用
  private handleToolCall = async (parsedResponse: ToolCall): Promise<string> => {
    // 解析工具调用参数
    const { function: { name, params } } = parsedResponse
    
    // 触发工具调用开始事件
    eventSystem.emit('chat:tool:start', { actionMatch: JSON.stringify(parsedResponse.function) })
    
    this.log(`[Agent] 准备调用工具: ${name}, 参数:`, params)

    try {
      // 调用工具
      const toolResult = await this.toolManager.callTool(name, params)
      // 触发工具执行完成事件
      eventSystem.emit('chat:tool:complete', { observation: toolResult })
      
      // 更加结构化的观测反馈，引导模型进行下一步思考
      this.contextManager.addMessage({
        role: 'user',
        content: `### Observation (观测结果)\n工具 [${name}] 的执行结果如下：\n\n${typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)}\n\n请根据以上结果进行下一步分析或给出最终回答。`,
      } as any)
      
      return typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
    } catch (error: any) {
      // 触发工具执行错误事件
      eventSystem.emit('chat:tool:error', { error })
      const errorMessage = `工具调用失败: ${error.message || error}`
      
      this.contextManager.addMessage({
        role: 'user',
        content: errorMessage,
      } as any)
      
      return errorMessage
    }
  }

  // 处理最终回答，返回代表最终回复的字符串
  private handleFinalAnswer = (parsedResponse: FinalAnswer): string => {
    // 解析最终回答内容
    const { content } = parsedResponse
    // 触发最终回答事件
    eventSystem.emit('chat:complete', { finalAnswer: content })
    // 注意：不再重复添加 content 到上下文，因为完整的 JSON 回复已经在主循环中添加过了
    return content
  }

  // 大模型回复的处理策略映射
  private handleStrategy: HandleStrategy = {
    'action': async (response: any) => {
      return await this.handleToolCall(response as ToolCall)
    },
    'final_answer': (response: any) => {
      return this.handleFinalAnswer(response as FinalAnswer)
    },
  }

  /**
   * 初始化 Agent
   * @param options 配置选项，包含 API Key、基础 URL、最大 ReAct 循环次数、运行模式、模型名称
   */
  constructor(options?: { 
    baseURL?: string; 
    apiKey?: string; 
    maxTokens?: number; 
    mode?: 'dev' | 'prod';
    maxRetries?: number;
    model?: string;
  }) {
    this.mode = options?.mode || 'dev'
    this.maxRetries = options?.maxRetries || 15
    this.llmClient = new LLMClient({
      baseURL: options?.baseURL || this.baseURL,
      apiKey: options?.apiKey || this.apiKey,
      mode: this.mode,
      model: options?.model
    })
    this.contextManager = new ContextManager(options?.maxTokens, this.mode)
    this.toolManager = new ToolManager(this.mode)
    initTools(this.toolManager) // 初始化并注册所有可用工具

    // 初始化上下文，加入系统提示词（含工具列表）
    const systemPrompt = composeSystemPrompt(this.toolManager.getTools())
    this.contextManager.init(systemPrompt)
  }

  /**
   * 处理用户提问的主入口
   * @param userInput 用户输入内容
   * @param stream 是否启用流式响应
   * @returns 最终回答内容
   */
  async chat(userInput: string, stream: boolean = false): Promise<string> {
    // 1. 将用户问题添加到上下文
    this.contextManager.addMessage({
      role: 'user',
      content: userInput,
    } as any)

    // 触发开始事件
    eventSystem.emit('chat:start', { userInput })
    this.log(`[Agent] 开始处理用户问题: ${userInput}`)

    // 2. ReAct 主循环
    let loopCount = 0
    while (loopCount++ < this.maxRetries) {
      // 触发循环开始事件
      eventSystem.emit('chat:loop:start', { loopCount })
      this.log(`[Agent] 开始第 ${loopCount} 轮循环`)

      // 获取当前所有上下文消息
      const messages = this.contextManager.getMessages()
      let response = '' // 存储模型生成的原始文本

      try {
        if (stream) {
          // 流式响应模式
          await this.llmClient.chatStream(messages, (token) => {
            response += token
            // 触发流式 token 事件，方便前端实时展示
            eventSystem.emit('chat:stream:token', { token, accumulatedResponse: response })
          })
        } else {
          // 非流式响应模式
          response = await this.llmClient.chat(messages)
        }
      } catch (err: any) {
        const errorMsg = `LLM 调用过程发生错误: ${err.message}`
        eventSystem.emit('chat:error', { message: errorMsg })
        return errorMsg
      }

      // 触发模型回复完成事件
      eventSystem.emit('chat:response:complete', { response })

      // 将模型的完整回复添加到上下文（作为模型之前的思考记录）
      this.contextManager.addMessage({
        role: 'assistant',
        content: response,
      } as any)

      // 3. 解析模型回复并决定下一步行动
      let parsedResponse: ToolCall | FinalAnswer | null = null

      try {
        // 尝试解析 JSON
        parsedResponse = JSON.parse(response)
      } catch (e) {
        // 解析失败，告知模型格式不正确，引导其重新生成
        const feedback = '回复格式错误。请确保你的回复是一个可以被 JSON.parse() 直接解析的有效 JSON 对象。'
        eventSystem.emit('chat:error:notJson', { message: feedback })
        
        this.contextManager.addMessage({
          role: 'user',
          content: feedback,
        } as any)
        continue // 进入下一轮重试
      }

      // 4. 根据解析结果执行策略
      if (!parsedResponse) {
        const feedback = '回复内容为空，请提供有效的 JSON 回复。'
        this.contextManager.addMessage({
          role: 'user',
          content: feedback,
        } as any)
        continue
      }

      const { type } = parsedResponse as any
      const strategy = this.handleStrategy[type]

      if (!strategy) {
        const feedback = `未知的回复类型: ${type}，请按照规范回复 "action" 或 "final_answer"。`
        this.contextManager.addMessage({
          role: 'user',
          content: feedback,
        } as any)
        continue
      }

      // 执行对应的处理逻辑（工具调用或返回最终答案）
      const result = await strategy(parsedResponse)

      // 如果是最终答案，则直接返回给用户，结束循环
      if (type === 'final_answer') {
        return result as string
      }

      // 如果是工具调用 (action)，循环将继续，模型会基于 Observation 进行下一步推理
    }

    const timeoutMsg = 'Agent 运行超过最大循环次数，无法获取回答。'
    eventSystem.emit('chat:error:maxRetries', { message: timeoutMsg })
    return timeoutMsg
  }

  /**
   * 清除当前 Agent 的上下文记忆
   */
  clearContext() {
    const systemPrompt = composeSystemPrompt(this.toolManager.getTools())
    this.contextManager.init(systemPrompt)
  }
}
