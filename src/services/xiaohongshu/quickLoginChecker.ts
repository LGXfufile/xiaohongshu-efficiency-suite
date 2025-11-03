import { LoginStatus, XHSAccount, CookieManager, Logger } from './config';
import { LoginChecker } from './loginChecker';

export class QuickLoginChecker {
  private static lastCheck: {
    timestamp: number;
    result: { isLoggedIn: boolean; userInfo?: any };
  } | null = null;
  
  private static readonly CACHE_DURATION = 10000; // 10秒缓存

  // 快速检查登录状态（有缓存）
  static async quickCheck(): Promise<{
    isLoggedIn: boolean;
    userInfo?: any;
    fromCache: boolean;
  }> {
    const now = Date.now();
    
    // 检查缓存
    if (this.lastCheck && (now - this.lastCheck.timestamp) < this.CACHE_DURATION) {
      return {
        ...this.lastCheck.result,
        fromCache: true
      };
    }

    // 执行新的检查
    try {
      // 首先快速检查Cookie存在性
      const hasCookies = this.quickCookieCheck();
      if (!hasCookies) {
        const result = { isLoggedIn: false };
        this.lastCheck = { timestamp: now, result };
        return { ...result, fromCache: false };
      }

      // 如果有Cookie，进行完整检查
      const result = await LoginChecker.checkLoginStatus();
      this.lastCheck = { timestamp: now, result };
      
      return { ...result, fromCache: false };
    } catch (error) {
      Logger.error('快速登录检查失败', error);
      const result = { isLoggedIn: false };
      this.lastCheck = { timestamp: now, result };
      return { ...result, fromCache: false };
    }
  }

  // 快速Cookie检查
  private static quickCookieCheck(): boolean {
    try {
      const cookies = document.cookie;
      const requiredCookies = ['web_session', 'webId', 'xhsuid'];
      
      return requiredCookies.some(cookieName => 
        cookies.includes(`${cookieName}=`)
      );
    } catch (error) {
      return false;
    }
  }

  // 清除缓存
  static clearCache(): void {
    this.lastCheck = null;
  }

  // 同步检查（仅基于本地存储和Cookie）
  static syncCheck(): {
    isLoggedIn: boolean;
    account?: XHSAccount;
  } {
    try {
      // 检查活跃账户
      const activeAccount = CookieManager.getActiveAccount();
      if (!activeAccount) {
        return { isLoggedIn: false };
      }

      // 快速Cookie检查
      const hasCookies = this.quickCookieCheck();
      if (!hasCookies) {
        return { isLoggedIn: false };
      }

      return {
        isLoggedIn: true,
        account: activeAccount
      };
    } catch (error) {
      Logger.error('同步登录检查失败', error);
      return { isLoggedIn: false };
    }
  }

  // 监听登录状态变化
  static watchLoginStatus(callback: (status: {
    isLoggedIn: boolean;
    userInfo?: any;
    account?: XHSAccount;
  }) => void): () => void {
    let isWatching = true;
    
    const watch = async () => {
      while (isWatching) {
        try {
          const result = await this.quickCheck();
          const activeAccount = CookieManager.getActiveAccount();
          
          callback({
            isLoggedIn: result.isLoggedIn,
            userInfo: result.userInfo,
            account: result.isLoggedIn ? activeAccount || undefined : undefined
          });
          
          // 等待5秒后再次检查
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          Logger.error('登录状态监听出错', error);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    };

    watch();

    // 返回停止监听的函数
    return () => {
      isWatching = false;
    };
  }
}