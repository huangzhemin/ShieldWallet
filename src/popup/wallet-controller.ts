/**
 * 钱包控制器类
 * 负责处理钱包业务逻辑，与后台脚本通信
 */
import { UIManager } from './ui-manager';

export class WalletController {
  private uiManager: UIManager;
  private currentAddress: string = '';
  private currentNetwork: string = '1'; // 默认以太坊主网

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
  }

  /**
   * 初始化钱包控制器
   */
  public async initialize(): Promise<void> {
    try {
      // 检查钱包是否存在
      const response = await this.sendMessage({ type: 'CHECK_WALLET_EXISTS' });
      
      if (response.success) {
        if (response.exists) {
          // 钱包已存在，获取账户信息
          await this.loadAccountInfo();
          this.uiManager.showScreen('walletScreen');
        } else {
          // 钱包不存在，显示欢迎页面
          this.uiManager.showScreen('welcomeScreen');
        }
      } else {
        this.uiManager.showError('初始化失败: ' + response.error);
      }
    } catch (error) {
      console.error('初始化错误:', error);
      this.uiManager.showError('初始化失败，请重试');
    }
  }

  /**
   * 创建新钱包
   */
  public async createWallet(password: string): Promise<void> {
    try {
      this.uiManager.showMessage('正在创建钱包...');
      
      const response = await this.sendMessage({
        type: 'CREATE_WALLET',
        data: { password }
      });
      
      if (response.success) {
        this.currentAddress = response.address;
        this.uiManager.showSuccess('钱包创建成功!');
        
        // 显示助记词备份提示
        this.uiManager.showMnemonic(response.mnemonic);
        
        // 加载账户信息
        await this.loadAccountInfo();
      } else {
        this.uiManager.showError('创建钱包失败: ' + response.error);
      }
    } catch (error) {
      console.error('创建钱包错误:', error);
      this.uiManager.showError('创建钱包失败，请重试');
    }
  }

  /**
   * 导入钱包
   */
  public async importWallet(type: string, value: string, password: string): Promise<void> {
    try {
      this.uiManager.showMessage('正在导入钱包...');
      
      const response = await this.sendMessage({
        type: 'IMPORT_WALLET',
        data: { type, value, password }
      });
      
      if (response.success) {
        this.currentAddress = response.address;
        this.uiManager.showSuccess('钱包导入成功!');
        
        // 加载账户信息
        await this.loadAccountInfo();
        this.uiManager.showScreen('walletScreen');
      } else {
        this.uiManager.showError('导入钱包失败: ' + response.error);
      }
    } catch (error) {
      console.error('导入钱包错误:', error);
      this.uiManager.showError('导入钱包失败，请重试');
    }
  }

  /**
   * 发送交易
   */
  public async sendTransaction(to: string, amount: number, gasPrice: number, asset: string): Promise<void> {
    try {
      // 简单验证
      if (!to.startsWith('0x') || to.length !== 42) {
        this.uiManager.showError('无效的接收地址');
        return;
      }
      
      if (amount <= 0) {
        this.uiManager.showError('金额必须大于0');
        return;
      }
      
      // 显示密码输入对话框
      this.promptForPassword(async (password) => {
        if (!password) {
          this.uiManager.showError('需要密码来签名交易');
          return;
        }
        
        this.uiManager.showMessage('正在发送交易...');
        
        const response = await this.sendMessage({
          type: 'SEND_TRANSACTION',
          data: { to, amount, gasPrice, password, asset }
        });
        
        if (response.success) {
          this.uiManager.showSuccess('交易已发送!');
          this.uiManager.showScreen('walletScreen');
          
          // 刷新账户信息
          setTimeout(() => this.loadAccountInfo(), 1000);
        } else {
          this.uiManager.showError('发送交易失败: ' + response.error);
        }
      });
    } catch (error) {
      console.error('发送交易错误:', error);
      this.uiManager.showError('发送交易失败，请重试');
    }
  }

  /**
   * 切换网络
   */
  public async switchNetwork(networkId: string): Promise<void> {
    try {
      if (this.currentNetwork === networkId) {
        return; // 已经是当前网络
      }
      
      this.uiManager.showMessage('正在切换网络...');
      
      const response = await this.sendMessage({
        type: 'SWITCH_NETWORK',
        data: { networkId }
      });
      
      if (response.success) {
        this.currentNetwork = networkId;
        this.uiManager.showSuccess('网络已切换');
        
        // 刷新账户信息
        await this.loadAccountInfo();
      } else {
        this.uiManager.showError('切换网络失败: ' + response.error);
      }
    } catch (error) {
      console.error('切换网络错误:', error);
      this.uiManager.showError('切换网络失败，请重试');
    }
  }

  /**
   * 显示接收信息
   */
  public async showReceiveInfo(): Promise<void> {
    if (!this.currentAddress) {
      await this.loadAccountInfo();
    }
    
    this.uiManager.updateReceiveInfo(this.currentAddress);
  }

  /**
   * 获取当前钱包地址
   */
  public getCurrentAddress(): string {
    return this.currentAddress;
  }

  /**
   * 加载账户信息
   */
  private async loadAccountInfo(): Promise<void> {
    try {
      const response = await this.sendMessage({ type: 'GET_ACCOUNT_INFO' });
      
      if (response.success) {
        this.currentAddress = response.address;
        this.currentNetwork = response.networkId;
        
        // 更新UI
        this.uiManager.updateAccountInfo(response.address, response.balance);
        this.uiManager.updateTokenList(response.tokens || []);
        
        // 更新网络选择器
        const networkSelect = document.getElementById('networkSelect') as HTMLSelectElement;
        if (networkSelect) {
          networkSelect.value = this.currentNetwork;
        }
      } else {
        console.error('获取账户信息失败:', response.error);
      }
    } catch (error) {
      console.error('加载账户信息错误:', error);
    }
  }

  /**
   * 显示密码输入对话框
   */
  private promptForPassword(callback: (password: string | null) => void): void {
    // 创建密码输入对话框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>请输入密码</h3>
        <div class="form-group">
          <input type="password" id="txPassword" placeholder="钱包密码" />
        </div>
        <div class="btn-group">
          <button id="cancelPasswordBtn" class="btn btn-secondary">取消</button>
          <button id="confirmPasswordBtn" class="btn btn-primary">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 聚焦密码输入框
    const passwordInput = document.getElementById('txPassword') as HTMLInputElement;
    if (passwordInput) {
      setTimeout(() => passwordInput.focus(), 100);
    }
    
    // 取消按钮
    const cancelBtn = document.getElementById('cancelPasswordBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        callback(null);
      });
    }
    
    // 确认按钮
    const confirmBtn = document.getElementById('confirmPasswordBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const password = passwordInput ? passwordInput.value : '';
        document.body.removeChild(modal);
        callback(password);
      });
    }
    
    // 回车键确认
    if (passwordInput) {
      passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          const password = passwordInput.value;
          document.body.removeChild(modal);
          callback(password);
        }
      });
    }
  }

  /**
   * 发送消息到后台脚本
   */
  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // 检查是否在Chrome扩展环境中
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        } else {
          // 在非扩展环境中提供模拟响应（用于测试）
          console.log('模拟环境 - 消息:', message);
          this.handleMockResponse(message, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理模拟响应（用于在普通网页中测试）
   */
  private handleMockResponse(message: any, resolve: Function, reject: Function): void {
    setTimeout(() => {
      switch (message.type) {
        case 'CHECK_WALLET_EXISTS':
          resolve({ success: true, exists: false });
          break;
        case 'CREATE_WALLET':
          resolve({ 
            success: true, 
            address: '0x1234567890123456789012345678901234567890',
            mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
          });
          break;
        case 'IMPORT_WALLET':
          resolve({ 
            success: true, 
            address: '0x9876543210987654321098765432109876543210'
          });
          break;
        case 'GET_ACCOUNT_INFO':
          resolve({ 
            success: true, 
            address: this.currentAddress || '0x1234567890123456789012345678901234567890',
            balance: '1.5',
            network: 'ethereum'
          });
          break;
        default:
          resolve({ success: false, error: '未知的消息类型' });
      }
    }, 500); // 模拟网络延迟
  }
}