 /* Fireblocks 代理服务 - 链下签名与交易代理 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { FireblocksSDK } = require('fireblocks-sdk');

const app = express();
const port = process.env.FB_PROXY_PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

// 环境变量校验
const REQUIRED_ENVS = ['FIREBLOCKS_API_KEY', 'FIREBLOCKS_PRIVATE_KEY'];
const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`缺少必要环境变量: ${missing.join(', ')}`);
  console.warn('请在 .env 中设置 FIREBLOCKS_API_KEY 和 FIREBLOCKS_PRIVATE_KEY');
}

// 初始化 Fireblocks SDK
let fireblocks = null;
try {
  if (!missing.length) {
    fireblocks = new FireblocksSDK(
      process.env.FIREBLOCKS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      process.env.FIREBLOCKS_API_KEY,
      process.env.FIREBLOCKS_API_BASE || 'https://api.fireblocks.io'
    );
  }
} catch (e) {
  console.error('Fireblocks SDK 初始化失败:', e.message);
}

// 健康检查
app.get('/api/fireblocks/health', async (req, res) => {
  try {
    if (!fireblocks) {
      return res.status(500).json({ ok: false, reason: 'SDK未初始化' });
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// 原始消息链下签名（RAW Signing）
// 入参: { vaultAccountId, assetId, messageHex, note }
app.post('/api/fireblocks/sign-raw', async (req, res) => {
  try {
    if (!fireblocks) {
      return res.status(500).json({ ok: false, error: 'Fireblocks未正确配置' });
    }

    const { vaultAccountId, assetId, messageHex, note } = req.body || {};
    if (!vaultAccountId || !assetId || !messageHex) {
      return res.status(400).json({ ok: false, error: '缺少必要参数 vaultAccountId/assetId/messageHex' });
    }

    const hex = String(messageHex).replace(/^0x/, '');

    // 优先使用 createRawSigningTransaction，如果不可用则回退到 createTransaction with operation RAW
    let tx;
    if (typeof fireblocks.createRawSigningTransaction === 'function') {
      tx = await fireblocks.createRawSigningTransaction({
        assetId,
        source: { type: 'VAULT_ACCOUNT', id: vaultAccountId },
        note: note || 'MPC Demo Raw Signing',
        extraParameters: {
          rawMessageData: {
            messages: [
              {
                content: hex,
                encoding: 'HEX'
              }
            ]
          }
        }
      });
    } else {
      tx = await fireblocks.createTransaction({
        operation: 'RAW',
        assetId,
        source: { type: 'VAULT_ACCOUNT', id: vaultAccountId },
        note: note || 'MPC Demo Raw Signing',
        extraParameters: {
          rawMessageData: {
            messages: [
              {
                content: hex,
                encoding: 'HEX'
              }
            ]
          }
        }
      });
    }

    // 轮询结果直到完成或超时
    const start = Date.now();
    const timeoutMs = Number(process.env.FB_SIGN_TIMEOUT_MS || 60000);
    let finalTx = tx;
    while (
      ['PENDING_SIGNATURE', 'PENDING_AUTHORIZATION', 'QUEUED', 'SUBMITTED', 'BROADCASTING', 'CONFIRMING'].includes(
        finalTx?.status || ''
      )
    ) {
      if (Date.now() - start > timeoutMs) {
        return res.status(504).json({ ok: false, error: '签名超时' });
      }
      await new Promise((r) => setTimeout(r, 1500));
      finalTx = await fireblocks.getTransactionById(tx.id);
    }

    if (finalTx.status !== 'COMPLETED' && finalTx.status !== 'BLOCKED') {
      // Fireblocks原始签名通常在 signedMessages 字段返回
      // 某些环境下 status 可能保持为 COMPLETED 或 REJECTED
    }

    // 从返回中提取签名
    let signatures = [];
    try {
      const details = await fireblocks.getTransactionById(tx.id);
      const sm = details?.signedMessages || details?.extraParameters?.rawMessageData?.messages || [];
      signatures = (sm || [])
        .map((m) => m?.signature || m?.signedMessage || m?.content)
        .filter(Boolean);
    } catch (e) {
      // 忽略解析错误
    }

    return res.json({ ok: true, txId: tx.id, status: finalTx.status, signatures });
  } catch (e) {
    console.error('签名失败:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Fireblocks 代理服务已启动: http://localhost:${port}`);
});
