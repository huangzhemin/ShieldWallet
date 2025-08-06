import { ethers } from 'ethers';
import { BaseAdapter } from './BaseAdapter';
import { ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';

/**
 * Arbitrum链适配器
 * 支持Arbitrum One和Arbitrum Nova
 */
export class ArbitrumAdapter extends BaseAdapter {
  private provider: ethers.JsonRpcProvider;

  constructor(config: ChainConfig) {
    super(config);
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * 从助记词生成钱包
   */
  async generateWallet(mnemonic: string, derivationPath: string = "m/44'/60'/0'/0/0"): Promise<{ address: string; privateKey: string }> {
    try {
      const seed = await this.generateSeed(mnemonic);
      const hdNode = ethers.HDNodeWallet.fromSeed(seed);
      const wallet = hdNode.derivePath(derivationPath);
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error: any) {
      throw new Error(`生成Arbitrum钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取ETH余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new Error(`获取ETH余额失败: ${error.message}`);
    }
  }

  /**
   * 获取ERC-20代币余额
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        this.provider
      );
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals()
      ]);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      throw new Error(`获取代币余额失败: ${error.message}`);
    }
  }

  /**
   * 估算Gas费用 (Arbitrum使用L1+L2费用模型)
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    try {
      const feeData = await this.provider.getFeeData();
      
      const transaction = {
        to: params.to,
        value: params.value ? ethers.parseEther(params.value) : 0,
        data: params.data || '0x'
      };
      
      const gasLimit = await this.provider.estimateGas(transaction);
      const gasPrice = feeData.gasPrice || ethers.parseUnits('0.1', 'gwei'); // Arbitrum较低的gas价格
      const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('0.2', 'gwei');
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('0.01', 'gwei');
      
      // Arbitrum的L2费用通常很低
      const l2Cost = gasLimit * gasPrice;
      
      // 估算L1数据费用 (简化计算)
      const dataSize = params.data ? (params.data.length - 2) / 2 : 0;
      const l1DataFee = BigInt(dataSize * 16) * ethers.parseUnits('20', 'gwei'); // 估算L1费用
      
      const totalCost = l2Cost + l1DataFee;
      
      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        maxFeePerGas: ethers.formatUnits(maxFeePerGas, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(maxPriorityFeePerGas, 'gwei'),
        estimatedCost: ethers.formatEther(totalCost)
      };
    } catch (error: any) {
      throw new Error(`估算Gas失败: ${error.message}`);
    }
  }

  /**
   * 发送交易
   */
  async sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      const transaction = {
        to: params.to,
        value: params.value ? ethers.parseEther(params.value) : 0,
        data: params.data || '0x',
        gasLimit: params.gasLimit || undefined,
        gasPrice: params.gasPrice ? ethers.parseUnits(params.gasPrice, 'gwei') : undefined,
        maxFeePerGas: params.maxFeePerGas ? ethers.parseUnits(params.maxFeePerGas, 'gwei') : undefined,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas ? ethers.parseUnits(params.maxPriorityFeePerGas, 'gwei') : undefined,
        nonce: params.nonce
      };
      
      const tx = await wallet.sendTransaction(transaction);
      
      return {
        hash: tx.hash,
        status: 'pending'
      };
    } catch (error: any) {
      throw new Error(`发送交易失败: ${error.message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(hash: string): Promise<TransactionResult> {
    try {
      const tx = await this.provider.getTransaction(hash);
      if (!tx) {
        throw new Error('交易不存在');
      }
      
      const receipt = await this.provider.getTransactionReceipt(hash);
      
      if (!receipt) {
        return {
          hash,
          status: 'pending'
        };
      }
      
      return {
        hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString()
      };
    } catch (error: any) {
      throw new Error(`获取交易状态失败: ${error.message}`);
    }
  }

  /**
   * 获取NFT列表
   */
  async getNFTs(address: string): Promise<NFTInfo[]> {
    try {
      // 这里可以集成Arbitrum NFT API
      // 暂时返回空数组
      return [];
    } catch (error: any) {
      throw new Error(`获取NFT失败: ${error.message}`);
    }
  }

  /**
   * 验证地址格式
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address: string, page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      // 这里可以集成Arbiscan API
      // 暂时返回空数组
      return [];
    } catch (error: any) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }

  /**
   * 模拟交易
   */
  async simulateTransaction(params: TransactionParams): Promise<any> {
    try {
      const transaction = {
        to: params.to,
        value: params.value ? ethers.parseEther(params.value) : 0,
        data: params.data || '0x'
      };
      
      const result = await this.provider.call(transaction);
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取Arbitrum特定信息
   */
  async getArbitrumInfo(): Promise<any> {
    try {
      // 获取L1和L2的区块信息
      const latestBlock = await this.provider.getBlock('latest');
      return {
        latestL2Block: latestBlock?.number,
        l2BlockTime: latestBlock?.timestamp
      };
    } catch (error: any) {
      throw new Error(`获取Arbitrum信息失败: ${error.message}`);
    }
  }
}