import { ChainManager } from './ChainManager';
import { ChainType, TransactionParams } from '../types/chain';

/**
 * 跨链桥协议信息
 */
export interface BridgeProtocol {
  id: string;
  name: string;
  supportedChains: string[];
  fee: string;
  estimatedTime: string; // 预计完成时间
  maxAmount: string;
  minAmount: string;
}

/**
 * 跨链转账参数
 */
export interface BridgeParams {
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  recipient: string;
  bridgeProtocol?: string;
}

/**
 * 跨链转账报价
 */
export interface BridgeQuote {
  fromChain: string;
  toChain: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  estimatedTime: string;
  exchangeRate: string;
  bridgeProtocol: string;
}

/**
 * 跨链转账状态
 */
export interface BridgeStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromTxHash?: string;
  toTxHash?: string;
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  estimatedCompletion?: number;
}

/**
 * 跨链桥服务
 * 支持多种跨链协议和路径
 */
export class BridgeService {
  private chainManager: ChainManager;
  private bridgeProtocols: BridgeProtocol[] = [];
  private bridgeTransactions: Map<string, BridgeStatus> = new Map();

  constructor(chainManager: ChainManager) {
    this.chainManager = chainManager;
    this.initializeBridgeProtocols();
  }

  /**
   * 初始化跨链桥协议
   */
  private initializeBridgeProtocols(): void {
    this.bridgeProtocols = [
      {
        id: 'wormhole',
        name: 'Wormhole',
        supportedChains: ['ethereum', 'solana', 'polygon', 'arbitrum', 'aptos'],
        fee: '0.1',
        estimatedTime: '5-15分钟',
        maxAmount: '1000000',
        minAmount: '0.01'
      },
      {
        id: 'layerzero',
        name: 'LayerZero',
        supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
        fee: '0.05',
        estimatedTime: '2-10分钟',
        maxAmount: '500000',
        minAmount: '0.001'
      },
      {
        id: 'allbridge',
        name: 'Allbridge',
        supportedChains: ['ethereum', 'solana', 'polygon', 'aptos'],
        fee: '0.15',
        estimatedTime: '3-12分钟',
        maxAmount: '100000',
        minAmount: '0.1'
      },
      {
        id: 'portal',
        name: 'Portal (Wormhole)',
        supportedChains: ['ethereum', 'solana', 'polygon', 'arbitrum'],
        fee: '0.08',
        estimatedTime: '5-20分钟',
        maxAmount: '2000000',
        minAmount: '0.05'
      },
      {
        id: 'celer',
        name: 'Celer cBridge',
        supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
        fee: '0.03',
        estimatedTime: '1-5分钟',
        maxAmount: '1500000',
        minAmount: '0.01'
      }
    ];
  }

  /**
   * 获取支持的跨链桥协议
   */
  getSupportedBridges(fromChain?: string, toChain?: string): BridgeProtocol[] {
    if (!fromChain || !toChain) {
      return this.bridgeProtocols;
    }

    return this.bridgeProtocols.filter(bridge => 
      bridge.supportedChains.includes(fromChain) && 
      bridge.supportedChains.includes(toChain)
    );
  }

  /**
   * 获取跨链转账报价
   */
  async getBridgeQuote(params: BridgeParams): Promise<BridgeQuote[]> {
    const availableBridges = this.getSupportedBridges(params.fromChain, params.toChain);
    
    if (availableBridges.length === 0) {
      throw new Error(`不支持从${params.fromChain}到${params.toChain}的跨链转账`);
    }

    const quotes: BridgeQuote[] = [];

    for (const bridge of availableBridges) {
      try {
        const quote = await this.getBridgeQuoteForProtocol(params, bridge);
        quotes.push(quote);
      } catch (error: any) {
        console.warn(`获取${bridge.name}报价失败:`, error.message);
      }
    }

    // 按费用排序
    return quotes.sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
  }

  /**
   * 获取特定协议的跨链报价
   */
  private async getBridgeQuoteForProtocol(params: BridgeParams, bridge: BridgeProtocol): Promise<BridgeQuote> {
    // 模拟获取跨链报价
    const amount = parseFloat(params.amount);
    const feeAmount = amount * parseFloat(bridge.fee) / 100;
    const toAmount = amount - feeAmount;
    
    // 根据不同的跨链路径计算汇率
    let exchangeRate = '1.0';
    
    if (params.fromChain !== params.toChain) {
      // SVM -> EVM 或其他跨链路径可能有不同的汇率
      if (this.isSVMToEVM(params.fromChain, params.toChain)) {
        exchangeRate = '0.998'; // SVM到EVM可能有轻微损失
      } else if (this.isEVMToSVM(params.fromChain, params.toChain)) {
        exchangeRate = '0.997';
      } else {
        exchangeRate = '0.999'; // EVM到EVM之间
      }
    }

    return {
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromAmount: params.amount,
      toAmount: (toAmount * parseFloat(exchangeRate)).toString(),
      fee: feeAmount.toString(),
      estimatedTime: bridge.estimatedTime,
      exchangeRate,
      bridgeProtocol: bridge.id
    };
  }

  /**
   * 执行跨链转账
   */
  async executeBridge(
    params: BridgeParams,
    privateKey: string,
    quote: BridgeQuote
  ): Promise<string> {
    try {
      // 验证参数
      this.validateBridgeParams(params, quote);

      // 生成跨链转账ID
      const bridgeId = this.generateBridgeId();

      // 根据不同的跨链协议执行转账
      let fromTxHash: string;
      
      switch (quote.bridgeProtocol) {
        case 'wormhole':
          fromTxHash = await this.executeWormholeBridge(params, privateKey, quote);
          break;
        case 'layerzero':
          fromTxHash = await this.executeLayerZeroBridge(params, privateKey, quote);
          break;
        case 'allbridge':
          fromTxHash = await this.executeAllbridgeBridge(params, privateKey, quote);
          break;
        case 'portal':
          fromTxHash = await this.executePortalBridge(params, privateKey, quote);
          break;
        case 'celer':
          fromTxHash = await this.executeCelerBridge(params, privateKey, quote);
          break;
        default:
          throw new Error(`不支持的跨链协议: ${quote.bridgeProtocol}`);
      }

      // 记录跨链转账状态
      this.bridgeTransactions.set(bridgeId, {
        id: bridgeId,
        status: 'processing',
        fromTxHash,
        fromChain: params.fromChain,
        toChain: params.toChain,
        amount: params.amount,
        token: params.token,
        estimatedCompletion: Date.now() + this.parseEstimatedTime(quote.estimatedTime)
      });

      return bridgeId;
    } catch (error: any) {
      throw new Error(`执行跨链转账失败: ${error.message}`);
    }
  }

  /**
   * 执行Wormhole跨链转账
   */
  private async executeWormholeBridge(
    params: BridgeParams,
    privateKey: string,
    quote: BridgeQuote
  ): Promise<string> {
    const fromChainType = this.chainManager.getChainType(params.fromChain);
    
    if (fromChainType === ChainType.SOLANA) {
      return this.executeWormholeSolana(params, privateKey);
    } else if (fromChainType === ChainType.EVM) {
      return this.executeWormholeEVM(params, privateKey);
    } else {
      throw new Error(`Wormhole不支持的链类型: ${fromChainType}`);
    }
  }

  /**
   * 执行Wormhole Solana端转账
   */
  private async executeWormholeSolana(params: BridgeParams, privateKey: string): Promise<string> {
    // 这里应该调用Wormhole Solana SDK
    // 为了演示，构建一个模拟交易
    const txParams: TransactionParams = {
      to: '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5', // Wormhole Solana合约
      value: params.amount,
      data: this.buildWormholeSolanaData(params)
    };

    const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
    return result.hash;
  }

  /**
   * 执行Wormhole EVM端转账
   */
  private async executeWormholeEVM(params: BridgeParams, privateKey: string): Promise<string> {
    // 这里应该调用Wormhole EVM SDK
    const wormholeContracts: { [key: string]: string } = {
      'ethereum': '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
      'polygon': '0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7',
      'arbitrum': '0xa5f208e072434bC67592E4C49C1B991BA79BCA46'
    };

    const contractAddress = wormholeContracts[params.fromChain];
    if (!contractAddress) {
      throw new Error(`不支持的Wormhole EVM链: ${params.fromChain}`);
    }

    const txParams: TransactionParams = {
      to: contractAddress,
      value: params.token === 'ETH' ? params.amount : '0',
      data: this.buildWormholeEVMData(params)
    };

    const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
    return result.hash;
  }

  /**
   * 执行LayerZero跨链转账
   */
  private async executeLayerZeroBridge(
    params: BridgeParams,
    privateKey: string,
    quote: BridgeQuote
  ): Promise<string> {
    // LayerZero主要支持EVM链
    const layerZeroContracts: { [key: string]: string } = {
      'ethereum': '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
      'polygon': '0x3c2269811836af69497E5F486A85D7316753cf62',
      'arbitrum': '0x3c2269811836af69497E5F486A85D7316753cf62'
    };

    const contractAddress = layerZeroContracts[params.fromChain];
    if (!contractAddress) {
      throw new Error(`不支持的LayerZero链: ${params.fromChain}`);
    }

    const txParams: TransactionParams = {
      to: contractAddress,
      value: params.token === 'ETH' ? params.amount : '0',
      data: this.buildLayerZeroData(params)
    };

    const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
    return result.hash;
  }

  /**
   * 执行其他跨链协议（简化实现）
   */
  private async executeAllbridgeBridge(params: BridgeParams, privateKey: string, quote: BridgeQuote): Promise<string> {
    return this.executeGenericBridge(params, privateKey, 'allbridge');
  }

  private async executePortalBridge(params: BridgeParams, privateKey: string, quote: BridgeQuote): Promise<string> {
    return this.executeGenericBridge(params, privateKey, 'portal');
  }

  private async executeCelerBridge(params: BridgeParams, privateKey: string, quote: BridgeQuote): Promise<string> {
    return this.executeGenericBridge(params, privateKey, 'celer');
  }

  /**
   * 通用跨链执行方法
   */
  private async executeGenericBridge(params: BridgeParams, privateKey: string, protocol: string): Promise<string> {
    // 这里应该根据具体协议实现
    // 为了演示，返回模拟交易哈希
    const mockContracts: { [key: string]: { [chain: string]: string } } = {
      'allbridge': {
        'ethereum': '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        'solana': 'A11bridge11111111111111111111111111111111111',
        'polygon': '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
      },
      'portal': {
        'ethereum': '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
        'solana': 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
        'polygon': '0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7'
      },
      'celer': {
        'ethereum': '0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820',
        'polygon': '0x88DCDC47D2f83a99CF0000FDF667A468bB958a78',
        'arbitrum': '0x1619DE6B6B20eD217a58d00f37B9d47C7663feca'
      }
    };

    const contractAddress = mockContracts[protocol]?.[params.fromChain];
    if (!contractAddress) {
      throw new Error(`${protocol}不支持链: ${params.fromChain}`);
    }

    const txParams: TransactionParams = {
      to: contractAddress,
      value: params.token === 'ETH' || params.token === 'SOL' ? params.amount : '0',
      data: '0x' // 简化的数据
    };

    const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
    return result.hash;
  }

  /**
   * 获取跨链转账状态
   */
  getBridgeStatus(bridgeId: string): BridgeStatus | null {
    return this.bridgeTransactions.get(bridgeId) || null;
  }

  /**
   * 更新跨链转账状态
   */
  updateBridgeStatus(bridgeId: string, status: Partial<BridgeStatus>): void {
    const currentStatus = this.bridgeTransactions.get(bridgeId);
    if (currentStatus) {
      this.bridgeTransactions.set(bridgeId, { ...currentStatus, ...status });
    }
  }

  /**
   * 获取所有跨链转账记录
   */
  getAllBridgeTransactions(): BridgeStatus[] {
    return Array.from(this.bridgeTransactions.values());
  }

  /**
   * 验证跨链参数
   */
  private validateBridgeParams(params: BridgeParams, quote: BridgeQuote): void {
    const amount = parseFloat(params.amount);
    const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
    
    if (!bridge) {
      throw new Error('无效的跨链协议');
    }

    if (amount < parseFloat(bridge.minAmount)) {
      throw new Error(`转账金额不能小于${bridge.minAmount}`);
    }

    if (amount > parseFloat(bridge.maxAmount)) {
      throw new Error(`转账金额不能大于${bridge.maxAmount}`);
    }

    if (!this.chainManager.validateAddress(params.recipient, params.toChain)) {
      throw new Error('无效的接收地址');
    }
  }

  /**
   * 生成跨链转账ID
   */
  private generateBridgeId(): string {
    return 'bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 解析预计时间为毫秒
   */
  private parseEstimatedTime(timeStr: string): number {
    // 简化解析，假设格式为 "5-15分钟"
    const match = timeStr.match(/(\d+)-(\d+)分钟/);
    if (match) {
      const avgMinutes = (parseInt(match[1]) + parseInt(match[2])) / 2;
      return avgMinutes * 60 * 1000; // 转换为毫秒
    }
    return 10 * 60 * 1000; // 默认10分钟
  }

  /**
   * 检查是否为SVM到EVM的跨链
   */
  private isSVMToEVM(fromChain: string, toChain: string): boolean {
    const svmChains = ['solana'];
    const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
    return svmChains.includes(fromChain) && evmChains.includes(toChain);
  }

  /**
   * 检查是否为EVM到SVM的跨链
   */
  private isEVMToSVM(fromChain: string, toChain: string): boolean {
    const svmChains = ['solana'];
    const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
    return evmChains.includes(fromChain) && svmChains.includes(toChain);
  }

  /**
   * 构建Wormhole Solana交易数据
   */
  private buildWormholeSolanaData(params: BridgeParams): string {
    // 这里应该构建实际的Wormhole Solana指令数据
    return '';
  }

  /**
   * 构建Wormhole EVM交易数据
   */
  private buildWormholeEVMData(params: BridgeParams): string {
    // 这里应该构建实际的Wormhole EVM合约调用数据
    return '0x';
  }

  /**
   * 构建LayerZero交易数据
   */
  private buildLayerZeroData(params: BridgeParams): string {
    // 这里应该构建实际的LayerZero合约调用数据
    return '0x';
  }
}