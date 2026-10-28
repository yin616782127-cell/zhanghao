import { Alert, Button, Descriptions, InputNumber, Space, Steps, Table, Tag, Timeline } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { typeName } from '../catalog';
import { HoursDialog, NoteButton, PageHead, StatusTag, personName } from '../components';
import { deviationText, isTerminal, logHours, slaTags } from '../logic';
import { useApp } from '../store';

const DISPATCH_FLOW = ['待接收', '进行中', '待验收', '已完成'];

export default function TicketDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const app = useApp();
  const { state, actor, users, can } = app;
  const ticket = state.tickets.find((item) => item.id === id);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursMode, setHoursMode] = useState<'dispatch' | 'close' | 'self'>('dispatch');
  const [progress, setProgress] = useState(ticket?.progress || 0);
  if (!ticket) return <Alert type="warning" message="工单不存在" />;
  if (actor.branchId !== '总行' && ticket.branchId !== actor.branchId) return <Alert type="warning" showIcon message="该工单不在当前分行数据范围内" />;
  const customer = state.customers.find((item) => item.id === ticket.customerId);
  const relatedLogs = state.logs.filter((item) => item.ticketId === ticket.id || (ticket.kind === 'master' && state.tickets.some((child) => child.parentId === ticket.id && child.id === item.ticketId)));
  const logged = logHours(state.logs, [ticket.id, ...state.tickets.filter((item) => item.parentId === ticket.id).map((item) => item.id)]);
  const parent = ticket.parentId ? state.tickets.find((item) => item.id === ticket.parentId) : undefined;
  const linked = ticket.linkedTicketId ? state.tickets.find((item) => item.id === ticket.linkedTicketId) : undefined;
  const isOwner = ticket.ownerId === actor.id;
  const openHours = (mode: 'dispatch' | 'close' | 'self') => {
    setHoursMode(mode);
    setHoursOpen(true);
  };
  return (
    <div data-testid="page-ticket">
      <PageHead
        title={ticket.title}
        desc={`${ticket.no} · ${ticket.typeCode} ${typeName(ticket.typeCode)} · ${ticket.source || ''}`}
        extra={
          <Space>
            {ticket.kind === 'master' ? <Button type="primary" onClick={() => navigate(`/services/implementation/${ticket.id}`)}>实施过程</Button> : null}
            {parent ? <Button onClick={() => navigate(`/services/implementation/${parent.id}`)}>返回主单</Button> : null}
            <Button onClick={() => navigate('/services/tickets')}>列表</Button>
          </Space>
        }
      />
      <div className="panel">
        <Space wrap>
          <StatusTag value={ticket.status} />
          <Tag>{ticket.priority}</Tag>
          {slaTags(ticket).map((item) => <Tag key={item.text} color={item.color}>{item.text}</Tag>)}
          {customer?.authStatus === '待开通' ? <Tag color="gold">未认证客户</Tag> : null}
          {ticket.urgeCount ? <Tag color="red">催办 {ticket.urgeCount}</Tag> : null}
        </Space>
        {ticket.kind === 'dispatch' ? (
          <Steps style={{ marginTop: 16 }} size="small" current={Math.max(DISPATCH_FLOW.indexOf(ticket.status), 0)} items={DISPATCH_FLOW.map((item) => ({ title: item }))} />
        ) : null}
        <p className="muted" style={{ marginTop: 8 }}>待接收超过 8 小时为黄灯（演示阈值，文档写的是 x 小时）。超过截止时间未完成进晾晒。待验收超过 48 小时提醒验收人。验收不通过会退回进行中。</p>
      </div>
      <div className="panel">
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="客户">{customer ? <Link to={`/customers/${customer.id}`}>{customer.name}</Link> : '尚未建档'}</Descriptions.Item>
          <Descriptions.Item label="分行">{ticket.branchId}</Descriptions.Item>
          <Descriptions.Item label="发起人">{personName(users, ticket.creatorId)}</Descriptions.Item>
          <Descriptions.Item label="处理人">{personName(users, ticket.ownerId)}</Descriptions.Item>
          <Descriptions.Item label="验收人">{personName(users, ticket.acceptorId)}</Descriptions.Item>
          <Descriptions.Item label="创建 / 截止">{ticket.createdAt} / {ticket.dueAt || '—'}</Descriptions.Item>
          {ticket.path ? <Descriptions.Item label="下发路径">{ticket.path}</Descriptions.Item> : null}
          {ticket.targetScope ? <Descriptions.Item label="目标范围">{ticket.targetScope}</Descriptions.Item> : null}
          {ticket.problemType ? <Descriptions.Item label="问题类型">{ticket.problemType}</Descriptions.Item> : null}
          {ticket.customerLevel ? <Descriptions.Item label="客户级别">{ticket.customerLevel}</Descriptions.Item> : null}
          {ticket.unresolvedReason ? <Descriptions.Item label="AI未解决原因">{ticket.unresolvedReason}</Descriptions.Item> : null}
          {ticket.standard ? <Descriptions.Item label="完成标准" span={2}>{ticket.standard}</Descriptions.Item> : null}
          <Descriptions.Item label="描述" span={2}>{ticket.description}</Descriptions.Item>
          {ticket.kycCreditCode ? <Descriptions.Item label="KYC 信用代码" span={2}>{ticket.kycCreditCode} {ticket.kycNote}</Descriptions.Item> : null}
          {ticket.systemRule ? <Descriptions.Item label="触发规则">{ticket.systemRule}</Descriptions.Item> : null}
          {ticket.templateName ? <Descriptions.Item label="实施链路">{ticket.templateName}</Descriptions.Item> : null}
          {ticket.projectPhase ? <Descriptions.Item label="项目阶段">{ticket.projectPhase}</Descriptions.Item> : null}
          {ticket.solution ? <Descriptions.Item label="解决方案" span={2}>{ticket.solution}</Descriptions.Item> : null}
          {linked ? <Descriptions.Item label="关联工单" span={2}><Link to={`/services/tickets/${linked.id}`}>{linked.no}</Link></Descriptions.Item> : null}
          {ticket.reportedHours ? <Descriptions.Item label="填报工时">{ticket.reportedHours} 小时，日志合计 {logged} 小时，偏离 {deviationText(ticket.reportedHours, logged)}</Descriptions.Item> : null}
        </Descriptions>
      </div>
      <div className="panel">
        <h2>可执行动作</h2>
        <Space wrap>
          {ticket.kind === 'dispatch' && ticket.status === '待接收' && isOwner && can('executeDispatch') ? <Button type="primary" onClick={() => app.receive(ticket.id)}>接收</Button> : null}
          {ticket.kind === 'dispatch' && ['待接收', '进行中'].includes(ticket.status) && isOwner && can('executeDispatch') ? (
            <>
              <InputNumber min={0} max={100} value={progress} onChange={(value) => setProgress(Number(value) || 0)} />
              <Button onClick={() => { app.saveProgress(ticket.id, progress, `进度更新为 ${progress}%`); message.success('进度已更新'); }}>更新进度</Button>
              <Button type="primary" onClick={() => openHours('dispatch')}>提交反馈</Button>
            </>
          ) : null}
          {ticket.status === '待验收' && can('accept') ? (
            <>
              <Button type="primary" onClick={() => { app.acceptDispatch(ticket.id, true, '验收通过'); message.success('已完成'); }}>验收通过</Button>
              <NoteButton label="验收退回" onSubmit={(text) => { app.acceptDispatch(ticket.id, false, text); message.success('已退回进行中'); }} />
            </>
          ) : null}
          {ticket.typeCode === 'T09' && ticket.status === '自处理' && isOwner ? (
            <>
              <Button onClick={() => openHours('self')}>自行关闭</Button>
              <Button type="primary" onClick={() => { app.aftersales(ticket.id, 'toPool'); message.success('已进入待分配池，开始计算 SLA'); }}>转二线</Button>
            </>
          ) : null}
          {ticket.typeCode === 'T09' && ['处理中', '研发处理中'].includes(ticket.status) && can('batchAssign') ? (
            <>
              <Button onClick={() => { app.aftersales(ticket.id, 'toRd', { note: '二线无法闭环，转研发' }); message.success('已转研发，工单号不变'); }}>转研发</Button>
              <NoteButton label="转需求" onSubmit={(text) => { app.aftersales(ticket.id, 'toDemand', { note: text }); message.success('已生成 T06'); }} />
              <NoteButton label="处理完成" onSubmit={(text) => { app.aftersales(ticket.id, 'finish', { solution: text, note: text }); message.success('待一线确认'); }} />
            </>
          ) : null}
          {ticket.typeCode === 'T09' && ticket.status === '待一线确认' && ticket.creatorId === actor.id ? (
            <>
              <Button type="primary" onClick={() => openHours('close')}>确认关闭</Button>
              <NoteButton label="退回" onSubmit={(text) => app.aftersales(ticket.id, 'reject', { note: text })} />
            </>
          ) : null}
          {ticket.typeCode === 'T06' && ticket.status === '待产品受理' ? <Button onClick={() => { app.setStatus(ticket.id, '已排期', '产品已排期'); message.success('已排期'); }}>标记已排期</Button> : null}
          {ticket.typeCode === 'T06' && ticket.status === '已排期' ? <Button onClick={() => { app.setStatus(ticket.id, '已完成', '需求关闭'); message.success('需求工单已完成'); }}>完成需求</Button> : null}
          {ticket.kind === 'child' && can('advanceImpl') && ticket.status === '待开始' ? <Button type="primary" onClick={() => app.advanceChild(ticket.id, '进行中', '开始环节')}>开始</Button> : null}
          {ticket.kind === 'child' && can('advanceImpl') && ['待开始', '进行中', '已挂起'].includes(ticket.status) ? <Button type="primary" onClick={() => { const error = app.advanceChild(ticket.id, '已完成', '环节完成'); if (error) message.error(error); else message.success('子单已完成，主单进度已重算'); }}>完成</Button> : null}
          {ticket.kind === 'child' && ticket.typeCode === 'T05' && ticket.status !== '已挂起' && !isTerminal(ticket.status) ? <Button onClick={() => { const error = app.advanceChild(ticket.id, '已挂起', '远程实施挂起'); if (error) message.error(error); }}>挂起</Button> : null}
          {ticket.kind === 'child' && !ticket.requiredChild && !isTerminal(ticket.status) ? <Button onClick={() => app.advanceChild(ticket.id, '已取消', '本项目不包含该可选环节')}>取消可选环节</Button> : null}
          {ticket.typeCode === 'T10' && ticket.status === '告警处理' ? <Button onClick={() => { app.assignTickets([ticket.id], customer?.ownerId || actor.id); message.success('已转给管护人'); }}>转一线</Button> : null}
          {ticket.typeCode === 'T13' && !isTerminal(ticket.status) && isOwner ? <Button type="primary" onClick={() => openHours('dispatch')}>提交回访</Button> : null}
          {can('followUp') ? <NoteButton label="跟进" onSubmit={(text) => { app.follow(ticket.id, text); message.success('已记录跟进'); }} /> : null}
          {can('urge') ? <NoteButton label="催办" onSubmit={(text) => { app.urge(ticket.id, text); message.success('已催办'); }} /> : null}
          {!isTerminal(ticket.status) && (can('accept') || isOwner) ? <NoteButton label="取消工单" onSubmit={(text) => app.cancelTicket(ticket.id, text)} /> : null}
          {can('addLog') ? <Button onClick={() => navigate(`/services/logs/new?customerId=${ticket.customerId || ''}&ticketId=${ticket.id}`)}>写服务日志</Button> : null}
          {ticket.status === '已完成' && ticket.solution && !ticket.reusable && can('batchAssign') ? <Button onClick={() => { app.markReusable(ticket.id); message.success('解决方案已入库'); }}>标注可复用</Button> : null}
        </Space>
        {ticket.typeCode === 'T09' && !ticket.slaStartedAt ? <p className="muted">当前是一线自处理，不计 SLA。转入工单池后才开始计时，总周期从创建继续累计。</p> : null}
      </div>
      {ticket.transcript?.length ? (
        <div className="panel" data-testid="ticket-transcript">
          <h2>AI 问答原文</h2>
          {ticket.transcript.map((item, index) => (
            <p key={index}><b>{item.role === 'user' ? '一线' : 'AI'}</b> {item.at}<br />{item.content}</p>
          ))}
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="panel">
          <h2>处理轨迹</h2>
          <Timeline items={ticket.handlerTrail.map((item) => ({ children: `${item.at} ${item.node} · ${personName(users, item.userId)} · ${item.note}` }))} />
          <Timeline items={ticket.followUps.map((item) => ({ color: item.kind === '催办' ? 'red' : 'blue', children: `${item.at} ${item.kind} · ${personName(users, item.by)} · ${item.content}` }))} />
        </div>
        <div className="panel">
          <h2>关联服务日志 · {logged} 小时</h2>
          <Table size="small" rowKey="id" pagination={false} dataSource={relatedLogs} columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '工时', dataIndex: 'hours', width: 60 },
            { title: '内容', dataIndex: 'content' },
          ]} />
        </div>
      </div>
      <HoursDialog
        open={hoursOpen}
        logged={logged}
        onCancel={() => setHoursOpen(false)}
        onSubmit={(hours, note) => {
          const error = hoursMode === 'dispatch'
            ? app.submitDispatch(ticket.id, hours, note)
            : app.aftersales(ticket.id, hoursMode === 'self' ? 'selfClose' : 'confirm', { hours, note });
          if (error) message.error(error);
          else message.success('工时已记录');
          setHoursOpen(false);
        }}
      />
    </div>
  );
}
