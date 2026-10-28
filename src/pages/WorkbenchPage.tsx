import { Button, Select, Space, Table, Tabs, Tag } from 'antd';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead, StatusTag, personName } from '../components';
import { isTerminal, round1, serviceStage } from '../logic';
import { useApp } from '../store';
import type { AppUser, Customer, Ticket } from '../types';

export default function WorkbenchPage() {
  const { state, actor } = useApp();
  if (state.role === 'leader') return <LeaderHome />;
  if (state.role === 'central') return <CentralHome />;
  if (state.role === 'director') return <DirectorHome />;
  return <PersonalHome user={actor} mine />;
}

function visibleCustomers(customers: Customer[], user: AppUser) {
  if (user.branchId === '总行') return customers;
  return customers.filter((item) => item.branchId === user.branchId);
}

function visibleTickets(tickets: Ticket[], user: AppUser) {
  if (user.branchId === '总行') return tickets;
  return tickets.filter((item) => item.branchId === user.branchId);
}

export function PersonalHome({ user, mine }: { user: AppUser; mine?: boolean }) {
  const { state, users } = useApp();
  const navigate = useNavigate();
  const customers = state.customers.filter((item) => item.ownerId === user.id);
  const tickets = state.tickets.filter((item) => !item.parentId && (item.ownerId === user.id || item.creatorId === user.id));
  const masters = state.tickets.filter((item) => item.typeCode === 'PE01' && (item.ownerId === user.id || customers.some((customer) => customer.id === item.customerId)));
  const pendingOpen = customers.filter((item) => item.authStatus === '待开通');
  const waiting = tickets.filter((item) => item.status === '待接收' && item.ownerId === user.id);
  const byStatus = countBy(tickets.map((item) => item.status));
  return (
    <div data-testid={mine ? 'page-workbench' : 'page-member'}>
      <PageHead
        title={mine ? '一线个人工作台' : `${user.name}的个人工作台`}
        desc={`${user.org}。管户客户、名下工单和实施项目。待开通档案会留在待办里，等应管回填租户号。`}
      />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">管户客户</div><div className="stat-value">{customers.length}</div><div className="stat-extra">要客级 {customers.filter((item) => item.tier === '要客级').length} · 待开通 {pendingOpen.length}</div></div>
        <div className="stat navy"><div className="stat-label">名下工单</div><div className="stat-value">{tickets.length}</div><div className="stat-extra">待接收 {waiting.length} · 进行中 {byStatus['进行中'] || 0}</div></div>
        <div className="stat"><div className="stat-label">实施主单</div><div className="stat-value">{masters.filter((item) => item.status === '实施中').length}</div><div className="stat-extra">共 {masters.length} 个项目</div></div>
        <div className="stat gold"><div className="stat-label">待办</div><div className="stat-value">{pendingOpen.length + waiting.length}</div><div className="stat-extra">待开通档案与待接收下发</div></div>
      </div>
      <div className="panel">
        <h2>快捷访问</h2>
        <Space wrap>
          <Button onClick={() => navigate('/customers/new')}>新增客户档案</Button>
          <Button onClick={() => navigate('/services/logs/new')}>新增服务日志</Button>
          <Button onClick={() => navigate('/services/ai')}>AI 问答</Button>
          <Button onClick={() => navigate('/services/tickets?kind=dispatch')}>下发工单</Button>
          <Button onClick={() => navigate('/services/implementation')}>实施过程</Button>
        </Space>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
        <div className="panel">
          <h2>管户客户</h2>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={customers}
            onRow={(row) => ({ onClick: () => navigate(`/customers/${row.id}`), className: 'click-row' })}
            columns={[
              { title: '企业', dataIndex: 'name' },
              { title: '定级', dataIndex: 'tier', render: (value: string) => <StatusTag value={value} /> },
              { title: '认证', dataIndex: 'authStatus', render: (value: string) => <StatusTag value={value} /> },
              { title: '服务阶段', render: (_, row) => serviceStage(row.id, state.tickets) },
            ]}
          />
        </div>
        <div className="panel">
          <h2>工单状态</h2>
          <Table
            size="small"
            rowKey="status"
            pagination={false}
            dataSource={Object.entries(byStatus).map(([status, count]) => ({ status, count }))}
            columns={[
              { title: '状态', dataIndex: 'status', render: (value: string) => <StatusTag value={value} /> },
              { title: '数量', dataIndex: 'count' },
            ]}
          />
          <h2 style={{ marginTop: 16 }}>待接收</h2>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={waiting}
            onRow={(row) => ({ onClick: () => navigate(`/services/tickets/${row.id}`), className: 'click-row' })}
            columns={[
              { title: '单号', dataIndex: 'no' },
              { title: '标题', dataIndex: 'title' },
              { title: '发起', render: (_, row) => personName(users, row.creatorId) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function LeaderHome() {
  const { state, actor, users } = useApp();
  const navigate = useNavigate();
  const [member, setMember] = useState(actor.id);
  const branchCustomers = visibleCustomers(state.customers, actor);
  const branchTickets = visibleTickets(state.tickets, actor).filter((item) => !item.parentId);
  const implCustomers = branchCustomers.filter((item) => state.tickets.some((ticket) => ticket.customerId === item.id && ticket.typeCode === 'PE01' && ticket.status === '实施中'));
  const pendingTier = branchCustomers.filter((item) => item.pendingTier);
  const memberUser = users.find((item) => item.id === member) || actor;
  return (
    <div data-testid="page-workbench">
      <PageHead title="一线小组工作台" desc={`${actor.branchId}分行全量。组长可以复核定级、移交管护，也可以切到顾问个人工作台。`} />
      <Tabs
        items={[
          {
            key: 'branch',
            label: '分行全量',
            children: (
              <>
                <div className="stat-grid">
                  <div className="stat"><div className="stat-label">管户客户总数</div><div className="stat-value">{branchCustomers.length}</div><div className="stat-extra">待开通 {branchCustomers.filter((item) => item.authStatus === '待开通').length}</div></div>
                  <div className="stat navy"><div className="stat-label">实施客户</div><div className="stat-value">{implCustomers.length}</div><div className="stat-extra">实施中的主单客户</div></div>
                  <div className="stat"><div className="stat-label">工单总数</div><div className="stat-value">{branchTickets.length}</div><div className="stat-extra">不含实施子单</div></div>
                  <div className="stat gold"><div className="stat-label">定级待复核</div><div className="stat-value">{pendingTier.length}</div><div className="stat-extra">变更需组长同意后才生效</div></div>
                </div>
                <div className="panel">
                  <h2>实施客户</h2>
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={implCustomers}
                    onRow={(row) => ({ onClick: () => navigate(`/customers/${row.id}`), className: 'click-row' })}
                    columns={[
                      { title: '企业', dataIndex: 'name' },
                      { title: '定级', dataIndex: 'tier', render: (value: string) => <StatusTag value={value} /> },
                      { title: '管护人', render: (_, row) => personName(users, row.ownerId) },
                      { title: '阶段', render: (_, row) => state.tickets.find((item) => item.customerId === row.id && item.typeCode === 'PE01' && item.status === '实施中')?.projectPhase },
                    ]}
                  />
                  <Space style={{ marginTop: 12 }}>
                    <Button type="primary" onClick={() => navigate('/customers/ownership')}>批量移交管护</Button>
                    <Button onClick={() => navigate('/customers')}>客户列表</Button>
                  </Space>
                </div>
              </>
            ),
          },
          {
            key: 'person',
            label: '个人工作台',
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <span>查看成员</span>
                  <Select
                    style={{ width: 220 }}
                    value={member}
                    options={users.filter((item) => item.branchId === actor.branchId).map((item) => ({ value: item.id, label: `${item.name} · ${item.title}` }))}
                    onChange={setMember}
                  />
                </Space>
                <PersonalHome user={memberUser} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

function CentralHome() {
  const { state, actor, users, can, assignTickets, transferTickets } = useApp();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState('u-sunqi');
  const pool = state.tickets.filter((item) => item.status === '待分配');
  const mine = state.tickets.filter((item) => item.ownerId === actor.id && !isTerminal(item.status));
  const pending = state.tickets.filter((item) => ['待分配', '处理中', '研发处理中'].includes(item.status));
  const today = state.tickets.filter((item) => item.createdAt.startsWith('2026-10-28') && item.kind !== 'child');
  const closed = state.tickets.filter((item) => item.handlingHours && item.kind !== 'child');
  const avg = closed.length ? round1(closed.reduce((sum, item) => sum + (item.handlingHours || 0), 0) / closed.length) : 0;
  const handlers = users.filter((item) => item.branchId === '总行' && item.role === 'central');
  const columns = [
    { title: '单号', dataIndex: 'no', width: 170 },
    { title: '类型', dataIndex: 'typeCode', width: 80 },
    { title: '标题', dataIndex: 'title' },
    { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <StatusTag value={value} /> },
    { title: '处理人', width: 90, render: (_: unknown, row: Ticket) => personName(users, row.ownerId) },
    { title: '分行', dataIndex: 'branchId', width: 80 },
  ];
  return (
    <div data-testid="page-central">
      <PageHead title="集中运营工作台" desc="实施组与技术支持共用这个入口。待分配池可以批量派单，处理中的单可以批量转派。转派后 SLA 重新计时，工单总周期继续累计。" extra={<Tag>当前身份 {actor.name} · {actor.team}</Tag>} />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">待处理</div><div className="stat-value">{pending.length}</div><div className="stat-extra">待分配 {pool.length} · 处理中 {pending.filter((item) => item.status === '处理中').length}</div></div>
        <div className="stat navy"><div className="stat-label">今日新增</div><div className="stat-value">{today.length}</div><div className="stat-extra">不含范式生成的子单</div></div>
        <div className="stat"><div className="stat-label">平均处理时长</div><div className="stat-value">{avg}</div><div className="stat-extra">已关闭工单，单位小时</div></div>
        <div className="stat gold"><div className="stat-label">我的在办</div><div className="stat-value">{mine.length}</div><div className="stat-extra">处理人是{actor.name}</div></div>
      </div>
      <div className="panel">
        <Space style={{ marginBottom: 8 }} wrap>
          <Select style={{ width: 160 }} value={ownerId} options={handlers.map((item) => ({ value: item.id, label: `${item.name} · ${item.team}` }))} onChange={setOwnerId} />
          <Button
            type="primary"
            disabled={!can('batchAssign') || !picked.length}
            onClick={() => {
              assignTickets(picked, ownerId);
              setPicked([]);
            }}
          >
            批量派单
          </Button>
          <Button
            disabled={!can('batchTransfer') || !picked.length}
            onClick={() => {
              transferTickets(picked, ownerId);
              setPicked([]);
            }}
          >
            批量转派
          </Button>
          <Button onClick={() => navigate('/services/tickets/new?group=dispatch')}>新建下发</Button>
          <Button onClick={() => navigate('/services/exposure')}>晾晒</Button>
          <Button onClick={() => navigate('/services/implementation')}>实施过程</Button>
        </Space>
        <Tabs
          items={[
            { key: 'mine', label: `个人待办 ${mine.length}`, children: <TicketTable rows={mine} columns={columns} picked={picked} setPicked={setPicked} /> },
            { key: 'pool', label: `待分配池 ${pool.length}`, children: <TicketTable rows={pool} columns={columns} picked={picked} setPicked={setPicked} /> },
          ]}
        />
      </div>
    </div>
  );
}

function TicketTable({
  rows,
  columns,
  picked,
  setPicked,
}: {
  rows: Ticket[];
  columns: { title: string; dataIndex?: string; width?: number; render?: (value: never, row: Ticket) => ReactNode }[];
  picked: string[];
  setPicked: (ids: string[]) => void;
}) {
  const navigate = useNavigate();
  return (
    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      rowSelection={{ selectedRowKeys: picked, onChange: (keys) => setPicked(keys as string[]) }}
      onRow={(row) => ({ onClick: () => navigate(`/services/tickets/${row.id}`), className: 'click-row' })}
      columns={columns as never}
    />
  );
}

function DirectorHome() {
  const { state } = useApp();
  const navigate = useNavigate();
  const openTickets = state.tickets.filter((item) => !item.parentId && !isTerminal(item.status));
  const masters = state.tickets.filter((item) => item.typeCode === 'PE01' && item.status === '实施中');
  const red = state.tickets.filter((item) => ['T01', 'T02', 'T07', 'T08', 'T12', 'T14', 'T15'].includes(item.typeCode) && ['待接收', '进行中'].includes(item.status) && item.dueAt && item.dueAt < '2026-10-28 15:00');
  const dispatchAll = state.tickets.filter((item) => ['T01', 'T02', 'T07', 'T08', 'T12', 'T14', 'T15'].includes(item.typeCode));
  const done = dispatchAll.filter((item) => item.status === '已完成').length;
  const rate = dispatchAll.length ? Math.round((done / dispatchAll.length) * 100) : 0;
  return (
    <div data-testid="page-workbench">
      <PageHead title="运营工作台" desc="运营部整体的客户、工单和实施。超时下发进晾晒，供部门管理者跟进。" extra={<Button type="primary" onClick={() => navigate('/services/exposure')}>打开晾晒</Button>} />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">客户档案</div><div className="stat-value">{state.customers.length}</div><div className="stat-extra">要客级 {state.customers.filter((item) => item.tier === '要客级').length}</div></div>
        <div className="stat navy"><div className="stat-label">在途工单</div><div className="stat-value">{openTickets.length}</div><div className="stat-extra">不含子单</div></div>
        <div className="stat"><div className="stat-label">实施中项目</div><div className="stat-value">{masters.length}</div><div className="stat-extra">PE01 未结项</div></div>
        <div className="stat red"><div className="stat-label">下发超时</div><div className="stat-value">{red.length}</div><div className="stat-extra">下发完成率 {rate}%</div></div>
      </div>
      <div className="panel">
        <h2>需要晾晒的下发</h2>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={red}
          onRow={(row) => ({ onClick: () => navigate(`/services/tickets/${row.id}`), className: 'click-row' })}
          columns={[
            { title: '单号', dataIndex: 'no' },
            { title: '类型', dataIndex: 'typeCode' },
            { title: '标题', dataIndex: 'title' },
            { title: '城市', dataIndex: 'branchId' },
            { title: '状态', dataIndex: 'status', render: (value: string) => <StatusTag value={value} /> },
          ]}
        />
      </div>
    </div>
  );
}

function countBy(list: string[]): Record<string, number> {
  return list.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}
