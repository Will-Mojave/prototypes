/* ===== AICC 智能体模块库 · 演示数据 ===== */

// 公共模块库（首版仅 提示词 / 提示词＋工具 两类）
const MODULE_LIBRARY = [
  {
    id: 'mod_phone',
    name: '手机号收集与校验',
    type: 'prompt_tool',
    desc: '引导用户提供手机号，复述确认并完成校验',
    version: 'v1.2',
    maintainer: '语音平台组',
    source: '平台模块',
    varName: '手机号收集与校验',
    varKey: 'modules.mobile_collection.prompt',
    tools: [
      { id: 'tool_phone_check', name: '手机号格式校验', desc: '用于校验手机号位数和格式' }
    ],
    prompt: '当需要获取用户手机号时，先说明用途并请求用户提供号码。\n1. 用户报出手机号后，必须完整复述一遍号码，请用户确认是否正确。\n2. 用户确认后，调用「手机号格式校验」工具校验号码位数和格式。\n3. 校验不通过时，礼貌说明号码可能有误，引导用户重新提供，不得自行猜测或修改号码。\n4. 校验通过后，再继续后续业务流程。'
  },
  {
    id: 'mod_human',
    name: '转人工请求表达',
    type: 'prompt',
    desc: '识别用户转人工意图，安抚情绪并规范完成转接话术',
    version: 'v1.0',
    maintainer: '语音平台组',
    source: '平台模块',
    varName: '转人工请求表达',
    varKey: 'modules.human_transfer.prompt',
    tools: [],
    prompt: '当用户明确要求转人工，或连续两次未解决用户问题时：\n1. 不要阻拦或反复挽留，先回应用户情绪："理解您的心情，我马上为您转接人工客服。"\n2. 转接前用一句话概括用户问题，告知用户会同步给人工客服，避免重复描述。\n3. 转接等待期间告知预计等待时长，并致歉。'
  },
  {
    id: 'mod_comfort',
    name: '投诉安抚',
    type: 'prompt',
    desc: '用户情绪激动或表达投诉时，先安抚再处理，规范致歉口径',
    version: 'v1.1',
    maintainer: '客服运营组',
    source: '平台模块',
    varName: '投诉安抚',
    varKey: 'modules.complaint_comfort.prompt',
    tools: [],
    prompt: '当用户表达不满、投诉或情绪明显激动时：\n1. 先共情，不急于解释原因："非常理解您的感受，给您带来了不便，实在抱歉。"\n2. 不与用户争辩，不推卸责任，不使用"您先别急"等压制性表达。\n3. 情绪缓和后，复述用户核心诉求并确认，再给出处理方案与时限。\n4. 无法当场解决的，明确告知跟进方式和回复时间。'
  },
  {
    id: 'mod_order',
    name: '订单查询引导',
    type: 'prompt_tool',
    desc: '收集订单信息并查询订单状态，规范播报查询结果',
    version: 'v2.0',
    maintainer: '工单平台组',
    source: '平台模块',
    varName: '订单查询引导',
    varKey: 'modules.order_query.prompt',
    tools: [
      { id: 'tool_order_query', name: '订单查询', desc: '按手机号或订单号查询订单状态与物流信息' }
    ],
    prompt: '当用户询问订单进度、物流或发货情况时：\n1. 先获取用户手机号或订单号，复述确认后调用「订单查询」工具。\n2. 播报结果时先说结论（当前状态），再补充关键时间节点。\n3. 查询无结果时，确认信息是否准确，仍无结果则引导转人工，不得编造订单状态。'
  },
  {
    id: 'mod_address',
    name: '地址收集与确认',
    type: 'prompt_tool',
    desc: '引导用户提供收货地址，解析结构化后复述确认',
    version: 'v1.0',
    maintainer: '语音平台组',
    source: '平台模块',
    varName: '地址收集与确认',
    varKey: 'modules.address_collect.prompt',
    tools: [
      { id: 'tool_address_parse', name: '地址解析', desc: '将自然语言地址解析为省市区与详细地址结构' }
    ],
    prompt: '需要收集收货地址时：\n1. 引导用户一次性说出完整地址（省市区＋详细地址）。\n2. 调用「地址解析」工具结构化地址，解析失败时逐项追问缺失部分。\n3. 完整复述地址请用户确认，确认前不得提交。'
  },
  {
    id: 'mod_closing',
    name: '结束语与满意度引导',
    type: 'prompt',
    desc: '通话结束前确认问题已解决，规范结束语与满意度邀评',
    version: 'v1.3',
    maintainer: '客服运营组',
    source: '平台模块',
    varName: '结束语与满意度引导',
    varKey: 'modules.closing.prompt',
    tools: [],
    prompt: '通话结束前：\n1. 确认用户是否还有其他问题："请问还有其他可以帮您的吗？"\n2. 无其他问题时，使用规范结束语："感谢您的来电，祝您生活愉快。"\n3. 引导满意度评价，仅提示一次，用户拒绝时不再重复。'
  }
];

// 智能体卡片数据（列表页）
const AGENT_CARDS = [
  { avatar:'cat', icon:'🐱', title:'宠物险-大模型质检', badge:'CHATFLOW', badgeType:'chatflow', meta:'文字机器人/质检分组', desc:'宠物险呼入质检Chatflow，21项质检分满分100分' },
  { avatar:'bot', icon:'🤖', title:'智能填单测试_8008813', badge:'CHATFLOW', badgeType:'chatflow', meta:'工单', desc:'测试用 chatflow：备分支+知识库+工具生成（用户8008813）' },
  { avatar:'kid', icon:'🧒', title:'智能呼入机器人（儿童手表）', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'你是三六零智慧生活的客服专家安安。处理消费者对于三六零儿童手表的售后问题，服务于购买三六零智慧生活产品的C端用户。' },
  { avatar:'bot', icon:'🤖', title:'LS文本机器人', badge:'CHATFLOW', badgeType:'chatflow', meta:'文字机器人/郑方/5天前', desc:'文本机器人实时交互' },
  { avatar:'bot', icon:'🤖', title:'【用户数据关联】记忆转换-V2', badge:'CHATFLOW', badgeType:'chatflow', meta:'刘云/建波', desc:'基于短期记忆数据进行问题抽取总结，转换成长期记忆，支持动态传入相关参数' },
  { avatar:'car', icon:'🚗', title:'智能呼入机器人（车品）', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'处理消费者对于360记录仪产品的售前、售中、售后问题，服务于购买三六零智慧生活产品的C端用户。' },
  { avatar:'cat', icon:'🐱', title:'奇虎健安-呼入-摄像机(V1)', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'处理消费者对于摄像机产品的售前、售中、售后问题。整体服务流程为用户呼入-意图分发。' },
  { avatar:'lock', icon:'🔒', title:'奇虎健安-呼入门锁', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'门锁客服。解决用户关于门锁的使用、故障、安装等方面的问题，不涉及任何售前订单问题。' },
  { avatar:'cat', icon:'🐱', title:'奇虎健安-呼入-门铃（V1）', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'处理消费者对于门铃产品的售前、售中、售后问题。整体服务流程为用户呼入-意图分发。' },
  { avatar:'cat', icon:'🐱', title:'奇虎健安-呼入-分流（V2）', badge:'AGENT', badgeType:'agent', meta:'呼入机器人/刘云/3天前', desc:'处理消费者对于智能终端产品的售前、售中、售后问题。整体服务流程为用户电话呼入-意图分发。' }
];
