import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { 
  DashboardOutlined, 
  BulbOutlined, 
  BarChartOutlined, 
  ScheduleOutlined, 
  ThunderboltOutlined 
} from '@ant-design/icons';
import Dashboard from './features/dashboard/Dashboard';
import CreationWorkshop from './features/creation/CreationWorkshop';
import Analytics from './features/analytics/Analytics';
import Publishing from './features/publishing/Publishing';
import Strategy from './features/strategy/Strategy';
import './App.css';

const { Header, Sider, Content } = Layout;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
};

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'creation',
    icon: <BulbOutlined />,
    label: 'AI创作工坊',
  },
  {
    key: 'analytics', 
    icon: <BarChartOutlined />,
    label: '数据军师',
  },
  {
    key: 'publishing',
    icon: <ScheduleOutlined />,
    label: '自动化引擎',
  },
  {
    key: 'strategy',
    icon: <ThunderboltOutlined />,
    label: 'AI策略大脑',
  },
];

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'creation':
        return <CreationWorkshop />;
      case 'analytics':
        return <Analytics />;
      case 'publishing':
        return <Publishing />;
      case 'strategy':
        return <Strategy />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} className="apple-sidebar">
        <div className="logo-container">
          <h2 className="logo-text">小红书提效</h2>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={menuItems}
          className="apple-menu"
        />
      </Sider>
      
      <Layout>
        <Header className="apple-header">
          <div className="header-content">
            <h1 className="page-title">
              {menuItems.find(item => item.key === selectedKey)?.label}
            </h1>
            <div className="user-avatar">
              <div className="avatar-circle">用</div>
            </div>
          </div>
        </Header>
        
        <Content className="apple-content">
          <div className="content-container">
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
