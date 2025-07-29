import { ethers } from 'ethers';
import { ChainAdapter, ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';
import * as bip39 from 'bip39';

/**
 * EVM链适配器
 * 支持以太坊、Polygon、Arbitrum、zkSync等EVM兼容链
 */
export class EVMAdapter implements ChainAdapter {
  private config: ChainConfig;
  private provider: ethers.JsonRpcProvider;

  constructor(config: ChainConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  getChainConfig(): ChainConfig {
    return this.config;
  }

  /**
   * 从助记词生成钱包
   */
  async generateWallet(mnemonic: string, derivationPath: string = "m/44'/60'/0'/0/0"): Promise<{ address: string; privateKey: string }> {
    try {
      // 验证助记词
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }

      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // 创建HD钱包
      const hdNode = ethers.HDNodeWallet.fromSeed(seed);
      
      // 派生指定路径的钱包
      const wallet = hdNode.derivePath(derivationPath);
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error: any) {
      throw new Error(`生成钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      // ERC-20代币ABI（简化版）
      const erc20ABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];
      
      const contract = new ethers.Contract(tokenAddress, erc20ABI, this.provider);
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      throw new Error(`获取代币余额失败: ${error.message}`);
    }
  }

  /**
   * 估算Gas费用
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    try {
      const transaction = {
        to: params.to,
        value: ethers.parseEther(params.value),
        data: params.data || '0x'
      };

      // 估算Gas限制
      const gasLimit = await this.provider.estimateGas(transaction);
      
      // 获取Gas价格
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      // 计算总费用
      const estimatedCost = ethers.formatEther(gasLimit * gasPrice);
      
      const result: GasEstimate = {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost
      };

      // EIP-1559支持
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        result.maxFeePerGas = feeData.maxFeePerGas.toString();
        result.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
      }

      return result;
    } catch (error: any) {
      throw new Error(`Gas估算失败: ${error.message}`);
    }
  }

  /**
   * 发送交易
   */
  async sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult> {
    try {
      // 创建钱包实例
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // 构建交易
      const transaction: any = {
        to: params.to,
        value: ethers.parseEther(params.value)
      };

      // 设置Gas参数
      if (params.gasLimit) {
        transaction.gasLimit = params.gasLimit;
      }
      
      if (params.gasPrice) {
        transaction.gasPrice = params.gasPrice;
      } else if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
        transaction.maxFeePerGas = params.maxFeePerGas;
        transaction.maxPriorityFeePerGas = params.maxPriorityFeePerGas;
      }

      if (params.data) {
        transaction.data = params.data;
      }

      if (params.nonce !== undefined) {
        transaction.nonce = params.nonce;
      }

      // 发送交易
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
      // 这里需要集成第三方NFT API，如OpenSea、Alchemy等
      // 简化实现，实际项目中需要调用相应的API
      const nfts: NFTInfo[] = [];
      
      // TODO: 实现NFT查询逻辑
      // 可以使用Alchemy NFT API、OpenSea API等
      
      return nfts;
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
      // 这里需要集成区块链浏览器API
      // 如Etherscan API、Polygonscan API等
      const transactions: any[] = [];
      
      // TODO: 实现交易历史查询
      
      return transactions;
    } catch (error: any) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }

  /**
   * 获取代币信息
   */
  async getTokenInfo(tokenAddress: string): Promise<any> {
    try {
      const erc20ABI = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ];
      
      const contract = new ethers.Contract(tokenAddress, erc20ABI, this.provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply()
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        chainId: this.config.id
      };
    } catch (error: any) {
      throw new Error(`获取代币信息失败: ${error.message}`);
    }
  }

  /**
   * 模拟交易执行
   */
  async simulateTransaction(params: TransactionParams): Promise<any> {
    try {
      const transaction = {
        to: params.to,
        value: ethers.parseEther(params.value),
        data: params.data || '0x'
      };

      // 使用静态调用模拟交易
      const result = await this.provider.call(transaction);
      
      return {
        success: true,
        result,
        gasEstimate: await this.estimateGas(params)
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        gasEstimate: null
      };
    }
  }
}