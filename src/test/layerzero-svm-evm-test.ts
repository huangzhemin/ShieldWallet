import { LayerZeroSVMBridgeService } from '../services/LayerZeroSVMBridgeService';
import { BridgeParams, SVMToEVMBridgeConfig } from '../types/chain';

/**
 * LayerZero SVM到EVM跨链功能测试
 */
export class LayerZeroSVMEVMTest {
  private bridgeService: LayerZeroSVMBridgeService;

  constructor() {
    this.bridgeService = new LayerZeroSVMBridgeService();
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 === LayerZero SVM到EVM跨链功能测试 ===\n');

    const tests = [
      { name: '支持路径测试', test: () => this.testSupportedPaths() },
      { name: '费用估算测试', test: () => this.testFeeEstimation() },
      { name: '参数验证测试', test: () => this.testParameterValidation() },
      { name: '跨链路径测试', test: () => this.testBridgePaths() },
      { name: '统计信息测试', test: () => this.testBridgeStats() }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      try {
        console.log(`📋 运行测试: ${test.name}`);
        await test.test();
        console.log(`✅ ${test.name} 通过\n`);
        passedTests++;
      } catch (error) {
        console.error(`❌ ${test.name} 失败: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }

    console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('⚠️ 部分测试失败，请检查实现');
    }
  }

  /**
   * 测试支持的跨链路径
   */
  private async testSupportedPaths(): Promise<void> {
    // 测试支持的EVM链
    const supportedChains = this.bridgeService.getSupportedEVMChains();
    if (supportedChains.length === 0) {
      throw new Error('没有找到支持的EVM链');
    }
    console.log(`  - 支持 ${supportedChains.length} 个EVM链`);

    // 测试支持的代币
    const supportedTokens = this.bridgeService.getSupportedTokens();
    if (supportedTokens.length === 0) {
      throw new Error('没有找到支持的代币');
    }
    console.log(`  - 支持 ${supportedTokens.length} 种代币`);

    // 测试跨链组合
    let validCombinations = 0;
    for (const token of supportedTokens) {
      for (const chain of supportedChains) {
        if (this.bridgeService.isSupported('solana', chain, token)) {
          validCombinations++;
        }
      }
    }
    
    if (validCombinations === 0) {
      throw new Error('没有找到有效的跨链组合');
    }
    console.log(`  - 支持 ${validCombinations} 种跨链组合`);
  }

  /**
   * 测试费用估算
   */
  private async testFeeEstimation(): Promise<void> {
    const testCases = [
      { token: 'SOL', amount: '100', toChain: 'ethereum' },
      { token: 'USDC', amount: '1000', toChain: 'polygon' },
      { token: 'USDT', amount: '500', toChain: 'arbitrum' }
    ];

    for (const testCase of testCases) {
      const params: BridgeParams = {
        fromChain: 'solana',
        toChain: testCase.toChain,
        token: testCase.token,
        amount: testCase.amount,
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      };

      const fee = await this.bridgeService.estimateFee(params);
      
      // 验证费用结构
      if (!fee.nativeFee || !fee.zroFee || !fee.totalFee) {
        throw new Error(`费用结构不完整: ${JSON.stringify(fee)}`);
      }

      // 验证费用合理性
      const nativeFee = parseFloat(fee.nativeFee);
      if (nativeFee <= 0 || nativeFee > 1) {
        throw new Error(`原生费用不合理: ${fee.nativeFee}`);
      }

      console.log(`  - ${testCase.token} -> ${testCase.toChain}: ${fee.totalFee} ETH`);
    }
  }

  /**
   * 测试参数验证
   */
  private async testParameterValidation(): Promise<void> {
    // 测试有效参数
    const validParams: BridgeParams = {
      fromChain: 'solana',
      toChain: 'ethereum',
      token: 'SOL',
      amount: '100',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    const validResult = this.bridgeService.validateBridgeParams(validParams);
    if (!validResult.isValid) {
      throw new Error(`有效参数验证失败: ${validResult.errors.join(', ')}`);
    }
    console.log('  - 有效参数验证通过');

    // 测试无效参数
    const invalidParams: BridgeParams = {
      fromChain: 'ethereum', // 错误的源链
      toChain: 'polygon',
      token: 'ETH',
      amount: '100',
      recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    };

    const invalidResult = this.bridgeService.validateBridgeParams(invalidParams);
    if (invalidResult.isValid) {
      throw new Error('无效参数验证应该失败');
    }
    console.log('  - 无效参数验证通过');
  }

  /**
   * 测试跨链路径
   */
  private async testBridgePaths(): Promise<void> {
    const testPaths = [
      { from: 'solana', to: 'ethereum' },
      { from: 'solana', to: 'polygon' },
      { from: 'solana', to: 'arbitrum' }
    ];

    for (const path of testPaths) {
      const bridgePath = this.bridgeService.getBridgePath(path.from, path.to);
      
      if (bridgePath.length === 0) {
        throw new Error(`${path.from} -> ${path.to} 路径为空`);
      }

      // 验证路径结构
      for (const step of bridgePath) {
        if (!step.chain || !step.estimatedTime || !step.fee) {
          throw new Error(`路径步骤结构不完整: ${JSON.stringify(step)}`);
        }
      }

      console.log(`  - ${path.from} -> ${path.to}: ${bridgePath.length} 步`);
    }
  }

  /**
   * 测试统计信息
   */
  private async testBridgeStats(): Promise<void> {
    const stats = this.bridgeService.getBridgeStats();
    
    // 验证统计信息结构
    if (typeof stats.totalTransactions !== 'number' || 
        typeof stats.successRate !== 'number' ||
        typeof stats.averageTime !== 'number' ||
        typeof stats.supportedChains !== 'number' ||
        typeof stats.supportedTokens !== 'number') {
      throw new Error('统计信息结构不完整');
    }

    // 验证统计信息合理性
    if (stats.totalTransactions < 0) {
      throw new Error('总交易数不能为负数');
    }

    if (stats.successRate < 0 || stats.successRate > 100) {
      throw new Error('成功率必须在0-100之间');
    }

    if (stats.averageTime < 0) {
      throw new Error('平均时间不能为负数');
    }

    if (stats.supportedChains < 1) {
      throw new Error('支持的链数至少为1');
    }

    if (stats.supportedTokens < 1) {
      throw new Error('支持的代币数至少为1');
    }

    console.log(`  - 总交易数: ${stats.totalTransactions}`);
    console.log(`  - 成功率: ${stats.successRate}%`);
    console.log(`  - 平均时间: ${stats.averageTime} 分钟`);
    console.log(`  - 支持链数: ${stats.supportedChains}`);
    console.log(`  - 支持代币数: ${stats.supportedTokens}`);
  }

  /**
   * 性能测试
   */
  async performanceTest(): Promise<void> {
    console.log('\n⚡ === 性能测试 ===');
    
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const params: BridgeParams = {
        fromChain: 'solana',
        toChain: 'ethereum',
        token: 'SOL',
        amount: '100',
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      };

      await this.bridgeService.estimateFee(params);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`  - 执行 ${iterations} 次费用估算`);
    console.log(`  - 总时间: ${totalTime}ms`);
    console.log(`  - 平均时间: ${avgTime.toFixed(2)}ms`);
    console.log(`  - 每秒处理: ${(1000 / avgTime).toFixed(2)} 次`);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  const test = new LayerZeroSVMEVMTest();
  
  // 运行功能测试
  test.runAllTests().then(() => {
    // 运行性能测试
    return test.performanceTest();
  }).catch(console.error);
} 