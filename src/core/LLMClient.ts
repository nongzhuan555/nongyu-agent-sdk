import { HttpClient } from '../utils/http'
import { Message } from '../types/Message'
import { BASE_URL, API_KEY } from '../../config/LLMConfig'

/**
 * LLM 客户端类，用于与大模型 API 进行交互
 */
export class LLMClient {
  private httpClient: HttpClient

  constructor(baseURL: string = BASE_URL, apiKey: string = API_KEY) {
    this.httpClient = new HttpClient({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  /**
   * 发送非流式聊天请求
   * @param messages 消息列表
   * @returns 模型回复内容
   */
  async chat(messages: Message[]): Promise<string> {
    try {
      const data = await this.httpClient.post<any>('/chat/completions', {
        model: 'glm-4', // 默认使用 GLM-4
        messages,
      })
      return data.choices[0].message.content
    } catch (error) {
      console.error('LLM Chat Error:', error)
      throw error
    }
  }

  /**
   * 发送流式聊天请求
   * @param messages 消息列表
   * @param onToken 接收到 token 时的回调函数
   */
  async chatStream(messages: Message[], onToken: (token: string) => void): Promise<void> {
    try {
      const axiosInstance = this.httpClient.getInstance()
      const response = await axiosInstance.post(
        '/chat/completions',
        {
          model: 'glm-4',
          messages,
          stream: true,
        },
        {
          responseType: 'stream',
        },
      )

      // 在浏览器环境下，response.data 是 ReadableStream
      // 在 Node.js 环境下，response.data 是 IncomingMessage
      // 这里暂时按 Node.js 风格处理，后续可根据需求适配浏览器
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n')
        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const token = parsed.choices[0]?.delta?.content || ''
              if (token) {
                onToken(token)
              }
            } catch (e) {
              console.error('Error parsing stream data:', e)
            }
          }
        }
      })

      return new Promise((resolve, reject) => {
        response.data.on('end', () => resolve())
        response.data.on('error', (err: Error) => reject(err))
      })
    } catch (error) {
      console.error('LLM Stream Chat Error:', error)
      throw error
    }
  }
}
