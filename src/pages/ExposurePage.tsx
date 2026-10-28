import { Select, Space, Switch, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISPATCH_CODES, isDispatchCode, typeName } from '../catalog';
import { NoteButton, PageHead, personName } from '../components';
import { isRedOverdue, isReviewTimeout, isYellowReceive, overdueDays } from '../logic';
import { useApp } from '../store';
import type { Ticket } from '../types';

export default function ExposurePage() {
  const { state, actor, users, can, follow, urge } = useApp();
  const navigate = useNavigate();
  const [city, setCity] = useState<string>();
  const [typeCode, setTypeCode] = useState<string>();
  const [yellow, setYellow] = useState(false);
  const [review, setReview] = useState(false);
  const scoped = state.tickets.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const reds = scoped.filter((item) => isRedOverdue(item) && (!city || item.branchId === city) && (!typeCode || item.typeCode === typeCode));
  const yellows = scoped.filter((item) => isYellowReceive(item) && isDispatchCode(item.typeCode) && !isRedOverdue(item));
  const reviews = scoped.filter((item) => isReviewTimeout(item));
  const rows = useMemo(() => {
    const list: Ticket[] = [...reds];
    if (yellow) yellows.forEach((item) => list.push(item));
    if (review) reviews.forEach((item) => { if (!list.some((row) => row.id === item.id)) list.push(item); });
    return list.sort((a, b) => (overdueDays(b) || 0) - (overdueDays(a) || 0));
  }, [reds, review, reviews, yellow, yellows]);
  const cities = Array.from(new Set(scoped.map((item) => item.branchId)));
  return (
    <div data-testid="page-exposure">
      <PageHead
        title="超时晾晒"
        desc="下发任务超过截止时间仍未完成的，按责任人、城市和逾期天数公开。组长、集中运营和部门管理者可以跟进、催办。待接收黄灯和验收超过 48 小时可以一并打开。"
      />
      <div className="stat-grid">
        <div className="stat red"><div className="stat-label">红色超时</div><div className="stat-value">{reds.length}</div><div className="stat-extra">超过截止时间</div></div>
        <div className="stat gold"><div className="stat-label">待接收黄灯</div><div className="stat-value">{yellows.length}</div><div className="stat-extra">超过 8 小时未接收（演示阈值）</div></div>
        <div className="stat navy"><div className="stat-label">验收停留</div><div className="stat-value">{reviews.length}</div><div className="stat-extra">已提交超过 48 小时</div></div>
        <div className="stat"><div className="stat-label">当前列表</div><div className="stat-value">{rows.length}</div></div>
      </div>
      <div className="panel">
        <Space style={{ marginBottom: 8 }} wrap>
          <Select allowClear placeholder="城市" style={{ width: 140 }} value={city} options={cities.map((item) => ({ value: item, label: item }))} onChange={setCity} />
          <Select allowClear placeholder="工单类型" style={{ width: 200 }} value={typeCode} options={DISPATCH_CODES.map((item) => ({ value: item, label: `${item} ${typeName(item)}` }))} onChange={setTypeCode} />
          <span>含待接收黄灯 <Switch checked={yellow} onChange={setYellow} /></span>
          <span>含验收超时 <Switch checked={review} onChange={setReview} /></span>
        </Space>
        <Table
          size="small"
          rowKey="id"
          dataSource={rows}
          pagination={false}
          columns={[
            { title: '工单号', dataIndex: 'no', width: 168, render: (value: string, row: Ticket) => <a onClick={() => navigate(`/services/tickets/${row.id}`)}>{value}</a> },
            { title: '类型', dataIndex: 'typeCode', width: 64 },
            { title: '标题', dataIndex: 'title', ellipsis: true },
            { title: '城市', dataIndex: 'branchId', width: 64 },
            { title: '责任人', width: 72, render: (_, row) => personName(users, row.ownerId) },
            { title: '逾期', width: 64, render: (_, row) => overdueDays(row) ?? '—' },
            { title: '级别', width: 72, render: (_, row) => isRedOverdue(row) ? <Tag color="red">红</Tag> : isReviewTimeout(row) ? <Tag color="orange">验收</Tag> : <Tag color="gold">黄</Tag> },
            { title: '最近跟进', ellipsis: true, render: (_, row) => row.followUps[row.followUps.length - 1]?.content || '—' },
            {
              title: '操作',
              width: 132,
              render: (_, row) => (
                <Space>
                  <NoteButton disabled={!can('followUp')} label="跟进" onSubmit={(text) => follow(row.id, text)} />
                  <NoteButton disabled={!can('urge')} label="催办" onSubmit={(text) => urge(row.id, text)} />
                </Space>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
