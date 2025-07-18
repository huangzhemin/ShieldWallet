import { StorageService } from '../services/storage';
import { WalletService } from '../services/wallet';
import { NetworkService } from '../services/network';

/**
 * Chrome扩展背景脚本
 */
class BackgroundService {
  private autoLockTimer: number | null = null;

  constructor() {
    this.init();
  }

  /**
   * 初始化背景服务
   */
  private async init(): Promise<void> {
    console.log('ShieldWallet 背景服务启动');
    
    // 监听扩展安装事件
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // 监听存储变化
    chrome.storage.onChanged.addListener(this.handleStorageChanged.bind(this));
    
    // 设置自动锁定
    await this.setupAutoLock();
  }

  /**
   * 处理扩展安装事件
   */
  private handleInstalled(details: chrome.runtime.InstalledDetails): void {
    if (details.reason === 'install') {
      console.log('ShieldWallet 首次安装');
      // 可以在这里设置默认配置
    } else if (details.reason === 'update') {
      console.log('ShieldWallet 更新到新版本');
    }
  }

  /**
   * 处理来自popup的消息
   */
  private async handleMessage(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case 'getWalletStatus':
          const exists = await WalletService.walletExists();
          const isUnlocked = WalletService.isWalletUnlocked();
          sendResponse({ exists, isUnlocked });
          break;
          
        case 'unlockWallet':
          const unlocked = await WalletService.unlockWallet(request.password);
          if (unlocked) {
            await this.resetAutoLockTimer();
          }
          sendResponse({ success: unlocked });
          break;
          
        case 'lockWallet':
          WalletService.lockWallet();
          this.clearAutoLockTimer();
          sendResponse({ success: true });
          break;
          
        case 'getBalance':
          if (WalletService.isWalletUnlocked()) {
            const balance = await WalletService.getBalance();
            sendResponse({ balance });
          } else {
            sendResponse({ error: '钱包未解锁' });
          }
          break;
          
        case 'getCurrentAddress':
          const address = WalletService.getCurrentAddress();
          sendResponse({ address });
          break;
          
        case 'sendTransaction':
          if (WalletService.isWalletUnlocked()) {
            const txHash = await WalletService.sendTransaction(
              request.transaction,
              request.password
            );
            sendResponse({ txHash });
          } else {
            sendResponse({ error: '钱包未解锁' });
          }
          break;
          
        case 'getNetworkInfo':
          const network = NetworkService.getCurrentNetwork();
          sendResponse({ network });
          break;
          
        case 'switchNetwork':
          NetworkService.setCurrentNetwork(request.networkId);
          await StorageService.saveCurrentNetwork(request.networkId);
          sendResponse({ success: true });
          break;
          
        case 'getTransactionHistory':
          const transactions = await StorageService.getTransactionHistory();
          sendResponse({ transactions });
          break;
          
        case 'resetAutoLock':
          await this.resetAutoLockTimer();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: '未知操作' });
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * 处理存储变化事件
   */
  private handleStorageChanged(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ): void {
    if (areaName === 'local') {
      // 监听设置变化
      if (changes[StorageService.SETTINGS_KEY]) {
        this.setupAutoLock();
      }
      
      // 监听网络变化
      if (changes[StorageService.NETWORK_KEY]) {
        const newNetworkId = changes[StorageService.NETWORK_KEY].newValue;
        if (newNetworkId) {
          NetworkService.setCurrentNetwork(newNetworkId);
        }
      }
    }
  }

  /**
   * 设置自动锁定
   */
  private async setupAutoLock(): Promise<void> {
    try {
      const settings = await StorageService.getSettings();
      
      if (settings.autoLock && settings.lockTimeout > 0) {
        this.clearAutoLockTimer();
        
        const timeoutMs = settings.lockTimeout * 60 * 1000; // 转换为毫秒
        this.autoLockTimer = setTimeout(() => {
          if (WalletService.isWalletUnlocked()) {
            console.log('自动锁定钱包');
            WalletService.lockWallet();
            
            // 通知popup钱包已锁定
            chrome.runtime.sendMessage({ action: 'walletLocked' });
          }
        }, timeoutMs);
      }
    } catch (error) {
      console.error('设置自动锁定失败:', error);
    }
  }

  /**
   * 重置自动锁定计时器
   */
  private async resetAutoLockTimer(): Promise<void> {
    this.clearAutoLockTimer();
    await this.setupAutoLock();
  }

  /**
   * 清除自动锁定计时器
   */
  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /**
   * 检查网络连接状态
   */
  private async checkNetworkConnection(): Promise<void> {
    try {
      const isConnected = await NetworkService.checkConnection();
      if (!isConnected) {
        console.warn('网络连接失败');
      }
    } catch (error) {
      console.error('检查网络连接时出错:', error);
    }
  }

  /**
   * 定期更新余额和交易状态
   */
  private async updateWalletData(): Promise<void> {
    if (!WalletService.isWalletUnlocked()) {
      return;
    }
    
    try {
      // 更新余额
      const balance = await WalletService.getBalance();
      
      // 检查待确认交易状态
      const transactions = await StorageService.getTransactionHistory();
      const pendingTxs = transactions.filter(tx => tx.status === 'pending');
      
      for (const tx of pendingTxs) {
        try {
          const receipt = await NetworkService.getTransactionReceipt(tx.hash);
          if (receipt) {
            tx.status = receipt.status === '0x1' ? 'confirmed' : 'failed';
            tx.blockNumber = receipt.blockNumber;
            tx.gasUsed = receipt.gasUsed;
          }
        } catch (error) {
          // 交易可能还未被打包
          console.log(`交易 ${tx.hash} 仍在等待确认`);
        }
      }
      
      // 保存更新后的交易历史
      await StorageService.saveTransactionHistory(transactions);
      
    } catch (error) {
      console.error('更新钱包数据时出错:', error);
    }
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 每30秒检查一次网络连接
    setInterval(() => {
      this.checkNetworkConnection();
    }, 30000);
    
    // 每10秒更新一次钱包数据
    setInterval(() => {
      this.updateWalletData();
    }, 10000);
  }
}

// 启动背景服务
new BackgroundService();