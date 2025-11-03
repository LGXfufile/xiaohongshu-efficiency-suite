import { create } from 'zustand'

export interface ContentItem {
  id: string
  type: 'title' | 'content' | 'image'
  text?: string
  imageUrl?: string
  createdAt: Date
  adopted: boolean
}

export interface AnalyticsData {
  impressions: number
  clicks: number
  engagement: number
  followers: number
  trend: 'up' | 'down' | 'stable'
}

export interface AppState {
  // AI创作工坊状态
  generatedContent: ContentItem[]
  isGenerating: boolean
  currentTopic: string
  
  // 数据军师状态
  analyticsData: AnalyticsData
  
  // 自动化引擎状态
  scheduledPosts: any[]
  
  // 操作方法
  setCurrentTopic: (topic: string) => void
  addGeneratedContent: (content: ContentItem) => void
  toggleContentAdoption: (id: string) => void
  setIsGenerating: (status: boolean) => void
  updateAnalyticsData: (data: AnalyticsData) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  generatedContent: [],
  isGenerating: false,
  currentTopic: '',
  analyticsData: {
    impressions: 0,
    clicks: 0,
    engagement: 0,
    followers: 0,
    trend: 'stable'
  },
  scheduledPosts: [],
  
  setCurrentTopic: (topic) => set({ currentTopic: topic }),
  
  addGeneratedContent: (content) => set((state) => ({
    generatedContent: [...state.generatedContent, content]
  })),
  
  toggleContentAdoption: (id) => set((state) => ({
    generatedContent: state.generatedContent.map(item =>
      item.id === id ? { ...item, adopted: !item.adopted } : item
    )
  })),
  
  setIsGenerating: (status) => set({ isGenerating: status }),
  
  updateAnalyticsData: (data) => set({ analyticsData: data })
}))