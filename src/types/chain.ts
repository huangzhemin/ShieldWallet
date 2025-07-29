/**
 * 链类型枚举
 */
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  APTOS = 'aptos'
}

/**
 * 网络类别枚举
 */
export enum NetworkCategory {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LAYER2 = 'layer2'
}

/**
 * 链配置接口
 */
export interface ChainConfig {
  id: string;
  name: string;
  type: ChainType;
  category: NetworkCategory;
  rpcUrl: string;
  chainId?: number; // EVM链使用
  symbol: string;
  decimals: number;
  blockExplorerUrl: string;
  iconUrl?: string;
  isTestnet: boolean;
}

/**
 * 代币信息接口
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: string;
}

/**
 * 账户信息接口
 */
export interface AccountInfo {
  address: string;
  balance: string;
  nativeBalance: string;
  tokens: TokenBalance[];
}

/**
 * 代币余额接口
 */
export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  usdValue?: string;
}

/**
 * 交易参数接口
 */
export interface TransactionParams {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

/**
 * 交易结果接口
 */
export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

/**
 * NFT信息接口
 */
export interface NFTInfo {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  chainId: string;
}

/**
 * DeFi协议接口
 */
export interface DeFiProtocol {
  id: string;
  name: string;
  type: 'dex' | 'lending' | 'yield' | 'bridge';
  chainIds: string[];
  contractAddresses: { [chainId: string]: string };
}

/**
 * 跨链桥接参数
 */
export interface BridgeParams {
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  recipient: string;
  slippage?: number;
}

/**
 * Gas费估算结果
 */
export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

/**
 * 链适配器接口
 */
export interface ChainAdapter {
  getChainConfig(): ChainConfig;
  generateWallet(mnemonic: string, derivationPath?: string): Promise<{ address: string; privateKey: string }>;
  getBalance(address: string): Promise<string>;
  getTokenBalance(address: string, tokenAddress: string): Promise<string>;
  estimateGas(params: TransactionParams): Promise<GasEstimate>;
  sendTransaction(params: TransactionParams, privateKey: string): Promise<TransactionResult>;
  getTransactionStatus(hash: string): Promise<TransactionResult>;
  getNFTs(address: string): Promise<NFTInfo[]>;
  validateAddress(address: string): boolean;
}