import { Button, Calendar, Form, Input, InputNumber, Select, Table } from 'antd';
import { App } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead, personName } from '../components';
import { round1 } from '../logic';
import { useApp } from '../store';
import type { AppUser, Customer, Stage } from '../types';

export default function LogPage({ creating = false }: { creating?: boolean }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, actor, users, can, addLog } = useApp();
  const [day, setDay] = useState(dayjs('2026-10-28'));
  const [view, setView] = useState<'calendar' | 'list'>(creating ? 'list' : 'calendar');
  const logs = state.logs.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const dayLogs = logs.filter((item) => item.date === day.format('YYYY-MM-DD'));
  const customers = state.customers.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const [customerId, setCustomerId] = useState(params.get('customerId') || customers[0]?.id);
  const [ticketId, setTicketId] = useState(params.get('ticketId') || undefined);
  const [stage, setStage] = useState<Stage>('实施');
  const [visitType, setVisitType] = useState<'拜访' | '远程'>('拜访');
  const [hours, setHours] = useState(1);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('2026-10-28');
  const tickets = state.tickets.filter((item) => item.customerId === customerId);
  const monthHours = useMemo(() => round1(logs.filter((item) => item.date.startsWith(day.format('YYYY-MM'))).reduce((sum, item) => sum + item.hours, 0)), [day, logs]);
  const save = () => {
    if (!can('addLog')) return message.warning('当前角色不能登记服务日志');
    if (!customerId || !content.trim() || hours <= 0) return message.warning('请填写客户、工时和内容');
    addLog({ date, stage, visitType, hours, customerId, ticketId, content });
    message.success('日志已登记。若挂了进行中的下发工单，进度会跟着更新。');
    navigate('/services/logs');
  };
  return (
    <div>
      <PageHead
        title="服务日志"
        desc="覆盖营销、实施、售后、经营。工时只记在日志上。可以挂子工单、主单，也可以不挂工单。"
        extra={<Button type="primary" onClick={() => navigate('/services/logs/new')}>新增服务日志</Button>}
      />
      {creating ? (
        <div className="panel">
          <Form layout="vertical">
            <Form.Item label="日期" required><Input value={date} onChange={(event) => setDate(event.target.value)} /></Form.Item>
            <Form.Item label="阶段" required>
              <Select value={stage} options={['营销', '实施', '售后', '经营'].map((item) => ({ value: item, label: item }))} onChange={(value) => setStage(value as Stage)} />
            </Form.Item>
            <Form.Item label="方式" required>
              <Select value={visitType} options={['拜访', '远程'].map((item) => ({ value: item, label: item }))} onChange={(value) => setVisitType(value as '拜访' | '远程')} />
            </Form.Item>
            <Form.Item label="客户" required>
              <Select showSearch optionFilterProp="label" value={customerId} options={customers.map((item) => ({ value: item.id, label: item.name }))} onChange={setCustomerId} />
            </Form.Item>
            <Form.Item label="关联工单">
              <Select allowClear value={ticketId} options={tickets.map((item) => ({ value: item.id, label: `${item.no} ${item.title}` }))} onChange={setTicketId} />
            </Form.Item>
            <Form.Item label="工时（小时）" required><InputNumber min={0.5} step={0.5} value={hours} onChange={(value) => setHours(Number(value) || 0)} /></Form.Item>
            <Form.Item label="服务内容" required><Input.TextArea rows={4} value={content} onChange={(event) => setContent(event.target.value)} /></Form.Item>
            <Button type="primary" onClick={save}>保存</Button>
          </Form>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat"><div className="stat-label">范围内日志</div><div className="stat-value">{logs.length}</div></div>
            <div className="stat navy"><div className="stat-label">本月工时</div><div className="stat-value">{monthHours}</div></div>
            <div className="stat"><div className="stat-label">我的工时</div><div className="stat-value">{round1(logs.filter((item) => item.ownerId === actor.id).reduce((sum, item) => sum + item.hours, 0))}</div></div>
            <div className="stat"><div className="stat-label">未挂工单</div><div className="stat-value">{logs.filter((item) => !item.ticketId).length}</div></div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Button type={view === 'calendar' ? 'primary' : 'default'} onClick={() => setView('calendar')}>日历</Button>
            <Button style={{ marginLeft: 8 }} type={view === 'list' ? 'primary' : 'default'} onClick={() => setView('list')}>列表</Button>
          </div>
          {view === 'calendar' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 12 }}>
              <div className="panel"><Calendar fullscreen={false} value={day} onSelect={(value: Dayjs) => setDay(value)} /></div>
              <div className="panel">
                <h2>{day.format('YYYY-MM-DD')} 的服务</h2>
                <Table size="small" rowKey="id" pagination={false} dataSource={dayLogs} columns={logColumns(users, state.customers)} />
              </div>
            </div>
          ) : (
            <div className="panel"><Table size="small" rowKey="id" dataSource={logs} columns={logColumns(users, state.customers)} /></div>
          )}
        </>
      )}
    </div>
  );
}

function logColumns(users: AppUser[], customers: Customer[]) {
  return [
    { title: '日期', dataIndex: 'date' as const, width: 110 },
    { title: '阶段', dataIndex: 'stage' as const, width: 70 },
    { title: '方式', dataIndex: 'visitType' as const, width: 70 },
    { title: '工时', dataIndex: 'hours' as const, width: 70 },
    { title: '客户', dataIndex: 'customerId' as const, width: 200, render: (value: string) => customers.find((item) => item.id === value)?.name || value },
    { title: '内容', dataIndex: 'content' as const },
    { title: '记录人', width: 80, render: (_: unknown, row: { ownerId: string }) => personName(users, row.ownerId) },
  ];
}
