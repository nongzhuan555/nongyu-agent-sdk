import { Tool } from '../types/Tool';
import { WebFetcher } from '@/tools/builtin/WebFetcher';
import { jiaowuNoticeTool, jiaowuCompetitionTool } from '@/tools/external/jiaowu';

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
  constructor() {
    this.toolMap = new Map();
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
}
