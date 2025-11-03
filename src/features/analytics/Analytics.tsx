import React, { useState } from 'react';
import { Row, Col, Card, Button, message, Spin } from 'antd';
import { FileTextOutlined, RiseOutlined, AuditOutlined } from '@ant-design/icons';
import { generateAnalysisReport } from '../../services/deepseek';

const Analytics: React.FC = () => {
  const [analysisReport, setAnalysisReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 模拟数据
  const weeklyData = [
    { day: '周一', impressions: 1250, interactions: 85, followers: 12 },
    { day: '周二', impressions: 1420, interactions: 95, followers: 18 },
    { day: '周三', impressions: 1680, interactions: 125, followers: 25 },
    { day: '周四', impressions: 1345, interactions: 88, followers: 15 },
    { day: '周五', impressions: 2150, interactions: 165, followers: 32 },
    { day: '周六', impressions: 2850, interactions: 220, followers: 45 },
    { day: '周日', impressions: 2420, interactions: 185, followers: 38 },
  ];

  const contentTypeData = [
    { type: '护肤教程', count: 25, color: '#007AFF' },
    { type: '穿搭分享', count: 18, color: '#34C759' },
    { type: '美食推荐', count: 15, color: '#FF3B30' },
    { type: '旅行攻略', count: 12, color: '#AF52DE' },
    { type: '生活技巧', count: 8, color: '#FF9500' },
  ];

  const timeDistribution = [
    { time: '6:00', posts: 2 },
    { time: '8:00', posts: 5 },
    { time: '10:00', posts: 8 },
    { time: '12:00', posts: 12 },
    { time: '14:00', posts: 15 },
    { time: '16:00', posts: 18 },
    { time: '18:00', posts: 22 },
    { time: '20:00', posts: 25 },
    { time: '22:00', posts: 20 },
  ];

  // 曝光量趋势图配置 - 暂时移除，使用简化展示

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const mockData = {
        impressions: 12580,
        clicks: 8.5,
        engagement: 12.3,
        followers: 185
      };
      
      const report = await generateAnalysisReport(mockData);
      setAnalysisReport(report);
      message.success('AI分析报告生成成功！');
    } catch (error) {
      message.error('生成报告失败，请重试');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* 核心指标卡片 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div className="stats-card">
                <div className="stats-number">15.4K</div>
                <div className="stats-label">本周总曝光</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #34C759, #30B54A)' }}>
                <div className="stats-number">8.5%</div>
                <div className="stats-label">平均点击率</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF6B47)' }}>
                <div className="stats-number">12.3%</div>
                <div className="stats-label">互动率</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #AF52DE, #C77DFF)' }}>
                <div className="stats-number">+185</div>
                <div className="stats-label">本周新增粉丝</div>
              </div>
            </Col>
          </Row>
        </Col>

        {/* 图表区域 */}
        <Col xs={24} lg={12}>
          <Card className="apple-card" style={{ height: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 24 }}>
              7日曝光量趋势
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {weeklyData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#1D1D1F', minWidth: 40 }}>{item.day}</span>
                  <div style={{ 
                    flex: 1, 
                    height: 8, 
                    background: '#F5F5F7', 
                    borderRadius: 4, 
                    margin: '0 16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${(item.impressions / 2850) * 100}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #007AFF, #5AC8FA)',
                      borderRadius: 4
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', minWidth: 60 }}>
                    {item.impressions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="apple-card" style={{ height: 400 }}>
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 16 }}>
                内容类型分布
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
                {contentTypeData.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '8px 16px',
                    background: '#F5F5F7',
                    borderRadius: 20,
                    marginBottom: 8
                  }}>
                    <div style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: item.color,
                      marginRight: 8 
                    }} />
                    <span style={{ fontSize: 14, color: '#1D1D1F', marginRight: 8 }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: item.color }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="apple-card" style={{ height: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 24 }}>
              互动率表现
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {weeklyData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#1D1D1F', minWidth: 40 }}>{item.day}</span>
                  <div style={{ 
                    flex: 1, 
                    height: 8, 
                    background: '#F5F5F7', 
                    borderRadius: 4, 
                    margin: '0 16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${(item.interactions / 220) * 100}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #34C759, #30B54A)',
                      borderRadius: 4
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#34C759', minWidth: 40 }}>
                    {item.interactions}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="apple-card" style={{ height: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 24 }}>
              最佳发布时间
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeDistribution.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#1D1D1F', minWidth: 50 }}>{item.time}</span>
                  <div style={{ 
                    flex: 1, 
                    height: 6, 
                    background: '#F5F5F7', 
                    borderRadius: 3, 
                    margin: '0 16px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${(item.posts / 25) * 100}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #AF52DE, #C77DFF)',
                      borderRadius: 3
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#AF52DE', minWidth: 30 }}>
                    {item.posts}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* AI分析报告 */}
        <Col span={24}>
          <Card 
            className="apple-card"
            title="AI深度复盘报告"
            extra={
              <Button
                className="apple-button-primary"
                icon={<AuditOutlined />}
                onClick={handleGenerateReport}
                loading={isGeneratingReport}
              >
                生成AI分析报告
              </Button>
            }
          >
            {isGeneratingReport ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: '#86868B', fontSize: 16 }}>
                  AI正在深度分析您的数据表现...
                </p>
              </div>
            ) : analysisReport ? (
              <div style={{ 
                background: '#F8F9FA', 
                padding: 24, 
                borderRadius: 12,
                lineHeight: 1.8,
                fontSize: 16,
                color: '#1D1D1F',
                whiteSpace: 'pre-wrap'
              }}>
                {analysisReport}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 60, 
                color: '#86868B',
                fontSize: 16 
              }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>点击"生成AI分析报告"获取深度数据洞察</p>
                <p style={{ fontSize: 14 }}>AI将为您分析数据趋势、发现增长机会并提供专业建议</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;