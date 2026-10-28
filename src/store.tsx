import dayjs from 'dayjs';
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { ACTORS, CHAINS, DEFAULT_ROLE_CONFIG, NOW, typeInfo } from './catalog';
import { aiAnswer, judgeTier, tierReason } from './logic';
import {
  AI_CASES,
  CUSTOMERS,
  DICTS,
  LOGS,
  SESSIONS,
  TICKETS,
  TRANSFERS,
  USERS,
  YINGUAN_QUEUE,
  initialArticles,
} from './seed';
import type {
  AiCase,
  AiSession,
  AppUser,
  Article,
  AuthStatus,
  Customer,
  DictType,
  PermKey,
  Priority,
  RoleConfig,
  RoleKey,
  ServiceLog,
  Stage,
  Ticket,
  TicketKind,
  Tier,
  TransferRecord,
  YinguanItem,
} from './types';

export interface AppState {
  role: RoleKey;
  customers: Customer[];
  tickets: Ticket[];
  logs: ServiceLog[];
  sessions: AiSession[];
  transfers: TransferRecord[];
  yinguan: YinguanItem[];
  articles: Article[];
  dicts: DictType[];
  aiCases: AiCase[];
  roleConfig: Record<RoleKey, RoleConfig>;
  seq: number;
  clock: number;
}

const initialState: AppState = {
  role: 'frontline',
  customers: CUSTOMERS,
  tickets: TICKETS,
  logs: LOGS,
  sessions: SESSIONS,
  transfers: TRANSFERS,
  yinguan: YINGUAN_QUEUE,
  articles: initialArticles(),
  dicts: DICTS,
  aiCases: AI_CASES,
  roleConfig: DEFAULT_ROLE_CONFIG,
  seq: 200,
  clock: 0,
};

type Action =
  | { type: 'setRole'; role: RoleKey }
  | { type: 'setPerm'; role: RoleKey; key: PermKey; value: boolean }
  | { type: 'addDict'; dictKey: string; label: string }
  | { type: 'replace'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setRole':
      return { ...state, role: action.role };
    case 'setPerm':
      return {
        ...state,
        roleConfig: {
          ...state.roleConfig,
          [action.role]: {
            perms: { ...state.roleConfig[action.role].perms, [action.key]: action.value },
          },
        },
      };
    case 'addDict':
      return {
        ...state,
        dicts: state.dicts.map((dict) =>
          dict.key === action.dictKey
            ? { ...dict, items: [...dict.items, { code: `X${dict.items.length + 1}`, label: action.label, enabled: true }] }
            : dict,
        ),
      };
    case 'replace':
      return action.state;
    default:
      return state;
  }
}

export interface NewCustomerInput {
  name: string;
  creditCode: string;
  branchId: string;
  ownerId: string;
  gradeTags: string[];
  requestedTier?: Tier;
  overrideReason?: string;
  industry?: string;
  authStatus: AuthStatus;
  tenantNo?: string;
  tenantStatus?: Customer['tenantStatus'];
  projectInfo?: string;
  nameLocked: boolean;
  yinguanId?: string;
}

export interface DispatchInput {
  typeCode: string;
  title: string;
  description: string;
  standard: string;
  priority: Priority;
  dueAt: string;
  path: string;
  targetScope: string;
  branchIds: string[];
  ownerId?: string;
  customerId?: string;
  customerIds?: string[];
  acceptorId?: string;
  cc: string[];
  attachments: string[];
  kycCreditCode?: string;
  kycNote?: string;
}

export interface SimpleTicketInput {
  typeCode: 'T03' | 'T05';
  title: string;
  customerId: string;
  description: string;
  standard: string;
  priority: Priority;
  dueAt?: string;
  ownerId?: string;
}

export interface MasterInput {
  customerId: string;
  description: string;
  dueAt?: string;
  ownerId?: string;
}

export interface ConvertInput {
  customerId: string;
  problemType: string;
  title: string;
  description: string;
  reason: string;
  customerLevel: string;
  expectAt?: string;
}

export interface NewLogInput {
  date: string;
  stage: Stage;
  visitType: '拜访' | '远程';
  hours: number;
  customerId: string;
  ticketId?: string;
  content: string;
}

function stampOf(clock: number): string {
  return dayjs(NOW).add(clock, 'minute').format('YYYY-MM-DD HH:mm');
}

function ticketNo(code: string, seq: number): string {
  return `${code}-20261028-${String(seq).padStart(3, '0')}`;
}

function shell(partial: Partial<Ticket> & Pick<Ticket, 'id' | 'no' | 'typeCode' | 'title' | 'kind' | 'status' | 'branchId' | 'creatorId'>): Ticket {
  const info = typeInfo(partial.typeCode);
  const stage = (info?.stage.includes('售后') ? '售后' : info?.stage.includes('营销') ? '营销' : info?.stage.includes('经营') ? '经营' : '实施') as Stage;
  return {
    stage: partial.stage || stage,
    priority: '正常',
    description: '',
    source: '',
    progress: 0,
    followUps: [],
    handlerTrail: [],
    cc: [],
    attachments: [],
    urgeCount: 0,
    createdAt: NOW,
    ...partial,
  };
}

function spawnChildren(master: Ticket, tier: Tier, seq: number, at: string): { children: Ticket[]; seq: number } {
  const chain = CHAINS[tier];
  const children = chain.steps.map((step, index) => {
    const next = seq + index + 1;
    return shell({
      id: `t-${master.id}-${step.key}-${next}`,
      no: ticketNo(step.type, next),
      typeCode: step.type,
      title: step.name,
      kind: 'child',
      status: '待开始',
      stage: '实施',
      priority: master.priority,
      customerId: master.customerId,
      branchId: master.branchId,
      creatorId: master.creatorId,
      ownerId: master.ownerId,
      parentId: master.id,
      phaseKey: step.key,
      requiredChild: step.required,
      createdAt: at,
      description: `按${chain.name}生成：${step.name}。`,
      standard: '完成后回写主单进度',
      source: '范式生成',
      handlerTrail: [{ at, userId: master.creatorId, node: '集中实施', note: '主单按实施定级生成子工单' }],
    });
  });
  return { children, seq: seq + chain.steps.length };
}

function rearrange(state: AppState, master: Ticket, tier: Tier, at: string, actorId: string): AppState {
  const chain = CHAINS[tier];
  const children = state.tickets.filter((item) => item.parentId === master.id);
  const keys = new Set(chain.steps.map((step) => step.key));
  const remove = new Set(children.filter((item) => item.status === '待开始' && !keys.has(item.phaseKey || '')).map((item) => item.id));
  const keptKeys = new Set(children.filter((item) => !remove.has(item.id)).map((item) => item.phaseKey));
  let seq = state.seq;
  const added: Ticket[] = [];
  chain.steps.forEach((step) => {
    if (keptKeys.has(step.key)) return;
    seq += 1;
    added.push(
      shell({
        id: `t-${master.id}-${step.key}-${seq}`,
        no: ticketNo(step.type, seq),
        typeCode: step.type,
        title: step.name,
        kind: 'child',
        status: '待开始',
        stage: '实施',
        customerId: master.customerId,
        branchId: master.branchId,
        creatorId: actorId,
        ownerId: master.ownerId,
        parentId: master.id,
        phaseKey: step.key,
        requiredChild: step.required,
        createdAt: at,
        description: `定级变更后补齐的环节：${step.name}。已完成和已开始的环节未改动。`,
        source: '定级变更重排',
      }),
    );
  });
  return {
    ...state,
    seq,
    tickets: state.tickets
      .filter((item) => !remove.has(item.id))
      .map((item) => (item.id === master.id ? { ...item, tier, templateName: chain.name } : item))
      .concat(added),
  };
}

export interface StoreApi {
  state: AppState;
  users: AppUser[];
  actor: AppUser;
  can: (key: PermKey) => boolean;
  setRole: (role: RoleKey) => void;
  setPerm: (role: RoleKey, key: PermKey, value: boolean) => void;
  addDict: (dictKey: string, label: string) => void;
  createCustomer: (input: NewCustomerInput) => { ok: true; id: string } | { ok: false; error: string };
  addMaterial: (customerId: string, node: string, name: string, required: boolean) => void;
  removeMaterial: (customerId: string, materialId: string) => void;
  saveSurvey: (customerId: string, survey: { key: string; value: string }[]) => void;
  setIndustry: (customerId: string, industry: string) => void;
  requestTier: (customerId: string, to: Tier, reason: string) => string | null;
  reviewTier: (customerId: string, pass: boolean) => string | null;
  transferOwners: (customerIds: string[], toId: string, reason: string) => string | null;
  linkYinguan: (id: string) => string | null;
  dismissYinguan: (id: string) => void;
  createDispatch: (input: DispatchInput) => { ids: string[] } | { error: string };
  createSimple: (input: SimpleTicketInput) => { id: string } | { error: string };
  createMaster: (input: MasterInput) => { id: string } | { error: string };
  simulateSystem: (typeCode: 'T10' | 'T13', customerId: string) => { id: string } | { error: string };
  receive: (id: string) => void;
  saveProgress: (id: string, progress: number, note: string) => void;
  setStatus: (id: string, status: string, note: string) => void;
  submitDispatch: (id: string, hours: number, note: string) => string | null;
  acceptDispatch: (id: string, pass: boolean, note: string) => void;
  cancelTicket: (id: string, note: string) => void;
  urge: (id: string, note: string) => void;
  follow: (id: string, note: string) => void;
  assignTickets: (ids: string[], ownerId: string) => void;
  transferTickets: (ids: string[], ownerId: string) => void;
  advanceChild: (id: string, to: '进行中' | '已完成' | '已挂起' | '已取消', note: string) => string | null;
  setPhase: (id: string, phase: string, note: string) => void;
  pauseMaster: (id: string, paused: boolean, note: string) => void;
  closeMaster: (id: string, hours: number, note: string) => string | null;
  aftersales: (
    id: string,
    act: 'toPool' | 'toRd' | 'toDemand' | 'finish' | 'confirm' | 'reject' | 'selfClose' | 'cancel',
    extra?: { ownerId?: string; note?: string; hours?: number; solution?: string },
  ) => string | null;
  addLog: (input: NewLogInput) => string;
  startSession: (mode: 'aftersales' | 'marketing', customerId?: string, initial?: string) => string;
  chat: (sessionId: string, text: string) => void;
  resolveSession: (sessionId: string) => void;
  convertSession: (sessionId: string, input: ConvertInput) => { ok: true; id: string } | { ok: false; error: string };
  markReusable: (ticketId: string) => void;
  finishAiCase: (id: string, status: AiCase['status'], duration: string) => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const actor = USERS.find((item) => item.id === ACTORS[state.role].userId) as AppUser;

  const api = useMemo<StoreApi>(() => {
    const commit = (recipe: (draft: AppState, at: string, seq: number) => AppState | { error: string }) => {
      let error: string | null = null;
      dispatch({
        type: 'replace',
        state: (() => {
          const clock = state.clock + 1;
          const at = stampOf(clock);
          const result = recipe({ ...state, clock }, at, state.seq);
          if ('error' in result && !('customers' in result)) {
            error = result.error;
            return state;
          }
          return result as AppState;
        })(),
      });
      return error;
    };

    const patchTicket = (id: string, map: (ticket: Ticket, at: string) => Ticket) => {
      commit((draft, at) => ({
        ...draft,
        tickets: draft.tickets.map((ticket) => (ticket.id === id ? map(ticket, at) : ticket)),
      }));
    };

    return {
      state,
      users: USERS,
      actor,
      can: (key) => state.roleConfig[state.role].perms[key],
      setRole: (role) => dispatch({ type: 'setRole', role }),
      setPerm: (role, key, value) => dispatch({ type: 'setPerm', role, key, value }),
      addDict: (dictKey, label) => dispatch({ type: 'addDict', dictKey, label }),
      createCustomer: (input) => {
        const creditCode = input.creditCode.trim().toUpperCase();
        if (!input.name.trim()) return { ok: false, error: '请填写企业名称' };
        if (!/^[0-9A-Z]{18}$/.test(creditCode)) return { ok: false, error: '统一社会信用代码需为 18 位数字或大写字母' };
        if (state.customers.some((item) => item.creditCode === creditCode)) return { ok: false, error: '统一社会信用代码已存在档案，不能重复建档' };
        if (input.tenantNo && state.customers.some((item) => item.tenantNo === input.tenantNo)) {
          return { ok: false, error: '该租户号已绑定其他档案' };
        }
        if (input.authStatus === '已开通' && !input.tenantNo) return { ok: false, error: '已开通档案必须回填租户号' };
        const auto = judgeTier(input.gradeTags);
        const marketing = state.tickets.find((item) => item.typeCode === 'T01' && item.kycCreditCode === creditCode);
        let createdId = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          createdId = `c-${seqNo}`;
          const pending = input.requestedTier && input.requestedTier !== auto ? { to: input.requestedTier, reason: input.overrideReason || '手工改级', by: actor.id, at } : undefined;
          const customer: Customer = {
            id: createdId,
            archiveNo: `DA2026${String(seqNo).padStart(4, '0')}`,
            name: input.name.trim(),
            creditCode,
            tenantNo: input.tenantNo,
            branchId: input.branchId,
            authStatus: input.authStatus,
            tenantStatus: input.tenantStatus,
            ownerId: input.ownerId,
            gradeTags: input.gradeTags,
            tier: auto,
            pendingTier: pending,
            tierHistory: [{ at, from: auto, to: auto, by: actor.id, reason: tierReason(input.gradeTags), result: '初评' }],
            industry: input.industry,
            projectInfo: input.projectInfo,
            nameLocked: input.nameLocked,
            marketingTicketId: marketing?.id,
            converted: Boolean(marketing),
            createdAt: at,
            createdBy: actor.id,
            updatedAt: at,
            updatedBy: actor.id,
            survey: [],
            materials: [],
          };
          if (marketing && !marketing.customerId) {
            draft = {
              ...draft,
              tickets: draft.tickets.map((item) => (item.id === marketing.id ? { ...item, customerId: createdId } : item)),
            };
          }
          return {
            ...draft,
            seq: seqNo,
            customers: [customer, ...draft.customers],
            yinguan: input.yinguanId
              ? draft.yinguan.map((item) => (item.id === input.yinguanId ? { ...item, queue: '已处理' as const, note: '已按同步结果建档' } : item))
              : draft.yinguan,
          };
        });
        return { ok: true, id: createdId };
      },
      addMaterial: (customerId, node, name, required) => {
        commit((draft, at, seq) => ({
          ...draft,
          seq: seq + 1,
          customers: draft.customers.map((item) =>
            item.id === customerId
              ? {
                  ...item,
                  updatedAt: at,
                  updatedBy: actor.id,
                  materials: [...item.materials, { id: `m${seq + 1}`, node, name, required, at, by: actor.id }],
                }
              : item,
          ),
        }));
      },
      removeMaterial: (customerId, materialId) => {
        commit((draft, at) => ({
          ...draft,
          customers: draft.customers.map((item) =>
            item.id === customerId
              ? { ...item, updatedAt: at, updatedBy: actor.id, materials: item.materials.filter((material) => material.id !== materialId || material.required) }
              : item,
          ),
        }));
      },
      saveSurvey: (customerId, survey) => {
        commit((draft, at) => ({
          ...draft,
          customers: draft.customers.map((item) => (item.id === customerId ? { ...item, survey, updatedAt: at, updatedBy: actor.id } : item)),
        }));
      },
      setIndustry: (customerId, industry) => {
        commit((draft, at) => ({
          ...draft,
          customers: draft.customers.map((item) => (item.id === customerId ? { ...item, industry, updatedAt: at, updatedBy: actor.id } : item)),
        }));
      },
      requestTier: (customerId, to, reason) => {
        const current = state.customers.find((item) => item.id === customerId);
        if (!current) return '档案不存在';
        if (!reason.trim()) return '请填写变更原因';
        if (current.tier === to) return '目标定级与当前定级相同';
        commit((draft, at) => ({
          ...draft,
          customers: draft.customers.map((item) =>
            item.id === customerId ? { ...item, pendingTier: { to, reason: reason.trim(), by: actor.id, at }, updatedAt: at, updatedBy: actor.id } : item,
          ),
        }));
        return null;
      },
      reviewTier: (customerId, pass) => {
        const current = state.customers.find((item) => item.id === customerId);
        if (!current?.pendingTier) return '没有待复核的定级变更';
        let message: string | null = null;
        commit((draft, at) => {
          const pending = current.pendingTier;
          if (!pending) return draft;
          let next = {
            ...draft,
            customers: draft.customers.map((item) => {
              if (item.id !== customerId) return item;
              if (!pass) {
                return {
                  ...item,
                  pendingTier: undefined,
                  updatedAt: at,
                  updatedBy: actor.id,
                  tierHistory: [...item.tierHistory, { at, from: item.tier, to: pending.to, by: pending.by, reviewer: actor.id, reason: pending.reason, result: '驳回' as const }],
                };
              }
              return {
                ...item,
                tier: pending.to,
                pendingTier: undefined,
                updatedAt: at,
                updatedBy: actor.id,
                tierHistory: [...item.tierHistory, { at, from: item.tier, to: pending.to, by: pending.by, reviewer: actor.id, reason: pending.reason, result: '生效' as const }],
              };
            }),
          };
          if (pass) {
            const masters = next.tickets.filter((item) => item.customerId === customerId && item.typeCode === 'PE01' && !['已完成', '已取消'].includes(item.status));
            masters.forEach((master) => {
              next = rearrange(next, master, pending.to, at, actor.id);
            });
            message = masters.length ? '定级已生效，未开始的子工单已按新链路重排' : '定级已生效';
          }
          return next;
        });
        return pass ? null : message;
      },
      transferOwners: (customerIds, toId, reason) => {
        if (!customerIds.length) return '请选择客户';
        if (!toId) return '请选择新管护人';
        commit((draft, at, seq) => {
          const groups = new Map<string, string[]>();
          customerIds.forEach((id) => {
            const found = draft.customers.find((item) => item.id === id);
            if (!found || found.ownerId === toId) return;
            const list = groups.get(found.ownerId) || [];
            list.push(id);
            groups.set(found.ownerId, list);
          });
          const records: TransferRecord[] = [];
          let seqNo = seq;
          groups.forEach((ids, fromId) => {
            seqNo += 1;
            records.push({ id: `tr${seqNo}`, at, fromId, toId, customerIds: ids, operatorId: actor.id, reason });
          });
          return {
            ...draft,
            seq: seqNo,
            transfers: [...records, ...draft.transfers],
            customers: draft.customers.map((item) => (customerIds.includes(item.id) && item.ownerId !== toId ? { ...item, ownerId: toId, updatedAt: at, updatedBy: actor.id } : item)),
          };
        });
        return null;
      },
      linkYinguan: (id) => {
        const item = state.yinguan.find((row) => row.id === id);
        if (!item) return '记录不存在';
        if (!item.candidateId) return '没有候选档案，请改为新建';
        const candidate = state.customers.find((row) => row.id === item.candidateId);
        if (!candidate) return '候选档案不存在';
        if (candidate.tenantNo && candidate.tenantNo !== item.tenantNo) return '候选档案已绑定其他租户号，不能覆盖。请新建档案。';
        commit((draft, at) => ({
          ...draft,
          yinguan: draft.yinguan.map((row) => (row.id === id ? { ...row, queue: '已处理', note: `已关联到 ${candidate.archiveNo}` } : row)),
          customers: draft.customers.map((row) =>
            row.id === candidate.id
              ? {
                  ...row,
                  tenantNo: item.tenantNo,
                  authStatus: '已开通',
                  tenantStatus: item.tenantStatus,
                  name: item.name,
                  nameLocked: true,
                  projectInfo: item.projectInfo,
                  updatedAt: at,
                  updatedBy: actor.id,
                }
              : row,
          ),
        }));
        return null;
      },
      dismissYinguan: (id) => {
        commit((draft) => ({
          ...draft,
          yinguan: draft.yinguan.map((row) => (row.id === id ? { ...row, queue: '已处理', note: '已标记暂不处理' } : row)),
        }));
      },
      createDispatch: (input) => {
        if (!input.title.trim() || !input.description.trim() || !input.standard.trim() || !input.dueAt) {
          return { error: '请填写标题、任务描述、完成标准和截止时间' };
        }
        const targets: { branchId: string; ownerId: string; customerId?: string }[] = [];
        if (input.targetScope === '按指定人') {
          if (!input.ownerId) return { error: '请指定执行人' };
          const owner = USERS.find((item) => item.id === input.ownerId);
          if (!owner) return { error: '执行人不存在' };
          targets.push({ branchId: owner.branchId === '总行' ? input.branchIds[0] || actor.branchId : owner.branchId, ownerId: owner.id, customerId: input.customerId });
        } else if (input.targetScope === '按分行') {
          if (!input.branchIds.length) return { error: '请选择分行' };
          input.branchIds.forEach((branchId) => {
            const owner = USERS.find((item) => item.branchId === branchId && item.role === 'frontline' && item.status === '在职');
            if (owner) targets.push({ branchId, ownerId: owner.id, customerId: input.customerId });
          });
          if (!targets.length) return { error: '所选分行没有在职一线顾问账号' };
        } else if (input.targetScope === '按客群') {
          const branchSet = new Set(input.branchIds.length ? input.branchIds : [actor.branchId]);
          state.customers
            .filter((item) => item.tier === '要客级' && branchSet.has(item.branchId))
            .forEach((item) => targets.push({ branchId: item.branchId, ownerId: item.ownerId, customerId: item.id }));
          if (!targets.length) return { error: '所选范围内没有要客级客户' };
        } else {
          const owner = USERS.find((item) => item.team === '一线' && item.status === '在职' && (input.branchIds[0] ? item.branchId === input.branchIds[0] : true));
          if (!owner) return { error: '没有可派的一线顾问' };
          targets.push({ branchId: owner.branchId, ownerId: owner.id, customerId: input.customerId });
        }
        const ids: string[] = [];
        commit((draft, at, seq) => {
          let seqNo = seq;
          const created = targets.map((target) => {
            seqNo += 1;
            const id = `t-${seqNo}`;
            ids.push(id);
            const customer = draft.customers.find((item) => item.id === target.customerId);
            return shell({
              id,
              no: ticketNo(input.typeCode, seqNo),
              typeCode: input.typeCode,
              title: customer && input.targetScope === '按客群' ? `${input.title}（${customer.name}）` : input.title.trim(),
              kind: 'dispatch',
              status: '待接收',
              priority: input.priority,
              customerId: target.customerId,
              branchId: customer?.branchId || target.branchId,
              creatorId: actor.id,
              ownerId: target.ownerId,
              acceptorId: input.acceptorId || actor.id,
              path: input.path,
              targetScope: input.targetScope,
              description: input.description.trim(),
              standard: input.standard.trim(),
              dueAt: input.dueAt,
              createdAt: at,
              cc: input.cc,
              attachments: input.attachments,
              kycCreditCode: input.kycCreditCode?.trim().toUpperCase(),
              kycNote: input.kycNote,
              source: '下发',
              handlerTrail: [{ at, userId: actor.id, node: '下发', note: `按${input.targetScope}下发` }],
            });
          });
          return { ...draft, seq: seqNo, tickets: [...created, ...draft.tickets] };
        });
        return { ids };
      },
      createSimple: (input) => {
        const customer = state.customers.find((item) => item.id === input.customerId);
        if (!customer) return { error: '请选择客户档案' };
        if (!input.title.trim()) return { error: '请填写标题' };
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `t-${seqNo}`;
          const created = shell({
            id,
            no: ticketNo(input.typeCode, seqNo),
            typeCode: input.typeCode,
            title: input.title.trim(),
            kind: 'frontline' as TicketKind,
            status: input.ownerId && input.ownerId !== actor.id ? '处理中' : '待分配',
            priority: input.priority,
            customerId: customer.id,
            branchId: customer.branchId,
            creatorId: actor.id,
            ownerId: input.ownerId,
            description: input.description.trim(),
            standard: input.standard.trim(),
            dueAt: input.dueAt,
            createdAt: at,
            slaStartedAt: at,
            source: '一线提交',
            handlerTrail: [{ at, userId: actor.id, node: '一线', note: input.ownerId === actor.id ? '自己给自己提单' : '提交到集中实施' }],
          });
          if (input.ownerId === actor.id) created.status = '处理中';
          return { ...draft, seq: seqNo, tickets: [created, ...draft.tickets] };
        });
        return { id };
      },
      createMaster: (input) => {
        const customer = state.customers.find((item) => item.id === input.customerId);
        if (!customer) return { error: '请选择客户档案' };
        if (state.tickets.some((item) => item.typeCode === 'PE01' && item.customerId === customer.id && !['已完成', '已取消'].includes(item.status))) {
          return { error: '该客户已有未结项的实施主单' };
        }
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `t-${seqNo}`;
          const chain = CHAINS[customer.tier];
          const master = shell({
            id,
            no: ticketNo('PE01', seqNo),
            typeCode: 'PE01',
            title: `${customer.name}实施`,
            kind: 'master',
            status: '实施中',
            stage: '实施',
            priority: customer.tier === '要客级' ? '紧急' : '正常',
            customerId: customer.id,
            branchId: customer.branchId,
            creatorId: actor.id,
            ownerId: input.ownerId || customer.ownerId,
            description: input.description.trim() || '项目开通后发起实施主单。',
            dueAt: input.dueAt,
            createdAt: at,
            templateName: chain.name,
            projectPhase: '项目开通',
            tier: customer.tier,
            source: '实施主单',
            handlerTrail: [{ at, userId: actor.id, node: '发起', note: `按${customer.tier}匹配${chain.name}` }],
          });
          const spawned = spawnChildren(master, customer.tier, seqNo, at);
          return { ...draft, seq: spawned.seq, tickets: [master, ...spawned.children, ...draft.tickets] };
        });
        return { id };
      },
      simulateSystem: (typeCode, customerId) => {
        const customer = state.customers.find((item) => item.id === customerId);
        if (!customer) return { error: '请选择客户' };
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `t-${seqNo}`;
          const created = shell({
            id,
            no: ticketNo(typeCode, seqNo),
            typeCode,
            title: typeCode === 'T10' ? `${customer.name}监测告警` : `${customer.name}流失预警回访`,
            kind: 'system',
            status: typeCode === 'T10' ? '告警处理' : '进行中',
            priority: '紧急',
            customerId: customer.id,
            branchId: customer.branchId,
            creatorId: actor.id,
            ownerId: typeCode === 'T10' ? 'u-sunqi' : customer.ownerId,
            description: typeCode === 'T10' ? '演示：E2 告警自动生成。' : '演示：流失规则自动生成回访。',
            standard: typeCode === 'T13' ? '回访记录 + 挽留结果' : '解决情况',
            dueAt: dayjs(NOW).add(2, 'day').format('YYYY-MM-DD HH:mm'),
            createdAt: at,
            slaStartedAt: at,
            systemRule: typeCode === 'T10' ? '规则 MON-E2-演示' : '规则 CHURN-演示',
            source: '系统触发',
            handlerTrail: [{ at, userId: actor.id, node: '系统', note: '按场景派给对接人' }],
          });
          return { ...draft, seq: seqNo, tickets: [created, ...draft.tickets] };
        });
        return { id };
      },
      receive: (id) => {
        patchTicket(id, (ticket, at) =>
          ticket.status === '待接收'
            ? { ...ticket, status: '进行中', handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '一线', note: '接收任务' }] }
            : ticket,
        );
      },
      saveProgress: (id, progress, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          progress,
          status: ticket.status === '待接收' ? '进行中' : ticket.status,
          followUps: note.trim() ? [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim(), kind: '备注' as const }] : ticket.followUps,
        }));
      },
      setStatus: (id, status, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status,
          closedAt: status === '已完成' ? at : ticket.closedAt,
          handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '处理', note }],
        }));
      },
      submitDispatch: (id, hours, note) => {
        const current = state.tickets.find((item) => item.id === id);
        if (!current) return '工单不存在';
        if (!hours || hours <= 0) return '请填报工时';
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status: '待验收',
          progress: 100,
          submittedAt: at,
          reportedHours: hours,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '提交反馈，等待验收', kind: '备注' }],
          handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '一线', note: `提交反馈，填报工时 ${hours} 小时` }],
        }));
        return null;
      },
      acceptDispatch: (id, pass, note) => {
        patchTicket(id, (ticket, at) => {
          if (pass) {
            const start = dayjs(ticket.createdAt);
            const end = dayjs(at);
            return {
              ...ticket,
              status: '已完成',
              closedAt: at,
              handlingHours: Math.round(end.diff(start, 'hour', true) * 10) / 10,
              followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '验收通过', kind: '验收' }],
              handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '验收', note: '验收通过' }],
            };
          }
          return {
            ...ticket,
            status: '进行中',
            progress: Math.min(ticket.progress, 80),
            submittedAt: undefined,
            followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '验收不通过，退回执行', kind: '验收' }],
            handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '验收', note: '退回进行中' }],
          };
        });
      },
      cancelTicket: (id, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status: '已取消',
          closedAt: at,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '取消工单', kind: '备注' }],
        }));
      },
      urge: (id, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          urgeCount: ticket.urgeCount + 1,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '请尽快处理', kind: '催办' }],
        }));
      },
      follow: (id, note) => {
        if (!note.trim()) return;
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim(), kind: '跟进' }],
        }));
      },
      assignTickets: (ids, ownerId) => {
        commit((draft, at) => ({
          ...draft,
          tickets: draft.tickets.map((ticket) => {
            if (!ids.includes(ticket.id)) return ticket;
            const nextStatus = ticket.status === '待分配' || ticket.status === '待派单' ? '处理中' : ticket.status;
            return {
              ...ticket,
              ownerId,
              status: nextStatus,
              slaStartedAt: ticket.slaStartedAt || at,
              handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '派单', note: `派给 ${USERS.find((item) => item.id === ownerId)?.name || ''}` }],
            };
          }),
        }));
      },
      transferTickets: (ids, ownerId) => {
        commit((draft, at) => ({
          ...draft,
          tickets: draft.tickets.map((ticket) =>
            ids.includes(ticket.id)
              ? {
                  ...ticket,
                  ownerId,
                  slaStartedAt: at,
                  handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '转派', note: `转给 ${USERS.find((item) => item.id === ownerId)?.name || ''}，SLA 重新计时，总周期继续累计` }],
                }
              : ticket,
          ),
        }));
      },
      advanceChild: (id, to, note) => {
        const current = state.tickets.find((item) => item.id === id);
        if (!current) return '工单不存在';
        if (to === '已挂起' && current.typeCode !== 'T05') return '只有远程实施工单 T05 可以挂起';
        if (to === '已取消' && current.requiredChild) return '必含环节不能取消';
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status: to,
          progress: to === '已完成' ? 100 : to === '进行中' ? Math.max(ticket.progress, 10) : ticket.progress,
          closedAt: to === '已完成' || to === '已取消' ? at : undefined,
          handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '子工单', note: note.trim() || `状态改为${to}` }],
        }));
        return null;
      },
      setPhase: (id, phase, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          projectPhase: phase,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || `节点反馈：${phase}`, kind: '备注' }],
        }));
      },
      pauseMaster: (id, paused, note) => {
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status: paused ? '已暂停' : '实施中',
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || (paused ? '暂停实施' : '恢复实施'), kind: '备注' }],
        }));
      },
      closeMaster: (id, hours, note) => {
        const kids = state.tickets.filter((item) => item.parentId === id && item.status !== '已取消');
        const blocking = kids.filter((item) => item.requiredChild && item.status !== '已完成');
        if (blocking.length) return `还有 ${blocking.length} 个必含子工单未完成`;
        if (!hours || hours <= 0) return '结项需要填报工时';
        patchTicket(id, (ticket, at) => ({
          ...ticket,
          status: '已完成',
          projectPhase: '交付结项',
          closedAt: at,
          reportedHours: hours,
          handlingHours: Math.round(dayjs(at).diff(dayjs(ticket.createdAt), 'hour', true) * 10) / 10,
          followUps: [...ticket.followUps, { id: `fu-${at}`, at, by: actor.id, content: note.trim() || '结项', kind: '验收' }],
        }));
        return null;
      },
      aftersales: (id, act, extra) => {
        const current = state.tickets.find((item) => item.id === id);
        if (!current) return '工单不存在';
        if ((act === 'confirm' || act === 'selfClose') && (!extra?.hours || extra.hours <= 0)) return '关单必须填报工时';
        let error: string | null = null;
        commit((draft, at, seq) => {
          let seqNo = seq;
          let extraTicket: Ticket | null = null;
          const tickets = draft.tickets.map((ticket) => {
            if (ticket.id !== id) return ticket;
            if (act === 'toPool') {
              return {
                ...ticket,
                status: '待分配',
                ownerId: undefined,
                slaStartedAt: at,
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '一线', note: '无法处理，转入工单池。自处理阶段不计入 SLA。' }],
              };
            }
            if (act === 'toRd') {
              return {
                ...ticket,
                status: '研发处理中',
                ownerId: 'u-qiancheng',
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '二线技术支持', note: extra?.note || '转研发，工单号不变' }],
              };
            }
            if (act === 'toDemand') {
              seqNo += 1;
              extraTicket = shell({
                id: `t-${seqNo}`,
                no: ticketNo('T06', seqNo),
                typeCode: 'T06',
                title: `需求：${ticket.title}`,
                kind: 'frontline',
                stage: '售后',
                status: '待产品受理',
                priority: ticket.priority,
                customerId: ticket.customerId,
                branchId: ticket.branchId,
                creatorId: actor.id,
                ownerId: 'u-qiancheng',
                description: extra?.note || ticket.description,
                createdAt: at,
                linkedTicketId: ticket.id,
                source: '售后转入',
                handlerTrail: [{ at, userId: actor.id, node: '技术支持', note: '由售后工单评估转入需求池' }],
              });
              return {
                ...ticket,
                status: '已转需求',
                linkedTicketId: extraTicket.id,
                closedAt: at,
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '技术支持', note: `转需求 ${extraTicket.no}` }],
              };
            }
            if (act === 'finish') {
              return {
                ...ticket,
                status: '待一线确认',
                solution: extra?.solution || extra?.note || ticket.solution,
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '二线技术支持', note: '处理完成，待一线确认' }],
              };
            }
            if (act === 'confirm' || act === 'selfClose') {
              return {
                ...ticket,
                status: '已完成',
                closedAt: at,
                reportedHours: extra?.hours,
                handlingHours: Math.round(dayjs(at).diff(dayjs(ticket.createdAt), 'hour', true) * 10) / 10,
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '一线', note: act === 'selfClose' ? '一线自行关闭' : '一线确认关闭' }],
              };
            }
            if (act === 'reject') {
              return {
                ...ticket,
                status: '处理中',
                handlerTrail: [...ticket.handlerTrail, { at, userId: actor.id, node: '一线', note: extra?.note || '确认不通过，退回' }],
              };
            }
            return { ...ticket, status: '已取消', closedAt: at };
          });
          return { ...draft, seq: seqNo, tickets: extraTicket ? [extraTicket, ...tickets] : tickets };
        });
        return error;
      },
      addLog: (input) => {
        const customer = state.customers.find((item) => item.id === input.customerId);
        if (!customer) return '';
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `l${seqNo}`;
          const created: ServiceLog = {
            id,
            date: input.date,
            stage: input.stage,
            visitType: input.visitType,
            hours: input.hours,
            customerId: customer.id,
            branchId: customer.branchId,
            ownerId: actor.id,
            ticketId: input.ticketId || undefined,
            content: input.content.trim(),
            createdAt: at,
          };
          const tickets = draft.tickets.map((ticket) => {
            if (!input.ticketId || ticket.id !== input.ticketId) return ticket;
            if (ticket.kind === 'dispatch' && ['进行中', '待接收'].includes(ticket.status)) {
              return { ...ticket, status: '进行中', progress: Math.min(90, ticket.progress + 20) };
            }
            return ticket;
          });
          return { ...draft, seq: seqNo, logs: [created, ...draft.logs], tickets };
        });
        return id;
      },
      startSession: (mode, customerId, initial) => {
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `s${seqNo}`;
          const content = initial?.trim() || '';
          const created: AiSession = {
            id,
            mode,
            customerId,
            title: content ? content.slice(0, 18) : mode === 'aftersales' ? '新的售后咨询' : '营销咨询',
            messages: content
              ? [
                  { role: 'user', content, at },
                  { role: 'assistant', content: aiAnswer(content), at },
                ]
              : [],
            createdAt: at,
            userId: actor.id,
          };
          return { ...draft, seq: seqNo, sessions: [created, ...draft.sessions] };
        });
        return id;
      },
      chat: (sessionId, text) => {
        const content = text.trim();
        if (!content) return;
        commit((draft, at) => ({
          ...draft,
          sessions: draft.sessions.map((session) => {
            if (session.id !== sessionId || session.ticketId || session.resolved) return session;
            const reply = aiAnswer(content);
            const title = session.messages.length === 0 ? content.slice(0, 18) : session.title;
            return {
              ...session,
              title,
              messages: [
                ...session.messages,
                { role: 'user' as const, content, at },
                { role: 'assistant' as const, content: reply, at },
              ],
            };
          }),
        }));
      },
      resolveSession: (sessionId) => {
        commit((draft) => ({
          ...draft,
          sessions: draft.sessions.map((session) => (session.id === sessionId ? { ...session, resolved: true } : session)),
        }));
      },
      convertSession: (sessionId, input) => {
        const session = state.sessions.find((item) => item.id === sessionId);
        if (!session) return { ok: false, error: '会话不存在' };
        if (session.mode !== 'aftersales') return { ok: false, error: '营销咨询不转入售后工单' };
        if (session.ticketId) return { ok: false, error: '该会话已经转过工单' };
        const rounds = session.messages.filter((item) => item.role === 'user').length;
        if (rounds < 1) return { ok: false, error: '至少完成 1 轮问答后才能转工单' };
        if (!input.reason) return { ok: false, error: '请选择未解决原因' };
        const customer = state.customers.find((item) => item.id === input.customerId);
        if (!customer) return { ok: false, error: '请选择客户档案' };
        let id = '';
        commit((draft, at, seq) => {
          const seqNo = seq + 1;
          id = `t-${seqNo}`;
          const created = shell({
            id,
            no: ticketNo('T09', seqNo),
            typeCode: 'T09',
            title: input.title.trim() || session.title,
            kind: 'frontline',
            stage: '售后',
            status: '自处理',
            priority: customer.tier === '要客级' ? '紧急' : '正常',
            customerId: customer.id,
            branchId: customer.branchId,
            creatorId: actor.id,
            ownerId: actor.id,
            description: input.description.trim(),
            problemType: input.problemType,
            customerLevel: input.customerLevel,
            expectAt: input.expectAt,
            unresolvedReason: input.reason,
            aiSessionId: session.id,
            transcript: session.messages,
            createdAt: at,
            source: 'AI问答转入',
            handlerTrail: [{ at, userId: actor.id, node: '一线', note: `AI 未解决（${input.reason}），生成售后工单，先自处理` }],
          });
          return {
            ...draft,
            seq: seqNo,
            tickets: [created, ...draft.tickets],
            sessions: draft.sessions.map((item) => (item.id === sessionId ? { ...item, ticketId: id, customerId: customer.id } : item)),
          };
        });
        return { ok: true, id };
      },
      markReusable: (ticketId) => {
        const current = state.tickets.find((item) => item.id === ticketId);
        if (!current?.solution) return;
        commit((draft, at, seq) => ({
          ...draft,
          seq: seq + 1,
          tickets: draft.tickets.map((item) => (item.id === ticketId ? { ...item, reusable: true } : item)),
          articles: [
            {
              id: `a${seq + 1}`,
              title: `可复用：${current.title}`,
              category: '工单沉淀',
              updatedAt: at.slice(0, 10),
              summary: current.solution || '',
              sections: [
                { heading: '现象', paragraphs: [current.description] },
                { heading: '解决方案', paragraphs: [current.solution || ''] },
                { heading: '根因', paragraphs: [current.rootCause || '处理人未单列根因'] },
              ],
            },
            ...draft.articles,
          ],
        }));
      },
      finishAiCase: (id, status, duration) => {
        commit((draft, at) => ({
          ...draft,
          aiCases: draft.aiCases.map((item) => (item.id === id ? { ...item, status, lastRun: at, duration } : item)),
        }));
      },
    };
  }, [actor, state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): StoreApi {
  const value = useContext(Ctx);
  if (!value) throw new Error('Store 未就绪');
  return value;
}
