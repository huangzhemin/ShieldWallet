import { ChainType, TransactionParams, TransactionResult } from '../types/chain';

/**
 * 交易状态枚举
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REPLACED = 'replaced'
}

/**
 * 交易类型枚举
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  CONTRACT_CALL = 'contract_call',
  TOKEN_TRANSFER = 'token_transfer',
  NFT_TRANSFER = 'nft_transfer',
  SWAP = 'swap',
  LIQUIDITY_ADD = 'liquidity_add',
  LIQUIDITY_REMOVE = 'liquidity_remove',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  BRIDGE = 'bridge'
}

/**
 * 交易优先级
 */
export enum TransactionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 交易记录接口
 */
export interface TransactionRecord {
  id: string;
  hash: string;
  chainType: ChainType;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  gasUsed?: string;
  nonce: number;
  status: TransactionStatus;
  type: TransactionType;
  priority: TransactionPriority;
  timestamp: string;
  blockNumber?: number;
  blockHash?: string;
  confirmations: number;
  data?: string;
  logs?: any[];
  error?: string;
  metadata?: {
    tokenSymbol?: string;
    tokenAddress?: string;
    tokenAmount?: string;
    nftTokenId?: string;
    contractAddress?: string;
    methodName?: string;
    swapDetails?: {
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      amountOut: string;
      slippage: number;
    };
  };
}

/**
 * 交易费用估算
 */
export interface TransactionFeeEstimate {
  gasLimit: string;
  gasPrice: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
  totalFee: {
    slow: string;
    standard: string;
    fast: string;
    instant: string;
  };
  estimatedTime: {
    slow: number; // 分钟
    standard: number;
    fast: number;
    instant: number;
  };
}

/**
 * 交易批处理接口
 */
export interface TransactionBatch {
  id: string;
  transactions: TransactionParams[];
  chainType: ChainType;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
  results: TransactionResult[];
}

/**
 * 交易过滤器
 */
export interface TransactionFilter {
  chainType?: ChainType;
  status?: TransactionStatus;
  type?: TransactionType;
  address?: string;
  fromDate?: string;
  toDate?: string;
  minValue?: string;
  maxValue?: string;
  tokenAddress?: string;
}

/**
 * 交易统计信息
 */
export interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalVolume: string;
  totalFees: string;
  averageGasPrice: string;
  averageConfirmationTime: number;
  chainBreakdown: { [chainType: string]: number };
  typeBreakdown: { [type: string]: number };
}

/**
 * 交易事件类型
 */
export enum TransactionEventType {
  TRANSACTION_SUBMITTED = 'transaction_submitted',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_REPLACED = 'transaction_replaced',
  BATCH_COMPLETED = 'batch_completed'
}

/**
 * 交易事件
 */
export interface TransactionEvent {
  type: TransactionEventType;
  transactionId: string;
  data: any;
  timestamp: string;
}

/**
 * 交易服务类
 */
export class TransactionService {
  private transactions: Map<string, TransactionRecord> = new Map();
  private batches: Map<string, TransactionBatch> = new Map();
  private eventListeners: Map<TransactionEventType, Function[]> = new Map();
  private pendingTransactions: Set<string> = new Set();
  private confirmationThreshold: number = 12; // 默认确认数

  constructor() {
    this.startTransactionMonitoring();
  }

  /**
   * 创建交易
   */
  async createTransaction(
    params: TransactionParams,
    type: TransactionType = TransactionType.TRANSFER,
    priority: TransactionPriority = TransactionPriority.MEDIUM,
    metadata?: any
  ): Promise<string> {
    const transactionId = this.generateTransactionId();
    
    const transaction: TransactionRecord = {
      id: transactionId,
      hash: '',
      chainType: params.chainType,
      from: params.from,
      to: params.to,
      value: params.value,
      gasLimit: params.gasLimit || '21000',
      gasPrice: params.gasPrice || '0',
      nonce: params.nonce || 0,
      status: TransactionStatus.PENDING,
      type,
      priority,
      timestamp: new Date().toISOString(),
      confirmations: 0,
      data: params.data,
      metadata
    };

    this.transactions.set(transactionId, transaction);
    this.pendingTransactions.add(transactionId);

    this.emitEvent(TransactionEventType.TRANSACTION_SUBMITTED, transactionId, {
      transaction
    });

    return transactionId;
  }

  /**
   * 更新交易状态
   */
  updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    hash?: string,
    blockNumber?: number,
    gasUsed?: string,
    error?: string
  ): boolean {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return false;
    }

    const previousStatus = transaction.status;
    transaction.status = status;
    
    if (hash) transaction.hash = hash;
    if (blockNumber) transaction.blockNumber = blockNumber;
    if (gasUsed) transaction.gasUsed = gasUsed;
    if (error) transaction.error = error;

    // 更新确认数
    if (status === TransactionStatus.CONFIRMED && blockNumber) {
      // 这里应该从区块链获取当前区块高度来计算确认数
      // 暂时设置为1
      transaction.confirmations = 1;
    }

    // 从待处理列表中移除已确认或失败的交易
    if (status === TransactionStatus.CONFIRMED || status === TransactionStatus.FAILED) {
      this.pendingTransactions.delete(transactionId);
    }

    // 触发相应事件
    if (previousStatus !== status) {
      if (status === TransactionStatus.CONFIRMED) {
        this.emitEvent(TransactionEventType.TRANSACTION_CONFIRMED, transactionId, {
          transaction,
          previousStatus
        });
      } else if (status === TransactionStatus.FAILED) {
        this.emitEvent(TransactionEventType.TRANSACTION_FAILED, transactionId, {
          transaction,
          error,
          previousStatus
        });
      }
    }

    return true;
  }

  /**
   * 获取交易记录
   */
  getTransaction(transactionId: string): TransactionRecord | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * 获取交易列表
   */
  getTransactions(
    filter?: TransactionFilter,
    limit: number = 100,
    offset: number = 0
  ): TransactionRecord[] {
    let transactions = Array.from(this.transactions.values());

    // 应用过滤器
    if (filter) {
      transactions = transactions.filter(tx => {
        if (filter.chainType && tx.chainType !== filter.chainType) return false;
        if (filter.status && tx.status !== filter.status) return false;
        if (filter.type && tx.type !== filter.type) return false;
        if (filter.address && tx.from !== filter.address && tx.to !== filter.address) return false;
        if (filter.fromDate && tx.timestamp < filter.fromDate) return false;
        if (filter.toDate && tx.timestamp > filter.toDate) return false;
        if (filter.minValue && parseFloat(tx.value) < parseFloat(filter.minValue)) return false;
        if (filter.maxValue && parseFloat(tx.value) > parseFloat(filter.maxValue)) return false;
        if (filter.tokenAddress && tx.metadata?.tokenAddress !== filter.tokenAddress) return false;
        return true;
      });
    }

    // 按时间戳降序排序
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 应用分页
    return transactions.slice(offset, offset + limit);
  }

  /**
   * 获取待处理交易
   */
  getPendingTransactions(): TransactionRecord[] {
    return Array.from(this.pendingTransactions)
      .map(id => this.transactions.get(id)!)
      .filter(tx => tx !== undefined);
  }

  /**
   * 估算交易费用
   */
  async estimateTransactionFee(
    params: TransactionParams
  ): Promise<TransactionFeeEstimate> {
    // 这里应该调用相应的链适配器来获取实际的Gas价格
    // 暂时返回模拟数据
    const baseGasPrice = 20000000000; // 20 Gwei
    const gasLimit = parseInt(params.gasLimit || '21000');

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: {
        slow: (baseGasPrice * 0.8).toString(),
        standard: baseGasPrice.toString(),
        fast: (baseGasPrice * 1.2).toString(),
        instant: (baseGasPrice * 1.5).toString()
      },
      totalFee: {
        slow: (gasLimit * baseGasPrice * 0.8).toString(),
        standard: (gasLimit * baseGasPrice).toString(),
        fast: (gasLimit * baseGasPrice * 1.2).toString(),
        instant: (gasLimit * baseGasPrice * 1.5).toString()
      },
      estimatedTime: {
        slow: 10,
        standard: 5,
        fast: 2,
        instant: 1
      }
    };
  }

  /**
   * 创建交易批处理
   */
  createTransactionBatch(
    transactions: TransactionParams[],
    chainType: ChainType
  ): string {
    const batchId = this.generateBatchId();
    
    const batch: TransactionBatch = {
      id: batchId,
      transactions,
      chainType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      results: []
    };

    this.batches.set(batchId, batch);
    return batchId;
  }

  /**
   * 执行交易批处理
   */
  async executeBatch(batchId: string): Promise<boolean> {
    const batch = this.batches.get(batchId);
    if (!batch || batch.status !== 'pending') {
      return false;
    }

    batch.status = 'executing';
    batch.executedAt = new Date().toISOString();

    try {
      // 这里应该调用相应的链适配器来执行批量交易
      // 暂时模拟执行过程
      for (const txParams of batch.transactions) {
        const transactionId = await this.createTransaction(
          txParams,
          TransactionType.TRANSFER,
          TransactionPriority.MEDIUM
        );
        
        // 模拟交易结果
        const result: TransactionResult = {
          success: true,
          hash: this.generateTransactionHash(),
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: '21000'
        };
        
        batch.results.push(result);
      }

      batch.status = 'completed';
      batch.completedAt = new Date().toISOString();

      this.emitEvent(TransactionEventType.BATCH_COMPLETED, batchId, {
        batch
      });

      return true;
    } catch (error: any) {
      batch.status = 'failed';
      console.error('批处理执行失败:', error);
      return false;
    }
  }

  /**
   * 获取交易批处理
   */
  getBatch(batchId: string): TransactionBatch | undefined {
    return this.batches.get(batchId);
  }

  /**
   * 取消交易
   */
  async cancelTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return false;
    }

    // 这里应该调用链适配器来取消交易
    // 通常是发送一个相同nonce但更高gas价格的空交易
    
    transaction.status = TransactionStatus.CANCELLED;
    this.pendingTransactions.delete(transactionId);
    
    return true;
  }

  /**
   * 加速交易
   */
  async speedUpTransaction(
    transactionId: string,
    newGasPrice: string
  ): Promise<string | null> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return null;
    }

    // 创建新的交易记录
    const newTransactionId = this.generateTransactionId();
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: newTransactionId,
      gasPrice: newGasPrice,
      timestamp: new Date().toISOString()
    };

    this.transactions.set(newTransactionId, newTransaction);
    this.pendingTransactions.add(newTransactionId);

    // 标记原交易为被替换
    transaction.status = TransactionStatus.REPLACED;
    this.pendingTransactions.delete(transactionId);

    this.emitEvent(TransactionEventType.TRANSACTION_REPLACED, transactionId, {
      originalTransaction: transaction,
      newTransaction,
      newTransactionId
    });

    return newTransactionId;
  }

  /**
   * 获取交易统计信息
   */
  getTransactionStats(filter?: TransactionFilter): TransactionStats {
    const transactions = this.getTransactions(filter, 10000, 0);
    
    const stats: TransactionStats = {
      totalTransactions: transactions.length,
      successfulTransactions: transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED).length,
      failedTransactions: transactions.filter(tx => tx.status === TransactionStatus.FAILED).length,
      pendingTransactions: transactions.filter(tx => tx.status === TransactionStatus.PENDING).length,
      totalVolume: '0',
      totalFees: '0',
      averageGasPrice: '0',
      averageConfirmationTime: 0,
      chainBreakdown: {},
      typeBreakdown: {}
    };

    let totalVolume = 0;
    let totalFees = 0;
    let totalGasPrice = 0;
    let totalConfirmationTime = 0;
    let confirmedCount = 0;

    transactions.forEach(tx => {
      // 计算总交易量
      totalVolume += parseFloat(tx.value);
      
      // 计算总手续费
      if (tx.gasUsed && tx.gasPrice) {
        totalFees += parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice);
      }
      
      // 计算平均Gas价格
      totalGasPrice += parseFloat(tx.gasPrice);
      
      // 计算平均确认时间（模拟）
      if (tx.status === TransactionStatus.CONFIRMED) {
        totalConfirmationTime += 300; // 假设平均5分钟
        confirmedCount++;
      }
      
      // 链类型分布
      stats.chainBreakdown[tx.chainType] = (stats.chainBreakdown[tx.chainType] || 0) + 1;
      
      // 交易类型分布
      stats.typeBreakdown[tx.type] = (stats.typeBreakdown[tx.type] || 0) + 1;
    });

    stats.totalVolume = totalVolume.toString();
    stats.totalFees = totalFees.toString();
    stats.averageGasPrice = transactions.length > 0 ? (totalGasPrice / transactions.length).toString() : '0';
    stats.averageConfirmationTime = confirmedCount > 0 ? totalConfirmationTime / confirmedCount : 0;

    return stats;
  }

  /**
   * 开始交易监控
   */
  private startTransactionMonitoring(): void {
    // 每30秒检查一次待处理交易的状态
    setInterval(() => {
      this.checkPendingTransactions();
    }, 30000);
  }

  /**
   * 检查待处理交易状态
   */
  private async checkPendingTransactions(): Promise<void> {
    for (const transactionId of this.pendingTransactions) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) continue;

      try {
        // 这里应该调用链适配器来检查交易状态
        // 暂时模拟状态检查
        const isOld = Date.now() - new Date(transaction.timestamp).getTime() > 300000; // 5分钟
        if (isOld && Math.random() > 0.5) {
          this.updateTransactionStatus(
            transactionId,
            TransactionStatus.CONFIRMED,
            this.generateTransactionHash(),
            Math.floor(Math.random() * 1000000),
            '21000'
          );
        }
      } catch (error: any) {
        console.error('检查交易状态失败:', error);
      }
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: TransactionEventType, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: TransactionEventType, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(eventType: TransactionEventType, transactionId: string, data: any): void {
    const event: TransactionEvent = {
      type: eventType,
      transactionId,
      data,
      timestamp: new Date().toISOString()
    };

    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('事件监听器执行失败:', error);
        }
      });
    }
  }

  /**
   * 生成交易ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成批处理ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成交易哈希
   */
  private generateTransactionHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  /**
   * 清除历史交易记录
   */
  clearHistory(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    let deletedCount = 0;
    for (const [id, transaction] of this.transactions) {
      if (transaction.timestamp < cutoffTimestamp && 
          transaction.status !== TransactionStatus.PENDING) {
        this.transactions.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 导出交易记录
   */
  exportTransactions(filter?: TransactionFilter): string {
    const transactions = this.getTransactions(filter, 10000, 0);
    return JSON.stringify(transactions, null, 2);
  }

  /**
   * 导入交易记录
   */
  importTransactions(data: string): number {
    try {
      const transactions: TransactionRecord[] = JSON.parse(data);
      let importedCount = 0;
      
      transactions.forEach(tx => {
        if (!this.transactions.has(tx.id)) {
          this.transactions.set(tx.id, tx);
          if (tx.status === TransactionStatus.PENDING) {
            this.pendingTransactions.add(tx.id);
          }
          importedCount++;
        }
      });
      
      return importedCount;
    } catch (error: any) {
      console.error('导入交易记录失败:', error);
      return 0;
    }
  }

  /**
   * 设置确认阈值
   */
  setConfirmationThreshold(threshold: number): void {
    this.confirmationThreshold = threshold;
  }

  /**
   * 获取确认阈值
   */
  getConfirmationThreshold(): number {
    return this.confirmationThreshold;
  }
}