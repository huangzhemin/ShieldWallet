/**
 * Fireblocks MPC 配置示例
 * 此文件展示如何配置 Fireblocks 门限签名服务
 */

import { FireblocksConfig } from '../services/FireblocksService';
import { MPCWalletConfig } from '../services/FireblocksManagerService';
import { ChainType } from '../types/chain';

/**
 * Fireblocks API 配置示例
 * 注意：实际使用时请将敏感信息存储在环境变量中
 */
export const fireblocksConfigExample: FireblocksConfig = {
  // Fireblocks API 密钥 ID
  apiKey: process.env.FIREBLOCKS_API_KEY || 'your-api-key-here',
  
  // Fireblocks 私钥路径或内容
  privateKey: process.env.FIREBLOCKS_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
// 您的私钥内容
-----END PRIVATE KEY-----`,
  
  // API 基础 URL（生产环境或沙盒环境）
  baseUrl: process.env.FIREBLOCKS_BASE_URL || 'https://api.fireblocks.io',
  
  // 超时设置（毫秒）
  timeoutMs: 30000
};

/**
 * MPC 钱包配置示例
 */
export const mpcWalletConfigExample: Omit<MPCWalletConfig, 'id' | 'vaultAccountId' | 'createdAt'> = {
  name: 'ShieldWallet MPC 钱包',
  
  // 支持的链配置
  chainConfigs: [
    {
      id: 'ethereum-mainnet',
      type: ChainType.EVM,
      category: 'mainnet' as any,
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      decimals: 18,
      rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
      blockExplorerUrl: 'https://etherscan.io',
      chainId: 1,
      isTestnet: false
    },
    {
      id: 'polygon-mainnet',
      type: ChainType.EVM,
      category: 'layer2' as any,
      name: 'Polygon Mainnet',
      symbol: 'MATIC',
      decimals: 18,
      rpcUrl: 'https://polygon-rpc.com',
      blockExplorerUrl: 'https://polygonscan.com',
      chainId: 137,
      isTestnet: false
    },
    {
      id: 'solana-mainnet',
      type: ChainType.SOLANA,
      category: 'mainnet' as any,
      name: 'Solana Mainnet',
      symbol: 'SOL',
      decimals: 9,
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      blockExplorerUrl: 'https://explorer.solana.com',
      isTestnet: false
    }
  ],
  
  // 门限签名策略
  thresholdPolicy: {
    // 需要的签名者数量（门限值）
    requiredSigners: 2,
    
    // 总签名者数量
    totalSigners: 3,
    
    // 签名者 ID 列表
    signerIds: [
      'signer_1_device_id',
      'signer_2_device_id', 
      'signer_3_device_id'
    ]
  },
  
  // 安全策略
  securityPolicy: {
    // 是否需要手动批准所有交易
    requireApproval: true,
    
    // 自动批准的金额限制（ETH）
    autoApprovalLimit: '0.1',
    
    // 白名单地址（可选）
    whitelistedAddresses: [
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // 示例地址
      '0x8ba1f109551bD432803012645Hac136c5C1515BC'  // 示例地址
    ],
    
    // 黑名单地址（可选）
    blacklistedAddresses: [
      '0x0000000000000000000000000000000000000000' // 零地址
    ]
  }
};

/**
 * 门限签名策略配置示例
 */
export const thresholdPolicyExamples = {
  // 2-of-3 多重签名
  twoOfThree: {
    requiredSigners: 2,
    totalSigners: 3,
    signerIds: ['device_1', 'device_2', 'device_3']
  },
  
  // 3-of-5 多重签名（更高安全性）
  threeOfFive: {
    requiredSigners: 3,
    totalSigners: 5,
    signerIds: ['device_1', 'device_2', 'device_3', 'device_4', 'device_5']
  },
  
  // 1-of-1 单签名（测试用）
  singleSig: {
    requiredSigners: 1,
    totalSigners: 1,
    signerIds: ['primary_device']
  }
};

/**
 * 安全策略配置示例
 */
export const securityPolicyExamples = {
  // 高安全性策略
  highSecurity: {
    requireApproval: true,
    autoApprovalLimit: '0.01', // 很低的自动批准限制
    whitelistedAddresses: [], // 仅白名单地址
    blacklistedAddresses: [
      '0x0000000000000000000000000000000000000000'
    ]
  },
  
  // 中等安全性策略
  mediumSecurity: {
    requireApproval: true,
    autoApprovalLimit: '0.1',
    whitelistedAddresses: undefined, // 不限制白名单
    blacklistedAddresses: [
      '0x0000000000000000000000000000000000000000'
    ]
  },
  
  // 便利性优先策略（不推荐生产环境）
  convenience: {
    requireApproval: false,
    autoApprovalLimit: '1.0',
    whitelistedAddresses: undefined,
    blacklistedAddresses: []
  }
};

/**
 * 环境变量配置指南
 */
export const environmentVariables = {
  // 必需的环境变量
  required: [
    'FIREBLOCKS_API_KEY',      // Fireblocks API 密钥
    'FIREBLOCKS_PRIVATE_KEY',  // Fireblocks 私钥
  ],
  
  // 可选的环境变量
  optional: [
    'FIREBLOCKS_BASE_URL',     // API 基础 URL（默认：生产环境）
    'FIREBLOCKS_TIMEOUT',      // 请求超时时间（默认：30000ms）
    'NODE_ENV'                 // 环境模式（development/production）
  ]
};

/**
 * 使用示例
 */
export const usageExample = `
// 1. 初始化 Fireblocks 服务
import { FireblocksManagerService } from '../services/FireblocksManagerService';
import { SecurityService } from '../services/SecurityService';
import { NotificationService } from '../services/NotificationService';

const securityService = new SecurityService();
const notificationService = new NotificationService();

const fireblocksManager = new FireblocksManagerService(
  fireblocksConfigExample,
  securityService,
  notificationService
);

// 2. 初始化服务
await fireblocksManager.initialize();

// 3. 创建 MPC 钱包
const walletId = await fireblocksManager.createMPCWallet(
  'My MPC Wallet',
  mpcWalletConfigExample.chainConfigs,
  mpcWalletConfigExample.thresholdPolicy,
  mpcWalletConfigExample.securityPolicy
);

// 4. 创建门限签名请求
const requestId = await fireblocksManager.createSignatureRequest(
  walletId,
  {
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    value: '0.1',
    chainType: ChainType.EVM
  },
  {
    userId: 'user_123',
    deviceId: 'device_456'
  }
);

// 5. 批准签名请求
const approved = await fireblocksManager.approveSignatureRequest(
  requestId,
  'signer_1_device_id',
  true
);

console.log('交易已执行:', approved);
`;

/**
 * 安全最佳实践
 */
export const securityBestPractices = [
  '1. 永远不要在代码中硬编码 API 密钥和私钥',
  '2. 使用环境变量存储敏感信息',
  '3. 在生产环境中启用严格的安全策略',
  '4. 定期轮换 API 密钥',
  '5. 监控所有 MPC 交易和签名请求',
  '6. 设置合理的自动批准限制',
  '7. 维护签名者设备的安全',
  '8. 定期备份钱包配置',
  '9. 使用白名单限制交易目标地址',
  '10. 启用交易通知和警报'
];