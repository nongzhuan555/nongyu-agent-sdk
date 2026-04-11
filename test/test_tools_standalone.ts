import { WebFetcher } from '../src/tools/builtin/WebFetcher.js'
import { jiaowuNoticeTool, jiaowuCompetitionTool } from '../src/tools/external/jiaowu.js'

/**
 * 独立测试所有工具的功能，确保它们在不依赖 Agent 的情况下能正常运行
 */
async function testToolsStandalone() {
  console.log('==================================================')
  console.log('🧪 开始独立测试工具功能')
  console.log('==================================================\n')

  // 1. 测试 WebFetcher
  console.log('--- [1/3] 测试 WebFetcher ---')
  try {
    const params = { url: 'https://www.baidu.com' }
    console.log(`📝 模拟 Agent 调用: WebFetcher.function(${JSON.stringify(params)})`)
    const html = await WebFetcher.function(params)
    console.log(`✅ 成功获取 HTML，内容长度: ${html.length}`)
  } catch (error: any) {
    console.error(`❌ WebFetcher 测试失败: ${error.message}`)
  }

  // 2. 测试 jiaowu_notice
  console.log('\n--- [2/3] 测试 jiaowu_notice ---')
  try {
    const params = {}
    console.log(`📝 模拟 Agent 调用: jiaowuNoticeTool.function(${JSON.stringify(params)})`)
    const notices = await jiaowuNoticeTool.function(params)
    console.log('✅ 成功获取通知数据 (前 100 字):')
    console.log(typeof notices === 'string' ? notices.slice(0, 100) : JSON.stringify(notices).slice(0, 100))
  } catch (error: any) {
    console.error(`❌ jiaowu_notice 测试失败: ${error.message}`)
  }

  // 3. 测试 jiaowu_competition
  console.log('\n--- [3/3] 测试 jiaowu_competition ---')
  try {
    const params = {}
    console.log(`📝 模拟 Agent 调用: jiaowuCompetitionTool.function(${JSON.stringify(params)})`)
    const competitions = await jiaowuCompetitionTool.function(params)
    console.log('✅ 成功获取竞赛数据 (前 100 字):')
    console.log(typeof competitions === 'string' ? competitions.slice(0, 100) : JSON.stringify(competitions).slice(0, 100))
  } catch (error: any) {
    console.error(`❌ jiaowu_competition 测试失败: ${error.message}`)
  }

  console.log('\n==================================================')
  console.log('🔚 独立工具测试完成')
  console.log('==================================================')
}

testToolsStandalone().catch(err => console.error('💥 测试过程发生崩溃:', err))
