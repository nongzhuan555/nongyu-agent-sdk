import { Agent } from './src/core/Agent'
import eventSystem from './src/core/EventSystem'

/**
 * 测试 Agent 的内置工具调用能力
 */
async function testAgentBuiltinTool() {
  console.log('--------------------------------------------------')
  console.log('🚀 [测试开始] 开始测试 Agent 内置工具 (WebFetcher)')
  console.log('--------------------------------------------------')

  const agent = new Agent()

  // 监听事件以观察 ReAct 过程
  eventSystem.on('chat:tool:start', ({ actionMatch }) => {
    console.log('🛠️ [工具调用开始]:', actionMatch)
  })

  eventSystem.on('chat:tool:complete', ({ observation }) => {
    console.log('✅ [工具调用完成] 观测结果长度:', observation.length)
  })

  const userInput = '帮我访问一下百度 (https://www.baidu.com) 并告诉它的 HTML 标题是什么。'
  console.log('📝 [用户输入]:', userInput)

  try {
    const finalAnswer = await agent.chat(userInput)
    console.log('\n--------------------------------------------------')
    console.log('🤖 [Agent 最终回答]:')
    console.log(finalAnswer)
    console.log('--------------------------------------------------')
  } catch (error: any) {
    console.log('❌ [测试失败]')
    console.log('错误信息:', error.message)
  }

  console.log('🔚 [测试结束]')
}

testAgentBuiltinTool().catch((err) => {
  console.error('😱 [程序异常崩溃]:', err)
})
