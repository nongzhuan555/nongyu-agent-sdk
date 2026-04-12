import { Tool } from '../../types/Tool.js'
import http from '../../utils/http.js'
import iconv from 'iconv-lite'
import { AxiosResponse } from 'axios'

/**
 * Agent 内置工具：网页内容获取
 * 接收一个 URL 并返回该页面的 HTML 内容
 */
export const WebFetcher: Tool = {
  name: 'web_fetcher',
  description: '获取指定 URL 的网页 HTML 内容，自动处理编码转换（如 GB2312）。',
  params: {
    name: 'url',
    type: 'string',
    description: '要获取的网页 URL',
    required: true,
  },
  function: async ({ url }: { url: string }) => {
    try {
      // 使用 arraybuffer 以便后续根据实际编码进行转换
      const response = await http.get<any>(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        responseType: 'arraybuffer',
        timeout: 15000,
      }) as AxiosResponse

      const buffer = Buffer.from(response.data)
      const contentType = response.headers['content-type'] || ''
      
      // 默认编码为 utf-8
      let encoding = 'utf-8'
      
      // 尝试从 Content-Type 响应头中提取编码信息
      const charsetMatch = contentType.match(/charset=([\w-]+)/i)
      if (charsetMatch) {
        encoding = charsetMatch[1].toLowerCase()
      } else {
        // 如果响应头没有，则尝试从 HTML 内容中通过正则匹配
        const htmlSnippet = buffer.slice(0, 1024).toString('ascii')
        const metaCharsetMatch = htmlSnippet.match(/<meta[^>]+charset=["']?([\w-]+)["']?/i)
        if (metaCharsetMatch) {
          encoding = metaCharsetMatch[1].toLowerCase()
        }
      }

      // 如果检测到编码且 iconv-lite 支持，则使用检测到的编码进行转换
      if (encoding && iconv.encodingExists(encoding)) {
        return iconv.decode(buffer, encoding)
      }

      // 默认尝试用 utf-8 解码
      return iconv.decode(buffer, 'utf-8')
    } catch (error: any) {
      console.error(`[WebFetcher] 无法获取网页: ${url}`, error.message)
      throw new Error(`获取网页内容失败: ${error.message}`)
    }
  }
}
