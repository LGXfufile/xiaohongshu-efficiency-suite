import { create } from 'zustand'
import { LoginStatus, XHSAccount } from '../services/xiaohongshu/config'

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
  
  // 小红书登录状态
  loginStatus: LoginStatus
  currentUser: XHSAccount | null
  allAccounts: XHSAccount[]
  isLoggingIn: boolean
  
  // 操作方法
  setCurrentTopic: (topic: string) => void
  addGeneratedContent: (content: ContentItem) => void
  toggleContentAdoption: (id: string) => void
  setIsGenerating: (status: boolean) => void
  updateAnalyticsData: (data: AnalyticsData) => void
  
  // 小红书登录方法
  setLoginStatus: (status: LoginStatus) => void
  setCurrentUser: (user: XHSAccount | null) => void
  setAllAccounts: (accounts: XHSAccount[]) => void
  setIsLoggingIn: (status: boolean) => void
  updateUserInfo: (userInfo: Partial<XHSAccount>) => void
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
  
  // 小红书登录状态初始化
  loginStatus: LoginStatus.NOT_LOGGED_IN,
  currentUser: null,
  allAccounts: [],
  isLoggingIn: false,
  
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
  
  updateAnalyticsData: (data) => set({ analyticsData: data }),
  
  // 小红书登录状态管理
  setLoginStatus: (status) => set({ loginStatus: status }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setAllAccounts: (accounts) => set({ allAccounts: accounts }),
  
  setIsLoggingIn: (status) => set({ 
    isLoggingIn: status,
    loginStatus: status ? LoginStatus.LOGGING_IN : get().loginStatus
  }),
  
  updateUserInfo: (userInfo) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...userInfo } : null,
    allAccounts: state.allAccounts.map(acc => 
      acc.id === state.currentUser?.id ? { ...acc, ...userInfo } : acc
    )
  }))
}))