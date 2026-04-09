// 教务系统相关工具
import { jiaowuNotice,jiaowuCompetition } from "nongyu-jiaowu";
import { Tool } from "@/types/Tool";
const jiaowuNoticeTool: Tool = {
    params: jiaowuNotice.registerInfo.params,
    description: jiaowuNotice.registerInfo.description,
    name: jiaowuNotice.registerInfo.name,
    function: jiaowuNotice,
}
const jiaowuCompetitionTool: Tool = {
    params: jiaowuCompetition.registerInfo.params,
    description: jiaowuCompetition.registerInfo.description,
    name: jiaowuCompetition.registerInfo.name,
    function: jiaowuCompetition,
}
export {
    jiaowuNoticeTool,
    jiaowuCompetitionTool,
}
