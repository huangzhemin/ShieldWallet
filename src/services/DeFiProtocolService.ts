import { ChainConfig, TransactionResult } from '../types/chain';
import { MultiChainWalletManager } from './MultiChainWalletManager';

/**
 * DeFi协议接口
 */
export interface DeFiProtocol {
  name: string;
  supportedChains: string[];
  protocolType: 'DEX' | 'LENDING' | 'YIELD' | 'STAKING';
  getProtocolInfo(): any;
}

/**
 * DEX协议接口
 */
export interface DEXProtocol extends DeFiProtocol {
  protocolType: 'DEX';
  getTokenPrice(tokenAddress: string, chainId: string): Promise<string>;
  estimateSwap(tokenIn: string, tokenOut: string, amountIn: string, chainId: string): Promise<{
    amountOut: string;
    priceImpact: string;
    fee: string;
  }>;
  executeSwap(params: SwapParams, privateKey: string): Promise<TransactionResult>;
  addLiquidity(params: LiquidityParams, privateKey: string): Promise<TransactionResult>;
  removeLiquidity(params: RemoveLiquidityParams, privateKey: string): Promise<TransactionResult>;
}

/**
 * 借贷协议接口
 */
export interface LendingProtocol extends DeFiProtocol {
  protocolType: 'LENDING';
  getSupplyAPY(tokenAddress: string, chainId: string): Promise<string>;
  getBorrowAPY(tokenAddress: string, chainId: string): Promise<string>;
  getUserPosition(userAddress: string, chainId: string): Promise<{
    supplied: { token: string; amount: string; apy: string }[];
    borrowed: { token: string; amount: string; apy: string }[];
    healthFactor: string;
  }>;
  supply(params: SupplyParams, privateKey: string): Promise<TransactionResult>;
  withdraw(params: WithdrawParams, privateKey: string): Promise<TransactionResult>;
  borrow(params: BorrowParams, privateKey: string): Promise<TransactionResult>;
  repay(params: RepayParams, privateKey: string): Promise<TransactionResult>;
}

/**
 * 交换参数
 */
export interface SwapParams {
  chainId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number; // 滑点容忍度 (0-100)
  recipient: string;
  deadline?: number;
}

/**
 * 流动性参数
 */
export interface LiquidityParams {
  chainId: string;
  tokenA: string;
  tokenB: string;
  amountA: string;
  amountB: string;
  slippage: number;
  recipient: string;
  deadline?: number;
}

/**
 * 移除流动性参数
 */
export interface RemoveLiquidityParams {
  chainId: string;
  tokenA: string;
  tokenB: string;
  liquidity: string;
  slippage: number;
  recipient: string;
  deadline?: number;
}

/**
 * 供应参数
 */
export interface SupplyParams {
  chainId: string;
  token: string;
  amount: string;
  recipient: string;
}

/**
 * 提取参数
 */
export interface WithdrawParams {
  chainId: string;
  token: string;
  amount: string;
  recipient: string;
}

/**
 * 借贷参数
 */
export interface BorrowParams {
  chainId: string;
  token: string;
  amount: string;
  recipient: string;
}

/**
 * 还款参数
 */
export interface RepayParams {
  chainId: string;
  token: string;
  amount: string;
  onBehalfOf?: string;
}

/**
 * Uniswap V3 协议实现
 */
export class UniswapV3Protocol implements DEXProtocol {
  name = 'Uniswap V3';
  supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
  protocolType: 'DEX' = 'DEX';

  getProtocolInfo() {
    return {
      name: this.name,
      version: 'V3',
      website: 'https://uniswap.org',
      description: '去中心化交易协议'
    };
  }

  async getTokenPrice(tokenAddress: string, chainId: string): Promise<string> {
    // 实现Uniswap V3价格查询
    throw new Error('Uniswap V3 price query implementation needed');
  }

  async estimateSwap(tokenIn: string, tokenOut: string, amountIn: string, chainId: string): Promise<{
    amountOut: string;
    priceImpact: string;
    fee: string;
  }> {
    // 实现Uniswap V3交换估算
    throw new Error('Uniswap V3 swap estimation implementation needed');
  }

  async executeSwap(params: SwapParams, privateKey: string): Promise<TransactionResult> {
    // 实现Uniswap V3交换
    throw new Error('Uniswap V3 swap implementation needed');
  }

  async addLiquidity(params: LiquidityParams, privateKey: string): Promise<TransactionResult> {
    // 实现Uniswap V3添加流动性
    throw new Error('Uniswap V3 add liquidity implementation needed');
  }

  async removeLiquidity(params: RemoveLiquidityParams, privateKey: string): Promise<TransactionResult> {
    // 实现Uniswap V3移除流动性
    throw new Error('Uniswap V3 remove liquidity implementation needed');
  }
}

/**
 * PancakeSwap 协议实现
 */
export class PancakeSwapProtocol implements DEXProtocol {
  name = 'PancakeSwap';
  supportedChains = ['bsc'];
  protocolType: 'DEX' = 'DEX';

  getProtocolInfo() {
    return {
      name: this.name,
      version: 'V2',
      website: 'https://pancakeswap.finance',
      description: 'BSC上的去中心化交易协议'
    };
  }

  async getTokenPrice(tokenAddress: string, chainId: string): Promise<string> {
    // 实现PancakeSwap价格查询
    throw new Error('PancakeSwap price query implementation needed');
  }

  async estimateSwap(tokenIn: string, tokenOut: string, amountIn: string, chainId: string): Promise<{
    amountOut: string;
    priceImpact: string;
    fee: string;
  }> {
    // 实现PancakeSwap交换估算
    throw new Error('PancakeSwap swap estimation implementation needed');
  }

  async executeSwap(params: SwapParams, privateKey: string): Promise<TransactionResult> {
    // 实现PancakeSwap交换
    throw new Error('PancakeSwap swap implementation needed');
  }

  async addLiquidity(params: LiquidityParams, privateKey: string): Promise<TransactionResult> {
    // 实现PancakeSwap添加流动性
    throw new Error('PancakeSwap add liquidity implementation needed');
  }

  async removeLiquidity(params: RemoveLiquidityParams, privateKey: string): Promise<TransactionResult> {
    // 实现PancakeSwap移除流动性
    throw new Error('PancakeSwap remove liquidity implementation needed');
  }
}

/**
 * Aave 协议实现
 */
export class AaveProtocol implements LendingProtocol {
  name = 'Aave';
  supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
  protocolType: 'LENDING' = 'LENDING';

  getProtocolInfo() {
    return {
      name: this.name,
      version: 'V3',
      website: 'https://aave.com',
      description: '去中心化借贷协议'
    };
  }

  async getSupplyAPY(tokenAddress: string, chainId: string): Promise<string> {
    // 实现Aave供应APY查询
    throw new Error('Aave supply APY query implementation needed');
  }

  async getBorrowAPY(tokenAddress: string, chainId: string): Promise<string> {
    // 实现Aave借贷APY查询
    throw new Error('Aave borrow APY query implementation needed');
  }

  async getUserPosition(userAddress: string, chainId: string): Promise<{
    supplied: { token: string; amount: string; apy: string }[];
    borrowed: { token: string; amount: string; apy: string }[];
    healthFactor: string;
  }> {
    // 实现Aave用户仓位查询
    throw new Error('Aave user position query implementation needed');
  }

  async supply(params: SupplyParams, privateKey: string): Promise<TransactionResult> {
    // 实现Aave供应
    throw new Error('Aave supply implementation needed');
  }

  async withdraw(params: WithdrawParams, privateKey: string): Promise<TransactionResult> {
    // 实现Aave提取
    throw new Error('Aave withdraw implementation needed');
  }

  async borrow(params: BorrowParams, privateKey: string): Promise<TransactionResult> {
    // 实现Aave借贷
    throw new Error('Aave borrow implementation needed');
  }

  async repay(params: RepayParams, privateKey: string): Promise<TransactionResult> {
    // 实现Aave还款
    throw new Error('Aave repay implementation needed');
  }
}

/**
 * Compound 协议实现
 */
export class CompoundProtocol implements LendingProtocol {
  name = 'Compound';
  supportedChains = ['ethereum'];
  protocolType: 'LENDING' = 'LENDING';

  getProtocolInfo() {
    return {
      name: this.name,
      version: 'V2',
      website: 'https://compound.finance',
      description: '去中心化借贷协议'
    };
  }

  async getSupplyAPY(tokenAddress: string, chainId: string): Promise<string> {
    // 实现Compound供应APY查询
    throw new Error('Compound supply APY query implementation needed');
  }

  async getBorrowAPY(tokenAddress: string, chainId: string): Promise<string> {
    // 实现Compound借贷APY查询
    throw new Error('Compound borrow APY query implementation needed');
  }

  async getUserPosition(userAddress: string, chainId: string): Promise<{
    supplied: { token: string; amount: string; apy: string }[];
    borrowed: { token: string; amount: string; apy: string }[];
    healthFactor: string;
  }> {
    // 实现Compound用户仓位查询
    throw new Error('Compound user position query implementation needed');
  }

  async supply(params: SupplyParams, privateKey: string): Promise<TransactionResult> {
    // 实现Compound供应
    throw new Error('Compound supply implementation needed');
  }

  async withdraw(params: WithdrawParams, privateKey: string): Promise<TransactionResult> {
    // 实现Compound提取
    throw new Error('Compound withdraw implementation needed');
  }

  async borrow(params: BorrowParams, privateKey: string): Promise<TransactionResult> {
    // 实现Compound借贷
    throw new Error('Compound borrow implementation needed');
  }

  async repay(params: RepayParams, privateKey: string): Promise<TransactionResult> {
    // 实现Compound还款
    throw new Error('Compound repay implementation needed');
  }
}

/**
 * DeFi协议服务
 */
export class DeFiProtocolService {
  private protocols: Map<string, DeFiProtocol> = new Map();
  private walletManager: MultiChainWalletManager;

  constructor(walletManager: MultiChainWalletManager) {
    this.walletManager = walletManager;
    this.initializeProtocols();
  }

  /**
   * 初始化DeFi协议
   */
  private initializeProtocols(): void {
    const uniswapV3 = new UniswapV3Protocol();
    const pancakeSwap = new PancakeSwapProtocol();
    const aave = new AaveProtocol();
    const compound = new CompoundProtocol();

    this.protocols.set('uniswap-v3', uniswapV3);
    this.protocols.set('pancakeswap', pancakeSwap);
    this.protocols.set('aave', aave);
    this.protocols.set('compound', compound);
  }

  /**
   * 获取支持的协议
   */
  getSupportedProtocols(): string[] {
    return Array.from(this.protocols.keys());
  }

  /**
   * 获取协议
   */
  getProtocol(protocolName: string): DeFiProtocol {
    const protocol = this.protocols.get(protocolName);
    if (!protocol) {
      throw new Error(`不支持的DeFi协议: ${protocolName}`);
    }
    return protocol;
  }

  /**
   * 获取DEX协议
   */
  getDEXProtocol(protocolName: string): DEXProtocol {
    const protocol = this.getProtocol(protocolName);
    if (protocol.protocolType !== 'DEX') {
      throw new Error(`${protocolName}不是DEX协议`);
    }
    return protocol as DEXProtocol;
  }

  /**
   * 获取借贷协议
   */
  getLendingProtocol(protocolName: string): LendingProtocol {
    const protocol = this.getProtocol(protocolName);
    if (protocol.protocolType !== 'LENDING') {
      throw new Error(`${protocolName}不是借贷协议`);
    }
    return protocol as LendingProtocol;
  }

  /**
   * 获取链上可用的DEX协议
   */
  getAvailableDEXProtocols(chainId: string): DEXProtocol[] {
    const dexProtocols: DEXProtocol[] = [];
    
    for (const protocol of this.protocols.values()) {
      if (protocol.protocolType === 'DEX' && protocol.supportedChains.includes(chainId)) {
        dexProtocols.push(protocol as DEXProtocol);
      }
    }
    
    return dexProtocols;
  }

  /**
   * 获取链上可用的借贷协议
   */
  getAvailableLendingProtocols(chainId: string): LendingProtocol[] {
    const lendingProtocols: LendingProtocol[] = [];
    
    for (const protocol of this.protocols.values()) {
      if (protocol.protocolType === 'LENDING' && protocol.supportedChains.includes(chainId)) {
        lendingProtocols.push(protocol as LendingProtocol);
      }
    }
    
    return lendingProtocols;
  }

  /**
   * 获取最佳交换价格
   */
  async getBestSwapPrice(tokenIn: string, tokenOut: string, amountIn: string, chainId: string): Promise<{
    protocol: string;
    amountOut: string;
    priceImpact: string;
    fee: string;
  } | null> {
    const dexProtocols = this.getAvailableDEXProtocols(chainId);
    
    if (dexProtocols.length === 0) {
      return null;
    }

    let bestOption: {
      protocol: string;
      amountOut: string;
      priceImpact: string;
      fee: string;
    } | null = null;

    for (const protocol of dexProtocols) {
      try {
        const estimate = await protocol.estimateSwap(tokenIn, tokenOut, amountIn, chainId);
        
        if (!bestOption || parseFloat(estimate.amountOut) > parseFloat(bestOption.amountOut)) {
          bestOption = {
            protocol: protocol.name,
            amountOut: estimate.amountOut,
            priceImpact: estimate.priceImpact,
            fee: estimate.fee
          };
        }
      } catch (error) {
        console.error(`Failed to get swap estimate from ${protocol.name}:`, error);
      }
    }

    return bestOption;
  }

  /**
   * 获取最佳借贷利率
   */
  async getBestLendingRates(tokenAddress: string, chainId: string): Promise<{
    supply: { protocol: string; apy: string }[];
    borrow: { protocol: string; apy: string }[];
  }> {
    const lendingProtocols = this.getAvailableLendingProtocols(chainId);
    const supplyRates: { protocol: string; apy: string }[] = [];
    const borrowRates: { protocol: string; apy: string }[] = [];

    for (const protocol of lendingProtocols) {
      try {
        const supplyAPY = await protocol.getSupplyAPY(tokenAddress, chainId);
        const borrowAPY = await protocol.getBorrowAPY(tokenAddress, chainId);
        
        supplyRates.push({ protocol: protocol.name, apy: supplyAPY });
        borrowRates.push({ protocol: protocol.name, apy: borrowAPY });
      } catch (error) {
        console.error(`Failed to get rates from ${protocol.name}:`, error);
      }
    }

    // 按APY排序
    supplyRates.sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));
    borrowRates.sort((a, b) => parseFloat(a.apy) - parseFloat(b.apy));

    return { supply: supplyRates, borrow: borrowRates };
  }

  /**
   * 执行代币交换
   */
  async executeSwap(protocolName: string, params: SwapParams): Promise<TransactionResult> {
    const protocol = this.getDEXProtocol(protocolName);
    const wallet = this.walletManager.getWallet(params.chainId);

    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    return await protocol.executeSwap(params, wallet.privateKey);
  }

  /**
   * 添加流动性
   */
  async addLiquidity(protocolName: string, params: LiquidityParams): Promise<TransactionResult> {
    const protocol = this.getDEXProtocol(protocolName);
    const wallet = this.walletManager.getWallet(params.chainId);

    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    return await protocol.addLiquidity(params, wallet.privateKey);
  }

  /**
   * 供应资产到借贷协议
   */
  async supplyAsset(protocolName: string, params: SupplyParams): Promise<TransactionResult> {
    const protocol = this.getLendingProtocol(protocolName);
    const wallet = this.walletManager.getWallet(params.chainId);

    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    return await protocol.supply(params, wallet.privateKey);
  }

  /**
   * 从借贷协议借贷资产
   */
  async borrowAsset(protocolName: string, params: BorrowParams): Promise<TransactionResult> {
    const protocol = this.getLendingProtocol(protocolName);
    const wallet = this.walletManager.getWallet(params.chainId);

    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    return await protocol.borrow(params, wallet.privateKey);
  }

  /**
   * 获取用户DeFi仓位概览
   */
  async getUserDeFiPositions(userAddress: string, chainId: string): Promise<{
    lending: { [protocol: string]: any };
    liquidity: { [protocol: string]: any };
  }> {
    const lendingProtocols = this.getAvailableLendingProtocols(chainId);
    const lendingPositions: { [protocol: string]: any } = {};
    
    for (const protocol of lendingProtocols) {
      try {
        const position = await protocol.getUserPosition(userAddress, chainId);
        lendingPositions[protocol.name] = position;
      } catch (error) {
        console.error(`Failed to get position from ${protocol.name}:`, error);
      }
    }

    return {
      lending: lendingPositions,
      liquidity: {} // TODO: 实现流动性仓位查询
    };
  }
}