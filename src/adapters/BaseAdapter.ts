import { ChainAdapter, ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';
import * as bip39 from 'bip39';

/**
 * 链适配器抽象基类
 * 提供通用的钱包生成和验证功能
 */
export abstract class BaseAdapter implements ChainAdapter {
  protected config: ChainConfig;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  getChainConfig(): ChainConfig {
    return this.config;
  }

  /**
   * 验证助记词
   */
  protected validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * 从助记词生成种子
   */
  protected async generateSeed(mnemonic: string): Promise<Buffer> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('无效的助记词');
    }
    return await bip39.mnemonicToSeed(mnemonic);
  }

  /**
   * 格式化余额显示
   */
  protected formatBalance(balance: string, decimals: number): string {
    const balanceNum = parseFloat(balance);
    return (balanceNum / Math.pow(10, decimals)).toFixed(6);
  }

  /**
   * 解析金额到最小单位
   */
  protected parseAmount(amount: string, decimals: number): string {
    const amountNum = parseFloat(amount);
    return (amountNum * Math.pow(10, decimals)).toString();
  }

  // 抽象方法，子类必须实现
  abstract generateWallet(mnemonic: string, derivationPath?: string): Promise<{ address: string; privateKey: string }>;
  abstract getBalance(address: string): Promise<string>;
  abstract getTokenBalance(address: string, tokenAddress: string): Promise<string>;
  abstract estimateGas(params: TransactionParams): Promise<GasEstimate>;
  abstract sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult>;
  abstract getTransactionStatus(hash: string): Promise<TransactionResult>;
  abstract getNFTs(address: string): Promise<NFTInfo[]>;
  abstract validateAddress(address: string): boolean;
}