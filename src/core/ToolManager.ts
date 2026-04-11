import { Tool } from '../types/Tool.js';
import { WebFetcher } from '../tools/builtin/WebFetcher.js';
import { jiaowuNoticeTool, jiaowuCompetitionTool } from '../tools/external/jiaowu.js';

// 初始化工具
export const initTools = (toolManager: ToolManager) => {
  // 注册内置工具
  toolManager.registerTool(WebFetcher)
  // 注册外部工具
  // 教务系统相关工具
  toolManager.registerTool(jiaowuNoticeTool)
  toolManager.registerTool(jiaowuCompetitionTool)
  // 其他外部工具...
  // ...
}

export class ToolManager {
  private toolMap: Map<string, Tool>;
  private mode: 'dev' | 'prod' = 'dev'; // 运行模式

  constructor(mode: 'dev' | 'prod' = 'dev') {
    this.toolMap = new Map();
    this.mode = mode;
  }

  // 内部日志方法，仅在 dev 模式下输出
  private log(...args: any[]) {
    if (this.mode === 'dev') {
      console.log(...args)
    }
  }

  // 内部错误日志方法，仅在 dev 模式下输出
  private error(...args: any[]) {
    if (this.mode === 'dev') {
      console.error(...args)
    }
  }

  registerTool(tool: Tool) {
    this.toolMap.set(tool.name, tool);
  }
  unregisterTool(name: string) {
    this.toolMap.delete(name);
  }
  getTool(name: string): Tool | undefined {
    return this.toolMap.get(name);
  }
  getTools(): Tool[] {
    return [...this.toolMap.values()];
  }
  // TODO: 核心函数，后续还得优化逻辑
  async callTool(name: string, params: Record<string, any> = {}): Promise<string> {
    // 获取工具对应的函数
    const tool = this.getTool(name);
    if (!tool) {
      return Promise.reject(`工具 ${name} 不存在`);
    }

    if (!tool.function) {
      return Promise.reject(`工具 ${name} 不存在可执行函数`);
    }

    try {
      // 确保 params 是对象，并调用工具函数
      const result = await tool.function(params || {});
      // 如果结果不是字符串，进行序列化
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    } catch (err: any) {
      this.error(`[ToolManager] 工具调用发生异常 [${name}]:`, err);
      throw err;
    }
  }
}
