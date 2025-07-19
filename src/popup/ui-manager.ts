/**
 * UI管理器类
 * 负责处理界面显示、切换和消息提示
 */
export class UIManager {
  private screens: string[] = [
    'welcomeScreen',
    'createWalletScreen',
    'importWalletScreen',
    'walletScreen',
    'sendScreen',
    'receiveScreen'
  ];

  constructor() {
    // 初始化UI
    this.setupToastContainer();
  }

  /**
   * 显示指定屏幕，隐藏其他屏幕
   */
  public showScreen(screenId: string): void {
    console.log(`切换到屏幕: ${screenId}`);
    
    // 隐藏所有屏幕
    this.screens.forEach(id => {
      const screen = document.getElementById(id);
      if (screen) {
        screen.classList.add('hidden');
      }
    });
    
    // 显示目标屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
    } else {
      console.error(`找不到屏幕: ${screenId}`);
    }
  }

  /**
   * 更新账户信息显示
   */
  public updateAccountInfo(address: string, balance: string): void {
    // 更新短地址显示
    const addressShort = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    const addressElement = document.getElementById('accountAddressShort');
    if (addressElement) {
      addressElement.textContent = addressShort;
    }
    
    // 更新余额显示
    const balanceElement = document.getElementById('ethBalance');
    if (balanceElement) {
      balanceElement.textContent = `${balance} ETH`;
    }
  }

  /**
   * 更新接收页面信息
   */
  public updateReceiveInfo(address: string): void {
    // 更新完整地址
    const fullAddressElement = document.getElementById('fullAddress');
    if (fullAddressElement) {
      fullAddressElement.textContent = address;
    }
    
    // 生成二维码
    this.generateQRCode(address);
  }

  /**
   * 更新代币列表
   */
  public updateTokenList(tokens: any[]): void {
    const tokenListContainer = document.getElementById('tokenList');
    if (!tokenListContainer) return;
    
    // 清空现有列表
    tokenListContainer.innerHTML = '';
    
    if (tokens.length === 0) {
      tokenListContainer.innerHTML = '<div class="empty-message">暂无代币</div>';
      return;
    }
    
    // 添加代币列表项
    tokens.forEach(token => {
      const tokenItem = document.createElement('div');
      tokenItem.className = 'token-item';
      tokenItem.innerHTML = `
        <div class="token-info">
          <div class="token-symbol">${token.symbol}</div>
          <div class="token-name">${token.name}</div>
        </div>
        <div class="token-balance">${token.balance}</div>
      `;
      tokenListContainer.appendChild(tokenItem);
    });
  }

  /**
   * 显示错误消息
   */
  public showError(message: string): void {
    this.showToast(message, 'error');
  }

  /**
   * 显示成功消息
   */
  public showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  /**
   * 显示普通消息
   */
  public showMessage(message: string): void {
    this.showToast(message, 'info');
  }

  /**
   * 显示助记词
   */
  public showMnemonic(mnemonic: string): void {
    // 创建模态框显示助记词
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>请备份您的助记词</h3>
        <div class="mnemonic-container">${mnemonic}</div>
        <p class="warning">警告：请将助记词保存在安全的地方，任何获得您助记词的人都能控制您的资产。</p>
        <button id="mnemonicConfirmBtn" class="btn btn-primary">我已安全备份</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加确认按钮事件
    const confirmBtn = document.getElementById('mnemonicConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        this.showScreen('walletScreen');
      });
    }
  }

  /**
   * 生成二维码
   * 注：实际实现中需要引入QR码生成库
   */
  private generateQRCode(data: string): void {
    const qrContainer = document.getElementById('addressQRCode');
    if (!qrContainer) return;
    
    // 这里应该使用QR码生成库，如qrcode.js
    // 简化实现，显示一个占位符
    qrContainer.innerHTML = `
      <div style="width: 200px; height: 200px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
        <span>QR Code for:<br>${data.substring(0, 10)}...${data.substring(data.length - 6)}</span>
      </div>
    `;
  }

  /**
   * 设置Toast消息容器
   */
  private setupToastContainer(): void {
    // 创建toast容器
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .toast {
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
      }
      
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .toast.info {
        background-color: var(--primary-color);
      }
      
      .toast.success {
        background-color: var(--success-color);
      }
      
      .toast.error {
        background-color: var(--error-color);
      }
      
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 400px;
      }
      
      .mnemonic-container {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        margin: 15px 0;
        word-break: break-all;
        font-family: monospace;
        font-size: 16px;
      }
      
      .warning {
        color: var(--error-color);
        font-size: 12px;
        margin-bottom: 15px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 显示Toast消息
   */
  private showToast(message: string, type: 'info' | 'success' | 'error'): void {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 3秒后移除
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 3000);
  }
} 