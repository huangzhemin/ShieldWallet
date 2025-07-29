import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ChainAdapter, ChainConfig, TransactionParams, TransactionResult, GasEstimate, NFTInfo } from '../types/chain';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

/**
 * Solana链适配器
 */
export class SolanaAdapter implements ChainAdapter {
  private config: ChainConfig;
  private connection: Connection;

  constructor(config: ChainConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, 'confirmed');
  }

  getChainConfig(): ChainConfig {
    return this.config;
  }

  /**
   * 从助记词生成Solana钱包
   */
  async generateWallet(mnemonic: string, derivationPath: string = "m/44'/501'/0'/0'"): Promise<{ address: string; privateKey: string }> {
    try {
      // 验证助记词
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('无效的助记词');
      }

      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // 派生私钥
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      
      // 创建密钥对
      const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
      
      // 创建Solana密钥对
      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);
      
      return {
        address: solanaKeypair.publicKey.toBase58(),
        privateKey: bs58.encode(solanaKeypair.secretKey)
      };
    } catch (error: any) {
      throw new Error(`生成Solana钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取SOL余额
   */
  async getBalance(address: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error: any) {
      throw new Error(`获取SOL余额失败: ${error.message}`);
    }
  }

  /**
   * 获取SPL代币余额
   */
  async getTokenBalance(address: string, tokenMintAddress: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const tokenMint = new PublicKey(tokenMintAddress);
      
      // 获取关联代币账户地址
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMint,
        publicKey
      );
      
      try {
        // 获取代币账户信息
        const tokenAccount = await getAccount(this.connection, associatedTokenAddress);
        
        // 获取代币精度
        const mintInfo = await this.connection.getParsedAccountInfo(tokenMint);
        const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 0;
        
        const balance = Number(tokenAccount.amount) / Math.pow(10, decimals);
        return balance.toString();
      } catch {
        // 如果代币账户不存在，返回0
        return '0';
      }
    } catch (error: any) {
      throw new Error(`获取SPL代币余额失败: ${error.message}`);
    }
  }

  /**
   * 估算交易费用
   */
  async estimateGas(params: TransactionParams): Promise<GasEstimate> {
    try {
      // Solana使用固定的交易费用结构
      const recentBlockhash = await this.connection.getLatestBlockhash();
      
      // 创建模拟交易
      const fromPubkey = new PublicKey(params.to); // 临时使用to地址作为from
      const toPubkey = new PublicKey(params.to);
      const lamports = Math.floor(parseFloat(params.value) * LAMPORTS_PER_SOL);
      
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: fromPubkey
      });
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports
        })
      );
      
      // 获取交易费用
      const fee = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      
      const estimatedCost = (fee.value || 5000) / LAMPORTS_PER_SOL;
      
      return {
        gasLimit: '1',
        gasPrice: fee.value?.toString() || '5000',
        estimatedCost: estimatedCost.toString()
      };
    } catch (error: any) {
      throw new Error(`估算Solana交易费用失败: ${error.message}`);
    }
  }

  /**
   * 发送SOL交易
   */
  async sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult> {
    try {
      // 从私钥创建密钥对
      const secretKey = bs58.decode(privateKey);
      const keypair = Keypair.fromSecretKey(secretKey);
      
      const toPubkey = new PublicKey(params.to);
      const lamports = Math.floor(parseFloat(params.value) * LAMPORTS_PER_SOL);
      
      // 获取最新区块哈希
      const recentBlockhash = await this.connection.getLatestBlockhash();
      
      // 创建交易
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: keypair.publicKey
      });
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey,
          lamports
        })
      );
      
      // 签名并发送交易
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair],
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );
      
      return {
        hash: signature,
        status: 'confirmed'
      };
    } catch (error: any) {
      throw new Error(`发送Solana交易失败: ${error.message}`);
    }
  }

  /**
   * 获取交易状态
   */
  async getTransactionStatus(hash: string): Promise<TransactionResult> {
    try {
      const status = await this.connection.getSignatureStatus(hash);
      
      if (!status.value) {
        return {
          hash,
          status: 'pending'
        };
      }
      
      const confirmationStatus = status.value.confirmationStatus;
      let txStatus: 'pending' | 'confirmed' | 'failed';
      
      if (status.value.err) {
        txStatus = 'failed';
      } else if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
        txStatus = 'confirmed';
      } else {
        txStatus = 'pending';
      }
      
      return {
        hash,
        status: txStatus,
        blockNumber: status.value.slot
      };
    } catch (error: any) {
      throw new Error(`获取Solana交易状态失败: ${error.message}`);
    }
  }

  /**
   * 获取NFT列表
   */
  async getNFTs(address: string): Promise<NFTInfo[]> {
    try {
      const publicKey = new PublicKey(address);
      
      // 获取所有代币账户
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID
        }
      );
      
      const nfts: NFTInfo[] = [];
      
      // 筛选NFT（余额为1且精度为0的代币）
      for (const tokenAccount of tokenAccounts.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        
        if (accountData.tokenAmount.decimals === 0 && accountData.tokenAmount.uiAmount === 1) {
          // 这是一个NFT
          const mintAddress = accountData.mint;
          
          // TODO: 获取NFT元数据
          // 需要查询Metaplex程序获取NFT详细信息
          
          nfts.push({
            tokenId: mintAddress,
            contractAddress: mintAddress,
            name: `Solana NFT ${mintAddress.slice(0, 8)}`,
            chainId: this.config.id
          });
        }
      }
      
      return nfts;
    } catch (error: any) {
      throw new Error(`获取Solana NFT失败: ${error.message}`);
    }
  }

  /**
   * 验证Solana地址格式
   */
  validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<any[]> {
    try {
      const publicKey = new PublicKey(address);
      
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );
      
      const transactions = [];
      
      for (const sig of signatures) {
        const tx = await this.connection.getParsedTransaction(sig.signature);
        if (tx) {
          transactions.push({
            hash: sig.signature,
            blockTime: sig.blockTime,
            slot: sig.slot,
            status: sig.err ? 'failed' : 'confirmed',
            fee: tx.meta?.fee
          });
        }
      }
      
      return transactions;
    } catch (error: any) {
      throw new Error(`获取Solana交易历史失败: ${error.message}`);
    }
  }

  /**
   * 模拟交易执行
   */
  async simulateTransaction(params: TransactionParams, fromAddress: string): Promise<any> {
    try {
      const fromPubkey = new PublicKey(fromAddress);
      const toPubkey = new PublicKey(params.to);
      const lamports = Math.floor(parseFloat(params.value) * LAMPORTS_PER_SOL);
      
      // 获取最新区块哈希
      const recentBlockhash = await this.connection.getLatestBlockhash();
      
      // 创建交易
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: fromPubkey
      });
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports
        })
      );
      
      // 模拟交易
      const simulation = await this.connection.simulateTransaction(transaction);
      
      return {
        success: !simulation.value.err,
        error: simulation.value.err?.toString(),
        logs: simulation.value.logs,
        unitsConsumed: simulation.value.unitsConsumed
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}