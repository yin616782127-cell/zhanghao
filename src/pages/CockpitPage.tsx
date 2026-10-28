import { Table, Tabs } from 'antd';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CITIES, TICKET_TYPES, isDispatchCode } from '../catalog';
import { PageHead, StatusTag } from '../components';
import { isRedOverdue, isTerminal, masterProgress, round1 } from '../logic';
import { useApp } from '../store';

export default function CockpitPage() {
  const { state } = useApp();
  const tickets = state.tickets.filter((item) => item.kind !== 'child');
  const closed = tickets.filter((item) => item.handlingHours);
  const avg = closed.length ? round1(closed.reduce((sum, item) => sum + (item.handlingHours || 0), 0) / closed.length) : 0;
  const dispatch = tickets.filter((item) => isDispatchCode(item.typeCode));
  const dispatchDone = dispatch.filter((item) => item.status === '已完成').length;
  const rate = dispatch.length ? Math.round((dispatchDone / dispatch.length) * 100) : 0;
  const typeBars = TICKET_TYPES.map((item) => ({
    name: item.code,
    数量: state.tickets.filter((ticket) => ticket.typeCode === item.code).length,
  }));
  const cityLoad = [...CITIES].sort((a, b) => b.visits - a.visits);
  const hot = CITIES.map((city) => ({
    city: city.city,
    拜访: city.visits,
    档案: state.customers.filter((item) => item.branchId === city.id).length,
  }));
  const masters = state.tickets.filter((item) => item.typeCode === 'PE01');
  return (
    <div data-testid="page-cockpit">
      <PageHead
        title="数据驾驶舱"
        desc="给部门管理者和分行组长看负荷、超时、实施偏差。城市拜访量是示意规模，工单数字来自当前演示数据。标准工期是模板配置，不是制度数字。"
      />
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">在册档案</div><div className="stat-value">{state.customers.length}</div></div>
        <div className="stat navy"><div className="stat-label">在途工单</div><div className="stat-value">{tickets.filter((item) => !isTerminal(item.status)).length}</div></div>
        <div className="stat"><div className="stat-label">下发完成率</div><div className="stat-value">{rate}%</div><div className="stat-extra">{dispatchDone}/{dispatch.length}</div></div>
        <div className="stat gold"><div className="stat-label">平均处理时长</div><div className="stat-value">{avg}</div><div className="stat-extra">小时 · 红色超时 {tickets.filter((item) => isRedOverdue(item)).length}</div></div>
      </div>
      <Tabs
        items={[
          {
            key: 'ticket',
            label: '工单分布',
            children: (
              <div className="panel">
                <h2>16 类工单数量</h2>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeBars}>
                      <CartesianGrid stroke="#eef2f5" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="数量" fill="#0f6e6b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ),
          },
          {
            key: 'city',
            label: '44 城负荷',
            children: (
              <div className="panel">
                <h2>月拜访量，忙闲差很大</h2>
                <div style={{ height: 640 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityLoad} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid stroke="#eef2f5" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="city" width={72} />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#143f66">
                        {cityLoad.map((item) => <Cell key={item.city} fill={item.visits >= 60 ? '#c2453a' : item.visits >= 30 ? '#0f6e6b' : '#8aa0b2'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ),
          },
          {
            key: 'heat',
            label: '服务热力',
            children: (
              <div className="panel">
                <Table
                  size="small"
                  rowKey="city"
                  pagination={{ pageSize: 15 }}
                  dataSource={[...hot].sort((a, b) => b.拜访 - a.拜访)}
                  columns={[
                    { title: '城市', dataIndex: 'city' },
                    { title: '月拜访（示意）', dataIndex: '拜访' },
                    { title: '本原型档案', dataIndex: '档案' },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'impl',
            label: '实施链路',
            children: (
              <div className="panel">
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={masters}
                  columns={[
                    { title: '项目', dataIndex: 'title' },
                    { title: '定级', dataIndex: 'tier', render: (value: string) => <StatusTag value={value} /> },
                    { title: '链路', dataIndex: 'templateName' },
                    { title: '进度', render: (_, row) => `${masterProgress(row.id, state.tickets).percent}%` },
                    { title: '阶段', dataIndex: 'projectPhase' },
                    { title: '状态', dataIndex: 'status', render: (value: string) => <StatusTag value={value} /> },
                  ]}
                />
                <p className="muted">要客级含复核和试运行，重点级到交付确认，潜力级只到上线确认。子单完成才计入进度。</p>
              </div>
            ),
          },
          {
            key: 'after',
            label: '售后链路',
            children: (
              <div className="panel">
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={state.tickets.filter((item) => item.typeCode === 'T09' || item.typeCode === 'T06')}
                  columns={[
                    { title: '单号', dataIndex: 'no' },
                    { title: '标题', dataIndex: 'title' },
                    { title: '状态', dataIndex: 'status', render: (value: string) => <StatusTag value={value} /> },
                    { title: '节点', render: (_, row) => row.handlerTrail[row.handlerTrail.length - 1]?.node || '—' },
                    { title: '可复用', render: (_, row) => row.reusable ? '是' : '否' },
                  ]}
                />
                <p className="muted">同一张 T09 贯穿一线、二线和研发。转需求后另开 T06，原单号保留关联。</p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
