import { BridgeService, BridgeParams, SVMToEVMBridgeParams, FeeOptimizationOptions } from '../services/BridgeService';
import { ChainManager } from '../services/ChainManager';
import { PriceService } from '../services/PriceService';
import { GasService } from '../services/GasService';

/**
 * 跨链桥使用示例
 * 展示如何使用扩展的BridgeService功能
 */
export class BridgeUsageExample {
  private bridgeService: BridgeService;
  private chainManager: ChainManager;
  private priceService: PriceService;
  private gasService: GasService;

  constructor() {
    this.chainManager = new ChainManager();
    this.priceService = new PriceService();
    this.gasService = new GasService();
    this.bridgeService = new BridgeService(this.chainManager, this.priceService, this.gasService);
  }

  /**
   * 示例1: 基本跨链转账
   */
  async basicBridgeExample(): Promise<void> {
    console.log('=== 基本跨链转账示例 ===');

    const bridgeParams: BridgeParams = {
      fromChain: 'ethereum',
      toChain: 'polygon',
      token: 'USDC',
      amount: '100',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    try {
      // 获取跨链报价
      const quotes = await this.bridgeService.getBridgeQuote(bridgeParams);
      console.log('可用的跨链报价:', quotes);

      if (quotes.length > 0) {
        const bestQuote = quotes[0]; // 选择最优报价
        console.log('选择的报价:', bestQuote);

        // 执行跨链转账
        const privateKey = 'your-private-key-here';
        const bridgeId = await this.bridgeService.executeBridge(bridgeParams, privateKey, bestQuote);
        console.log('跨链转账ID:', bridgeId);

        // 监控转账状态
        this.monitorBridgeStatus(bridgeId);
      }
    } catch (error: any) {
      console.error('基本跨链转账失败:', error.message);
    }
  }

  /**
   * 示例2: SVM到EVM跨链转账
   */
  async svmToEvmBridgeExample(): Promise<void> {
    console.log('=== SVM到EVM跨链转账示例 ===');

    const svmToEvmParams: SVMToEVMBridgeParams = {
      fromChain: 'solana',
      toChain: 'ethereum',
      token: 'SOL',
      amount: '1.5',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      solanaTokenMint: 'So11111111111111111111111111111111111111112', // SOL mint
      evmTokenContract: '0x...' // 对应的EVM代币合约
    };

    try {
      // 获取支持SVM到EVM的跨链桥
      const svmToEvmBridges = this.bridgeService.getSVMToEVMBridges();
      console.log('支持SVM到EVM的跨链桥:', svmToEvmBridges);

      // 获取增强报价
      const enhancedQuotes = await this.bridgeService.getEnhancedBridgeQuote(svmToEvmParams);
      console.log('增强跨链报价:', enhancedQuotes);

      if (enhancedQuotes.length > 0) {
        const bestQuote = enhancedQuotes[0];
        console.log('最优报价详情:');
        console.log('- 桥接费用:', bestQuote.fee);
        console.log('- Gas费用:', bestQuote.gasCost);
        console.log('- 总费用:', bestQuote.totalCost);
        console.log('- 价格影响:', bestQuote.priceImpact + '%');
        console.log('- 可信度:', bestQuote.confidence + '%');
        console.log('- 跨链路径:', bestQuote.route.join(' -> '));

        // 执行SVM到EVM跨链
        const privateKey = 'your-solana-private-key-here';
        const bridgeId = await this.bridgeService.executeSVMToEVMBridge(svmToEvmParams, privateKey, bestQuote);
        console.log('SVM到EVM跨链ID:', bridgeId);
      }
    } catch (error: any) {
      console.error('SVM到EVM跨链失败:', error.message);
    }
  }

  /**
   * 示例3: 手续费优化跨链
   */
  async optimizedBridgeExample(): Promise<void> {
    console.log('=== 手续费优化跨链示例 ===');

    const bridgeParams: BridgeParams = {
      fromChain: 'ethereum',
      toChain: 'arbitrum',
      token: 'ETH',
      amount: '0.5',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    // 不同的优化选项
    const optimizationOptions: FeeOptimizationOptions[] = [
      { prioritizeSpeed: true }, // 优先速度
      { prioritizeCost: true }, // 优先成本
      { maxSlippage: 0.5, gasPrice: '15000000000' } // 自定义参数
    ];

    for (const [index, options] of optimizationOptions.entries()) {
      try {
        console.log(`\n--- 优化选项 ${index + 1} ---`);
        console.log('优化参数:', options);

        const enhancedQuotes = await this.bridgeService.getEnhancedBridgeQuote(bridgeParams, options);
        
        if (enhancedQuotes.length > 0) {
          const topQuote = enhancedQuotes[0];
          console.log('最优报价:');
          console.log('- 协议:', topQuote.bridgeProtocol);
          console.log('- 预计时间:', topQuote.estimatedTime);
          console.log('- 总费用:', topQuote.totalCost);
          console.log('- 流动性利用率:', topQuote.liquidityUtilization + '%');
        }
      } catch (error: any) {
        console.error(`优化选项 ${index + 1} 失败:`, error.message);
      }
    }
  }

  /**
   * 示例4: 跨链状态追踪
   */
  async bridgeStatusTrackingExample(): Promise<void> {
    console.log('=== 跨链状态追踪示例 ===');

    // 获取所有跨链交易记录
    const allTransactions = this.bridgeService.getAllBridgeTransactions();
    console.log('所有跨链交易:', allTransactions.length, '笔');

    // 显示每笔交易的详细状态
    allTransactions.forEach((tx, index) => {
      console.log(`\n交易 ${index + 1}:`);
      console.log('- ID:', tx.id);
      console.log('- 状态:', tx.status);
      console.log('- 路径:', `${tx.fromChain} -> ${tx.toChain}`);
      console.log('- 金额:', tx.amount, tx.token);
      console.log('- 协议:', tx.bridgeProtocol);
      console.log('- 确认数:', `${tx.confirmations}/${tx.requiredConfirmations}`);
      console.log('- 创建时间:', new Date(tx.createdAt).toLocaleString());
      console.log('- 更新时间:', new Date(tx.updatedAt).toLocaleString());
      
      if (tx.fromTxHash) {
        console.log('- 源链交易:', tx.fromTxHash);
      }
      if (tx.toTxHash) {
        console.log('- 目标链交易:', tx.toTxHash);
      }
      if (tx.errorMessage) {
        console.log('- 错误信息:', tx.errorMessage);
      }
    });
  }

  /**
   * 示例5: 协议比较分析
   */
  async protocolComparisonExample(): Promise<void> {
    console.log('=== 协议比较分析示例 ===');

    const bridgeParams: BridgeParams = {
      fromChain: 'ethereum',
      toChain: 'polygon',
      token: 'USDT',
      amount: '1000',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    try {
      const enhancedQuotes = await this.bridgeService.getEnhancedBridgeQuote(bridgeParams);
      
      console.log('\n协议对比分析:');
      console.log('协议名称\t\t费用\t\tGas费用\t\t总费用\t\t时间\t\t可信度');
      console.log('=' .repeat(80));
      
      enhancedQuotes.forEach(quote => {
        console.log(
          `${quote.bridgeProtocol.padEnd(15)}\t` +
          `${quote.fee.padEnd(10)}\t` +
          `${quote.gasCost.padEnd(10)}\t` +
          `${quote.totalCost.padEnd(10)}\t` +
          `${quote.estimatedTime.padEnd(10)}\t` +
          `${quote.confidence}%`
        );
      });

      // 推荐最佳选择
      if (enhancedQuotes.length > 0) {
        const recommended = enhancedQuotes[0];
        console.log('\n推荐选择:', recommended.bridgeProtocol);
        console.log('推荐理由: 综合考虑费用、时间和可信度的最优选择');
      }
    } catch (error: any) {
      console.error('协议比较失败:', error.message);
    }
  }

  /**
   * 监控跨链状态
   */
  private monitorBridgeStatus(bridgeId: string): void {
    const checkStatus = () => {
      const status = this.bridgeService.getBridgeStatus(bridgeId);
      if (status) {
        console.log(`跨链状态更新 [${bridgeId}]:`, status.status);
        
        if (status.status === 'completed') {
          console.log('跨链转账完成!');
          console.log('目标链交易哈希:', status.toTxHash);
        } else if (status.status === 'failed') {
          console.log('跨链转账失败:', status.errorMessage);
        } else {
          // 继续监控
          setTimeout(checkStatus, 10000); // 10秒后再次检查
        }
      }
    };

    // 开始监控
    setTimeout(checkStatus, 5000); // 5秒后开始检查
  }

  /**
   * 运行所有示例
   */
  async runAllExamples(): Promise<void> {
    console.log('开始运行跨链桥使用示例...');
    
    try {
      await this.basicBridgeExample();
      await this.svmToEvmBridgeExample();
      await this.optimizedBridgeExample();
      await this.bridgeStatusTrackingExample();
      await this.protocolComparisonExample();
    } catch (error: any) {
      console.error('示例运行失败:', error.message);
    }

    console.log('\n所有示例运行完成!');
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.bridgeService.destroy();
  }
}

// 使用示例
if (require.main === module) {
  const example = new BridgeUsageExample();
  
  example.runAllExamples()
    .then(() => {
      console.log('示例执行完成');
      example.destroy();
    })
    .catch((error) => {
      console.error('示例执行失败:', error);
      example.destroy();
    });
}

export default BridgeUsageExample;