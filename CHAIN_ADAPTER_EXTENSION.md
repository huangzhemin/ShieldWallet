# ShieldWallet 链适配器扩展

本文档描述了 ShieldWallet 的链适配器扩展功能，包括所有新增的服务模块和功能特性。

## 📋 概述

链适配器扩展为 ShieldWallet 提供了全面的多链支持和服务管理能力，包括：

- 🔗 多链适配器管理
- 💰 DeFi 协议集成
- 🖼️ NFT 管理
- 🔒 安全服务
- 💾 存储管理
- 📊 价格服务
- 📱 通知系统
- 💳 钱包管理
- 📈 交易服务

## 🏗️ 架构设计

### 核心组件

```
src/
├── adapters/
│   └── ChainAdapterManager.ts     # 链适配器管理器
├── services/
│   ├── DeFiProtocolService.ts      # DeFi协议服务
│   ├── NFTService.ts               # NFT服务
│   ├── SecurityService.ts          # 安全服务
│   ├── StorageService.ts           # 存储服务
│   ├── PriceService.ts             # 价格服务
│   ├── NotificationService.ts      # 通知服务
│   ├── WalletManagerService.ts     # 钱包管理服务
│   ├── TransactionService.ts       # 交易服务
│   └── index.ts                    # 服务统一导出
└── types/
    └── chain.ts                    # 链相关类型定义
```

## 🔧 服务模块详解

### 1. ChainAdapterManager (链适配器管理器)

**位置**: `src/adapters/ChainAdapterManager.ts`

**功能**:
- 统一管理所有链适配器
- 支持动态注册/移除适配器
- 链切换和连接管理
- 适配器状态监控
- 事件驱动架构

**主要方法**:
```typescript
// 注册适配器
await chainAdapterManager.registerAdapter(config);

// 切换链
await chainAdapterManager.switchChain(ChainType.EVM);

// 获取当前适配器
const adapter = chainAdapterManager.getCurrentAdapter();

// 监听事件
chainAdapterManager.addEventListener(AdapterEventType.CHAIN_SWITCHED, handler);
```

### 2. DeFiProtocolService (DeFi协议服务)

**位置**: `src/services/DeFiProtocolService.ts`

**功能**:
- 支持多种DeFi协议 (Uniswap, PancakeSwap, Aave, Compound)
- 代币交换功能
- 流动性管理
- 借贷功能
- 最优价格发现

**支持的协议**:
- **DEX**: Uniswap V3, PancakeSwap
- **借贷**: Aave, Compound

**使用示例**:
```typescript
// 获取最佳交换价格
const bestPrice = await defiService.getBestSwapPrice(
  tokenIn, tokenOut, amountIn, chainId
);

// 执行交换
const result = await defiService.executeSwap('uniswap', swapParams);

// 获取借贷利率
const rates = await defiService.getBestLendingRates(tokenAddress, chainId);
```

### 3. NFTService (NFT服务)

**位置**: `src/services/NFTService.ts`

**功能**:
- NFT查看和管理
- NFT转账功能
- NFT铸造支持
- 市场数据获取
- 批量操作支持

**主要功能**:
```typescript
// 获取用户NFT
const nfts = await nftService.getUserNFTs(address, chainId);

// 转账NFT
const result = await nftService.transferNFT(transferParams);

// 获取市场数据
const marketData = await nftService.getNFTMarketData(contractAddress, tokenId);
```

### 4. SecurityService (安全服务)

**位置**: `src/services/SecurityService.ts`

**功能**:
- 数据加密/解密
- 钱包备份和恢复
- 生物识别认证
- 安全策略管理
- 安全事件监控

**安全特性**:
```typescript
// 加密数据
const encrypted = await securityService.encrypt(data, password);

// 创建钱包备份
const backup = await securityService.createWalletBackup(walletData, password);

// 生物识别认证
const isAuthenticated = await securityService.authenticateWithBiometrics();
```

### 5. StorageService (存储服务)

**位置**: `src/services/StorageService.ts`

**功能**:
- 多种存储类型支持 (本地、会话、安全、缓存、数据库)
- 数据压缩和加密
- 自动清理和过期管理
- 存储统计和监控

**存储类型**:
- `LOCAL`: 本地持久存储
- `SESSION`: 会话存储
- `SECURE`: 安全加密存储
- `CACHE`: 缓存存储
- `DATABASE`: 数据库存储

### 6. PriceService (价格服务)

**位置**: `src/services/PriceService.ts`

**功能**:
- 实时价格获取
- 历史价格数据
- 价格预警
- 多数据源支持
- 市场数据分析

**数据源**:
- CoinGecko
- CoinMarketCap
- Binance API

### 7. NotificationService (通知服务)

**位置**: `src/services/NotificationService.ts`

**功能**:
- 多种通知类型
- 批量通知发送
- 通知优先级管理
- 静默时间设置
- 通知统计分析

**通知类型**:
- 交易确认
- 价格预警
- 安全提醒
- 系统更新

### 8. WalletManagerService (钱包管理服务)

**位置**: `src/services/WalletManagerService.ts`

**功能**:
- 多钱包管理
- 钱包创建/导入/导出
- 账户管理
- 钱包同步
- 安全锁定

**钱包类型**:
- `MNEMONIC`: 助记词钱包
- `PRIVATE_KEY`: 私钥钱包
- `HARDWARE`: 硬件钱包
- `WATCH_ADDRESS`: 观察钱包

### 9. TransactionService (交易服务)

**位置**: `src/services/TransactionService.ts`

**功能**:
- 交易创建和管理
- 交易状态跟踪
- 手续费估算
- 批量交易
- 交易加速/取消

**交易类型**:
- `SEND`: 转账
- `RECEIVE`: 接收
- `SWAP`: 交换
- `APPROVE`: 授权
- `CONTRACT`: 合约调用

## 🚀 使用指南

### 1. 初始化服务

```typescript
import { ServiceManager, chainAdapterManager } from './src/services';

// 初始化服务管理器
await ServiceManager.initialize();

// 初始化链适配器管理器
await chainAdapterManager.initialize();
```

### 2. 获取服务实例

```typescript
// 获取各种服务
const securityService = ServiceManager.getSecurityService();
const walletService = ServiceManager.getWalletManagerService();
const defiService = ServiceManager.getDeFiService();
const nftService = ServiceManager.getNFTService();
const priceService = ServiceManager.getPriceService();
```

### 3. 多链操作示例

```typescript
// 切换到以太坊
await chainAdapterManager.switchChain(ChainType.EVM);

// 获取当前链适配器
const adapter = chainAdapterManager.getCurrentAdapter();

// 获取余额
const balance = await adapter.getBalance(address);

// 发送交易
const result = await adapter.sendTransaction(params, privateKey);
```

### 4. DeFi操作示例

```typescript
// 获取最佳交换价格
const bestPrice = await defiService.getBestSwapPrice(
  '0xA0b86a33E6441E6C7E8E93D0C2E8E8E8E8E8E8E8', // USDC
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '1000000000', // 1000 USDC
  '1' // Ethereum mainnet
);

// 执行交换
if (bestPrice) {
  const swapParams = {
    chainId: '1',
    tokenIn: '0xA0b86a33E6441E6C7E8E93D0C2E8E8E8E8E8E8E8',
    tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    amountIn: '1000000000',
    slippage: 0.5,
    recipient: userAddress
  };
  
  const result = await defiService.executeSwap(bestPrice.protocol, swapParams);
}
```

### 5. NFT操作示例

```typescript
// 获取用户NFT
const nfts = await nftService.getUserNFTs(userAddress, '1');

// 转账NFT
const transferParams = {
  chainId: '1',
  contractAddress: '0x...',
  tokenId: '123',
  from: userAddress,
  to: recipientAddress
};

const result = await nftService.transferNFT(transferParams);
```

## 🔐 安全特性

### 1. 数据加密
- 使用 AES-256-GCM 加密算法
- 随机盐值和初始化向量
- 认证标签验证数据完整性

### 2. 安全存储
- 分层存储架构
- 敏感数据加密存储
- 自动数据清理

### 3. 访问控制
- 生物识别认证
- 密码保护
- 会话管理

## 📊 监控和统计

### 1. 服务统计
```typescript
// 获取适配器统计
const stats = chainAdapterManager.getStats();

// 获取交易统计
const txStats = await transactionService.getStats();

// 获取存储统计
const storageStats = await storageService.getStats();
```

### 2. 事件监控
```typescript
// 监听链切换事件
chainAdapterManager.addEventListener(
  AdapterEventType.CHAIN_SWITCHED,
  (event) => {
    console.log('链已切换:', event.chainType);
  }
);

// 监听交易事件
transactionService.addEventListener(
  TransactionEventType.TRANSACTION_CONFIRMED,
  (event) => {
    console.log('交易已确认:', event.data.hash);
  }
);
```

## 🛠️ 扩展开发

### 1. 添加新的链适配器

```typescript
// 实现 ChainAdapter 接口
class NewChainAdapter implements ChainAdapter {
  getChainConfig(): ChainConfig {
    // 实现链配置
  }
  
  async generateWallet(mnemonic: string): Promise<{address: string; privateKey: string}> {
    // 实现钱包生成
  }
  
  // 实现其他必要方法...
}

// 注册新适配器
await chainAdapterManager.registerAdapter({
  chainType: ChainType.NEW_CHAIN,
  adapter: new NewChainAdapter(),
  enabled: true,
  priority: 4,
  rpcEndpoints: ['https://rpc.newchain.com'],
  explorerUrl: 'https://explorer.newchain.com',
  nativeCurrency: {
    name: 'NewChain',
    symbol: 'NEW',
    decimals: 18
  }
});
```

### 2. 添加新的DeFi协议

```typescript
// 实现协议接口
class NewDEXProtocol implements DEXProtocol {
  name = 'NewDEX';
  supportedChains = ['ethereum'];
  protocolType: 'DEX' = 'DEX';
  
  // 实现协议方法...
}

// 在DeFiProtocolService中注册
defiService.registerProtocol(new NewDEXProtocol());
```

## 📝 配置说明

### 1. 环境变量

```env
# RPC节点配置
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
APTOS_RPC_URL=https://fullnode.mainnet.aptoslabs.com/v1

# API密钥
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
BINANCE_API_KEY=your_binance_api_key

# 安全配置
ENCRYPTION_KEY=your_encryption_key
BIOTMETRIC_ENABLED=true
```

### 2. 服务配置

```typescript
// 存储配置
const storageConfig = {
  maxSize: 100 * 1024 * 1024, // 100MB
  compressionEnabled: true,
  encryptionEnabled: true,
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000 // 24小时
};

// 通知配置
const notificationConfig = {
  maxNotifications: 1000,
  batchSize: 10,
  rateLimitPerMinute: 60,
  quietHours: {
    start: '22:00',
    end: '08:00'
  }
};
```

## 🔄 更新日志

### v1.0.0 (当前版本)
- ✅ 完成链适配器管理器
- ✅ 完成DeFi协议服务
- ✅ 完成NFT服务
- ✅ 完成安全服务
- ✅ 完成存储服务
- ✅ 完成价格服务
- ✅ 完成通知服务
- ✅ 完成钱包管理服务
- ✅ 完成交易服务
- ✅ 完成服务统一管理

### 计划功能
- 🔄 网络服务完善
- 🔄 跨链桥接功能
- 🔄 高级DeFi策略
- 🔄 NFT市场集成
- 🔄 移动端适配

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- 📧 Email: support@shieldwallet.com
- 💬 Discord: ShieldWallet Community
- 📱 Telegram: @ShieldWalletSupport
- 🐛 Issues: GitHub Issues

---

**ShieldWallet 链适配器扩展** - 为多链DeFi世界构建的强大基础设施 🚀