import { Alert, Button, DatePicker, Form, Input, Select, Space, Upload } from 'antd';
import { App } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CITIES, TICKET_TYPES, typeInfo } from '../catalog';
import { PageHead } from '../components';
import { CHAINS } from '../catalog';
import { useApp } from '../store';
import type { Priority } from '../types';

export default function TicketFormPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, actor, users, can, createDispatch, createSimple, createMaster } = useApp();
  const group = params.get('group') || (params.get('type') === 'PE01' ? 'master' : params.get('type') === 'T01' ? 'dispatch' : can('createDispatch') ? 'dispatch' : 'front');
  const allowed = TICKET_TYPES.filter((item) => {
    if (group === 'dispatch') return item.create === 'dispatch' && (item.code === 'T01' ? can('createMarketing') || can('createDispatch') : can('createDispatch'));
    if (group === 'front') return item.create === 'frontline' && can('createFrontline');
    if (group === 'master') return item.code === 'PE01' && can('createMaster');
    return false;
  });
  const [typeCode, setTypeCode] = useState(params.get('type') || allowed[0]?.code || 'T02');
  const info = typeInfo(typeCode);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [standard, setStandard] = useState(info?.proof || '');
  const [priority, setPriority] = useState<Priority>('正常');
  const [due, setDue] = useState('2026-11-15 18:00');
  const [path, setPath] = useState(defaultPath(typeCode));
  const [scope, setScope] = useState('按指定人');
  const [ownerId, setOwnerId] = useState<string>();
  const [customerId, setCustomerId] = useState<string>();
  const [branches, setBranches] = useState<string[]>(actor.branchId === '总行' ? ['深圳'] : [actor.branchId]);
  const [files, setFiles] = useState<string[]>([]);
  const [kyc, setKyc] = useState('');
  const [kycNote, setKycNote] = useState('');
  const customers = state.customers.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const picked = customers.find((item) => item.id === customerId);
  const preview = picked ? CHAINS[picked.tier] : null;
  const consultants = users.filter((item) => item.role === 'frontline' || item.role === 'leader');
  const paths = useMemo(() => pathOptions(typeCode), [typeCode]);

  const submit = () => {
    if (info?.create === 'ai') {
      message.warning('售后工单必须先经过 AI 问答');
      navigate('/services/ai');
      return;
    }
    if (info?.create === 'child-only') {
      message.error('该类型不能单独创建，请从项目实施主单生成');
      return;
    }
    if (typeCode === 'PE01') {
      const result = createMaster({ customerId: customerId || '', description, dueAt: due, ownerId: ownerId || picked?.ownerId });
      if ('error' in result) message.error(result.error);
      else {
        message.success('已按实施定级生成主单和子工单');
        navigate(`/services/implementation/${result.id}`);
      }
      return;
    }
    if (info?.create === 'frontline') {
      const result = createSimple({ typeCode: typeCode as 'T03' | 'T05', title, customerId: customerId || '', description, standard, priority, dueAt: due, ownerId });
      if ('error' in result) message.error(result.error);
      else {
        message.success('工单已提交');
        navigate(`/services/tickets/${result.id}`);
      }
      return;
    }
    const result = createDispatch({
      typeCode,
      title,
      description,
      standard,
      priority,
      dueAt: due,
      path,
      targetScope: scope,
      branchIds: branches,
      ownerId,
      customerId,
      acceptorId: actor.id,
      cc: [],
      attachments: files,
      kycCreditCode: kyc,
      kycNote,
    });
    if ('error' in result) message.error(result.error);
    else {
      message.success(`已下发 ${result.ids.length} 张工单`);
      navigate(result.ids.length === 1 ? `/services/tickets/${result.ids[0]}` : '/services/tickets?kind=dispatch');
    }
  };

  return (
    <div>
      <PageHead title="新建工单" desc="下发类要写清完成标准、范围和截止时间。实施主单会按客户当前定级自动生成子工单。自己给自己提单是允许的。" extra={<Button onClick={() => navigate('/services/tickets')}>返回</Button>} />
      <div className="panel">
        <Form layout="vertical">
          <Form.Item label="工单类型" required>
            <Select
              value={typeCode}
              options={allowed.map((item) => ({ value: item.code, label: `${item.code} ${item.name}` }))}
              onChange={(value) => {
                setTypeCode(value);
                setPath(defaultPath(value));
                setStandard(typeInfo(value)?.proof || '');
              }}
            />
          </Form.Item>
          {info ? <Alert type="info" showIcon message={`${info.flow} · 发起 ${info.from} · 执行 ${info.to}`} description={info.scene} /> : null}
          <Form.Item label="关联客户" required={typeCode !== 'T01'} extra={typeCode === 'T01' ? '营销工单可以先拜访、后建档。信用代码写入 KYC，建档时强制关联。' : '从档案选择，待开通档案也可以开工单。'}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={customerId}
              placeholder="搜索企业名称或档案号"
              options={customers.map((item) => ({ value: item.id, label: `${item.name} · ${item.archiveNo} · ${item.authStatus} · ${item.tier}` }))}
              onChange={setCustomerId}
            />
          </Form.Item>
          {typeCode === 'PE01' && preview ? (
            <Alert
              type="success"
              showIcon
              message={`将匹配：${preview.name}`}
              description={preview.steps.map((step) => `${step.name}${step.required ? '' : '（可选）'}`).join(' → ')}
            />
          ) : null}
          {typeCode === 'PE01' ? (
            <Button type="link" onClick={() => navigate('/customers/new')}>档案里没有这家客户，去建档</Button>
          ) : null}
          <Form.Item label="标题" required><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Form.Item>
          <Form.Item label="任务描述 / 作业要求" required><Input.TextArea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></Form.Item>
          {typeCode !== 'PE01' ? <Form.Item label="完成标准" required><Input value={standard} onChange={(event) => setStandard(event.target.value)} /></Form.Item> : null}
          <Space size="large" wrap>
            <Form.Item label="优先级">
              <Select style={{ width: 120 }} value={priority} options={['紧急', '正常', '低'].map((item) => ({ value: item, label: item }))} onChange={(value) => setPriority(value as Priority)} />
            </Form.Item>
            <Form.Item label="截止时间">
              <DatePicker showTime value={dayjs(due)} onChange={(value) => setDue(value ? value.format('YYYY-MM-DD HH:mm') : '')} />
            </Form.Item>
          </Space>
          {info?.create === 'dispatch' ? (
            <>
              <Form.Item label="下发路径"><Select value={path} options={paths.map((item) => ({ value: item, label: item }))} onChange={setPath} /></Form.Item>
              <Form.Item label="目标范围">
                <Select value={scope} options={['按指定人', '按分行', '按组', '按客群'].map((item) => ({ value: item, label: item === '按客群' ? '按客群（要客级）' : item }))} onChange={setScope} />
              </Form.Item>
              {scope === '按指定人' ? (
                <Form.Item label="执行人" extra="可以选自己。">
                  <Select showSearch optionFilterProp="label" value={ownerId} options={consultants.map((item) => ({ value: item.id, label: `${item.name} · ${item.city}${item.status === '在职' ? '' : `（${item.status}）`}` }))} onChange={setOwnerId} />
                </Form.Item>
              ) : (
                <Form.Item label="分行">
                  <Select mode="multiple" value={branches} options={CITIES.map((item) => ({ value: item.city, label: `${item.city}（${item.region}）` }))} onChange={setBranches} />
                </Form.Item>
              )}
              {typeCode === 'T01' ? (
                <>
                  <Form.Item label="KYC 统一社会信用代码"><Input value={kyc} maxLength={18} onChange={(event) => setKyc(event.target.value.toUpperCase())} /></Form.Item>
                  <Form.Item label="KYC 备注"><Input.TextArea rows={2} value={kycNote} onChange={(event) => setKycNote(event.target.value)} /></Form.Item>
                </>
              ) : null}
              <Form.Item label="附件">
                <Upload beforeUpload={(file) => { setFiles((list) => [...list, file.name]); return false; }}>
                  <Button>选择文件</Button>
                </Upload>
                <div className="muted">{files.join('、')}</div>
              </Form.Item>
            </>
          ) : null}
          {info?.create === 'frontline' ? (
            <Form.Item label="指定处理人" extra="留空则进入待分配池。选自己表示自处理，不做派单限制。">
              <Select allowClear value={ownerId} options={users.filter((item) => item.team === '实施' || item.id === actor.id).map((item) => ({ value: item.id, label: `${item.name} · ${item.team}` }))} onChange={setOwnerId} />
            </Form.Item>
          ) : null}
          <Button type="primary" onClick={submit}>提交</Button>
        </Form>
      </div>
    </div>
  );
}

function defaultPath(code: string): string {
  if (code === 'T01') return '分行→一线';
  if (code === 'T07') return '集中→一线';
  if (code === 'T15') return '在线客服→一线';
  return '部门→一线';
}

function pathOptions(code: string): string[] {
  if (code === 'T07') return ['集中→一线', '技术支持→一线', '集中实施→一线', '在线客服→一线'];
  if (code === 'T15') return ['在线客服→一线', '集中→一线'];
  if (code === 'T01') return ['分行→一线'];
  return ['部门→一线'];
}
