# ShieldWallet - Chrome 钱包插件

一个安全可靠的区块链钱包Chrome扩展，支持以太坊和EVM兼容网络。

<div align="center">
  <img src="public/assets/icon128.svg" alt="ShieldWallet Logo" width="128" height="128">
</div>

## 功能特性

- 🔐 **安全加密**: 使用Web Crypto API进行本地加密存储
- 💰 **多网络支持**: 支持以太坊主网、Sepolia、Goerli测试网
- 🔑 **多种导入方式**: 支持助记词和私钥导入
- 💸 **转账功能**: 支持ETH转账和自定义Gas设置
- 🪙 **代币管理**: 支持添加和管理自定义ERC-20代币
- 📱 **现代UI**: 简洁美观的用户界面
- 🔒 **自动锁定**: 支持自动锁定功能保护资产安全
- 🌐 **DApp连接**: 支持连接去中心化应用

## 安装方法

### 开发模式安装

1. 克隆或下载项目到本地
   ```bash
   git clone https://github.com/huangzhemin/ShieldWallet.git
   cd ShieldWallet
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build
   ```

4. 打开Chrome浏览器，进入扩展管理页面 (`chrome://extensions/`)
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"
7. 选择项目根目录

### 从Chrome商店安装（即将上线）

1. 访问[Chrome网上应用店](https://chrome.google.com/webstore)
2. 搜索"ShieldWallet"
3. 点击"添加至Chrome"

## 使用说明

### 首次使用

1. 安装插件后，点击浏览器工具栏中的ShieldWallet图标
2. 选择"创建钱包"或"导入钱包"
3. 设置安全密码
4. 如果是创建钱包，请妥善保存生成的助记词

### 发送交易

1. 在钱包主界面点击"发送"按钮
2. 输入收款地址和转账金额
3. 设置合适的Gas价格
4. 确认交易并输入密码

### 接收资产

1. 在钱包主界面点击"接收"按钮
2. 复制显示的钱包地址或使用二维码
3. 将地址发送给付款方

### 添加代币

1. 在钱包主界面点击"添加代币"按钮
2. 输入代币合约地址
3. 确认代币信息并保存

### 网络切换

在钱包底部的网络选择器中可以切换不同的以太坊网络。

## 技术架构

- **前端**: TypeScript + HTML + CSS
- **构建工具**: Webpack
- **加密**: Web Crypto API
- **存储**: Chrome Storage API
- **网络**: JSON-RPC
- **区块链交互**: ethers.js

## 项目结构

```
ShieldWallet/
├── manifest.json          # Chrome扩展配置
├── public/                # 静态资源
│   ├── popup.html        # 弹窗页面
│   ├── styles/           # 样式文件
│   └── assets/           # 图标资源
├── src/                  # 源代码
│   ├── background/       # 后台脚本
│   ├── popup/           # 弹窗脚本
│   ├── services/        # 核心服务
│   └── utils/           # 工具函数
└── webpack.config.js     # 构建配置
```

## 安全提醒

⚠️ **重要安全提醒**：

1. 这是一个演示项目，请勿在主网使用大额资金
2. 助记词和私钥是您资产的唯一凭证，请妥善保管
3. 不要在不安全的网络环境下使用钱包
4. 定期备份您的钱包数据
5. 不要将助记词或私钥分享给任何人
6. 警惕钓鱼网站和欺诈应用

## 开发

### 环境要求

- Node.js 16+
- npm 7+ 或 yarn 1.22+
- Chrome 88+

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 测试

```bash
npm run test
```

## 路线图

- [ ] 支持更多EVM兼容链
- [ ] NFT资产展示
- [ ] 硬件钱包集成
- [ ] 多语言支持
- [ ] 交易加速功能
- [ ] 批量转账功能

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 提交 [GitHub Issue](https://github.com/huangzhemin/ShieldWallet/issues)
- 邮箱: contact@shieldwallet.com

---

<div align="center">
  <p>用❤️打造</p>
</div>