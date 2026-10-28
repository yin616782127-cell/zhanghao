import { Alert, Button, Input, Progress, Select, Space, Steps, Table, Tag } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CHAINS, FEEDBACK_NODES, PROJECT_PHASES } from '../catalog';
import { HoursDialog, PageHead, StatusTag, personName } from '../components';
import { daysOpen, logHours, masterProgress } from '../logic';
import { useApp } from '../store';

export default function ImplementationPage() {
  const { id } = useParams();
  if (id) return <ProjectView id={id} />;
  return <ProjectList />;
}

function ProjectList() {
  const { state, actor, users } = useApp();
  const navigate = useNavigate();
  const rows = state.tickets.filter((item) => item.typeCode === 'PE01' && (actor.branchId === '总行' || item.branchId === actor.branchId));
  return (
    <div>
      <PageHead title="实施过程管理" desc="一个客户一张主单，按实施定级匹配链路，子单独立流转，服务日志可以挂主单或子单。进度 = 已完成子单数 / 子单总数。" extra={<Button type="primary" onClick={() => navigate('/services/tickets/new?group=master')}>发起主单</Button>} />
      <div className="panel">
        <Table
          size="small"
          rowKey="id"
          dataSource={rows}
          onRow={(row) => ({ onClick: () => navigate(`/services/implementation/${row.id}`), className: 'click-row' })}
          columns={[
            { title: '主单', dataIndex: 'no', width: 180 },
            { title: '项目', dataIndex: 'title' },
            { title: '定级', dataIndex: 'tier', width: 90, render: (value: string) => <StatusTag value={value} /> },
            { title: '阶段', dataIndex: 'projectPhase', width: 120 },
            { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <StatusTag value={value} /> },
            { title: '进度', width: 160, render: (_, row) => { const progress = masterProgress(row.id, state.tickets); return `${progress.done}/${progress.total} · ${progress.percent}%`; } },
            { title: '管护执行', width: 90, render: (_, row) => personName(users, row.ownerId) },
          ]}
        />
      </div>
    </div>
  );
}

function ProjectView({ id }: { id: string }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const app = useApp();
  const { state, users, can } = app;
  const master = state.tickets.find((item) => item.id === id && item.typeCode === 'PE01');
  const [phase, setPhase] = useState(master?.projectPhase || PROJECT_PHASES[0]);
  const [note, setNote] = useState('');
  const [hoursOpen, setHoursOpen] = useState(false);
  if (!master) return <Alert type="warning" message="实施主单不存在" />;
  const customer = state.customers.find((item) => item.id === master.customerId);
  const chain = master.tier ? CHAINS[master.tier] : undefined;
  const children = state.tickets.filter((item) => item.parentId === master.id);
  const progress = masterProgress(master.id, state.tickets);
  const logs = state.logs.filter((item) => item.ticketId === master.id || children.some((child) => child.id === item.ticketId));
  const hours = logHours(state.logs, [master.id, ...children.map((item) => item.id)]);
  const opened = daysOpen(master.createdAt, master.closedAt || undefined);
  const materials = customer?.materials || [];
  return (
    <div data-testid="page-impl">
      <PageHead
        title={master.title}
        desc={`${master.no} · ${master.templateName || ''} · ${chain?.manage || ''}`}
        extra={<Button onClick={() => navigate('/services/implementation')}>返回</Button>}
      />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">实施进度</div><div className="stat-value">{progress.percent}%</div><div className="stat-extra">{progress.done}/{progress.total} 个子单已完成</div></div>
        <div className="stat navy"><div className="stat-label">已进行</div><div className="stat-value">{opened}</div><div className="stat-extra">天。模板标准 {chain?.stdDays ?? '—'} 天（演示配置，不是文档给定工期）</div></div>
        <div className="stat"><div className="stat-label">服务投入</div><div className="stat-value">{hours}</div><div className="stat-extra">小时，来自关联日志</div></div>
        <div className="stat gold"><div className="stat-label">客户</div><div className="stat-value" style={{ fontSize: 16 }}>{customer ? <Link to={`/customers/${customer.id}`}>{customer.name}</Link> : '—'}</div><div className="stat-extra">{customer?.tier} · {customer?.authStatus}</div></div>
      </div>
      {chain && master.tier && opened > chain.stdDays && master.status !== '已完成' ? (
        <Alert style={{ marginBottom: 12 }} type="warning" showIcon message={`实际周期比模板标准多 ${opened - chain.stdDays} 天`} description="偏差用来回头看 SOP。标准天数是模板里的演示值。" />
      ) : null}
      <div className="panel">
        <h2>项目阶段</h2>
        <Steps size="small" current={Math.max(PROJECT_PHASES.indexOf((master.projectPhase || '项目开通') as typeof PROJECT_PHASES[number]), 0)} items={PROJECT_PHASES.map((item) => ({ title: item }))} />
        <Space style={{ marginTop: 12 }} wrap>
          <Select style={{ width: 180 }} value={phase} options={PROJECT_PHASES.map((item) => ({ value: item, label: item }))} onChange={setPhase} />
          <Input style={{ width: 280 }} placeholder="节点反馈" value={note} onChange={(event) => setNote(event.target.value)} />
          <Button onClick={() => { app.setPhase(master.id, phase, note); message.success('已记录节点反馈'); }}>提交节点反馈</Button>
          {master.status === '已暂停'
            ? <Button onClick={() => app.pauseMaster(master.id, false, '恢复')}>恢复</Button>
            : <Button onClick={() => app.pauseMaster(master.id, true, '暂停')}>暂停</Button>}
          <Button type="primary" onClick={() => setHoursOpen(true)}>结项</Button>
          <Button onClick={() => navigate(`/services/logs/new?customerId=${master.customerId || ''}&ticketId=${master.id}`)}>写服务日志</Button>
        </Space>
      </div>
      <div className="panel">
        <h2>反馈节点材料</h2>
        {FEEDBACK_NODES.map((node) => {
          const files = materials.filter((item) => item.name.includes(node.id) || node.required.some((key) => item.name.includes(key)) || (node.id === 'P0-P1' && item.node === 'P0-P1'));
          const missing = node.required.filter((key) => !materials.some((item) => item.name.includes(key)));
          return (
            <div key={node.id} style={{ marginBottom: 8 }}>
              <b>{node.id} {node.name}</b>
              <span className="muted"> · 对应阶段 {node.phase}</span>
              {missing.length ? <Tag color="gold" style={{ marginLeft: 8 }}>缺 {missing.join('、')}</Tag> : node.required.length ? <Tag color="green" style={{ marginLeft: 8 }}>必备材料已齐</Tag> : <Tag style={{ marginLeft: 8 }}>无必备附件</Tag>}
              <div className="muted">{files.map((item) => item.name).join('、') || '还没有归到这个节点的文件'}</div>
            </div>
          );
        })}
      </div>
      <div className="panel">
        <h2>子工单</h2>
        <Progress percent={progress.percent} />
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={children}
          columns={[
            { title: '环节', dataIndex: 'title', render: (value: string, row) => <Link to={`/services/tickets/${row.id}`}>{value}</Link> },
            { title: '类型', dataIndex: 'typeCode', width: 80 },
            { title: '必含', width: 70, render: (_, row) => row.requiredChild ? '是' : '否' },
            { title: '执行人', width: 90, render: (_, row) => personName(users, row.ownerId) },
            { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <StatusTag value={value} /> },
            { title: '标准工时', width: 90, render: (_, row) => chain?.steps.find((step) => step.key === row.phaseKey)?.stdHours ?? '—' },
            { title: '实际工时', width: 90, render: (_, row) => logHours(state.logs, [row.id]) },
            {
              title: '操作',
              width: 220,
              render: (_, row) => can('advanceImpl') ? (
                <Space>
                  {row.status === '待开始' ? <a onClick={() => app.advanceChild(row.id, '进行中', '开始')}>开始</a> : null}
                  {['待开始', '进行中', '已挂起'].includes(row.status) ? <a onClick={() => { const error = app.advanceChild(row.id, '已完成', '完成'); if (error) message.error(error); }}>完成</a> : null}
                  {row.typeCode === 'T05' && row.status !== '已挂起' && row.status !== '已完成' ? <a onClick={() => app.advanceChild(row.id, '已挂起', '挂起')}>挂起</a> : null}
                  {!row.requiredChild && row.status !== '已取消' && row.status !== '已完成' ? <a onClick={() => app.advanceChild(row.id, '已取消', '取消可选环节')}>取消</a> : null}
                </Space>
              ) : <span className="muted">查看</span>,
            },
          ]}
        />
      </div>
      <div className="panel">
        <h2>服务日志</h2>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={logs}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '方式', dataIndex: 'visitType', width: 70 },
            { title: '工时', dataIndex: 'hours', width: 70 },
            { title: '挂接', width: 180, render: (_, row) => state.tickets.find((item) => item.id === row.ticketId)?.title || '主单' },
            { title: '内容', dataIndex: 'content' },
            { title: '记录人', width: 80, render: (_, row) => personName(users, row.ownerId) },
          ]}
        />
      </div>
      <HoursDialog
        open={hoursOpen}
        logged={hours}
        onCancel={() => setHoursOpen(false)}
        onSubmit={(value, text) => {
          const error = app.closeMaster(master.id, value, text);
          if (error) message.error(error);
          else message.success('项目已结项');
          setHoursOpen(false);
        }}
      />
    </div>
  );
}
