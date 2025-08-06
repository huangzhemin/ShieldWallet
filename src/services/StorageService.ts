/**
 * 存储类型枚举
 */
export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
  SECURE = 'secure',
  CACHE = 'cache',
  DATABASE = 'database'
}

/**
 * 存储选项接口
 */
export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number; // 生存时间（秒）
  namespace?: string;
  backup?: boolean;
}

/**
 * 存储项接口
 */
export interface StorageItem<T = any> {
  key: string;
  value: T;
  type: StorageType;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: {
    size: number;
    checksum?: string;
    version?: string;
    encrypted?: boolean;
    compressed?: boolean;
  };
}

/**
 * 存储统计接口
 */
export interface StorageStats {
  totalItems: number;
  totalSize: number;
  byType: { [type: string]: { count: number; size: number } };
  byNamespace: { [namespace: string]: { count: number; size: number } };
  expiredItems: number;
  lastCleanup: string;
}

/**
 * 存储事件接口
 */
export interface StorageEvent {
  type: 'set' | 'get' | 'delete' | 'clear' | 'expire';
  key: string;
  storageType: StorageType;
  timestamp: string;
  data?: any;
}

/**
 * 存储配置接口
 */
export interface StorageConfig {
  maxSize: number; // 最大存储大小（字节）
  maxItems: number; // 最大存储项数
  defaultTTL: number; // 默认TTL（秒）
  enableCompression: boolean;
  enableEncryption: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // 清理间隔（毫秒）
  backupEnabled: boolean;
  backupInterval: number; // 备份间隔（毫秒）
}

/**
 * 存储服务类
 */
export class StorageService {
  private storage: Map<string, StorageItem> = new Map();
  private config: StorageConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private backupTimer: NodeJS.Timeout | null = null;
  private currentSize: number = 0;
  private isInitialized: boolean = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxItems: 10000,
      defaultTTL: 24 * 60 * 60, // 24小时
      enableCompression: true,
      enableEncryption: false,
      autoCleanup: true,
      cleanupInterval: 60 * 60 * 1000, // 1小时
      backupEnabled: true,
      backupInterval: 24 * 60 * 60 * 1000, // 24小时
      ...config
    };
  }

  /**
   * 初始化存储服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 加载持久化数据
      await this.loadFromPersistentStorage();
      
      // 启动自动清理
      if (this.config.autoCleanup) {
        this.startAutoCleanup();
      }
      
      // 启动自动备份
      if (this.config.backupEnabled) {
        this.startAutoBackup();
      }
      
      this.isInitialized = true;
      console.log('存储服务初始化完成');
    } catch (error: any) {
      console.error('存储服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置存储项
   */
  async setItem<T>(
    key: string,
    value: T,
    type: StorageType = StorageType.LOCAL,
    options: StorageOptions = {}
  ): Promise<boolean> {
    try {
      // 检查存储限制
      if (this.storage.size >= this.config.maxItems) {
        throw new Error('存储项数量已达上限');
      }

      // 序列化值
      let serializedValue = JSON.stringify(value);
      let size = new Blob([serializedValue]).size;

      // 压缩（如果启用）
      if (options.compress || (this.config.enableCompression && options.compress !== false)) {
        serializedValue = await this.compress(serializedValue);
        size = new Blob([serializedValue]).size;
      }

      // 加密（如果启用）
      if (options.encrypt || (this.config.enableEncryption && options.encrypt !== false)) {
        serializedValue = await this.encrypt(serializedValue);
        size = new Blob([serializedValue]).size;
      }

      // 检查大小限制
      if (this.currentSize + size > this.config.maxSize) {
        // 尝试清理过期项
        await this.cleanup();
        if (this.currentSize + size > this.config.maxSize) {
          throw new Error('存储空间不足');
        }
      }

      // 计算过期时间
      const ttl = options.ttl || this.config.defaultTTL;
      const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : undefined;

      // 生成校验和
      const checksum = await this.generateChecksum(serializedValue);

      // 创建存储项
      const item: StorageItem<T> = {
        key: this.getNamespacedKey(key, options.namespace),
        value: JSON.parse(serializedValue) as T,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt,
        metadata: {
          size,
          checksum,
          encrypted: options.encrypt || this.config.enableEncryption,
          compressed: options.compress || this.config.enableCompression
        }
      };

      // 如果键已存在，减去旧项的大小
      const existingItem = this.storage.get(item.key);
      if (existingItem) {
        this.currentSize -= existingItem.metadata?.size || 0;
      }

      // 存储项
      this.storage.set(item.key, item);
      this.currentSize += size;

      // 持久化到对应的存储类型
      await this.persistToStorage(item, type);

      // 备份（如果启用）
      if (options.backup && this.config.backupEnabled) {
        await this.backupItem(item);
      }

      this.emitEvent('set', key, type, { item });
      return true;
    } catch (error: any) {
      console.error('设置存储项失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储项
   */
  async getItem<T>(
    key: string,
    type: StorageType = StorageType.LOCAL,
    namespace?: string
  ): Promise<T | null> {
    try {
      const namespacedKey = this.getNamespacedKey(key, namespace);
      let item = this.storage.get(namespacedKey);

      // 如果内存中没有，尝试从持久化存储加载
      if (!item) {
        const loadedItem = await this.loadFromStorage(namespacedKey, type);
        if (loadedItem) {
          item = loadedItem;
          this.storage.set(namespacedKey, item);
          this.currentSize += item.metadata?.size || 0;
        }
      }

      if (!item) {
        return null;
      }

      // 检查是否过期
      if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
        await this.deleteItem(key, type, namespace);
        this.emitEvent('expire', key, type, { item });
        return null;
      }

      // 验证校验和
      if (item.metadata?.checksum) {
        const currentChecksum = await this.generateChecksum(JSON.stringify(item.value));
        if (currentChecksum !== item.metadata.checksum) {
          console.warn(`存储项 ${key} 校验和不匹配，可能已损坏`);
        }
      }

      this.emitEvent('get', key, type, { item });
      return item.value;
    } catch (error: any) {
      console.error('获取存储项失败:', error);
      return null;
    }
  }

  /**
   * 删除存储项
   */
  async deleteItem(
    key: string,
    type: StorageType = StorageType.LOCAL,
    namespace?: string
  ): Promise<boolean> {
    try {
      const namespacedKey = this.getNamespacedKey(key, namespace);
      const item = this.storage.get(namespacedKey);

      if (!item) {
        return false;
      }

      // 从内存中删除
      this.storage.delete(namespacedKey);
      this.currentSize -= item.metadata?.size || 0;

      // 从持久化存储中删除
      await this.removeFromStorage(namespacedKey, type);

      this.emitEvent('delete', key, type, { item });
      return true;
    } catch (error: any) {
      console.error('删除存储项失败:', error);
      return false;
    }
  }

  /**
   * 清空存储
   */
  async clear(type?: StorageType, namespace?: string): Promise<boolean> {
    try {
      const keysToDelete: string[] = [];

      for (const [key, item] of this.storage) {
        const shouldDelete = (!type || item.type === type) && 
                           (!namespace || key.startsWith(`${namespace}:`));
        if (shouldDelete) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        const item = this.storage.get(key);
        if (item) {
          this.storage.delete(key);
          this.currentSize -= item.metadata?.size || 0;
          await this.removeFromStorage(key, item.type);
        }
      }

      this.emitEvent('clear', '', type || StorageType.LOCAL, { 
        deletedCount: keysToDelete.length 
      });
      return true;
    } catch (error: any) {
      console.error('清空存储失败:', error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async hasItem(
    key: string,
    type: StorageType = StorageType.LOCAL,
    namespace?: string
  ): Promise<boolean> {
    const namespacedKey = this.getNamespacedKey(key, namespace);
    
    // 先检查内存
    if (this.storage.has(namespacedKey)) {
      const item = this.storage.get(namespacedKey)!;
      // 检查是否过期
      if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
        await this.deleteItem(key, type, namespace);
        return false;
      }
      return true;
    }

    // 检查持久化存储
    const item = await this.loadFromStorage(namespacedKey, type);
    return item !== null;
  }

  /**
   * 获取所有键
   */
  getKeys(type?: StorageType, namespace?: string): string[] {
    const keys: string[] = [];
    
    for (const [key, item] of this.storage) {
      const shouldInclude = (!type || item.type === type) && 
                           (!namespace || key.startsWith(`${namespace}:`));
      if (shouldInclude) {
        // 移除命名空间前缀
        const originalKey = namespace ? key.substring(`${namespace}:`.length) : key;
        keys.push(originalKey);
      }
    }
    
    return keys;
  }

  /**
   * 获取存储大小
   */
  getSize(type?: StorageType, namespace?: string): number {
    let size = 0;
    
    for (const [key, item] of this.storage) {
      const shouldInclude = (!type || item.type === type) && 
                           (!namespace || key.startsWith(`${namespace}:`));
      if (shouldInclude) {
        size += item.metadata?.size || 0;
      }
    }
    
    return size;
  }

  /**
   * 获取存储统计
   */
  getStats(): StorageStats {
    const stats: StorageStats = {
      totalItems: this.storage.size,
      totalSize: this.currentSize,
      byType: {},
      byNamespace: {},
      expiredItems: 0,
      lastCleanup: new Date().toISOString()
    };

    const now = new Date();
    
    for (const [key, item] of this.storage) {
      // 按类型统计
      if (!stats.byType[item.type]) {
        stats.byType[item.type] = { count: 0, size: 0 };
      }
      stats.byType[item.type].count++;
      stats.byType[item.type].size += item.metadata?.size || 0;

      // 按命名空间统计
      const namespace = key.includes(':') ? key.split(':')[0] : 'default';
      if (!stats.byNamespace[namespace]) {
        stats.byNamespace[namespace] = { count: 0, size: 0 };
      }
      stats.byNamespace[namespace].count++;
      stats.byNamespace[namespace].size += item.metadata?.size || 0;

      // 过期项统计
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        stats.expiredItems++;
      }
    }

    return stats;
  }

  /**
   * 清理过期项
   */
  async cleanup(): Promise<number> {
    let deletedCount = 0;
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.storage) {
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const item = this.storage.get(key);
      if (item) {
        this.storage.delete(key);
        this.currentSize -= item.metadata?.size || 0;
        await this.removeFromStorage(key, item.type);
        deletedCount++;
      }
    }

    console.log(`清理了 ${deletedCount} 个过期存储项`);
    return deletedCount;
  }

  /**
   * 压缩存储
   */
  async compress(data: string): Promise<string> {
    // 这里应该实现实际的压缩算法
    // 简单示例：使用gzip或其他压缩库
    try {
      // 模拟压缩
      const compressed = Buffer.from(data, 'utf8').toString('base64');
      return compressed;
    } catch (error: any) {
      console.error('压缩失败:', error);
      return data;
    }
  }

  /**
   * 解压缩存储
   */
  async decompress(compressedData: string): Promise<string> {
    // 这里应该实现实际的解压缩算法
    try {
      // 模拟解压缩
      const decompressed = Buffer.from(compressedData, 'base64').toString('utf8');
      return decompressed;
    } catch (error: any) {
      console.error('解压缩失败:', error);
      return compressedData;
    }
  }

  /**
   * 加密数据
   */
  async encrypt(data: string): Promise<string> {
    // 这里应该集成SecurityService的加密功能
    try {
      // 模拟加密
      const encrypted = Buffer.from(data, 'utf8').toString('hex');
      return encrypted;
    } catch (error: any) {
      console.error('加密失败:', error);
      return data;
    }
  }

  /**
   * 解密数据
   */
  async decrypt(encryptedData: string): Promise<string> {
    // 这里应该集成SecurityService的解密功能
    try {
      // 模拟解密
      const decrypted = Buffer.from(encryptedData, 'hex').toString('utf8');
      return decrypted;
    } catch (error: any) {
      console.error('解密失败:', error);
      return encryptedData;
    }
  }

  /**
   * 生成校验和
   */
  async generateChecksum(data: string): Promise<string> {
    // 这里应该使用crypto库生成校验和
    try {
      // 简单的校验和实现
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return hash.toString(16);
    } catch (error: any) {
      console.error('生成校验和失败:', error);
      return '';
    }
  }

  /**
   * 获取命名空间键
   */
  private getNamespacedKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * 持久化到存储
   */
  private async persistToStorage(item: StorageItem, type: StorageType): Promise<void> {
    try {
      switch (type) {
        case StorageType.LOCAL:
          // 持久化到本地存储
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(item.key, JSON.stringify(item));
          }
          break;
        case StorageType.SESSION:
          // 持久化到会话存储
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(item.key, JSON.stringify(item));
          }
          break;
        case StorageType.SECURE:
          // 持久化到安全存储（如Keychain、Credential Manager等）
          // 这里需要平台特定的实现
          break;
        case StorageType.DATABASE:
          // 持久化到数据库
          // 这里需要数据库连接和操作
          break;
        case StorageType.CACHE:
          // 缓存通常不需要持久化
          break;
      }
    } catch (error: any) {
      console.error('持久化存储失败:', error);
    }
  }

  /**
   * 从存储加载
   */
  private async loadFromStorage(key: string, type: StorageType): Promise<StorageItem | null> {
    try {
      let data: string | null = null;
      
      switch (type) {
        case StorageType.LOCAL:
          if (typeof localStorage !== 'undefined') {
            data = localStorage.getItem(key);
          }
          break;
        case StorageType.SESSION:
          if (typeof sessionStorage !== 'undefined') {
            data = sessionStorage.getItem(key);
          }
          break;
        case StorageType.SECURE:
          // 从安全存储加载
          break;
        case StorageType.DATABASE:
          // 从数据库加载
          break;
        case StorageType.CACHE:
          // 缓存不持久化
          return null;
      }
      
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      console.error('从存储加载失败:', error);
      return null;
    }
  }

  /**
   * 从存储移除
   */
  private async removeFromStorage(key: string, type: StorageType): Promise<void> {
    try {
      switch (type) {
        case StorageType.LOCAL:
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
          }
          break;
        case StorageType.SESSION:
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(key);
          }
          break;
        case StorageType.SECURE:
          // 从安全存储移除
          break;
        case StorageType.DATABASE:
          // 从数据库移除
          break;
        case StorageType.CACHE:
          // 缓存不需要持久化移除
          break;
      }
    } catch (error: any) {
      console.error('从存储移除失败:', error);
    }
  }

  /**
   * 从持久化存储加载所有数据
   */
  private async loadFromPersistentStorage(): Promise<void> {
    try {
      // 加载本地存储
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const data = localStorage.getItem(key);
            if (data) {
              try {
                const item: StorageItem = JSON.parse(data);
                this.storage.set(key, item);
                this.currentSize += item.metadata?.size || 0;
              } catch (error) {
                console.warn(`解析存储项 ${key} 失败:`, error);
              }
            }
          }
        }
      }
      
      console.log('从持久化存储加载完成');
    } catch (error: any) {
      console.error('从持久化存储加载失败:', error);
    }
  }

  /**
   * 备份存储项
   */
  private async backupItem(item: StorageItem): Promise<void> {
    try {
      // 这里应该实现备份逻辑
      // 可以备份到云存储、本地文件等
      console.log(`备份存储项: ${item.key}`);
    } catch (error: any) {
      console.error('备份存储项失败:', error);
    }
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('自动清理失败:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * 启动自动备份
   */
  private startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(async () => {
      try {
        // 备份所有重要数据
        for (const [key, item] of this.storage) {
          if (item.type === StorageType.SECURE || item.type === StorageType.LOCAL) {
            await this.backupItem(item);
          }
        }
      } catch (error) {
        console.error('自动备份失败:', error);
      }
    }, this.config.backupInterval);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, listener: Function): void {
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
  private emitEvent(type: string, key: string, storageType: StorageType, data: any): void {
    const event: StorageEvent = {
      type: type as any,
      key,
      storageType,
      timestamp: new Date().toISOString(),
      data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('存储事件监听器执行失败:', error);
        }
      });
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 重新启动定时器
    if (config.autoCleanup !== undefined) {
      if (config.autoCleanup) {
        this.startAutoCleanup();
      } else if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    }
    
    if (config.backupEnabled !== undefined) {
      if (config.backupEnabled) {
        this.startAutoBackup();
      } else if (this.backupTimer) {
        clearInterval(this.backupTimer);
        this.backupTimer = null;
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    
    this.storage.clear();
    this.eventListeners.clear();
    this.currentSize = 0;
    this.isInitialized = false;
  }
}