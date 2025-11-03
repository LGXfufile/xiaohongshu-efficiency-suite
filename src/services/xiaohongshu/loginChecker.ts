import { XHS_CONFIG, LoginStatus, XHSAccount, Logger } from './config';

export class LoginChecker {
  // 检查登录状态的多种方式
  static async checkLoginStatus(): Promise<{
    isLoggedIn: boolean;
    userInfo?: any;
    method: string;
  }> {
    // 方式1：通过API检查
    const apiResult = await this.checkViaAPI();
    if (apiResult.isLoggedIn) {
      return { ...apiResult, method: 'API' };
    }

    // 方式2：通过页面检查
    const pageResult = await this.checkViaPage();
    if (pageResult.isLoggedIn) {
      return { ...pageResult, method: 'PAGE' };
    }

    // 方式3：通过Cookie检查
    const cookieResult = this.checkViaCookie();
    return { ...cookieResult, method: 'COOKIE' };
  }

  // 通过API检查登录状态
  private static async checkViaAPI(): Promise<{
    isLoggedIn: boolean;
    userInfo?: any;
  }> {
    for (const url of XHS_CONFIG.CHECK_LOGIN_URLS) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': XHS_CONFIG.BASE_URL,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.data) {
            Logger.info('API检查登录状态：已登录', data.data);
            return {
              isLoggedIn: true,
              userInfo: data.data
            };
          }
        }
      } catch (error) {
        Logger.warn(`API检查失败: ${url}`, error);
      }
    }

    return { isLoggedIn: false };
  }

  // 通过页面元素检查登录状态
  private static async checkViaPage(): Promise<{
    isLoggedIn: boolean;
    userInfo?: any;
  }> {
    return new Promise((resolve) => {
      try {
        // 创建隐藏的iframe检查登录状态
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = XHS_CONFIG.CREATOR_BASE;
        
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          resolve({ isLoggedIn: false });
        }, 10000);

        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              clearTimeout(timeout);
              document.body.removeChild(iframe);
              resolve({ isLoggedIn: false });
              return;
            }

            // 检查登录指示器
            const loginIndicators = XHS_CONFIG.SELECTORS.LOGGED_IN_INDICATOR.split(', ');
            let userElement = null;
            
            for (const selector of loginIndicators) {
              userElement = iframeDoc.querySelector(selector);
              if (userElement) break;
            }

            if (userElement) {
              // 尝试提取用户信息
              const nickname = this.extractUserInfo(iframeDoc);
              
              clearTimeout(timeout);
              document.body.removeChild(iframe);
              
              Logger.info('页面检查登录状态：已登录', { nickname });
              resolve({
                isLoggedIn: true,
                userInfo: { nickname }
              });
            } else {
              clearTimeout(timeout);
              document.body.removeChild(iframe);
              resolve({ isLoggedIn: false });
            }
          } catch (error) {
            Logger.error('页面检查登录状态失败', error);
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            resolve({ isLoggedIn: false });
          }
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve({ isLoggedIn: false });
        };

        document.body.appendChild(iframe);
      } catch (error) {
        Logger.error('创建检查iframe失败', error);
        resolve({ isLoggedIn: false });
      }
    });
  }

  // 通过Cookie检查登录状态
  private static checkViaCookie(): {
    isLoggedIn: boolean;
    userInfo?: any;
  } {
    try {
      // 检查关键Cookie是否存在
      const cookies = document.cookie;
      const hasSessionCookie = cookies.includes('web_session') || 
                              cookies.includes('xhsuid') || 
                              cookies.includes('sessionid');

      if (hasSessionCookie) {
        Logger.info('Cookie检查：发现会话Cookie');
        return { isLoggedIn: true };
      }

      return { isLoggedIn: false };
    } catch (error) {
      Logger.error('Cookie检查失败', error);
      return { isLoggedIn: false };
    }
  }

  // 从页面提取用户信息
  private static extractUserInfo(doc: Document): string {
    const selectors = [
      '.username',
      '.nickname', 
      '.user-name',
      '.name-box',
      '[data-testid="username"]',
      '.profile-name'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }

    return '用户';
  }

  // 实时监控登录状态变化
  static startLoginMonitoring(callback: (status: LoginStatus, account?: XHSAccount) => void): () => void {
    let isChecking = false;
    
    const checkInterval = setInterval(async () => {
      if (isChecking) return;
      
      isChecking = true;
      try {
        const result = await this.checkLoginStatus();
        
        if (result.isLoggedIn) {
          // 构造账户信息
          const account: Partial<XHSAccount> = {
            nickname: result.userInfo?.nickname || '小红书用户',
            avatar: result.userInfo?.avatar || '',
            lastLoginTime: new Date(),
            isActive: true
          };
          
          callback(LoginStatus.LOGGED_IN, account as XHSAccount);
        } else {
          callback(LoginStatus.NOT_LOGGED_IN);
        }
      } catch (error) {
        Logger.error('登录状态监控出错', error);
        callback(LoginStatus.LOGIN_FAILED);
      } finally {
        isChecking = false;
      }
    }, 15000); // 每15秒检查一次

    // 返回停止监控的函数
    return () => {
      clearInterval(checkInterval);
    };
  }

  // 验证特定账户的登录状态
  static async validateAccountLogin(account: XHSAccount): Promise<boolean> {
    try {
      // 设置该账户的Cookie
      if (account.cookies) {
        const cookies = account.cookies.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            document.cookie = `${name}=${value}; domain=.xiaohongshu.com; path=/`;
          }
        }
      }

      // 检查登录状态
      const result = await this.checkLoginStatus();
      return result.isLoggedIn;
    } catch (error) {
      Logger.error('验证账户登录状态失败', error);
      return false;
    }
  }
}