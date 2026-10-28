import dayjs from 'dayjs';
import { ACTORS, CHAINS, GRADE_TAGS, NOW, SLA_HANDLE_HOURS, SLA_RECEIVE_HOURS, SLA_REVIEW_HOURS, isDispatchCode } from './catalog';
import type { AppUser, Customer, RoleKey, ServiceLog, Ticket, Tier } from './types';

export const TERMINAL = ['已完成', '已取消', '已转需求'];

export function isTerminal(status: string): boolean {
  return TERMINAL.includes(status);
}

export function judgeTier(tags: string[]): Tier {
  const set = new Set(tags);
  if (set.has('机构部客户')) return '要客级';
  const others = tags.filter((tag) => tag !== '总分战');
  if (set.has('总分战') && others.length >= 1) return '要客级';
  if (tags.length >= 3) return '要客级';
  if (tags.length >= 1) return '重点级';
  return '潜力级';
}

export function tierReason(tags: string[]): string {
  const tier = judgeTier(tags);
  if (tags.includes('机构部客户')) return '勾选「机构部客户」，直升要客级';
  if (tags.includes('总分战') && tags.length >= 2) return '勾选「总分战」且另有标签，直升要客级';
  if (tier === '要客级') return `勾选 ${tags.length} 个标签，达到 3 个，判定要客级`;
  if (tier === '重点级') return `勾选 ${tags.length} 个标签，判定重点级`;
  return '未勾选定级标签，判定潜力级';
}

export function hoursBetween(from: string, to: string): number {
  return dayjs(to).diff(dayjs(from), 'hour', true);
}

export function overdueDays(ticket: Ticket, now = NOW): number | null {
  if (!ticket.dueAt || isTerminal(ticket.status)) return null;
  if (!['待接收', '进行中', '待回访', '告警处理'].includes(ticket.status)) return null;
  const due = dayjs(ticket.dueAt);
  const current = dayjs(now);
  if (!due.isBefore(current)) return null;
  const days = current.startOf('day').diff(due.startOf('day'), 'day');
  return Math.max(days, 1);
}

export function isRedOverdue(ticket: Ticket): boolean {
  return isDispatchCode(ticket.typeCode) && overdueDays(ticket) !== null;
}

export function isYellowReceive(ticket: Ticket): boolean {
  if (ticket.status !== '待接收') return false;
  return hoursBetween(ticket.createdAt, NOW) > SLA_RECEIVE_HOURS;
}

export function isReviewTimeout(ticket: Ticket): boolean {
  if (ticket.status !== '待验收' || !ticket.submittedAt) return false;
  return hoursBetween(ticket.submittedAt, NOW) > SLA_REVIEW_HOURS;
}

export function isDueSoon(ticket: Ticket): boolean {
  if (!ticket.dueAt || isTerminal(ticket.status) || overdueDays(ticket) !== null) return false;
  if (!['待接收', '进行中'].includes(ticket.status)) return false;
  const days = dayjs(ticket.dueAt).startOf('day').diff(dayjs(NOW).startOf('day'), 'day');
  return days >= 0 && days <= 2;
}

export function handleSlaBreached(ticket: Ticket): boolean {
  if (isTerminal(ticket.status)) return false;
  if (!['处理中', '研发处理中', '告警处理'].includes(ticket.status)) return false;
  const start = ticket.slaStartedAt || ticket.createdAt;
  return hoursBetween(start, NOW) > SLA_HANDLE_HOURS;
}

export function slaTags(ticket: Ticket): { color: string; text: string }[] {
  const tags: { color: string; text: string }[] = [];
  if (isRedOverdue(ticket)) tags.push({ color: 'red', text: `已超期 ${overdueDays(ticket)} 天` });
  else if (overdueDays(ticket) !== null && !isDispatchCode(ticket.typeCode)) {
    tags.push({ color: 'red', text: `已超期 ${overdueDays(ticket)} 天` });
  }
  if (isYellowReceive(ticket) && !isRedOverdue(ticket)) tags.push({ color: 'gold', text: '待接收超时' });
  if (isReviewTimeout(ticket)) tags.push({ color: 'orange', text: '验收超 48 小时' });
  if (isDueSoon(ticket)) tags.push({ color: 'blue', text: '临期' });
  if (handleSlaBreached(ticket)) tags.push({ color: 'magenta', text: '处理超时' });
  return tags;
}

export function canSeeBranch(user: AppUser, branchId: string): boolean {
  return user.branchId === '总行' || user.branchId === branchId;
}

export function actorOf(role: RoleKey, users: AppUser[]): AppUser {
  const id = ACTORS[role].userId;
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error(`missing actor ${id}`);
  return user;
}

export function completeness(customer: Customer): { percent: number; missing: string[] } {
  const missing: string[] = [];
  if (customer.pendingTier) missing.push('定级待复核');
  if (!customer.materials.some((item) => item.node === '调研')) missing.push('未归档调研问卷');
  if (customer.authStatus === '已开通' && !customer.tenantNo) missing.push('缺少租户号');
  if (customer.authStatus === '已开通' && !customer.projectInfo) missing.push('缺少应管项目信息');
  const checks = 2 + (customer.authStatus === '已开通' ? 2 : 0);
  const percent = Math.round(((checks - missing.length) / checks) * 100);
  return { percent: Math.max(0, Math.min(100, percent)), missing };
}

export function serviceStage(customerId: string, tickets: Ticket[]): string {
  const open = tickets.filter((ticket) => ticket.customerId === customerId && !ticket.parentId && !isTerminal(ticket.status));
  if (open.some((ticket) => ticket.typeCode === 'PE01' || (ticket.stage === '实施' && ticket.kind !== 'system'))) return '实施中';
  if (open.some((ticket) => ticket.stage === '售后')) return '售后中';
  if (open.some((ticket) => ticket.stage === '营销')) return '营销中';
  if (open.some((ticket) => ticket.stage === '经营')) return '经营维护';
  return '无在途工单';
}

export function masterProgress(masterId: string, tickets: Ticket[]): { done: number; total: number; percent: number } {
  const kids = tickets.filter((ticket) => ticket.parentId === masterId && ticket.status !== '已取消');
  const done = kids.filter((ticket) => ticket.status === '已完成').length;
  const total = kids.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function logHours(logs: ServiceLog[], ticketIds: string[]): number {
  const set = new Set(ticketIds);
  return round1(logs.filter((log) => log.ticketId && set.has(log.ticketId)).reduce((sum, log) => sum + log.hours, 0));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function deviationText(reported: number, logged: number): string {
  if (!logged) return '无关联日志，无法对照';
  const delta = Math.round(((reported - logged) / logged) * 100);
  return `${delta > 0 ? '+' : ''}${delta}%`;
}

export function customerLevelOf(tier: Tier): string {
  if (tier === '要客级') return '体系要客';
  if (tier === '重点级') return '重要客户';
  return '潜力客户';
}

export function chainOf(tier: Tier) {
  return CHAINS[tier];
}

export function daysOpen(from: string, to = NOW): number {
  return Math.max(dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day'), 0);
}

export function aiAnswer(question: string): string {
  if (/证书|到期|直联|银企/.test(question)) {
    return '银企直联证书类问题，建议先在应管核对证书到期日、银行前置机状态和最近一次连通性。若证书已过期，需要客户管理员在银行侧更新后再回写应管，本平台不改直联参数。完成以上核对仍失败时，可转售后工单，未解决原因选「需人工操作」，并附上错误时间与银行。';
  }
  if (/支付|指令|状态不一致|落库/.test(question)) {
    return '支付指令状态不一致时，先核对 CBS 指令号、银行流水号和审批是否已终审。常见原因是银行已受理但回执未达。请让客户提供指令号后，再决定是否转技术支持。若只是查询口径问题，标记本回答已解决即可，不必进工单池。';
  }
  if (/回单|下载/.test(question)) {
    return '回单下载失败多数与查询日期范围、账号权限或银行文件未生成有关。请先缩小到单日、单账号重试。若提示权限不足，走业务协作而不是售后故障。仍失败再转工单，并选择「问题太复杂」或「需人工操作」。';
  }
  if (/实施|范式|上线|初始化/.test(question)) {
    return '实施路径由实施定级决定：要客级走全链路并含复核与试运行，重点级走到交付确认，潜力级为精简链路。初始化工单和试运行工单不能单独创建，必须挂在项目实施主单 PE01 下。主单进度按已完成子工单数除以子工单总数计算。';
  }
  if (/营销|推介|拜访|KYC/.test(question)) {
    return '营销侧可以在这里咨询话术和产品口径。CBS 营销工单是 T01，由分行下发给一线，完成凭证是拜访日志加客户 KYC。新品和功能推介是 T02，由部门下发。若只是记录一次沟通，请保存营销纪要，不必转售后工单。';
  }
  return '已根据现有知识库检索，没有直接命中可执行步骤。请补充现象、报错原文、发生时间和是否已自行排查。若本轮回答不能落地，可以转售后工单，并选择未解决原因。至少完成一轮问答后才允许转工单。';
}

export function guessProblemType(text: string): string {
  if (/缺陷|报错|失败|异常/.test(text)) return '产品缺陷';
  if (/如何|怎么|咨询|口径/.test(text)) return '疑难咨询';
  if (/配置|权限|参数/.test(text)) return '操作配置';
  return '协助排查';
}

export const OFFICIAL_GRADE_TAGS: readonly string[] = GRADE_TAGS;
