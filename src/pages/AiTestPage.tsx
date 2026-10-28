import { Alert, Button, Table, Tag } from 'antd';
import { useState } from 'react';
import { PageHead, StatusTag } from '../components';
import { useApp } from '../store';

export default function AiTestPage() {
  const { state, finishAiCase } = useApp();
  const [running, setRunning] = useState<string>();
  return (
    <div>
      <PageHead title="AI测试自动化" desc="用例清单和最近一次运行结果。点击运行只会在浏览器里模拟通过或失败，不会调用真实执行器。" />
      <Alert type="info" showIcon message="演示模拟。失败用例用来展示状态，不代表当前知识库真的跑过回归。" />
      <div className="panel" style={{ marginTop: 12 }}>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={state.aiCases}
          columns={[
            { title: '用例', dataIndex: 'name' },
            { title: '模块', dataIndex: 'module', width: 120 },
            { title: '负责人', dataIndex: 'owner', width: 90 },
            { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <StatusTag value={value === '通过' ? '已完成' : value === '失败' ? '告警处理' : '待开始'} /> },
            { title: '最近运行', dataIndex: 'lastRun', width: 160, render: (value?: string) => value || '—' },
            { title: '耗时', dataIndex: 'duration', width: 80, render: (value?: string) => value || '—' },
            {
              title: '操作',
              width: 120,
              render: (_, row) => (
                <Button
                  size="small"
                  loading={running === row.id}
                  onClick={() => {
                    setRunning(row.id);
                    window.setTimeout(() => {
                      const failed = row.id === 'case4';
                      finishAiCase(row.id, failed ? '失败' : '通过', failed ? '4.2s' : '1.6s');
                      setRunning(undefined);
                    }, 700);
                  }}
                >
                  模拟运行
                </Button>
              ),
            },
          ]}
        />
        <div style={{ marginTop: 8 }}><Tag>通过 {state.aiCases.filter((item) => item.status === '通过').length}</Tag><Tag color="red">失败 {state.aiCases.filter((item) => item.status === '失败').length}</Tag><Tag>未运行 {state.aiCases.filter((item) => item.status === '未运行').length}</Tag></div>
      </div>
    </div>
  );
}
