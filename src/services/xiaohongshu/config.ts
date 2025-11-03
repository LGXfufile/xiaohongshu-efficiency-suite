import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// 小红书登录配置
export const XHS_CONFIG = {
  BASE_URL: 'https://www.xiaohongshu.com',
  LOGIN_URL: 'https://creator.xiaohongshu.com/login',
  API_BASE: 'https://edith.xiaohongshu.com',
  CREATOR_BASE: 'https://creator.xiaohongshu.com',
  
  // 页面选择器 - 使用更通用的选择器
  SELECTORS: {
    USERNAME_INPUT: 'input[placeholder*="手机号"], input[type="tel"], input[name="phone"], .phone-input',
    CODE_INPUT: 'input[placeholder*="验证码"], input[name="verifyCode"], .verify-code-input',
    LOGIN_BUTTON: 'button[type="submit"], .login-btn, .submit-btn, button:contains("登录")',
    SEND_CODE_BUTTON: '.send-code-btn, button:contains("发送验证码"), .verify-btn',
    NAME_BOX: '.name-box, .username, .nickname, .user-name',
    USER_AVATAR: '.user-avatar, .avatar, .user-photo, .profile-avatar',
    PROFILE_MENU: '.profile-menu, .user-menu, .dropdown-menu',
    LOGGED_IN_INDICATOR: '.user-info, .profile, .avatar, .user-avatar, [data-testid="user-info"]'
  },
  
  // 验证登录状态的URL
  CHECK_LOGIN_URLS: [
    'https://creator.xiaohongshu.com/api/sns/web/v1/user/me',
    'https://www.xiaohongshu.com/api/sns/web/v1/user/me',
    'https://edith.xiaohongshu.com/api/sns/web/v1/user/me'
  ],
  
  // 反检测配置
  ANTI_DETECTION: {
    MIN_DELAY: 1000,
    MAX_DELAY: 3000,
    TYPING_SPEED: { min: 50, max: 150 },
    MOUSE_MOVE_STEPS: 10
  }
};

// 用户代理池
export const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

// 登录状态枚举
export enum LoginStatus {
  NOT_LOGGED_IN = 'not_logged_in',
  LOGGING_IN = 'logging_in',
  LOGGED_IN = 'logged_in',
  LOGIN_FAILED = 'login_failed',
  SESSION_EXPIRED = 'session_expired'
}

// 登录方式枚举
export enum LoginMethod {
  COOKIE = 'cookie',
  SMS = 'sms',
  QRCODE = 'qrcode'
}

// 用户账户信息接口
export interface XHSAccount {
  id: string;
  username: string;
  phone: string;
  nickname: string;
  avatar: string;
  cookies: string;
  loginMethod: LoginMethod;
  lastLoginTime: Date;
  isActive: boolean;
  loginCount: number;
}

// 登录结果接口
export interface LoginResult {
  success: boolean;
  status: LoginStatus;
  message: string;
  account?: XHSAccount;
  error?: string;
}

// Cookie管理类
export class CookieManager {
  private static readonly STORAGE_KEY = 'xhs_accounts';
  private static readonly ENCRYPTION_KEY = 'xhs_crypto_key_2024';

  // 加密数据
  static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  // 解密数据
  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('解密失败:', error);
      return '';
    }
  }

  // 保存账户信息
  static saveAccount(account: XHSAccount): void {
    try {
      const accounts = this.getAllAccounts();
      const existingIndex = accounts.findIndex(acc => acc.id === account.id);
      
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      
      const encryptedData = this.encrypt(JSON.stringify(accounts));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('保存账户失败:', error);
    }
  }

  // 获取所有账户
  static getAllAccounts(): XHSAccount[] {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) return [];
      
      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) return [];
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('获取账户失败:', error);
      return [];
    }
  }

  // 获取指定账户
  static getAccount(accountId: string): XHSAccount | null {
    const accounts = this.getAllAccounts();
    return accounts.find(acc => acc.id === accountId) || null;
  }

  // 删除账户
  static deleteAccount(accountId: string): boolean {
    try {
      const accounts = this.getAllAccounts();
      const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
      
      const encryptedData = this.encrypt(JSON.stringify(filteredAccounts));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      return true;
    } catch (error) {
      console.error('删除账户失败:', error);
      return false;
    }
  }

  // 设置活跃账户
  static setActiveAccount(accountId: string): boolean {
    try {
      const accounts = this.getAllAccounts();
      accounts.forEach(acc => {
        acc.isActive = acc.id === accountId;
      });
      
      const encryptedData = this.encrypt(JSON.stringify(accounts));
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      return true;
    } catch (error) {
      console.error('设置活跃账户失败:', error);
      return false;
    }
  }

  // 获取活跃账户
  static getActiveAccount(): XHSAccount | null {
    const accounts = this.getAllAccounts();
    return accounts.find(acc => acc.isActive) || null;
  }
}

// 反检测工具类
export class AntiDetection {
  // 随机延迟
  static async randomDelay(min: number = XHS_CONFIG.ANTI_DETECTION.MIN_DELAY, max: number = XHS_CONFIG.ANTI_DETECTION.MAX_DELAY): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 模拟人类打字
  static async simulateTyping(element: HTMLInputElement, text: string): Promise<void> {
    element.focus();
    element.value = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      element.value += char;
      
      // 触发输入事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 随机打字速度
      const typingDelay = Math.floor(Math.random() * 
        (XHS_CONFIG.ANTI_DETECTION.TYPING_SPEED.max - XHS_CONFIG.ANTI_DETECTION.TYPING_SPEED.min + 1)) + 
        XHS_CONFIG.ANTI_DETECTION.TYPING_SPEED.min;
      
      await new Promise(resolve => setTimeout(resolve, typingDelay));
    }
  }

  // 模拟鼠标移动到元素
  static async simulateMouseMove(element: HTMLElement): Promise<void> {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 模拟鼠标移动事件
    const mouseMoveEvent = new MouseEvent('mouseover', {
      bubbles: true,
      clientX: centerX,
      clientY: centerY
    });
    
    element.dispatchEvent(mouseMoveEvent);
    await this.randomDelay(100, 300);
  }

  // 获取随机User-Agent
  static getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  // 生成随机设备指纹
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint: ' + Date.now(), 2, 2);
    }
    return canvas.toDataURL();
  }
}

// 日志记录类
export class Logger {
  private static logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
  }> = [];

  static info(message: string, data?: any): void {
    const log = {
      timestamp: new Date(),
      level: 'info' as const,
      message,
      data
    };
    this.logs.push(log);
    console.log(`[XHS-LOGIN] ${message}`, data || '');
  }

  static warn(message: string, data?: any): void {
    const log = {
      timestamp: new Date(),
      level: 'warn' as const,
      message,
      data
    };
    this.logs.push(log);
    console.warn(`[XHS-LOGIN] ${message}`, data || '');
  }

  static error(message: string, data?: any): void {
    const log = {
      timestamp: new Date(),
      level: 'error' as const,
      message,
      data
    };
    this.logs.push(log);
    console.error(`[XHS-LOGIN] ${message}`, data || '');
  }

  static getLogs(): typeof this.logs {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}