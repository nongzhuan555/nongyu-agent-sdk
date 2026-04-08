enum roleType {
    system = "system", // 系统提示词
    user = "user", // 用户提示词
    assistant = "assistant", // 大模型回复
    tool = "tool" // 工具调用
}
export type Message = {
    role: roleType.system | roleType.user | roleType | roleType.assistant | roleType.tool, // 角色
    content: string, // 内容
    tool_call_id?: string // 工具调用ID，用于工具调用
}