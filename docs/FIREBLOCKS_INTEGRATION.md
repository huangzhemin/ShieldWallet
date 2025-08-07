# Fireblocks MPC 门限签名集成指南

本文档详细介绍了 ShieldWallet 中 Fireblocks MPC（多方计算）门限签名功能的集成和使用方法。

## 目录

- [概述](#概述)
- [架构设计](#架构设计)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 参考](#api-参考)
- [安全最佳实践](#安全最佳实践)
- [故障排除](#故障排除)

## 概述

### 什么是 MPC 门限签名？

MPC（Multi-Party Computation）门限签名是一种先进的密码学技术，允许多个参与方共同生成数字签名，而无需在任何单一位置重构完整的私钥。这种技术提供了以下优势：

- **增强安全性**：私钥永远不会在单一位置完整存在
- **分布式控制**：需要多个授权方共同批准交易
- **容错能力**：即使部分签名者不可用，仍可完成签名
- **合规性**：满足企业级安全和合规要求

### Fireblocks 集成优势

- **企业级安全**：银行级别的安全基础设施
- **多链支持**：支持 100+ 区块链网络
- **高性能**：快速的签名生成和交易处理
- **合规性**：符合 SOC2、ISO27001 等标准
- **API 友好**：完善的 REST API 和 SDK

## 架构设计

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                    ShieldWallet Frontend                   │
├─────────────────────────────────────────────────────────────┤
│                FireblocksManagerService                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   MPC Wallet    │  │  Threshold      │  │  Security   │ │
│  │   Management    │  │  Signature      │  │  Policy     │ │
│  │                 │  │  Requests       │  │  Engine     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   FireblocksService                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   API Client    │  │   JWT Auth      │  │   Request   │ │
│  │                 │  │                 │  │   Handler   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   FireblocksAdapter                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Chain         │  │   Transaction   │  │   Balance   │ │
│  │   Abstraction   │  │   Execution     │  │   Query     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Fireblocks Platform                     │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **钱包创建**：用户创建 MPC 钱包，系统在 Fireblocks 中创建 Vault 账户
2. **交易发起**：用户发起交易，创建门限签名请求
3. **策略验证**：系统验证安全策略和门限要求
4. **签名收集**：收集所需数量的签名者批准
5. **交易执行**：达到门限后，通过 Fireblocks MPC 执行交易
6. **状态同步**：更新交易状态和通知相关方

## 快速开始

### 1. 环境准备

首先，确保您有 Fireblocks 账户和 API 凭证：

```bash
# 设置环境变量
export FIREBLOCKS_API_KEY="your-api-key"
export FIREBLOCKS_PRIVATE_KEY="$(cat path/to/your/private-key.pem)"
export FIREBLOCKS_BASE_URL="https://api.fireblocks.io"
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化服务

```typescript
import { 
  FireblocksManagerService, 
  FireblocksConfig 
} from './src/services';
import { SecurityService } from './src/services/SecurityService';
import { NotificationService } from './src/services/NotificationService';

// 配置 Fireblocks
const fireblocksConfig: FireblocksConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY!,
  privateKey: process.env.FIREBLOCKS_PRIVATE_KEY!,
  baseUrl: process.env.FIREBLOCKS_BASE_URL,
  timeoutMs: 30000
};

// 初始化服务
const securityService = new SecurityService();
const notificationService = new NotificationService();
const fireblocksManager = new FireblocksManagerService(
  fireblocksConfig,
  securityService,
  notificationService
);

// 启动服务
await fireblocksManager.initialize();
```

### 4. 创建 MPC 钱包

```typescript
import { ChainType } from './src/types/chain';

// 定义支持的链
const chainConfigs = [
  {
    id: 'ethereum-mainnet',
    type: ChainType.EVM,
    category: 'mainnet',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
    blockExplorerUrl: 'https://etherscan.io',
    chainId: 1,
    isTestnet: false
  }
];

// 定义门限策略（2-of-3 多重签名）
const thresholdPolicy = {
  requiredSigners: 2,
  totalSigners: 3,
  signerIds: ['device_1', 'device_2', 'device_3']
};

// 定义安全策略
const securityPolicy = {
  requireApproval: true,
  autoApprovalLimit: '0.1', // 0.1 ETH 以下自动批准
  whitelistedAddresses: [],
  blacklistedAddresses: ['0x0000000000000000000000000000000000000000']
};

// 创建钱包
const walletId = await fireblocksManager.createMPCWallet(
  'My Enterprise Wallet',
  chainConfigs,
  thresholdPolicy,
  securityPolicy
);

console.log('MPC 钱包创建成功:', walletId);
```

### 5. 发起门限签名交易

```typescript
// 创建签名请求
const requestId = await fireblocksManager.createSignatureRequest(
  walletId,
  {
    to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    value: '0.05', // 0.05 ETH
    chainType: ChainType.EVM
  },
  {
    userId: 'user_123',
    deviceId: 'device_456',
    ipAddress: '192.168.1.100'
  }
);

console.log('签名请求已创建:', requestId);
```

### 6. 批准签名请求

```typescript
// 第一个签名者批准
const approved1 = await fireblocksManager.approveSignatureRequest(
  requestId,
  'device_1',
  true
);

// 第二个签名者批准（达到门限，自动执行交易）
const approved2 = await fireblocksManager.approveSignatureRequest(
  requestId,
  'device_2',
  true
);

if (approved2) {
  console.log('交易已执行！');
}
```

## 配置说明

### Fireblocks 配置

```typescript
interface FireblocksConfig {
  apiKey: string;        // Fireblocks API 密钥
  privateKey: string;    // PEM 格式的私钥
  baseUrl?: string;      // API 基础 URL
  timeoutMs?: number;    // 请求超时时间
}
```

### MPC 钱包配置

```typescript
interface MPCWalletConfig {
  id: string;                    // 钱包唯一标识
  name: string;                  // 钱包名称
  vaultAccountId: string;        // Fireblocks Vault 账户 ID
  chainConfigs: ChainConfig[];   // 支持的链配置
  thresholdPolicy: {             // 门限策略
    requiredSigners: number;     // 所需签名者数量
    totalSigners: number;        // 总签名者数量
    signerIds: string[];         // 签名者 ID 列表
  };
  securityPolicy: {              // 安全策略
    requireApproval: boolean;    // 是否需要手动批准
    autoApprovalLimit?: string;  // 自动批准限额
    whitelistedAddresses?: string[]; // 白名单地址
    blacklistedAddresses?: string[]; // 黑名单地址
  };
}
```

### 门限策略示例

```typescript
// 2-of-3 多重签名（推荐）
const twoOfThree = {
  requiredSigners: 2,
  totalSigners: 3,
  signerIds: ['ceo_device', 'cfo_device', 'cto_device']
};

// 3-of-5 多重签名（高安全性）
const threeOfFive = {
  requiredSigners: 3,
  totalSigners: 5,
  signerIds: ['device_1', 'device_2', 'device_3', 'device_4', 'device_5']
};

// 1-of-1 单签名（测试用）
const singleSig = {
  requiredSigners: 1,
  totalSigners: 1,
  signerIds: ['primary_device']
};
```

## API 参考

### FireblocksManagerService

#### 初始化

```typescript
async initialize(): Promise<void>
```

初始化 Fireblocks 管理服务。

#### 创建 MPC 钱包

```typescript
async createMPCWallet(
  name: string,
  chainConfigs: ChainConfig[],
  thresholdPolicy: MPCWalletConfig['thresholdPolicy'],
  securityPolicy: MPCWalletConfig['securityPolicy']
): Promise<string>
```

创建新的 MPC 钱包。

**参数：**
- `name`: 钱包名称
- `chainConfigs`: 支持的链配置
- `thresholdPolicy`: 门限签名策略
- `securityPolicy`: 安全策略

**返回：** 钱包 ID

#### 创建签名请求

```typescript
async createSignatureRequest(
  walletId: string,
  transactionData: {
    to: string;
    value: string;
    data?: string;
    chainType: ChainType;
  },
  requesterInfo: {
    userId?: string;
    deviceId?: string;
    ipAddress?: string;
  }
): Promise<string>
```

创建门限签名请求。

**返回：** 请求 ID

#### 批准签名请求

```typescript
async approveSignatureRequest(
  requestId: string,
  signerId: string,
  approved: boolean
): Promise<boolean>
```

批准或拒绝签名请求。

**返回：** 是否已执行交易

#### 获取钱包列表

```typescript
getMPCWallets(): MPCWalletConfig[]
```

获取所有 MPC 钱包配置。

#### 获取签名请求

```typescript
getSignatureRequests(walletId?: string): MPCSignatureRequest[]
```

获取签名请求列表。

### FireblocksAdapter

#### 生成钱包地址

```typescript
async generateWallet(mnemonic: string, derivationPath?: string): Promise<{
  address: string;
  privateKey: string;
}>
```

#### 获取余额

```typescript
async getBalance(address: string): Promise<string>
```

#### 发送交易

```typescript
async sendTransaction(
  params: TransactionParams,
  privateKey: string
): Promise<TransactionResult>
```

## 安全最佳实践

### 1. 密钥管理

- ✅ 使用环境变量存储 API 密钥和私钥
- ✅ 定期轮换 API 密钥
- ✅ 使用硬件安全模块（HSM）保护私钥
- ❌ 永远不要在代码中硬编码密钥

### 2. 门限策略

- ✅ 使用 2-of-3 或更高的门限策略
- ✅ 确保签名者设备的物理安全
- ✅ 定期审查和更新签名者列表
- ✅ 为不同金额设置不同的门限要求

### 3. 安全策略

- ✅ 启用交易批准流程
- ✅ 设置合理的自动批准限额
- ✅ 维护白名单和黑名单地址
- ✅ 监控所有交易活动

### 4. 网络安全

- ✅ 使用 HTTPS 进行所有 API 通信
- ✅ 实施 IP 白名单
- ✅ 启用 API 速率限制
- ✅ 监控异常访问模式

### 5. 合规性

- ✅ 记录所有交易和批准活动
- ✅ 实施职责分离
- ✅ 定期安全审计
- ✅ 遵循相关法规要求

## 故障排除

### 常见问题

#### 1. API 认证失败

**错误：** `Authentication failed`

**解决方案：**
- 检查 API 密钥是否正确
- 验证私钥格式是否为 PEM
- 确认 JWT 签名算法正确

#### 2. 门限未达到

**错误：** `Insufficient signatures`

**解决方案：**
- 检查已批准的签名者数量
- 验证签名者 ID 是否正确
- 确认签名请求未过期

#### 3. 安全策略违规

**错误：** `Security policy violation`

**解决方案：**
- 检查目标地址是否在黑名单中
- 验证交易金额是否超过限制
- 确认是否需要手动批准

#### 4. 网络连接问题

**错误：** `Network timeout`

**解决方案：**
- 检查网络连接
- 验证 Fireblocks API 状态
- 增加超时时间设置

### 调试技巧

1. **启用详细日志**
   ```typescript
   // 在开发环境中启用调试日志
   process.env.DEBUG = 'fireblocks:*';
   ```

2. **检查服务状态**
   ```typescript
   const status = fireblocksManager.getServiceStatus();
   console.log('服务状态:', status);
   ```

3. **验证配置**
   ```typescript
   const isValid = fireblocksService.validateConfig();
   console.log('配置有效:', isValid);
   ```

### 支持资源

- [Fireblocks 官方文档](https://docs.fireblocks.com/)
- [Fireblocks API 参考](https://docs.fireblocks.com/api/)
- [ShieldWallet 技术支持](mailto:support@shieldwallet.com)

## 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- ✨ 支持 Fireblocks MPC 集成
- ✨ 实现门限签名功能
- ✨ 添加多链支持
- ✨ 完善安全策略管理

---

**注意：** 本文档持续更新中，如有疑问请联系技术支持团队。