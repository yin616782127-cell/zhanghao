import { Alert, Button, Descriptions, Empty, Input, Select, Space, Table, Tabs, Tag, Timeline } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHead, StatusTag, personName } from '../components';
import { CHAINS } from '../catalog';
import { completeness, masterProgress, round1, serviceStage } from '../logic';
import { useApp } from '../store';
import type { Tier } from '../types';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { state, actor, users, can, requestTier, reviewTier, addMaterial, removeMaterial, saveSurvey, setIndustry } = useApp();
  const customer = state.customers.find((item) => item.id === id);
  const [reason, setReason] = useState('');
  const [nextTier, setNextTier] = useState<Tier>('重点级');
  const [fileName, setFileName] = useState('');
  const [node, setNode] = useState('调研');
  const [surveyKey, setSurveyKey] = useState('');
  const [surveyValue, setSurveyValue] = useState('');
  if (!customer) return <Empty description="档案不存在" />;
  if (actor.branchId !== '总行' && customer.branchId !== actor.branchId) {
    return <Alert type="warning" showIcon message="该档案不在当前角色的分行数据范围内" />;
  }
  const score = completeness(customer);
  const tickets = state.tickets.filter((item) => item.customerId === customer.id && !item.parentId);
  const masters = state.tickets.filter((item) => item.customerId === customer.id && item.typeCode === 'PE01');
  const logs = state.logs.filter((item) => item.customerId === customer.id);
  const hours = round1(logs.reduce((sum, item) => sum + item.hours, 0));
  const transfers = state.transfers.filter((item) => item.customerIds.includes(customer.id));
  const marketing = state.tickets.find((item) => item.id === customer.marketingTicketId);
  return (
    <div data-testid="page-customer">
      <PageHead
        title={customer.name}
        desc={`${customer.archiveNo} · ${customer.branchId}分行 · 服务阶段 ${serviceStage(customer.id, state.tickets)}`}
        extra={<Button onClick={() => navigate('/customers')}>返回列表</Button>}
      />
      <div className="panel">
        <div className="customer-hero">
          <div>
            <h2 className="kyc-name">{customer.name}</h2>
            <div className="tag-row" style={{ marginTop: 8 }}>
              <StatusTag value={customer.tier} />
              <StatusTag value={customer.authStatus} />
              {customer.converted ? <Tag color="green">转化客户</Tag> : null}
              {customer.industry ? <Tag>{customer.industry}</Tag> : null}
              {customer.gradeTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            </div>
          </div>
          <Space>
            <div className="stat" style={{ minWidth: 120 }}><div className="stat-label">服务工时</div><div className="stat-value">{hours}</div></div>
            <div className="stat navy" style={{ minWidth: 120 }}><div className="stat-label">在档工单</div><div className="stat-value">{tickets.length}</div></div>
            <div className="stat" style={{ minWidth: 120 }}><div className="stat-label">完备度</div><div className="stat-value">{score.percent}%</div><div className="stat-extra">{score.missing.join('、') || '关键项齐全'}</div></div>
          </Space>
        </div>
      </div>
      {customer.pendingTier ? (
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message={`${personName(users, customer.pendingTier.by)} 申请把定级从 ${customer.tier} 改为 ${customer.pendingTier.to}`}
          description={customer.pendingTier.reason}
          action={can('reviewTier') ? (
            <Space>
              <Button size="small" type="primary" onClick={() => { const error = reviewTier(customer.id, true); message.success(error || '已同意，定级生效'); }}>同意</Button>
              <Button size="small" onClick={() => { reviewTier(customer.id, false); message.success('已驳回，保持原定级'); }}>驳回</Button>
            </Space>
          ) : <span className="muted">待{customer.branchId}分行组长复核</span>}
        />
      ) : null}
      <Tabs
        items={[
          {
            key: 'base',
            label: '企业概况',
            children: (
              <div className="panel">
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="档案号">{customer.archiveNo}</Descriptions.Item>
                  <Descriptions.Item label="统一社会信用代码">{customer.creditCode}</Descriptions.Item>
                  <Descriptions.Item label="企业名称">{customer.name}{customer.nameLocked ? '（应管同步，不可改）' : ''}</Descriptions.Item>
                  <Descriptions.Item label="租户号">{customer.tenantNo || '待开通，空'}</Descriptions.Item>
                  <Descriptions.Item label="认证状态"><StatusTag value={customer.authStatus} /></Descriptions.Item>
                  <Descriptions.Item label="租户状态">{customer.tenantStatus || '—'}</Descriptions.Item>
                  <Descriptions.Item label="归属分行">{customer.branchId}</Descriptions.Item>
                  <Descriptions.Item label="管护人">{personName(users, customer.ownerId)}</Descriptions.Item>
                  <Descriptions.Item label="创建">{customer.createdAt} {personName(users, customer.createdBy)}</Descriptions.Item>
                  <Descriptions.Item label="最近更新">{customer.updatedAt} {personName(users, customer.updatedBy)}</Descriptions.Item>
                </Descriptions>
                <h2 style={{ marginTop: 16 }}>初始化材料</h2>
                <p className="muted">调研问卷和实施节点交付物归档在档案上，不随工单关闭沉没。工单节点提交的材料也会归到这里。</p>
                <Space style={{ marginBottom: 8 }}>
                  <Select style={{ width: 160 }} value={node} onChange={setNode} options={['调研', 'P0-P1', 'P2-P3', 'P4-P5', 'P6', '补充'].map((item) => ({ value: item, label: item }))} />
                  <Input placeholder="文件名" value={fileName} onChange={(event) => setFileName(event.target.value)} />
                  <Button onClick={() => { if (!fileName.trim()) return; addMaterial(customer.id, node, fileName.trim(), node === '调研'); setFileName(''); message.success('已归档'); }}>补传</Button>
                </Space>
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={customer.materials}
                  columns={[
                    { title: '节点', dataIndex: 'node', width: 100 },
                    { title: '文件', dataIndex: 'name' },
                    { title: '必传', dataIndex: 'required', width: 70, render: (value: boolean) => value ? '是' : '否' },
                    { title: '时间', dataIndex: 'at', width: 150 },
                    { title: '操作', width: 80, render: (_, row) => row.required ? '—' : <a onClick={() => removeMaterial(customer.id, row.id)}>移除</a> },
                  ]}
                />
                <h2 style={{ marginTop: 16 }}>调研摘录</h2>
                <p className="muted">问卷正文以附件归档。这里保存可增删的要点，方便工单和客户视图直接引用。</p>
                <Table size="small" pagination={false} rowKey="key" dataSource={customer.survey} columns={[{ title: '要点', dataIndex: 'key' }, { title: '内容', dataIndex: 'value' }]} />
                <Space style={{ marginTop: 8 }}>
                  <Input placeholder="要点" value={surveyKey} onChange={(event) => setSurveyKey(event.target.value)} />
                  <Input placeholder="内容" value={surveyValue} onChange={(event) => setSurveyValue(event.target.value)} />
                  <Button onClick={() => {
                    if (!surveyKey.trim()) return;
                    saveSurvey(customer.id, [...customer.survey.filter((item) => item.key !== surveyKey.trim()), { key: surveyKey.trim(), value: surveyValue.trim() }]);
                    setSurveyKey('');
                    setSurveyValue('');
                  }}>保存要点</Button>
                </Space>
                <div style={{ marginTop: 12 }}>
                  <span className="muted">行业 </span>
                  <Select
                    style={{ width: 280 }}
                    value={customer.industry}
                    options={(state.dicts.find((item) => item.key === 'industry')?.items || []).map((item) => ({ value: item.label, label: item.label }))}
                    onChange={(value) => setIndustry(customer.id, value)}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'tags',
            label: '客户标签',
            children: (
              <div className="panel">
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="实施定级">{customer.tier} · {CHAINS[customer.tier].manage}</Descriptions.Item>
                  <Descriptions.Item label="判定标签">{customer.gradeTags.join('、') || '未勾选'}</Descriptions.Item>
                  <Descriptions.Item label="匹配链路">{CHAINS[customer.tier].name}</Descriptions.Item>
                </Descriptions>
                <h2 style={{ marginTop: 16 }}>定级变更</h2>
                <Space>
                  <Select value={nextTier} options={(['要客级', '重点级', '潜力级'] as Tier[]).map((item) => ({ value: item, label: item }))} onChange={setNextTier} />
                  <Input placeholder="变更原因" value={reason} onChange={(event) => setReason(event.target.value)} />
                  <Button onClick={() => { const error = requestTier(customer.id, nextTier, reason); if (error) message.error(error); else message.success('已提交组长复核'); }}>发起变更</Button>
                </Space>
                <Timeline style={{ marginTop: 16 }} items={customer.tierHistory.map((item) => ({ children: `${item.at} ${item.result} ${item.from} → ${item.to} · ${personName(users, item.by)}${item.reviewer ? ` / 复核 ${personName(users, item.reviewer)}` : ''} · ${item.reason}` }))} />
              </div>
            ),
          },
          {
            key: 'mkt',
            label: '营销信息',
            children: (
              <div className="panel">
                {marketing ? (
                  <>
                    <Alert type="success" showIcon message={`已关联营销工单 ${marketing.no}`} description={marketing.kycNote} action={<Link to={`/services/tickets/${marketing.id}`}>打开工单</Link>} />
                    <Descriptions style={{ marginTop: 12 }} bordered size="small" column={1}>
                      <Descriptions.Item label="KYC 信用代码">{marketing.kycCreditCode}</Descriptions.Item>
                      <Descriptions.Item label="完成标准">{marketing.standard}</Descriptions.Item>
                      <Descriptions.Item label="状态"><StatusTag value={marketing.status} /></Descriptions.Item>
                    </Descriptions>
                  </>
                ) : <Empty description="还没有命中营销支持工单。建档时若信用代码与 T01 的 KYC 一致，会强制关联。" />}
              </div>
            ),
          },
          {
            key: 'ops',
            label: '运营服务',
            children: (
              <div className="panel">
                <p>管护人 {personName(users, customer.ownerId)}。累计服务工时 {hours} 小时，来自服务日志，不是工单字段。</p>
                <h2>管护移交</h2>
                <Timeline items={transfers.length ? transfers.map((item) => ({ children: `${item.at} ${personName(users, item.fromId)} → ${personName(users, item.toId)} · ${item.reason} · 操作人 ${personName(users, item.operatorId)}` })) : [{ children: '尚无移交记录' }]} />
                <h2>工单</h2>
                <Table size="small" rowKey="id" pagination={false} dataSource={tickets} onRow={(row) => ({ onClick: () => navigate(`/services/tickets/${row.id}`), className: 'click-row' })} columns={[
                  { title: '单号', dataIndex: 'no' },
                  { title: '类型', dataIndex: 'typeCode', width: 80 },
                  { title: '标题', dataIndex: 'title' },
                  { title: '状态', dataIndex: 'status', render: (value: string) => <StatusTag value={value} /> },
                ]} />
                <h2 style={{ marginTop: 12 }}>实施主单</h2>
                {masters.map((item) => {
                  const progress = masterProgress(item.id, state.tickets);
                  return <div key={item.id}><Link to={`/services/implementation/${item.id}`}>{item.no} {item.title}</Link> · {item.templateName} · 进度 {progress.done}/{progress.total}</div>;
                })}
                {!masters.length ? <div className="muted">还没有项目实施主单</div> : null}
                <h2 style={{ marginTop: 12 }}>服务日志</h2>
                <Table size="small" rowKey="id" pagination={false} dataSource={logs} columns={[
                  { title: '日期', dataIndex: 'date', width: 110 },
                  { title: '阶段', dataIndex: 'stage', width: 70 },
                  { title: '方式', dataIndex: 'visitType', width: 70 },
                  { title: '工时', dataIndex: 'hours', width: 70 },
                  { title: '内容', dataIndex: 'content' },
                  { title: '记录人', width: 80, render: (_, row) => personName(users, row.ownerId) },
                ]} />
              </div>
            ),
          },
          {
            key: 'product',
            label: '产品服务',
            children: (
              <div className="panel">
                <Alert type="info" showIcon message="详细项目信息来自应管，开通后按租户号带入，本平台不修改。" />
                <Descriptions style={{ marginTop: 12 }} bordered size="small" column={1}>
                  <Descriptions.Item label="租户状态">{customer.tenantStatus || '待开通'}</Descriptions.Item>
                  <Descriptions.Item label="项目信息">{customer.projectInfo || '待开通，应管回填前为空'}</Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 12 }}><Link to="/services/direct">查看直联参数</Link> · <Link to="/services/biz">查看业务参数</Link></div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
