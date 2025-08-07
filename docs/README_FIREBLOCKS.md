# Fireblocks MPC 门限签名集成

## 概述

ShieldWallet 现已集成 Fireblocks MPC（多方计算）门限签名功能，提供企业级的数字资产安全管理解决方案。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
export FIREBLOCKS_API_KEY="your-api-key"
export FIREBLOCKS_PRIVATE_KEY="your-private-key"
```

### 3. 运行示例

```bash
# 查看配置提示
npm run fireblocks:init

# 运行 Fireblocks 示例
npm run example:fireblocks
```

## 主要功能

- ✅ **MPC 门限签名**: 支持多方计算的门限签名机制
- ✅ **多链支持**: 支持 EVM、Solana、Aptos 等多条区块链
- ✅ **安全策略**: 可配置的门限策略和安全规则
- ✅ **钱包管理**: 创建和管理 MPC 钱包
- ✅ **交易处理**: 安全的交易创建和签名流程
- ✅ **通知系统**: 集成的通知和状态管理

## 架构组件

### 核心服务

- `FireblocksService`: Fireblocks API 封装
- `FireblocksAdapter`: 统一的钱包适配器接口
- `FireblocksManagerService`: MPC 钱包管理服务

### 配置文件

- `src/config/fireblocks.example.ts`: 配置示例
- `src/examples/fireblocks-example.ts`: 使用示例

## 安全注意事项

1. **私钥安全**: 确保 Fireblocks 私钥安全存储
2. **环境隔离**: 生产和测试环境使用不同的 API 密钥
3. **权限控制**: 合理配置 API 权限和访问控制
4. **审计日志**: 启用完整的操作审计日志

## 故障排除

### 常见问题

1. **401 未授权错误**: 检查 API 密钥和私钥配置
2. **网络连接问题**: 确认网络连接和防火墙设置
3. **依赖冲突**: 运行 `npm install` 重新安装依赖

### 获取帮助

- 查看 `FIREBLOCKS_INTEGRATION.md` 获取详细文档
- 检查 Fireblocks 官方文档
- 联系技术支持团队

## 更新日志

### v1.0.0
- ✅ 初始 Fireblocks MPC 集成
- ✅ 多链钱包支持
- ✅ 门限签名功能
- ✅ 完整的示例和文档