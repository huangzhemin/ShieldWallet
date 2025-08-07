import { ChainType } from '../types/chain';

/**
 * Fireblocks API 配置接口
 */
export interface FireblocksConfig {
  apiKey: string;
  privateKey: string; // PEM 格式的私钥
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * Fireblocks 交易请求接口
 */
export interface FireblocksTransactionRequest {
  vaultAccountId: string;
  assetId: string;
  amount: string;
  destination: string;
  note?: string;
  gasPrice?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Fireblocks 交易响应接口
 */
export interface FireblocksTransactionResponse {
  id: string;
  txHash: string;
  status: 'SUBMITTED' | 'QUEUED' | 'PENDING_SIGNATURE' | 'PENDING_AUTHORIZATION' | 'PENDING_3RD_PARTY_MANUAL_APPROVAL' | 'PENDING_3RD_PARTY' | 'BROADCASTING' | 'CONFIRMING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'FAILED' | 'TIMEOUT' | 'BLOCKED';
  subStatus?: string;
  createdAt: number;
  lastUpdated: number;
  assetId: string;
  source: {
    type: string;
    id: string;
  };
  destination: {
    type: string;
    id?: string;
    address?: string;
  };
  amount: string;
  networkFee?: string;
  gasPrice?: string;
  blockInfo?: {
    blockNumber: number;
    blockHash: string;
  };
}

/**
 * Fireblocks 余额响应接口
 */
export interface FireblocksBalanceResponse {
  assetId: string;
  total: string;
  available: string;
  pending: string;
  frozen: string;
  lockedAmount?: string;
}

/**
 * Fireblocks 费用估算响应接口
 */
export interface FireblocksFeeEstimate {
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  networkFee?: string;
  baseFee?: string;
}

/**
 * Fireblocks NFT 响应接口
 */
export interface FireblocksNFTResponse {
  tokenId: string;
  name: string;
  description?: string;
  collection: {
    contractAddress: string;
    name: string;
  };
  media?: Array<{
    url: string;
    type: string;
  }>;
  metadata?: any;
}

/**
 * Fireblocks 钱包创建响应接口
 */
export interface FireblocksWalletResponse {
  address: string;
  legacyAddress?: string;
  enterpriseAddress?: string;
  tag?: string;
}

/**
 * Fireblocks 服务类
 * 封装 Fireblocks API 调用和 MPC 门限签名功能
 */
export class FireblocksService {
  private config: FireblocksConfig;
  private baseUrl: string;

  constructor(config: FireblocksConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.fireblocks.io';
  }

  /**
   * 创建 Vault 资产地址
   */
  async createVaultAsset(
    vaultAccountId: string, 
    chainType: ChainType, 
    derivationPath?: string
  ): Promise<FireblocksWalletResponse> {
    try {
      const assetId = this.mapChainTypeToAssetId(chainType);
      const endpoint = `/v1/vault/accounts/${vaultAccountId}/${assetId}/addresses`;
      
      const requestBody: any = {};
      if (derivationPath) {
        requestBody.customerRefId = derivationPath;
      }

      const response = await this.makeRequest('POST', endpoint, requestBody);
      return response;
    } catch (error) {
      throw new Error(`创建 Vault 资产失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 Vault 余额
   */
  async getVaultBalance(vaultAccountId: string, chainType: ChainType): Promise<string> {
    try {
      const assetId = this.mapChainTypeToAssetId(chainType);
      const endpoint = `/v1/vault/accounts/${vaultAccountId}/${assetId}`;
      
      const response: FireblocksBalanceResponse = await this.makeRequest('GET', endpoint);
      return response.available || '0';
    } catch (error) {
      throw new Error(`获取 Vault 余额失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取代币余额
   */
  async getTokenBalance(vaultAccountId: string, tokenAddress: string): Promise<string> {
    try {
      // 对于 ERC20 代币，使用 tokenAddress 作为 assetId
      const endpoint = `/v1/vault/accounts/${vaultAccountId}/${tokenAddress}`;
      
      const response: FireblocksBalanceResponse = await this.makeRequest('GET', endpoint);
      return response.available || '0';
    } catch (error) {
      throw new Error(`获取代币余额失败: ${(error as Error).message}`);
    }
  }

  /**
   * 估算交易费用
   */
  async estimateTransactionFee(
    request: FireblocksTransactionRequest
  ): Promise<FireblocksFeeEstimate> {
    try {
      const endpoint = '/v1/transactions/estimate_fee';
      const requestBody = {
        assetId: request.assetId,
        source: {
          type: 'VAULT_ACCOUNT',
          id: request.vaultAccountId
        },
        destination: {
          type: 'ONE_TIME_ADDRESS',
          oneTimeAddress: {
            address: request.destination
          }
        },
        amount: request.amount
      };

      const response: FireblocksFeeEstimate = await this.makeRequest('POST', endpoint, requestBody);
      return response;
    } catch (error) {
      throw new Error(`估算交易费用失败: ${(error as Error).message}`);
    }
  }

  /**
   * 创建交易 - 使用 MPC 门限签名
   */
  async createTransaction(
    request: FireblocksTransactionRequest
  ): Promise<FireblocksTransactionResponse> {
    try {
      const endpoint = '/v1/transactions';
      const requestBody = {
        assetId: request.assetId,
        source: {
          type: 'VAULT_ACCOUNT',
          id: request.vaultAccountId
        },
        destination: {
          type: 'ONE_TIME_ADDRESS',
          oneTimeAddress: {
            address: request.destination
          }
        },
        amount: request.amount,
        note: request.note || 'ShieldWallet MPC Transaction',
        gasPrice: request.gasPrice,
        gasLimit: request.gasLimit,
        maxFeePerGas: request.maxFeePerGas,
        maxPriorityFeePerGas: request.maxPriorityFeePerGas
      };

      const response: FireblocksTransactionResponse = await this.makeRequest('POST', endpoint, requestBody);
      return response;
    } catch (error) {
      throw new Error(`创建 MPC 交易失败: ${(error as Error).message}`);
    }
  }

  /**
   * 根据交易哈希获取交易信息
   */
  async getTransactionByHash(txHash: string): Promise<FireblocksTransactionResponse> {
    try {
      const endpoint = `/v1/transactions/external_tx_id/${txHash}`;
      const response: FireblocksTransactionResponse = await this.makeRequest('GET', endpoint);
      return response;
    } catch (error) {
      throw new Error(`获取交易信息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取交易确认数
   */
  async getConfirmations(blockNumber: number): Promise<number> {
    try {
      // 这里需要根据具体链的 API 来实现
      // 暂时返回固定值
      return 12;
    } catch (error) {
      throw new Error(`获取确认数失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 Vault NFTs
   */
  async getVaultNFTs(vaultAccountId: string): Promise<FireblocksNFTResponse[]> {
    try {
      const endpoint = `/v1/vault/accounts/${vaultAccountId}/nfts`;
      const response: FireblocksNFTResponse[] = await this.makeRequest('GET', endpoint);
      return response;
    } catch (error) {
      throw new Error(`获取 NFT 列表失败: ${(error as Error).message}`);
    }
  }

  /**
   * 创建 Vault 账户
   */
  async createVaultAccount(name: string, customerRefId?: string): Promise<{ id: string; name: string }> {
    try {
      const endpoint = '/v1/vault/accounts';
      const requestBody = {
        name,
        customerRefId
      };

      const response = await this.makeRequest('POST', endpoint, requestBody);
      return response;
    } catch (error) {
      throw new Error(`创建 Vault 账户失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取所有 Vault 账户
   */
  async getVaultAccounts(): Promise<Array<{ id: string; name: string; customerRefId?: string }>> {
    try {
      const endpoint = '/v1/vault/accounts';
      const response = await this.makeRequest('GET', endpoint);
      return response;
    } catch (error) {
      throw new Error(`获取 Vault 账户列表失败: ${(error as Error).message}`);
    }
  }

  /**
   * 映射链类型到 Fireblocks 资产 ID
   */
  private mapChainTypeToAssetId(chainType: ChainType): string {
    switch (chainType) {
      case ChainType.EVM:
        return 'ETH'; // 默认以太坊
      case ChainType.SOLANA:
        return 'SOL';
      case ChainType.APTOS:
        return 'APT';
      default:
        throw new Error(`不支持的链类型: ${chainType}`);
    }
  }

  /**
   * 生成 JWT Token
   */
  private generateJWT(path: string, bodyJson?: string): string {
    // 这里需要实现 JWT 签名逻辑
    // 使用 RS256 算法和私钥签名
    // 暂时返回模拟 token
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      uri: path,
      nonce: Math.floor(Math.random() * 1000000),
      iat: now,
      exp: now + 55, // 55秒过期
      sub: this.config.apiKey,
      bodyHash: bodyJson ? this.sha256(bodyJson) : undefined
    };

    // 实际实现中需要使用 jsonwebtoken 库或类似工具
    return `${Buffer.from(JSON.stringify(header)).toString('base64')}.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
  }

  /**
   * SHA256 哈希
   */
  private sha256(data: string): string {
    // 实际实现中需要使用 crypto 库
    return 'mock_hash';
  }

  /**
   * 发起 HTTP 请求
   */
  private async makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const bodyJson = body ? JSON.stringify(body) : undefined;
      const token = this.generateJWT(endpoint, bodyJson);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json'
      };

      const requestOptions: RequestInit = {
        method,
        headers,
        body: bodyJson
      };

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API 请求失败: ${(error as Error).message}`);
    }
  }

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.privateKey);
  }

  /**
   * 获取配置信息（不包含敏感数据）
   */
  getConfigInfo(): { baseUrl: string; hasApiKey: boolean; hasPrivateKey: boolean } {
    return {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.config.apiKey,
      hasPrivateKey: !!this.config.privateKey
    };
  }
}