import { Alert, Button, Checkbox, Form, Input, Radio, Select, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { App } from 'antd';
import { YINGUAN_ENTERPRISES } from '../catalog';
import { PageHead } from '../components';
import { judgeTier, tierReason } from '../logic';
import { useApp } from '../store';
import type { Tier } from '../types';

export default function ArchivePage() {
  return (
    <div data-testid="page-archive">
      <PageHead
        title="新增客户档案"
        desc="建档入口之一：客户管理里直接登记。另两条是工单里的快捷建档，以及应管同步后的人工确认。统一社会信用代码是查重键，租户号空着就是待开通。"
      />
      <ArchiveForm />
    </div>
  );
}

export function ArchiveForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, actor, users, createCustomer } = useApp();
  const presetTenant = params.get('tenant') || '';
  const preset = YINGUAN_ENTERPRISES.find((item) => item.tenantNo === presetTenant);
  const [mode, setMode] = useState<'pick' | 'manual'>(preset ? 'pick' : 'manual');
  const [picked, setPicked] = useState(preset?.tenantNo || '');
  const [name, setName] = useState(params.get('name') || preset?.name || '');
  const [creditCode, setCredit] = useState('');
  const [branchId, setBranch] = useState(params.get('branch') || preset?.branchId || (actor.branchId === '总行' ? '深圳' : actor.branchId));
  const [ownerId, setOwner] = useState(actor.branchId === '总行' ? '' : actor.id);
  const [tags, setTags] = useState<string[]>([]);
  const [override, setOverride] = useState<Tier | ''>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [industry, setIndustry] = useState<string>();
  const enterprise = YINGUAN_ENTERPRISES.find((item) => item.tenantNo === picked);
  const linked = enterprise ? state.customers.find((item) => item.tenantNo === enterprise.tenantNo) : undefined;
  const auto = judgeTier(tags);
  const gradeItems = state.dicts.find((item) => item.key === 'gradeTags')?.items.filter((item) => item.enabled) || [];
  const industries = state.dicts.find((item) => item.key === 'industry')?.items.filter((item) => item.enabled) || [];
  const hit = useMemo(() => {
    const code = creditCode.trim().toUpperCase();
    if (!/^[0-9A-Z]{18}$/.test(code)) return null;
    const archive = state.customers.find((item) => item.creditCode === code);
    const marketing = state.tickets.find((item) => item.typeCode === 'T01' && item.kycCreditCode === code);
    return { archive, marketing };
  }, [creditCode, state.customers, state.tickets]);
  const owners = users.filter((item) => item.role !== 'director' && item.role !== 'central' && item.status !== '离职' && (actor.branchId === '总行' || item.branchId === branchId));

  const submit = () => {
    if (mode === 'pick' && linked) {
      message.warning('该租户已经有档案');
      return;
    }
    const result = createCustomer({
      name: mode === 'pick' && enterprise ? enterprise.name : name,
      creditCode,
      branchId: mode === 'pick' && enterprise ? enterprise.branchId : branchId,
      ownerId: ownerId || actor.id,
      gradeTags: tags,
      requestedTier: override || undefined,
      overrideReason,
      industry,
      authStatus: mode === 'pick' && enterprise ? '已开通' : '待开通',
      tenantNo: mode === 'pick' ? enterprise?.tenantNo : undefined,
      tenantStatus: mode === 'pick' ? enterprise?.tenantStatus : undefined,
      projectInfo: mode === 'pick' ? enterprise?.projectInfo : undefined,
      nameLocked: mode === 'pick',
      yinguanId: params.get('yinguan') || undefined,
    });
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    message.success(hit?.marketing ? '已建档，并强制关联营销工单' : '档案已建立');
    if (onCreated) onCreated(result.id);
    else navigate(`/customers/${result.id}`);
  };

  return (
    <div className="panel">
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
        <div>
          <h2>应管企业检索</h2>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={[
              { label: '命中应管租户（已开通）', value: 'pick' },
              { label: '未开通，手工录入', value: 'manual' },
            ]}
          />
          {mode === 'pick' ? (
            <Select
              showSearch
              style={{ width: '100%', marginTop: 8 }}
              placeholder="按企业名称或租户号搜索"
              value={picked || undefined}
              optionFilterProp="label"
              options={YINGUAN_ENTERPRISES.map((item) => ({ value: item.tenantNo, label: `${item.name} · ${item.tenantNo} · ${item.branchId}` }))}
              onChange={(value) => {
                setPicked(value);
                const found = YINGUAN_ENTERPRISES.find((item) => item.tenantNo === value);
                if (found) {
                  setName(found.name);
                  setBranch(found.branchId);
                }
              }}
            />
          ) : (
            <Input style={{ marginTop: 8 }} placeholder="企业名称" value={name} onChange={(event) => setName(event.target.value)} />
          )}
          {enterprise && mode === 'pick' ? (
            <Alert
              style={{ marginTop: 8 }}
              type={linked ? 'warning' : 'info'}
              showIcon
              message={linked ? `已有档案 ${linked.archiveNo}，不能重复绑定` : '将按应管回填企业名称、租户号和项目信息，本地不可改'}
              description={enterprise.projectInfo}
            />
          ) : null}
          <Form layout="vertical" style={{ marginTop: 12 }}>
            <Form.Item label="统一社会信用代码" required extra="建档查重键，也是和营销工单 KYC 强制关联的依据。">
              <Input value={creditCode} maxLength={18} placeholder="18 位" onChange={(event) => setCredit(event.target.value.toUpperCase())} data-testid="credit-input" />
            </Form.Item>
            {hit?.archive ? <Alert type="error" showIcon message={`已有档案 ${hit.archive.archiveNo} ${hit.archive.name}`} /> : null}
            {hit?.marketing && !hit.archive ? (
              <Alert type="success" showIcon message={`命中营销工单 ${hit.marketing.no}，建档后强制关联并打上「转化客户」`} description={hit.marketing.kycNote} />
            ) : null}
            <Form.Item label="归属分行" required>
              <Select
                value={branchId}
                disabled={mode === 'pick' || actor.branchId !== '总行'}
                options={Array.from(new Set(state.customers.map((item) => item.branchId).concat(['深圳', '上海', '北京', '杭州', '成都', '武汉', '西安', '昆明', '广州', '南京']))).map((item) => ({ value: item, label: item }))}
                onChange={setBranch}
              />
            </Form.Item>
            <Form.Item label="一线管护人" required extra="默认带出建档人，可改。一个客户只有一个管护人。">
              <Select
                value={ownerId || undefined}
                placeholder="选择顾问"
                options={owners.map((item) => ({ value: item.id, label: `${item.name} · ${item.city}${item.status === '在职' ? '' : `（${item.status}）`}` }))}
                onChange={setOwner}
              />
            </Form.Item>
            <Form.Item label="行业标签">
              <Select allowClear showSearch optionFilterProp="label" value={industry} options={industries.map((item) => ({ value: item.label, label: item.label }))} onChange={setIndustry} />
            </Form.Item>
          </Form>
        </div>
        <div>
          <h2>实施定级</h2>
          <p className="muted">勾选标签后自动判定。手工改级不会马上生效，要等分行组长复核。机构部客户直接要客级；总分战再加任意一个标签也直接要客级。</p>
          <Checkbox.Group
            value={tags}
            onChange={(value) => setTags(value as string[])}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}
          >
            {gradeItems.map((item) => (
              <Checkbox key={item.label} value={item.label}>{item.label === '机构部客户' ? '机构部客户（财政/社保/公积金）' : item.label}</Checkbox>
            ))}
          </Checkbox.Group>
          <Alert style={{ marginTop: 10 }} type="info" showIcon message={`规则判定：${auto}`} description={tierReason(tags)} />
          <Space style={{ marginTop: 10 }} align="start">
            <Select
              allowClear
              placeholder="如需手工改级"
              style={{ width: 160 }}
              value={override || undefined}
              options={(['要客级', '重点级', '潜力级'] as Tier[]).filter((item) => item !== auto).map((item) => ({ value: item, label: item }))}
              onChange={(value) => setOverride(value || '')}
            />
            {override ? <Input placeholder="变更原因" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} /> : null}
          </Space>
          {override ? <div style={{ marginTop: 8 }}><Tag color="gold">将以 {auto} 建档，并生成「改为{override}」的待复核</Tag></div> : null}
          <Button type="primary" style={{ marginTop: 16 }} onClick={submit} data-testid="archive-submit">保存档案</Button>
        </div>
      </div>
    </div>
  );
}
