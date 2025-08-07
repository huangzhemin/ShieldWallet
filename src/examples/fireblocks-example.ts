/**
 * Fireblocks MPC 门限签名使用示例
 * 此文件展示如何在 ShieldWallet 中使用 Fireblocks 门限签名功能
 */

import { 
  FireblocksManagerService, 
  FireblocksConfig,
  MPCWalletConfig 
} from '../services';
import { SecurityService } from '../services/SecurityService';
import { NotificationService } from '../services/NotificationService';
import { ChainType, NetworkCategory } from '../types/chain';

// Node.js 环境下的 localStorage 模拟
if (typeof localStorage === 'undefined') {
  const storage: { [key: string]: string } = {};
  (global as any).localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    length: 0,
    key: (index: number) => Object.keys(storage)[index] || null
  };
}

/**
 * Fireblocks MPC 示例类
 */
export class FireblocksMPCExample {
  private fireblocksManager: FireblocksManagerService;
  private securityService: SecurityService;
  private notificationService: NotificationService;

  constructor() {
    // 初始化依赖服务
    this.securityService = new SecurityService();
    this.notificationService = new NotificationService();

    // 检查环境变量配置
    this.checkEnvironmentConfig();

    // 配置 Fireblocks
    const fireblocksConfig: FireblocksConfig = {
      apiKey: process.env.FIREBLOCKS_API_KEY || 'demo-api-key',
      privateKey: process.env.FIREBLOCKS_PRIVATE_KEY || this.getDemoPrivateKey(),
      baseUrl: process.env.FIREBLOCKS_BASE_URL || 'https://sandbox-api.fireblocks.io', // 使用沙盒环境
      timeoutMs: 30000
    };

    // 初始化 Fireblocks 管理服务
    this.fireblocksManager = new FireblocksManagerService(
      fireblocksConfig,
      this.securityService,
      this.notificationService
    );
  }

  /**
   * 检查环境变量配置
   */
  private checkEnvironmentConfig(): void {
    console.log('\n🔧 检查环境配置...');
    
    const hasApiKey = !!process.env.FIREBLOCKS_API_KEY;
    const hasPrivateKey = !!process.env.FIREBLOCKS_PRIVATE_KEY;
    const isDemoMode = !hasApiKey || !hasPrivateKey;
    
    console.log(`   API Key: ${hasApiKey ? '✅ 已设置' : '❌ 未设置 (使用演示密钥)'}`);
    console.log(`   Private Key: ${hasPrivateKey ? '✅ 已设置' : '❌ 未设置 (使用演示私钥)'}`);
    console.log(`   Base URL: ${process.env.FIREBLOCKS_BASE_URL || 'https://sandbox-api.fireblocks.io'}`);
    
    if (isDemoMode) {
      console.log('\n🎭 演示模式已启用');
      console.log('   - 所有 API 调用将返回模拟数据');
      console.log('   - 不会进行真实的区块链交易');
      console.log('   - 适合学习和测试 MPC 门限签名流程');
      console.log('\n💡 要使用真实 Fireblocks API，请参考 FIREBLOCKS_SETUP.md 配置凭证');
    } else {
      console.log('\n✅ 生产模式已启用 - 将连接到真实的 Fireblocks API');
    }
  }

  /**
   * 运行完整的 MPC 门限签名示例
   */
  async runExample(): Promise<void> {
    try {
      console.log('🚀 开始 Fireblocks MPC 门限签名示例...');

      // 1. 初始化服务
      await this.initializeServices();

      // 2. 创建 MPC 钱包
      const walletId = await this.createMPCWallet();

      // 3. 获取钱包信息
      await this.displayWalletInfo(walletId);

      // 4. 创建门限签名请求
      const requestId = await this.createSignatureRequest(walletId);

      // 5. 模拟签名者批准流程
      await this.simulateApprovalProcess(requestId);

      // 6. 显示最终状态
      await this.displayFinalStatus();

      console.log('✅ Fireblocks MPC 示例执行完成！');
    } catch (error) {
      console.error('❌ 示例执行失败:', error);
      
      // 提供错误解决建议
      if (error instanceof Error && error.message.includes('401')) {
        console.log('\n💡 解决建议:');
        console.log('   1. 检查 FIREBLOCKS_API_KEY 是否正确');
        console.log('   2. 检查 FIREBLOCKS_PRIVATE_KEY 是否为有效的 PEM 格式私钥');
        console.log('   3. 确认 API 密钥具有足够的权限');
        console.log('   4. 验证网络连接是否正常');
      }
      
      throw error;
    }
  }

  /**
   * 初始化所有服务
   */
  private async initializeServices(): Promise<void> {
    console.log('📋 初始化服务...');
    
    try {
      await this.fireblocksManager.initialize();
      console.log('✅ Fireblocks 管理服务初始化成功');
    } catch (error) {
      console.error('❌ 服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建 MPC 钱包
   */
  private async createMPCWallet(): Promise<string> {
    console.log('🏦 创建 MPC 钱包...');

    // 定义支持的链配置
    const chainConfigs = [
      {
        id: 'ethereum-mainnet',
        type: ChainType.EVM,
        category: NetworkCategory.MAINNET,
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        decimals: 18,
        rpcUrl: 'https://mainnet.infura.io/v3/demo',
        blockExplorerUrl: 'https://etherscan.io',
        chainId: 1,
        isTestnet: false
      },
      {
        id: 'polygon-mainnet',
        type: ChainType.EVM,
        category: NetworkCategory.LAYER2,
        name: 'Polygon Mainnet',
        symbol: 'MATIC',
        decimals: 18,
        rpcUrl: 'https://polygon-rpc.com',
        blockExplorerUrl: 'https://polygonscan.com',
        chainId: 137,
        isTestnet: false
      }
    ];

    // 定义门限策略（2-of-3 多重签名）
    const thresholdPolicy = {
      requiredSigners: 2,
      totalSigners: 3,
      signerIds: [
        'ceo_device_001',
        'cfo_device_002',
        'cto_device_003'
      ]
    };

    // 定义安全策略
    const securityPolicy = {
      requireApproval: true,
      autoApprovalLimit: '0.1', // 0.1 ETH 以下自动批准
      whitelistedAddresses: [
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // 示例白名单地址
      ],
      blacklistedAddresses: [
        '0x0000000000000000000000000000000000000000' // 零地址
      ]
    };

    try {
      const walletId = await this.fireblocksManager.createMPCWallet(
        'ShieldWallet Enterprise MPC',
        chainConfigs,
        thresholdPolicy,
        securityPolicy
      );

      console.log('✅ MPC 钱包创建成功');
      console.log(`   钱包 ID: ${walletId}`);
      console.log(`   门限策略: ${thresholdPolicy.requiredSigners}-of-${thresholdPolicy.totalSigners}`);
      console.log(`   支持链数: ${chainConfigs.length}`);

      return walletId;
    } catch (error) {
      console.error('❌ MPC 钱包创建失败:', error);
      throw error;
    }
  }

  /**
   * 显示钱包信息
   */
  private async displayWalletInfo(walletId: string): Promise<void> {
    console.log('📊 获取钱包信息...');

    try {
      const wallets = this.fireblocksManager.getMPCWallets();
      const wallet = wallets.find(w => w.id === walletId);

      if (wallet) {
        console.log('📋 钱包详情:');
        console.log(`   名称: ${wallet.name}`);
        console.log(`   Vault 账户: ${wallet.vaultAccountId}`);
        console.log(`   创建时间: ${wallet.createdAt}`);
        console.log(`   门限策略: ${wallet.thresholdPolicy.requiredSigners}/${wallet.thresholdPolicy.totalSigners}`);
        console.log(`   安全策略: ${wallet.securityPolicy.requireApproval ? '需要批准' : '自动执行'}`);
        
        // 显示支持的链
        console.log('   支持的链:');
        wallet.chainConfigs.forEach(chain => {
          console.log(`     - ${chain.name} (${chain.symbol})`);
        });
      }
    } catch (error) {
      console.error('❌ 获取钱包信息失败:', error);
    }
  }

  /**
   * 创建门限签名请求
   */
  private async createSignatureRequest(walletId: string): Promise<string> {
    console.log('📝 创建门限签名请求...');

    try {
      const requestId = await this.fireblocksManager.createSignatureRequest(
        walletId,
        {
          to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          value: '0.05', // 0.05 ETH
          chainType: ChainType.EVM
        },
        {
          userId: 'demo_user_123',
          deviceId: 'demo_device_456',
          ipAddress: '192.168.1.100'
        }
      );

      console.log('✅ 门限签名请求创建成功');
      console.log(`   请求 ID: ${requestId}`);
      console.log(`   交易金额: 0.05 ETH`);
      console.log(`   目标地址: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`);

      return requestId;
    } catch (error) {
      console.error('❌ 创建签名请求失败:', error);
      throw error;
    }
  }

  /**
   * 模拟签名者批准流程
   */
  private async simulateApprovalProcess(requestId: string): Promise<void> {
    console.log('✍️ 模拟签名者批准流程...');

    try {
      // 检查签名请求状态
      const requests = this.fireblocksManager.getSignatureRequests();
      const request = requests.find(r => r.requestId === requestId);
      
      if (!request) {
        throw new Error('签名请求不存在');
      }

      if (request.status === 'completed') {
        console.log('🎯 签名请求已自动完成，无需手动批准');
        console.log('🎉 门限签名完成，交易已通过 Fireblocks MPC 执行！');
        return;
      }

      // 第一个签名者批准
      console.log('   👤 CEO 设备批准中...');
      const approved1 = await this.fireblocksManager.approveSignatureRequest(
        requestId,
        'ceo_device_001',
        true
      );
      console.log(`   ✅ CEO 批准完成 ${approved1 ? '(交易已执行)' : '(等待更多批准)'}`);

      if (!approved1) {
        // 第二个签名者批准（达到门限）
        console.log('   👤 CFO 设备批准中...');
        const approved2 = await this.fireblocksManager.approveSignatureRequest(
          requestId,
          'cfo_device_002',
          true
        );
        console.log(`   ✅ CFO 批准完成 ${approved2 ? '(交易已执行)' : '(仍需更多批准)'}`);

        if (approved2) {
          console.log('🎉 门限签名完成，交易已通过 Fireblocks MPC 执行！');
        }
      } else {
        console.log('🎉 交易已自动执行（满足自动批准条件）！');
      }
    } catch (error) {
      console.error('❌ 签名批准流程失败:', error);
      throw error;
    }
  }

  /**
   * 显示最终状态
   */
  private async displayFinalStatus(): Promise<void> {
    console.log('📈 显示最终状态...');

    try {
      const status = this.fireblocksManager.getServiceStatus();
      console.log('🔍 服务状态:');
      console.log(`   初始化状态: ${status.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}`);
      console.log(`   MPC 钱包数量: ${status.walletsCount}`);
      console.log(`   待处理请求: ${status.pendingRequests}`);

      // 显示所有签名请求
      const requests = this.fireblocksManager.getSignatureRequests();
      if (requests.length > 0) {
        console.log('📋 签名请求历史:');
        requests.forEach(request => {
          console.log(`   - ${request.requestId}: ${request.status}`);
          console.log(`     金额: ${request.transactionData.value}`);
          console.log(`     批准数: ${request.approvals.filter(a => a.approved).length}/${request.approvals.length}`);
        });
      }
    } catch (error) {
      console.error('❌ 获取状态失败:', error);
    }
  }

  /**
   * 获取演示用的私钥（实际使用时应从环境变量读取）
   */
  private getDemoPrivateKey(): string {
    // 这是一个用于演示的测试私钥，请在生产环境中使用您的实际 Fireblocks 私钥
    return `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAtuBwQeE4XDKi39dsLet1eEGc+1QN0d1/SIsdBFGDE0bCZpiJ
vlEcE0L74tzNZaS4gZDIUFLQ29IKCrg5DQGJu02BQD5znaLWUxDxLi+ddPUEIvfe
3zGetKinYLFj9soolaIhhSNhiaq5l4RXRhfi+V5HqG5YfE82PhEvp4Aw2JE4Kygt
mkVNH2p4aW4lRUDgmIUPd656r2ejGgHO8yhDaIPZwIr6BqsMZ/hVuplQxLCLtsg2
u9bVpNiuuwOhKJBuImnkcvkFEeuOTfvRvtJY+vxsRfyZOhOVHOyre3wG42VmvM3i
ieRHadf8HXfGnOUylQCP3IZSfNYweAikaqYtfwIDAQABAoIBAGv50m4jc2qEf0RY
5keqmX46h1yhgVNjS27irGxLUHAGPGvlLpcPPttklmKZajDUdBgUCyHZ8/WGa2Vu
5kh2mwLbPTBYb10osxDylORnOrm+nQWkgpQXsRQL7F+b/WDOde37f30jqchl5BTB
D+KT4fDIqNia5mXnQyicbx2gA7cp7wDqN+A/VHO9omhWkf8OC9UJqRtxBSw8cxGy
1SGiDuDMerFeTNEvhCX8AmHeIJgoQZx8o+sPDQNMtPql9DFIIRweexXMqCuJpod/
fWLpX69mrMb0xzUy+j0xLnf/+9NRdEPGRbMS6QI24oaLU+JQMw6p5YvXWy2VN+iM
Wg/hgCkCgYEA5276iGfyqHuInPoZSeGCKiK8k4hBBGGXvvV91lcreWJmcKeU61fq
LjmxI0MRYajHA3Ox3kwdVqiYyibff3NAAkhbyYaDnrZGlTE6p/Z27cUNWGFmckW4
FlH/zzW4BdeSre1BOKDO970D2zP+hkFwS8gTUB8KpHcdU6lEmy8DWosCgYEAykn3
scpBF+GMRg5UhHJb7Py/6mfqGbvAASijSPgITB5mNvGd5mimVFzkbUNBf6t/MNXd
XEuiqF14opcE/D9wBBZXYzMroHT/XWoDo9Q778l6X4IADQVEKjijuy3LH7cZS72O
tHJ9gOp+3za/ZXYVuT6lklIilzl9C6LazcL4+10CgYEAyHFFCYlGEIhVrOerqWJn
8wh83SZgcWP5IonKgC6lV49S+/UYtLBDAeAzvD+lOTkNjL7SaZ7wthJ1qnf6kI8H
/DIhVSxsqLRj82lczQZYwNwvD8HkEcqygppofVWgWWb5Aix/lYUpXEXXpi2lHzBk
Cy5xE66e8Ay+WKw84E7aj7sCgYA2/Qpm+vrc2gP+mzCgXFHexwoIVz0Mx7u21Owm
Dr56qpzQfLeWhYYJUsMJbInmgaDujoRA7ZKGv/nmALVrOHdjtQsGPUezs3ojU4kv
xKaSVSt9wOHwqCjSbVkcraMUuPoYW6vqI2E4ZQYd+Uzn8MSQ+ZWag9dBUnBKdHeU
DVcPRQKBgGSqSHJKz1Y5cmig94LPfG6ElEm9qvBcc6AXtYyMj5+2ZR4JoSBqGMUR
D0jhzA2Mkj2CZOoHE+guAZez0RNtJEvYiLXjHvIkL56emIZcXj+x0VrFtI87HExa
3b1zumO2PCfo1qXJPfD3X4v6hQHKs7WUmplIDsQn07IEZG50lTnl
-----END RSA PRIVATE KEY-----`;
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('🧹 清理资源...');
    try {
      this.fireblocksManager.destroy();
      console.log('✅ 资源清理完成');
    } catch (error) {
      console.error('❌ 资源清理失败:', error);
    }
  }
}

/**
 * 运行示例的主函数
 */
export async function runFireblocksExample(): Promise<void> {
  const example = new FireblocksMPCExample();
  
  try {
    await example.runExample();
  } catch (error) {
    console.error('示例执行失败:', error);
  } finally {
    await example.cleanup();
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runFireblocksExample().catch(console.error);
}

/**
 * 使用说明：
 * 
 * 1. 设置环境变量：
 *    export FIREBLOCKS_API_KEY="your-api-key"
 *    export FIREBLOCKS_PRIVATE_KEY="$(cat path/to/private-key.pem)"
 * 
 * 2. 运行示例：
 *    npm run example:fireblocks
 *    或
 *    npx ts-node src/examples/fireblocks-example.ts
 * 
 * 3. 观察输出：
 *    - 服务初始化过程
 *    - MPC 钱包创建
 *    - 门限签名请求创建
 *    - 签名者批准流程
 *    - 交易执行结果
 */