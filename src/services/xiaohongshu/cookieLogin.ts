import { 
  XHS_CONFIG, 
  LoginStatus, 
  LoginMethod, 
  LoginResult, 
  XHSAccount, 
  CookieManager, 
  AntiDetection, 
  Logger 
} from './config';
import { LoginChecker } from './loginChecker';
import { v4 as uuidv4 } from 'uuid';

export class CookieLoginService {
  private iframe: HTMLIFrameElement | null = null;
  private loginPromise: Promise<LoginResult> | null = null;

  constructor() {
    this.initializeIframe();
  }

  // 初始化隐藏的iframe用于登录操作
  private initializeIframe(): void {
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.style.width = '0px';
    this.iframe.style.height = '0px';
    this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
    document.body.appendChild(this.iframe);
  }

  // Cookie自动登录
  async loginWithCookie(accountId?: string): Promise<LoginResult> {
    if (this.loginPromise) {
      Logger.warn('登录进程已在进行中');
      return this.loginPromise;
    }

    this.loginPromise = this._performCookieLogin(accountId);
    const result = await this.loginPromise;
    this.loginPromise = null;
    return result;
  }

  private async _performCookieLogin(accountId?: string): Promise<LoginResult> {
    try {
      Logger.info('开始Cookie自动登录', { accountId });

      // 获取要登录的账户
      let account: XHSAccount | null = null;
      if (accountId) {
        account = CookieManager.getAccount(accountId);
      } else {
        account = CookieManager.getActiveAccount();
      }

      if (!account || !account.cookies) {
        Logger.warn('未找到有效的Cookie信息');
        return {
          success: false,
          status: LoginStatus.LOGIN_FAILED,
          message: '未找到有效的登录凭证'
        };
      }

      // 验证Cookie是否有效
      const isValidCookie = await this.validateCookie(account.cookies);
      if (!isValidCookie) {
        Logger.warn('Cookie已失效', { accountId: account.id });
        return {
          success: false,
          status: LoginStatus.SESSION_EXPIRED,
          message: 'Cookie已失效，请重新登录'
        };
      }

      // 应用Cookie到当前会话
      await this.applyCookie(account.cookies);

      // 验证登录状态
      const loginStatus = await this.checkLoginStatus();
      if (loginStatus.isLoggedIn) {
        // 更新账户信息
        account.lastLoginTime = new Date();
        account.loginCount += 1;
        account.isActive = true;
        CookieManager.saveAccount(account);

        Logger.info('Cookie自动登录成功', { 
          accountId: account.id, 
          nickname: account.nickname 
        });

        return {
          success: true,
          status: LoginStatus.LOGGED_IN,
          message: '登录成功',
          account: account
        };
      } else {
        Logger.error('Cookie登录验证失败');
        return {
          success: false,
          status: LoginStatus.LOGIN_FAILED,
          message: '登录验证失败'
        };
      }

    } catch (error) {
      Logger.error('Cookie登录过程出错', error);
      return {
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '登录过程出现错误',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 验证Cookie是否有效
  private async validateCookie(cookieString: string): Promise<boolean> {
    try {
      // 临时设置Cookie进行验证
      const originalCookies = document.cookie;
      
      // 解析并设置Cookie
      const cookies = this.parseCookieString(cookieString);
      for (const cookie of cookies) {
        document.cookie = `${cookie.name}=${cookie.value}; domain=.xiaohongshu.com; path=/`;
      }

      // 使用LoginChecker验证登录状态
      const result = await LoginChecker.checkLoginStatus();
      
      // 恢复原始Cookie
      // 清除测试Cookie
      for (const cookie of cookies) {
        document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.xiaohongshu.com`;
      }
      
      // 恢复原始Cookie
      if (originalCookies) {
        const originalCookieList = originalCookies.split(';');
        for (const cookie of originalCookieList) {
          document.cookie = cookie.trim();
        }
      }

      Logger.info('Cookie验证结果', { isValid: result.isLoggedIn });
      return result.isLoggedIn;

    } catch (error) {
      Logger.error('Cookie验证失败', error);
      return false;
    }
  }

  // 应用Cookie到当前域名
  private async applyCookie(cookieString: string): Promise<void> {
    try {
      const cookies = this.parseCookieString(cookieString);
      
      for (const cookie of cookies) {
        // 构造Cookie字符串
        let cookieValue = `${cookie.name}=${cookie.value}`;
        
        if (cookie.path) {
          cookieValue += `; path=${cookie.path}`;
        }
        if (cookie.domain) {
          cookieValue += `; domain=${cookie.domain}`;
        }
        if (cookie.expires) {
          cookieValue += `; expires=${cookie.expires}`;
        }
        if (cookie.secure) {
          cookieValue += '; secure';
        }
        if (cookie.httpOnly) {
          cookieValue += '; httpOnly';
        }

        // 设置Cookie
        document.cookie = cookieValue;
      }

      Logger.info('Cookie应用完成');
      await AntiDetection.randomDelay(500, 1000);

    } catch (error) {
      Logger.error('应用Cookie失败', error);
      throw error;
    }
  }

  // 检查当前登录状态
  private async checkLoginStatus(): Promise<{ isLoggedIn: boolean; userInfo?: any }> {
    try {
      // 使用新的LoginChecker
      const result = await LoginChecker.checkLoginStatus();
      return {
        isLoggedIn: result.isLoggedIn,
        userInfo: result.userInfo
      };
    } catch (error) {
      Logger.error('检查登录状态失败', error);
      return { isLoggedIn: false };
    }
  }

  // 解析Cookie字符串
  private parseCookieString(cookieString: string): Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
    secure?: boolean;
    httpOnly?: boolean;
  }> {
    const cookies: Array<any> = [];
    
    try {
      // 分割Cookie字符串
      const cookiePairs = cookieString.split(';');
      
      for (const pair of cookiePairs) {
        const trimmedPair = pair.trim();
        if (!trimmedPair) continue;

        const [name, ...valueParts] = trimmedPair.split('=');
        const value = valueParts.join('=');

        if (name && value) {
          cookies.push({
            name: name.trim(),
            value: value.trim(),
            domain: '.xiaohongshu.com',
            path: '/',
            secure: true
          });
        }
      }

      return cookies;
    } catch (error) {
      Logger.error('解析Cookie字符串失败', error);
      return [];
    }
  }

  // 获取当前页面的所有Cookie
  getCurrentCookies(): string {
    return document.cookie;
  }

  // 保存当前登录状态的Cookie
  async saveCurrentLoginCookie(account: Partial<XHSAccount>): Promise<XHSAccount> {
    try {
      const currentCookies = this.getCurrentCookies();
      const loginStatus = await this.checkLoginStatus();

      if (!loginStatus.isLoggedIn || !currentCookies) {
        throw new Error('当前未处于登录状态或Cookie为空');
      }

      const accountData: XHSAccount = {
        id: account.id || uuidv4(),
        username: account.username || '',
        phone: account.phone || '',
        nickname: loginStatus.userInfo?.nickname || account.nickname || '未知用户',
        avatar: loginStatus.userInfo?.avatar || account.avatar || '',
        cookies: currentCookies,
        loginMethod: LoginMethod.COOKIE,
        lastLoginTime: new Date(),
        isActive: true,
        loginCount: (account.loginCount || 0) + 1
      };

      // 保存到本地存储
      CookieManager.saveAccount(accountData);
      Logger.info('Cookie保存成功', { accountId: accountData.id });

      return accountData;

    } catch (error) {
      Logger.error('保存Cookie失败', error);
      throw error;
    }
  }

  // 清理登录状态
  async logout(): Promise<boolean> {
    try {
      // 清除Cookie
      const cookiesToClear = [
        'web_session', 'webId', 'websectiga', 'webBuild', 
        'gid', 'a1', 'webBuild', 'b1'
      ];

      for (const cookieName of cookiesToClear) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.xiaohongshu.com`;
      }

      // 设置账户为非活跃状态
      const activeAccount = CookieManager.getActiveAccount();
      if (activeAccount) {
        activeAccount.isActive = false;
        CookieManager.saveAccount(activeAccount);
      }

      Logger.info('登出成功');
      return true;

    } catch (error) {
      Logger.error('登出失败', error);
      return false;
    }
  }

  // 清理资源
  destroy(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
    this.loginPromise = null;
  }
}