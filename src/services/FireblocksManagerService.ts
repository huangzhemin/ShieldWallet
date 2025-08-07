import { FireblocksService, FireblocksConfig } from './FireblocksService';
import { FireblocksAdapter } from '../adapters/FireblocksAdapter';
import { ChainType, ChainConfig } from '../types/chain';
import { SecurityService } from './SecurityService';
import { NotificationService, NotificationType } from './NotificationService';

/**
 * MPC 钱包配置接口
 */
export interface MPCWalletConfig {
  id: string;
  name: string;
  vaultAccountId: string;
  chainConfigs: ChainConfig[];
  thresholdPolicy: {
    requiredSigners: number;
    totalSigners: number;
    signerIds: string[];
  };
  securityPolicy: {
    requireApproval: boolean;
    autoApprovalLimit?: string; // 自动批准的金额限制
    whitelistedAddresses?: string[];
    blacklistedAddresses?: string[];
  };
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * MPC 签名请求接口
 */
export interface MPCSignatureRequest {
  walletId: string;
  transactionData: {
    to: string;
    value: string;
    data?: string;
    chainType: ChainType;
  };
  requestId: string;
  requesterInfo: {
    userId?: string;
    deviceId?: string;
    ipAddress?: string;
  };
  approvals: Array<{
    signerId: string;
    approved: boolean;
    timestamp: string;
    signature?: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
}

/**
 * Fireblocks 管理服务
 * 负责 MPC 钱包的创建、管理和门限签名策略
 */
export class FireblocksManagerService {
  private fireblocksService: FireblocksService;
  private securityService: SecurityService;
  private notificationService: NotificationService;
  private mpcWallets: Map<string, MPCWalletConfig> = new Map();
  private adapters: Map<string, FireblocksAdapter> = new Map();
  private signatureRequests: Map<string, MPCSignatureRequest> = new Map();
  private isInitialized: boolean = false;

  constructor(
    fireblocksConfig: FireblocksConfig,
    securityService: SecurityService,
    notificationService: NotificationService
  ) {
    this.fireblocksService = new FireblocksService(fireblocksConfig);
    this.securityService = securityService;
    this.notificationService = notificationService;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 验证 Fireblocks 配置
      if (!this.fireblocksService.validateConfig()) {
        throw new Error('Fireblocks 配置无效');
      }

      // 加载已存在的 MPC 钱包
      await this.loadMPCWallets();

      // 清理过期的签名请求
      this.cleanupExpiredRequests();

      this.isInitialized = true;
      
      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { service: 'Fireblocks MPC' },
        'Fireblocks MPC 服务',
        'MPC 门限签名服务初始化成功'
      );
    } catch (error) {
      throw new Error(`Fireblocks 管理服务初始化失败: ${(error as Error).message}`);
    }
  }

  /**
   * 创建 MPC 钱包
   */
  async createMPCWallet(
    name: string,
    chainConfigs: ChainConfig[],
    thresholdPolicy: MPCWalletConfig['thresholdPolicy'],
    securityPolicy: MPCWalletConfig['securityPolicy']
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('服务未初始化');
      }

      // 验证门限策略
      this.validateThresholdPolicy(thresholdPolicy);

      // 在 Fireblocks 中创建 Vault 账户
      const vaultAccount = await this.fireblocksService.createVaultAccount(
        name,
        `shieldwallet_${Date.now()}`
      );

      // 创建 MPC 钱包配置
      const walletId = this.generateWalletId();
      const mpcWallet: MPCWalletConfig = {
        id: walletId,
        name,
        vaultAccountId: vaultAccount.id,
        chainConfigs,
        thresholdPolicy,
        securityPolicy,
        createdAt: new Date().toISOString()
      };

      // 为每个链创建适配器
      for (const chainConfig of chainConfigs) {
        const adapter = new FireblocksAdapter(
          chainConfig,
          this.fireblocksService,
          vaultAccount.id
        );
        this.adapters.set(`${walletId}_${chainConfig.type}`, adapter);
      }

      // 保存钱包配置
      this.mpcWallets.set(walletId, mpcWallet);
      await this.saveMPCWallets();

      // 记录安全事件
      this.securityService.logSecurityEvent(
        'WALLET_CREATED' as any,
        {
          walletId,
          walletType: 'MPC',
          vaultAccountId: vaultAccount.id,
          chainTypes: chainConfigs.map(c => c.type)
        },
        'low'
      );

      await this.notificationService.createNotification(
        NotificationType.SECURITY_ALERT,
        { walletId, walletName: name, chainCount: chainConfigs.length },
        'MPC 钱包创建成功',
        `钱包 "${name}" 已创建，支持 ${chainConfigs.length} 条链`
      );

      return walletId;
    } catch (error) {
      throw new Error(`创建 MPC 钱包失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 MPC 钱包适配器
   */
  getMPCAdapter(walletId: string, chainType: ChainType): FireblocksAdapter | undefined {
    return this.adapters.get(`${walletId}_${chainType}`);
  }

  /**
   * 创建门限签名请求
   */
  async createSignatureRequest(
    walletId: string,
    transactionData: MPCSignatureRequest['transactionData'],
    requesterInfo: MPCSignatureRequest['requesterInfo']
  ): Promise<string> {
    try {
      const wallet = this.mpcWallets.get(walletId);
      if (!wallet) {
        throw new Error('MPC 钱包不存在');
      }

      // 检查安全策略
      await this.validateSecurityPolicy(wallet, transactionData);

      const requestId = this.generateRequestId();
      const signatureRequest: MPCSignatureRequest = {
        walletId,
        transactionData,
        requestId,
        requesterInfo,
        approvals: [],
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟过期
      };

      this.signatureRequests.set(requestId, signatureRequest);

      // 如果满足自动批准条件，直接执行
      if (await this.shouldAutoApprove(wallet, transactionData)) {
        await this.executeTransaction(requestId);
        signatureRequest.status = 'completed';
        console.log('🎯 自动批准条件满足，交易已自动执行');
      } else {
        // 通知相关签名者
        await this.notifySigners(wallet, signatureRequest);
      }

      return requestId;
    } catch (error) {
      throw new Error(`创建签名请求失败: ${(error as Error).message}`);
    }
  }

  /**
   * 批准签名请求
   */
  async approveSignatureRequest(
    requestId: string,
    signerId: string,
    approved: boolean
  ): Promise<boolean> {
    try {
      const request = this.signatureRequests.get(requestId);
      if (!request) {
        throw new Error('签名请求不存在');
      }

      if (request.status !== 'pending') {
        throw new Error('签名请求已处理');
      }

      if (new Date() > new Date(request.expiresAt)) {
        request.status = 'expired';
        throw new Error('签名请求已过期');
      }

      const wallet = this.mpcWallets.get(request.walletId);
      if (!wallet) {
        throw new Error('MPC 钱包不存在');
      }

      // 检查签名者权限
      if (!wallet.thresholdPolicy.signerIds.includes(signerId)) {
        throw new Error('无效的签名者');
      }

      // 添加批准记录
      const existingApproval = request.approvals.find(a => a.signerId === signerId);
      if (existingApproval) {
        existingApproval.approved = approved;
        existingApproval.timestamp = new Date().toISOString();
      } else {
        request.approvals.push({
          signerId,
          approved,
          timestamp: new Date().toISOString()
        });
      }

      // 检查是否达到门限要求
      const approvedCount = request.approvals.filter(a => a.approved).length;
      const rejectedCount = request.approvals.filter(a => !a.approved).length;

      if (approvedCount >= wallet.thresholdPolicy.requiredSigners) {
        // 达到批准门限，执行交易
        await this.executeTransaction(requestId);
        return true;
      } else if (rejectedCount > wallet.thresholdPolicy.totalSigners - wallet.thresholdPolicy.requiredSigners) {
        // 拒绝数量过多，无法达到门限
        request.status = 'rejected';
        await this.notificationService.createNotification(
          NotificationType.SECURITY_ALERT,
          { requestId, walletId: request.walletId },
          '签名请求被拒绝',
          '门限签名请求被拒绝，交易未执行'
        );
      }

      return false;
    } catch (error) {
      throw new Error(`处理签名请求失败: ${(error as Error).message}`);
    }
  }

  /**
   * 执行门限签名交易
   */
  private async executeTransaction(requestId: string): Promise<string> {
    try {
      const request = this.signatureRequests.get(requestId);
      if (!request) {
        throw new Error('签名请求不存在');
      }

      const adapter = this.getMPCAdapter(request.walletId, request.transactionData.chainType);
      if (!adapter) {
        throw new Error('找不到对应的适配器');
      }

      // 使用 Fireblocks MPC 执行交易
      const result = await adapter.sendTransaction({
        to: request.transactionData.to,
        value: request.transactionData.value,
        data: request.transactionData.data,
        chainType: request.transactionData.chainType,
        from: '' // MPC 环境下不需要指定 from
      }, 'MPC_MANAGED');

      request.status = 'completed';
      
      // 记录安全事件
      this.securityService.logSecurityEvent(
        'TRANSACTION_SIGNED' as any,
        {
          requestId,
          walletId: request.walletId,
          txHash: result.hash,
          amount: request.transactionData.value,
          to: request.transactionData.to,
          approvals: request.approvals.length
        },
        'medium'
      );

      await this.notificationService.createNotification(
        NotificationType.TRANSACTION_CONFIRMED,
        { requestId, txHash: result.hash, walletId: request.walletId },
        'MPC 交易执行成功',
        `交易哈希: ${result.hash}`
      );

      return result.hash;
    } catch (error) {
      const request = this.signatureRequests.get(requestId);
      if (request) {
        request.status = 'rejected';
      }
      throw new Error(`执行 MPC 交易失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取 MPC 钱包列表
   */
  getMPCWallets(): MPCWalletConfig[] {
    return Array.from(this.mpcWallets.values());
  }

  /**
   * 获取签名请求列表
   */
  getSignatureRequests(walletId?: string): MPCSignatureRequest[] {
    const requests = Array.from(this.signatureRequests.values());
    return walletId ? requests.filter(r => r.walletId === walletId) : requests;
  }

  /**
   * 删除 MPC 钱包
   */
  async deleteMPCWallet(walletId: string): Promise<boolean> {
    try {
      const wallet = this.mpcWallets.get(walletId);
      if (!wallet) {
        return false;
      }

      // 删除相关适配器
      for (const chainConfig of wallet.chainConfigs) {
        this.adapters.delete(`${walletId}_${chainConfig.type}`);
      }

      // 删除钱包配置
      this.mpcWallets.delete(walletId);
      await this.saveMPCWallets();

      // 记录安全事件
      this.securityService.logSecurityEvent(
        'WALLET_DELETED' as any,
        { walletId, walletType: 'MPC' },
        'medium'
      );

      return true;
    } catch (error) {
      throw new Error(`删除 MPC 钱包失败: ${(error as Error).message}`);
    }
  }

  /**
   * 验证门限策略
   */
  private validateThresholdPolicy(policy: MPCWalletConfig['thresholdPolicy']): void {
    if (policy.requiredSigners <= 0) {
      throw new Error('所需签名者数量必须大于 0');
    }
    if (policy.requiredSigners > policy.totalSigners) {
      throw new Error('所需签名者数量不能超过总签名者数量');
    }
    if (policy.signerIds.length !== policy.totalSigners) {
      throw new Error('签名者 ID 数量与总签名者数量不匹配');
    }
  }

  /**
   * 验证安全策略
   */
  private async validateSecurityPolicy(
    wallet: MPCWalletConfig,
    transactionData: MPCSignatureRequest['transactionData']
  ): Promise<void> {
    const { securityPolicy } = wallet;

    // 检查黑名单
    if (securityPolicy.blacklistedAddresses?.includes(transactionData.to)) {
      throw new Error('目标地址在黑名单中');
    }

    // 检查白名单（如果启用）
    if (securityPolicy.whitelistedAddresses && 
        securityPolicy.whitelistedAddresses.length > 0 &&
        !securityPolicy.whitelistedAddresses.includes(transactionData.to)) {
      throw new Error('目标地址不在白名单中');
    }
  }

  /**
   * 检查是否应该自动批准
   */
  private async shouldAutoApprove(
    wallet: MPCWalletConfig,
    transactionData: MPCSignatureRequest['transactionData']
  ): Promise<boolean> {
    const { securityPolicy } = wallet;

    if (!securityPolicy.requireApproval) {
      return true;
    }

    if (securityPolicy.autoApprovalLimit) {
      const amount = parseFloat(transactionData.value);
      const limit = parseFloat(securityPolicy.autoApprovalLimit);
      return amount <= limit;
    }

    return false;
  }

  /**
   * 通知签名者
   */
  private async notifySigners(
    wallet: MPCWalletConfig,
    request: MPCSignatureRequest
  ): Promise<void> {
    // 这里可以实现具体的通知逻辑
    // 例如发送邮件、推送通知等
    await this.notificationService.createNotification(
      NotificationType.SECURITY_ALERT,
      { walletId: wallet.id, walletName: wallet.name, requestId: request.requestId },
      '新的签名请求',
      `钱包 "${wallet.name}" 有新的门限签名请求等待批准`
    );
  }

  /**
   * 清理过期的签名请求
   */
  private cleanupExpiredRequests(): void {
    const now = new Date();
    for (const [requestId, request] of this.signatureRequests.entries()) {
      if (new Date(request.expiresAt) < now && request.status === 'pending') {
        request.status = 'expired';
      }
    }
  }

  /**
   * 加载 MPC 钱包配置
   */
  private async loadMPCWallets(): Promise<void> {
    try {
      // 从存储中加载钱包配置
      // 这里需要实现具体的存储逻辑
      const stored = localStorage.getItem('mpc_wallets');
      if (stored) {
        const wallets: MPCWalletConfig[] = JSON.parse(stored);
        for (const wallet of wallets) {
          this.mpcWallets.set(wallet.id, wallet);
          
          // 重新创建适配器
          for (const chainConfig of wallet.chainConfigs) {
            const adapter = new FireblocksAdapter(
              chainConfig,
              this.fireblocksService,
              wallet.vaultAccountId
            );
            this.adapters.set(`${wallet.id}_${chainConfig.type}`, adapter);
          }
        }
      }
    } catch (error) {
      console.warn('加载 MPC 钱包配置失败:', error);
    }
  }

  /**
   * 保存 MPC 钱包配置
   */
  private async saveMPCWallets(): Promise<void> {
    try {
      const wallets = Array.from(this.mpcWallets.values());
      localStorage.setItem('mpc_wallets', JSON.stringify(wallets));
    } catch (error) {
      console.warn('保存 MPC 钱包配置失败:', error);
    }
  }

  /**
   * 生成钱包 ID
   */
  private generateWalletId(): string {
    return `mpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): {
    isInitialized: boolean;
    walletsCount: number;
    pendingRequests: number;
    fireblocksConfig: any;
  } {
    return {
      isInitialized: this.isInitialized,
      walletsCount: this.mpcWallets.size,
      pendingRequests: Array.from(this.signatureRequests.values())
        .filter(r => r.status === 'pending').length,
      fireblocksConfig: this.fireblocksService.getConfigInfo()
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.mpcWallets.clear();
    this.adapters.clear();
    this.signatureRequests.clear();
    this.isInitialized = false;
  }
}