import { BridgeService, SVMToEVMBridgeParams, FeeOptimizationOptions, EnhancedBridgeQuote } from '../services/BridgeService';
import { ChainManager } from '../services/ChainManager';
import { PriceService } from '../services/PriceService';
import { GasService } from '../services/GasService';
import { ChainType, ChainConfig, NetworkCategory } from '../types/chain';

/**
 * SVM到EVM跨链桥演示
 * 展示如何从Solana (SVM) 转账到以太坊 (EVM) 并计算Gas费用
 */
export class SVMToEVMBridgeDemo {
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
   * 初始化演示环境
   */
  async initialize(): Promise<void> {
    console.log('🚀 初始化SVM到EVM跨链桥演示环境...');
    
    // 初始化链配置
    const ethereumConfig: ChainConfig = {
      id: '1',
      name: 'Ethereum',
      type: ChainType.EVM,
      category: NetworkCategory.MAINNET,
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
      chainId: 1,
      symbol: 'ETH',
      decimals: 18,
      blockExplorerUrl: 'https://etherscan.io',
      isTestnet: false
    };

    const solanaConfig: ChainConfig = {
      id: 'mainnet-beta',
      name: 'Solana',
      type: ChainType.SOLANA,
      category: NetworkCategory.MAINNET,
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      symbol: 'SOL',
      decimals: 9,
      blockExplorerUrl: 'https://explorer.solana.com',
      isTestnet: false
    };

    // 初始化Gas服务
    await this.gasService.initialize(ethereumConfig);
    
    console.log('✅ 演示环境初始化完成');
  }

  /**
   * 演示跨链桥的基本概念
   */
  explainCrossChainBridge(): void {
    console.log('\n📚 === 什么是跨链桥？ ===');
    console.log('跨链桥是连接不同区块链网络的基础设施，允许用户在不同链之间转移资产。');
    console.log('\n🔗 跨链桥的工作原理：');
    console.log('1. 锁定/销毁：在源链上锁定或销毁代币');
    console.log('2. 验证：跨链协议验证交易的有效性');
    console.log('3. 铸造/释放：在目标链上铸造或释放对应的代币');
    console.log('\n🌉 常见的跨链桥协议：');
    console.log('• Wormhole：支持多链，包括Solana和以太坊');
    console.log('• LayerZero：专注于EVM链之间的跨链');
    console.log('• Allbridge：支持多种链，包括SVM和EVM');
    console.log('• Portal (Wormhole)：专门的资产跨链桥');
    console.log('\n⚡ SVM vs EVM：');
    console.log('• SVM (Solana Virtual Machine)：Solana的虚拟机，并行处理');
    console.log('• EVM (Ethereum Virtual Machine)：以太坊虚拟机，顺序处理');
    console.log('• 跨链桥需要处理两种不同架构之间的差异');
  }

  /**
   * 获取支持SVM到EVM的跨链桥
   */
  async getSupportedBridges(): Promise<void> {
    console.log('\n🌉 === 获取支持SVM到EVM的跨链桥 ===');
    
    try {
      const svmToEvmBridges = this.bridgeService.getSVMToEVMBridges();
      
      console.log(`找到 ${svmToEvmBridges.length} 个支持SVM到EVM的跨链桥：`);
      
      svmToEvmBridges.forEach((bridge, index) => {
        console.log(`\n${index + 1}. ${bridge.name}`);
        console.log(`   • 手续费: ${bridge.fee}%`);
        console.log(`   • 预计时间: ${bridge.estimatedTime}`);
        console.log(`   • 最大金额: $${bridge.maxAmount}`);
        console.log(`   • 最小金额: $${bridge.minAmount}`);
        console.log(`   • Gas优化: ${bridge.gasOptimization ? '✅' : '❌'}`);
        console.log(`   • 流动性深度: $${bridge.liquidityDepth}`);
        console.log(`   • 支持的链: ${bridge.supportedChains.join(', ')}`);
      });
    } catch (error: any) {
      console.error('❌ 获取跨链桥失败:', error.message);
    }
  }

  /**
   * 模拟SVM到EVM跨链转账
   */
  async simulateSVMToEVMBridge(): Promise<void> {
    console.log('\n💰 === 模拟SVM到EVM跨链转账 ===');
    
    // 定义跨链参数
    const bridgeParams: SVMToEVMBridgeParams = {
      fromChain: 'solana',
      toChain: 'ethereum',
      token: 'SOL',
      amount: '2.5', // 2.5 SOL
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      solanaTokenMint: 'So11111111111111111111111111111111111111112', // SOL mint地址
      evmTokenContract: '0x...' // 对应的EVM代币合约（实际应用中需要真实地址）
    };

    console.log('📋 跨链转账参数：');
    console.log(`   • 源链: ${bridgeParams.fromChain} (SVM)`);
    console.log(`   • 目标链: ${bridgeParams.toChain} (EVM)`);
    console.log(`   • 代币: ${bridgeParams.token}`);
    console.log(`   • 金额: ${bridgeParams.amount}`);
    console.log(`   • 接收地址: ${bridgeParams.recipient}`);

    try {
      // 获取增强报价
      console.log('\n🔍 获取跨链报价...');
      const enhancedQuotes = await this.bridgeService.getEnhancedBridgeQuote(bridgeParams);
      
      if (enhancedQuotes.length === 0) {
        console.log('❌ 没有找到可用的跨链报价');
        return;
      }

      console.log(`\n📊 找到 ${enhancedQuotes.length} 个跨链报价：`);
      
      enhancedQuotes.forEach((quote, index) => {
        console.log(`\n${index + 1}. ${quote.bridgeProtocol}`);
        console.log(`   • 源金额: ${quote.fromAmount} ${bridgeParams.token}`);
        console.log(`   • 目标金额: ${quote.toAmount} ${bridgeParams.token}`);
        console.log(`   • 桥接费用: ${quote.fee}`);
        console.log(`   • Gas费用: ${quote.gasCost} ETH`);
        console.log(`   • 总费用: ${quote.totalCost}`);
        console.log(`   • 汇率: ${quote.exchangeRate}`);
        console.log(`   • 价格影响: ${quote.priceImpact}%`);
        console.log(`   • 流动性利用率: ${quote.liquidityUtilization}%`);
        console.log(`   • 可信度: ${quote.confidence}%`);
        console.log(`   • 预计时间: ${quote.estimatedTime}`);
        console.log(`   • 跨链路径: ${quote.route.join(' → ')}`);
      });

      // 选择最优报价（第一个）
      const bestQuote = enhancedQuotes[0];
      console.log(`\n🏆 选择最优报价: ${bestQuote.bridgeProtocol}`);
      
      // 详细的Gas费用分析
      await this.analyzeGasCosts(bestQuote);
      
      // 模拟执行跨链转账
      await this.simulateExecution(bridgeParams, bestQuote);
      
    } catch (error: any) {
      console.error('❌ 模拟跨链转账失败:', error.message);
    }
  }

  /**
   * 分析Gas费用
   */
  private async analyzeGasCosts(quote: EnhancedBridgeQuote): Promise<void> {
    console.log('\n⛽ === Gas费用详细分析 ===');
    
    try {
      // 获取当前Gas价格
      const gasPrices = await this.gasService.getCurrentGasPrice();
      console.log('📈 当前Gas价格 (Gwei):');
      console.log(`   • 慢速: ${gasPrices.slow}`);
      console.log(`   • 标准: ${gasPrices.standard}`);
      console.log(`   • 快速: ${gasPrices.fast}`);

      // 获取EIP-1559费用建议
      try {
        const eip1559Fees = await this.gasService.getEIP1559Fees();
        console.log('\n🚀 EIP-1559费用建议 (Gwei):');
        console.log('   慢速:');
        console.log(`     • Max Fee: ${eip1559Fees.slow.maxFeePerGas}`);
        console.log(`     • Priority Fee: ${eip1559Fees.slow.maxPriorityFeePerGas}`);
        console.log('   标准:');
        console.log(`     • Max Fee: ${eip1559Fees.standard.maxFeePerGas}`);
        console.log(`     • Priority Fee: ${eip1559Fees.standard.maxPriorityFeePerGas}`);
        console.log('   快速:');
        console.log(`     • Max Fee: ${eip1559Fees.fast.maxFeePerGas}`);
        console.log(`     • Priority Fee: ${eip1559Fees.fast.maxPriorityFeePerGas}`);
      } catch (error) {
        console.log('ℹ️  EIP-1559不支持或获取失败');
      }

      // 分析跨链Gas成本组成
      console.log('\n💸 跨链Gas成本组成:');
      console.log(`   • 源链交易费用 (Solana): ~0.00025 SOL`);
      console.log(`   • 目标链交易费用 (Ethereum): ${quote.gasCost} ETH`);
      console.log(`   • 桥接协议费用: ${quote.fee}`);
      console.log(`   • 总费用: ${quote.totalCost}`);
      
      // Gas优化建议
      console.log('\n🎯 Gas优化建议:');
      console.log('   • 选择Gas优化的跨链桥协议');
      console.log('   • 在网络拥堵较低时进行跨链');
      console.log('   • 考虑批量跨链以摊薄固定成本');
      console.log('   • 使用Layer 2解决方案降低成本');
      
    } catch (error: any) {
      console.error('❌ Gas费用分析失败:', error.message);
    }
  }

  /**
   * 模拟执行跨链转账
   */
  private async simulateExecution(params: SVMToEVMBridgeParams, quote: EnhancedBridgeQuote): Promise<void> {
    console.log('\n🔄 === 模拟执行跨链转账 ===');
    
    try {
      console.log('⏳ 开始跨链转账模拟...');
      
      // 模拟私钥（实际应用中应该安全处理）
      const mockPrivateKey = 'demo-private-key-for-simulation';
      
      // 执行跨链转账
      const bridgeId = await this.bridgeService.executeSVMToEVMBridge(params, mockPrivateKey, quote);
      
      console.log(`✅ 跨链转账已提交，ID: ${bridgeId}`);
      
      // 模拟监控跨链状态
      await this.simulateStatusMonitoring(bridgeId);
      
    } catch (error: any) {
      console.error('❌ 跨链转账执行失败:', error.message);
      
      // 提供故障排除建议
      console.log('\n🔧 故障排除建议:');
      console.log('   • 检查账户余额是否足够');
      console.log('   • 确认网络连接正常');
      console.log('   • 验证接收地址格式正确');
      console.log('   • 检查跨链桥是否正常运行');
      console.log('   • 确认代币合约地址正确');
    }
  }

  /**
   * 模拟状态监控
   */
  private async simulateStatusMonitoring(bridgeId: string): Promise<void> {
    console.log('\n📊 === 跨链状态监控 ===');
    
    const statuses = ['pending', 'processing', 'confirming', 'completed'];
    
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      console.log(`🔄 状态: ${status}`);
      
      switch (status) {
        case 'pending':
          console.log('   • 等待源链交易确认...');
          break;
        case 'processing':
          console.log('   • 跨链协议处理中...');
          break;
        case 'confirming':
          console.log('   • 目标链确认中...');
          break;
        case 'completed':
          console.log('   • ✅ 跨链转账完成！');
          break;
      }
      
      // 模拟等待时间
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 获取最终状态
    try {
      const finalStatus = await this.bridgeService.getBridgeStatus(bridgeId);
      if (finalStatus) {
        console.log('\n📋 最终状态详情:');
        console.log(`   • 状态: ${finalStatus.status}`);
        console.log(`   • 源链交易哈希: ${finalStatus.fromTxHash || 'N/A'}`);
        console.log(`   • 目标链交易哈希: ${finalStatus.toTxHash || 'N/A'}`);
        console.log(`   • 确认数: ${finalStatus.confirmations || 0}/${finalStatus.requiredConfirmations || 12}`);
        console.log(`   • 创建时间: ${new Date(finalStatus.createdAt).toLocaleString()}`);
        console.log(`   • 更新时间: ${new Date(finalStatus.updatedAt).toLocaleString()}`);
      } else {
        console.log('❌ 无法获取跨链状态');
      }
    } catch (error: any) {
      console.error('❌ 获取状态失败:', error.message);
    }
  }

  /**
   * 费用优化演示
   */
  async demonstrateFeeOptimization(): Promise<void> {
    console.log('\n🎯 === 费用优化演示 ===');
    
    const optimizationOptions: FeeOptimizationOptions[] = [
      { prioritizeSpeed: true, maxSlippage: 0.5 },
      { prioritizeCost: true, maxSlippage: 2.0 },
      { maxSlippage: 1.0, gasPrice: '20000000000' } // 20 Gwei
    ];
    
    const baseParams: SVMToEVMBridgeParams = {
      fromChain: 'solana',
      toChain: 'ethereum',
      token: 'SOL',
      amount: '1.0',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };
    
    for (let i = 0; i < optimizationOptions.length; i++) {
      const option = optimizationOptions[i];
      console.log(`\n${i + 1}. 优化策略: ${option.prioritizeSpeed ? '优先速度' : option.prioritizeCost ? '优先成本' : '平衡模式'}`);
      
      try {
        const quotes = await this.bridgeService.getEnhancedBridgeQuote(baseParams, option);
        
        if (quotes.length > 0) {
          const quote = quotes[0];
          console.log(`   • 协议: ${quote.bridgeProtocol}`);
          console.log(`   • 总费用: ${quote.totalCost}`);
          console.log(`   • 预计时间: ${quote.estimatedTime}`);
          console.log(`   • 滑点: ${quote.priceImpact}%`);
        }
      } catch (error: any) {
        console.error(`   ❌ 优化失败: ${error.message}`);
      }
    }
  }

  /**
   * 运行完整演示
   */
  async runDemo(): Promise<void> {
    try {
      console.log('🌉 SVM到EVM跨链桥演示开始\n');
      
      // 初始化
      await this.initialize();
      
      // 解释跨链桥概念
      this.explainCrossChainBridge();
      
      // 获取支持的跨链桥
      await this.getSupportedBridges();
      
      // 模拟跨链转账
      await this.simulateSVMToEVMBridge();
      
      // 费用优化演示
      await this.demonstrateFeeOptimization();
      
      console.log('\n🎉 === 演示完成 ===');
      console.log('通过这个演示，您了解了:');
      console.log('• 跨链桥的基本概念和工作原理');
      console.log('• SVM到EVM跨链转账的完整流程');
      console.log('• Gas费用的计算和优化策略');
      console.log('• 跨链状态监控和故障排除');
      
    } catch (error: any) {
      console.error('❌ 演示运行失败:', error.message);
    }
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  const demo = new SVMToEVMBridgeDemo();
  demo.runDemo().catch(console.error);
}

export default SVMToEVMBridgeDemo;