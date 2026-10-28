import { Alert, Button, Input, List, Modal, Select, Space, Tag } from 'antd';
import { App } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../components';
import { customerLevelOf, guessProblemType } from '../logic';
import { useApp } from '../store';

export default function AiPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const app = useApp();
  const { state, actor, can, startSession, chat, resolveSession, convertSession } = app;
  const [active, setActive] = useState(state.sessions[0]?.id || '');
  const [mode, setMode] = useState<'aftersales' | 'marketing'>('aftersales');
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const session = state.sessions.find((item) => item.id === active);
  const customers = state.customers.filter((item) => actor.branchId === '总行' || item.branchId === actor.branchId);
  const [customerId, setCustomerId] = useState(customers[0]?.id);
  const [reason, setReason] = useState('需人工操作');
  const [problemType, setProblemType] = useState('协助排查');
  const [title, setTitle] = useState('');
  const rounds = session?.messages.filter((item) => item.role === 'user').length || 0;
  const reasons = state.dicts.find((item) => item.key === 'unresolved')?.items || [];
  const problems = state.dicts.find((item) => item.key === 'problem')?.items || [];
  const customer = customers.find((item) => item.id === customerId);
  const summary = useMemo(() => session?.messages.map((item) => `${item.role === 'user' ? '问' : '答'}：${item.content}`).join('\n') || '', [session]);

  const send = () => {
    if (!text.trim()) return;
    if (!session) {
      const id = startSession(mode, customerId, text);
      setActive(id);
    } else chat(session.id, text);
    setText('');
  };

  return (
    <div data-testid="page-ai">
      <PageHead
        title="AI智能问答"
        desc="售后运维工单提单前必须经过这里。至少一轮问答。能解决就标记已解决，不进人工池；不能解决要选择原因后再转工单，原文随单保存。营销咨询也可以从这里进，但不转成售后工单。"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
        <div className="panel">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select value={mode} options={[{ value: 'aftersales', label: '售后分诊' }, { value: 'marketing', label: '营销咨询' }]} onChange={setMode} />
            <Button
              type="primary"
              block
              onClick={() => {
                const id = startSession(mode, customerId);
                setActive(id);
              }}
            >
              新会话
            </Button>
          </Space>
          <List
            style={{ marginTop: 8 }}
            size="small"
            dataSource={state.sessions}
            renderItem={(item) => (
              <List.Item onClick={() => setActive(item.id)} style={{ cursor: 'pointer', background: item.id === active ? '#f3faf9' : undefined }}>
                <div>
                  <div>{item.title}</div>
                  <div className="muted">{item.mode === 'aftersales' ? '售后' : '营销'} {item.resolved ? '· 已解决' : ''} {item.ticketId ? '· 已转工单' : ''}</div>
                </div>
              </List.Item>
            )}
          />
        </div>
        <div className="panel" style={{ minHeight: 460 }}>
          {!session ? <Alert type="info" showIcon message="先新建会话，再提问。" /> : null}
          {session?.messages.map((item, index) => (
            <div key={index} style={{ marginBottom: 10, padding: 8, background: item.role === 'user' ? '#f7f9fb' : '#f3faf9', borderRadius: 4 }}>
              <b>{item.role === 'user' ? '我' : '知识库助手'}</b>
              <span className="muted"> {item.at}</span>
              <div>{item.content}</div>
            </div>
          ))}
          <Space.Compact style={{ width: '100%', marginTop: 8 }}>
            <Input data-testid="ai-input" value={text} placeholder="描述现象、报错和已经做过的排查" onChange={(event) => setText(event.target.value)} onPressEnter={send} />
            <Button data-testid="ai-send" type="primary" onClick={send}>发送</Button>
          </Space.Compact>
          <div className="muted" style={{ marginTop: 8 }}>快捷问题：</div>
          <Space wrap style={{ marginTop: 6 }}>
            {['银企直联证书到期怎么办', '支付指令银行成功但系统仍处理中', '回单批量下载失败', '要客实施要走哪些环节'].map((item) => (
              <Tag key={item} style={{ cursor: 'pointer' }} onClick={() => setText(item)}>{item}</Tag>
            ))}
          </Space>
          {session && session.mode === 'aftersales' ? (
            <Space style={{ marginTop: 16 }}>
              <Button
                disabled={!can('aiConvert') || rounds < 1 || Boolean(session.ticketId) || session.resolved}
                onClick={() => { resolveSession(session.id); message.success('已标记解决，不进入工单池'); }}
              >
                标记已解决
              </Button>
              <Button
                data-testid="ai-convert"
                type="primary"
                disabled={!can('aiConvert') || rounds < 1 || Boolean(session.ticketId)}
                onClick={() => {
                  setTitle(session.title);
                  setProblemType(guessProblemType(summary));
                  const found = customers.find((item) => item.id === session.customerId) || customers[0];
                  if (found) setCustomerId(found.id);
                  setOpen(true);
                }}
              >
                转工单
              </Button>
              {session.ticketId ? <Button onClick={() => navigate(`/services/tickets/${session.ticketId}`)}>查看工单</Button> : null}
              {rounds < 1 ? <span className="muted">还没有完成一轮问答</span> : null}
            </Space>
          ) : null}
          {session && session.mode === 'marketing' ? (
            <Button
              style={{ marginTop: 16 }}
              disabled={!session.messages.length}
              onClick={() => {
                if (!customerId) return message.warning('请先在转工单区选择客户，或建档后再记');
                const id = app.addLog({
                  date: '2026-10-28',
                  stage: '营销',
                  visitType: '远程',
                  hours: 0.5,
                  customerId,
                  content: `营销咨询纪要：${session.messages.map((item) => item.content).join(' / ')}`,
                });
                if (!id) message.warning('请选择已建档客户后再保存纪要');
                else message.success('已保存为营销阶段服务日志');
              }}
            >
              保存营销纪要
            </Button>
          ) : null}
        </div>
      </div>
      <Modal
        title="转为售后运维工单"
        open={open}
        onCancel={() => setOpen(false)}
        okText="生成 T09"
        onOk={() => {
          if (!session) return;
          const result = convertSession(session.id, {
            customerId: customerId || '',
            problemType,
            title,
            description: summary,
            reason,
            customerLevel: customer ? customerLevelOf(customer.tier) : '重要客户',
          });
          if (!result.ok) message.error(result.error);
          else {
            message.success('已生成工单，原文已附上');
            setOpen(false);
            navigate(`/services/tickets/${result.id}`);
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select style={{ width: '100%' }} value={customerId} options={customers.map((item) => ({ value: item.id, label: `${item.name} · ${item.tier}` }))} onChange={setCustomerId} />
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="问题标题" />
          <Select style={{ width: '100%' }} value={problemType} options={problems.map((item) => ({ value: item.label, label: item.label }))} onChange={setProblemType} />
          <Select data-testid="unresolved-reason" style={{ width: '100%' }} value={reason} options={reasons.map((item) => ({ value: item.label, label: item.label }))} onChange={setReason} />
          <Input.TextArea rows={5} value={summary} readOnly />
          <div className="muted">未解决原因必选。客户级别按实施定级带出，可在工单上再看。</div>
        </Space>
      </Modal>
    </div>
  );
}
