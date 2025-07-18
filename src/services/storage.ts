/**
 * Chrome扩展存储服务
 */
export class StorageService {
  /**
   * 保存数据到Chrome存储
   */
  static async set(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 从Chrome存储获取数据
   */
  static async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * 从Chrome存储删除数据
   */
  static async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清空所有存储数据
   */
  static async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取所有存储的键值对
   */
  static async getAll(): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  // 钱包相关的存储键
  static readonly WALLET_KEY = 'wallet_data';
  static readonly SETTINGS_KEY = 'wallet_settings';
  static readonly NETWORK_KEY = 'current_network';
  static readonly TOKENS_KEY = 'custom_tokens';
  static readonly TRANSACTIONS_KEY = 'transaction_history';

  /**
   * 保存钱包数据
   */
  static async saveWallet(walletData: any): Promise<void> {
    await this.set(this.WALLET_KEY, walletData);
  }

  /**
   * 获取钱包数据
   */
  static async getWallet(): Promise<any> {
    return await this.get(this.WALLET_KEY);
  }

  /**
   * 删除钱包数据
   */
  static async removeWallet(): Promise<void> {
    await this.remove(this.WALLET_KEY);
  }

  /**
   * 保存设置
   */
  static async saveSettings(settings: any): Promise<void> {
    await this.set(this.SETTINGS_KEY, settings);
  }

  /**
   * 获取设置
   */
  static async getSettings(): Promise<any> {
    const defaultSettings = {
      autoLock: true,
      lockTimeout: 15, // 分钟
      showTestNetworks: false,
      currency: 'USD'
    };
    
    const settings = await this.get(this.SETTINGS_KEY);
    return { ...defaultSettings, ...settings };
  }

  /**
   * 保存当前网络
   */
  static async saveCurrentNetwork(networkId: string): Promise<void> {
    await this.set(this.NETWORK_KEY, networkId);
  }

  /**
   * 获取当前网络
   */
  static async getCurrentNetwork(): Promise<string> {
    const network = await this.get(this.NETWORK_KEY);
    return network || '1'; // 默认主网
  }

  /**
   * 保存自定义代币
   */
  static async saveCustomTokens(tokens: any[]): Promise<void> {
    await this.set(this.TOKENS_KEY, tokens);
  }

  /**
   * 获取自定义代币
   */
  static async getCustomTokens(): Promise<any[]> {
    const tokens = await this.get(this.TOKENS_KEY);
    return tokens || [];
  }

  /**
   * 保存交易历史
   */
  static async saveTransactionHistory(transactions: any[]): Promise<void> {
    await this.set(this.TRANSACTIONS_KEY, transactions);
  }

  /**
   * 获取交易历史
   */
  static async getTransactionHistory(): Promise<any[]> {
    const transactions = await this.get(this.TRANSACTIONS_KEY);
    return transactions || [];
  }

  /**
   * 添加交易到历史记录
   */
  static async addTransaction(transaction: any): Promise<void> {
    const transactions = await this.getTransactionHistory();
    transactions.unshift(transaction); // 添加到开头
    
    // 只保留最近100条交易
    if (transactions.length > 100) {
      transactions.splice(100);
    }
    
    await this.saveTransactionHistory(transactions);
  }
}