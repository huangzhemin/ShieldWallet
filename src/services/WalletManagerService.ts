import { ChainType, ChainAdapter } from '../types/chain';
import { SecurityService } from './SecurityService';
import { NotificationService, NotificationType } from './NotificationService';

/**
 * 钱包类型枚举
 */
export enum WalletType {
  HD_WALLET = 'hd_wallet',
  IMPORTED_WALLET = 'imported_wallet',
  HARDWARE_WALLET = 'hardware_wallet',
  WATCH_ONLY = 'watch_only'
}

/**
 * 钱包状态枚举
 */
export enum WalletStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
  DISABLED = 'disabled',
  SYNCING = 'syncing',
  ERROR = 'error'
}

/**
 * 钱包导入类型
 */
export enum ImportType {
  MNEMONIC = 'mnemonic',
  PRIVATE_KEY = 'private_key',
  KEYSTORE = 'keystore',
  HARDWARE = 'hardware',
  WATCH_ADDRESS = 'watch_address'
}

/**
 * 钱包账户接口
 */
export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  chainType: ChainType;
  derivationPath?: string;
  publicKey?: string;
  isDefault: boolean;
  balance?: string;
  lastSyncAt?: string;
}

/**
 * 钱包接口
 */
export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  status: WalletStatus;
  chainTypes: ChainType[];
  accounts: WalletAccount[];
  isDefault: boolean;
  createdAt: string;
  lastAccessAt: string;
  metadata?: {
    source?: string; // 钱包来源
    version?: string; // 钱包版本
    description?: string; // 钱包描述
    tags?: string[]; // 钱包标签
  };
  security?: {
    isEncrypted: boolean;
    hasBackup: boolean;
    backupAt?: string;
    requiresPassword: boolean;
    biometricEnabled?: boolean;
  };
}

/**
 * 钱包创建参数
 */
export interface CreateWalletParams {
  name: string;
  type: WalletType;
  chainTypes: ChainType[];
  mnemonic?: string; // 用于HD钱包
  password?: string;
  metadata?: Wallet['metadata'];
}

/**
 * 钱包导入参数
 */
export interface ImportWalletParams {
  name: string;
  importType: ImportType;
  data: string; // mnemonic, private key, keystore JSON, etc.
  password?: string; // 用于keystore或加密
  chainTypes: ChainType[];
  metadata?: Wallet['metadata'];
}

/**
 * 钱包导出参数
 */
export interface ExportWalletParams {
  walletId: string;
  exportType: 'mnemonic' | 'private_key' | 'keystore';
  password?: string;
  accountId?: string; // 导出特定账户
}

/**
 * 钱包同步状态
 */
export interface WalletSyncStatus {
  walletId: string;
  issyncing: boolean;
  progress: number; // 0-100
  lastSyncAt?: string;
  error?: string;
}

/**
 * 钱包统计信息
 */
export interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  totalAccounts: number;
  totalBalance: { [chainType: string]: string };
  byType: { [type: string]: number };
  byChain: { [chain: string]: number };
}

/**
 * 钱包事件接口
 */
export interface WalletEvent {
  type: 'created' | 'imported' | 'deleted' | 'switched' | 'locked' | 'unlocked' | 'synced' | 'error';
  walletId: string;
  timestamp: string;
  data?: any;
}

/**
 * 钱包管理服务类
 */
export class WalletManagerService {
  private wallets: Map<string, Wallet> = new Map();
  private currentWalletId: string | null = null;
  private adapters: Map<ChainType, ChainAdapter> = new Map();
  private securityService: SecurityService;
  private notificationService: NotificationService;
  private eventListeners: Map<string, Function[]> = new Map();
  private syncStatus: Map<string, WalletSyncStatus> = new Map();
  private isInitialized: boolean = false;

  constructor(
    securityService: SecurityService,
    notificationService: NotificationService
  ) {
    this.securityService = securityService;
    this.notificationService = notificationService;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 加载已保存的钱包
      await this.loadWallets();
      
      // 设置默认钱包
      await this.setDefaultWallet();
      
      this.isInitialized = true;
      console.log('钱包管理服务初始化完成');
    } catch (error: any) {
      console.error('钱包管理服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册链适配器
   */
  registerAdapter(chainType: ChainType, adapter: ChainAdapter): void {
    this.adapters.set(chainType, adapter);
  }

  /**
   * 创建新钱包
   */
  async createWallet(params: CreateWalletParams): Promise<string> {
    try {
      const walletId = this.generateWalletId();
      
      // 生成助记词（如果未提供）
      let mnemonic = params.mnemonic;
      if (params.type === WalletType.HD_WALLET && !mnemonic) {
        mnemonic = await this.securityService.generateMnemonic();
      }

      // 创建钱包对象
      const wallet: Wallet = {
        id: walletId,
        name: params.name,
        type: params.type,
        status: WalletStatus.ACTIVE,
        chainTypes: params.chainTypes,
        accounts: [],
        isDefault: this.wallets.size === 0, // 第一个钱包设为默认
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        metadata: params.metadata,
        security: {
          isEncrypted: !!params.password,
          hasBackup: false,
          requiresPassword: !!params.password
        }
      };

      // 为每个链类型创建账户
      for (const chainType of params.chainTypes) {
        const adapter = this.adapters.get(chainType);
        if (!adapter) {
          throw new Error(`不支持的链类型: ${chainType}`);
        }

        let accountData;
        if (params.type === WalletType.HD_WALLET && mnemonic) {
          accountData = await adapter.generateWallet(mnemonic, '0'); // 使用字符串索引
        } else {
          throw new Error(`不支持的钱包类型: ${params.type}`);
        }

        const account: WalletAccount = {
          id: this.generateAccountId(),
          name: `${params.name} - ${chainType}`,
          address: accountData.address,
          chainType,
          derivationPath: undefined, // generateWallet返回值没有derivationPath
          publicKey: undefined, // generateWallet返回值没有publicKey
          isDefault: true
        };

        wallet.accounts.push(account);
      }

      // 加密存储敏感数据
      if (params.password && mnemonic) {
        this.securityService.encrypt(mnemonic, params.password);
      }

      // 保存钱包
      this.wallets.set(walletId, wallet);
      await this.saveWallets();

      // 如果是第一个钱包，设为当前钱包
      if (!this.currentWalletId) {
        this.currentWalletId = walletId;
      }

      // 发送通知
      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { walletName: params.name },
        '钱包创建成功',
        `新钱包 "${params.name}" 已创建成功`
      );

      this.emitEvent('created', walletId, { wallet });
      return walletId;
    } catch (error: any) {
      console.error('创建钱包失败:', error);
      throw error;
    }
  }

  /**
   * 导入钱包
   */
  async importWallet(params: ImportWalletParams): Promise<string> {
    try {
      const walletId = this.generateWalletId();
      
      // 验证导入数据
      await this.validateImportData(params.importType, params.data, params.password);

      const wallet: Wallet = {
        id: walletId,
        name: params.name,
        type: this.getWalletTypeFromImportType(params.importType),
        status: WalletStatus.ACTIVE,
        chainTypes: params.chainTypes,
        accounts: [],
        isDefault: this.wallets.size === 0,
        createdAt: new Date().toISOString(),
        lastAccessAt: new Date().toISOString(),
        metadata: {
          ...params.metadata,
          source: 'imported'
        },
        security: {
          isEncrypted: !!params.password,
          hasBackup: true, // 导入的钱包认为已有备份
          requiresPassword: !!params.password
        }
      };

      // 根据导入类型创建账户
      for (const chainType of params.chainTypes) {
        const adapter = this.adapters.get(chainType);
        if (!adapter) {
          throw new Error(`不支持的链类型: ${chainType}`);
        }

        let accountData;
        switch (params.importType) {
          case ImportType.MNEMONIC:
            accountData = await adapter.generateWallet(params.data, '0');
            break;
          case ImportType.PRIVATE_KEY:
            // ChainAdapter接口没有generateWalletFromPrivateKey方法，需要其他方式处理
            throw new Error('暂不支持私钥导入，需要扩展ChainAdapter接口');
            break;
          case ImportType.WATCH_ADDRESS:
            if (!adapter.validateAddress(params.data)) {
              throw new Error('无效的地址格式');
            }
            accountData = {
              address: params.data,
              privateKey: ''
            };
            wallet.type = WalletType.WATCH_ONLY;
            break;
          default:
            throw new Error(`不支持的导入类型: ${params.importType}`);
        }

        const account: WalletAccount = {
          id: this.generateAccountId(),
          name: `${params.name} - ${chainType}`,
          address: accountData.address,
          chainType,
          publicKey: undefined, // 只读钱包没有公钥
          isDefault: true
        };

        wallet.accounts.push(account);
      }

      // 保存钱包
      this.wallets.set(walletId, wallet);
      await this.saveWallets();

      // 发送通知
      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { walletName: params.name, importType: params.importType },
        '钱包导入成功',
        `钱包 "${params.name}" 已通过 ${params.importType} 导入成功`
      );

      this.emitEvent('imported', walletId, { wallet });
      return walletId;
    } catch (error: any) {
      console.error('导入钱包失败:', error);
      throw error;
    }
  }

  /**
   * 导出钱包
   */
  async exportWallet(params: ExportWalletParams): Promise<string> {
    try {
      const wallet = this.wallets.get(params.walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      if (wallet.type === WalletType.WATCH_ONLY) {
        throw new Error('只读钱包无法导出私钥信息');
      }

      // 这里应该实现实际的导出逻辑
      // 注意：实际实现中需要处理加密存储的私钥/助记词
      let exportData: string;
      
      switch (params.exportType) {
        case 'mnemonic':
          if (wallet.type !== WalletType.HD_WALLET) {
            throw new Error('只有HD钱包支持导出助记词');
          }
          // 从加密存储中获取助记词
          exportData = 'mnemonic_placeholder'; // 实际应该解密获取
          break;
        case 'private_key':
          if (!params.accountId) {
            throw new Error('导出私钥需要指定账户');
          }
          // 从加密存储中获取私钥
          exportData = 'private_key_placeholder'; // 实际应该解密获取
          break;
        case 'keystore':
          if (!params.password) {
            throw new Error('导出keystore需要密码');
          }
          // 生成keystore格式
          exportData = JSON.stringify({
            version: 3,
            id: wallet.id,
            // ... keystore格式数据
          });
          break;
        default:
          throw new Error(`不支持的导出类型: ${params.exportType}`);
      }

      // 记录导出事件
      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { walletName: wallet.name, exportType: params.exportType },
        '钱包导出',
        `钱包 "${wallet.name}" 已导出 ${params.exportType}`
      );

      return exportData;
    } catch (error: any) {
      console.error('导出钱包失败:', error);
      throw error;
    }
  }

  /**
   * 删除钱包
   */
  async deleteWallet(walletId: string, password?: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 验证密码（如果需要）
      if (wallet.security?.requiresPassword && !password) {
        throw new Error('删除钱包需要密码验证');
      }

      // 如果是当前钱包，需要切换到其他钱包
      if (this.currentWalletId === walletId) {
        const otherWallets = Array.from(this.wallets.values()).filter(w => w.id !== walletId);
        if (otherWallets.length > 0) {
          await this.switchWallet(otherWallets[0].id);
        } else {
          this.currentWalletId = null;
        }
      }

      // 删除钱包
      this.wallets.delete(walletId);
      this.syncStatus.delete(walletId);
      await this.saveWallets();

      // 发送通知
      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { walletName: wallet.name },
        '钱包删除',
        `钱包 "${wallet.name}" 已删除`
      );

      this.emitEvent('deleted', walletId, { wallet });
      return true;
    } catch (error: any) {
      console.error('删除钱包失败:', error);
      throw error;
    }
  }

  /**
   * 切换钱包
   */
  async switchWallet(walletId: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new Error('无法切换到非活跃状态的钱包');
      }

      const previousWalletId = this.currentWalletId;
      this.currentWalletId = walletId;
      
      // 更新最后访问时间
      wallet.lastAccessAt = new Date().toISOString();
      await this.saveWallets();

      // 同步钱包数据
      await this.syncWallet(walletId);

      this.emitEvent('switched', walletId, { 
        previousWalletId,
        currentWallet: wallet 
      });
      
      return true;
    } catch (error: any) {
      console.error('切换钱包失败:', error);
      throw error;
    }
  }

  /**
   * 锁定钱包
   */
  async lockWallet(walletId: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      wallet.status = WalletStatus.LOCKED;
      await this.saveWallets();

      this.emitEvent('locked', walletId, { wallet });
      return true;
    } catch (error: any) {
      console.error('锁定钱包失败:', error);
      throw error;
    }
  }

  /**
   * 解锁钱包
   */
  async unlockWallet(walletId: string, password: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 验证密码
      if (wallet.security?.requiresPassword) {
        // 这里应该验证密码
        // const isValid = await this.securityService.verifyPassword(password);
        // if (!isValid) throw new Error('密码错误');
      }

      wallet.status = WalletStatus.ACTIVE;
      wallet.lastAccessAt = new Date().toISOString();
      await this.saveWallets();

      this.emitEvent('unlocked', walletId, { wallet });
      return true;
    } catch (error: any) {
      console.error('解锁钱包失败:', error);
      throw error;
    }
  }

  /**
   * 同步钱包
   */
  async syncWallet(walletId: string): Promise<void> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 设置同步状态
      this.syncStatus.set(walletId, {
        walletId,
        issyncing: true,
        progress: 0
      });

      wallet.status = WalletStatus.SYNCING;
      
      // 同步每个账户的余额
      for (let i = 0; i < wallet.accounts.length; i++) {
        const account = wallet.accounts[i];
        const adapter = this.adapters.get(account.chainType);
        
        if (adapter) {
          try {
            const balance = await adapter.getBalance(account.address);
            account.balance = balance;
            account.lastSyncAt = new Date().toISOString();
            
            // 更新进度
            const progress = Math.round(((i + 1) / wallet.accounts.length) * 100);
            this.syncStatus.set(walletId, {
              walletId,
              issyncing: true,
              progress
            });
          } catch (error: any) {
            console.error(`同步账户 ${account.address} 失败:`, error);
          }
        }
      }

      // 完成同步
      wallet.status = WalletStatus.ACTIVE;
      this.syncStatus.set(walletId, {
        walletId,
        issyncing: false,
        progress: 100,
        lastSyncAt: new Date().toISOString()
      });

      await this.saveWallets();
      this.emitEvent('synced', walletId, { wallet });
    } catch (error: any) {
      console.error('同步钱包失败:', error);
      
      // 设置错误状态
      const wallet = this.wallets.get(walletId);
      if (wallet) {
        wallet.status = WalletStatus.ERROR;
      }
      
      this.syncStatus.set(walletId, {
        walletId,
        issyncing: false,
        progress: 0,
        error: error.message
      });
      
      this.emitEvent('error', walletId, { error });
      throw error;
    }
  }

  /**
   * 获取当前钱包
   */
  getCurrentWallet(): Wallet | null {
    if (!this.currentWalletId) return null;
    return this.wallets.get(this.currentWalletId) || null;
  }

  /**
   * 获取钱包
   */
  getWallet(walletId: string): Wallet | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * 获取所有钱包
   */
  getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * 获取钱包账户
   */
  getWalletAccounts(walletId: string): WalletAccount[] {
    const wallet = this.wallets.get(walletId);
    return wallet ? wallet.accounts : [];
  }

  /**
   * 获取账户
   */
  getAccount(walletId: string, accountId: string): WalletAccount | undefined {
    const wallet = this.wallets.get(walletId);
    if (!wallet) return undefined;
    return wallet.accounts.find(account => account.id === accountId);
  }

  /**
   * 添加账户
   */
  async addAccount(
    walletId: string, 
    chainType: ChainType, 
    name?: string,
    derivationIndex?: number
  ): Promise<string> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      if (wallet.type === WalletType.WATCH_ONLY) {
        throw new Error('只读钱包无法添加新账户');
      }

      const adapter = this.adapters.get(chainType);
      if (!adapter) {
        throw new Error(`不支持的链类型: ${chainType}`);
      }

      // 计算派生索引
      const index = derivationIndex ?? wallet.accounts.filter(a => a.chainType === chainType).length;
      
      // 生成新账户
      let accountData;
      if (wallet.type === WalletType.HD_WALLET) {
        // 这里需要从加密存储中获取助记词
        const mnemonic = 'mnemonic_placeholder'; // 实际应该解密获取
        accountData = await adapter.generateWallet(mnemonic, index.toString());
      } else {
        throw new Error('不支持的钱包类型');
      }

      const account: WalletAccount = {
        id: this.generateAccountId(),
        name: name || `${wallet.name} - ${chainType} ${index + 1}`,
        address: accountData.address,
        chainType,
        derivationPath: undefined, // generateWallet返回值没有derivationPath
        publicKey: undefined, // generateWallet返回值没有publicKey
        isDefault: wallet.accounts.filter(a => a.chainType === chainType).length === 0
      };

      wallet.accounts.push(account);
      await this.saveWallets();

      return account.id;
    } catch (error: any) {
      console.error('添加账户失败:', error);
      throw error;
    }
  }

  /**
   * 获取钱包统计
   */
  getWalletStats(): WalletStats {
    const wallets = Array.from(this.wallets.values());
    
    const stats: WalletStats = {
      totalWallets: wallets.length,
      activeWallets: wallets.filter(w => w.status === WalletStatus.ACTIVE).length,
      totalAccounts: wallets.reduce((sum, w) => sum + w.accounts.length, 0),
      totalBalance: {},
      byType: {},
      byChain: {}
    };

    wallets.forEach(wallet => {
      // 按类型统计
      stats.byType[wallet.type] = (stats.byType[wallet.type] || 0) + 1;

      // 按链统计
      wallet.chainTypes.forEach(chainType => {
        stats.byChain[chainType] = (stats.byChain[chainType] || 0) + 1;
      });

      // 余额统计
      wallet.accounts.forEach(account => {
        if (account.balance) {
          const chainType = account.chainType;
          if (!stats.totalBalance[chainType]) {
            stats.totalBalance[chainType] = '0';
          }
          // 这里应该进行实际的余额累加
          // stats.totalBalance[chainType] = addBalance(stats.totalBalance[chainType], account.balance);
        }
      });
    });

    return stats;
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(walletId: string): WalletSyncStatus | undefined {
    return this.syncStatus.get(walletId);
  }

  /**
   * 验证导入数据
   */
  private async validateImportData(
    importType: ImportType, 
    data: string, 
    password?: string
  ): Promise<void> {
    switch (importType) {
      case ImportType.MNEMONIC:
        if (!await this.securityService.validateMnemonic(data)) {
          throw new Error('无效的助记词');
        }
        break;
      case ImportType.PRIVATE_KEY:
        // 验证私钥格式
        if (!/^[0-9a-fA-F]{64}$/.test(data.replace('0x', ''))) {
          throw new Error('无效的私钥格式');
        }
        break;
      case ImportType.KEYSTORE:
        try {
          JSON.parse(data);
          if (!password) {
            throw new Error('导入keystore需要密码');
          }
        } catch {
          throw new Error('无效的keystore格式');
        }
        break;
      case ImportType.WATCH_ADDRESS:
        // 地址验证将在创建账户时进行
        break;
      default:
        throw new Error(`不支持的导入类型: ${importType}`);
    }
  }

  /**
   * 根据导入类型获取钱包类型
   */
  private getWalletTypeFromImportType(importType: ImportType): WalletType {
    switch (importType) {
      case ImportType.MNEMONIC:
        return WalletType.HD_WALLET;
      case ImportType.PRIVATE_KEY:
      case ImportType.KEYSTORE:
        return WalletType.IMPORTED_WALLET;
      case ImportType.HARDWARE:
        return WalletType.HARDWARE_WALLET;
      case ImportType.WATCH_ADDRESS:
        return WalletType.WATCH_ONLY;
      default:
        return WalletType.IMPORTED_WALLET;
    }
  }

  /**
   * 设置默认钱包
   */
  private async setDefaultWallet(): Promise<void> {
    if (this.wallets.size === 0) return;

    // 查找默认钱包
    let defaultWallet = Array.from(this.wallets.values()).find(w => w.isDefault);
    
    // 如果没有默认钱包，设置第一个为默认
    if (!defaultWallet) {
      defaultWallet = Array.from(this.wallets.values())[0];
      defaultWallet.isDefault = true;
      await this.saveWallets();
    }

    this.currentWalletId = defaultWallet.id;
  }

  /**
   * 加载钱包
   */
  private async loadWallets(): Promise<void> {
    try {
      // 这里应该从持久化存储中加载钱包数据
      // const walletsData = await this.storage.getItem('wallets');
      // if (walletsData) {
      //   const wallets = JSON.parse(walletsData);
      //   wallets.forEach(wallet => this.wallets.set(wallet.id, wallet));
      // }
      console.log('钱包数据加载完成');
    } catch (error: any) {
      console.error('加载钱包数据失败:', error);
    }
  }

  /**
   * 保存钱包
   */
  private async saveWallets(): Promise<void> {
    try {
      // 这里应该将钱包数据保存到持久化存储
      // const walletsData = JSON.stringify(Array.from(this.wallets.values()));
      // await this.storage.setItem('wallets', walletsData);
      console.log('钱包数据保存完成');
    } catch (error: any) {
      console.error('保存钱包数据失败:', error);
    }
  }

  /**
   * 生成钱包ID
   */
  private generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成账户ID
   */
  private generateAccountId(): string {
    return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: string, walletId: string, data: any): void {
    const event: WalletEvent = {
      type: type as any,
      walletId,
      timestamp: new Date().toISOString(),
      data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('钱包事件监听器执行失败:', error);
        }
      });
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.wallets.clear();
    this.adapters.clear();
    this.eventListeners.clear();
    this.syncStatus.clear();
    this.currentWalletId = null;
    this.isInitialized = false;
  }
}