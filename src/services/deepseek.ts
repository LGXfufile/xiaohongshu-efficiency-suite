import axios from 'axios'

const DEEPSEEK_API_KEY = 'sk-71cc3aad8fad44c8970dd549933d3573'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'

const deepseekClient = axios.create({
  baseURL: DEEPSEEK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface GenerateTitlesRequest {
  topic: string
  count?: number
  style?: 'popular' | 'professional' | 'casual'
}

export interface GenerateContentRequest {
  title: string
  keywords?: string[]
  length?: 'short' | 'medium' | 'long'
}

// 生成小红书标题
export const generateTitles = async ({ topic, count = 10, style = 'popular' }: GenerateTitlesRequest): Promise<string[]> => {
  try {
    const prompt = `作为小红书内容专家，请为主题"${topic}"生成${count}个爆款标题。要求：
1. 符合小红书调性，口语化表达
2. 包含热门关键词和emoji
3. 风格：${style === 'popular' ? '热门爆款' : style === 'professional' ? '专业权威' : '轻松随意'}
4. 每个标题控制在20字以内
5. 直接返回标题列表，不要额外说明

请生成${count}个标题：`

    const response = await deepseekClient.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8
    })

    const content = response.data.choices[0].message.content
    return content.split('\n').filter((title: string) => title.trim()).slice(0, count)
  } catch (error) {
    console.error('生成标题失败:', error)
    // 返回模拟数据作为后备
    return [
      `🔥 ${topic}新手必看攻略！`,
      `✨ ${topic}的10个实用技巧`,
      `💡 关于${topic}你不知道的秘密`,
      `🎯 ${topic}完全指南2024版`,
      `⚡ ${topic}快速入门教程`,
      `🌟 ${topic}深度解析分享`,
      `💎 ${topic}高级技巧大公开`,
      `🚀 ${topic}从零到精通路线`,
      `📈 ${topic}最新趋势解读`,
      `🎨 ${topic}创新玩法推荐`
    ]
  }
}

// 生成小红书正文内容
export const generateContent = async ({ title, keywords = [], length = 'medium' }: GenerateContentRequest): Promise<string> => {
  try {
    const keywordText = keywords.length > 0 ? `关键词：${keywords.join('、')}` : ''
    const lengthMap = {
      short: '200-300字',
      medium: '400-600字', 
      long: '800-1000字'
    }

    const prompt = `请为小红书标题"${title}"生成一篇${lengthMap[length]}的正文内容。${keywordText}

要求：
1. 口语化表达，贴近用户
2. 结构清晰，有小标题和分点
3. 适当使用emoji增加趣味性
4. 包含实用信息和个人感受
5. 结尾要有互动性问题
6. 符合小红书社区氛围

请生成内容：`

    const response = await deepseekClient.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('生成内容失败:', error)
    // 返回模拟内容作为后备
    return `✨ ${title}

大家好！今天想和大家分享一下关于这个话题的一些心得～

🌟 主要要点：
• 重点一：详细说明...
• 重点二：实用技巧...
• 重点三：注意事项...

💡 个人体验：
经过亲身实践，我发现...这个方法真的很有效！

🎯 小贴士：
记住这几个关键点，你也能轻松掌握～

你们有什么想法或者经验吗？欢迎在评论区分享哦！

#实用攻略 #生活分享 #干货推荐`
  }
}

// 生成数据分析报告
export const generateAnalysisReport = async (data: any): Promise<string> => {
  try {
    const prompt = `作为数据分析专家，请基于以下小红书账号数据生成分析报告：
曝光量：${data.impressions}
点击率：${data.clicks}%
互动率：${data.engagement}%
粉丝增长：${data.followers}

请生成一份专业且易懂的分析报告，包含：
1. 数据表现总结
2. 优势分析
3. 改进建议
语气要专业但友好，像顾问在汇报。`

    const response = await deepseekClient.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.6
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('生成分析报告失败:', error)
    return '数据分析报告生成中，请稍后重试...'
  }
}