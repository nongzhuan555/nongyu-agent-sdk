// 大模型默认配置
export const BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
export const ENDPOINT = '/chat/completions'
// TODO：后续思考这个架构，如果要提供默认key的话应该要通过搭建一个服务器来中转请求
export const API_KEY = '9a71dd4699ad40589491316d69fe06e5.fZmosWLX2fIVxwRA' // 暂时不考虑生产环境的泄漏问题，后续优化
export const MODEL = 'glm-4'