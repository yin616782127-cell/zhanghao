import { Button, Input, Segmented, Select, Space, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead, StatusTag, personName } from '../components';
import { isDispatchCode, typeName } from '../catalog';
import { slaTags } from '../logic';
import { useApp } from '../store';
import type { Ticket } from '../types';

export default function TicketListPage() {
  const { state, actor, users, can } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || 'all';
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [showChild, setShowChild] = useState(false);
  const rows = useMemo(() => {
    return state.tickets.filter((item) => {
      if (actor.branchId !== '总行' && item.branchId !== actor.branchId) return false;
      if (!showChild && item.kind === 'child') return false;
      if (kind === 'dispatch' && !isDispatchCode(item.typeCode)) return false;
      if (kind === 'front' && item.kind !== 'frontline') return false;
      if (kind === 'master' && item.kind !== 'master') return false;
      if (kind === 'system' && item.kind !== 'system') return false;
      if (status && item.status !== status) return false;
      const blob = `${item.no}${item.title}${item.typeCode}${typeName(item.typeCode)}`;
      return blob.toLowerCase().includes(keyword.trim().toLowerCase());
    });
  }, [actor.branchId, keyword, kind, showChild, state.tickets, status]);
  return (
    <div data-testid="page-dispatch">
      <PageHead
        title="工单"
        desc="统一入口。售后运维工单 T09 不能从这里直接新建，必须先完成 AI 问答。初始化 T04 和试运行 T11 只能由实施主单生成。"
        extra={
          <Space>
            <Button onClick={() => navigate('/services/exposure')}>超时晾晒</Button>
            {can('createDispatch') ? <Button type="primary" onClick={() => navigate('/services/tickets/new?group=dispatch')}>下发工单</Button> : null}
            {can('createFrontline') ? <Button onClick={() => navigate('/services/tickets/new?group=front')}>一线实施工单</Button> : null}
            {can('createMaster') ? <Button onClick={() => navigate('/services/tickets/new?group=master')}>项目实施主单</Button> : null}
            {can('createMarketing') ? <Button onClick={() => navigate('/services/tickets/new?type=T01')}>CBS营销</Button> : null}
            <Button onClick={() => navigate('/services/ai')}>售后请先问 AI</Button>
          </Space>
        }
      />
      <div className="panel">
        <Space style={{ marginBottom: 10 }} wrap>
          <Segmented
            value={kind}
            onChange={(value) => {
              const next = new URLSearchParams(params);
              if (value === 'all') next.delete('kind');
              else next.set('kind', String(value));
              setParams(next);
            }}
            options={[
              { label: '全部', value: 'all' },
              { label: '下发', value: 'dispatch' },
              { label: '一线提交', value: 'front' },
              { label: '实施主单', value: 'master' },
              { label: '系统触发', value: 'system' },
            ]}
          />
          <Input.Search allowClear placeholder="单号 / 标题 / 类型" style={{ width: 240 }} onSearch={setKeyword} />
          <Select allowClear placeholder="状态" style={{ width: 140 }} onChange={(value) => setStatus(value || '')} options={Array.from(new Set(state.tickets.map((item) => item.status))).map((item) => ({ value: item, label: item }))} />
          <Button type={showChild ? 'primary' : 'default'} onClick={() => setShowChild((value) => !value)}>{showChild ? '隐藏子单' : '包含实施子单'}</Button>
        </Space>
        <Table
          size="small"
          rowKey="id"
          dataSource={rows}
          onRow={(row) => ({ onClick: () => navigate(row.kind === 'master' ? `/services/implementation/${row.id}` : `/services/tickets/${row.id}`), className: 'click-row' })}
          columns={[
            { title: '工单号', dataIndex: 'no', width: 180 },
            { title: '类型', width: 150, render: (_, row: Ticket) => `${row.typeCode} ${typeName(row.typeCode)}` },
            { title: '标题', dataIndex: 'title' },
            { title: '分行', dataIndex: 'branchId', width: 70 },
            { title: '处理人', width: 80, render: (_, row) => personName(users, row.ownerId) },
            { title: '状态', dataIndex: 'status', width: 110, render: (value: string) => <StatusTag value={value} /> },
            { title: '时限', width: 160, render: (_, row) => <Space size={4} wrap>{slaTags(row).map((item) => <Tag key={item.text} color={item.color}>{item.text}</Tag>)}</Space> },
            { title: '截止', dataIndex: 'dueAt', width: 140, render: (value?: string) => value || '—' },
          ]}
        />
      </div>
    </div>
  );
}
