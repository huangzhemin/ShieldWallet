import { ChainConfig, ChainType, NetworkCategory } from '../types/chain';

/**
 * 支持的区块链网络配置
 */
export const CHAIN_CONFIGS: { [key: string]: ChainConfig } = {
  // EVM 主网
  'ethereum': {
    id: 'ethereum',
    name: '以太坊主网',
    type: ChainType.EVM,
    category: NetworkCategory.MAINNET,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    chainId: 1,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    isTestnet: false
  },
  'polygon': {
    id: 'polygon',
    name: 'Polygon主网',
    type: ChainType.EVM,
    category: NetworkCategory.LAYER2,
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    symbol: 'MATIC',
    decimals: 18,
    blockExplorerUrl: 'https://polygonscan.com',
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isTestnet: false
  },
  'bsc': {
    id: 'bsc',
    name: 'BSC主网',
    type: ChainType.EVM,
    category: NetworkCategory.MAINNET,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    symbol: 'BNB',
    decimals: 18,
    blockExplorerUrl: 'https://bscscan.com',
    iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    isTestnet: false
  },
  
  // Layer 2
  'arbitrum': {
    id: 'arbitrum',
    name: 'Arbitrum One',
    type: ChainType.EVM,
    category: NetworkCategory.LAYER2,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://arbiscan.io',
    iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    isTestnet: false
  },
  'optimism': {
    id: 'optimism',
    name: 'Optimism',
    type: ChainType.EVM,
    category: NetworkCategory.LAYER2,
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    isTestnet: false
  },
  'zksync': {
    id: 'zksync',
    name: 'zkSync Era',
    type: ChainType.EVM,
    category: NetworkCategory.LAYER2,
    rpcUrl: 'https://mainnet.era.zksync.io',
    chainId: 324,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://explorer.zksync.io',
    iconUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
    isTestnet: false
  },
  
  // 非EVM链
  'solana': {
    id: 'solana',
    name: 'Solana主网',
    type: ChainType.SOLANA,
    category: NetworkCategory.MAINNET,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    symbol: 'SOL',
    decimals: 9,
    blockExplorerUrl: 'https://explorer.solana.com',
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    isTestnet: false
  },
  'aptos': {
    id: 'aptos',
    name: 'Aptos主网',
    type: ChainType.APTOS,
    category: NetworkCategory.MAINNET,
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    symbol: 'APT',
    decimals: 8,
    blockExplorerUrl: 'https://explorer.aptoslabs.com',
    iconUrl: 'https://cryptologos.cc/logos/aptos-apt-logo.png',
    isTestnet: false
  },
  
  // 测试网
  'ethereum-goerli': {
    id: 'ethereum-goerli',
    name: 'Ethereum Goerli',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/demo',
    chainId: 5,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://goerli.etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    isTestnet: true
  },
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    name: 'Sepolia测试网',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    chainId: 11155111,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    isTestnet: true
  },
  'polygon-mumbai': {
    id: 'polygon-mumbai',
    name: 'Mumbai测试网',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    symbol: 'MATIC',
    decimals: 18,
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isTestnet: true
  },
  'arbitrum-goerli': {
    id: 'arbitrum-goerli',
    name: 'Arbitrum Goerli',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
    chainId: 421613,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://goerli.arbiscan.io',
    iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    isTestnet: true
  },
  'optimism-goerli': {
    id: 'optimism-goerli',
    name: 'Optimism Goerli',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://goerli.optimism.io',
    chainId: 420,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://goerli-optimism.etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    isTestnet: true
  },
  'zksync-testnet': {
    id: 'zksync-testnet',
    name: 'zkSync Era Testnet',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://testnet.era.zksync.dev',
    chainId: 280,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://goerli.explorer.zksync.io',
    iconUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
    isTestnet: true
  },
  'bsc-testnet': {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    type: ChainType.EVM,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    symbol: 'BNB',
    decimals: 18,
    blockExplorerUrl: 'https://testnet.bscscan.com',
    iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    isTestnet: true
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana开发网',
    type: ChainType.SOLANA,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://api.devnet.solana.com',
    symbol: 'SOL',
    decimals: 9,
    blockExplorerUrl: 'https://explorer.solana.com?cluster=devnet',
    iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    isTestnet: true
  },
  'aptos-testnet': {
    id: 'aptos-testnet',
    name: 'Aptos测试网',
    type: ChainType.APTOS,
    category: NetworkCategory.TESTNET,
    rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    symbol: 'APT',
    decimals: 8,
    blockExplorerUrl: 'https://explorer.aptoslabs.com/?network=testnet',
    iconUrl: 'https://cryptologos.cc/logos/aptos-apt-logo.png',
    isTestnet: true
  }
};

/**
 * 支持的链列表
 */
export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS);

/**
 * 获取所有支持的链
 */
export function getAllChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

/**
 * 根据类型获取链
 */
export function getChainsByType(type: ChainType): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.type === type);
}

/**
 * 根据类别获取链
 */
export function getChainsByCategory(category: NetworkCategory): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.category === category);
}

/**
 * 获取主网链
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet);
}

/**
 * 获取测试网链
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.isTestnet);
}

/**
 * 根据链ID获取配置
 */
export function getChainConfig(chainId: string): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}

/**
 * 检查是否支持指定链
 */
export function isSupportedChain(chainId: string): boolean {
  return chainId in CHAIN_CONFIGS;
}