import { Button, Input, InputNumber, Modal, Space, Tag, Tooltip } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import { deviationText } from './logic';
import type { AppUser } from './types';

const STATUS_COLOR: Record<string, string> = {
  待接收: 'default',
  进行中: 'processing',
  待验收: 'gold',
  已完成: 'success',
  已取消: 'default',
  待分配: 'orange',
  处理中: 'processing',
  自处理: 'cyan',
  研发处理中: 'purple',
  待一线确认: 'gold',
  已转需求: 'default',
  待开始: 'default',
  已挂起: 'warning',
  实施中: 'processing',
  已暂停: 'warning',
  待复核: 'gold',
  试运行: 'processing',
  待结项: 'gold',
  告警处理: 'error',
  已排期: 'blue',
  待产品受理: 'orange',
  待开通: 'warning',
  已开通: 'success',
  要客级: 'red',
  重点级: 'blue',
  潜力级: 'default',
  在职: 'success',
  休假: 'gold',
  离职: 'default',
};

export function StatusTag({ value }: { value?: string }) {
  if (!value) return <span>—</span>;
  return <Tag color={STATUS_COLOR[value] || 'default'}>{value}</Tag>;
}

export function PageHead({ title, desc, extra }: { title: string; desc?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {desc ? <p>{desc}</p> : null}
      </div>
      <Space wrap>{extra}</Space>
    </div>
  );
}

export function personName(users: AppUser[], id?: string): string {
  if (!id) return '—';
  return users.find((item) => item.id === id)?.name || id;
}

export function Guard({ allow, title, children }: { allow: boolean; title: string; children: ReactNode }) {
  if (allow) return <>{children}</>;
  return <Tooltip title={title}><span>{children}</span></Tooltip>;
}

export function HoursDialog({
  open,
  logged,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  logged: number;
  onCancel: () => void;
  onSubmit: (hours: number, note: string) => void;
}) {
  const [hours, setHours] = useState(logged || 1);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setHours(logged || 1);
      setNote('');
    }
  }, [open, logged]);
  return (
    <Modal
      title="填报工时"
      open={open}
      onCancel={onCancel}
      destroyOnClose
      onOk={() => onSubmit(hours, note)}
      okText="确认"
    >
      <p className="muted">工时以服务日志为载体。这里填报的是关单或提交时的复核工时，用来和已关联日志对照。</p>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>已关联日志工时：{logged} 小时</div>
        <div>
          本次填报
          <InputNumber min={0.5} step={0.5} value={hours} style={{ marginLeft: 8 }} onChange={(value) => setHours(Number(value) || 0)} />
          <span> 小时</span>
        </div>
        <div className="muted">偏离度：{deviationText(hours, logged)}</div>
        <Input.TextArea value={note} placeholder="补充说明" onChange={(event) => setNote(event.target.value)} />
      </Space>
    </Modal>
  );
}

export function NoteButton({
  label,
  onSubmit,
  disabled,
}: {
  label: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="small"
      disabled={disabled}
      onClick={() => {
        let text = '';
        Modal.confirm({
          title: label,
          content: (
            <textarea
              style={{ width: '100%', minHeight: 80, marginTop: 8, padding: 8 }}
              onChange={(event) => { text = event.target.value; }}
            />
          ),
          onOk: () => onSubmit(text),
        });
      }}
    >
      {label}
    </Button>
  );
}
