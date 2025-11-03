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
import { v4 as uuidv4 } from 'uuid';

export class SMSLoginService {
  private cookieLoginService: CookieLoginService;
  private loginWindow: Window | null = null;
  private loginPromise: Promise<LoginResult> | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    this.cookieLoginService = new CookieLoginService();
  }

  // 手机号验证码登录
  async loginWithSMS(phone: string, code?: string): Promise<LoginResult> {
    if (this.loginPromise) {
      Logger.warn('登录进程已在进行中');
      return this.loginPromise;
    }

    this.loginPromise = this._performSMSLogin(phone, code);
    const result = await this.loginPromise;
    this.loginPromise = null;
    return result;
  }

  private async _performSMSLogin(phone: string, code?: string): Promise<LoginResult> {
    try {
      Logger.info('开始手机号验证码登录', { phone });

      // 验证手机号格式
      if (!this.validatePhoneNumber(phone)) {
        return {
          success: false,
          status: LoginStatus.LOGIN_FAILED,
          message: '手机号格式不正确'
        };
      }

      // 如果提供了验证码，直接进行登录
      if (code) {
        return await this.performLoginWithCode(phone, code);
      } else {
        // 打开登录窗口，等待用户输入验证码
        return await this.openLoginWindow(phone);
      }

    } catch (error) {
      Logger.error('SMS登录过程出错', error);
      return {
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '登录过程出现错误',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 打开登录窗口
  private async openLoginWindow(phone: string): Promise<LoginResult> {
    return new Promise((resolve) => {
      try {
        // 计算窗口位置（居中显示）
        const width = 480;
        const height = 640;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        // 打开登录窗口
        this.loginWindow = window.open(
          XHS_CONFIG.LOGIN_URL,
          'xhs_login',
          `width=${width},height=${height},left=${left},top=${top},` +
          'resizable=no,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
        );

        if (!this.loginWindow) {
          resolve({
            success: false,
            status: LoginStatus.LOGIN_FAILED,
            message: '无法打开登录窗口，请检查浏览器弹窗设置'
          });
          return;
        }

        // 监听窗口消息
        this.messageListener = (event: MessageEvent) => {
          if (event.origin !== new URL(XHS_CONFIG.BASE_URL).origin) {
            return;
          }

          if (event.data.type === 'XHS_LOGIN_SUCCESS') {
            this.handleLoginSuccess(event.data, resolve);
          } else if (event.data.type === 'XHS_LOGIN_FAILED') {
            this.handleLoginFailure(event.data, resolve);
          }
        };

        window.addEventListener('message', this.messageListener);

        // 监听窗口关闭
        const checkClosed = setInterval(() => {
          if (this.loginWindow?.closed) {
            clearInterval(checkClosed);
            this.cleanup();
            resolve({
              success: false,
              status: LoginStatus.LOGIN_FAILED,
              message: '用户取消登录'
            });
          }
        }, 1000);

        // 窗口加载完成后注入脚本
        this.loginWindow.addEventListener('load', () => {
          this.injectLoginScript(phone);
        });

        // 设置超时
        setTimeout(() => {
          if (this.loginWindow && !this.loginWindow.closed) {
            this.loginWindow.close();
          }
          this.cleanup();
          resolve({
            success: false,
            status: LoginStatus.LOGIN_FAILED,
            message: '登录超时'
          });
        }, 300000); // 5分钟超时

      } catch (error) {
        Logger.error('打开登录窗口失败', error);
        resolve({
          success: false,
          status: LoginStatus.LOGIN_FAILED,
          message: '打开登录窗口失败'
        });
      }
    });
  }

  // 注入登录脚本
  private injectLoginScript(phone: string): void {
    if (!this.loginWindow) return;

    try {
      const script = `
        (function() {
          console.log('小红书登录助手已加载');
          
          // 等待页面完全加载
          function waitForElement(selector, timeout = 10000) {
            return new Promise((resolve) => {
              const element = document.querySelector(selector);
              if (element) {
                resolve(element);
                return;
              }
              
              const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                  observer.disconnect();
                  resolve(element);
                }
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
              
              setTimeout(() => {
                observer.disconnect();
                resolve(null);
              }, timeout);
            });
          }

          // 模拟人类输入
          function simulateInput(element, value) {
            element.focus();
            element.value = '';
            
            // 逐字符输入
            for (let i = 0; i < value.length; i++) {
              setTimeout(() => {
                element.value += value[i];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
              }, i * 100);
            }
          }

          // 监听登录状态
          function checkLoginStatus() {
            const nameBox = document.querySelector('${XHS_CONFIG.SELECTORS.NAME_BOX}');
            const userAvatar = document.querySelector('${XHS_CONFIG.SELECTORS.USER_AVATAR}');
            
            if (nameBox || userAvatar) {
              // 登录成功
              const userInfo = {
                nickname: nameBox?.textContent?.trim() || '',
                avatar: userAvatar?.src || ''
              };
              
              window.parent.postMessage({
                type: 'XHS_LOGIN_SUCCESS',
                userInfo: userInfo,
                cookies: document.cookie
              }, '${window.location.origin}');
              
              return true;
            }
            return false;
          }

          // 自动填入手机号
          async function autoFillPhone() {
            try {
              const phoneInput = await waitForElement('${XHS_CONFIG.SELECTORS.USERNAME_INPUT}');
              if (phoneInput) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                simulateInput(phoneInput, '${phone}');
                console.log('手机号已自动填入');
              }
            } catch (error) {
              console.error('自动填入手机号失败:', error);
            }
          }

          // 监听验证码输入
          async function monitorCodeInput() {
            try {
              const codeInput = await waitForElement('input[placeholder*="验证码"], input[type="text"]:not([placeholder*="手机号"])');
              if (codeInput) {
                console.log('验证码输入框已找到');
                
                // 监听验证码输入完成
                codeInput.addEventListener('input', () => {
                  if (codeInput.value.length >= 4) {
                    setTimeout(() => {
                      if (checkLoginStatus()) {
                        return;
                      }
                      
                      // 查找并点击登录按钮
                      const loginBtn = document.querySelector('button[type="submit"], .login-btn, .submit-btn') ||
                                      Array.from(document.querySelectorAll('button')).find(btn => 
                                        btn.textContent.includes('登录') || btn.textContent.includes('确认')
                                      );
                      
                      if (loginBtn && !loginBtn.disabled) {
                        loginBtn.click();
                        console.log('登录按钮已点击');
                        
                        // 延迟检查登录状态
                        setTimeout(() => {
                          if (!checkLoginStatus()) {
                            // 如果登录失败，发送失败消息
                            const errorMsg = document.querySelector('.error-msg, .login-error')?.textContent || '登录失败';
                            window.parent.postMessage({
                              type: 'XHS_LOGIN_FAILED',
                              message: errorMsg
                            }, '${window.location.origin}');
                          }
                        }, 3000);
                      }
                    }, 500);
                  }
                });
              }
            } catch (error) {
              console.error('监听验证码输入失败:', error);
            }
          }

          // 启动自动化流程
          setTimeout(() => {
            autoFillPhone();
            monitorCodeInput();
            
            // 定期检查登录状态
            const statusCheck = setInterval(() => {
              if (checkLoginStatus()) {
                clearInterval(statusCheck);
              }
            }, 2000);
          }, 1000);

        })();
      `;

      // 注入脚本
      const scriptElement = this.loginWindow.document.createElement('script');
      scriptElement.textContent = script;
      this.loginWindow.document.head.appendChild(scriptElement);

    } catch (error) {
      Logger.error('注入登录脚本失败', error);
    }
  }

  // 处理登录成功
  private async handleLoginSuccess(data: any, resolve: (result: LoginResult) => void): Promise<void> {
    try {
      Logger.info('收到登录成功消息', data);

      // 保存Cookie和用户信息
      const account = await this.cookieLoginService.saveCurrentLoginCookie({
        phone: this.extractPhoneFromWindow(),
        nickname: data.userInfo?.nickname || '未知用户',
        avatar: data.userInfo?.avatar || '',
        loginMethod: LoginMethod.SMS
      });

      this.cleanup();

      resolve({
        success: true,
        status: LoginStatus.LOGGED_IN,
        message: '登录成功',
        account: account
      });

    } catch (error) {
      Logger.error('处理登录成功失败', error);
      resolve({
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '保存登录信息失败'
      });
    }
  }

  // 处理登录失败
  private handleLoginFailure(data: any, resolve: (result: LoginResult) => void): void {
    Logger.warn('收到登录失败消息', data);
    
    this.cleanup();

    resolve({
      success: false,
      status: LoginStatus.LOGIN_FAILED,
      message: data.message || '登录失败'
    });
  }

  // 直接使用验证码登录（通过API）
  private async performLoginWithCode(phone: string, code: string): Promise<LoginResult> {
    try {
      Logger.info('开始API验证码登录', { phone, codeLength: code.length });

      // 模拟登录API请求
      const loginData = {
        phone: phone,
        code: code,
        type: 'sms'
      };

      const response = await fetch(`${XHS_CONFIG.API_BASE}/api/sns/web/v1/login/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': AntiDetection.getRandomUserAgent(),
          'Referer': XHS_CONFIG.LOGIN_URL,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // 保存登录状态
          const account = await this.cookieLoginService.saveCurrentLoginCookie({
            phone: phone,
            nickname: result.data?.nickname || '未知用户',
            avatar: result.data?.avatar || '',
            loginMethod: LoginMethod.SMS
          });

          Logger.info('API验证码登录成功');
          return {
            success: true,
            status: LoginStatus.LOGGED_IN,
            message: '登录成功',
            account: account
          };
        } else {
          return {
            success: false,
            status: LoginStatus.LOGIN_FAILED,
            message: result.message || '验证码错误'
          };
        }
      } else {
        return {
          success: false,
          status: LoginStatus.LOGIN_FAILED,
          message: '网络请求失败'
        };
      }

    } catch (error) {
      Logger.error('API验证码登录失败', error);
      return {
        success: false,
        status: LoginStatus.LOGIN_FAILED,
        message: '登录接口调用失败'
      };
    }
  }

  // 发送验证码
  async sendSMSCode(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validatePhoneNumber(phone)) {
        return {
          success: false,
          message: '手机号格式不正确'
        };
      }

      Logger.info('发送验证码', { phone });

      const response = await fetch(`${XHS_CONFIG.API_BASE}/api/sns/web/v1/login/send_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': AntiDetection.getRandomUserAgent(),
          'Referer': XHS_CONFIG.LOGIN_URL,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          phone: phone,
          type: 'login'
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          Logger.info('验证码发送成功');
          return {
            success: true,
            message: '验证码已发送'
          };
        } else {
          return {
            success: false,
            message: result.message || '发送验证码失败'
          };
        }
      } else {
        return {
          success: false,
          message: '网络请求失败'
        };
      }

    } catch (error) {
      Logger.error('发送验证码失败', error);
      return {
        success: false,
        message: '发送验证码接口调用失败'
      };
    }
  }

  // 验证手机号格式
  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 从窗口中提取手机号
  private extractPhoneFromWindow(): string {
    try {
      if (this.loginWindow) {
        const phoneInput = this.loginWindow.document.querySelector(XHS_CONFIG.SELECTORS.USERNAME_INPUT) as HTMLInputElement;
        return phoneInput?.value || '';
      }
    } catch (error) {
      Logger.error('提取手机号失败', error);
    }
    return '';
  }

  // 清理资源
  private cleanup(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    if (this.loginWindow && !this.loginWindow.closed) {
      this.loginWindow.close();
    }
    this.loginWindow = null;
  }

  // 销毁服务
  destroy(): void {
    this.cleanup();
    this.cookieLoginService.destroy();
  }
}