import { WebFetcher } from './src/tools/builtin/WebFetcher'

/**
 * 单独测试 WebFetcher 工具
 * 测试 URL: 四川农业大学教务处通知页面
 */
async function runTest() {
  console.log('--------------------------------------------------')
  console.log('🚀 [测试开始] 开始测试 WebFetcher 工具')
  console.log('--------------------------------------------------')

  const testUrl = 'https://jiaowu.sicau.edu.cn/web/web/web/gwshenshow_x_2019.asp?bianhao=6898'
  console.log(`📝 [请求 URL]: ${testUrl}`)
  console.log('⏳ [请求中] 请稍候...')

  try {
    const startTime = Date.now()
    // 直接调用 WebFetcher 的执行函数
    const html = await WebFetcher.function({ url: testUrl })
    const duration = Date.now() - startTime

    console.log('✅ [响应成功] 耗时:', duration, 'ms')
    console.log('📊 [数据概览] HTML 长度:', html.length, '字符')
    console.log('\n📄 [HTML 内容预览 - 前 500 个字符]:')
    console.log('--------------------------------------------------')
    console.log(html)
    console.log('--------------------------------------------------')

    // 简单检查是否包含关键字
    if (html.includes('2026届毕业生') || html.includes('教师资格认定')) {
      console.log('✨ [内容验证] 页面内容匹配预期关键字。')
    } else {
      console.log('⚠️ [内容提示] 页面中未发现预期关键字，请检查返回内容是否正确。')
    }
  } catch (error: any) {
    console.log('❌ [测试失败]')
    console.log('错误信息:', error.message)
    if (error.stack) {
      console.log('堆栈跟踪:', error.stack)
    }
  }

  console.log('--------------------------------------------------')
  console.log('🔚 [测试结束]')
  console.log('--------------------------------------------------')
}

// 执行测试
runTest().catch((err) => {
  console.error('😱 [程序异常崩溃]:', err)
})
