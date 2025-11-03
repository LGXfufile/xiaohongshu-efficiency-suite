import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Table, 
  Tag, 
  Avatar, 
  message, 
  Popconfirm, 
  Tooltip,
  Badge,
  Space,
  Switch
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  LoginOutlined, 
  LogoutOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import { xhsLoginService } from '../../services/xiaohongshu/loginService';
import { LoginStatus, LoginMethod, XHSAccount } from '../../services/xiaohongshu/config';
import { QuickLoginChecker } from '../../services/xiaohongshu/quickLoginChecker';

const XHSAccountManager: React.FC = () => {
  const { 
    loginStatus, 
    currentUser, 
    allAccounts, 
    isLoggingIn,
    setLoginStatus,
    setCurrentUser,
    setAllAccounts,
    setIsLoggingIn
  } = useAppStore();

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [loginForm] = Form.useForm();
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoLogin, setAutoLogin] = useState(true);

  useEffect(() => {
    // 初始化登录服务监听
    const handleStatusChange = (status: LoginStatus, account?: XHSAccount) => {
      setLoginStatus(status);
      setCurrentUser(account || null);
      setIsLoggingIn(status === LoginStatus.LOGGING_IN);
      
      // 更新账户列表
      const accounts = xhsLoginService.getAllAccounts();
      setAllAccounts(accounts);
    };

    xhsLoginService.onStatusChange(handleStatusChange);

    // 初始化数据和快速检查
    const initializeData = async () => {
      const accounts = xhsLoginService.getAllAccounts();
      setAllAccounts(accounts);
      
      // 快速检查当前登录状态
      try {
        const quickResult = await QuickLoginChecker.quickCheck();
        if (quickResult.isLoggedIn) {
          setLoginStatus(LoginStatus.LOGGED_IN);
          const activeAccount = xhsLoginService.getCurrentUser();
          setCurrentUser(activeAccount);
        } else {
          setLoginStatus(LoginStatus.NOT_LOGGED_IN);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('快速登录检查失败:', error);
        setLoginStatus(xhsLoginService.getCurrentStatus());
        setCurrentUser(xhsLoginService.getCurrentUser());
      }
    };

    initializeData();

    return () => {
      xhsLoginService.removeStatusListener(handleStatusChange);
    };
  }, [setLoginStatus, setCurrentUser, setAllAccounts, setIsLoggingIn]);

  // 发送验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 登录状态样式
  const getStatusTag = (status: LoginStatus) => {
    const statusConfig = {
      [LoginStatus.NOT_LOGGED_IN]: { color: 'default', text: '未登录' },
      [LoginStatus.LOGGING_IN]: { color: 'processing', text: '登录中' },
      [LoginStatus.LOGGED_IN]: { color: 'success', text: '已登录' },
      [LoginStatus.LOGIN_FAILED]: { color: 'error', text: '登录失败' },
      [LoginStatus.SESSION_EXPIRED]: { color: 'warning', text: '会话过期' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const phone = loginForm.getFieldValue('phone');
      if (!phone) {
        message.warning('请输入手机号');
        return;
      }

      const result = await xhsLoginService.sendSMSCode(phone);
      if (result.success) {
        message.success('验证码已发送');
        setIsCodeSent(true);
        setCountdown(60);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('发送验证码失败');
    }
  };

  // 手机号登录
  const handleLogin = async (values: { phone: string; code?: string }) => {
    try {
      setIsLoggingIn(true);
      
      let result;
      if (autoLogin) {
        // 智能登录
        result = await xhsLoginService.smartLogin(values.phone);
      } else {
        // 手机号验证码登录
        if (!values.code) {
          message.warning('请输入验证码');
          return;
        }
        result = await xhsLoginService.loginWithSMS(values.phone, values.code);
      }

      if (result.success) {
        message.success('登录成功');
        setIsLoginModalVisible(false);
        loginForm.resetFields();
        setIsCodeSent(false);
        setCountdown(0);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('登录失败');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 切换账户
  const handleSwitchAccount = async (accountId: string) => {
    try {
      setIsLoggingIn(true);
      const result = await xhsLoginService.switchAccount(accountId);
      if (result.success) {
        message.success('账户切换成功');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('切换账户失败');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 删除账户
  const handleDeleteAccount = (accountId: string) => {
    const success = xhsLoginService.deleteAccount(accountId);
    if (success) {
      message.success('账户删除成功');
      const accounts = xhsLoginService.getAllAccounts();
      setAllAccounts(accounts);
    } else {
      message.error('删除账户失败');
    }
  };

  // 登出
  const handleLogout = async () => {
    try {
      const success = await xhsLoginService.logout();
      if (success) {
        message.success('登出成功');
      } else {
        message.error('登出失败');
      }
    } catch (error) {
      message.error('登出失败');
    }
  };

  // 刷新登录状态
  const handleRefresh = async () => {
    try {
      setIsLoggingIn(true);
      const result = await xhsLoginService.refreshLoginStatus();
      if (result.success) {
        message.success('状态刷新成功');
      } else {
        message.info(result.message);
      }
    } catch (error) {
      message.error('刷新状态失败');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 导出账户数据
  const handleExport = () => {
    try {
      const data = xhsLoginService.exportAccountData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xhs_accounts_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('账户数据导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 账户表格列配置
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (record: XHSAccount) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />} 
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: 16 }}>
              {record.nickname || '未知用户'}
            </div>
            <div style={{ color: '#86868B', fontSize: 14 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '登录方式',
      dataIndex: 'loginMethod',
      key: 'loginMethod',
      render: (method: LoginMethod) => {
        const methodConfig = {
          [LoginMethod.COOKIE]: { color: 'blue', text: 'Cookie' },
          [LoginMethod.SMS]: { color: 'green', text: '短信验证码' },
          [LoginMethod.QRCODE]: { color: 'purple', text: '二维码' }
        };
        const config = methodConfig[method];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (record: XHSAccount) => (
        <Space>
          <Badge 
            status={record.isActive ? 'success' : 'default'} 
            text={record.isActive ? '当前账户' : '备用账户'} 
          />
          {record.isActive && getStatusTag(loginStatus)}
        </Space>
      )
    },
    {
      title: '最后登录',
      key: 'lastLogin',
      render: (record: XHSAccount) => (
        <div>
          <div>{new Date(record.lastLoginTime).toLocaleDateString()}</div>
          <div style={{ color: '#86868B', fontSize: 12 }}>
            登录次数: {record.loginCount}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: XHSAccount) => (
        <Space>
          {!record.isActive && (
            <Tooltip title="切换到此账户">
              <Button
                size="small"
                icon={<LoginOutlined />}
                onClick={() => handleSwitchAccount(record.id)}
                loading={isLoggingIn}
                className="apple-button-secondary"
              />
            </Tooltip>
          )}
          
          <Popconfirm
            title="确定删除此账户吗？"
            description="删除后将无法恢复账户信息"
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除账户">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                className="apple-button-secondary"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 当前登录状态卡片 */}
      <Card className="apple-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {loginStatus === LoginStatus.LOGGED_IN ? (
              <WifiOutlined style={{ fontSize: 24, color: '#34C759', marginRight: 16 }} />
            ) : (
              <DisconnectOutlined style={{ fontSize: 24, color: '#FF3B30', marginRight: 16 }} />
            )}
            
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                小红书账户状态
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                {getStatusTag(loginStatus)}
                {currentUser && (
                  <span style={{ marginLeft: 12, color: '#86868B' }}>
                    当前用户: {currentUser.nickname}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Space>
            <Tooltip title="刷新登录状态">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoggingIn}
                className="apple-button-secondary"
              />
            </Tooltip>

            {loginStatus === LoginStatus.LOGGED_IN ? (
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="apple-button-secondary"
              >
                登出
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => setIsLoginModalVisible(true)}
                loading={isLoggingIn}
                className="apple-button-primary"
              >
                登录小红书
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 账户管理卡片 */}
      <Card 
        className="apple-card"
        title="账户管理"
        extra={
          <Space>
            <Tooltip title="导出账户数据">
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                className="apple-button-secondary"
              />
            </Tooltip>
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsLoginModalVisible(true)}
              className="apple-button-primary"
            >
              添加账户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={allAccounts}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无账户，请先登录' }}
        />
      </Card>

      {/* 登录弹窗 */}
      <Modal
        title="小红书账户登录"
        open={isLoginModalVisible}
        onCancel={() => {
          setIsLoginModalVisible(false);
          loginForm.resetFields();
          setIsCodeSent(false);
          setCountdown(0);
        }}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: '#1D1D1F', marginRight: 8 }}>
              智能登录
            </span>
            <Switch 
              checked={autoLogin}
              onChange={setAutoLogin}
              size="small"
            />
            <span style={{ fontSize: 12, color: '#86868B', marginLeft: 8 }}>
              {autoLogin ? '优先使用Cookie自动登录' : '仅使用验证码登录'}
            </span>
          </div>
        </div>

        <Form
          form={loginForm}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
            ]}
          >
            <Input
              className="apple-input"
              placeholder="请输入11位手机号"
              prefix={<PhoneOutlined />}
            />
          </Form.Item>

          {!autoLogin && (
            <Form.Item
              label="验证码"
              name="code"
              rules={[
                { required: true, message: '请输入验证码' },
                { len: 6, message: '验证码为6位数字' }
              ]}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <Input
                  className="apple-input"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="apple-button-secondary"
                  style={{ minWidth: 100 }}
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </div>
            </Form.Item>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button
              onClick={() => {
                setIsLoginModalVisible(false);
                loginForm.resetFields();
                setIsCodeSent(false);
                setCountdown(0);
              }}
              className="apple-button-secondary"
              style={{ flex: 1 }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoggingIn}
              className="apple-button-primary"
              style={{ flex: 1 }}
            >
              {autoLogin ? '智能登录' : '验证码登录'}
            </Button>
          </div>
        </Form>

        {autoLogin && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#F8F9FA', 
            borderRadius: 8,
            fontSize: 13,
            color: '#86868B',
            lineHeight: 1.5
          }}>
            <div>智能登录说明：</div>
            <div>1. 优先使用已保存的Cookie自动登录</div>
            <div>2. Cookie失效时自动切换到验证码登录</div>
            <div>3. 首次登录需要手动输入验证码</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default XHSAccountManager;