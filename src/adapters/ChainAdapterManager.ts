/**
 * 链适配器管理器
 * 统一管理所有链适配器和相关服务
 */

import { ChainType, ChainAdapter } from '../types/chain';
import { ServiceManager } from '../services';

/**
 * 链适配器配置
 */
export interface ChainAdapterConfig {
  chainType: ChainType;
  adapter: ChainAdapter;
  enabled: boolean;
  priority: number;
  rpcEndpoints: string[];
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * 链适配器状态
 */
export enum AdapterStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * 链适配器事件类型
 */
export enum AdapterEventType {
  ADAPTER_ADDED = 'adapter_added',
  ADAPTER_REMOVED = 'adapter_removed',
  ADAPTER_CONNECTED = 'adapter_connected',
  ADAPTER_DISCONNECTED = 'adapter_disconnected',
  ADAPTER_ERROR = 'adapter_error',
  CHAIN_SWITCHED = 'chain_switched'
}

/**
 * 链适配器事件
 */
export interface AdapterEvent {
  type: AdapterEventType;
  chainType: ChainType;
  data?: any;
  timestamp: number;
}

/**
 * 链适配器统计信息
 */
export interface AdapterStats {
  totalAdapters: number;
  connectedAdapters: number;
  activeChains: ChainType[];
  totalTransactions: number;
  totalAccounts: number;
  lastActivity: number;
}

/**
 * 链适配器管理器类
 */
export class ChainAdapterManager {
  private adapters: Map<ChainType, ChainAdapterConfig> = new Map();
  private adapterStatus: Map<ChainType, AdapterStatus> = new Map();
  private currentChain: ChainType | null = null;
  private eventListeners: Map<AdapterEventType, Function[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    Object.values(AdapterEventType).forEach(eventType => {
      this.eventListeners.set(eventType, []);
    });
  }

  /**
   * 初始化适配器管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化服务管理器
      await ServiceManager.initialize();

      // 注册默认适配器
      await this.registerDefaultAdapters();

      // 连接到默认链
      await this.connectToDefaultChain();

      this.isInitialized = true;
      console.log('链适配器管理器初始化完成');
    } catch (error: any) {
      console.error('链适配器管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册默认适配器
   */
  private async registerDefaultAdapters(): Promise<void> {
    // 注册EVM适配器
    const { EVMAdapter } = await import('./EVMAdapter');
    const evmConfig = {
      id: 'ethereum-mainnet',
      name: 'Ethereum Mainnet',
      type: ChainType.EVM,
      category: 'mainnet' as any,
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      chainId: 1,
      symbol: 'ETH',
      decimals: 18,
      blockExplorerUrl: 'https://etherscan.io',
      isTestnet: false
    };
    await this.registerAdapter({
      chainType: ChainType.EVM,
      adapter: new EVMAdapter(evmConfig),
      enabled: true,
      priority: 1,
      rpcEndpoints: [
        'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY'
      ],
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
      }
    });

    // 注册Solana适配器
    const { SolanaAdapter } = await import('./SolanaAdapter');
    const solanaConfig = {
      id: 'solana-mainnet',
      name: 'Solana Mainnet',
      type: ChainType.SOLANA,
      category: 'mainnet' as any,
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      symbol: 'SOL',
      decimals: 9,
      blockExplorerUrl: 'https://explorer.solana.com',
      isTestnet: false
    };
    await this.registerAdapter({
      chainType: ChainType.SOLANA,
      adapter: new SolanaAdapter(solanaConfig),
      enabled: true,
      priority: 2,
      rpcEndpoints: [
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com'
      ],
      explorerUrl: 'https://explorer.solana.com',
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9
      }
    });

    // 注册Aptos适配器
    const { AptosAdapter } = await import('./AptosAdapter');
    const aptosConfig = {
      id: 'aptos-mainnet',
      name: 'Aptos Mainnet',
      type: ChainType.APTOS,
      category: 'mainnet' as any,
      rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
      symbol: 'APT',
      decimals: 8,
      blockExplorerUrl: 'https://explorer.aptoslabs.com',
      isTestnet: false
    };
    await this.registerAdapter({
      chainType: ChainType.APTOS,
      adapter: new AptosAdapter(aptosConfig),
      enabled: true,
      priority: 3,
      rpcEndpoints: [
        'https://fullnode.mainnet.aptoslabs.com/v1',
        'https://mainnet.aptosdev.com'
      ],
      explorerUrl: 'https://explorer.aptoslabs.com',
      nativeCurrency: {
        name: 'Aptos',
        symbol: 'APT',
        decimals: 8
      }
    });
  }

  /**
   * 连接到默认链
   */
  private async connectToDefaultChain(): Promise<void> {
    // 默认连接到EVM链
    if (this.adapters.has(ChainType.EVM)) {
      await this.switchChain(ChainType.EVM);
    }
  }

  /**
   * 注册链适配器
   */
  async registerAdapter(config: ChainAdapterConfig): Promise<void> {
    try {
      // 验证适配器
      await this.validateAdapter(config.adapter);

      // 注册适配器
      this.adapters.set(config.chainType, config);
      this.adapterStatus.set(config.chainType, AdapterStatus.DISCONNECTED);

      // 触发事件
      this.emitEvent({
        type: AdapterEventType.ADAPTER_ADDED,
        chainType: config.chainType,
        data: config,
        timestamp: Date.now()
      });

      console.log(`链适配器 ${config.chainType} 注册成功`);
    } catch (error: any) {
      console.error(`注册链适配器 ${config.chainType} 失败:`, error);
      throw error;
    }
  }

  /**
   * 验证适配器
   */
  private async validateAdapter(adapter: ChainAdapter): Promise<void> {
    // 检查必要方法
    const requiredMethods = [
      'getBalance',
      'sendTransaction',
      'generateWallet',
      'getChainConfig',
      'validateAddress'
    ];

    for (const method of requiredMethods) {
      if (typeof (adapter as any)[method] !== 'function') {
        throw new Error(`适配器缺少必要方法: ${method}`);
      }
    }
  }

  /**
   * 测试适配器连接
   */
  private async testAdapterConnection(config: ChainAdapterConfig): Promise<void> {
    try {
      // 测试适配器基本功能
      const chainConfig = config.adapter.getChainConfig();
      if (!chainConfig) {
        throw new Error('无法获取链配置');
      }

      // 可以添加更多连接测试逻辑
      console.log(`测试适配器连接: ${chainConfig.name}`);
    } catch (error: any) {
      throw new Error(`适配器连接测试失败: ${error.message}`);
    }
  }

  /**
   * 移除链适配器
   */
  async removeAdapter(chainType: ChainType): Promise<void> {
    const config = this.adapters.get(chainType);
    if (!config) {
      throw new Error(`链适配器 ${chainType} 不存在`);
    }

    try {
      // 断开连接
      if (this.adapterStatus.get(chainType) === AdapterStatus.CONNECTED) {
        await this.disconnectAdapter(chainType);
      }

      // 移除适配器
      this.adapters.delete(chainType);
      this.adapterStatus.delete(chainType);

      // 如果是当前链，切换到其他链
      if (this.currentChain === chainType) {
        const availableChains = Array.from(this.adapters.keys());
        if (availableChains.length > 0) {
          await this.switchChain(availableChains[0]);
        } else {
          this.currentChain = null;
        }
      }

      // 触发事件
      this.emitEvent({
        type: AdapterEventType.ADAPTER_REMOVED,
        chainType,
        timestamp: Date.now()
      });

      console.log(`链适配器 ${chainType} 移除成功`);
    } catch (error: any) {
      console.error(`移除链适配器 ${chainType} 失败:`, error);
      throw error;
    }
  }

  /**
   * 连接适配器
   */
  async connectAdapter(chainType: ChainType): Promise<void> {
    const config = this.adapters.get(chainType);
    if (!config) {
      throw new Error(`链适配器 ${chainType} 不存在`);
    }

    if (!config.enabled) {
      throw new Error(`链适配器 ${chainType} 已禁用`);
    }

    try {
      this.adapterStatus.set(chainType, AdapterStatus.CONNECTING);

      // 模拟连接过程（ChainAdapter接口没有connect方法）
      // 可以在这里添加连接逻辑，比如测试RPC连接
      await this.testAdapterConnection(config);

      this.adapterStatus.set(chainType, AdapterStatus.CONNECTED);

      // 触发事件
      this.emitEvent({
        type: AdapterEventType.ADAPTER_CONNECTED,
        chainType,
        timestamp: Date.now()
      });

      console.log(`链适配器 ${chainType} 连接成功`);
    } catch (error: any) {
      this.adapterStatus.set(chainType, AdapterStatus.ERROR);

      // 触发错误事件
      this.emitEvent({
        type: AdapterEventType.ADAPTER_ERROR,
        chainType,
        data: { error: error.message },
        timestamp: Date.now()
      });

      console.error(`连接链适配器 ${chainType} 失败:`, error);
      throw error;
    }
  }

  /**
   * 断开适配器连接
   */
  async disconnectAdapter(chainType: ChainType): Promise<void> {
    const config = this.adapters.get(chainType);
    if (!config) {
      throw new Error(`链适配器 ${chainType} 不存在`);
    }

    try {
      // 模拟断开连接（ChainAdapter接口没有disconnect方法）
      // 可以在这里添加断开连接逻辑
      
      this.adapterStatus.set(chainType, AdapterStatus.DISCONNECTED);

      // 触发事件
      this.emitEvent({
        type: AdapterEventType.ADAPTER_DISCONNECTED,
        chainType,
        timestamp: Date.now()
      });

      console.log(`链适配器 ${chainType} 断开连接`);
    } catch (error: any) {
      console.error(`断开链适配器 ${chainType} 连接失败:`, error);
      throw error;
    }
  }

  /**
   * 切换链
   */
  async switchChain(chainType: ChainType): Promise<void> {
    const config = this.adapters.get(chainType);
    if (!config) {
      throw new Error(`链适配器 ${chainType} 不存在`);
    }

    try {
      // 连接新链
      if (this.adapterStatus.get(chainType) !== AdapterStatus.CONNECTED) {
        await this.connectAdapter(chainType);
      }

      const previousChain = this.currentChain;
      this.currentChain = chainType;

      // 触发事件
      this.emitEvent({
        type: AdapterEventType.CHAIN_SWITCHED,
        chainType,
        data: { previousChain },
        timestamp: Date.now()
      });

      console.log(`切换到链 ${chainType}`);
    } catch (error: any) {
      console.error(`切换到链 ${chainType} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取当前链适配器
   */
  getCurrentAdapter(): ChainAdapter | null {
    if (!this.currentChain) return null;
    
    const config = this.adapters.get(this.currentChain);
    return config ? config.adapter : null;
  }

  /**
   * 获取链适配器
   */
  getAdapter(chainType: ChainType): ChainAdapter | null {
    const config = this.adapters.get(chainType);
    return config ? config.adapter : null;
  }

  /**
   * 获取适配器配置
   */
  getAdapterConfig(chainType: ChainType): ChainAdapterConfig | null {
    return this.adapters.get(chainType) || null;
  }

  /**
   * 获取适配器状态
   */
  getAdapterStatus(chainType: ChainType): AdapterStatus {
    return this.adapterStatus.get(chainType) || AdapterStatus.DISCONNECTED;
  }

  /**
   * 获取当前链类型
   */
  getCurrentChain(): ChainType | null {
    return this.currentChain;
  }

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): ChainType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 获取已连接的链
   */
  getConnectedChains(): ChainType[] {
    return Array.from(this.adapterStatus.entries())
      .filter(([_, status]) => status === AdapterStatus.CONNECTED)
      .map(([chainType, _]) => chainType);
  }

  /**
   * 检查链是否支持
   */
  isChainSupported(chainType: ChainType): boolean {
    return this.adapters.has(chainType);
  }

  /**
   * 检查链是否已连接
   */
  isChainConnected(chainType: ChainType): boolean {
    return this.adapterStatus.get(chainType) === AdapterStatus.CONNECTED;
  }

  /**
   * 启用/禁用适配器
   */
  setAdapterEnabled(chainType: ChainType, enabled: boolean): void {
    const config = this.adapters.get(chainType);
    if (config) {
      config.enabled = enabled;
      console.log(`链适配器 ${chainType} ${enabled ? '启用' : '禁用'}`);
    }
  }

  /**
   * 获取适配器统计信息
   */
  getStats(): AdapterStats {
    const connectedAdapters = this.getConnectedChains().length;
    
    return {
      totalAdapters: this.adapters.size,
      connectedAdapters,
      activeChains: this.getConnectedChains(),
      totalTransactions: 0, // 需要从服务中获取
      totalAccounts: 0, // 需要从服务中获取
      lastActivity: Date.now()
    };
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: AdapterEventType, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: AdapterEventType, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: AdapterEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('事件监听器执行失败:', error);
      }
    });
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    try {
      // 断开所有连接
      for (const chainType of this.getConnectedChains()) {
        await this.disconnectAdapter(chainType);
      }

      // 清理数据
      this.adapters.clear();
      this.adapterStatus.clear();
      this.eventListeners.clear();
      this.currentChain = null;
      this.isInitialized = false;

      console.log('链适配器管理器已销毁');
    } catch (error: any) {
      console.error('销毁链适配器管理器失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const chainAdapterManager = new ChainAdapterManager();
export default chainAdapterManager;