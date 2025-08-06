import { ethers } from 'ethers';
import { ChainConfig, ChainType, GasEstimate, TransactionParams } from '../types/chain';

/**
 * Gas服务类
 * 处理Gas费用估算和优化
 */
export class GasService {
  private provider: ethers.Provider | null = null;
  private chainConfig: ChainConfig | null = null;

  /**
   * 初始化Gas服务
   */
  async initialize(chainConfig: ChainConfig): Promise<void> {
    this.chainConfig = chainConfig;
    if (chainConfig.type === ChainType.EVM) {
      this.provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    }
  }

  /**
   * 估算Gas费用
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('Gas service not initialized');
    }

    if (this.chainConfig.type !== ChainType.EVM) {
      throw new Error('Gas estimation only supported for EVM chains');
    }

    try {
      // 估算Gas限制
      const gasLimit = await this.provider.estimateGas({
        to: params.to,
        value: params.value,
        data: params.data || '0x'
      });

      // 获取当前Gas价格
      const feeData = await this.provider.getFeeData();
      
      let gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      let maxFeePerGas = feeData.maxFeePerGas;
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

      // 如果支持EIP-1559，使用动态费用
      if (maxFeePerGas && maxPriorityFeePerGas) {
        const estimatedCost = gasLimit * maxFeePerGas;
        
        return {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          estimatedCost: ethers.formatEther(estimatedCost)
        };
      } else {
        // 传统Gas价格模式
        const estimatedCost = gasLimit * gasPrice;
        
        return {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPrice.toString(),
          estimatedCost: ethers.formatEther(estimatedCost)
        };
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }

  /**
   * 获取当前Gas价格
   */
  async getCurrentGasPrice(): Promise<{
    slow: string;
    standard: string;
    fast: string;
  }> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('Gas service not initialized');
    }

    if (this.chainConfig.type !== ChainType.EVM) {
      throw new Error('Gas price only supported for EVM chains');
    }

    try {
      const feeData = await this.provider.getFeeData();
      const baseGasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // 提供不同速度的Gas价格选项
      const slow = baseGasPrice * BigInt(80) / BigInt(100); // 80% of base
      const standard = baseGasPrice; // 100% of base
      const fast = baseGasPrice * BigInt(120) / BigInt(100); // 120% of base

      return {
        slow: ethers.formatUnits(slow, 'gwei'),
        standard: ethers.formatUnits(standard, 'gwei'),
        fast: ethers.formatUnits(fast, 'gwei')
      };
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  /**
   * 获取EIP-1559费用建议
   */
  async getEIP1559Fees(): Promise<{
    slow: { maxFeePerGas: string; maxPriorityFeePerGas: string };
    standard: { maxFeePerGas: string; maxPriorityFeePerGas: string };
    fast: { maxFeePerGas: string; maxPriorityFeePerGas: string };
  }> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('Gas service not initialized');
    }

    if (this.chainConfig.type !== ChainType.EVM) {
      throw new Error('EIP-1559 fees only supported for EVM chains');
    }

    try {
      const feeData = await this.provider.getFeeData();
      
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('EIP-1559 not supported on this network');
      }

      const baseMaxFee = feeData.maxFeePerGas;
      const basePriorityFee = feeData.maxPriorityFeePerGas;

      return {
        slow: {
          maxFeePerGas: ethers.formatUnits(baseMaxFee * BigInt(80) / BigInt(100), 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(basePriorityFee * BigInt(80) / BigInt(100), 'gwei')
        },
        standard: {
          maxFeePerGas: ethers.formatUnits(baseMaxFee, 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(basePriorityFee, 'gwei')
        },
        fast: {
          maxFeePerGas: ethers.formatUnits(baseMaxFee * BigInt(120) / BigInt(100), 'gwei'),
          maxPriorityFeePerGas: ethers.formatUnits(basePriorityFee * BigInt(120) / BigInt(100), 'gwei')
        }
      };
    } catch (error) {
      console.error('Error getting EIP-1559 fees:', error);
      throw error;
    }
  }

  /**
   * 计算交易费用（以USD计算）
   */
  async calculateTransactionCostUSD(gasEstimate: GasEstimate, ethPriceUSD?: number): Promise<string> {
    if (!ethPriceUSD) {
      // 如果没有提供ETH价格，可以从价格API获取
      // 这里简化处理，返回0
      return '0';
    }

    const costInEth = parseFloat(gasEstimate.estimatedCost);
    const costInUSD = costInEth * ethPriceUSD;
    
    return costInUSD.toFixed(2);
  }

  /**
   * 优化Gas参数
   */
  async optimizeGasParams(params: TransactionParams, priority: 'slow' | 'standard' | 'fast' = 'standard'): Promise<TransactionParams> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('Gas service not initialized');
    }

    if (this.chainConfig.type !== ChainType.EVM) {
      return params; // 非EVM链直接返回原参数
    }

    try {
      const feeData = await this.provider.getFeeData();
      
      // 如果支持EIP-1559
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        const eip1559Fees = await this.getEIP1559Fees();
        const selectedFees = eip1559Fees[priority];
        
        return {
          ...params,
          maxFeePerGas: ethers.parseUnits(selectedFees.maxFeePerGas, 'gwei').toString(),
          maxPriorityFeePerGas: ethers.parseUnits(selectedFees.maxPriorityFeePerGas, 'gwei').toString()
        };
      } else {
        // 传统Gas价格模式
        const gasPrices = await this.getCurrentGasPrice();
        const selectedGasPrice = gasPrices[priority];
        
        return {
          ...params,
          gasPrice: ethers.parseUnits(selectedGasPrice, 'gwei').toString()
        };
      }
    } catch (error) {
      console.error('Error optimizing gas params:', error);
      return params; // 出错时返回原参数
    }
  }

  /**
   * 检查Gas费用是否合理
   */
  async validateGasFees(params: TransactionParams): Promise<{
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  }> {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!this.provider || !this.chainConfig) {
      return {
        isValid: false,
        warnings: ['Gas service not initialized'],
        suggestions: ['Initialize gas service before validating fees']
      };
    }

    if (this.chainConfig.type !== ChainType.EVM) {
      return {
        isValid: true,
        warnings: [],
        suggestions: []
      };
    }

    try {
      const currentPrices = await this.getCurrentGasPrice();
      const standardGasPrice = ethers.parseUnits(currentPrices.standard, 'gwei');
      
      if (params.gasPrice) {
        const userGasPrice = BigInt(params.gasPrice);
        
        // 检查Gas价格是否过低
        if (userGasPrice < standardGasPrice * BigInt(50) / BigInt(100)) {
          warnings.push('Gas price is very low, transaction may take long time to confirm');
          suggestions.push('Consider increasing gas price for faster confirmation');
        }
        
        // 检查Gas价格是否过高
        if (userGasPrice > standardGasPrice * BigInt(200) / BigInt(100)) {
          warnings.push('Gas price is very high, you may be overpaying');
          suggestions.push('Consider reducing gas price to save on fees');
        }
      }

      return {
        isValid: warnings.length === 0,
        warnings,
        suggestions
      };
    } catch (error) {
      console.error('Error validating gas fees:', error);
      return {
        isValid: false,
        warnings: ['Failed to validate gas fees'],
        suggestions: ['Try again later']
      };
    }
  }
}

export default GasService;