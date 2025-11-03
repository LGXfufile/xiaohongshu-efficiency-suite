import React, { useState } from 'react';
import { Row, Col, Card, Button, List, Tag, Progress, message, Spin } from 'antd';
import { 
  BulbOutlined, 
  RiseOutlined, 
  EyeOutlined, 
  TeamOutlined,
  ThunderboltOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons';

interface HotTopic {
  id: string;
  title: string;
  heat: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CompetitorAnalysis {
  name: string;
  followers: string;
  avgLikes: number;
  contentType: string;
  postFrequency: string;
  strengths: string[];
}

interface ContentSuggestion {
  title: string;
  type: 'trending' | 'evergreen' | 'seasonal';
  expectedViews: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

const Strategy: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // 模拟热门话题数据
  const hotTopics: HotTopic[] = [
    {
      id: '1',
      title: '秋冬护肤保湿大作战',
      heat: 95,
      trend: 'up',
      category: '美妆护肤',
      description: '秋冬季节护肤话题持续升温，保湿、抗干燥成为关键词',
      difficulty: 'easy'
    },
    {
      id: '2',
      title: '双十一购物攻略',
      heat: 92,
      trend: 'up',
      category: '购物分享',
      description: '双十一临近，购物攻略、好物推荐需求激增',
      difficulty: 'medium'
    },
    {
      id: '3',
      title: '居家健身减脂计划',
      heat: 88,
      trend: 'stable',
      category: '健身运动',
      description: '天气转凉，居家健身内容受到关注',
      difficulty: 'hard'
    },
    {
      id: '4',
      title: '秋冬穿搭配色指南',
      heat: 85,
      trend: 'up',
      category: '穿搭时尚',
      description: '季节性穿搭内容，颜色搭配技巧需求上升',
      difficulty: 'medium'
    }
  ];

  // 竞品分析数据
  const competitors: CompetitorAnalysis[] = [
    {
      name: '美妆博主小A',
      followers: '50.2W',
      avgLikes: 1250,
      contentType: '护肤教程',
      postFrequency: '2次/天',
      strengths: ['专业性强', '互动率高', '内容垂直']
    },
    {
      name: '穿搭达人小B',
      followers: '32.8W',
      avgLikes: 890,
      contentType: '穿搭分享',
      postFrequency: '1次/天',
      strengths: ['风格独特', '图片质量高', '标签使用好']
    },
    {
      name: '生活方式小C',
      followers: '28.5W',
      avgLikes: 1080,
      contentType: '生活技巧',
      postFrequency: '3次/周',
      strengths: ['内容实用', '视频制作精良', '标题吸引']
    }
  ];

  // 内容建议
  const contentSuggestions: ContentSuggestion[] = [
    {
      title: '平价护肤品测评，学生党必看',
      type: 'trending',
      expectedViews: '8K-15K',
      difficulty: 'easy',
      tags: ['护肤', '平价', '学生党', '测评']
    },
    {
      title: '一周居家健身计划，轻松瘦5斤',
      type: 'evergreen',
      expectedViews: '12K-20K',
      difficulty: 'medium',
      tags: ['健身', '减肥', '居家', '计划']
    },
    {
      title: '双十一必买清单，这些真的值',
      type: 'seasonal',
      expectedViews: '20K-35K',
      difficulty: 'medium',
      tags: ['双十一', '购物', '好物', '推荐']
    }
  ];

  const handleGenerateStrategy = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      message.success('AI策略分析完成！');
    }, 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#34C759';
      case 'medium': return '#FF9500';
      case 'hard': return '#FF3B30';
      default: return '#86868B';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <RiseOutlined style={{ color: '#34C759' }} />;
      case 'down': return <RiseOutlined style={{ color: '#FF3B30', transform: 'rotate(180deg)' }} />;
      default: return <span style={{ color: '#86868B' }}>-</span>;
    }
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* AI策略分析按钮 */}
        <Col span={24}>
          <Card className="apple-card">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ThunderboltOutlined style={{ fontSize: 48, color: '#007AFF', marginBottom: 16 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
                AI策略大脑
              </h2>
              <p style={{ fontSize: 16, color: '#86868B', marginBottom: 24 }}>
                基于全网数据分析，为您制定最优内容策略
              </p>
              <Button
                className="apple-button-primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={handleGenerateStrategy}
                loading={isGenerating}
                style={{ padding: '12px 32px', height: 'auto', fontSize: 16 }}
              >
                生成AI策略分析
              </Button>
            </div>
          </Card>
        </Col>

        {/* 热门话题挖掘 */}
        <Col xs={24} lg={12}>
          <Card className="apple-card" title="🔥 热门话题挖掘">
            <List
              itemLayout="vertical"
              dataSource={hotTopics}
              renderItem={item => (
                <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #F5F5F7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: 16, 
                          fontWeight: 600, 
                          color: '#1D1D1F',
                          marginRight: 12
                        }}>
                          {item.title}
                        </h4>
                        {getTrendIcon(item.trend)}
                      </div>
                      
                      <p style={{ 
                        fontSize: 14, 
                        color: '#86868B', 
                        marginBottom: 12,
                        lineHeight: 1.4 
                      }}>
                        {item.description}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color="blue">{item.category}</Tag>
                        <Tag color={getDifficultyColor(item.difficulty)}>
                          {item.difficulty === 'easy' ? '容易' : 
                           item.difficulty === 'medium' ? '中等' : '困难'}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ 
                        fontSize: 20, 
                        fontWeight: 700, 
                        color: '#FF2442',
                        marginBottom: 4 
                      }}>
                        {item.heat}
                      </div>
                      <div style={{ fontSize: 12, color: '#86868B' }}>热度</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 竞品对标分析 */}
        <Col xs={24} lg={12}>
          <Card className="apple-card" title="🎯 竞品对标分析">
            <List
              itemLayout="vertical"
              dataSource={competitors}
              renderItem={item => (
                <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #F5F5F7' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>
                        {item.name}
                      </h4>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#007AFF' }}>
                          {item.followers}
                        </div>
                        <div style={{ fontSize: 12, color: '#86868B' }}>粉丝</div>
                      </div>
                    </div>
                    
                    <Row gutter={16} style={{ marginBottom: 12 }}>
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                            {item.avgLikes}
                          </div>
                          <div style={{ fontSize: 12, color: '#86868B' }}>平均点赞</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                            {item.contentType}
                          </div>
                          <div style={{ fontSize: 12, color: '#86868B' }}>内容类型</div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                            {item.postFrequency}
                          </div>
                          <div style={{ fontSize: 12, color: '#86868B' }}>发布频率</div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div>
                      <div style={{ fontSize: 13, color: '#86868B', marginBottom: 6 }}>优势特点：</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.strengths.map((strength, index) => (
                          <Tag key={index} color="green">
                            {strength}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* AI内容建议 */}
        <Col span={24}>
          <Card className="apple-card" title="💡 AI内容建议">
            <Row gutter={[24, 24]}>
              {contentSuggestions.map((suggestion, index) => (
                <Col xs={24} md={8} key={index}>
                  <div style={{
                    background: '#F8F9FA',
                    borderRadius: 16,
                    padding: 24,
                    border: '2px solid #F5F5F7',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#007AFF';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#F5F5F7';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <StarOutlined style={{ fontSize: 20, color: '#FF9500', marginRight: 8 }} />
                      <Tag color={
                        suggestion.type === 'trending' ? 'red' :
                        suggestion.type === 'seasonal' ? 'orange' : 'blue'
                      }>
                        {suggestion.type === 'trending' ? '热点' :
                         suggestion.type === 'seasonal' ? '应季' : '常青'}
                      </Tag>
                    </div>
                    
                    <h4 style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: '#1D1D1F',
                      marginBottom: 12,
                      lineHeight: 1.4
                    }}>
                      {suggestion.title}
                    </h4>
                    
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: '#86868B' }}>预期曝光</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#34C759' }}>
                          {suggestion.expectedViews}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, color: '#86868B' }}>制作难度</span>
                        <Tag color={getDifficultyColor(suggestion.difficulty)}>
                          {suggestion.difficulty === 'easy' ? '容易' : 
                           suggestion.difficulty === 'medium' ? '中等' : '困难'}
                        </Tag>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 13, color: '#86868B', marginBottom: 8 }}>推荐标签：</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {suggestion.tags.map((tag, tagIndex) => (
                          <Tag key={tagIndex}>
                            #{tag}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 策略概览统计 */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div className="stats-card">
                <div className="stats-number">24</div>
                <div className="stats-label">热门话题</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #34C759, #30B54A)' }}>
                <div className="stats-number">15</div>
                <div className="stats-label">竞品分析</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #FF9500, #FFAD33)' }}>
                <div className="stats-number">32</div>
                <div className="stats-label">内容建议</div>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="stats-card" style={{ background: 'linear-gradient(135deg, #AF52DE, #C77DFF)' }}>
                <div className="stats-number">86%</div>
                <div className="stats-label">预测准确率</div>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Strategy;