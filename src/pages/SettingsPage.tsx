import { Button, Input, Switch, Table, Tabs, Tag } from 'antd';
import { App } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CITIES, PERM_LABELS } from '../catalog';
import { USERS } from '../seed';
import { PageHead, StatusTag } from '../components';
import { useApp } from '../store';
import type { DictType, RoleKey } from '../types';

const ROLE_ORDER: RoleKey[] = ['frontline', 'leader', 'central', 'director'];
const ROLE_NAME: Record<RoleKey, string> = {
  frontline: '一线实施顾问',
  leader: '一线运营组长',
  central: '集中运营',
  director: '部门负责人',
};

export default function SettingsPage({ tab }: { tab: 'users' | 'roles' | 'branches' | 'dicts' }) {
  const navigate = useNavigate();
  return (
    <Tabs
      activeKey={tab}
      onChange={(key) => navigate(`/settings/${key}`)}
      items={[
        { key: 'users', label: '用户管理', children: <Users /> },
        { key: 'roles', label: '角色管理', children: <Roles /> },
        { key: 'branches', label: '分行管理', children: <Branches /> },
        { key: 'dicts', label: '字典管理', children: <Dicts /> },
      ]}
    />
  );
}

function Users() {
  const { users } = useApp();
  return (
    <div>
      <PageHead title="用户管理" desc="账号从组织同步，角色和所属分行决定能看哪些客户、能做哪些动作。" />
      <div className="panel">
        <Table
          size="small"
          rowKey="id"
          dataSource={users}
          columns={[
            { title: '姓名', dataIndex: 'name', width: 90 },
            { title: '岗位', dataIndex: 'title', width: 120 },
            { title: '团队', dataIndex: 'team', width: 80 },
            { title: '城市', dataIndex: 'city', width: 80 },
            { title: '数据归属', dataIndex: 'branchId', width: 90 },
            { title: '状态', dataIndex: 'status', width: 80, render: (value: string) => <StatusTag value={value} /> },
            { title: '组织', dataIndex: 'org' },
            { title: '来源', width: 90, render: () => <Tag>组织同步</Tag> },
          ]}
        />
      </div>
    </div>
  );
}

function Roles() {
  const { state, setPerm } = useApp();
  return (
    <div>
      <PageHead title="角色管理" desc="菜单对四个演示角色都开放，方便走查。功能和数据权限按角色生效：分行只看本分行，总行看全量。下面的开关会立刻改变按钮是否可点。" />
      <div className="panel">
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={PERM_LABELS}
          columns={[
            { title: '功能', dataIndex: 'label', width: 240 },
            ...ROLE_ORDER.map((role) => ({
              title: ROLE_NAME[role],
              render: (_: unknown, row: { key: typeof PERM_LABELS[number]['key'] }) => (
                <Switch checked={state.roleConfig[role].perms[row.key]} onChange={(value) => setPerm(role, row.key, value)} />
              ),
            })),
          ]}
        />
        <p className="muted">数据权限：一线顾问和组长按所属分行隔离；集中运营和部门负责人属于总行，看全量。个人工作台另外按管护人过滤，那是视图，不是第二套权限。</p>
      </div>
    </div>
  );
}

function Branches() {
  const { state } = useApp();
  return (
    <div>
      <PageHead title="分行管理" desc="一线按分行归属。客户档案、工单和服务日志都按分行隔离。下表是 44 个城市的负荷示意，不是 44 个独立页面。" />
      <div className="panel">
        <Table
          size="small"
          rowKey="id"
          dataSource={CITIES}
          columns={[
            { title: '城市', dataIndex: 'city', width: 100 },
            { title: '区域', dataIndex: 'region', width: 80 },
            { title: '月拜访', dataIndex: 'visits', width: 90 },
            { title: '顾问编制', dataIndex: 'consultants', width: 90 },
            { title: '应管客户规模', dataIndex: 'bookSize', width: 120 },
            { title: '本原型档案', width: 110, render: (_, row) => state.customers.filter((item) => item.branchId === row.id).length },
            { title: '已开通账号', width: 110, render: (_, row) => USERS.filter((item) => item.branchId === row.id).length },
          ]}
        />
      </div>
    </div>
  );
}

function Dicts() {
  const { message } = App.useApp();
  const { state, addDict } = useApp();
  const [current, setCurrent] = useState(state.dicts[0]?.key || 'gradeTags');
  const [label, setLabel] = useState('');
  const dict = state.dicts.find((item) => item.key === current) as DictType | undefined;
  return (
    <div>
      <PageHead title="字典管理" desc="定级标签、行业门类、问题类型、优先级和未解决原因从这里取。新增后，建档和转工单的选项会跟着变。" />
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12 }}>
        <div className="panel">
          {state.dicts.map((item) => (
            <div key={item.key} style={{ padding: '6px 0', cursor: 'pointer', fontWeight: item.key === current ? 650 : 400 }} onClick={() => setCurrent(item.key)}>{item.name}</div>
          ))}
        </div>
        <div className="panel">
          <h2>{dict?.name}</h2>
          <Table size="small" rowKey="code" pagination={false} dataSource={dict?.items || []} columns={[
            { title: '编码', dataIndex: 'code', width: 80 },
            { title: '名称', dataIndex: 'label' },
            { title: '启用', dataIndex: 'enabled', width: 80, render: (value: boolean) => value ? '是' : '否' },
          ]} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input value={label} placeholder="新字典项" onChange={(event) => setLabel(event.target.value)} />
            <Button type="primary" onClick={() => { if (!label.trim() || !dict) return; addDict(dict.key, label.trim()); setLabel(''); message.success('已加入字典'); }}>添加</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
