import { Agent } from '../src/core/Agent.js'
import eventSystem from '../src/core/EventSystem.js'
import * as readline from 'readline'

/**
 * 命令行交互测试 Agent 主类
 */
async function runInteractiveTest() {
  console.log('==================================================')
  console.log('🤖 农屿 Agent SDK 交互测试终端')
  console.log('输入 "exit" 或 "quit" 退出测试')
  console.log('==================================================\n')

  const agent = new Agent()

  // --- 注册事件监听以展示 Agent 内部思考过程 ---

  eventSystem.on('chat:start', ({ userInput }) => {
    console.log(`\n──────────────────────────────────────────────────`)
    console.log(`👤 [用户]: ${userInput}`)
  })

  eventSystem.on('chat:loop:start', ({ loopCount }) => {
    console.log(`\n⏳ [第 ${loopCount} 轮推理开始...]`)
  })

  eventSystem.on('chat:stream:token', ({ token }) => {
    // 流式输出时，实时在控制台打印 token
    process.stdout.write(token)
  })

  eventSystem.on('chat:response:complete', ({ response }) => {
    // 非流式输出或流式结束后的完整回复（含 Thought/Action 等）
    // 如果不是流式，则在这里打印
    // console.log(`\n🤖 [模型回复]:\n${response}`)
  })

  eventSystem.on('chat:tool:start', ({ actionMatch }) => {
    console.log(`\n🛠️ [执行工具]: 正在解析并调用工具...`)
    console.log(`📦 [Action]: ${actionMatch}`)
  })

  eventSystem.on('chat:tool:complete', ({ observation }) => {
    console.log(`\n👁️ [观测结果]: 获取到数据 (长度: ${observation.length})`)
    // 预览前 100 个字符
    console.log(`📄 [内容预览]: ${observation?.slice(0, 100)}...`)
  })

  eventSystem.on('chat:tool:error', ({ error }) => {
    console.log(`\n❌ [工具执行错误]:`, error)
  })

  eventSystem.on('chat:complete', ({ finalAnswer }) => {
    console.log(`\n✅ [最终回答]:`)
    console.log(`──────────────────────────────────────────────────`)
    console.log(finalAnswer)
    console.log(`──────────────────────────────────────────────────`)
  })

  eventSystem.on('chat:error', ({ message }) => {
    console.log(`\n😱 [异常错误]: ${message}`)
  })

  // --- 创建命令行读取接口 ---

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '👉 请输入你的问题: ',
  })

  rl.prompt()

  rl.on('line', async (line) => {
    const input = line.trim()

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 退出测试，再见！')
      process.exit(0)
    }

    if (input) {
      try {
        // 调用 Agent 进行对话
        // 这里可以切换是否开启流式模式：true 为流式，false 为非流式
        await agent.chat(input, true) 
      } catch (err) {
        console.error('\n💥 发生未捕获错误:', err)
      }
    }

    console.log('\n')
    rl.prompt()
  }).on('close', () => {
    console.log('\n👋 退出测试，再见！')
    process.exit(0)
  })
}

// 启动交互测试
runInteractiveTest().catch((err) => {
  console.error('😱 [系统级崩溃]:', err)
})
