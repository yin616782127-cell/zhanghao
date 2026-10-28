import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead, StatusTag, personName } from '../components';
import { completeness, serviceStage } from '../logic';
import { useApp } from '../store';
import type { Customer } from '../types';

export default function CustomerListPage({ keyOnly = false }: { keyOnly?: boolean }) {
  const { state, actor, users } = useApp();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [tier, setTier] = useState<string>(keyOnly ? '要客级' : '');
  const [auth, setAuth] = useState('');
  const rows = useMemo(() => {
    return state.customers.filter((item) => {
      if (actor.branchId !== '总行' && item.branchId !== actor.branchId) return false;
      if (keyOnly && item.tier !== '要客级') return false;
      if (tier && item.tier !== tier) return false;
      if (auth && item.authStatus !== auth) return false;
      const blob = `${item.name}${item.archiveNo}${item.creditCode}${item.tenantNo || ''}`;
      return blob.includes(keyword.trim());
    });
  }, [actor.branchId, auth, keyOnly, keyword, state.customers, tier]);
  const scoped = state.customers.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const ready = scoped.filter((item) => completeness(item).percent === 100).length;
  return (
    <div data-testid={keyOnly ? 'page-key' : 'page-customers'}>
      <PageHead
        title={keyOnly ? '重保客户管理' : '客户列表'}
        desc={
          keyOnly
            ? '重保清单取实施定级为「要客级」的档案，对应工单客户级别里的体系要客服务对象。机构部客户、总分战加任一标签、或勾选不少于 3 个标签会进入要客级。'
            : '这里管的是一线真实交付的客户档案，不是应管全量租户。档案按所属分行隔离，总行看全量。'
        }
        extra={<Button type="primary" onClick={() => navigate('/customers/new')}>新增客户档案</Button>}
      />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">档案数</div><div className="stat-value">{scoped.length}</div></div>
        <div className="stat navy"><div className="stat-label">完备档案</div><div className="stat-value">{ready}</div><div className="stat-extra">完备率 {scoped.length ? Math.round((ready / scoped.length) * 100) : 0}%</div></div>
        <div className="stat gold"><div className="stat-label">定级待复核</div><div className="stat-value">{scoped.filter((item) => item.pendingTier).length}</div></div>
        <div className="stat"><div className="stat-label">转化客户</div><div className="stat-value">{scoped.filter((item) => item.converted).length}</div><div className="stat-extra">信用代码命中营销工单</div></div>
      </div>
      <div className="panel">
        <Space style={{ marginBottom: 10 }} wrap>
          <Input.Search allowClear placeholder="企业名称 / 档案号 / 信用代码 / 租户号" style={{ width: 320 }} onSearch={setKeyword} />
          {!keyOnly ? (
            <Select
              allowClear
              placeholder="实施定级"
              style={{ width: 140 }}
              options={['要客级', '重点级', '潜力级'].map((item) => ({ value: item, label: item }))}
              onChange={(value) => setTier(value || '')}
            />
          ) : null}
          <Select
            allowClear
            placeholder="认证状态"
            style={{ width: 140 }}
            options={['已开通', '待开通'].map((item) => ({ value: item, label: item }))}
            onChange={(value) => setAuth(value || '')}
          />
        </Space>
        <Table
          size="small"
          rowKey="id"
          dataSource={rows}
          onRow={(row) => ({ onClick: () => navigate(`/customers/${row.id}`), className: 'click-row' })}
          columns={[
            { title: '档案号', dataIndex: 'archiveNo', width: 120 },
            { title: '企业名称', dataIndex: 'name', render: (value: string, row: Customer) => <span>{value}{row.converted ? <Tag color="green" style={{ marginLeft: 6 }}>转化客户</Tag> : null}{row.pendingTier ? <Tag color="gold">定级待复核</Tag> : null}</span> },
            { title: '分行', dataIndex: 'branchId', width: 80 },
            { title: '认证', dataIndex: 'authStatus', width: 90, render: (value: string) => <StatusTag value={value} /> },
            { title: '定级', dataIndex: 'tier', width: 90, render: (value: string) => <StatusTag value={value} /> },
            { title: '管护人', width: 90, render: (_, row) => personName(users, row.ownerId) },
            { title: '服务阶段', width: 110, render: (_, row) => serviceStage(row.id, state.tickets) },
            { title: '完备度', width: 80, render: (_, row) => `${completeness(row).percent}%` },
          ]}
        />
      </div>
    </div>
  );
}
