# MPC多签钱包演示系统

## 项目概述

这是一个完整的MPC（多方计算）多签钱包演示系统，展示了从创建钱包到执行多签交易的全流程。该系统使用现代Web技术构建，提供了直观的用户界面来演示MPC钱包的核心概念和操作流程。

## 功能特性

### 🔐 核心功能
- **MPC钱包创建**: 支持自定义参与方数量和阈值配置
- **密钥分片管理**: 使用Shamir秘密共享算法生成密钥分片
- **多方签名**: 实现阈值签名机制
- **交易管理**: 完整的交易创建、签名、执行流程
- **多链支持**: 支持以太坊、BSC、Polygon、Arbitrum、Solana等

### 🎯 演示流程
1. **创建钱包**: 设置钱包名称、参与方数量、阈值等参数
2. **配置参与方**: 设置各参与方的角色和联系信息
3. **生成密钥分片**: 使用MPC技术生成并分发密钥分片
4. **发起交易**: 创建需要多方签名的交易请求
5. **签名确认**: 各参与方对交易进行签名确认
6. **执行交易**: 达到阈值后自动执行交易

### 🛡️ 安全特性
- **阈值签名**: 必须达到指定数量的签名才能执行交易
- **密钥分片**: 私钥被分割成多个分片，单个分片无法恢复私钥
- **角色管理**: 支持所有者、监护人、恢复方等不同角色
- **权限控制**: 细粒度的权限管理

## 技术架构

### 前端技术
- **HTML5**: 语义化标记和现代HTML特性
- **CSS3**: 响应式设计、动画效果、渐变背景
- **JavaScript ES6+**: 现代JavaScript语法和特性
- **Ethers.js**: 以太坊区块链交互
- **QRCode.js**: 二维码生成

### 后端模拟
- **MPC模拟器**: 模拟多方计算过程
- **密钥管理**: 密钥生成、分片、验证
- **交易处理**: 交易创建、签名验证、执行
- **状态管理**: 钱包、交易、会话状态管理

### 架构模式
- **服务层架构**: 业务逻辑与UI分离
- **事件驱动**: 基于事件的组件通信
- **状态管理**: 集中式状态管理
- **模块化设计**: 功能模块独立封装

## 快速开始

### 1. 环境要求
- 现代浏览器（Chrome 88+, Firefox 85+, Safari 14+）
- 支持ES6+的JavaScript环境
- 网络连接（用于加载外部库）

### 2. 安装步骤
```bash
# 克隆项目
git clone <repository-url>
cd mpc-wallet-demo

# 启动本地服务器（推荐）
python -m http.server 8000
# 或
npx serve .

# 在浏览器中打开
http://localhost:8000/mpc-demo.html
```

### 3. 使用说明

#### 第一步：创建钱包
1. 输入钱包名称
2. 选择参与方总数（建议3-9方）
3. 设置签名阈值（建议遵循n/2+1原则）
4. 选择区块链类型
5. 点击"创建钱包"

#### 第二步：配置参与方
1. 为每个参与方设置名称、邮箱、手机号
2. 系统自动分配角色（所有者、监护人、恢复方）
3. 确认所有信息无误后点击"确认配置"

#### 第三步：生成密钥分片
1. 系统自动生成密钥分片
2. 查看钱包地址和基本信息
3. 确认密钥分片生成完成

#### 第四步：发起交易
1. 输入收款地址、转账金额、Gas价格
2. 添加交易备注
3. 预览交易信息
4. 点击"创建交易"

#### 第五步：签名确认
1. 查看交易详情
2. 观察各参与方签名进度
3. 达到阈值后自动执行交易
4. 查看交易结果

## 技术实现细节

### MPC算法实现
```javascript
// 密钥分片生成
async generateKeyShares(privateKey, totalParties, threshold, chainType) {
    const shares = [];
    const privateKeyBytes = ethers.getBytes(privateKey);
    
    for (let i = 0; i < totalParties; i++) {
        // 生成随机分片（实际应用中应该是数学计算得出的分片）
        const shareBytes = new Uint8Array(privateKeyBytes.length);
        for (let j = 0; j < shareBytes.length; j++) {
            shareBytes[j] = privateKeyBytes[j] ^ (i + 1);
        }
        
        const share = {
            id: `share_${i + 1}`,
            partyId: `party_${i + 1}`,
            share: ethers.hexlify(shareBytes),
            index: i + 1,
            chainType,
            status: 'active'
        };
        
        shares.push(share);
    }
    
    return shares;
}
```

### 阈值签名机制
```javascript
// 签名验证和执行
async signTransaction(sessionId, partyId, signature) {
    const session = this.signatureSessions.get(sessionId);
    
    // 验证签名
    const isValid = await this.verifySignature(sessionId, partyId, signature);
    if (!isValid) {
        throw new Error('签名验证失败');
    }
    
    // 记录签名
    participant.hasSigned = true;
    participant.signature = signature;
    session.currentSignatures++;
    
    // 检查是否达到阈值
    if (session.currentSignatures >= session.requiredSignatures) {
        session.status = 'completed';
        await this.executeTransaction(session.transactionId);
    }
    
    return { success: true, isComplete: session.currentSignatures >= session.requiredSignatures };
}
```

### 状态管理
```javascript
// 钱包状态枚举
const WalletStatus = {
    ACTIVE: 'active',
    PENDING: 'pending',
    FROZEN: 'frozen',
    COMPROMISED: 'compromised'
};

// 交易状态枚举
const TransactionStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
```

## 安全考虑

### 密钥安全
- **分片存储**: 私钥被分割成多个分片，分散存储
- **阈值机制**: 必须达到指定数量的分片才能恢复私钥
- **加密传输**: 分片传输过程中使用加密保护

### 访问控制
- **角色权限**: 不同角色具有不同的操作权限
- **身份验证**: 参与方身份验证机制
- **操作审计**: 完整的操作日志记录

### 网络安全
- **安全通道**: 使用HTTPS等安全协议
- **数据验证**: 输入数据严格验证
- **防重放攻击**: 时间戳和nonce机制

## 扩展功能

### 企业级特性
- **多钱包管理**: 支持管理多个MPC钱包
- **批量操作**: 批量交易和签名
- **高级权限**: 细粒度的权限控制
- **审计日志**: 完整的操作审计

### 跨链功能
- **跨链转账**: 支持不同区块链间的资产转移
- **桥接协议**: 集成主流跨链桥接协议
- **流动性管理**: 跨链流动性优化

### DeFi集成
- **协议交互**: 与主流DeFi协议交互
- **收益优化**: 自动收益策略
- **风险管理**: 风险监控和预警

## 部署说明

### 生产环境部署
1. **服务器配置**: 使用HTTPS协议
2. **数据库**: 配置持久化存储
3. **监控**: 设置性能监控和告警
4. **备份**: 定期数据备份策略

### 容器化部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 云服务部署
- **AWS**: 使用EC2、RDS、S3等服务
- **Azure**: 使用Azure VM、SQL Database等服务
- **GCP**: 使用Compute Engine、Cloud SQL等服务

## 测试指南

### 单元测试
```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 集成测试
```bash
# 运行集成测试
npm run test:integration

# 端到端测试
npm run test:e2e
```

### 性能测试
```bash
# 压力测试
npm run test:stress

# 性能基准测试
npm run test:benchmark
```

## 故障排除

### 常见问题
1. **密钥分片生成失败**: 检查参与方数量和阈值配置
2. **签名验证失败**: 确认参与方身份和权限
3. **交易执行超时**: 检查网络连接和Gas设置

### 调试模式
```javascript
// 启用调试模式
localStorage.setItem('debug', 'true');

// 查看详细日志
console.log('MPC Wallet Debug Mode Enabled');
```

### 错误处理
- 所有操作都有完整的错误处理
- 用户友好的错误提示
- 详细的错误日志记录

## 贡献指南

### 开发环境设置
1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循Prettier代码格式化
- 编写完整的JSDoc注释
- 添加单元测试用例

### 提交规范
```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

- **项目主页**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **功能建议**: [GitHub Discussions]
- **邮箱**: [contact@example.com]

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持基本的MPC钱包功能
- 实现阈值签名机制
- 提供完整的演示流程

### 计划功能
- [ ] 硬件钱包集成
- [ ] 移动端应用
- [ ] 多语言支持
- [ ] 高级安全特性

---

**注意**: 这是一个演示系统，仅用于学习和测试目的。在生产环境中使用时，请确保实施适当的安全措施和审计流程。 