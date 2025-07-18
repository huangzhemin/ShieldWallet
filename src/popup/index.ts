import { WalletService } from '../services/wallet';
import { StorageService } from '../services/storage';
import { NetworkService } from '../services/network';
import { ValidationUtils } from '../utils/validation';

/**
 * Popup界面控制器
 */
class PopupController {
  private currentScreen: string = 'welcomeScreen';
  private walletUnlocked: boolean = false;

  constructor() {
    this.init();
  }

  /**
   * 初始化popup
   */
  private async init(): Promise<void> {
    console.log('ShieldWallet Popup 启动');
    
    // 绑定事件监听器
    this.bindEventListeners();
    
    // 检查钱包状态
    await this.checkWalletStatus();
    
    // 加载网络信息
    await this.loadNetworkInfo();
    
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener(this.handleBackgroundMessage.bind(this));
  }

  /**
   * 绑定事件监听器
   */
  private bindEventListeners(): void {
    // 欢迎界面按钮
    document.getElementById('createWalletBtn')?.addEventListener('click', () => {
      this.showScreen('createWalletScreen');
    });
    
    document.getElementById('importWalletBtn')?.addEventListener('click', () => {
      this.showScreen('importWalletScreen');
    });
    
    // 创建钱包表单
    document.getElementById('createWalletForm')?.addEventListener('submit', this.handleCreateWallet.bind(this));
    document.getElementById('backFromCreateBtn')?.addEventListener('click', () => {
      this.showScreen('welcomeScreen');
    });
    
    // 导入钱包表单
    document.getElementById('importWalletForm')?.addEventListener('submit', this.handleImportWallet.bind(this));
    document.getElementById('backFromImportBtn')?.addEventListener('click', () => {
      this.showScreen('welcomeScreen');
    });
    
    // 导入类型切换
    document.getElementById('importType')?.addEventListener('change', this.handleImportTypeChange.bind(this));
    
    // 钱包主界面按钮
    document.getElementById('sendBtn')?.addEventListener('click', () => {
      this.showScreen('sendScreen');
    });
    
    document.getElementById('receiveBtn')?.addEventListener('click', this.handleReceive.bind(this));
    document.getElementById('historyBtn')?.addEventListener('click', this.handleHistory.bind(this));
    document.getElementById('copyAddressBtn')?.addEventListener('click', this.handleCopyAddress.bind(this));
    
    // 发送交易表单
    document.getElementById('sendForm')?.addEventListener('submit', this.handleSendTransaction.bind(this));
    document.getElementById('backFromSendBtn')?.addEventListener('click', () => {
      this.showScreen('walletScreen');
    });
    
    // 网络选择器
    document.getElementById('networkSelect')?.addEventListener('change', this.handleNetworkChange.bind(this));
    
    // 添加代币按钮
    document.getElementById('addTokenBtn')?.addEventListener('click', this.handleAddToken.bind(this));
  }

  /**
   * 检查钱包状态
   */
  private async checkWalletStatus(): Promise<void> {
    try {
      const response = await this.sendMessageToBackground({ action: 'getWalletStatus' });
      
      if (response.exists) {
        if (response.isUnlocked) {
          this.walletUnlocked = true;
          await this.loadWalletData();
          this.showScreen('walletScreen');
        } else {
          // 显示解锁界面
          this.showUnlockScreen();
        }
      } else {
        this.showScreen('welcomeScreen');
      }
    } catch (error) {
      console.error('检查钱包状态失败:', error);
      this.showError('检查钱包状态失败');
    }
  }

  /**
   * 显示解锁界面
   */
  private showUnlockScreen(): void {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
      welcomeScreen.innerHTML = `
        <div class="welcome-content">
          <h2>解锁钱包</h2>
          <form id="unlockForm">
            <div class="form-group">
              <label for="unlockPassword">密码</label>
              <input type="password" id="unlockPassword" required>
            </div>
            <div class="btn-group">
              <button type="submit" class="btn btn-primary">解锁</button>
            </div>
          </form>
        </div>
      `;
      
      document.getElementById('unlockForm')?.addEventListener('submit', this.handleUnlockWallet.bind(this));
    }
  }

  /**
   * 处理解锁钱包
   */
  private async handleUnlockWallet(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = formData.get('unlockPassword') as string;
    
    try {
      const response = await this.sendMessageToBackground({
        action: 'unlockWallet',
        password
      });
      
      if (response.success) {
        this.walletUnlocked = true;
        await this.loadWalletData();
        this.showScreen('walletScreen');
      } else {
        this.showError('密码错误');
      }
    } catch (error) {
      console.error('解锁钱包失败:', error);
      this.showError('解锁钱包失败');
    }
  }

  /**
   * 处理创建钱包
   */
  private async handleCreateWallet(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      this.showError('密码不匹配');
      return;
    }
    
    try {
      const { wallet, mnemonic } = await WalletService.createWallet(password);
      
      // 显示助记词
      this.showMnemonic(mnemonic);
      
      // 切换到钱包界面
      setTimeout(() => {
        this.walletUnlocked = true;
        this.loadWalletData();
        this.showScreen('walletScreen');
      }, 5000);
      
    } catch (error) {
      console.error('创建钱包失败:', error);
      this.showError(`创建钱包失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理导入钱包
   */
  private async handleImportWallet(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const importType = formData.get('importType') as 'mnemonic' | 'privateKey';
    const importData = importType === 'mnemonic' 
      ? formData.get('mnemonic') as string
      : formData.get('privateKey') as string;
    const password = formData.get('importPassword') as string;
    const confirmPassword = formData.get('importConfirmPassword') as string;
    
    if (password !== confirmPassword) {
      this.showError('密码不匹配');
      return;
    }
    
    try {
      await WalletService.importWallet(importData, importType, password);
      
      this.walletUnlocked = true;
      await this.loadWalletData();
      this.showScreen('walletScreen');
      
    } catch (error) {
      console.error('导入钱包失败:', error);
      this.showError(`导入钱包失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理导入类型变化
   */
  private handleImportTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const mnemonicGroup = document.getElementById('mnemonicInputGroup');
    const privateKeyGroup = document.getElementById('privateKeyInputGroup');
    
    if (select.value === 'mnemonic') {
      mnemonicGroup?.classList.remove('hidden');
      privateKeyGroup?.classList.add('hidden');
    } else {
      mnemonicGroup?.classList.add('hidden');
      privateKeyGroup?.classList.remove('hidden');
    }
  }

  /**
   * 加载钱包数据
   */
  private async loadWalletData(): Promise<void> {
    try {
      // 获取地址
      const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
      if (addressResponse.address) {
        const shortAddress = ValidationUtils.shortenAddress(addressResponse.address);
        const addressElement = document.getElementById('accountAddressShort');
        if (addressElement) {
          addressElement.textContent = shortAddress;
        }
      }
      
      // 获取余额
      const balanceResponse = await this.sendMessageToBackground({ action: 'getBalance' });
      if (balanceResponse.balance) {
        const balanceElement = document.getElementById('ethBalance');
        if (balanceElement) {
          balanceElement.textContent = `${ValidationUtils.formatAmount(balanceResponse.balance)} ETH`;
        }
      }
      
    } catch (error) {
      console.error('加载钱包数据失败:', error);
    }
  }

  /**
   * 处理发送交易
   */
  private async handleSendTransaction(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const to = formData.get('recipientAddress') as string;
    const amount = formData.get('amount') as string;
    const gasPrice = formData.get('gasPrice') as string;
    
    // 验证输入
    if (!ValidationUtils.isValidEthereumAddress(to)) {
      this.showError('无效的收款地址');
      return;
    }
    
    if (!ValidationUtils.isValidAmount(amount)) {
      this.showError('无效的金额');
      return;
    }
    
    if (!ValidationUtils.isValidGasPrice(gasPrice)) {
      this.showError('无效的Gas价格');
      return;
    }
    
    // 请求密码确认
    const password = prompt('请输入密码确认交易:');
    if (!password) {
      return;
    }
    
    try {
      const transaction = {
        to,
        value: amount,
        gasPrice,
        gasLimit: '21000' // 标准ETH转账
      };
      
      const response = await this.sendMessageToBackground({
        action: 'sendTransaction',
        transaction,
        password
      });
      
      if (response.txHash) {
        this.showSuccess(`交易已发送! 交易哈希: ${response.txHash}`);
        this.showScreen('walletScreen');
        await this.loadWalletData(); // 刷新余额
      } else {
        this.showError(response.error || '发送交易失败');
      }
      
    } catch (error) {
      console.error('发送交易失败:', error);
      this.showError('发送交易失败');
    }
  }

  /**
   * 处理接收
   */
  private async handleReceive(): Promise<void> {
    const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
    if (addressResponse.address) {
      // 显示二维码或地址
      alert(`您的钱包地址:\n${addressResponse.address}`);
    }
  }

  /**
   * 处理历史记录
   */
  private async handleHistory(): Promise<void> {
    const response = await this.sendMessageToBackground({ action: 'getTransactionHistory' });
    if (response.transactions) {
      // 显示交易历史
      console.log('交易历史:', response.transactions);
      alert(`您有 ${response.transactions.length} 条交易记录`);
    }
  }

  /**
   * 处理复制地址
   */
  private async handleCopyAddress(): Promise<void> {
    const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
    if (addressResponse.address) {
      try {
        await navigator.clipboard.writeText(addressResponse.address);
        this.showSuccess('地址已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  }

  /**
   * 处理网络变化
   */
  private async handleNetworkChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const networkId = select.value;
    
    try {
      await this.sendMessageToBackground({
        action: 'switchNetwork',
        networkId
      });
      
      // 刷新钱包数据
      if (this.walletUnlocked) {
        await this.loadWalletData();
      }
      
    } catch (error) {
      console.error('切换网络失败:', error);
      this.showError('切换网络失败');
    }
  }

  /**
   * 处理添加代币
   */
  private handleAddToken(): void {
    // 简化实现
    alert('添加代币功能开发中...');
  }

  /**
   * 加载网络信息
   */
  private async loadNetworkInfo(): Promise<void> {
    try {
      const response = await this.sendMessageToBackground({ action: 'getNetworkInfo' });
      if (response.network) {
        const networkSelect = document.getElementById('networkSelect') as HTMLSelectElement;
        if (networkSelect) {
          networkSelect.value = response.network.id;
        }
      }
    } catch (error) {
      console.error('加载网络信息失败:', error);
    }
  }

  /**
   * 显示助记词
   */
  private showMnemonic(mnemonic: string): void {
    alert(`请安全保存您的助记词:\n\n${mnemonic}\n\n请务必将其保存在安全的地方，这是恢复钱包的唯一方式！`);
  }

  /**
   * 显示屏幕
   */
  private showScreen(screenId: string): void {
    // 隐藏所有屏幕
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.add('hidden');
    });
    
    // 显示目标屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      this.currentScreen = screenId;
    }
  }

  /**
   * 显示错误消息
   */
  private showError(message: string): void {
    alert(`错误: ${message}`);
  }

  /**
   * 显示成功消息
   */
  private showSuccess(message: string): void {
    alert(`成功: ${message}`);
  }

  /**
   * 发送消息到background脚本
   */
  private sendMessageToBackground(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 处理来自background的消息
   */
  private handleBackgroundMessage(message: any): void {
    switch (message.action) {
      case 'walletLocked':
        this.walletUnlocked = false;
        this.showUnlockScreen();
        break;
    }
  }
}

// 启动popup控制器
new PopupController();