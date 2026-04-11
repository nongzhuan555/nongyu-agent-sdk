import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 封装的 HTTP 请求工具类，基于 Axios
 */
export class HttpClient {
  private instance: AxiosInstance
  private mode: 'dev' | 'prod' = 'dev' // 运行模式

  constructor(config?: AxiosRequestConfig & { mode?: 'dev' | 'prod' }) {
    this.mode = config?.mode || 'dev'
    this.instance = axios.create({
      timeout: 10000, // 默认超时时间 10 秒
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    })

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 在这里可以添加全局的请求处理逻辑，如添加 Token
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 在这里可以添加全局的响应处理逻辑
        return response
      },
      (error) => {
        // 统一错误处理
        if (this.mode === 'dev') {
          if (error.response) {
            console.error(`HTTP Error: ${error.response.status} - ${error.response.statusText}`)
          } else if (error.request) {
            console.error('HTTP Error: No response received')
          } else {
            console.error('HTTP Error:', error.message)
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * 发送 GET 请求
   * @param url 请求地址
   * @param config 请求配置
   * @param stream 是否启用流式响应
   */
  public get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    stream: boolean = false,
  ): Promise<T | AxiosResponse> {
    const requestConfig: AxiosRequestConfig = stream ? { ...config, responseType: 'stream' } : { ...config }
    const request = this.instance.get(url, requestConfig)
    
    if (stream) {
      return request as any
    }
    
    // 如果设置了特定的 responseType，则由调用方处理完整响应
    if (requestConfig.responseType && requestConfig.responseType !== 'json') {
      return request
    }
    
    return request.then((res) => res.data)
  }

  /**
   * 发送 POST 请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @param stream 是否启用流式响应
   */
  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stream: boolean = false,
  ): Promise<T | AxiosResponse> {
    const requestConfig: AxiosRequestConfig = stream ? { ...config, responseType: 'stream' } : { ...config }
    const request = this.instance.post(url, data, requestConfig)
    
    if (stream) {
      return request as any
    }
    
    // 如果设置了特定的 responseType，则由调用方处理完整响应
    if (requestConfig.responseType && requestConfig.responseType !== 'json') {
      return request
    }
    
    return request.then((res) => res.data)
  }

  /**
   * 获取原生的 Axios 实例，用于特殊场景（如流式输出）
   */
  public getInstance(): AxiosInstance {
    return this.instance
  }
}

// 默认导出单例或创建一个基础实例
const defaultHttp = new HttpClient()
export default defaultHttp
