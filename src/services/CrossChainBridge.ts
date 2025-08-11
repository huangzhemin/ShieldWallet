import { ChainConfig, BridgeParams, TransactionResult, LayerZeroConfig, LayerZeroChainConfig, LayerZeroMessage, LayerZeroFee, SVMToEVMBridgeConfig } from '../types/chain';
import { MultiChainWalletManager } from './MultiChainWalletManager';

/**
 * 跨链桥接协议接口
 */
export interface BridgeProtocol {
  name: string;
  supportedChains: string[];
  supportedTokens: { [chainId: string]: string[] };
  estimateFee(params: BridgeParams): Promise<string>;
  bridge(params: BridgeParams, privateKey: string): Promise<TransactionResult>;
  getTransactionStatus(txHash: string, fromChain: string): Promise<any>;
  supportsSVMToEVM?: boolean;
  supportsEVMToSVM?: boolean;
}

/**
 * LayerZero 桥接协议实现
 */
export class LayerZeroBridge implements BridgeProtocol {
  name = 'LayerZero';
  supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'solana'];
  supportedTokens = {
    ethereum: ['USDC', 'USDT', 'ETH'],
    polygon: ['USDC', 'USDT', 'MATIC'],
    arbitrum: ['USDC', 'USDT', 'ETH'],
    optimism: ['USDC', 'USDT', 'ETH'],
    bsc: ['USDC', 'USDT', 'BNB'],
    solana: ['SOL', 'USDC', 'USDT']
  };
  supportsSVMToEVM = true;
  supportsEVMToSVM = true;

  // LayerZero链配置
  private layerZeroConfigs: LayerZeroChainConfig = {
    'ethereum': {
      endpointId: 101,
      contractAddress: '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
      gasLimit: '200000',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    },
    'polygon': {
      endpointId: 109,
      contractAddress: '0x3c2269811836af69497E5F486A85D7316753cf62',
      gasLimit: '200000',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    },
    'arbitrum': {
      endpointId: 110,
      contractAddress: '0x3c2269811836af69497E5F486A85D7316753cf62',
      gasLimit: '200000',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    },
    'optimism': {
      endpointId: 111,
      contractAddress: '0x3c2269811836af69497E5F486A85D7316753cf62',
      gasLimit: '200000',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    },
    'bsc': {
      endpointId: 102,
      contractAddress: '0x3c2269811836af69497E5F486A85D7316753cf62',
      gasLimit: '200000',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    },
    'solana': {
      endpointId: 108,
      contractAddress: 'LZ1oo3Rjv0vB9M7ahsVUCg43C6mChZLM1ovM6Q81Qwz',
      gasLimit: '0',
      adapterParams: '0x000100000000000000000000000000000000000000000000000000000000000000'
    }
  };

  async estimateFee(params: BridgeParams): Promise<string> {
    try {
      const fromConfig = this.layerZeroConfigs[params.fromChain];
      const toConfig = this.layerZeroConfigs[params.toChain];
      
      if (!fromConfig || !toConfig) {
        throw new Error(`不支持的链: ${params.fromChain} -> ${params.toChain}`);
      }

      // 基础费用计算
      let baseFee = 0.001; // 基础费用 0.001 ETH
      
      // 根据代币类型调整费用
      if (params.token === 'USDC' || params.token === 'USDT') {
        baseFee = 0.0005; // 稳定币费用较低
      } else if (params.token === 'ETH' || params.token === 'SOL') {
        baseFee = 0.002; // 原生代币费用较高
      }

      // 根据金额调整费用
      const amount = parseFloat(params.amount);
      if (amount > 10000) {
        baseFee *= 1.5; // 大额转账费用增加
      } else if (amount < 100) {
        baseFee *= 0.8; // 小额转账费用减少
      }

      // 跨链距离费用（SVM到EVM费用较高）
      if (params.fromChain === 'solana' && params.toChain !== 'solana') {
        baseFee *= 1.3; // SVM到EVM额外费用
      }

      return baseFee.toFixed(6);
    } catch (error) {
      console.error('LayerZero费用估算失败:', error);
      return '0.001'; // 默认费用
    }
  }

  async bridge(params: BridgeParams, privateKey: string): Promise<TransactionResult> {
    try {
      const fromConfig = this.layerZeroConfigs[params.fromChain];
      const toConfig = this.layerZeroConfigs[params.toChain];
      
      if (!fromConfig || !toConfig) {
        throw new Error(`不支持的链: ${params.fromChain} -> ${params.toChain}`);
      }

      // 构建LayerZero消息
      const message: LayerZeroMessage = {
        dstChainId: toConfig.endpointId,
        recipient: params.recipient,
        payload: this.buildPayload(params),
        refundAddress: params.recipient,
        zroPaymentAddress: '0x0000000000000000000000000000000000000000',
        adapterParams: fromConfig.adapterParams
      };

      // 如果是SVM到EVM，需要特殊处理
      if (params.fromChain === 'solana') {
        return await this.executeSVMToEVMBridge(params, message, privateKey);
      } else {
        return await this.executeEVMToEVMBridge(params, message, privateKey);
      }
    } catch (error) {
      console.error('LayerZero跨链失败:', error);
      throw new Error(`LayerZero跨链失败: ${error.message}`);
    }
  }

  private async executeSVMToEVMBridge(
    params: BridgeParams, 
    message: LayerZeroMessage, 
    privateKey: string
  ): Promise<TransactionResult> {
    // 对于SVM到EVM，我们需要使用Wormhole作为中间层
    // 因为LayerZero主要支持EVM链
    
    // 这里我们模拟一个成功的交易
    // 在实际实现中，需要调用Solana的LayerZero合约
    const mockHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      hash: mockHash,
      status: 'pending',
      success: true
    };
  }

  private async executeEVMToEVMBridge(
    params: BridgeParams, 
    message: LayerZeroMessage, 
    privateKey: string
  ): Promise<TransactionResult> {
    // EVM到EVM的跨链，直接使用LayerZero合约
    const mockHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      hash: mockHash,
      status: 'pending',
      success: true
    };
  }

  private buildPayload(params: BridgeParams): string {
    // 构建LayerZero消息的payload
    // 这里简化处理，实际应该包含代币信息和金额
    const payload = {
      token: params.token,
      amount: params.amount,
      recipient: params.recipient,
      timestamp: Date.now()
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('hex');
  }

  async getTransactionStatus(txHash: string, fromChain: string): Promise<any> {
    try {
      // 模拟查询交易状态
      // 在实际实现中，需要调用LayerZero的API
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        hash: txHash,
        status: randomStatus,
        confirmations: Math.floor(Math.random() * 12),
        requiredConfirmations: 12,
        estimatedCompletion: Date.now() + Math.random() * 300000 // 5分钟内
      };
    } catch (error) {
      console.error('查询LayerZero交易状态失败:', error);
      return {
        hash: txHash,
        status: 'unknown',
        error: error.message
      };
    }
  }

  // 获取支持的SVM到EVM路径
  getSVMToEVMPaths(): Array<{from: string, to: string, estimatedTime: string}> {
    return [
      { from: 'solana', to: 'ethereum', estimatedTime: '2-5分钟' },
      { from: 'solana', to: 'polygon', estimatedTime: '2-5分钟' },
      { from: 'solana', to: 'arbitrum', estimatedTime: '2-5分钟' },
      { from: 'solana', to: 'optimism', estimatedTime: '2-5分钟' },
      { from: 'solana', to: 'bsc', estimatedTime: '2-5分钟' }
    ];
  }

  // 获取LayerZero配置
  getLayerZeroConfig(chainId: string): LayerZeroConfig | null {
    return this.layerZeroConfigs[chainId] || null;
  }
}

/**
 * Stargate 桥接协议实现
 */
export class StargateBridge implements BridgeProtocol {
  name = 'Stargate';
  supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'];
  supportedTokens = {
    ethereum: ['USDC', 'USDT', 'ETH'],
    polygon: ['USDC', 'USDT'],
    arbitrum: ['USDC', 'USDT', 'ETH'],
    optimism: ['USDC', 'ETH'],
    bsc: ['USDT']
  };

  async estimateFee(params: BridgeParams): Promise<string> {
    // Stargate费用估算
    const baseFee = 0.002; // ETH
    return baseFee.toString();
  }

  async bridge(params: BridgeParams, privateKey: string): Promise<TransactionResult> {
    // Stargate跨链桥接逻辑
    throw new Error('Stargate bridge implementation needed');
  }

  async getTransactionStatus(txHash: string, fromChain: string): Promise<any> {
    // 查询Stargate交易状态
    throw new Error('Stargate status check implementation needed');
  }
}

/**
 * Wormhole 桥接协议实现
 */
export class WormholeBridge implements BridgeProtocol {
  name = 'Wormhole';
  supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'solana', 'aptos'];
  supportedTokens = {
    ethereum: ['ETH', 'USDC', 'USDT'],
    polygon: ['MATIC', 'USDC'],
    arbitrum: ['ETH', 'USDC'],
    optimism: ['ETH', 'USDC'],
    bsc: ['BNB', 'USDT'],
    solana: ['SOL', 'USDC'],
    aptos: ['APT']
  };

  async estimateFee(params: BridgeParams): Promise<string> {
    // Wormhole费用估算
    const baseFee = 0.003; // ETH equivalent
    return baseFee.toString();
  }

  async bridge(params: BridgeParams, privateKey: string): Promise<TransactionResult> {
    // Wormhole跨链桥接逻辑
    throw new Error('Wormhole bridge implementation needed');
  }

  async getTransactionStatus(txHash: string, fromChain: string): Promise<any> {
    // 查询Wormhole交易状态
    throw new Error('Wormhole status check implementation needed');
  }
}

/**
 * 跨链桥接服务
 */
export class CrossChainBridgeService {
  private bridges: Map<string, BridgeProtocol> = new Map();
  private walletManager: MultiChainWalletManager;

  constructor(walletManager: MultiChainWalletManager) {
    this.walletManager = walletManager;
    this.initializeBridges();
  }

  /**
   * 初始化桥接协议
   */
  private initializeBridges(): void {
    const layerZero = new LayerZeroBridge();
    const stargate = new StargateBridge();
    const wormhole = new WormholeBridge();

    this.bridges.set('layerzero', layerZero);
    this.bridges.set('stargate', stargate);
    this.bridges.set('wormhole', wormhole);
  }

  /**
   * 获取支持的桥接协议
   */
  getSupportedBridges(): string[] {
    return Array.from(this.bridges.keys());
  }

  /**
   * 获取桥接协议
   */
  getBridge(bridgeName: string): BridgeProtocol {
    const bridge = this.bridges.get(bridgeName);
    if (!bridge) {
      throw new Error(`不支持的桥接协议: ${bridgeName}`);
    }
    return bridge;
  }

  /**
   * 获取可用的桥接路径
   */
  getAvailableBridges(fromChain: string, toChain: string, token: string): BridgeProtocol[] {
    const availableBridges: BridgeProtocol[] = [];

    for (const bridge of this.bridges.values()) {
      const supportsFromChain = bridge.supportedChains.includes(fromChain);
      const supportsToChain = bridge.supportedChains.includes(toChain);
      const supportsToken = bridge.supportedTokens[fromChain]?.includes(token) &&
                           bridge.supportedTokens[toChain]?.includes(token);

      if (supportsFromChain && supportsToChain && supportsToken) {
        availableBridges.push(bridge);
      }
    }

    return availableBridges;
  }

  /**
   * 估算跨链费用
   */
  async estimateBridgeFees(params: BridgeParams): Promise<{ [bridgeName: string]: string }> {
    const availableBridges = this.getAvailableBridges(params.fromChain, params.toChain, params.token);
    const fees: { [bridgeName: string]: string } = {};

    for (const bridge of availableBridges) {
      try {
        const fee = await bridge.estimateFee(params);
        fees[bridge.name] = fee;
      } catch (error) {
        console.error(`Failed to estimate fee for ${bridge.name}:`, error);
      }
    }

    return fees;
  }

  /**
   * 执行跨链桥接
   */
  async executeBridge(bridgeName: string, params: BridgeParams): Promise<TransactionResult> {
    const bridge = this.getBridge(bridgeName);
    const wallet = this.walletManager.getWallet(params.fromChain);

    if (!wallet) {
      throw new Error(`未找到${params.fromChain}链的钱包`);
    }

    // 验证桥接参数
    this.validateBridgeParams(bridge, params);

    return await bridge.bridge(params, wallet.privateKey);
  }

  /**
   * 验证桥接参数
   */
  private validateBridgeParams(bridge: BridgeProtocol, params: BridgeParams): void {
    if (!bridge.supportedChains.includes(params.fromChain)) {
      throw new Error(`${bridge.name}不支持源链: ${params.fromChain}`);
    }

    if (!bridge.supportedChains.includes(params.toChain)) {
      throw new Error(`${bridge.name}不支持目标链: ${params.toChain}`);
    }

    if (!bridge.supportedTokens[params.fromChain]?.includes(params.token)) {
      throw new Error(`${bridge.name}在${params.fromChain}上不支持代币: ${params.token}`);
    }

    if (!bridge.supportedTokens[params.toChain]?.includes(params.token)) {
      throw new Error(`${bridge.name}在${params.toChain}上不支持代币: ${params.token}`);
    }

    // 验证地址格式
    if (!this.walletManager.validateAddress(params.toChain, params.recipient)) {
      throw new Error(`无效的接收地址: ${params.recipient}`);
    }

    // 验证金额
    const amount = parseFloat(params.amount);
    if (amount <= 0) {
      throw new Error('转账金额必须大于0');
    }
  }

  /**
   * 获取跨链交易状态
   */
  async getBridgeTransactionStatus(bridgeName: string, txHash: string, fromChain: string): Promise<any> {
    const bridge = this.getBridge(bridgeName);
    return await bridge.getTransactionStatus(txHash, fromChain);
  }

  /**
   * 获取最优桥接方案
   */
  async getBestBridgeOption(params: BridgeParams): Promise<{
    bridge: BridgeProtocol;
    estimatedFee: string;
    estimatedTime: string;
  } | null> {
    const availableBridges = this.getAvailableBridges(params.fromChain, params.toChain, params.token);
    
    if (availableBridges.length === 0) {
      return null;
    }

    let bestOption: {
      bridge: BridgeProtocol;
      estimatedFee: string;
      estimatedTime: string;
    } | null = null;

    for (const bridge of availableBridges) {
      try {
        const fee = await bridge.estimateFee(params);
        const estimatedTime = this.getEstimatedBridgeTime(bridge.name, params.fromChain, params.toChain);
        
        if (!bestOption || parseFloat(fee) < parseFloat(bestOption.estimatedFee)) {
          bestOption = {
            bridge,
            estimatedFee: fee,
            estimatedTime
          };
        }
      } catch (error) {
        console.error(`Failed to get bridge option for ${bridge.name}:`, error);
      }
    }

    return bestOption;
  }

  /**
   * 获取预估桥接时间
   */
  private getEstimatedBridgeTime(bridgeName: string, fromChain: string, toChain: string): string {
    // 根据不同桥接协议和链组合返回预估时间
    const timeMap: { [key: string]: string } = {
      'layerzero': '1-3分钟',
      'stargate': '1-5分钟',
      'wormhole': '5-15分钟'
    };

    return timeMap[bridgeName] || '未知';
  }

  /**
   * 获取桥接历史记录
   */
  async getBridgeHistory(address: string, limit: number = 20): Promise<any[]> {
    // 这里可以集成各种桥接协议的历史记录API
    // 暂时返回空数组
    return [];
  }
}