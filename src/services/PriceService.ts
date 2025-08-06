import { ChainType } from '../types/chain';

/**
 * 价格数据接口
 */
export interface PriceData {
  symbol: string;
  address?: string;
  chainType: ChainType;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  lastUpdated: string;
}

/**
 * 历史价格数据点
 */
export interface PriceHistoryPoint {
  timestamp: string;
  price: number;
  volume?: number;
  marketCap?: number;
}

/**
 * 价格历史数据
 */
export interface PriceHistory {
  symbol: string;
  chainType: ChainType;
  timeframe: PriceTimeframe;
  data: PriceHistoryPoint[];
  lastUpdated: string;
}

/**
 * 价格时间范围
 */
export enum PriceTimeframe {
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  HOUR_12 = '12h',
  DAY_1 = '1d',
  DAY_7 = '7d',
  DAY_30 = '30d',
  DAY_90 = '90d',
  YEAR_1 = '1y'
}

/**
 * 价格提供商接口
 */
export interface PriceProvider {
  name: string;
  priority: number;
  isActive: boolean;
  rateLimit: number; // 每分钟请求限制
  lastRequest: number;
  errorCount: number;
}

/**
 * 价格警报接口
 */
export interface PriceAlert {
  id: string;
  symbol: string;
  chainType: ChainType;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  notificationSent: boolean;
}

/**
 * 市场数据接口
 */
export interface MarketData {
  symbol: string;
  chainType: ChainType;
  rank?: number;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  ath: number; // 历史最高价
  athDate: string;
  atl: number; // 历史最低价
  atlDate: string;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  lastUpdated: string;
}

/**
 * 价格缓存项
 */
interface PriceCacheItem {
  data: PriceData;
  expiry: number;
}

/**
 * 价格服务类
 */
export class PriceService {
  private priceCache: Map<string, PriceCacheItem> = new Map();
  private historyCache: Map<string, PriceHistory> = new Map();
  private marketDataCache: Map<string, MarketData> = new Map();
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private providers: PriceProvider[] = [];
  private cacheTimeout: number = 60000; // 1分钟缓存
  private updateInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProviders();
    this.startPriceUpdates();
    this.startAlertMonitoring();
  }

  /**
   * 初始化价格提供商
   */
  private initializeProviders(): void {
    this.providers = [
      {
        name: 'CoinGecko',
        priority: 1,
        isActive: true,
        rateLimit: 50, // 每分钟50次请求
        lastRequest: 0,
        errorCount: 0
      },
      {
        name: 'CoinMarketCap',
        priority: 2,
        isActive: true,
        rateLimit: 30,
        lastRequest: 0,
        errorCount: 0
      },
      {
        name: 'Binance',
        priority: 3,
        isActive: true,
        rateLimit: 100,
        lastRequest: 0,
        errorCount: 0
      }
    ];
  }

  /**
   * 获取代币价格
   */
  async getPrice(symbol: string, chainType: ChainType, forceRefresh: boolean = false): Promise<PriceData | null> {
    const cacheKey = `${symbol}_${chainType}`;
    
    // 检查缓存
    if (!forceRefresh) {
      const cached = this.priceCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
    }

    try {
      const priceData = await this.fetchPriceFromProviders(symbol, chainType);
      if (priceData) {
        // 更新缓存
        this.priceCache.set(cacheKey, {
          data: priceData,
          expiry: Date.now() + this.cacheTimeout
        });
        
        // 检查价格警报
        this.checkPriceAlerts(symbol, chainType, priceData.price);
      }
      
      return priceData;
    } catch (error: any) {
      console.error('获取价格失败:', error);
      return null;
    }
  }

  /**
   * 批量获取价格
   */
  async getPrices(tokens: Array<{ symbol: string; chainType: ChainType }>): Promise<PriceData[]> {
    const promises = tokens.map(token => this.getPrice(token.symbol, token.chainType));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<PriceData>).value);
  }

  /**
   * 从提供商获取价格
   */
  private async fetchPriceFromProviders(symbol: string, chainType: ChainType): Promise<PriceData | null> {
    const activeProviders = this.providers
      .filter(p => p.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of activeProviders) {
      try {
        // 检查速率限制
        if (!this.checkRateLimit(provider)) {
          continue;
        }

        const priceData = await this.fetchFromProvider(provider, symbol, chainType);
        if (priceData) {
          provider.errorCount = 0;
          return priceData;
        }
      } catch (error: any) {
        provider.errorCount++;
        console.warn(`Provider ${provider.name} failed:`, error.message);
        
        // 如果错误次数过多，暂时禁用提供商
        if (provider.errorCount >= 5) {
          provider.isActive = false;
          setTimeout(() => {
            provider.isActive = true;
            provider.errorCount = 0;
          }, 300000); // 5分钟后重新启用
        }
      }
    }

    return null;
  }

  /**
   * 从特定提供商获取价格
   */
  private async fetchFromProvider(
    provider: PriceProvider,
    symbol: string,
    chainType: ChainType
  ): Promise<PriceData | null> {
    provider.lastRequest = Date.now();

    switch (provider.name) {
      case 'CoinGecko':
        return this.fetchFromCoinGecko(symbol, chainType);
      case 'CoinMarketCap':
        return this.fetchFromCoinMarketCap(symbol, chainType);
      case 'Binance':
        return this.fetchFromBinance(symbol, chainType);
      default:
        return null;
    }
  }

  /**
   * 从CoinGecko获取价格
   */
  private async fetchFromCoinGecko(symbol: string, chainType: ChainType): Promise<PriceData | null> {
    try {
      // 这里应该调用实际的CoinGecko API
      // 暂时返回模拟数据
      const mockPrice = Math.random() * 1000 + 100;
      const mockChange = (Math.random() - 0.5) * 20;
      
      return {
        symbol,
        chainType,
        price: mockPrice,
        priceChange24h: mockChange,
        priceChangePercentage24h: (mockChange / mockPrice) * 100,
        marketCap: mockPrice * 1000000,
        volume24h: mockPrice * 50000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  /**
   * 从CoinMarketCap获取价格
   */
  private async fetchFromCoinMarketCap(symbol: string, chainType: ChainType): Promise<PriceData | null> {
    try {
      // 模拟CoinMarketCap API调用
      const mockPrice = Math.random() * 1000 + 100;
      const mockChange = (Math.random() - 0.5) * 20;
      
      return {
        symbol,
        chainType,
        price: mockPrice,
        priceChange24h: mockChange,
        priceChangePercentage24h: (mockChange / mockPrice) * 100,
        marketCap: mockPrice * 1000000,
        volume24h: mockPrice * 50000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`CoinMarketCap API error: ${error.message}`);
    }
  }

  /**
   * 从Binance获取价格
   */
  private async fetchFromBinance(symbol: string, chainType: ChainType): Promise<PriceData | null> {
    try {
      // 模拟Binance API调用
      const mockPrice = Math.random() * 1000 + 100;
      const mockChange = (Math.random() - 0.5) * 20;
      
      return {
        symbol,
        chainType,
        price: mockPrice,
        priceChange24h: mockChange,
        priceChangePercentage24h: (mockChange / mockPrice) * 100,
        volume24h: mockPrice * 50000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Binance API error: ${error.message}`);
    }
  }

  /**
   * 检查速率限制
   */
  private checkRateLimit(provider: PriceProvider): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - provider.lastRequest;
    const minInterval = (60 * 1000) / provider.rateLimit; // 毫秒
    
    return timeSinceLastRequest >= minInterval;
  }

  /**
   * 获取价格历史
   */
  async getPriceHistory(
    symbol: string,
    chainType: ChainType,
    timeframe: PriceTimeframe,
    forceRefresh: boolean = false
  ): Promise<PriceHistory | null> {
    const cacheKey = `${symbol}_${chainType}_${timeframe}`;
    
    // 检查缓存
    if (!forceRefresh) {
      const cached = this.historyCache.get(cacheKey);
      if (cached) {
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        if (cacheAge < this.cacheTimeout * 10) { // 历史数据缓存10分钟
          return cached;
        }
      }
    }

    try {
      const historyData = await this.fetchPriceHistory(symbol, chainType, timeframe);
      if (historyData) {
        this.historyCache.set(cacheKey, historyData);
      }
      return historyData;
    } catch (error: any) {
      console.error('获取价格历史失败:', error);
      return null;
    }
  }

  /**
   * 获取价格历史数据
   */
  private async fetchPriceHistory(
    symbol: string,
    chainType: ChainType,
    timeframe: PriceTimeframe
  ): Promise<PriceHistory | null> {
    try {
      // 这里应该调用实际的API来获取历史数据
      // 暂时生成模拟数据
      const dataPoints = this.getDataPointsForTimeframe(timeframe);
      const basePrice = Math.random() * 1000 + 100;
      const data: PriceHistoryPoint[] = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const timestamp = new Date(Date.now() - (dataPoints - i) * this.getIntervalForTimeframe(timeframe));
        const priceVariation = (Math.random() - 0.5) * 0.1; // ±5%变化
        const price = basePrice * (1 + priceVariation);
        
        data.push({
          timestamp: timestamp.toISOString(),
          price,
          volume: price * (Math.random() * 1000 + 100)
        });
      }
      
      return {
        symbol,
        chainType,
        timeframe,
        data,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }
  }

  /**
   * 获取时间范围对应的数据点数量
   */
  private getDataPointsForTimeframe(timeframe: PriceTimeframe): number {
    switch (timeframe) {
      case PriceTimeframe.HOUR_1: return 60; // 每分钟一个点
      case PriceTimeframe.HOUR_4: return 48; // 每5分钟一个点
      case PriceTimeframe.HOUR_12: return 72; // 每10分钟一个点
      case PriceTimeframe.DAY_1: return 24; // 每小时一个点
      case PriceTimeframe.DAY_7: return 168; // 每小时一个点
      case PriceTimeframe.DAY_30: return 30; // 每天一个点
      case PriceTimeframe.DAY_90: return 90; // 每天一个点
      case PriceTimeframe.YEAR_1: return 365; // 每天一个点
      default: return 24;
    }
  }

  /**
   * 获取时间范围对应的间隔（毫秒）
   */
  private getIntervalForTimeframe(timeframe: PriceTimeframe): number {
    switch (timeframe) {
      case PriceTimeframe.HOUR_1: return 60 * 1000; // 1分钟
      case PriceTimeframe.HOUR_4: return 5 * 60 * 1000; // 5分钟
      case PriceTimeframe.HOUR_12: return 10 * 60 * 1000; // 10分钟
      case PriceTimeframe.DAY_1: return 60 * 60 * 1000; // 1小时
      case PriceTimeframe.DAY_7: return 60 * 60 * 1000; // 1小时
      case PriceTimeframe.DAY_30: return 24 * 60 * 60 * 1000; // 1天
      case PriceTimeframe.DAY_90: return 24 * 60 * 60 * 1000; // 1天
      case PriceTimeframe.YEAR_1: return 24 * 60 * 60 * 1000; // 1天
      default: return 60 * 60 * 1000;
    }
  }

  /**
   * 获取市场数据
   */
  async getMarketData(symbol: string, chainType: ChainType): Promise<MarketData | null> {
    const cacheKey = `${symbol}_${chainType}_market`;
    
    // 检查缓存
    const cached = this.marketDataCache.get(cacheKey);
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
      if (cacheAge < this.cacheTimeout * 5) { // 市场数据缓存5分钟
        return cached;
      }
    }

    try {
      // 这里应该调用实际的API来获取市场数据
      // 暂时生成模拟数据
      const basePrice = Math.random() * 1000 + 100;
      const marketData: MarketData = {
        symbol,
        chainType,
        rank: Math.floor(Math.random() * 100) + 1,
        price: basePrice,
        marketCap: basePrice * 1000000,
        volume24h: basePrice * 50000,
        circulatingSupply: 1000000,
        totalSupply: 1000000,
        maxSupply: 1000000,
        ath: basePrice * 1.5,
        athDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        atl: basePrice * 0.5,
        atlDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        priceChange1h: (Math.random() - 0.5) * 10,
        priceChange24h: (Math.random() - 0.5) * 20,
        priceChange7d: (Math.random() - 0.5) * 50,
        priceChange30d: (Math.random() - 0.5) * 100,
        lastUpdated: new Date().toISOString()
      };
      
      this.marketDataCache.set(cacheKey, marketData);
      return marketData;
    } catch (error: any) {
      console.error('获取市场数据失败:', error);
      return null;
    }
  }

  /**
   * 创建价格警报
   */
  createPriceAlert(
    symbol: string,
    chainType: ChainType,
    targetPrice: number,
    condition: 'above' | 'below'
  ): string {
    const alertId = this.generateAlertId();
    
    const alert: PriceAlert = {
      id: alertId,
      symbol,
      chainType,
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date().toISOString(),
      notificationSent: false
    };
    
    this.priceAlerts.set(alertId, alert);
    return alertId;
  }

  /**
   * 删除价格警报
   */
  deletePriceAlert(alertId: string): boolean {
    return this.priceAlerts.delete(alertId);
  }

  /**
   * 获取价格警报
   */
  getPriceAlert(alertId: string): PriceAlert | undefined {
    return this.priceAlerts.get(alertId);
  }

  /**
   * 获取所有价格警报
   */
  getAllPriceAlerts(): PriceAlert[] {
    return Array.from(this.priceAlerts.values());
  }

  /**
   * 检查价格警报
   */
  private checkPriceAlerts(symbol: string, chainType: ChainType, currentPrice: number): void {
    for (const alert of this.priceAlerts.values()) {
      if (alert.symbol === symbol && 
          alert.chainType === chainType && 
          alert.isActive && 
          !alert.notificationSent) {
        
        const shouldTrigger = 
          (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'below' && currentPrice <= alert.targetPrice);
        
        if (shouldTrigger) {
          alert.triggeredAt = new Date().toISOString();
          alert.notificationSent = true;
          alert.isActive = false;
          
          // 这里应该发送通知
          this.sendPriceAlertNotification(alert, currentPrice);
        }
      }
    }
  }

  /**
   * 发送价格警报通知
   */
  private sendPriceAlertNotification(alert: PriceAlert, currentPrice: number): void {
    console.log(`价格警报触发: ${alert.symbol} 当前价格 $${currentPrice}, 目标价格 $${alert.targetPrice}`);
    // 这里应该实现实际的通知逻辑，如推送通知、邮件等
  }

  /**
   * 开始价格更新
   */
  private startPriceUpdates(): void {
    // 每分钟更新一次热门代币价格
    this.updateInterval = setInterval(() => {
      this.updatePopularTokenPrices();
    }, 60000);
  }

  /**
   * 开始警报监控
   */
  private startAlertMonitoring(): void {
    // 每30秒检查一次价格警报
    this.alertCheckInterval = setInterval(() => {
      this.checkAllActiveAlerts();
    }, 30000);
  }

  /**
   * 更新热门代币价格
   */
  private async updatePopularTokenPrices(): Promise<void> {
    const popularTokens = [
      { symbol: 'ETH', chainType: ChainType.EVM },
      { symbol: 'SOL', chainType: ChainType.SOLANA },
      { symbol: 'APT', chainType: ChainType.APTOS }
    ];
    
    for (const token of popularTokens) {
      try {
        await this.getPrice(token.symbol, token.chainType, true);
      } catch (error: any) {
        console.error(`更新 ${token.symbol} 价格失败:`, error);
      }
    }
  }

  /**
   * 检查所有活跃警报
   */
  private async checkAllActiveAlerts(): Promise<void> {
    const activeAlerts = Array.from(this.priceAlerts.values())
      .filter(alert => alert.isActive && !alert.notificationSent);
    
    for (const alert of activeAlerts) {
      try {
        const priceData = await this.getPrice(alert.symbol, alert.chainType);
        if (priceData) {
          this.checkPriceAlerts(alert.symbol, alert.chainType, priceData.price);
        }
      } catch (error: any) {
        console.error(`检查警报失败:`, error);
      }
    }
  }

  /**
   * 生成警报ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.priceCache.clear();
    this.historyCache.clear();
    this.marketDataCache.clear();
  }

  /**
   * 设置缓存超时时间
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    priceCache: number;
    historyCache: number;
    marketDataCache: number;
  } {
    return {
      priceCache: this.priceCache.size,
      historyCache: this.historyCache.size,
      marketDataCache: this.marketDataCache.size
    };
  }

  /**
   * 添加自定义提供商
   */
  addProvider(provider: PriceProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除提供商
   */
  removeProvider(providerName: string): boolean {
    const index = this.providers.findIndex(p => p.name === providerName);
    if (index > -1) {
      this.providers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取提供商状态
   */
  getProviderStatus(): PriceProvider[] {
    return [...this.providers];
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    
    this.clearCache();
    this.priceAlerts.clear();
    this.providers = [];
  }
}