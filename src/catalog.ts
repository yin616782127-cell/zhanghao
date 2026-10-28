import type { ChainStep, CityRow, PermKey, RoleConfig, RoleKey, TicketTypeInfo, Tier, YinguanEnterprise } from './types';

/** 演示时钟。逾期、48 小时验收都相对这一时刻计算，避免随真实钟点漂移。 */
export const NOW = '2026-10-28 15:00';

/**
 * 文中待接收、执行中的 SLA 只写了「x 小时」。
 * 验收停留 48 小时是文档写明的。黄/红执行阈值用演示值，界面会标明。
 */
export const SLA_RECEIVE_HOURS = 8;
export const SLA_HANDLE_HOURS = 24;
export const SLA_REVIEW_HOURS = 48;

export const DISPATCH_CODES = ['T01', 'T02', 'T07', 'T08', 'T12', 'T14', 'T15'] as const;

export const GRADE_TAGS = [
  '总分战',
  '付费客户',
  '国央企／上市',
  '招行价值标签',
  '定开客户',
  '行业头部／专精特新',
  '分行重点客户',
  '机构部客户',
] as const;

export const INDUSTRIES = [
  '农、林、牧、渔业',
  '采矿业',
  '制造业',
  '电力、热力、燃气及水生产和供应业',
  '建筑业',
  '批发和零售业',
  '交通运输、仓储和邮政业',
  '住宿和餐饮业',
  '信息传输、软件和信息技术服务业',
  '金融业',
  '房地产业',
  '租赁和商务服务业',
  '科学研究和技术服务业',
  '水利、环境和公共设施管理业',
  '居民服务、修理和其他服务业',
  '教育',
  '卫生和社会工作',
  '文化、体育和娱乐业',
  '公共管理、社会保障和社会组织',
  '国际组织',
];

export const PROJECT_PHASES = ['项目开通', '实施计划登记', '实施执行', '实施复核', '试运行', '交付结项'] as const;

export const FEEDBACK_NODES = [
  {
    id: 'P0-P1',
    name: '第一节点反馈',
    phase: '实施计划登记',
    required: ['需求调研及客户确认', '项目实施方案', '项目排期计划表'],
  },
  { id: 'P3', name: '第二节点反馈', phase: '实施执行', required: [] as string[] },
  { id: 'P4-P5', name: '第三节点反馈', phase: '试运行', required: ['实施交付功能清单'] },
  { id: 'P6', name: '结项确认', phase: '交付结项', required: ['客户验收确认单', '客户满意度反馈'] },
];

export const ACTORS: Record<RoleKey, { userId: string; label: string }> = {
  frontline: { userId: 'u-limin', label: '一线实施顾问 · 李敏' },
  leader: { userId: 'u-zhouheng', label: '分行组长 · 周衡' },
  central: { userId: 'u-chenke', label: '集中运营 · 陈可' },
  director: { userId: 'u-zhaoning', label: '部门总 · 赵宁' },
};

export const PERM_LABELS: { key: PermKey; label: string }[] = [
  { key: 'createDispatch', label: '创建下发工单' },
  { key: 'createMarketing', label: '创建 CBS 营销工单（T01）' },
  { key: 'createFrontline', label: '创建直联/远程实施工单' },
  { key: 'createMaster', label: '发起项目实施主单（PE01）' },
  { key: 'executeDispatch', label: '接收并执行下发' },
  { key: 'aiConvert', label: '售后 AI 问答转工单' },
  { key: 'batchAssign', label: '批量派单' },
  { key: 'batchTransfer', label: '批量转派' },
  { key: 'transferOwner', label: '批量移交管护人' },
  { key: 'reviewTier', label: '复核实施定级' },
  { key: 'followUp', label: '超时跟进' },
  { key: 'urge', label: '催办' },
  { key: 'accept', label: '验收下发工单' },
  { key: 'advanceImpl', label: '推进实施子工单' },
  { key: 'addLog', label: '登记服务日志' },
  { key: 'simulateSystem', label: '模拟系统触发工单' },
];

function perms(on: PermKey[]): Record<PermKey, boolean> {
  const all = Object.fromEntries(PERM_LABELS.map((item) => [item.key, false])) as Record<PermKey, boolean>;
  on.forEach((key) => {
    all[key] = true;
  });
  return all;
}

export const DEFAULT_ROLE_CONFIG: Record<RoleKey, RoleConfig> = {
  frontline: {
    perms: perms(['createFrontline', 'createMaster', 'executeDispatch', 'aiConvert', 'addLog', 'advanceImpl']),
  },
  leader: {
    perms: perms([
      'createMarketing',
      'createFrontline',
      'createMaster',
      'executeDispatch',
      'transferOwner',
      'reviewTier',
      'followUp',
      'urge',
      'aiConvert',
      'addLog',
      'advanceImpl',
    ]),
  },
  central: {
    perms: perms([
      'createDispatch',
      'createMaster',
      'batchAssign',
      'batchTransfer',
      'followUp',
      'urge',
      'accept',
      'advanceImpl',
      'addLog',
      'simulateSystem',
    ]),
  },
  director: {
    perms: perms(['createDispatch', 'followUp', 'urge', 'accept', 'simulateSystem']),
  },
};

export const TICKET_TYPES: TicketTypeInfo[] = [
  { code: 'T01', name: 'CBS营销', stage: '营销', flow: '分行→一线', from: '分行', to: '一线顾问', proof: '拜访日志+客户KYC', scene: '分行识别潜在客户，指派一线拜访', group: '下发', create: 'dispatch' },
  { code: 'T02', name: '新品(功能)推介任务', stage: '营销/经营', flow: '下发', from: '部门', to: '一线顾问', proof: '服务日志+客户意向记录', scene: '新产品/功能上线，总部统一推广', group: '下发', create: 'dispatch' },
  { code: 'T03', name: '直联上线工单', stage: '实施', flow: '一线→集中', from: '一线顾问', to: '集中实施团队', proof: '实施交付确认', scene: '直联实施（测试、上线），也可作为主单子工单', group: '一线', create: 'frontline' },
  { code: 'T04', name: '初始化实施工单', stage: '实施', flow: '一线→集中', from: '一线顾问', to: '集中实施团队', proof: '实施交付确认', scene: '无法单独创建，强绑定于 PE01', group: '一线', create: 'child-only' },
  { code: 'T05', name: '远程实施工单（ERP/报表）', stage: '实施', flow: '一线→集中', from: '一线顾问', to: '集中实施团队', proof: '实施交付确认', scene: '可挂起', group: '一线', create: 'frontline' },
  { code: 'T06', name: '需求工单', stage: '售后/经营', flow: '一线→集中', from: '一线顾问', to: '技术支持→产品', proof: '需求受理情况+排期', scene: '售后评估后转入需求池', group: '一线', create: 'escalate' },
  { code: 'T07', name: '业务协作', stage: '实施/售后', flow: '集中→一线', from: '集中', to: '一线顾问', proof: '执行情况', scene: '分批升级、ERP防重、权限码治理等', group: '下发', create: 'dispatch' },
  { code: 'T08', name: '迁移工单', stage: '实施', flow: '下发', from: '部门', to: '一线实施顾问', proof: '迁移结果', scene: 'C7迁移等批量迁移', group: '下发', create: 'dispatch' },
  { code: 'T09', name: '售后运维工单', stage: '售后', flow: '一线→集中', from: '一线顾问', to: '技术支持/在线客服', proof: '解决方案/根因分析/客户确认', scene: '一线无法解决的售后问题，提单前必须经过 AI 问答', group: '一线', create: 'ai' },
  { code: 'T10', name: '运营监测', stage: '售后', flow: '集中→一线/集中', from: '系统告警', to: '技术支持/一线顾问', proof: '解决情况', scene: '监测告警自动触发生成', group: '系统', create: 'system' },
  { code: 'T11', name: '新客试运行维护', stage: '实施', flow: '一线→在线', from: '一线实施顾问', to: '在线客服', proof: '实施交付功能清单', scene: '无法单独创建，强绑定于 PE01', group: '一线', create: 'child-only' },
  { code: 'T12', name: '要客拜访', stage: '经营', flow: '下发', from: '部门', to: '一线顾问', proof: '拜访纪要+需求跟进', scene: '重点客户定期拜访维护', group: '下发', create: 'dispatch' },
  { code: 'T13', name: '流失预警/回访', stage: '经营', flow: '下发', from: '部门(数据分析)', to: '一线顾问', proof: '回访记录+挽留结果', scene: '识别流失风险后回访。系统驱动，不在手工下发七类里', group: '系统', create: 'system' },
  { code: 'T14', name: '专项调研', stage: '经营', flow: '下发', from: '部门', to: '一线顾问', proof: '调研报告', scene: '客户调研/需求调研', group: '下发', create: 'dispatch' },
  { code: 'T15', name: '业务价值线索', stage: '经营', flow: '在线/集中→一线', from: '在线客服', to: '一线顾问', proof: '线索执行情况+客户KYC', scene: '客服识别商机转一线跟进', group: '下发', create: 'dispatch' },
  { code: 'PE01', name: '项目实施工单', stage: '实施', flow: '集中→一线', from: '集中', to: '一线实施顾问/集中实施/在线客服', proof: '实施复核+结项反馈', scene: '项目实施过程全链路管理', group: '主单', create: 'master' },
];

export const STAGE_MATRIX: { stage: string; down: string; front: string; inner: string }[] = [
  { stage: '营销', down: '新产品(GTM)推介任务', front: '新客CBS营销支持', inner: '—' },
  {
    stage: '实施',
    down: '功能上线(迭代、上新)批量实施、迁移实施',
    front: '直联实施工单(测试、上线)、远程实施工单(初始化配置)、ERP远程实施工单',
    inner: '实施复核工单',
  },
  {
    stage: '售后',
    down: '专项任务下发、客户满意度调研、流失预警回访、运营监测',
    front: '售后工单(简单咨询、复杂疑难、故障排查)、权限申请工单、信息变更工单',
    inner: '售后升级工单、运营监测',
  },
  { stage: '经营', down: '要客拜访任务、CBS新功能推广通知、促活', front: '—', inner: '—' },
];

const step = (key: string, name: string, type: string, required: boolean, stdHours: number): ChainStep => ({
  key,
  name,
  type,
  required,
  stdHours,
});

export const CHAINS: Record<Tier, { name: string; manage: string; stdDays: number; steps: ChainStep[] }> = {
  要客级: {
    name: '标准实施主工单 · 全链路',
    manage: '强过程管理：节点反馈、临期预警、实施复核',
    stdDays: 45,
    steps: [
      step('init', '初始化实施', 'T04', true, 8),
      step('cmb', '招行直联上线', 'T03', true, 12),
      step('ob', '他行直联上线', 'T03', true, 12),
      step('erp', 'ERP对接', 'T05', false, 20),
      step('review', '实施复核', '复核', true, 4),
      step('deliver', '交付确认', '交付', true, 4),
      step('pilot', '试运行维保', 'T11', false, 8),
      step('accept', '客户验收确认', '验收', true, 4),
    ],
  },
  重点级: {
    name: '标准实施主工单 · 全链路',
    manage: '过程管理：节点反馈、超期预警',
    stdDays: 30,
    steps: [
      step('init', '初始化实施', 'T04', true, 8),
      step('cmb', '招行直联上线', 'T03', true, 12),
      step('ob', '他行直联上线', 'T03', true, 12),
      step('erp', 'ERP对接', 'T05', false, 20),
      step('deliver', '交付确认', '交付', true, 4),
    ],
  },
  潜力级: {
    name: '精简实施主工单',
    manage: '精简链路，不上复核与试运行',
    stdDays: 18,
    steps: [
      step('init', '初始化实施', 'T04', true, 6),
      step('cmb', '招行直联上线', 'T03', true, 8),
      step('ob', '他行直联上线', 'T03', true, 8),
      step('golive', '上线确认', '上线', true, 4),
    ],
  },
};

export function city(name: string, region: string, visits: number, consultants: number, bookSize: number): CityRow {
  return { id: name, city: name, region, visits, consultants, bookSize };
}

export const CITIES: CityRow[] = [
  city('深圳', '华南', 92, 5, 860),
  city('广州', '华南', 71, 4, 640),
  city('佛山', '华南', 28, 2, 210),
  city('东莞', '华南', 24, 2, 180),
  city('珠海', '华南', 11, 1, 70),
  city('厦门', '华南', 19, 2, 150),
  city('福州', '华南', 16, 1, 120),
  city('泉州', '华南', 8, 1, 60),
  city('南宁', '华南', 14, 1, 90),
  city('海口', '华南', 6, 1, 40),
  city('上海', '华东', 88, 5, 790),
  city('杭州', '华东', 64, 3, 480),
  city('南京', '华东', 47, 3, 360),
  city('苏州', '华东', 41, 2, 300),
  city('宁波', '华东', 33, 2, 240),
  city('无锡', '华东', 27, 2, 190),
  city('温州', '华东', 12, 1, 80),
  city('合肥', '华东', 22, 2, 160),
  city('南昌', '华东', 9, 1, 70),
  city('济南', '华东', 18, 2, 140),
  city('青岛', '华东', 21, 2, 150),
  city('烟台', '华东', 7, 1, 50),
  city('北京', '华北', 81, 4, 720),
  city('天津', '华北', 36, 2, 260),
  city('石家庄', '华北', 15, 1, 110),
  city('太原', '华北', 8, 1, 60),
  city('呼和浩特', '华北', 4, 1, 30),
  city('武汉', '华中', 44, 3, 340),
  city('长沙', '华中', 26, 2, 190),
  city('郑州', '华中', 23, 2, 170),
  city('成都', '西南', 58, 3, 420),
  city('重庆', '西南', 39, 2, 280),
  city('昆明', '西南', 11, 1, 80),
  city('贵阳', '西南', 7, 1, 50),
  city('拉萨', '西南', 1, 1, 8),
  city('西安', '西北', 31, 2, 220),
  city('兰州', '西北', 5, 1, 36),
  city('银川', '西北', 3, 1, 22),
  city('西宁', '西北', 2, 1, 16),
  city('乌鲁木齐', '西北', 6, 1, 40),
  city('沈阳', '东北', 17, 1, 130),
  city('大连', '东北', 13, 1, 90),
  city('哈尔滨', '东北', 9, 1, 70),
  city('长春', '东北', 6, 1, 48),
];

export const YINGUAN_ENTERPRISES: YinguanEnterprise[] = [
  { tenantNo: 'CBS10086021', name: '华润置地有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '司库、招行直联、工行直联；ERP 用友 NC；账户约 128 个' },
  { tenantNo: 'CBS10086044', name: '万科企业股份有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '招行直联、票据池；ERP SAP' },
  { tenantNo: 'CBS10086102', name: '顺丰控股股份有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '多银行余额归集、招行直联' },
  { tenantNo: 'CBS10086220', name: '深圳迈瑞生物医疗电子股份有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '招行直联已开通，初始化未完成' },
  { tenantNo: 'CBS10086301', name: '招商局蛇口工业区控股股份有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '司库试点，招行直联' },
  { tenantNo: 'CBS31001008', name: '上海汽车集团股份有限公司', branchId: '上海', tenantStatus: '活动', projectInfo: '招行+工行直联，ERP SAP' },
  { tenantNo: 'CBS33002016', name: '吉利控股集团有限公司', branchId: '杭州', tenantStatus: '活动', projectInfo: '招行直联，成员单位较多' },
  { tenantNo: 'CBS51003011', name: '新希望控股集团有限公司', branchId: '成都', tenantStatus: '活动', projectInfo: '招行直联、资金池' },
  { tenantNo: 'CBS42004007', name: '九州通医药集团股份有限公司', branchId: '武汉', tenantStatus: '暂停使用', projectInfo: '直联证书即将到期，活跃度下降' },
  { tenantNo: 'CBS61005003', name: '陕西煤业股份有限公司', branchId: '西安', tenantStatus: '活动', projectInfo: '待 C7 迁移' },
  { tenantNo: 'CBS53006002', name: '云南白药集团股份有限公司', branchId: '昆明', tenantStatus: '活动', projectInfo: '仅开通查询，支付未启用' },
  { tenantNo: 'CBS11007019', name: '国家能源投资集团有限责任公司', branchId: '北京', tenantStatus: '活动', projectInfo: '工行直联增量，司库在建' },
  { tenantNo: 'CBS10087088', name: '深圳燃气集团有限公司', branchId: '深圳', tenantStatus: '初始', projectInfo: '租户已开通，档案仍待认证' },
  { tenantNo: 'CBS10087110', name: '深圳华侨城股份有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '新租户，尚未匹配档案' },
  { tenantNo: 'CBS10087136', name: '华润水泥控股有限公司', branchId: '深圳', tenantStatus: '活动', projectInfo: '名称含「华润」，需与华润置地辨识' },
];

export function typeInfo(code: string): TicketTypeInfo | undefined {
  return TICKET_TYPES.find((item) => item.code === code);
}

export function typeName(code: string): string {
  return typeInfo(code)?.name ?? code;
}

export function isDispatchCode(code: string): boolean {
  return (DISPATCH_CODES as readonly string[]).includes(code);
}
