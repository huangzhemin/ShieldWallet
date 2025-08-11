# Fireblocks 集成指南（MPC Demo）

本指南说明如何在本项目中启用 Fireblocks 链下签名能力，并在 `mpc-demo.html` 中发起真实的 RAW Signing。

## 1. 准备工作

- 拥有有效的 Fireblocks 账户与 API Key
- 下载或生成对应的 API Private Key (PEM)
- 在 Fireblocks 控制台为目标 `Vault Account` 开通对应 `Asset`（如 `ETH_ETHEREUM`）

## 2. 配置环境变量

在项目根目录创建 `.env` 文件（可参考 `.env.example`）：

```
FIREBLOCKS_API_KEY=你的API_KEY
FIREBLOCKS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FB_PROXY_PORT=4000
FB_SIGN_TIMEOUT_MS=60000
```

注意：
- 如果将私钥粘贴为单行，请使用 `\n` 表示换行；也可以使用多行字符串。
- 如需自定义API地址（Sandbox/Prod），可设置 `FIREBLOCKS_API_BASE`。

## 3. 安装依赖

```
npm install
```

## 4. 启动服务

- 启动 Fireblocks 代理服务：

```
npm run proxy
```

- 启动前端演示（另一终端）：

```
npm start
```

或一键并行启动：

```
npm run start:all
```

## 5. 在页面中配置并发起签名

打开 `http://localhost:3000/mpc-demo.html`（或你本地端口），进入“第五步：多方签名确认”。

1. 点击“配置 Fireblocks”，填写：
   - Vault Account ID
   - Asset ID（如 `ETH_ETHEREUM`）
   - 代理地址（默认 `http://localhost:4000`）
2. 返回签名区域，点击“使用 Fireblocks 链下签名”
3. 页面将调用后端 `/api/fireblocks/sign-raw`，返回签名信息并计入签名阈值

## 6. 端点说明

- `POST /api/fireblocks/sign-raw`
  - 入参：`{ vaultAccountId, assetId, messageHex, note? }`
  - 出参：`{ ok, txId, status, signatures[] }`

## 7. 常见问题

- 403/401：检查 API Key 权限与 IP 白名单
- `SDK未初始化`：确认 `.env` 是否加载、私钥格式是否正确
- `签名超时`：可增大 `FB_SIGN_TIMEOUT_MS` 或在控制台确认审批流程

## 8. 安全注意

- `.env` 不要提交到版本库
- 后端代理仅用于演示，请做好网络访问控制
- 生产环境请添加鉴权与审计 