import { LayerZeroSVMBridgeService } from '../services/LayerZeroSVMBridgeService';
import { BridgeParams, SVMToEVMBridgeConfig } from '../types/chain';

/**
 * LayerZero SVM到EVM跨链演示
 * 展示如何使用LayerZero从Solana跨链到各种EVM链
 */
export class LayerZeroSVMEVMDemo {
  private bridgeService: LayerZeroSVMBridgeService;

  constructor() {
    this.bridgeService = new LayerZeroSVMBridgeService();
  }

  /**
   * 运行完整的演示
   */
  async runDemo(): Promise<void> {
    console.log('🚀 === LayerZero SVM到EVM跨链演示 ===\n');

    try {
      // 1. 显示支持的跨链路径
      await this.showSupportedPaths();

      // 2. 演示费用估算
      await this.demonstrateFeeEstimation();

      // 3. 演示参数验证
      await this.demonstrateParameterValidation();

      // 4. 演示跨链路径分析
      await this.demonstratePathAnalysis();

      // 5. 演示统计信息
      await this.showBridgeStats();

      // 6. 模拟跨链操作
      await this.simulateCrossChainTransfer();

      console.log('\n✅ 演示完成！');
    } catch (error) {
      console.error('❌ 演示过程中出现错误:', error);
    }
  }

  /**
   * 显示支持的跨链路径
   */
  private async showSupportedPaths(): Promise<void> {
    console.log('📋 === 支持的跨链路径 ===');
    
    const supportedChains = this.bridgeService.getSupportedEVMChains();
    const supportedTokens = this.bridgeService.getSupportedTokens();
    
    console.log(`支持从 Solana 跨链到 ${supportedChains.length} 个EVM链:`);
    supportedChains.forEach((chain, index) => {
      console.log(`  ${index + 1}. ${chain}`);
    });

    console.log(`\n支持的代币 (${supportedTokens.length}):`);
    supportedTokens.forEach((token, index) => {
      console.log(`  ${index + 1}. ${token}`);
    });

    console.log('\n支持的跨链组合:');
    let combinationCount = 0;
    for (const token of supportedTokens) {
      for (const chain of supportedChains) {
        if (this.bridgeService.isSupported('solana', chain, token)) {
          combinationCount++;
          console.log(`  ${combinationCount}. SOL -> ${chain} (${token})`);
        }
      }
    }
    console.log(`总计: ${combinationCount} 种组合\n`);
  }

  /**
   * 演示费用估算
   */
  private async demonstrateFeeEstimation(): Promise<void> {
    console.log('💰 === 费用估算演示 ===');
    
    const testCases: Array<{token: string, amount: string, toChain: string}> = [
      { token: 'SOL', amount: '100', toChain: 'ethereum' },
      { token: 'USDC', amount: '1000', toChain: 'polygon' },
      { token: 'USDT', amount: '500', toChain: 'arbitrum' },
      { token: 'SOL', amount: '50', toChain: 'optimism' },
      { token: 'USDC', amount: '2000', toChain: 'bsc' }
    ];

    for (const testCase of testCases) {
      try {
        const params: BridgeParams = {
          fromChain: 'solana',
          toChain: testCase.toChain,
          token: testCase.token,
          amount: testCase.amount,
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        };

        const fee = await this.bridgeService.estimateFee(params);
        
        console.log(`${testCase.token} -> ${testCase.toChain} (${testCase.amount}):`);
        console.log(`  原生费用: ${fee.nativeFee} ETH`);
        console.log(`  ZRO费用: ${fee.zroFee}`);
        console.log(`  总费用: ${fee.totalFee} ETH\n`);
      } catch (error) {
        console.log(`❌ ${testCase.token} -> ${testCase.toChain}: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  }

  /**
   * 演示参数验证
   */
  private async demonstrateParameterValidation(): Promise<void> {
    console.log('✅ === 参数验证演示 ===');
    
    const testCases: Array<{description: string, params: BridgeParams}> = [
      {
        description: '有效的跨链参数',
        params: {
          fromChain: 'solana',
          toChain: 'ethereum',
          token: 'SOL',
          amount: '100',
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      },
      {
        description: '无效的源链',
        params: {
          fromChain: 'ethereum',
          toChain: 'polygon',
          token: 'ETH',
          amount: '100',
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      },
      {
        description: '不支持的目标链',
        params: {
          fromChain: 'solana',
          toChain: 'bitcoin',
          token: 'SOL',
          amount: '100',
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      },
      {
        description: '不支持的代币',
        params: {
          fromChain: 'solana',
          toChain: 'ethereum',
          token: 'BTC',
          amount: '100',
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      },
      {
        description: '无效的金额',
        params: {
          fromChain: 'solana',
          toChain: 'ethereum',
          token: 'SOL',
          amount: '-100',
          recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        }
      }
    ];

    for (const testCase of testCases) {
      const validation = this.bridgeService.validateBridgeParams(testCase.params);
      
      console.log(`${testCase.description}:`);
      if (validation.isValid) {
        console.log('  ✅ 验证通过');
      } else {
        console.log('  ❌ 验证失败:');
        validation.errors.forEach(error => {
          console.log(`    - ${error}`);
        });
      }
      console.log('');
    }
  }

  /**
   * 演示跨链路径分析
   */
  private async demonstratePathAnalysis(): Promise<void> {
    console.log('🛤️ === 跨链路径分析 ===');
    
    const testPaths = [
      { from: 'solana', to: 'ethereum' },
      { from: 'solana', to: 'polygon' },
      { from: 'solana', to: 'arbitrum' }
    ];

    for (const path of testPaths) {
      const bridgePath = this.bridgeService.getBridgePath(path.from, path.to);
      
      if (bridgePath.length > 0) {
        console.log(`${path.from} -> ${path.to} 跨链路径:`);
        bridgePath.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step.chain}`);
          console.log(`     预计时间: ${step.estimatedTime}`);
          console.log(`     费用: ${step.fee}`);
        });
        console.log('');
      } else {
        console.log(`❌ ${path.from} -> ${path.to}: 不支持的路径\n`);
      }
    }
  }

  /**
   * 显示桥接统计信息
   */
  private async showBridgeStats(): Promise<void> {
    console.log('📊 === 桥接统计信息 ===');
    
    const stats = this.bridgeService.getBridgeStats();
    
    console.log(`总交易数: ${stats.totalTransactions.toLocaleString()}`);
    console.log(`成功率: ${stats.successRate}%`);
    console.log(`平均完成时间: ${stats.averageTime} 分钟`);
    console.log(`支持的链数: ${stats.supportedChains}`);
    console.log(`支持的代币数: ${stats.supportedTokens}\n`);
  }

  /**
   * 模拟跨链操作
   */
  private async simulateCrossChainTransfer(): Promise<void> {
    console.log('🔄 === 跨链操作模拟 ===');
    
    const testParams: BridgeParams = {
      fromChain: 'solana',
      toChain: 'ethereum',
      token: 'SOL',
      amount: '100',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    const config: SVMToEVMBridgeConfig = {
      solanaTokenMint: 'So11111111111111111111111111111111111111112',
      evmTokenContract: '0x0000000000000000000000000000000000000000'
    };

    try {
      console.log('开始模拟跨链操作...');
      console.log(`从: ${testParams.fromChain} (${testParams.token})`);
      console.log(`到: ${testParams.toChain}`);
      console.log(`金额: ${testParams.amount}`);
      console.log(`接收地址: ${testParams.recipient}`);
      
      // 模拟私钥（实际使用时应该是真实的私钥）
      const mockPrivateKey = '0x' + '1'.repeat(64);
      
      const result = await this.bridgeService.bridge(testParams, mockPrivateKey, config);
      
      console.log(`✅ 跨链交易已提交!`);
      console.log(`交易哈希: ${result.hash}`);
      console.log(`状态: ${result.status}`);
      
      // 模拟查询状态
      console.log('\n查询交易状态...');
      const status = await this.bridgeService.getTransactionStatus(result.hash);
      
      console.log(`源交易哈希: ${status.sourceTxHash}`);
      console.log(`目标交易哈希: ${status.destinationTxHash || '待确认'}`);
      console.log(`状态: ${status.status}`);
      console.log(`确认数: ${status.confirmations}/${status.requiredConfirmations}`);
      
      if (status.estimatedCompletion) {
        const estimatedTime = new Date(status.estimatedCompletion);
        console.log(`预计完成时间: ${estimatedTime.toLocaleString()}`);
      }
      
    } catch (error) {
      console.error(`❌ 跨链操作失败: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('');
  }

  /**
   * 显示使用说明
   */
  showUsageInstructions(): void {
    console.log('📖 === 使用说明 ===');
    console.log('1. 确保你有足够的SOL余额支付跨链费用');
    console.log('2. 确保目标EVM链上有足够的ETH支付Gas费用');
    console.log('3. 跨链完成后，代币会在目标链上可用');
    console.log('4. 可以使用getTransactionStatus查询跨链状态');
    console.log('5. 支持从Solana跨链到所有主流EVM链\n');
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  const demo = new LayerZeroSVMEVMDemo();
  demo.runDemo().catch(console.error);
} 