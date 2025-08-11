# LayerZero SVM到EVM跨链桥

## 概述

LayerZero SVM到EVM跨链桥是一个专门处理从Solana (SVM) 到各种EVM链的跨链操作的服务。它利用LayerZero协议的安全性和效率，为用户提供无缝的跨链体验。

## 特性

- ✅ **多链支持**: 支持从Solana跨链到所有主流EVM链
- ✅ **多代币支持**: 支持SOL、USDC、USDT等主流代币
- ✅ **智能费用计算**: 根据代币类型、金额和跨链距离动态计算费用
- ✅ **参数验证**: 完整的参数验证和错误处理
- ✅ **状态监控**: 实时查询跨链交易状态
- ✅ **路径分析**: 详细的跨链路径和费用分析

## 支持的链和代币

### 支持的EVM链
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **BSC** (Chain ID: 56)

### 支持的代币
- **SOL** - Solana原生代币
- **USDC** - USD Coin稳定币
- **USDT** - Tether稳定币

### 跨链组合
总计支持 **15种** 跨链组合：
- SOL → Ethereum
- SOL → Polygon
- SOL → Arbitrum
- SOL → Optimism
- SOL → BSC
- USDC → Ethereum
- USDC → Polygon
- USDC → Arbitrum
- USDC → Optimism
- USDC → BSC
- USDT → Ethereum
- USDT → Polygon
- USDT → Arbitrum
- USDT → Optimism
- USDT → BSC

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 基本使用

```typescript
import { LayerZeroSVMBridgeService } from './src/services/LayerZeroSVMBridgeService';
import { BridgeParams, SVMToEVMBridgeConfig } from './src/types/chain';

// 创建服务实例
const bridgeService = new LayerZeroSVMBridgeService();

// 定义跨链参数
const params: BridgeParams = {
  fromChain: 'solana',
  toChain: 'ethereum',
  token: 'SOL',
  amount: '100',
  recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
};

// 配置代币合约地址
const config: SVMToEVMBridgeConfig = {
  solanaTokenMint: 'So11111111111111111111111111111111111111112',
  evmTokenContract: '0x0000000000000000000000000000000000000000' // WETH
};

// 执行跨链
try {
  const result = await bridgeService.bridge(params, privateKey, config);
  console.log('跨链成功:', result.hash);
} catch (error) {
  console.error('跨链失败:', error);
}
```

### 3. 费用估算

```typescript
// 估算跨链费用
const fee = await bridgeService.estimateFee(params);
console.log('费用详情:', {
  nativeFee: fee.nativeFee,    // 原生代币费用
  zroFee: fee.zroFee,          // ZRO代币费用
  totalFee: fee.totalFee        // 总费用
});
```

### 4. 查询交易状态

```typescript
// 查询跨链状态
const status = await bridgeService.getTransactionStatus(txHash);
console.log('交易状态:', {
  status: status.status,
  confirmations: status.confirmations,
  estimatedCompletion: status.estimatedCompletion
});
```

## API参考

### LayerZeroSVMBridgeService

#### 构造函数
```typescript
constructor()
```

#### 方法

##### `isSupported(fromChain: string, toChain: string, token: string): boolean`
检查是否支持指定的跨链路径。

**参数:**
- `fromChain`: 源链名称
- `toChain`: 目标链名称  
- `token`: 代币符号

**返回值:** 是否支持该跨链路径

##### `estimateFee(params: BridgeParams): Promise<LayerZeroFee>`
估算跨链费用。

**参数:**
- `params`: 跨链参数

**返回值:** 费用详情对象

##### `bridge(params: BridgeParams, privateKey: string, config?: SVMToEVMBridgeConfig): Promise<TransactionResult>`
执行跨链操作。

**参数:**
- `params`: 跨链参数
- `privateKey`: 私钥
- `config`: 可选的配置参数

**返回值:** 交易结果

##### `getTransactionStatus(txHash: string): Promise<CrossChainTransaction>`
查询跨链交易状态。

**参数:**
- `txHash`: 交易哈希

**返回值:** 跨链交易状态

##### `validateBridgeParams(params: BridgeParams): { isValid: boolean; errors: string[] }`
验证跨链参数。

**参数:**
- `params`: 跨链参数

**返回值:** 验证结果

##### `getBridgeStats(): BridgeStats`
获取桥接统计信息。

**返回值:** 统计信息对象

## 费用结构

### 基础费用
- **SOL**: 0.002 ETH
- **USDC/USDT**: 0.0005 ETH
- **其他代币**: 0.001 ETH

### 费用调整因素
- **大额转账** (>$10,000): 费用 × 1.5
- **小额转账** (<$100): 费用 × 0.8
- **SVM到EVM**: 费用 × 1.3

### 费用计算示例
```typescript
// 100 SOL → Ethereum
// 基础费用: 0.002 ETH
// SVM到EVM调整: × 1.3
// 最终费用: 0.0026 ETH

// 1000 USDC → Polygon  
// 基础费用: 0.0005 ETH
// SVM到EVM调整: × 1.3
// 最终费用: 0.00065 ETH
```

## 跨链流程

### 1. 源链操作 (Solana)
- 锁定或销毁代币
- 调用LayerZero合约
- 等待确认

### 2. 中继层 (LayerZero)
- 验证交易有效性
- 处理跨链消息
- 中继到目标链

### 3. 目标链操作 (EVM)
- 接收跨链消息
- 铸造或释放代币
- 完成跨链

### 预计时间
- **Solana确认**: 1-2分钟
- **LayerZero中继**: 2-3分钟  
- **EVM确认**: 1-2分钟
- **总计**: 4-7分钟

## 安全注意事项

### 私钥安全
- 永远不要在代码中硬编码私钥
- 使用环境变量或安全的密钥管理服务
- 定期轮换私钥

### 地址验证
- 始终验证接收地址的正确性
- 使用checksum地址格式
- 测试网先验证，主网再执行

### 金额限制
- 设置合理的跨链金额上限
- 分批执行大额跨链
- 监控异常交易

## 错误处理

### 常见错误类型
```typescript
// 不支持的跨链路径
Error: 不支持的跨链路径: solana -> bitcoin (SOL)

// 不支持的代币
Error: 代币 SOL 在目标链 bitcoin 上不支持

// 无效的金额
Error: 金额必须大于0

// 地址格式错误
Error: 接收地址不能为空
```

### 错误处理最佳实践
```typescript
try {
  const result = await bridgeService.bridge(params, privateKey, config);
  // 处理成功情况
} catch (error) {
  if (error instanceof Error) {
    // 处理已知错误
    switch (error.message) {
      case '不支持的跨链路径':
        // 提示用户选择支持的路径
        break;
      case '金额必须大于0':
        // 提示用户输入有效金额
        break;
      default:
        // 处理其他错误
        console.error('未知错误:', error.message);
    }
  } else {
    // 处理未知错误类型
    console.error('系统错误:', error);
  }
}
```

## 测试

### 运行演示
```bash
# 运行完整的演示
npx ts-node src/examples/layerzero-svm-evm-demo.ts

# 或者使用npm脚本
npm run example:layerzero
```

### 测试用例
演示包含以下测试场景：
- 支持的跨链路径验证
- 费用估算准确性
- 参数验证完整性
- 跨链路径分析
- 统计信息展示
- 跨链操作模拟

## 部署和配置

### 环境变量
```bash
# Solana RPC节点
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Ethereum RPC节点
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY

# 其他链的RPC节点...
```

### 网络配置
```typescript
// 自定义网络配置
const customConfig = {
  'ethereum': {
    endpointId: 101,
    contractAddress: '0x...',
    gasLimit: '200000',
    adapterParams: '0x...'
  }
};
```

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

### 开发指南
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

ISC License

## 支持

如果你遇到问题或有疑问，请：
1. 查看[常见问题](FAQ.md)
2. 搜索[Issues](../../issues)
3. 创建新的[Issue](../../issues/new)

---

**注意**: 这是一个演示项目，在生产环境中使用前请进行充分的测试和安全审查。 