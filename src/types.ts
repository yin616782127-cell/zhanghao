export type RoleKey = 'frontline' | 'leader' | 'central' | 'director';

export type Tier = '要客级' | '重点级' | '潜力级';

export type AuthStatus = '待开通' | '已开通';

export type Stage = '营销' | '实施' | '售后' | '经营';

export type TicketKind = 'dispatch' | 'frontline' | 'master' | 'child' | 'system';

export type Priority = '紧急' | '正常' | '低';

export interface FollowUp {
  id: string;
  at: string;
  by: string;
  content: string;
  kind: '跟进' | '催办' | '备注' | '验收';
}

export interface HandlerNode {
  at: string;
  userId: string;
  node: string;
  note: string;
}

export interface Material {
  id: string;
  node: string;
  name: string;
  required: boolean;
  at: string;
  by: string;
}

export interface TierEvent {
  at: string;
  from: Tier;
  to: Tier;
  by: string;
  reviewer?: string;
  reason: string;
  result: '生效' | '驳回' | '初评';
}

export interface Customer {
  id: string;
  archiveNo: string;
  name: string;
  creditCode: string;
  tenantNo?: string;
  branchId: string;
  authStatus: AuthStatus;
  tenantStatus?: '活动' | '关闭' | '暂停使用' | '初始';
  ownerId: string;
  gradeTags: string[];
  tier: Tier;
  pendingTier?: { to: Tier; reason: string; by: string; at: string };
  tierHistory: TierEvent[];
  industry?: string;
  projectInfo?: string;
  nameLocked: boolean;
  marketingTicketId?: string;
  converted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  survey: { key: string; value: string }[];
  materials: Material[];
}

export interface TransferRecord {
  id: string;
  at: string;
  fromId: string;
  toId: string;
  customerIds: string[];
  operatorId: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface AiSession {
  id: string;
  mode: 'aftersales' | 'marketing';
  customerId?: string;
  title: string;
  messages: ChatMessage[];
  resolved?: boolean;
  ticketId?: string;
  createdAt: string;
  userId: string;
}

export interface Ticket {
  id: string;
  no: string;
  typeCode: string;
  title: string;
  stage: Stage;
  kind: TicketKind;
  status: string;
  priority: Priority;
  customerId?: string;
  branchId: string;
  creatorId: string;
  ownerId?: string;
  acceptorId?: string;
  path?: string;
  targetScope?: string;
  description: string;
  standard?: string;
  dueAt?: string;
  createdAt: string;
  submittedAt?: string;
  closedAt?: string;
  slaStartedAt?: string;
  progress: number;
  parentId?: string;
  phaseKey?: string;
  requiredChild?: boolean;
  problemType?: string;
  customerLevel?: string;
  expectAt?: string;
  unresolvedReason?: string;
  aiSessionId?: string;
  transcript?: ChatMessage[];
  reusable?: boolean;
  solution?: string;
  rootCause?: string;
  linkedTicketId?: string;
  templateName?: string;
  projectPhase?: string;
  tier?: Tier;
  reportedHours?: number;
  followUps: FollowUp[];
  handlerTrail: HandlerNode[];
  cc: string[];
  urgeCount: number;
  kycCreditCode?: string;
  kycNote?: string;
  attachments: string[];
  source: string;
  handlingHours?: number;
  systemRule?: string;
}

export interface ServiceLog {
  id: string;
  date: string;
  stage: Stage;
  visitType: '拜访' | '远程';
  hours: number;
  customerId: string;
  branchId: string;
  ownerId: string;
  ticketId?: string;
  content: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  role: RoleKey;
  title: string;
  team: string;
  city: string;
  branchId: string;
  status: '在职' | '休假' | '离职';
  mobile: string;
  org: string;
}

export interface DictItem {
  code: string;
  label: string;
  enabled: boolean;
}

export interface DictType {
  key: string;
  name: string;
  items: DictItem[];
}

export interface AiCase {
  id: string;
  name: string;
  module: string;
  owner: string;
  status: '未运行' | '通过' | '失败';
  lastRun?: string;
  duration?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  summary: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export interface YinguanItem {
  id: string;
  tenantNo: string;
  name: string;
  branchId: string;
  tenantStatus: '活动' | '关闭' | '暂停使用' | '初始';
  projectInfo: string;
  queue: '待关联' | '待认领' | '已处理';
  candidateId?: string;
  note: string;
}

export interface YinguanEnterprise {
  tenantNo: string;
  name: string;
  branchId: string;
  tenantStatus: '活动' | '关闭' | '暂停使用' | '初始';
  projectInfo: string;
}

export type PermKey =
  | 'createDispatch'
  | 'createFrontline'
  | 'createMaster'
  | 'createMarketing'
  | 'executeDispatch'
  | 'batchAssign'
  | 'batchTransfer'
  | 'transferOwner'
  | 'reviewTier'
  | 'followUp'
  | 'urge'
  | 'accept'
  | 'advanceImpl'
  | 'addLog'
  | 'aiConvert'
  | 'simulateSystem';

export interface RoleConfig {
  perms: Record<PermKey, boolean>;
}

export interface CityRow {
  id: string;
  city: string;
  region: string;
  visits: number;
  consultants: number;
  bookSize: number;
}

export interface ChainStep {
  key: string;
  name: string;
  type: string;
  required: boolean;
  stdHours: number;
}

export interface TicketTypeInfo {
  code: string;
  name: string;
  stage: string;
  flow: string;
  from: string;
  to: string;
  proof: string;
  scene: string;
  group: '下发' | '一线' | '主单' | '系统';
  create: 'dispatch' | 'frontline' | 'master' | 'ai' | 'system' | 'child-only' | 'escalate';
}
