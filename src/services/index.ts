/**
 * 服务模块统一导出
 * 提供所有服务类和相关类型的统一入口
 */

// DeFi协议服务
export {
  DeFiProtocolService,
  DeFiProtocol,
  DEXProtocol,
  LendingProtocol,
  SwapParams,
  LiquidityParams,
  RemoveLiquidityParams,
  SupplyParams,
  WithdrawParams,
  BorrowParams,
  RepayParams,
  UniswapV3Protocol,
  PancakeSwapProtocol,
  AaveProtocol,
  CompoundProtocol
} from './DeFiProtocolService';

// NFT服务
export {
  NFTService,
  NFTMetadata,
  ExtendedNFTInfo,
  NFTCollection,
  NFTTransferParams,
  NFTMintParams,
  NFTApprovalParams,
  NFTMarketOrder
} from './NFTService';

// 网络服务 - 暂时注释，因为文件不存在
// export {
//   NetworkService,
//   NetworkStatus,
//   NetworkLatency,
//   NetworkStats,
//   NetworkHealth,
//   RPCEndpoint,
//   ExtendedChainConfig
// } from './NetworkService';

// 通知服务
export {
  NotificationService,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  Notification,
  NotificationSettings,
  NotificationTemplate,
  NotificationStats,
  NotificationEvent
} from './NotificationService';

// 价格服务
export {
  PriceService,
  PriceData,
  PriceHistoryPoint,
  PriceHistory,
  PriceTimeframe,
  PriceProvider,
  PriceAlert,
  MarketData
} from './PriceService';

// 安全服务
export {
  SecurityService,
  EncryptionConfig,
  WalletBackup,
  SecurityPolicy,
  BiometricType,
  SecurityEventType,
  SecurityEvent
} from './SecurityService';

// 存储服务
export {
  StorageService,
  StorageType,
  StorageOptions,
  StorageItem,
  StorageStats,
  StorageEvent,
  StorageConfig
} from './StorageService';

// 交易服务
export {
  TransactionService,
  TransactionStatus,
  TransactionType,
  TransactionPriority,
  TransactionEventType,
  TransactionRecord,
  TransactionFeeEstimate,
  TransactionBatch,
  TransactionFilter,
  TransactionStats,
  TransactionEvent
} from './TransactionService';

// 钱包管理服务
export {
  WalletManagerService,
  WalletType,
  WalletStatus,
  ImportType,
  WalletAccount,
  Wallet,
  CreateWalletParams,
  ImportWalletParams,
  ExportWalletParams,
  WalletSyncStatus,
  WalletStats,
  WalletEvent
} from './WalletManagerService';

/**
 * 服务工厂类
 * 用于创建和管理所有服务实例
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * 获取服务工厂单例
   */
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 导入服务类
      const { SecurityService } = await import('./SecurityService');
      const { StorageService } = await import('./StorageService');
      const { NotificationService } = await import('./NotificationService');
      const { WalletManagerService } = await import('./WalletManagerService');
      const { PriceService } = await import('./PriceService');
      const { TransactionService } = await import('./TransactionService');
      const { NFTService } = await import('./NFTService');
      const { DeFiProtocolService } = await import('./DeFiProtocolService');
      
      // 创建基础服务
      const securityService = new SecurityService();
      const storageService = new StorageService();
      const notificationService = new NotificationService();
      
      // 初始化基础服务
      await storageService.initialize();
      
      // 创建依赖服务
      const walletManagerService = new WalletManagerService(
        securityService,
        notificationService
      );
      const priceService = new PriceService();
      const transactionService = new TransactionService();
      const nftService = new NFTService();
      
      // DeFiProtocolService需要MultiChainWalletManager参数，暂时传null
      const defiService = new DeFiProtocolService(null as any);
      
      // 初始化依赖服务
      await walletManagerService.initialize();
      // 其他服务暂时不需要初始化方法
      
      // 注册服务
      this.services.set('security', securityService);
      this.services.set('storage', storageService);
      this.services.set('notification', notificationService);
      this.services.set('walletManager', walletManagerService);
      this.services.set('price', priceService);
      this.services.set('transaction', transactionService);
      this.services.set('nft', nftService);
      this.services.set('defi', defiService);
      
      this.isInitialized = true;
      console.log('所有服务初始化完成');
    } catch (error: any) {
      console.error('服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取服务实例
   */
  getService<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`服务 ${serviceName} 未找到`);
    }
    return service as T;
  }

  /**
   * 获取安全服务
   */
  getSecurityService(): any {
    return this.getService('security');
  }

  /**
   * 获取存储服务
   */
  getStorageService(): any {
    return this.getService('storage');
  }

  /**
   * 获取通知服务
   */
  getNotificationService(): any {
    return this.getService('notification');
  }

  /**
   * 获取钱包管理服务
   */
  getWalletManagerService(): any {
    return this.getService('walletManager');
  }

  /**
   * 获取价格服务
   */
  getPriceService(): any {
    return this.getService('price');
  }

  /**
   * 获取交易服务
   */
  getTransactionService(): any {
    return this.getService('transaction');
  }

  /**
   * 获取NFT服务
   */
  getNFTService(): any {
    return this.getService('nft');
  }

  /**
   * 获取DeFi服务
   */
  getDeFiService(): any {
    return this.getService('defi');
  }

  /**
   * 检查服务是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 销毁所有服务
   */
  destroy(): void {
    for (const [name, service] of this.services) {
      if (service && typeof service.destroy === 'function') {
        try {
          service.destroy();
          console.log(`服务 ${name} 已销毁`);
        } catch (error) {
          console.error(`销毁服务 ${name} 失败:`, error);
        }
      }
    }
    
    this.services.clear();
    this.isInitialized = false;
  }
}

/**
 * 服务管理器
 * 提供全局服务访问接口
 */
export class ServiceManager {
  private static factory: ServiceFactory;

  /**
   * 初始化服务管理器
   */
  static async initialize(): Promise<void> {
    ServiceManager.factory = ServiceFactory.getInstance();
    await ServiceManager.factory.initialize();
  }

  /**
   * 获取服务工厂
   */
  static getFactory(): ServiceFactory {
    if (!ServiceManager.factory) {
      throw new Error('服务管理器未初始化，请先调用 initialize()');
    }
    return ServiceManager.factory;
  }

  /**
   * 获取安全服务
   */
  static getSecurityService(): any {
    return ServiceManager.getFactory().getSecurityService();
  }

  /**
   * 获取存储服务
   */
  static getStorageService(): any {
    return ServiceManager.getFactory().getStorageService();
  }

  /**
   * 获取通知服务
   */
  static getNotificationService(): any {
    return ServiceManager.getFactory().getNotificationService();
  }

  /**
   * 获取钱包管理服务
   */
  static getWalletManagerService(): any {
    return ServiceManager.getFactory().getWalletManagerService();
  }

  // 网络服务暂时不可用
  // static getNetworkService(): any {
  //   return ServiceManager.getFactory().getNetworkService();
  // }

  /**
   * 获取价格服务
   */
  static getPriceService(): any {
    return ServiceManager.getFactory().getPriceService();
  }

  /**
   * 获取交易服务
   */
  static getTransactionService(): any {
    return ServiceManager.getFactory().getTransactionService();
  }

  /**
   * 获取NFT服务
   */
  static getNFTService(): any {
    return ServiceManager.getFactory().getNFTService();
  }

  /**
   * 获取DeFi服务
   */
  static getDeFiService(): any {
    return ServiceManager.getFactory().getDeFiService();
  }

  /**
   * 销毁服务管理器
   */
  static destroy(): void {
    if (ServiceManager.factory) {
      ServiceManager.factory.destroy();
    }
  }
}

// 默认导出服务管理器
export default ServiceManager;