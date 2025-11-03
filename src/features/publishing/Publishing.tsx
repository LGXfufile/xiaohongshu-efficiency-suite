import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Switch, DatePicker, TimePicker, Input, Select, message, Tag, Modal, Alert } from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined,
  EditOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '../../store';
import { LoginStatus } from '../../services/xiaohongshu/config';
import XHSAccountManager from '../../components/login/XHSAccountManager';

const { TextArea } = Input;
const { Option } = Select;

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'failed';
  platform: 'xiaohongshu';
  type: 'image' | 'video';
}

const Publishing: React.FC = () => {
  const { loginStatus, currentUser } = useAppStore();
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: '1',
      title: '秋冬护肤小贴士✨',
      content: '秋冬季节皮肤容易干燥，今天分享几个超实用的护肤技巧...',
      scheduledTime: '2024-11-04 14:30',
      status: 'scheduled',
      platform: 'xiaohongshu',
      type: 'image'
    },
    {
      id: '2', 
      title: '简约穿搭法则📱',
      content: '分享几个简约穿搭的黄金法则，让你轻松get高级感...',
      scheduledTime: '2024-11-04 18:00',
      status: 'scheduled',
      platform: 'xiaohongshu',
      type: 'image'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    scheduledDate: null as any,
    scheduledTime: null as any,
    type: 'image' as 'image' | 'video'
  });
  const [autoPublish, setAutoPublish] = useState(true);

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span style={{ fontWeight: 500, color: '#1D1D1F' }}>{text}</span>
      )
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => (
        <span style={{ color: '#86868B' }}>
          {text.length > 30 ? `${text.substring(0, 30)}...` : text}
        </span>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (time: string) => (
        <span style={{ fontWeight: 500 }}>{time}</span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'image' ? 'blue' : 'purple'}>
          {type === 'image' ? '图文' : '视频'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          scheduled: { color: '#007AFF', text: '待发布' },
          published: { color: '#34C759', text: '已发布' },
          failed: { color: '#FF3B30', text: '发布失败' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} style={{ color: 'white', border: 'none' }}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (record: ScheduledPost) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            className="apple-button-secondary"
            style={{ padding: '4px 8px', height: 'auto' }}
          />
          <Button 
            size="small" 
            icon={<DeleteOutlined />}
            className="apple-button-secondary"
            style={{ padding: '4px 8px', height: 'auto' }}
            onClick={() => handleDeletePost(record.id)}
          />
        </div>
      )
    }
  ];

  const handleAddPost = () => {
    if (!newPost.title || !newPost.content || !newPost.scheduledDate || !newPost.scheduledTime) {
      message.warning('请填写完整信息');
      return;
    }

    const scheduledDateTime = dayjs(newPost.scheduledDate)
      .hour(dayjs(newPost.scheduledTime).hour())
      .minute(dayjs(newPost.scheduledTime).minute())
      .format('YYYY-MM-DD HH:mm');

    const post: ScheduledPost = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      scheduledTime: scheduledDateTime,
      status: 'scheduled',
      platform: 'xiaohongshu',
      type: newPost.type
    };

    setScheduledPosts([...scheduledPosts, post]);
    setIsModalVisible(false);
    setNewPost({
      title: '',
      content: '',
      scheduledDate: null,
      scheduledTime: null,
      type: 'image'
    });
    message.success('定时发布任务创建成功！');
  };

  const handleDeletePost = (id: string) => {
    setScheduledPosts(scheduledPosts.filter(post => post.id !== id));
    message.success('删除成功');
  };

  const optimalTimes = [
    { time: '08:00-09:00', description: '早高峰通勤时间，用户活跃度高' },
    { time: '12:00-13:00', description: '午休时间，浏览量达到峰值' },
    { time: '18:00-20:00', description: '晚高峰期，互动率最佳' },
    { time: '21:00-22:00', description: '睡前黄金时段，停留时间长' }
  ];

  return (
    <div>
      {/* 小红书登录状态检查 */}
      {loginStatus !== LoginStatus.LOGGED_IN && (
        <Alert
          message="请先登录小红书账户"
          description="自动化发布功能需要先登录小红书账户才能使用"
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary">
              立即登录
            </Button>
          }
        />
      )}

      {/* 小红书账户管理 */}
      <div style={{ marginBottom: 24 }}>
        <XHSAccountManager />
      </div>

      {/* 自动化控制面板 */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card className="apple-card">
            <Row align="middle" justify="space-between">
              <Col>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {loginStatus === LoginStatus.LOGGED_IN ? (
                    <WifiOutlined style={{ fontSize: 24, color: '#34C759', marginRight: 12 }} />
                  ) : (
                    <PlayCircleOutlined style={{ fontSize: 24, color: '#86868B', marginRight: 12 }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>
                      自动化发布引擎
                    </h3>
                    <p style={{ margin: 0, color: '#86868B', fontSize: 14 }}>
                      {loginStatus === LoginStatus.LOGGED_IN 
                        ? `已连接到 ${currentUser?.nickname || '小红书账户'}，可以开始自动化发布`
                        : '需要登录小红书账户后才能启用自动化发布'
                      }
                    </p>
                  </div>
                </div>
              </Col>
              <Col>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: '#1D1D1F' }}>
                    自动发布
                  </span>
                  <Switch 
                    checked={autoPublish && loginStatus === LoginStatus.LOGGED_IN}
                    onChange={setAutoPublish}
                    size="default"
                    disabled={loginStatus !== LoginStatus.LOGGED_IN}
                  />
                  <Button
                    className="apple-button-primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    disabled={loginStatus !== LoginStatus.LOGGED_IN}
                  >
                    新增定时任务
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 发布队列 */}
        <Col xs={24} lg={16}>
          <Card className="apple-card" title="发布队列">
            <Table
              columns={columns}
              dataSource={scheduledPosts}
              rowKey="id"
              pagination={false}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        {/* 最佳发布时间建议 */}
        <Col xs={24} lg={8}>
          <Card className="apple-card" title="AI推荐发布时间">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {optimalTimes.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: '#F8F9FA',
                    borderRadius: 12,
                    border: '1px solid #F5F5F7'
                  }}
                >
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: '#007AFF',
                    marginBottom: 4 
                  }}>
                    {item.time}
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: '#86868B',
                    lineHeight: 1.4 
                  }}>
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
              borderRadius: 12,
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>今日推荐发布时间</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>18:30</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>预计曝光提升 25%</div>
            </div>
          </Card>
        </Col>

        {/* 发布统计 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div className="stats-card">
                <div className="stats-number">12</div>
                <div className="stats-label">待发布内容</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #34C759, #30B54A)' }}>
                <div className="stats-number">156</div>
                <div className="stats-label">本月已发布</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #FF9500, #FFAD33)' }}>
                <div className="stats-number">98.5%</div>
                <div className="stats-label">发布成功率</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #AF52DE, #C77DFF)' }}>
                <div className="stats-number">2.3小时</div>
                <div className="stats-label">平均节省时间</div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 新增定时任务弹窗 */}
      <Modal
        title="新增定时发布任务"
        open={isModalVisible}
        onOk={handleAddPost}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleAddPost}>
            创建任务
          </Button>
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              标题
            </label>
            <Input
              className="apple-input"
              placeholder="输入内容标题"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              内容
            </label>
            <TextArea
              className="apple-textarea"
              placeholder="输入小红书内容"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={4}
            />
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                发布日期
              </label>
              <DatePicker
                className="apple-input"
                style={{ width: '100%' }}
                value={newPost.scheduledDate}
                onChange={(date) => setNewPost({ ...newPost, scheduledDate: date })}
              />
            </Col>
            <Col span={12}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                发布时间
              </label>
              <TimePicker
                className="apple-input"
                style={{ width: '100%' }}
                format="HH:mm"
                value={newPost.scheduledTime}
                onChange={(time) => setNewPost({ ...newPost, scheduledTime: time })}
              />
            </Col>
          </Row>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              内容类型
            </label>
            <Select
              className="apple-input"
              style={{ width: '100%' }}
              value={newPost.type}
              onChange={(value) => setNewPost({ ...newPost, type: value })}
            >
              <Option value="image">图文</Option>
              <Option value="video">视频</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Publishing;