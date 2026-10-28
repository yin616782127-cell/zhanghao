import { Alert, Button, Drawer, Select, Space, Steps, Table, Tabs } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGE_MATRIX, TICKET_TYPES } from '../catalog';
import { PageHead } from '../components';
import { useApp } from '../store';
import type { TicketTypeInfo } from '../types';

export default function TicketTypePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { state, can, simulateSystem } = useApp();
  const [current, setCurrent] = useState<TicketTypeInfo>();
  const [customerId, setCustomerId] = useState<string>();
  return (
    <div>
      <PageHead
        title="工单类型"
        desc="总表共 16 行：T01 到 T15，另加 PE01 项目实施主单。正文有的地方写成 15 类通路，主单单独列出。阶段矩阵里的权限申请、信息变更、满意度、促活没有独立编号，不另造类型。"
      />
      <Tabs
        items={[
          {
            key: 'matrix',
            label: '阶段矩阵',
            children: (
              <div className="panel">
                <Table
                  size="small"
                  pagination={false}
                  rowKey="stage"
                  dataSource={STAGE_MATRIX}
                  columns={[
                    { title: '生命周期', dataIndex: 'stage', width: 90 },
                    { title: '下发（总部/集中→一线）', dataIndex: 'down' },
                    { title: '一线（一线→集中）', dataIndex: 'front' },
                    { title: '集中内部', dataIndex: 'inner' },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'list',
            label: '16 类总表',
            children: (
              <div className="panel">
                <Table
                  size="small"
                  rowKey="code"
                  dataSource={TICKET_TYPES}
                  pagination={false}
                  columns={[
                    { title: '编号', dataIndex: 'code', width: 80 },
                    { title: '类型', dataIndex: 'name', width: 180 },
                    { title: '阶段', dataIndex: 'stage', width: 100 },
                    { title: '流向', dataIndex: 'flow', width: 140 },
                    { title: '发起', dataIndex: 'from', width: 120 },
                    { title: '执行', dataIndex: 'to', width: 180 },
                    { title: '完成凭证', dataIndex: 'proof' },
                    { title: '创建', dataIndex: 'create', width: 110, render: (value: string) => createLabel(value) },
                    { title: '', width: 90, render: (_, row) => <a onClick={() => setCurrent(row)}>模板</a> },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'engine',
            label: '配置引擎',
            children: (
              <div className="panel">
                <Alert
                  type="info"
                  showIcon
                  message="每个工单类型 = 表单 + 流程 + SLA + 分派，再加 SOP。这里只演示这四个维度怎么拼在一起，不能真的零代码发布新类型。"
                />
                <Steps
                  style={{ marginTop: 16 }}
                  direction="vertical"
                  size="small"
                  current={7}
                  items={['分析阶段和流向', '选择基础模板', '配置表单', '配置流程', '配置 SLA', '配置分派', '配置 SOP', '启用'].map((title) => ({ title, description: '演示步骤' }))}
                />
                {can('simulateSystem') ? (
                  <Space wrap style={{ marginTop: 12 }}>
                    <Select
                      style={{ width: 280 }}
                      placeholder="选一个客户模拟系统触发"
                      value={customerId}
                      options={state.customers.map((item) => ({ value: item.id, label: item.name }))}
                      onChange={setCustomerId}
                    />
                    <Button onClick={() => {
                      if (!customerId) return;
                      const result = simulateSystem('T10', customerId);
                      if ('error' in result) message.error(result.error);
                      else navigate(`/services/tickets/${result.id}`);
                    }}>模拟 T10 告警</Button>
                    <Button onClick={() => {
                      if (!customerId) return;
                      const result = simulateSystem('T13', customerId);
                      if ('error' in result) message.error(result.error);
                      else navigate(`/services/tickets/${result.id}`);
                    }}>模拟 T13 流失预警</Button>
                  </Space>
                ) : null}
              </div>
            ),
          },
        ]}
      />
      <Drawer title={current ? `${current.code} ${current.name}` : ''} open={Boolean(current)} width={520} onClose={() => setCurrent(undefined)}>
        {current ? (
          <>
            <p>{current.scene}</p>
            <p>完成凭证：{current.proof}</p>
            <p>表单：标题、关联客户、描述、优先级、截止时间、完成标准。下发类另有路径、范围、抄送和附件。T09 另有问题类型、客户级别、未解决原因和 AI 原文。</p>
            <p>流程：{current.flow}。子单独立流转，主单进度按已完成子单 / 子单总数回写。</p>
            <p>SLA：待接收黄灯用演示阈值 8 小时；处理超时用演示阈值 24 小时；验收 48 小时按文档。自处理不计 SLA，进池后重置，总周期继续累计。</p>
            <p>分派：下发可按分行、指定人、组或要客客群。集中队列支持批量派单和转派。</p>
            <p>SOP：作业要求写在完成标准里，标准耗时挂在实施链路上，当前数字是模板演示值。</p>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}

function createLabel(value: string): string {
  const map: Record<string, string> = {
    dispatch: '可下发',
    frontline: '一线可提',
    master: '主单',
    ai: '须先 AI',
    system: '系统触发',
    'child-only': '仅子单',
    escalate: '由售后转入',
  };
  return map[value] || value;
}
