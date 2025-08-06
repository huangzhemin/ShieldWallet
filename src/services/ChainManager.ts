import { ChainAdapter, ChainConfig, ChainType, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';
import { EVMAdapter } from '../adapters/EVMAdapter';
import { SolanaAdapter } from '../adapters/SolanaAdapter';
import { AptosAdapter } from '../adapters/AptosAdapter';
import { CHAIN_CONFIGS, SUPPORTED_CHAINS } from '../config/chains';

/**
 * 多链管理器
 * 统一管理所有区块链适配器
 */
export class ChainManager {
  private adapters: Map<string, ChainAdapter> = new Map();
  private currentChainId: string = 'ethereum';

  constructor() {
    this.initializeAdapters();
  }

  /**
   * 初始化所有链适配器
   */
  private initializeAdapters(): void {
    Object.values(CHAIN_CONFIGS).forEach((chainConfig) => {
      let adapter: ChainAdapter;

      switch (chainConfig.type) {
        case ChainType.EVM:
          adapter = new EVMAdapter(chainConfig);
          break;
        case ChainType.SOLANA:
          adapter = new SolanaAdapter(chainConfig);
          break;
        case ChainType.APTOS:
          adapter = new AptosAdapter(chainConfig);
          break;
        default:
          console.warn(`不支持的链类型: ${chainConfig.type}`);
          return;
      }

      this.adapters.set(chainConfig.id, adapter);
    });
  }

  /**
   * 获取当前链适配器
   */
  getCurrentAdapter(): ChainAdapter {
    const adapter = this.adapters.get(this.currentChainId);
    if (!adapter) {
      throw new Error(`未找到链适配器: ${this.currentChainId}`);
    }
    return adapter;
  }

  /**
   * 获取指定链的适配器
   */
  getAdapter(chainId: string): ChainAdapter {
    const adapter = this.adapters.get(chainId);
    if (!adapter) {
      throw new Error(`未找到链适配器: ${chainId}`);
    }
    return adapter;
  }

  /**
   * 切换当前链
   */
  switchChain(chainId: string): void {
    if (!this.adapters.has(chainId)) {
      throw new Error(`不支持的链: ${chainId}`);
    }
    this.currentChainId = chainId;
  }

  /**
   * 获取当前链ID
   */
  getCurrentChainId(): string {
    return this.currentChainId;
  }

  /**
   * 获取当前链配置
   */
  getCurrentChainConfig(): ChainConfig {
    return this.getCurrentAdapter().getChainConfig();
  }

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): ChainConfig[] {
    return Object.values(CHAIN_CONFIGS);
  }

  /**
   * 检查是否支持指定链
   */
  isChainSupported(chainId: string): boolean {
    return this.adapters.has(chainId);
  }

  /**
   * 从助记词生成多链钱包
   */
  async generateMultiChainWallet(mnemonic: string): Promise<{ [chainId: string]: { address: string; privateKey: string } }> {
    const wallets: { [chainId: string]: { address: string; privateKey: string } } = {};

    for (const [chainId, adapter] of this.adapters) {
      try {
        const wallet = await adapter.generateWallet(mnemonic);
        wallets[chainId] = wallet;
      } catch (error: any) {
        console.error(`生成${chainId}钱包失败:`, error.message);
      }
    }

    return wallets;
  }

  /**
   * 获取多链余额
   */
  async getMultiChainBalances(addresses: { [chainId: string]: string }): Promise<{ [chainId: string]: string }> {
    const balances: { [chainId: string]: string } = {};

    for (const [chainId, address] of Object.entries(addresses)) {
      try {
        const adapter = this.getAdapter(chainId);
        const balance = await adapter.getBalance(address);
        balances[chainId] = balance;
      } catch (error: any) {
        console.error(`获取${chainId}余额失败:`, error.message);
        balances[chainId] = '0';
      }
    }

    return balances;
  }

  /**
   * 获取当前链余额
   */
  async getBalance(address: string): Promise<string> {
    return this.getCurrentAdapter().getBalance(address);
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(address: string, tokenAddress: string, chainId?: string): Promise<string> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.getTokenBalance(address, tokenAddress);
  }

  /**
   * 估算交易费用
   */
  async estimateGas(params: TransactionParams, chainId?: string): Promise<GasEstimate> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.estimateGas(params);
  }

  /**
   * 发送交易
   */
  async sendTransaction(params: TransactionParams, privateKey: string, chainId?: string): Promise<TransactionResult> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.sendTransaction(params, privateKey);
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(hash: string, chainId?: string): Promise<TransactionResult> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.getTransactionStatus(hash);
  }

  /**
   * 获取NFT列表
   */
  async getNFTs(address: string, chainId?: string): Promise<NFTInfo[]> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.getNFTs(address);
  }

  /**
   * 获取多链NFT
   */
  async getMultiChainNFTs(addresses: { [chainId: string]: string }): Promise<NFTInfo[]> {
    const allNFTs: NFTInfo[] = [];

    for (const [chainId, address] of Object.entries(addresses)) {
      try {
        const adapter = this.getAdapter(chainId);
        const nfts = await adapter.getNFTs(address);
        allNFTs.push(...nfts);
      } catch (error: any) {
        console.error(`获取${chainId} NFT失败:`, error.message);
      }
    }

    return allNFTs;
  }

  /**
   * 验证地址格式
   */
  validateAddress(address: string, chainId?: string): boolean {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.validateAddress(address);
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address: string, limit: number = 20, chainId?: string): Promise<any[]> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    if ('getTransactionHistory' in adapter) {
      return (adapter as any).getTransactionHistory(address, limit);
    }
    throw new Error('当前链不支持交易历史查询');
  }

  /**
   * 模拟交易执行
   */
  async simulateTransaction(params: TransactionParams, fromAddress: string, chainId?: string): Promise<any> {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    if ('simulateTransaction' in adapter) {
      return (adapter as any).simulateTransaction(params, fromAddress);
    }
    throw new Error('当前链不支持交易模拟');
  }

  /**
   * 获取链类型
   */
  getChainType(chainId?: string): ChainType {
    const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
    return adapter.getChainConfig().type;
  }

  /**
   * 检查是否为EVM链
   */
  isEVMChain(chainId?: string): boolean {
    return this.getChainType(chainId) === ChainType.EVM;
  }

  /**
   * 检查是否为Solana链
   */
  isSolanaChain(chainId?: string): boolean {
    return this.getChainType(chainId) === ChainType.SOLANA;
  }

  /**
   * 检查是否为Aptos链
   */
  isAptosChain(chainId?: string): boolean {
    return this.getChainType(chainId) === ChainType.APTOS;
  }

  /**
   * 获取链的原生代币符号
   */
  getNativeTokenSymbol(chainId?: string): string {
    const config = chainId ? this.getAdapter(chainId).getChainConfig() : this.getCurrentChainConfig();
    return config.symbol || 'ETH';
  }

  /**
   * 获取链的原生代币精度
   */
  getNativeTokenDecimals(chainId?: string): number {
    const config = chainId ? this.getAdapter(chainId).getChainConfig() : this.getCurrentChainConfig();
    return 18; // 默认18位小数
  }

  /**
   * 格式化金额
   */
  formatAmount(amount: string, decimals?: number, chainId?: string): string {
    const tokenDecimals = decimals || this.getNativeTokenDecimals(chainId);
    const num = parseFloat(amount);
    return num.toFixed(Math.min(tokenDecimals, 6));
  }

  /**
   * 解析金额（从用户输入转换为最小单位）
   */
  parseAmount(amount: string, decimals?: number, chainId?: string): string {
    const tokenDecimals = decimals || this.getNativeTokenDecimals(chainId);
    const num = parseFloat(amount);
    return Math.floor(num * Math.pow(10, tokenDecimals)).toString();
  }
}

// 导出单例实例
export const chainManager = new ChainManager();