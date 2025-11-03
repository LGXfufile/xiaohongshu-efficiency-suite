import React, { useState } from 'react';
import { Row, Col, Input, Button, Card, Select, Tag, message, Spin } from 'antd';
import { CopyOutlined, CheckOutlined, BulbOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { generateTitles, generateContent } from '../../services/deepseek';

const { TextArea } = Input;
const { Option } = Select;

const CreationWorkshop: React.FC = () => {
  const {
    currentTopic,
    generatedContent,
    isGenerating,
    setCurrentTopic,
    addGeneratedContent,
    toggleContentAdoption,
    setIsGenerating
  } = useAppStore();

  const [selectedStyle, setSelectedStyle] = useState<'popular' | 'professional' | 'casual'>('popular');
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [keywords, setKeywords] = useState<string>('');

  const handleGenerateTitles = async () => {
    if (!currentTopic.trim()) {
      message.warning('请输入内容主题');
      return;
    }

    setIsGenerating(true);
    try {
      const titles = await generateTitles({
        topic: currentTopic,
        count: 10,
        style: selectedStyle
      });

      titles.forEach((title, index) => {
        addGeneratedContent({
          id: `title-${Date.now()}-${index}`,
          type: 'title',
          text: title,
          createdAt: new Date(),
          adopted: false
        });
      });

      message.success('标题生成成功！');
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateContent = async () => {
    const adoptedTitles = generatedContent.filter(item => item.type === 'title' && item.adopted);
    
    if (adoptedTitles.length === 0) {
      message.warning('请先采纳一个标题');
      return;
    }

    setIsGenerating(true);
    try {
      const title = adoptedTitles[0].text!;
      const keywordList = keywords.split('，').filter(k => k.trim());
      
      const content = await generateContent({
        title,
        keywords: keywordList,
        length: contentLength
      });

      addGeneratedContent({
        id: `content-${Date.now()}`,
        type: 'content',
        text: content,
        createdAt: new Date(),
        adopted: false
      });

      message.success('内容生成成功！');
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const titleItems = generatedContent.filter(item => item.type === 'title');
  const contentItems = generatedContent.filter(item => item.type === 'content');

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* 输入区域 */}
        <Col span={8}>
          <Card className="apple-card" title="AI创作参数">
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                内容主题
              </label>
              <TextArea
                className="apple-textarea"
                placeholder="输入你要创作的主题，例如：护肤技巧、减肥方法、旅行攻略..."
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                内容风格
              </label>
              <Select
                className="apple-input"
                style={{ width: '100%' }}
                value={selectedStyle}
                onChange={setSelectedStyle}
              >
                <Option value="popular">热门爆款</Option>
                <Option value="professional">专业权威</Option>
                <Option value="casual">轻松随意</Option>
              </Select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                关键词（用逗号分隔）
              </label>
              <Input
                className="apple-input"
                placeholder="例如：美白，保湿，性价比"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                内容长度
              </label>
              <Select
                className="apple-input"
                style={{ width: '100%' }}
                value={contentLength}
                onChange={setContentLength}
              >
                <Option value="short">简短 (200-300字)</Option>
                <Option value="medium">中等 (400-600字)</Option>
                <Option value="long">详细 (800-1000字)</Option>
              </Select>
            </div>

            <Button
              className="apple-button-primary"
              style={{ width: '100%', marginBottom: 12 }}
              icon={<BulbOutlined />}
              onClick={handleGenerateTitles}
              loading={isGenerating}
            >
              生成爆款标题
            </Button>

            <Button
              className="apple-button-secondary"
              style={{ width: '100%' }}
              icon={<FileTextOutlined />}
              onClick={handleGenerateContent}
              loading={isGenerating}
              disabled={titleItems.filter(item => item.adopted).length === 0}
            >
              生成小红书正文
            </Button>
          </Card>
        </Col>

        {/* 标题展示区域 */}
        <Col span={8}>
          <Card className="apple-card" title="AI生成标题">
            {isGenerating && titleItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: '#86868B' }}>AI正在生成创意标题...</p>
              </div>
            ) : titleItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#86868B' }}>
                输入主题后点击"生成爆款标题"开始创作
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {titleItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 16,
                      border: '2px solid',
                      borderColor: item.adopted ? '#007AFF' : '#F5F5F7',
                      borderRadius: 12,
                      marginBottom: 12,
                      background: item.adopted ? '#F0F8FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => toggleContentAdoption(item.id)}
                  >
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 500, 
                      marginBottom: 8,
                      color: '#1D1D1F'
                    }}>
                      {item.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={item.adopted ? 'blue' : 'default'}>
                        {item.adopted ? <CheckOutlined /> : `#${index + 1}`}
                      </Tag>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.text!);
                        }}
                        className="apple-button-secondary"
                        style={{ padding: '4px 8px', height: 'auto' }}
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* 内容展示区域 */}
        <Col span={8}>
          <Card className="apple-card" title="小红书正文">
            {isGenerating && contentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: '#86868B' }}>AI正在创作精彩内容...</p>
              </div>
            ) : contentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#86868B' }}>
                先采纳一个标题，然后点击"生成小红书正文"
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 20,
                      border: '2px solid',
                      borderColor: item.adopted ? '#007AFF' : '#F5F5F7',
                      borderRadius: 12,
                      marginBottom: 16,
                      background: item.adopted ? '#F0F8FF' : '#FFFFFF',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleContentAdoption(item.id)}
                  >
                    <div style={{ 
                      fontSize: 15, 
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      color: '#1D1D1F',
                      marginBottom: 12
                    }}>
                      {item.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={item.adopted ? 'blue' : 'default'}>
                        {item.adopted ? <CheckOutlined /> : '点击采纳'}
                      </Tag>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.text!);
                        }}
                        className="apple-button-secondary"
                        style={{ padding: '4px 8px', height: 'auto' }}
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreationWorkshop;