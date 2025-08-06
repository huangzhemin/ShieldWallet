import { CryptoUtils } from '../utils/crypto';
import { ValidationUtils } from '../utils/validation';
import { StorageService } from './storage';
import { NetworkService } from './network';
import { ChainManager, chainManager } from './ChainManager';
import { DeFiService } from './DeFiService';
import { BridgeService } from './BridgeService';
import { NFTService } from './NFTService';
import { GasService } from './GasService';

/**
 * 钱包接口
 */
interface Wallet {
  address: string;
  encryptedPrivateKey: string;
  mnemonic?: string;
  createdAt: number;
  multiChainAddresses?: { [chainId: string]: string };
  encryptedMultiChainKeys?: { [chainId: string]: string };
}

/**
 * 交易接口
 */
interface Transaction {
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  data?: string;
}

/**
 * 钱包服务类
 */
export class WalletService {
  private static currentWallet: Wallet | null = null;
  private static isUnlocked: boolean = false;
  private static chainManager: ChainManager = chainManager;
  private static defiService: DeFiService = new DeFiService();
  private static bridgeService: BridgeService = new BridgeService(WalletService.chainManager);
  private static nftService: NFTService = new NFTService();
  private static gasService: GasService = new GasService();
  private static multiChainWallets: { [chainId: string]: { address: string; privateKey: string } } = {};

  /**
   * 创建新钱包
   */
  static async createWallet(password: string): Promise<{ wallet: Wallet; mnemonic: string; multiChainAddresses: { [chainId: string]: string } }> {
    // 验证密码强度
    const passwordValidation = ValidationUtils.isStrongPassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    try {
      // 生成助记词（简化版本，实际应使用bip39库）
      const mnemonic = this.generateMnemonic();
      
      // 从助记词生成私钥和地址
      const { privateKey, address } = await this.generateWalletFromMnemonic(mnemonic);
      
      // 生成多链钱包
      const multiChainWallets = await this.chainManager.generateMultiChainWallet(mnemonic);
      
      // 加密私钥
      const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
      
      // 加密多链私钥
      const encryptedMultiChainKeys: { [chainId: string]: string } = {};
      for (const [chainId, chainWallet] of Object.entries(multiChainWallets)) {
        encryptedMultiChainKeys[chainId] = await CryptoUtils.encrypt(chainWallet.privateKey, password);
      }
      
      // 创建钱包对象
      const wallet: Wallet = {
        address,
        encryptedPrivateKey,
        mnemonic: await CryptoUtils.encrypt(mnemonic, password),
        createdAt: Date.now(),
        multiChainAddresses: Object.fromEntries(
          Object.entries(multiChainWallets).map(([chainId, wallet]) => [chainId, wallet.address])
        ),
        encryptedMultiChainKeys
      };
      
      // 保存到存储
      await StorageService.saveWallet(wallet);
      
      this.currentWallet = wallet;
      this.multiChainWallets = multiChainWallets;
      this.isUnlocked = true;
      
      return { wallet, mnemonic, multiChainAddresses: wallet.multiChainAddresses || {} };
    } catch (error) {
      throw new Error(`创建钱包失败: ${error}`);
    }
  }

  /**
   * 导入钱包
   */
  static async importWallet(importData: string, importType: 'mnemonic' | 'privateKey', password: string): Promise<{ wallet: Wallet; multiChainAddresses: { [chainId: string]: string } }> {
    // 验证密码强度
    const passwordValidation = ValidationUtils.isStrongPassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.message);
    }

    try {
      let privateKey: string;
      let address: string;
      let mnemonic: string | undefined;
      let multiChainWallets: { [chainId: string]: { address: string; privateKey: string } } = {};

      if (importType === 'mnemonic') {
        if (!ValidationUtils.isValidMnemonic(importData)) {
          throw new Error('无效的助记词格式');
        }
        
        mnemonic = importData;
        const walletData = await this.generateWalletFromMnemonic(mnemonic);
        privateKey = walletData.privateKey;
        address = walletData.address;
        
        // 生成多链钱包
        multiChainWallets = await this.chainManager.generateMultiChainWallet(mnemonic);
      } else {
        if (!ValidationUtils.isValidPrivateKey(importData)) {
          throw new Error('无效的私钥格式');
        }
        
        privateKey = importData;
        address = await this.getAddressFromPrivateKey(privateKey);
      }
      
      // 加密私钥
      const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
      
      // 加密多链私钥
      const encryptedMultiChainKeys: { [chainId: string]: string } = {};
      for (const [chainId, chainWallet] of Object.entries(multiChainWallets)) {
        encryptedMultiChainKeys[chainId] = await CryptoUtils.encrypt(chainWallet.privateKey, password);
      }
      
      // 创建钱包对象
      const wallet: Wallet = {
        address,
        encryptedPrivateKey,
        mnemonic: mnemonic ? await CryptoUtils.encrypt(mnemonic, password) : undefined,
        createdAt: Date.now(),
        multiChainAddresses: Object.fromEntries(
          Object.entries(multiChainWallets).map(([chainId, wallet]) => [chainId, wallet.address])
        ),
        encryptedMultiChainKeys
      };
      
      // 保存到存储
      await StorageService.saveWallet(wallet);
      
      this.currentWallet = wallet;
      this.multiChainWallets = multiChainWallets;
      this.isUnlocked = true;
      
      return { wallet, multiChainAddresses: wallet.multiChainAddresses || {} };
    } catch (error) {
      throw new Error(`导入钱包失败: ${error}`);
    }
  }

  /**
   * 解锁钱包
   */
  static async unlockWallet(password: string): Promise<boolean> {
    try {
      const wallet = await StorageService.getWallet();
      if (!wallet) {
        throw new Error('未找到钱包');
      }
      
      // 尝试解密私钥来验证密码
      await CryptoUtils.decrypt(wallet.encryptedPrivateKey, password);
      
      // 解密多链私钥
        if (wallet.encryptedMultiChainKeys) {
          for (const [chainId, encryptedKey] of Object.entries(wallet.encryptedMultiChainKeys)) {
            const privateKey = await CryptoUtils.decrypt(encryptedKey as string, password);
            const address = wallet.multiChainAddresses?.[chainId] || '';
            this.multiChainWallets[chainId] = { address, privateKey };
          }
        }
      
      this.currentWallet = wallet;
      this.isUnlocked = true;
      
      return true;
    } catch (error) {
      console.error('解锁钱包失败:', error);
      return false;
    }
  }

  /**
   * 锁定钱包
   */
  static lockWallet(): void {
    this.currentWallet = null;
    this.isUnlocked = false;
  }

  /**
   * 检查钱包是否已解锁
   */
  static isWalletUnlocked(): boolean {
    return this.isUnlocked && this.currentWallet !== null;
  }

  /**
   * 获取当前钱包地址
   */
  static getCurrentAddress(): string | null {
    return this.currentWallet?.address || null;
  }

  /**
   * 获取钱包余额
   */
  static async getBalance(): Promise<string> {
    if (!this.isWalletUnlocked() || !this.currentWallet) {
      throw new Error('钱包未解锁');
    }
    
    return await NetworkService.getBalance(this.currentWallet.address);
  }

  /**
   * 发送交易
   */
  static async sendTransaction(transaction: Transaction, password: string): Promise<string> {
    if (!this.isWalletUnlocked() || !this.currentWallet) {
      throw new Error('钱包未解锁');
    }
    
    try {
      // 解密私钥
      const privateKey = await CryptoUtils.decrypt(this.currentWallet.encryptedPrivateKey, password);
      
      // 获取nonce
      const nonce = await NetworkService.getTransactionCount(this.currentWallet.address);
      
      // 构建交易对象
      const txData = {
        nonce: '0x' + nonce.toString(16),
        gasPrice: NetworkService.gweiToWei(transaction.gasPrice),
        gasLimit: '0x' + parseInt(transaction.gasLimit).toString(16),
        to: transaction.to,
        value: NetworkService.ethToWei(transaction.value),
        data: transaction.data || '0x'
      };
      
      // 签名交易
      const signedTx = await this.signTransaction(txData, privateKey);
      
      // 发送交易
      const txHash = await NetworkService.sendRawTransaction(signedTx);
      
      // 保存交易历史
      await StorageService.addTransaction({
        hash: txHash,
        from: this.currentWallet.address,
        to: transaction.to,
        value: transaction.value,
        gasPrice: transaction.gasPrice,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      return txHash;
    } catch (error) {
      throw new Error(`发送交易失败: ${error}`);
    }
  }

  /**
   * 检查钱包是否存在
   */
  static async walletExists(): Promise<boolean> {
    const wallet = await StorageService.getWallet();
    return wallet !== null && wallet !== undefined;
  }

  /**
   * 删除钱包
   */
  static async deleteWallet(): Promise<void> {
    await StorageService.removeWallet();
    this.currentWallet = null;
    this.isUnlocked = false;
  }

  /**
   * 生成助记词（简化版本）
   */
  private static generateMnemonic(): string {
    // 这是一个简化的实现，实际应该使用bip39库
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album'
    ];
    
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      mnemonic.push(words[randomIndex]);
    }
    
    return mnemonic.join(' ');
  }

  /**
   * 从助记词生成钱包（简化版本）
   */
  private static async generateWalletFromMnemonic(mnemonic: string): Promise<{ privateKey: string; address: string }> {
    // 这是一个简化的实现，实际应该使用ethers.js或web3.js
    const seed = await CryptoUtils.simpleHash(mnemonic);
    const privateKey = '0x' + seed.slice(0, 64);
    const address = await this.getAddressFromPrivateKey(privateKey);
    
    return { privateKey, address };
  }

  /**
   * 从私钥获取地址（简化版本）
   */
  private static async getAddressFromPrivateKey(privateKey: string): Promise<string> {
    // 这是一个简化的实现，实际应该使用ethers.js或web3.js
    const hash = await CryptoUtils.simpleHash(privateKey);
    return '0x' + hash.slice(0, 40);
  }

  /**
   * 签名交易（简化版本）
   */
  private static async signTransaction(transaction: any, privateKey: string): Promise<string> {
    // 这是一个简化的实现，实际应该使用ethers.js或web3.js进行正确的交易签名
    const txString = JSON.stringify(transaction);
    const signature = await CryptoUtils.simpleHash(txString + privateKey);
    return '0x' + signature;
  }

  /**
   * 获取助记词（需要密码验证）
   */
  static async getMnemonic(password: string): Promise<string | null> {
    if (!this.isWalletUnlocked() || !this.currentWallet) {
      throw new Error('钱包未解锁');
    }
    
    if (!this.currentWallet.mnemonic) {
      return null;
    }
    
    try {
      return await CryptoUtils.decrypt(this.currentWallet.mnemonic, password);
    } catch (error) {
      throw new Error('密码错误');
    }
  }

  // DeFi服务访问器
  static get defi() {
    return WalletService.defiService;
  }

  // 跨链桥服务访问器
  static get bridge() {
    return WalletService.bridgeService;
  }

  // NFT服务访问器
  static get nft() {
    return WalletService.nftService;
  }

  // Gas服务访问器
  static get gas() {
    return WalletService.gasService;
  }
}