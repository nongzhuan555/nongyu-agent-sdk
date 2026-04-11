import { HttpClient } from '../utils/http.js'
import { Message } from '../types/Message.js'
import { BASE_URL, API_KEY, MODEL, ENDPOINT } from '../../config/LLMConfig.js'

/**
 * LLM 客户端类，用于与大模型 API 进行交互
 */
export class LLMClient {
  private httpClient: HttpClient
  private mode: 'dev' | 'prod' = 'dev' // 运行模式
  private model: string = MODEL // 使用的模型

  constructor(options: { 
    baseURL?: string; 
    apiKey?: string; 
    mode?: 'dev' | 'prod';
    model?: string;
  }) {
    this.mode = options.mode || 'dev'
    this.model = options.model || MODEL
    this.httpClient = new HttpClient({
      baseURL: options.baseURL || BASE_URL,
      headers: {
        Authorization: `Bearer ${options.apiKey || API_KEY}`,
      },
      mode: this.mode,
    })
  }

  // 内部日志方法，仅在 dev 模式下输出
  private log(...args: any[]) {
    if (this.mode === 'dev') {
      console.log(...args)
    }
  }

  // 内部错误日志方法，仅在 dev 模式下输出
  private error(...args: any[]) {
    this.log(...args)
  }

  /**
   * 发送非流式聊天请求
   * @param messages 消息列表
   * @returns 模型回复内容
   */
  async chat(messages: Message[]): Promise<string> {
    try {
      const data = await this.httpClient.post<any>(ENDPOINT, {
        model: this.model, // 使用配置的模型
        messages,
      })
      return data.choices[0].message.content
    } catch (err) {
      this.error('LLM Chat Error:', err)
      throw err
    }
  }

  /**
   * 发送流式聊天请求
   * @param messages 消息列表
   * @param onToken 接收到 token 时的回调函数
   */
  async chatStream(messages: Message[], onToken: (token: string) => any): Promise<void> {
    try {
      const axiosInstance = this.httpClient.getInstance()
      const response = await axiosInstance.post(
        ENDPOINT,
        {
          model: this.model, // 使用配置的模型
          messages,
          stream: true,
        },
        {
          responseType: 'stream',
        },
      )

      // 维护一个缓冲区来处理流式数据，防止 JSON 解析错误
      let buffer = ''
      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        
        // 最后一行可能是不完整的，保留在缓冲区中
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine === '') continue
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices[0]?.delta?.content || ''
              if (token) {
                // 调用回调函数处理 token
                onToken(token)
              }
            } catch (e) {
              // 这里的解析错误通常是因为数据还不完整，但在有了 buffer 逻辑后应该很少发生
              this.error('Error parsing stream data:', e, 'Line content:', trimmedLine)
            }
          }
        }
      })

      return new Promise((resolve, reject) => {
        response.data.on('end', () => resolve())
        response.data.on('error', (err: Error) => reject(err))
      })
    } catch (err) {
      this.error('LLM Stream Chat Error:', err)
      throw err
    }
  }
}
