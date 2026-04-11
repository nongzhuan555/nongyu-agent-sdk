# nongyu-agent-sdk API 文档

本文档详细介绍了 `nongyu-agent-sdk` 的主要类、方法及事件系统。

---

## **Agent 类**

`Agent` 是 SDK 的核心类，负责协调上下文管理、大模型调用及 ReAct 逻辑循环。

### **1. 构造函数 `constructor`**

初始化 Agent 实例。

**参数：**
- `options` (可选): 配置对象
    - `baseURL` (string): LLM API 的基础地址。
    - `apiKey` (string): LLM API 的密钥。
    - `maxTokens` (number): 上下文管理的最大 Token 限制（默认 4000）。
    - `mode` ('dev' | 'prod'): 运行模式。'dev' 模式下会输出内部调试日志。

**使用示例：**
```typescript
import { Agent } from 'nongyu-agent-sdk';

const agent = new Agent({
  baseURL: 'https://api.example.com/v1',
  apiKey: 'your-api-key',
  mode: 'dev'
});
```

### **2. `chat` 方法**

处理用户提问的主入口，执行 ReAct 思考循环并返回最终答案。

**参数：**
- `userInput` (string): 用户的输入文本。
- `stream` (boolean, 可选): 是否启用流式响应（默认 false）。

**返回值：**
- `Promise<string>`: 最终的回答内容。

**使用示例：**
```typescript
const answer = await agent.chat('帮我查一下最近的教务通知', true);
console.log('Final Answer:', answer);
```

### **3. `clearContext` 方法**

清空当前 Agent 的上下文记忆（保留系统提示词）。

**使用示例：**
```typescript
agent.clearContext();
```

---

## **事件系统 (EventSystem)**

SDK 内置了一个基于 `mitt` 的事件系统，允许开发者监听 Agent 的内部执行状态。可以通过 `import eventSystem from 'nongyu-agent-sdk'` 获取单例。

### **核心方法**
- `on(event, handler)`: 订阅事件。
- `once(event, handler)`: 订阅事件（仅触发一次）。
- `off(event, handler)`: 取消订阅。

### **事件列表及含义**

| 事件名称 | 触发时机 | 参数说明 |
| :--- | :--- | :--- |
| `chat:start` | `chat()` 方法开始执行时触发 | `{ userInput: string }` - 用户原始输入 |
| `chat:loop:start` | 每一轮 ReAct 循环开始时触发 | `{ loopCount: number }` - 当前循环轮次 |
| `chat:stream:token` | 流式响应模式下，接收到新 token 时触发 | `{ token: string, accumulatedResponse: string }` - 当前 token 及累计回复内容 |
| `chat:response:complete` | 模型完成当前轮次的回复时触发 | `{ response: string }` - 模型回复的完整 JSON 字符串 |
| `chat:tool:start` | 准备调用工具（Action）时触发 | `{ actionMatch: string }` - 匹配到的工具调用信息（JSON 字符串） |
| `chat:tool:complete` | 工具执行成功并返回结果时触发 | `{ observation: any }` - 工具返回的原始观测数据 |
| `chat:tool:error` | 工具执行发生错误时触发 | `{ error: any }` - 错误对象或错误信息 |
| `chat:complete` | Agent 给出最终回答（Final Answer）时触发 | `{ finalAnswer: string }` - 最终给用户的回复内容 |
| `chat:error` | LLM 调用过程发生网络或 API 错误时触发 | `{ message: string }` - 错误描述信息 |
| `chat:error:notJson` | 模型回复内容无法被解析为 JSON 时触发 | `{ message: string }` - 错误提示信息 |
| `chat:error:maxRetries` | Agent 达到最大循环次数仍未给出最终答案时触发 | `{ message: string }` - 错误提示信息 |

---

## **完整集成示例**

```typescript
import { Agent } from 'nongyu-agent-sdk';
import eventSystem from 'nongyu-agent-sdk';

async function main() {
  const agent = new Agent();

  // 监听思考过程
  eventSystem.on('chat:loop:start', ({ loopCount }) => {
    console.log(`--- 第 ${loopCount} 轮思考 ---`);
  });

  // 监听工具调用
  eventSystem.on('chat:tool:start', ({ actionMatch }) => {
    console.log(`正在执行工具: ${actionMatch}`);
  });

  // 监听流式输出
  eventSystem.on('chat:stream:token', ({ token }) => {
    process.stdout.write(token);
  });

  const result = await agent.chat('帮我查一下教务通知', true);
  console.log('\n任务完成:', result);
}

main();
```
