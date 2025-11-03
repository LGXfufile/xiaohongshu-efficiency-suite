import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar } from 'antd';
import { 
  EyeOutlined, 
  HeartOutlined, 
  UserAddOutlined, 
  RiseOutlined,
  ClockCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../store';

const Dashboard: React.FC = () => {
  const { analyticsData, updateAnalyticsData } = useAppStore();

  useEffect(() => {
    // 模拟数据更新
    updateAnalyticsData({
      impressions: 15420,
      clicks: 8.5,
      engagement: 12.3,
      followers: 1286,
      trend: 'up'
    });
  }, [updateAnalyticsData]);

  const todoItems = [
    { title: '发布护肤心得分享', time: '14:30', status: 'pending' },
    { title: '回复评论互动', time: '15:00', status: 'pending' },
    { title: '分析昨日数据表现', time: '16:00', status: 'completed' },
    { title: '准备明日内容选题', time: '17:00', status: 'pending' },
  ];

  const hotTopics = [
    { title: '秋冬护肤攻略', heat: 95, trend: 'up' },
    { title: '小众香水推荐', heat: 88, trend: 'up' },
    { title: '减肥健身计划', heat: 92, trend: 'stable' },
    { title: '穿搭配色技巧', heat: 85, trend: 'down' },
    { title: '居家收纳整理', heat: 78, trend: 'up' },
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: '#1D1D1F', 
          marginBottom: 8,
          letterSpacing: '-0.5px'
        }}>
          早上好！✨
        </h2>
        <p style={{ fontSize: 16, color: '#86868B', margin: 0 }}>
          今天又是充满创意的一天，让AI帮你提升内容影响力
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {/* 核心数据卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card">
            <div className="stats-number">{analyticsData.impressions.toLocaleString()}</div>
            <div className="stats-label">总曝光量</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #34C759, #30B54A)' }}>
            <div className="stats-number">{analyticsData.clicks}%</div>
            <div className="stats-label">点击率</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF6B47)' }}>
            <div className="stats-number">{analyticsData.engagement}%</div>
            <div className="stats-label">互动率</div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #AF52DE, #C77DFF)' }}>
            <div className="stats-number">{analyticsData.followers.toLocaleString()}</div>
            <div className="stats-label">粉丝数量</div>
          </div>
        </Col>

        {/* 今日工作台 */}
        <Col xs={24} lg={12}>
          <Card className="apple-card" title="今日工作台" style={{ height: 400 }}>
            <List
              itemLayout="horizontal"
              dataSource={todoItems}
              renderItem={item => (
                <List.Item
                  style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #F5F5F7'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<ClockCircleOutlined />} 
                        style={{ 
                          backgroundColor: item.status === 'completed' ? '#34C759' : '#007AFF',
                          border: 'none'
                        }}
                      />
                    }
                    title={
                      <span style={{ 
                        fontSize: 16, 
                        fontWeight: 500,
                        color: item.status === 'completed' ? '#86868B' : '#1D1D1F',
                        textDecoration: item.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {item.title}
                      </span>
                    }
                    description={
                      <span style={{ color: '#86868B', fontSize: 14 }}>
                        {item.time}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 热门话题 */}
        <Col xs={24} lg={12}>
          <Card className="apple-card" title="实时热门话题" style={{ height: 400 }}>
            <List
              itemLayout="horizontal"
              dataSource={hotTopics}
              renderItem={(item, index) => (
                <List.Item
                  style={{ 
                    padding: '16px 0',
                    borderBottom: '1px solid #F5F5F7'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: index < 3 ? '#FF2442' : '#F5F5F7',
                          color: index < 3 ? 'white' : '#86868B',
                          border: 'none',
                          fontWeight: 600
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 16, fontWeight: 500, color: '#1D1D1F' }}>
                          {item.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <FireOutlined 
                            style={{ 
                              color: '#FF2442', 
                              fontSize: 14, 
                              marginRight: 4 
                            }} 
                          />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#FF2442' }}>
                            {item.heat}
                          </span>
                        </div>
                      </div>
                    }
                    description={
                      <Progress 
                        percent={item.heat} 
                        showInfo={false} 
                        strokeColor="#FF2442"
                        trailColor="#F5F5F7"
                        size="small"
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 性能概览 */}
        <Col span={24}>
          <Card className="apple-card" title="本周表现概览">
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <EyeOutlined style={{ fontSize: 32, color: '#007AFF', marginBottom: 12 }} />
                  <Statistic
                    title="平均曝光量"
                    value={2340}
                    suffix="次/天"
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: '#1D1D1F' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <RiseOutlined style={{ color: '#34C759', marginRight: 4 }} />
                    <span style={{ color: '#34C759', fontSize: 14 }}>较上周 +15%</span>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <HeartOutlined style={{ fontSize: 32, color: '#FF3B30', marginBottom: 12 }} />
                  <Statistic
                    title="平均互动量"
                    value={156}
                    suffix="次/天"
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: '#1D1D1F' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <RiseOutlined style={{ color: '#34C759', marginRight: 4 }} />
                    <span style={{ color: '#34C759', fontSize: 14 }}>较上周 +23%</span>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <UserAddOutlined style={{ fontSize: 32, color: '#AF52DE', marginBottom: 12 }} />
                  <Statistic
                    title="平均涨粉量"
                    value={28}
                    suffix="人/天"
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: '#1D1D1F' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <RiseOutlined style={{ color: '#34C759', marginRight: 4 }} />
                    <span style={{ color: '#34C759', fontSize: 14 }}>较上周 +8%</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;