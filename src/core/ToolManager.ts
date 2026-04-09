import { Tool } from '../types/Tool';

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