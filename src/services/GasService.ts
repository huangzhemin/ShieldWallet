import { ChainManager } from './ChainManager';
import { ChainType, TransactionParams, GasEstimate } from '../types/chain';
import { ethers } from 'ethers';

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
}

export interface GasEstimateResult {
  gasLimit: string;
  gasPrice: GasPrice;
  estimatedCost: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
  nativeTokenSymbol: string;
  estimatedTime: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
}

export interface SimulationResult {
  success: boolean;
  gasUsed?: string;
  error?: string;
  revertReason?: string;
  logs?: any[];
  returnValue?: string;
}

export class GasService {
  private chainManager: ChainManager;
  private gasPriceCache: Map<string, { data: GasPrice; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30秒缓存

  constructor(chainManager: ChainManager) {
    this.chainManager = chainManager;
  }

  /**
   * 获取指定链的Gas价格
   */
  async getGasPrice(chainId: string): Promise<GasPrice> {
    // 检查缓存
    const cached = this.gasPriceCache.get(chainId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const adapter = this.chainManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      let gasPrice: GasPrice;

      if (chainId === 'solana') {
        // Solana使用固定费用结构
        gasPrice = {
          slow: '5000',      // 0.000005 SOL
          standard: '5000',  // 0.000005 SOL
          fast: '5000',      // 0.000005 SOL
          instant: '5000'    // 0.000005 SOL
        };
      } else if (chainId === 'aptos') {
        // Aptos使用gas单位价格
        const basePrice = await this.getAptosGasPrice();
        gasPrice = {
          slow: (basePrice * 0.8).toString(),
          standard: basePrice.toString(),
          fast: (basePrice * 1.2).toString(),
          instant: (basePrice * 1.5).toString()
        };
      } else {
        // EVM链
        gasPrice = await this.getEVMGasPrice(chainId);
      }

      // 缓存结果
      this.gasPriceCache.set(chainId, {
        data: gasPrice,
        timestamp: Date.now()
      });

      return gasPrice;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw new Error('Failed to fetch gas price');
    }
  }

  /**
   * 估算交易Gas费用
   */
  async estimateGas(
    chainId: string,
    txParams: TransactionParams
  ): Promise<GasEstimateResult> {
    const adapter = this.chainManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      // 获取Gas限制
      const gasEstimate = await adapter.estimateGas(txParams);
      const gasLimit = gasEstimate.gasLimit;

      // 获取Gas价格
      const gasPrice = await this.getGasPrice(chainId);

      // 计算预估费用
      const estimatedCost = this.calculateGasCost(gasLimit, gasPrice);

      // 获取原生代币符号
      const nativeTokenSymbol = this.chainManager.getNativeTokenSymbol(chainId);

      // 预估确认时间
      const estimatedTime = this.getEstimatedTime(chainId);

      return {
        gasLimit,
        gasPrice,
        estimatedCost,
        nativeTokenSymbol,
        estimatedTime
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * 模拟交易执行
   */
  async simulateTransaction(
    chainId: string,
    txParams: TransactionParams
  ): Promise<SimulationResult> {
    const adapter = this.chainManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      if (chainId === ChainType.SOLANA) {
        return await this.simulateSolanaTransaction(txParams);
      } else if (chainId === ChainType.APTOS) {
        return await this.simulateAptosTransaction(txParams);
      } else {
        return await this.simulateEVMTransaction(chainId, txParams);
      }
    } catch (error) {
      console.error('Failed to simulate transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取EVM链的Gas价格
   */
  private async getEVMGasPrice(chainId: string): Promise<GasPrice> {
    const adapter = this.chainManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`Adapter not found for chain: ${chainId}`);
    }

    try {
      // 尝试获取EIP-1559费用数据
      if (chainId === 'ethereum' || chainId === 'polygon') {
        return await this.getEIP1559GasPrice(chainId);
      }

      // 传统Gas价格
      const provider = (adapter as any).provider;
      const gasPrice = await provider.getGasPrice();
      const basePriceWei = gasPrice.toString();
      const basePriceGwei = ethers.formatUnits(basePriceWei, 'gwei');
      const basePrice = parseFloat(basePriceGwei);

      return {
        slow: (basePrice * 0.8).toFixed(2),
        standard: basePrice.toFixed(2),
        fast: (basePrice * 1.2).toFixed(2),
        instant: (basePrice * 1.5).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get EVM gas price:', error);
      throw error;
    }
  }

  /**
   * 获取EIP-1559费用数据
   */
  private async getEIP1559GasPrice(chainId: string): Promise<GasPrice> {
    const adapter = this.chainManager.getAdapter(chainId);
    const provider = (adapter as any).provider;

    try {
      const feeData = await provider.getFeeData();
      const baseFee = feeData.lastBaseFeePerGas;
      const maxPriorityFee = feeData.maxPriorityFeePerGas;

      if (!baseFee || !maxPriorityFee) {
        // 回退到传统Gas价格
        return await this.getEVMGasPrice(chainId);
      }

      const baseFeeGwei = parseFloat(ethers.formatUnits(baseFee, 'gwei'));
      const priorityFeeGwei = parseFloat(ethers.formatUnits(maxPriorityFee, 'gwei'));

      return {
        slow: (baseFeeGwei + priorityFeeGwei * 0.5).toFixed(2),
        standard: (baseFeeGwei + priorityFeeGwei).toFixed(2),
        fast: (baseFeeGwei + priorityFeeGwei * 1.5).toFixed(2),
        instant: (baseFeeGwei + priorityFeeGwei * 2).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get EIP-1559 gas price:', error);
      return await this.getEVMGasPrice(chainId);
    }
  }

  /**
   * 获取Aptos Gas价格
   */
  private async getAptosGasPrice(): Promise<number> {
    try {
      // 这里应该调用Aptos节点API获取当前Gas价格
      // 暂时返回默认值
      return 100; // 100 gas units per transaction
    } catch (error) {
      console.error('Failed to get Aptos gas price:', error);
      return 100;
    }
  }

  /**
   * 计算Gas费用
   */
  private calculateGasCost(gasLimit: string, gasPrice: GasPrice): {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  } {
    const limit = parseFloat(gasLimit);

    return {
      slow: (limit * parseFloat(gasPrice.slow) / 1e9).toFixed(8),
      standard: (limit * parseFloat(gasPrice.standard) / 1e9).toFixed(8),
      fast: (limit * parseFloat(gasPrice.fast) / 1e9).toFixed(8),
      instant: (limit * parseFloat(gasPrice.instant) / 1e9).toFixed(8)
    };
  }

  /**
   * 获取预估确认时间
   */
  private getEstimatedTime(chainId: string): {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  } {
    const timeMap: Record<string, any> = {
      'ethereum': {
        slow: '5-10 min',
        standard: '2-5 min',
        fast: '1-2 min',
        instant: '< 1 min'
      },
      'polygon': {
        slow: '30-60 sec',
        standard: '15-30 sec',
        fast: '5-15 sec',
        instant: '< 5 sec'
      },
      'bsc': {
        slow: '10-20 sec',
        standard: '5-10 sec',
        fast: '3-5 sec',
        instant: '< 3 sec'
      },
      'arbitrum': {
        slow: '5-10 sec',
        standard: '2-5 sec',
        fast: '1-2 sec',
        instant: '< 1 sec'
      },
      'optimism': {
        slow: '5-10 sec',
        standard: '2-5 sec',
        fast: '1-2 sec',
        instant: '< 1 sec'
      },
      'zksync': {
        slow: '10-20 sec',
        standard: '5-10 sec',
        fast: '2-5 sec',
        instant: '< 2 sec'
      },
      'solana': {
        slow: '10-20 sec',
        standard: '5-10 sec',
        fast: '2-5 sec',
        instant: '< 2 sec'
      },
      'aptos': {
        slow: '5-10 sec',
        standard: '2-5 sec',
        fast: '1-2 sec',
        instant: '< 1 sec'
      }
    };

    return timeMap[chainId] || {
      slow: '1-2 min',
      standard: '30-60 sec',
      fast: '10-30 sec',
      instant: '< 10 sec'
    };
  }

  /**
   * 模拟EVM交易
   */
  private async simulateEVMTransaction(
    chainId: string,
    txParams: TransactionParams
  ): Promise<SimulationResult> {
    const adapter = this.chainManager.getAdapter(chainId);
    const provider = (adapter as any).provider;

    try {
      // 构建交易对象
      const tx = {
        to: txParams.to,
        value: txParams.value || '0',
        data: txParams.data || '0x',
        from: txParams.from || ''
      };

      // 使用eth_call模拟交易
      const result = await provider.call(tx);
      
      // 估算Gas使用量
      const gasEstimate = await provider.estimateGas(tx);

      return {
        success: true,
        gasUsed: gasEstimate.toString(),
        returnValue: result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        revertReason: error.reason || 'Transaction would revert'
      };
    }
  }

  /**
   * 模拟Solana交易
   */
  private async simulateSolanaTransaction(
    txParams: TransactionParams
  ): Promise<SimulationResult> {
    try {
      // Solana交易模拟逻辑
      // 这里需要使用Solana的simulateTransaction API
      return {
        success: true,
        gasUsed: '5000' // Solana固定费用
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 模拟Aptos交易
   */
  private async simulateAptosTransaction(
    txParams: TransactionParams
  ): Promise<SimulationResult> {
    try {
      // Aptos交易模拟逻辑
      // 这里需要使用Aptos的simulate API
      return {
        success: true,
        gasUsed: '100' // 预估Gas使用量
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 清除Gas价格缓存
   */
  clearCache(): void {
    this.gasPriceCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.gasPriceCache.size,
      entries: Array.from(this.gasPriceCache.keys())
    };
  }
}