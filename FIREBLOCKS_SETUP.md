# Fireblocks MPC 配置指南

本指南将帮助您正确配置 Fireblocks MPC 门限签名功能。

## 🔧 环境配置

### 1. 获取 Fireblocks API 凭证

首先，您需要从 Fireblocks 控制台获取以下凭证：

- **API Key**: 您的 Fireblocks API 密钥
- **Private Key**: PEM 格式的私钥文件

### 2. 设置环境变量

#### macOS/Linux:
```bash
# 设置 API 密钥
export FIREBLOCKS_API_KEY="your-fireblocks-api-key"

# 设置私钥（从文件读取）
export FIREBLOCKS_PRIVATE_KEY="$(cat path/to/your/fireblocks-private-key.pem)"

# 可选：设置 API 基础 URL（默认为沙盒环境）
export FIREBLOCKS_BASE_URL="https://sandbox-api.fireblocks.io"
# 生产环境使用：https://api.fireblocks.io
```

#### Windows (PowerShell):
```powershell
# 设置 API 密钥
$env:FIREBLOCKS_API_KEY="your-fireblocks-api-key"

# 设置私钥
$env:FIREBLOCKS_PRIVATE_KEY=(Get-Content "path\to\your\fireblocks-private-key.pem" -Raw)

# 可选：设置 API 基础 URL
$env:FIREBLOCKS_BASE_URL="https://sandbox-api.fireblocks.io"
```

### 3. 验证配置

运行以下命令验证配置是否正确：

```bash
# 检查环境变量
echo "API Key: ${FIREBLOCKS_API_KEY:0:10}..."
echo "Private Key: ${FIREBLOCKS_PRIVATE_KEY:0:50}..."
echo "Base URL: $FIREBLOCKS_BASE_URL"
```

## 🚀 运行示例

配置完成后，运行 Fireblocks MPC 示例：

```bash
# 安装依赖
npm install

# 运行示例
npm run example:fireblocks
```

## 🔐 私钥格式要求

确保您的私钥文件格式正确：

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
...
-----END PRIVATE KEY-----
```

**注意事项：**
- 私钥必须是 PEM 格式
- 确保私钥文件权限安全（建议 600）
- 不要在代码中硬编码私钥

## 🛡️ 安全最佳实践

### 1. 环境隔离
- 开发环境使用沙盒 API
- 生产环境使用正式 API
- 不同环境使用不同的 API 密钥

### 2. 密钥管理
- 使用环境变量存储敏感信息
- 定期轮换 API 密钥
- 限制 API 密钥权限

### 3. 网络安全
- 使用 HTTPS 连接
- 配置防火墙规则
- 监控 API 调用日志

## 🔍 故障排除

### 常见错误及解决方案

#### 1. 401 Unauthorized 错误
```
Error: HTTP 401: { "message": "Unauthorized: Error getting User certificate", "code": -7}
```

**解决方案：**
- 检查 API 密钥是否正确
- 验证私钥格式是否为 PEM
- 确认 API 密钥权限
- 检查网络连接

#### 2. JWT 生成失败
```
Error: JWT 生成失败: ...
```

**解决方案：**
- 检查私钥格式
- 确认私钥内容完整
- 验证 Node.js crypto 模块可用

#### 3. 网络连接超时
```
Error: API 请求失败: Network timeout
```

**解决方案：**
- 检查网络连接
- 验证 Fireblocks API 状态
- 增加超时时间设置

## 📞 获取帮助

如果您遇到问题，可以：

1. 查看 [Fireblocks 官方文档](https://docs.fireblocks.com/)
2. 检查 `docs/FIREBLOCKS_INTEGRATION.md` 详细文档
3. 联系 Fireblocks 技术支持
4. 在项目 Issues 中提问

## 📝 配置检查清单

- [ ] 已获取 Fireblocks API 密钥
- [ ] 已下载 PEM 格式私钥文件
- [ ] 已设置 `FIREBLOCKS_API_KEY` 环境变量
- [ ] 已设置 `FIREBLOCKS_PRIVATE_KEY` 环境变量
- [ ] 已验证私钥格式正确
- [ ] 已测试网络连接
- [ ] 已运行示例代码
- [ ] 示例运行成功

完成以上步骤后，您就可以开始使用 Fireblocks MPC 门限签名功能了！