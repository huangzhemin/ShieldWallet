import { ethers } from 'ethers';
import { BaseAdapter } from './BaseAdapter';
import { ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';

/**
 * BSC (Binance Smart Chain) 适配器
 * 支持BSC主网和测试网
 */
export class BSCAdapter extends BaseAdapter {
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
      throw new Error(`生成BSC钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取BNB余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new Error(`获取BNB余额失败: ${error.message}`);
    }
  }

  /**
   * 获取BEP-20代币余额
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
   * 估算Gas费用
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
      const gasPrice = feeData.gasPrice || ethers.parseUnits('5', 'gwei'); // BSC默认5 gwei
      
      const estimatedCost = gasLimit * gasPrice;
      
      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost: ethers.formatEther(estimatedCost)
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
      // 这里可以集成BSC NFT API
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
      // 这里可以集成BscScan API
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
   * 获取PancakeSwap相关信息
   */
  async getPancakeSwapInfo(): Promise<any> {
    try {
      // PancakeSwap Router地址
      const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
      
      const routerContract = new ethers.Contract(
        PANCAKE_ROUTER,
        ['function factory() view returns (address)', 'function WETH() view returns (address)'],
        this.provider
      );
      
      const [factory, wbnb] = await Promise.all([
        routerContract.factory(),
        routerContract.WETH()
      ]);
      
      return {
        routerAddress: PANCAKE_ROUTER,
        factoryAddress: factory,
        wbnbAddress: wbnb
      };
    } catch (error: any) {
      throw new Error(`获取PancakeSwap信息失败: ${error.message}`);
    }
  }

  /**
   * 获取代币价格 (通过PancakeSwap)
   */
  async getTokenPrice(tokenAddress: string, baseToken: string = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'): Promise<string> {
    try {
      // PancakeSwap Factory地址
      const PANCAKE_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
      
      const factoryContract = new ethers.Contract(
        PANCAKE_FACTORY,
        ['function getPair(address,address) view returns (address)'],
        this.provider
      );
      
      const pairAddress = await factoryContract.getPair(tokenAddress, baseToken);
      
      if (pairAddress === ethers.ZeroAddress) {
        throw new Error('交易对不存在');
      }
      
      const pairContract = new ethers.Contract(
        pairAddress,
        ['function getReserves() view returns (uint112,uint112,uint32)'],
        this.provider
      );
      
      const reserves = await pairContract.getReserves();
      const price = Number(reserves[1]) / Number(reserves[0]);
      
      return price.toString();
    } catch (error: any) {
      throw new Error(`获取代币价格失败: ${error.message}`);
    }
  }
}