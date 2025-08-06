import { ChainAdapter, ChainConfig, ChainType } from '../types/chain';
import { EVMAdapter } from './EVMAdapter';
import { SolanaAdapter } from './SolanaAdapter';
import { AptosAdapter } from './AptosAdapter';
import { PolygonAdapter } from './PolygonAdapter';
import { ArbitrumAdapter } from './ArbitrumAdapter';
import { zkSyncAdapter } from './zkSyncAdapter';
import { OptimismAdapter } from './OptimismAdapter';
import { BSCAdapter } from './BSCAdapter';

/**
 * 适配器工厂类
 * 负责创建和管理不同链的适配器实例
 */
export class AdapterFactory {
  private static adapters: Map<string, ChainAdapter> = new Map();

  /**
   * 创建链适配器
   */
  static createAdapter(config: ChainConfig): ChainAdapter {
    const key = `${config.type}-${config.id}`;
    
    // 如果已存在适配器实例，直接返回
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    let adapter: ChainAdapter;

    switch (config.type) {
      case ChainType.EVM:
        adapter = this.createEVMAdapter(config);
        break;
      case ChainType.SOLANA:
        adapter = new SolanaAdapter(config);
        break;
      case ChainType.APTOS:
        adapter = new AptosAdapter(config);
        break;
      default:
        throw new Error(`不支持的链类型: ${config.type}`);
    }

    // 缓存适配器实例
    this.adapters.set(key, adapter);
    return adapter;
  }

  /**
   * 创建EVM类型的适配器
   */
  private static createEVMAdapter(config: ChainConfig): ChainAdapter {
    switch (config.id) {
      case 'ethereum':
      case 'ethereum-goerli':
      case 'ethereum-sepolia':
        return new EVMAdapter(config);
      
      case 'polygon':
      case 'polygon-mumbai':
        return new PolygonAdapter(config);
      
      case 'arbitrum':
      case 'arbitrum-goerli':
      case 'arbitrum-nova':
        return new ArbitrumAdapter(config);
      
      case 'zksync':
      case 'zksync-testnet':
        return new zkSyncAdapter(config);
      
      case 'optimism':
      case 'optimism-goerli':
        return new OptimismAdapter(config);
      
      case 'bsc':
      case 'bsc-testnet':
        return new BSCAdapter(config);
      
      default:
        // 对于其他EVM兼容链，使用通用EVMAdapter
        return new EVMAdapter(config);
    }
  }

  /**
   * 获取已创建的适配器
   */
  static getAdapter(chainType: ChainType, chainId: string): ChainAdapter | undefined {
    const key = `${chainType}-${chainId}`;
    return this.adapters.get(key);
  }

  /**
   * 移除适配器实例
   */
  static removeAdapter(chainType: ChainType, chainId: string): boolean {
    const key = `${chainType}-${chainId}`;
    return this.adapters.delete(key);
  }

  /**
   * 清空所有适配器实例
   */
  static clearAdapters(): void {
    this.adapters.clear();
  }

  /**
   * 获取所有已创建的适配器
   */
  static getAllAdapters(): ChainAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * 检查是否支持指定链
   */
  static isChainSupported(chainType: ChainType, chainId?: string): boolean {
    switch (chainType) {
      case ChainType.EVM:
        return true; // EVM链都支持
      case ChainType.SOLANA:
        return true;
      case ChainType.APTOS:
        return true;
      default:
        return false;
    }
  }

  /**
   * 获取支持的链列表
   */
  static getSupportedChains(): string[] {
    return [
      // Ethereum
      'ethereum',
      'ethereum-goerli',
      'ethereum-sepolia',
      
      // Polygon
      'polygon',
      'polygon-mumbai',
      
      // Arbitrum
      'arbitrum',
      'arbitrum-goerli',
      'arbitrum-nova',
      
      // zkSync
      'zksync',
      'zksync-testnet',
      
      // Optimism
      'optimism',
      'optimism-goerli',
      
      // BSC
      'bsc',
      'bsc-testnet',
      
      // Solana
      'solana',
      'solana-devnet',
      
      // Aptos
      'aptos',
      'aptos-testnet'
    ];
  }

  /**
   * 批量创建适配器
   */
  static createMultipleAdapters(configs: ChainConfig[]): ChainAdapter[] {
    return configs.map(config => this.createAdapter(config));
  }

  /**
   * 验证链配置
   */
  static validateChainConfig(config: ChainConfig): boolean {
    try {
      // 基本字段验证
      if (!config.id || !config.name || !config.type || !config.rpcUrl) {
        return false;
      }

      // URL格式验证
      new URL(config.rpcUrl);

      // EVM链需要chainId
      if (config.type === ChainType.EVM && !config.chainId) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}