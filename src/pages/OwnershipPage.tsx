import { Alert, Button, Select, Space, Table, Tabs } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead, StatusTag, personName } from '../components';
import { useApp } from '../store';

export default function OwnershipPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { state, actor, users, can, transferOwners, linkYinguan } = useApp();
  const [ownerFilter, setOwnerFilter] = useState<string>();
  const [picked, setPicked] = useState<string[]>([]);
  const [toId, setToId] = useState<string>();
  const [reason, setReason] = useState('休假');
  const rows = state.customers.filter((item) => {
    if (actor.branchId !== '总行' && item.branchId !== actor.branchId) return false;
    if (ownerFilter && item.ownerId !== ownerFilter) return false;
    return true;
  });
  const branchUsers = users.filter((item) => item.branchId === (actor.branchId === '总行' ? '深圳' : actor.branchId) || (actor.branchId === '总行' && item.role === 'frontline'));
  const consultants = users.filter((item) => (actor.branchId === '总行' ? item.role === 'frontline' : item.branchId === actor.branchId));
  const queue = state.yinguan.filter((item) => item.queue !== '已处理' && (actor.branchId === '总行' || item.branchId === actor.branchId));
  return (
    <div data-testid="page-ownership">
      <PageHead
        title="一线管户列表"
        desc="一个客户一个管护人。分行组长按原管护人筛出清单后批量移交，移交留痕。应管每日同步的未匹配租户在第二个页签里确认，不直接变成档案。"
      />
      <Tabs
        items={[
          {
            key: 'book',
            label: '管护清单',
            children: (
              <div className="panel">
                <Space style={{ marginBottom: 8 }} wrap>
                  <Select
                    allowClear
                    placeholder="原管护人"
                    style={{ width: 180 }}
                    value={ownerFilter}
                    options={consultants.map((item) => ({ value: item.id, label: `${item.name}${item.status === '在职' ? '' : `（${item.status}）`}` }))}
                    onChange={setOwnerFilter}
                  />
                  <Select placeholder="新管护人" style={{ width: 180 }} value={toId} options={consultants.filter((item) => item.status === '在职').map((item) => ({ value: item.id, label: item.name }))} onChange={setToId} />
                  <Select style={{ width: 140 }} value={reason} options={['休假', '离职', '负荷调整'].map((item) => ({ value: item, label: item }))} onChange={setReason} />
                  <Button
                    type="primary"
                    disabled={!can('transferOwner')}
                    onClick={() => {
                      if (!toId) return message.warning('请选择新管护人');
                      const error = transferOwners(picked, toId, reason);
                      if (error) message.error(error);
                      else {
                        message.success('已移交并留痕');
                        setPicked([]);
                      }
                    }}
                  >
                    批量移交
                  </Button>
                  {!can('transferOwner') ? <span className="muted">只有分行组长可以移交</span> : null}
                </Space>
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={rows}
                  rowSelection={{ selectedRowKeys: picked, onChange: (keys) => setPicked(keys as string[]) }}
                  columns={[
                    { title: '档案号', dataIndex: 'archiveNo', width: 120 },
                    { title: '企业', dataIndex: 'name', render: (value: string, row) => <a onClick={() => navigate(`/customers/${row.id}`)}>{value}</a> },
                    { title: '认证', dataIndex: 'authStatus', width: 90, render: (value: string) => <StatusTag value={value} /> },
                    { title: '定级', dataIndex: 'tier', width: 90, render: (value: string) => <StatusTag value={value} /> },
                    { title: '管护人', width: 120, render: (_, row) => `${personName(users, row.ownerId)}${users.find((item) => item.id === row.ownerId)?.status === '在职' ? '' : `（${users.find((item) => item.id === row.ownerId)?.status}）`}` },
                    { title: '分行', dataIndex: 'branchId', width: 80 },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'sync',
            label: `应管同步待确认 ${queue.length}`,
            children: (
              <div className="panel">
                <Alert type="info" showIcon message="应管同步建档是预留能力。这里只做人工确认：精确命中则关联并改为已开通，半匹配放进待关联，未命中放进待认领。" />
                <Table
                  style={{ marginTop: 8 }}
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={queue}
                  columns={[
                    { title: '租户号', dataIndex: 'tenantNo' },
                    { title: '应管企业名称', dataIndex: 'name' },
                    { title: '分行', dataIndex: 'branchId', width: 80 },
                    { title: '队列', dataIndex: 'queue', width: 90 },
                    { title: '说明', dataIndex: 'note' },
                    {
                      title: '操作',
                      width: 220,
                      render: (_, row) => (
                        <Space>
                          {row.candidateId ? <Button size="small" onClick={() => { const error = linkYinguan(row.id); if (error) message.error(error); else message.success('已关联并回填租户号'); }}>确认关联</Button> : null}
                          <Button size="small" onClick={() => navigate(`/customers/new?tenant=${row.tenantNo}&name=${encodeURIComponent(row.name)}&branch=${row.branchId}&yinguan=${row.id}`)}>新建档案</Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
      <div className="muted">可选顾问范围示例：{branchUsers.map((item) => item.name).slice(0, 6).join('、')}</div>
    </div>
  );
}
