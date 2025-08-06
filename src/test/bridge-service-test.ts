/**
 * BridgeService 功能测试
 * 验证扩展后的跨链桥服务功能
 */

import { BridgeService, BridgeParams, FeeOptimizationOptions } from '../services/BridgeService';
import { ChainType } from '../types/chain';
import { PriceService } from '../services/PriceService';

/**
 * 测试 BridgeService 的基本功能
 */
export class BridgeServiceTest {
  private bridgeService: BridgeService;
  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
    // 使用模拟的 ChainManager 和 GasService
    this.bridgeService = new BridgeService(
      null as any, // ChainManager 模拟
      this.priceService,
      null as any  // GasService 模拟
    );
  }

  /**
   * 测试获取支持的跨链桥
   */
  async testGetSupportedBridges(): Promise<void> {
    console.log('=== 测试获取支持的跨链桥 ===');
    
    try {
      const bridges = await this.bridgeService.getSupportedBridges(
        ChainType.SOLANA,
        ChainType.EVM
      );
      
      console.log('支持的跨链桥:', bridges.map(b => b.name));
      console.log('SVM到EVM支持:', bridges.filter(b => b.supportsSVMToEVM));
    } catch (error) {
      console.error('获取支持的跨链桥失败:', error);
    }
  }

  /**
   * 测试获取跨链报价
   */
  async testGetBridgeQuote(): Promise<void> {
    console.log('\n=== 测试获取跨链报价 ===');
    
    try {
      const params: BridgeParams = {
        fromChain: ChainType.SOLANA,
        toChain: ChainType.EVM,
        token: 'SOL',
        amount: '1.0',
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db5c'
      };

      const quote = await this.bridgeService.getBridgeQuote(params);
      
      if (quote && quote.length > 0) {
        const firstQuote = quote[0];
        console.log('跨链报价:');
        console.log('- 协议:', firstQuote.bridgeProtocol);
        console.log('- 费用:', firstQuote.fee);
        console.log('- 预估时间:', firstQuote.estimatedTime, '分钟');
        console.log('- 汇率:', firstQuote.exchangeRate);
      } else {
        console.log('未找到可用的跨链报价');
      }
    } catch (error) {
      console.error('获取跨链报价失败:', error);
    }
  }

  /**
   * 测试增强的跨链报价（包含手续费优化）
   */
  async testGetEnhancedBridgeQuote(): Promise<void> {
    console.log('\n=== 测试增强的跨链报价 ===');
    
    try {
      const params: BridgeParams = {
        fromChain: ChainType.SOLANA,
        toChain: ChainType.EVM,
        token: 'USDC',
        amount: '1000.0',
        recipient: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db5c'
      };

      const options: FeeOptimizationOptions = {
        prioritizeSpeed: false,
        prioritizeCost: true,
        maxSlippage: 0.5
      };

      const enhancedQuote = await this.bridgeService.getEnhancedBridgeQuote(params, options);
      
      if (enhancedQuote && enhancedQuote.length > 0) {
        const firstQuote = enhancedQuote[0];
        console.log('增强跨链报价:');
        console.log('- 基础报价:', firstQuote.bridgeProtocol);
        console.log('- Gas费用:', firstQuote.gasCost);
        console.log('- 总费用:', firstQuote.totalCost);
        console.log('- 价格影响:', firstQuote.priceImpact + '%');
        console.log('- 流动性利用率:', firstQuote.liquidityUtilization + '%');
        console.log('- 置信度:', firstQuote.confidence + '%');
        console.log('- 路由:', firstQuote.route?.join(' -> '));
      } else {
        console.log('未找到增强的跨链报价');
      }
    } catch (error) {
      console.error('获取增强跨链报价失败:', error);
    }
  }

  /**
   * 测试SVM到EVM的跨链桥
   */
  async testGetSVMToEVMBridges(): Promise<void> {
    console.log('\n=== 测试SVM到EVM跨链桥 ===');
    
    try {
      const bridges = await this.bridgeService.getSVMToEVMBridges();
      
      console.log('SVM到EVM支持的跨链桥:');
      bridges.forEach(bridge => {
        console.log(`- ${bridge.name}: Gas优化=${bridge.gasOptimization}, 流动性深度=${bridge.liquidityDepth}`);
      });
    } catch (error) {
      console.error('获取SVM到EVM跨链桥失败:', error);
    }
  }

  /**
   * 测试EVM到SVM的跨链桥
   */
  async testGetEVMToSVMBridges(): Promise<void> {
    console.log('\n=== 测试EVM到SVM跨链桥 ===');
    
    try {
      const bridges = await this.bridgeService.getEVMToSVMBridges();
      
      console.log('EVM到SVM支持的跨链桥:');
      bridges.forEach(bridge => {
        console.log(`- ${bridge.name}: Gas优化=${bridge.gasOptimization}, 流动性深度=${bridge.liquidityDepth}`);
      });
    } catch (error) {
      console.error('获取EVM到SVM跨链桥失败:', error);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('开始 BridgeService 功能测试\n');
    
    await this.testGetSupportedBridges();
    await this.testGetBridgeQuote();
    await this.testGetEnhancedBridgeQuote();
    await this.testGetSVMToEVMBridges();
    await this.testGetEVMToSVMBridges();
    
    console.log('\n=== 测试完成 ===');
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const test = new BridgeServiceTest();
  test.runAllTests().catch(console.error);
}