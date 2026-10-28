import {
  ApartmentOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Select, Tag } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ACTORS } from '../catalog';
import { useApp } from '../store';

const { Sider, Header, Content } = Layout;

const GROUPS = ['cust', 'svc', 'set'];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole, actor, state } = useApp();
  const selected = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/customers/new')) return '/customers/new';
    if (path.startsWith('/customers/key')) return '/customers/key';
    if (path.startsWith('/customers/ownership')) return '/customers/ownership';
    if (path.startsWith('/customers')) return '/customers';
    if (path.startsWith('/services/types')) return '/services/types';
    if (path.startsWith('/services/exposure')) return '/services/exposure';
    if (path.startsWith('/services/implementation')) return '/services/implementation';
    if (path.startsWith('/services/ai-test')) return '/services/ai-test';
    if (path.startsWith('/services/ai')) return '/services/ai';
    if (path.startsWith('/services/logs')) return '/services/logs';
    if (path.startsWith('/services/direct')) return '/services/direct';
    if (path.startsWith('/services/biz')) return '/services/biz';
    if (path.startsWith('/services/tickets')) return '/services/tickets';
    if (path.startsWith('/knowledge')) return '/knowledge';
    if (path.startsWith('/settings/roles')) return '/settings/roles';
    if (path.startsWith('/settings/branches')) return '/settings/branches';
    if (path.startsWith('/settings/dicts')) return '/settings/dicts';
    if (path.startsWith('/settings')) return '/settings/users';
    if (path.startsWith('/cockpit')) return '/cockpit';
    return '/workbench';
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={228} theme="dark" style={{ background: '#0c2340' }}>
        <div className="logo-block">
          <div className="mark">YUNCHUANG</div>
          <div className="name">云创运营管理平台</div>
          <div className="sub">财资客户服务</div>
        </div>
        <div className="sider-scroll">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selected]}
            defaultOpenKeys={GROUPS}
            style={{ background: '#0c2340' }}
            items={[
              { key: '/workbench', icon: <DashboardOutlined />, label: '工作台', onClick: () => navigate('/workbench') },
              {
                key: 'cust',
                icon: <TeamOutlined />,
                label: '客户管理',
                children: [
                  { key: '/customers', label: '客户列表', onClick: () => navigate('/customers') },
                  { key: '/customers/new', label: '新增客户档案', onClick: () => navigate('/customers/new') },
                  { key: '/customers/key', label: '重保客户管理', onClick: () => navigate('/customers/key') },
                  { key: '/customers/ownership', label: '一线管户列表', onClick: () => navigate('/customers/ownership') },
                ],
              },
              {
                key: 'svc',
                icon: <CustomerServiceOutlined />,
                label: '经营服务',
                children: [
                  { key: '/services/tickets', label: '工单', onClick: () => navigate('/services/tickets') },
                  { key: '/services/types', label: '工单类型', onClick: () => navigate('/services/types') },
                  { key: '/services/exposure', label: '晾晒看板', onClick: () => navigate('/services/exposure') },
                  { key: '/services/implementation', label: '实施过程管理', onClick: () => navigate('/services/implementation') },
                  { key: '/services/ai', label: 'AI智能问答', onClick: () => navigate('/services/ai') },
                  { key: '/services/ai-test', label: 'AI测试自动化', onClick: () => navigate('/services/ai-test') },
                  { key: '/services/logs', label: '服务日志', onClick: () => navigate('/services/logs') },
                  { key: '/services/direct', label: '直联参数', onClick: () => navigate('/services/direct') },
                  { key: '/services/biz', label: '业务参数', onClick: () => navigate('/services/biz') },
                ],
              },
              { key: '/cockpit', icon: <ApartmentOutlined />, label: '数据驾驶舱', onClick: () => navigate('/cockpit') },
              { key: '/knowledge', icon: <BookOutlined />, label: '知识库', onClick: () => navigate('/knowledge') },
              {
                key: 'set',
                icon: <SettingOutlined />,
                label: '系统设置',
                children: [
                  { key: '/settings/users', label: '用户管理', onClick: () => navigate('/settings/users') },
                  { key: '/settings/roles', label: '角色管理', onClick: () => navigate('/settings/roles') },
                  { key: '/settings/branches', label: '分行管理', onClick: () => navigate('/settings/branches') },
                  { key: '/settings/dicts', label: '字典管理', onClick: () => navigate('/settings/dicts') },
                ],
              },
            ]}
          />
        </div>
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #e6ebf0' }}>
          <span style={{ color: '#14324a' }}>
            服务可看、可管理、可提效
            <Tag style={{ marginLeft: 8 }} color="blue">{actor.branchId === '总行' ? '数据范围：总行全量' : `数据范围：${actor.branchId}分行`}</Tag>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="muted">演示角色</span>
            <Select
              className="role-switcher"
              style={{ width: 220 }}
              value={state.role}
              options={(Object.keys(ACTORS) as (keyof typeof ACTORS)[]).map((key) => ({ value: key, label: ACTORS[key].label }))}
              onChange={(role) => {
                setRole(role);
                navigate('/workbench');
              }}
            />
          </span>
        </Header>
        <Content className="content-scroll">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
