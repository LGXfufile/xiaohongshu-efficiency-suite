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
import { CookieLoginService } from './cookieLogin';
import { SMSLoginService } from './smsLogin';
import { LoginChecker } from './loginChecker';

// 登录监控器
export class LoginMonitor {
  private checkInterval: number | null = null;
  private statusCallback: ((status: LoginStatus, account?: XHSAccount) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.startMonitoring();
  }

  // 设置状态回调
  onStatusChange(callback: (status: LoginStatus, account?: XHSAccount) => void): void {
    this.statusCallback = callback;
  }

  // 设置错误回调
  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  // 开始监控
  startMonitoring(): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(async () => {
      try {
        await this.checkLoginStatus();
      } catch (error) {
        Logger.error('登录状态监控出错', error);
        this.errorCallback?.(error instanceof Error ? error.message : '监控出错');
      }
    }, 30000); // 每30秒检查一次

    Logger.info('登录状态监控已启动');
  }

  // 停止监控
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      Logger.info('登录状态监控已停止');
    }
  }

  // 检查登录状态
  private async checkLoginStatus(): Promise<void> {
    try {
      // 使用新的LoginChecker
      const result = await LoginChecker.checkLoginStatus();
      
      if (result.isLoggedIn) {
        // 构造账户信息
        const activeAccount = CookieManager.getActiveAccount();
        if (activeAccount && result.userInfo) {
          // 更新用户信息
          activeAccount.nickname = result.userInfo.nickname || activeAccount.nickname;
          activeAccount.avatar = result.userInfo.avatar || activeAccount.avatar;
          CookieManager.saveAccount(activeAccount);
        }
        
        this.statusCallback?.(LoginStatus.LOGGED_IN, activeAccount || undefined);
      } else {
        this.statusCallback?.(LoginStatus.NOT_LOGGED_IN);
      }
    } catch (error) {
      Logger.error('登录状态检查失败', error);
      this.statusCallback?.(LoginStatus.LOGIN_FAILED);
    }
  }

  // 销毁监控器
  destroy(): void {
    this.stopMonitoring();
    this.statusCallback = null;
    this.errorCallback = null;
  }
}

// 主登录服务类
export class XHSLoginService {
  private cookieLoginService: CookieLoginService;
  private smsLoginService: SMSLoginService;
  private monitor: LoginMonitor;
  private currentStatus: LoginStatus = LoginStatus.NOT_LOGGED_IN;
  private statusListeners: ((status: LoginStatus, account?: XHSAccount) => void)[] = [];

  constructor() {
    this.cookieLoginService = new CookieLoginService();
    this.smsLoginService = new SMSLoginService();
    this.monitor = new LoginMonitor();

    this.setupMonitoring();
    this.initializeLoginState();
  }

  // 设置监控
  private setupMonitoring(): void {
    this.monitor.onStatusChange((status, account) => {
      this.currentStatus = status;
      this.notifyStatusListeners(status, account);
    });

    this.monitor.onError((error) => {
      Logger.error('登录监控错误', error);
    });
  }

  // 初始化登录状态
  private async initializeLoginState(): Promise<void> {
    try {
      Logger.info('初始化登录状态');
      
      const activeAccount = CookieManager.getActiveAccount();
      if (activeAccount) {
        const result = await this.cookieLoginService.loginWithCookie(activeAccount.id);
        if (result.success) {
          this.currentStatus = LoginStatus.LOGGED_IN;
          this.notifyStatusListeners(LoginStatus.LOGGED_IN, result.account);
          Logger.info('自动登录成功', { nickname: result.account?.nickname });
        } else {
          this.currentStatus = LoginStatus.SESSION_EXPIRED;
          this.notifyStatusListeners(LoginStatus.SESSION_EXPIRED, activeAccount);
          Logger.warn('会话已过期，需要重新登录');
        }
      } else {
        this.currentStatus = LoginStatus.NOT_LOGGED_IN;
        this.notifyStatusListeners(LoginStatus.NOT_LOGGED_IN);
        Logger.info('当前未登录');
      }
    } catch (error) {
      Logger.error('初始化登录状态失败', error);
      this.currentStatus = LoginStatus.LOGIN_FAILED;
      this.notifyStatusListeners(LoginStatus.LOGIN_FAILED);
    }
  }

  // 添加状态监听器
  onStatusChange(listener: (status: LoginStatus, account?: XHSAccount) => void): void {
    this.statusListeners.push(listener);
  }

  // 移除状态监听器
  removeStatusListener(listener: (status: LoginStatus, account?: XHSAccount) => void): void {
    const index = this.statusListeners.indexOf(listener);
    if (index > -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  // 通知状态监听器
  private notifyStatusListeners(status: LoginStatus, account?: XHSAccount): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status, account);
      } catch (error) {
        Logger.error('状态监听器执行出错', error);
      }
    });
  }

  // Cookie登录
  async loginWithCookie(accountId?: string): Promise<LoginResult> {
    Logger.info('开始Cookie登录', { accountId });
    
    this.currentStatus = LoginStatus.LOGGING_IN;
    this.notifyStatusListeners(LoginStatus.LOGGING_IN);

    const result = await this.cookieLoginService.loginWithCookie(accountId);
    
    this.currentStatus = result.status;
    this.notifyStatusListeners(result.status, result.account);

    return result;
  }

  // 手机号验证码登录
  async loginWithSMS(phone: string, code?: string): Promise<LoginResult> {
    Logger.info('开始SMS登录', { phone });
    
    this.currentStatus = LoginStatus.LOGGING_IN;
    this.notifyStatusListeners(LoginStatus.LOGGING_IN);

    const result = await this.smsLoginService.loginWithSMS(phone, code);
    
    this.currentStatus = result.status;
    this.notifyStatusListeners(result.status, result.account);

    return result;
  }

  // 发送验证码
  async sendSMSCode(phone: string): Promise<{ success: boolean; message: string }> {
    return await this.smsLoginService.sendSMSCode(phone);
  }

  // 智能登录（自动选择最佳登录方式）
  async smartLogin(phone?: string): Promise<LoginResult> {
    Logger.info('开始智能登录', { phone });

    // 1. 优先尝试Cookie登录
    const activeAccount = CookieManager.getActiveAccount();
    if (activeAccount) {
      Logger.info('尝试Cookie自动登录');
      const cookieResult = await this.loginWithCookie(activeAccount.id);
      if (cookieResult.success) {
        return cookieResult;
      }
      Logger.warn('Cookie登录失败，尝试其他方式');
    }

    // 2. 如果提供了手机号，尝试该手机号对应的账户Cookie
    if (phone) {
      const accounts = CookieManager.getAllAccounts();
      const phoneAccount = accounts.find(acc => acc.phone === phone);
      if (phoneAccount) {
        Logger.info('尝试手机号对应账户的Cookie登录');
        const result = await this.loginWithCookie(phoneAccount.id);
        if (result.success) {
          return result;
        }
      }
    }

    // 3. 如果Cookie都失败，引导用户进行SMS登录
    if (phone) {
      Logger.info('Cookie登录失败，启动SMS登录流程');
      return await this.loginWithSMS(phone);
    } else {
      return {
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '无可用的登录方式，请提供手机号进行验证码登录'
      };
    }
  }

  // 登出
  async logout(): Promise<boolean> {
    Logger.info('开始登出');

    try {
      const result = await this.cookieLoginService.logout();
      
      if (result) {
        this.currentStatus = LoginStatus.NOT_LOGGED_IN;
        this.notifyStatusListeners(LoginStatus.NOT_LOGGED_IN);
        Logger.info('登出成功');
      }

      return result;
    } catch (error) {
      Logger.error('登出失败', error);
      return false;
    }
  }

  // 获取当前登录状态
  getCurrentStatus(): LoginStatus {
    return this.currentStatus;
  }

  // 获取当前登录用户
  getCurrentUser(): XHSAccount | null {
    return CookieManager.getActiveAccount();
  }

  // 获取所有保存的账户
  getAllAccounts(): XHSAccount[] {
    return CookieManager.getAllAccounts();
  }

  // 切换账户
  async switchAccount(accountId: string): Promise<LoginResult> {
    Logger.info('切换账户', { accountId });
    
    const account = CookieManager.getAccount(accountId);
    if (!account) {
      return {
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '账户不存在'
      };
    }

    // 先登出当前账户
    await this.logout();

    // 登录新账户
    return await this.loginWithCookie(accountId);
  }

  // 删除账户
  deleteAccount(accountId: string): boolean {
    Logger.info('删除账户', { accountId });
    
    const activeAccount = CookieManager.getActiveAccount();
    if (activeAccount && activeAccount.id === accountId) {
      // 如果删除的是当前活跃账户，先登出
      this.logout();
    }

    return CookieManager.deleteAccount(accountId);
  }

  // 刷新当前登录状态
  async refreshLoginStatus(): Promise<LoginResult> {
    const activeAccount = CookieManager.getActiveAccount();
    if (!activeAccount) {
      this.currentStatus = LoginStatus.NOT_LOGGED_IN;
      this.notifyStatusListeners(LoginStatus.NOT_LOGGED_IN);
      return {
        success: false,
        status: LoginStatus.NOT_LOGGED_IN,
        message: '当前未登录'
      };
    }

    return await this.loginWithCookie(activeAccount.id);
  }

  // 获取登录日志
  getLoginLogs(): Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
  }> {
    return Logger.getLogs();
  }

  // 清除登录日志
  clearLogs(): void {
    Logger.clearLogs();
  }

  // 导出账户数据
  exportAccountData(): string {
    const accounts = this.getAllAccounts();
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      accounts: accounts.map(acc => ({
        ...acc,
        cookies: '***' // 不导出敏感的Cookie信息
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  // 销毁服务
  destroy(): void {
    Logger.info('销毁小红书登录服务');
    
    this.monitor.destroy();
    this.cookieLoginService.destroy();
    this.smsLoginService.destroy();
    
    this.statusListeners = [];
    this.currentStatus = LoginStatus.NOT_LOGGED_IN;
  }
}

// 导出单例实例
export const xhsLoginService = new XHSLoginService();