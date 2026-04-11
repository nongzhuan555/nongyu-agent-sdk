export type ToolCall = {
    type: string,
    function: {
        name: string,
        params: {
            [key: string]: any
        }
    }
}
export type FinalAnswer = {
    type: string,
    content: string,
}
export type HandleStrategy = {
    [key: string]: (response: ToolCall | FinalAnswer) => any,
}
