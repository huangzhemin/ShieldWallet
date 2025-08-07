import { ChainAdapter, ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo, ChainType } from '../types/chain';
import { BaseAdapter } from './BaseAdapter';
import { FireblocksService } from '../services/FireblocksService';

/**
 * Fireblocks MPC 适配器
 * 实现基于 Fireblocks MPC 技术的门限签名
 */
export class FireblocksAdapter extends BaseAdapter {
  private fireblocksService: FireblocksService;
  private vaultAccountId: string;

  constructor(config: ChainConfig, fireblocksService: FireblocksService, vaultAccountId: string) {
    super(config);
    this.fireblocksService = fireblocksService;
    this.vaultAccountId = vaultAccountId;
  }

  /**
   * 生成 MPC 钱包地址
   * 使用 Fireblocks MPC 技术创建分布式私钥
   */
  async generateWallet(mnemonic?: string, derivationPath?: string): Promise<{ address: string; privateKey: string }> {
    try {
      // 在 Fireblocks 中创建新的钱包地址
      const walletData = await this.fireblocksService.createVaultAsset(
        this.vaultAccountId,
        this.config.type,
        derivationPath
      );

      return {
        address: walletData.address,
        privateKey: 'MPC_MANAGED' // MPC 环境下私钥不会暴露
      };
    } catch (error) {
      throw new Error(`创建 Fireblocks MPC 钱包失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.fireblocksService.getVaultBalance(
        this.vaultAccountId,
        this.config.type
      );
      return balance.toString();
    } catch (error) {
      throw new Error(`获取余额失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const balance = await this.fireblocksService.getTokenBalance(
        this.vaultAccountId,
        tokenAddress
      );
      return balance.toString();
    } catch (error) {
      throw new Error(`获取代币余额失败: ${(error as Error).message}`);
    }
  }

  /**
   * 估算 Gas 费用
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    try {
      const estimate = await this.fireblocksService.estimateTransactionFee({
        vaultAccountId: this.vaultAccountId,
        assetId: this.mapChainTypeToAssetId(this.config.type),
        amount: params.value,
        destination: params.to,
        note: params.data
      });

      return {
        gasLimit: estimate.gasLimit || '21000',
        gasPrice: estimate.gasPrice || '0',
        maxFeePerGas: estimate.maxFeePerGas,
        maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
        estimatedCost: estimate.networkFee || '0'
      };
    } catch (error) {
      throw new Error(`估算 Gas 失败: ${(error as Error).message}`);
    }
  }

  /**
   * 发送交易 - 使用 MPC 门限签名
   */
  async sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult> {
    try {
      // 在 MPC 环境中，privateKey 参数被忽略，因为签名是分布式进行的
      const transactionRequest = {
        vaultAccountId: this.vaultAccountId,
        assetId: this.mapChainTypeToAssetId(this.config.type),
        amount: params.value,
        destination: params.to,
        note: params.data || 'ShieldWallet MPC Transaction',
        gasPrice: params.gasPrice,
        gasLimit: params.gasLimit,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas
      };

      // 使用 Fireblocks MPC 进行门限签名和交易提交
      const result = await this.fireblocksService.createTransaction(transactionRequest);

      return {
        hash: result.txHash,
        status: result.status === 'COMPLETED' ? 'confirmed' : 'pending',
        blockNumber: result.blockInfo?.blockNumber,
        gasUsed: result.networkFee,
        effectiveGasPrice: result.gasPrice
      };
    } catch (error) {
      throw new Error(`MPC 交易发送失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(hash: string): Promise<TransactionResult> {
    try {
      const transaction = await this.fireblocksService.getTransactionByHash(hash);
      
      return {
        hash: transaction.txHash,
        status: this.mapFireblocksStatus(transaction.status),
        blockNumber: transaction.blockInfo?.blockNumber,
        gasUsed: transaction.networkFee,
        effectiveGasPrice: transaction.gasPrice
      };
    } catch (error) {
      throw new Error(`获取交易状态失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 NFT 列表
   */
  async getNFTs(address: string): Promise<NFTInfo[]> {
    try {
      const nfts = await this.fireblocksService.getVaultNFTs(this.vaultAccountId);
      
      return nfts.map((nft: any) => ({
        tokenId: nft.tokenId,
        contractAddress: nft.collection.contractAddress,
        name: nft.name,
        description: nft.description,
        image: nft.media?.[0]?.url,
        chainId: this.config.id
      }));
    } catch (error) {
      throw new Error(`获取 NFT 列表失败: ${(error as Error).message}`);
    }
  }

  /**
   * 验证地址格式
   */
  validateAddress(address: string): boolean {
    // 根据不同链类型验证地址格式
    switch (this.config.type) {
      case ChainType.EVM:
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case ChainType.SOLANA:
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      case ChainType.APTOS:
        return /^0x[a-fA-F0-9]{64}$/.test(address);
      default:
        return false;
    }
  }

  /**
   * 映射 Fireblocks 交易状态到标准状态
   */
  private mapFireblocksStatus(status: string): 'pending' | 'confirmed' | 'failed' {
    switch (status) {
      case 'COMPLETED':
        return 'confirmed';
      case 'FAILED':
      case 'CANCELLED':
      case 'REJECTED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * 映射链类型到 Fireblocks 资产 ID
   */
  private mapChainTypeToAssetId(chainType: ChainType): string {
    switch (chainType) {
      case ChainType.EVM:
        return 'ETH';
      case ChainType.SOLANA:
        return 'SOL';
      case ChainType.APTOS:
        return 'APT';
      default:
        throw new Error(`不支持的链类型: ${chainType}`);
    }
  }

  /**
   * 获取 Vault Account ID
   */
  getVaultAccountId(): string {
    return this.vaultAccountId;
  }

  /**
   * 设置 Vault Account ID
   */
  setVaultAccountId(vaultAccountId: string): void {
    this.vaultAccountId = vaultAccountId;
  }
}