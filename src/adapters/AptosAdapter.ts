import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient } from 'aptos';
import { ChainAdapter, ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

/**
 * Aptos链适配器
 */
export class AptosAdapter implements ChainAdapter {
  private config: ChainConfig;
  private client: AptosClient;
  private coinClient: CoinClient;
  private tokenClient: TokenClient;

  constructor(config: ChainConfig) {
    this.config = config;
    this.client = new AptosClient(config.rpcUrl);
    this.coinClient = new CoinClient(this.client);
    this.tokenClient = new TokenClient(this.client);
  }

  getChainConfig(): ChainConfig {
    return this.config;
  }

  /**
   * 从助记词生成Aptos钱包
   */
  async generateWallet(mnemonic: string, derivationPath: string = "m/44'/637'/0'/0'/0'"): Promise<{ address: string; privateKey: string }> {
    try {
      // 验证助记词
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }

      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // 派生私钥
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      
      // 创建Aptos账户
      const account = new AptosAccount(derivedSeed);
      
      return {
        address: account.address().hex(),
        privateKey: account.toPrivateKeyObject().privateKeyHex
      };
    } catch (error: any) {
      throw new Error(`生成Aptos钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取APT余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.coinClient.checkBalance(address);
      // APT使用8位小数
      return (Number(balance) / Math.pow(10, 8)).toString();
    } catch (error: any) {
      throw new Error(`获取APT余额失败: ${error.message}`);
    }
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      // 获取账户资源
      const resources = await this.client.getAccountResources(address);
      
      // 查找特定代币的余额
      const coinStore = resources.find(
        (resource: any) => resource.type === `0x1::coin::CoinStore<${tokenAddress}>`
      );
      
      if (!coinStore) {
        return '0';
      }
      
      const balance = (coinStore.data as any).coin.value;
      
      // 获取代币信息以确定小数位数
      try {
        const coinInfo = await this.client.getAccountResource(
          tokenAddress.split('::')[0],
          `0x1::coin::CoinInfo<${tokenAddress}>`
        );
        const decimals = (coinInfo.data as any).decimals;
        return (Number(balance) / Math.pow(10, decimals)).toString();
      } catch {
        // 如果无法获取小数位数，假设为8位
        return (Number(balance) / Math.pow(10, 8)).toString();
      }
    } catch (error: any) {
      throw new Error(`获取Aptos代币余额失败: ${error.message}`);
    }
  }

  /**
   * 估算交易费用
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    try {
      // 创建临时账户用于模拟
      const tempAccount = new AptosAccount();
      
      // 构建转账交易载荷
      const rawTxn = await this.client.generateTransaction(tempAccount.address(), {
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [
          params.to,
          Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
        ]
      });
      
      // 模拟交易以获取Gas估算
      const simulation = await this.client.simulateTransaction(tempAccount, rawTxn);
      
      const gasUsed = simulation[0]?.gas_used || '1000';
      const gasUnitPrice = simulation[0]?.gas_unit_price || '100';
      const estimatedCost = (Number(gasUsed) * Number(gasUnitPrice)) / Math.pow(10, 8);
      
      return {
        gasLimit: gasUsed,
        gasPrice: gasUnitPrice,
        estimatedCost: estimatedCost.toString()
      };
    } catch (error: any) {
      // 如果模拟失败，返回默认值
      return {
        gasLimit: '1000',
        gasPrice: '100',
        estimatedCost: '0.0001'
      };
    }
  }

  /**
   * 发送APT交易
   */
  async sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult> {
    try {
      // 从私钥创建账户
      const account = new AptosAccount(Buffer.from(privateKey.replace('0x', ''), 'hex'));
      
      // 构建转账交易载荷
      const payload = {
        type: 'entry_function_payload',
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [
          params.to,
          Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
        ]
      };
      
      // 提交交易
      const txnRequest = await this.client.generateTransaction(account.address(), payload);
      const signedTxn = await this.client.signTransaction(account, txnRequest);
      const transactionRes = await this.client.submitTransaction(signedTxn);
      
      // 等待交易确认
      await this.client.waitForTransaction(transactionRes.hash);
      
      return {
        hash: transactionRes.hash,
        status: 'confirmed'
      };
    } catch (error: any) {
      throw new Error(`发送Aptos交易失败: ${error.message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(hash: string): Promise<TransactionResult> {
    try {
      const transaction = await this.client.getTransactionByHash(hash);
      
      let status: 'pending' | 'confirmed' | 'failed';
      
      // 检查交易类型和状态
      if (transaction.type === 'pending_transaction') {
        status = 'pending';
      } else if (transaction.type === 'user_transaction') {
        status = (transaction as any).success ? 'confirmed' : 'failed';
      } else {
        status = 'confirmed';
      }
      
      return {
        hash,
        status,
        blockNumber: (transaction as any).version || undefined
      };
    } catch (error: any) {
      // 如果交易不存在，可能还在pending状态
      return {
        hash,
        status: 'pending'
      };
    }
  }

  /**
   * 获取NFT列表
   */
  async getNFTs(address: string): Promise<NFTInfo[]> {
    try {
      // Aptos NFT查询需要使用不同的API
      // 这里返回空数组，实际实现需要使用Aptos Indexer API
      const nfts: NFTInfo[] = [];
      
      // TODO: 实现Aptos NFT查询
      // 可以使用Aptos Indexer API或其他NFT查询服务
      
      return nfts;
    } catch (error: any) {
      console.error('获取Aptos NFT失败:', error.message);
      return [];
    }
  }

  /**
   * 验证Aptos地址格式
   */
  validateAddress(address: string): boolean {
    try {
      // Aptos地址是64位十六进制字符串，可能带0x前缀
      const cleanAddress = address.replace('0x', '');
      return /^[0-9a-fA-F]{64}$/.test(cleanAddress) || /^[0-9a-fA-F]{1,64}$/.test(cleanAddress);
    } catch {
      return false;
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<any[]> {
    try {
      const transactions = await this.client.getAccountTransactions(address, {
        limit
      });
      
      return transactions.map((tx: any) => ({
        hash: tx.hash,
        version: tx.version,
        timestamp: tx.timestamp,
        success: tx.success,
        gasUsed: tx.gas_used,
        gasUnitPrice: tx.gas_unit_price,
        type: tx.type
      }));
    } catch (error: any) {
      throw new Error(`获取Aptos交易历史失败: ${error.message}`);
    }
  }

  /**
   * 模拟交易执行
   */
  async simulateTransaction(params: TransactionParams, fromAddress: string): Promise<any> {
    try {
      // 创建临时账户用于模拟
      const tempAccount = new AptosAccount();
      
      // 构建转账交易载荷
      const rawTxn = await this.client.generateTransaction(tempAccount.address(), {
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [
          params.to,
          Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
        ]
      });
      
      // 模拟交易
      const simulation = await this.client.simulateTransaction(tempAccount, rawTxn);
      
      const result = simulation[0];
      
      return {
        success: result.success,
        gasUsed: result.gas_used,
        gasUnitPrice: result.gas_unit_price,
        vmStatus: result.vm_status,
        changes: result.changes
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}