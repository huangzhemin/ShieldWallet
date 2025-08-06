import { ChainAdapter, ChainConfig, ChainType, TransactionParams, TransactionResult, GasEstimate, NFTInfo, AccountInfo, TokenBalance } from '../types/chain';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { CHAIN_CONFIGS, getChainConfig } from '../config/chains';

/**
 * 多链钱包管理器
 * 统一管理所有支持的区块链网络
 */
export class MultiChainWalletManager {
  private adapters: Map<string, ChainAdapter> = new Map();
  private wallets: Map<string, { address: string; privateKey: string }> = new Map();
  private currentChain: string = 'ethereum';

  constructor() {
    this.initializeAdapters();
  }

  /**
   * 初始化所有支持的链适配器
   */
  private initializeAdapters(): void {
    Object.values(CHAIN_CONFIGS).forEach(config => {
      try {
        const adapter = AdapterFactory.createAdapter(config);
        this.adapters.set(config.id, adapter);
      } catch (error) {
        console.warn(`Failed to initialize adapter for ${config.name}:`, error);
      }
    });
  }

  /**
   * 获取指定链的适配器
   */
  getAdapter(chainId: string): ChainAdapter {
    const adapter = this.adapters.get(chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${chainId}`);
    }
    return adapter;
  }

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): ChainConfig[] {
    return Array.from(this.adapters.values()).map(adapter => adapter.getChainConfig());
  }

  /**
   * 设置当前活跃链
   */
  setCurrentChain(chainId: string): void {
    if (!this.adapters.has(chainId)) {
      throw new Error(`不支持的链: ${chainId}`);
    }
    this.currentChain = chainId;
  }

  /**
   * 获取当前活跃链
   */
  getCurrentChain(): string {
    return this.currentChain;
  }

  /**
   * 获取当前链的适配器
   */
  getCurrentAdapter(): ChainAdapter {
    return this.getAdapter(this.currentChain);
  }

  /**
   * 从助记词生成所有链的钱包
   */
  async generateWalletsFromMnemonic(mnemonic: string): Promise<{ [chainId: string]: { address: string; privateKey: string } }> {
    const wallets: { [chainId: string]: { address: string; privateKey: string } } = {};
    
    for (const [chainId, adapter] of this.adapters) {
      try {
        const wallet = await adapter.generateWallet(mnemonic);
        wallets[chainId] = wallet;
        this.wallets.set(chainId, wallet);
      } catch (error) {
        console.error(`Failed to generate wallet for ${chainId}:`, error);
      }
    }
    
    return wallets;
  }

  /**
   * 获取指定链的钱包
   */
  getWallet(chainId: string): { address: string; privateKey: string } | undefined {
    return this.wallets.get(chainId);
  }

  /**
   * 获取所有钱包地址
   */
  getAllWalletAddresses(): { [chainId: string]: string } {
    const addresses: { [chainId: string]: string } = {};
    for (const [chainId, wallet] of this.wallets) {
      addresses[chainId] = wallet.address;
    }
    return addresses;
  }

  /**
   * 获取指定链和地址的余额
   */
  async getBalance(chainId: string, address: string): Promise<string> {
    const adapter = this.getAdapter(chainId);
    return await adapter.getBalance(address);
  }

  /**
   * 获取所有链的余额
   */
  async getAllBalances(): Promise<{ [chainId: string]: string }> {
    const balances: { [chainId: string]: string } = {};
    
    for (const [chainId, wallet] of this.wallets) {
      try {
        const balance = await this.getBalance(chainId, wallet.address);
        balances[chainId] = balance;
      } catch (error) {
        console.error(`Failed to get balance for ${chainId}:`, error);
        balances[chainId] = '0';
      }
    }
    
    return balances;
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(chainId: string, address: string, tokenAddress: string): Promise<string> {
    const adapter = this.getAdapter(chainId);
    return await adapter.getTokenBalance(address, tokenAddress);
  }

  /**
   * 估算Gas费用
   */
  async estimateGas(chainId: string, params: TransactionParams): Promise<GasEstimate> {
    const adapter = this.getAdapter(chainId);
    return await adapter.estimateGas(params);
  }

  /**
   * 发送交易
   */
  async sendTransaction(chainId: string, params: TransactionParams): Promise<TransactionResult> {
    const adapter = this.getAdapter(chainId);
    const wallet = this.getWallet(chainId);
    
    if (!wallet) {
      throw new Error(`未找到${chainId}链的钱包`);
    }
    
    return await adapter.sendTransaction(params, wallet.privateKey);
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(chainId: string, hash: string): Promise<TransactionResult> {
    const adapter = this.getAdapter(chainId);
    return await adapter.getTransactionStatus(hash);
  }

  /**
   * 获取NFT列表
   */
  async getNFTs(chainId: string, address: string): Promise<NFTInfo[]> {
    const adapter = this.getAdapter(chainId);
    return await adapter.getNFTs(address);
  }

  /**
   * 获取所有链的NFT
   */
  async getAllNFTs(): Promise<{ [chainId: string]: NFTInfo[] }> {
    const nfts: { [chainId: string]: NFTInfo[] } = {};
    
    for (const [chainId, wallet] of this.wallets) {
      try {
        const chainNFTs = await this.getNFTs(chainId, wallet.address);
        nfts[chainId] = chainNFTs;
      } catch (error) {
        console.error(`Failed to get NFTs for ${chainId}:`, error);
        nfts[chainId] = [];
      }
    }
    
    return nfts;
  }

  /**
   * 验证地址格式
   */
  validateAddress(chainId: string, address: string): boolean {
    const adapter = this.getAdapter(chainId);
    return adapter.validateAddress(address);
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo(chainId: string, address: string): Promise<AccountInfo> {
    const adapter = this.getAdapter(chainId);
    const balance = await adapter.getBalance(address);
    
    return {
      address,
      balance,
      nativeBalance: balance,
      tokens: [] // 可以扩展为获取所有代币余额
    };
  }

  /**
   * 获取链配置
   */
  getChainConfig(chainId: string): ChainConfig {
    const config = getChainConfig(chainId);
    if (!config) {
      throw new Error(`未找到链配置: ${chainId}`);
    }
    return config;
  }

  /**
   * 根据类型获取链列表
   */
  getChainsByType(type: ChainType): ChainConfig[] {
    return this.getSupportedChains().filter(config => config.type === type);
  }

  /**
   * 获取主网链列表
   */
  getMainnetChains(): ChainConfig[] {
    return this.getSupportedChains().filter(config => !config.isTestnet);
  }

  /**
   * 获取测试网链列表
   */
  getTestnetChains(): ChainConfig[] {
    return this.getSupportedChains().filter(config => config.isTestnet);
  }

  /**
   * 清除所有钱包数据
   */
  clearWallets(): void {
    this.wallets.clear();
  }

  /**
   * 检查是否已初始化钱包
   */
  hasWallets(): boolean {
    return this.wallets.size > 0;
  }

  /**
   * 获取钱包统计信息
   */
  getWalletStats(): {
    totalChains: number;
    supportedChains: number;
    initializedWallets: number;
    evmChains: number;
    nonEvmChains: number;
  } {
    const supportedChains = this.getSupportedChains();
    const evmChains = supportedChains.filter(config => config.type === ChainType.EVM).length;
    
    return {
      totalChains: Object.keys(CHAIN_CONFIGS).length,
      supportedChains: supportedChains.length,
      initializedWallets: this.wallets.size,
      evmChains,
      nonEvmChains: supportedChains.length - evmChains
    };
  }
}

// 导出单例实例
export const multiChainWalletManager = new MultiChainWalletManager();