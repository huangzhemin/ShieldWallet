/**
 * 通知类型枚举
 */
export enum NotificationType {
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  PRICE_ALERT = 'price_alert',
  SECURITY_ALERT = 'security_alert',
  BALANCE_CHANGE = 'balance_change',
  NFT_RECEIVED = 'nft_received',
  DEFI_POSITION_UPDATE = 'defi_position_update',
  NETWORK_STATUS = 'network_status',
  BACKUP_REMINDER = 'backup_reminder',
  UPDATE_AVAILABLE = 'update_available'
}

/**
 * 通知优先级
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * 通知状态
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed'
}

/**
 * 通知渠道
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

/**
 * 通知接口
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  data?: any;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  enabled: boolean;
  channels: {
    [key in NotificationChannel]: {
      enabled: boolean;
      config?: any;
    }
  };
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      priority: NotificationPriority;
      channels: NotificationChannel[];
      quietHours?: {
        enabled: boolean;
        start: string; // HH:mm
        end: string; // HH:mm
      };
    }
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    batchDelay: number; // 批量发送延迟（毫秒）
  };
}

/**
 * 通知模板接口
 */
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  variables: string[]; // 模板变量列表
}

/**
 * 通知统计接口
 */
export interface NotificationStats {
  total: number;
  sent: number;
  read: number;
  dismissed: number;
  failed: number;
  byType: { [type: string]: number };
  byChannel: { [channel: string]: number };
  byPriority: { [priority: string]: number };
}

/**
 * 通知事件接口
 */
export interface NotificationEvent {
  type: 'created' | 'sent' | 'read' | 'dismissed' | 'failed';
  notificationId: string;
  timestamp: string;
  data?: any;
}

/**
 * 通知服务类
 */
export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private settings: NotificationSettings;
  private templates: Map<NotificationType, NotificationTemplate> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private sendQueue: Notification[] = [];
  private isProcessingQueue: boolean = false;
  private rateLimitCounters: Map<string, number> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeTemplates();
    this.startQueueProcessor();
    this.startRateLimitReset();
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      channels: {
        [NotificationChannel.IN_APP]: { enabled: true },
        [NotificationChannel.PUSH]: { enabled: true },
        [NotificationChannel.EMAIL]: { enabled: false },
        [NotificationChannel.SMS]: { enabled: false },
        [NotificationChannel.WEBHOOK]: { enabled: false }
      },
      types: {
        [NotificationType.TRANSACTION_CONFIRMED]: {
          enabled: true,
          priority: NotificationPriority.MEDIUM,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        },
        [NotificationType.TRANSACTION_FAILED]: {
          enabled: true,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        },
        [NotificationType.PRICE_ALERT]: {
          enabled: true,
          priority: NotificationPriority.MEDIUM,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        },
        [NotificationType.SECURITY_ALERT]: {
          enabled: true,
          priority: NotificationPriority.URGENT,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL]
        },
        [NotificationType.BALANCE_CHANGE]: {
          enabled: true,
          priority: NotificationPriority.LOW,
          channels: [NotificationChannel.IN_APP]
        },
        [NotificationType.NFT_RECEIVED]: {
          enabled: true,
          priority: NotificationPriority.MEDIUM,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        },
        [NotificationType.DEFI_POSITION_UPDATE]: {
          enabled: true,
          priority: NotificationPriority.MEDIUM,
          channels: [NotificationChannel.IN_APP]
        },
        [NotificationType.NETWORK_STATUS]: {
          enabled: true,
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.IN_APP]
        },
        [NotificationType.BACKUP_REMINDER]: {
          enabled: true,
          priority: NotificationPriority.MEDIUM,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
        },
        [NotificationType.UPDATE_AVAILABLE]: {
          enabled: true,
          priority: NotificationPriority.LOW,
          channels: [NotificationChannel.IN_APP]
        }
      },
      frequency: {
        maxPerHour: 50,
        maxPerDay: 200,
        batchDelay: 5000 // 5秒
      }
    };
  }

  /**
   * 初始化通知模板
   */
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        type: NotificationType.TRANSACTION_CONFIRMED,
        title: '交易确认',
        message: '您的交易已确认。金额: {amount} {symbol}，哈希: {hash}',
        variables: ['amount', 'symbol', 'hash']
      },
      {
        type: NotificationType.TRANSACTION_FAILED,
        title: '交易失败',
        message: '您的交易失败。原因: {reason}，哈希: {hash}',
        variables: ['reason', 'hash']
      },
      {
        type: NotificationType.PRICE_ALERT,
        title: '价格警报',
        message: '{symbol} 价格已{condition} ${targetPrice}，当前价格: ${currentPrice}',
        variables: ['symbol', 'condition', 'targetPrice', 'currentPrice']
      },
      {
        type: NotificationType.SECURITY_ALERT,
        title: '安全警报',
        message: '检测到安全事件: {event}。请立即检查您的账户安全。',
        variables: ['event']
      },
      {
        type: NotificationType.BALANCE_CHANGE,
        title: '余额变化',
        message: '您的 {symbol} 余额已更新。新余额: {balance}',
        variables: ['symbol', 'balance']
      },
      {
        type: NotificationType.NFT_RECEIVED,
        title: 'NFT 接收',
        message: '您收到了新的 NFT: {name}，来自: {from}',
        variables: ['name', 'from']
      },
      {
        type: NotificationType.DEFI_POSITION_UPDATE,
        title: 'DeFi 仓位更新',
        message: '您在 {protocol} 的仓位已更新。当前价值: ${value}',
        variables: ['protocol', 'value']
      },
      {
        type: NotificationType.NETWORK_STATUS,
        title: '网络状态',
        message: '{network} 网络状态: {status}',
        variables: ['network', 'status']
      },
      {
        type: NotificationType.BACKUP_REMINDER,
        title: '备份提醒',
        message: '建议您备份钱包。上次备份时间: {lastBackup}',
        variables: ['lastBackup']
      },
      {
        type: NotificationType.UPDATE_AVAILABLE,
        title: '更新可用',
        message: '新版本 {version} 可用。请更新以获得最新功能和安全修复。',
        variables: ['version']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * 创建通知
   */
  async createNotification(
    type: NotificationType,
    data: any = {},
    customTitle?: string,
    customMessage?: string,
    customPriority?: NotificationPriority,
    customChannels?: NotificationChannel[]
  ): Promise<string> {
    if (!this.settings.enabled || !this.settings.types[type]?.enabled) {
      return '';
    }

    // 检查频率限制
    if (!this.checkRateLimit()) {
      console.warn('通知频率超限，跳过发送');
      return '';
    }

    // 检查静默时间
    if (this.isInQuietHours(type)) {
      console.log('当前为静默时间，延迟发送通知');
      // 可以选择延迟发送或跳过
    }

    const notificationId = this.generateNotificationId();
    const template = this.templates.get(type);
    const typeSettings = this.settings.types[type];

    const title = customTitle || (template ? this.renderTemplate(template.title, data) : type);
    const message = customMessage || (template ? this.renderTemplate(template.message, data) : JSON.stringify(data));
    const priority = customPriority || typeSettings.priority;
    const channels = customChannels || typeSettings.channels.filter(channel => 
      this.settings.channels[channel]?.enabled
    );

    const notification: Notification = {
      id: notificationId,
      type,
      title,
      message,
      priority,
      status: NotificationStatus.PENDING,
      channels,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.getMaxRetriesForPriority(priority)
    };

    // 设置过期时间
    if (priority === NotificationPriority.LOW) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
      notification.expiresAt = expiresAt.toISOString();
    }

    this.notifications.set(notificationId, notification);
    
    // 根据优先级决定发送方式
    if (priority === NotificationPriority.URGENT) {
      await this.sendNotificationImmediately(notification);
    } else {
      this.addToQueue(notification);
    }

    this.emitEvent('created', notificationId, { notification });
    return notificationId;
  }

  /**
   * 渲染模板
   */
  private renderTemplate(template: string, data: any): string {
    let rendered = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key]);
    });
    return rendered;
  }

  /**
   * 检查频率限制
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const hourKey = `hour_${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `day_${Math.floor(now / (24 * 60 * 60 * 1000))}`;

    const hourCount = this.rateLimitCounters.get(hourKey) || 0;
    const dayCount = this.rateLimitCounters.get(dayKey) || 0;

    if (hourCount >= this.settings.frequency.maxPerHour || 
        dayCount >= this.settings.frequency.maxPerDay) {
      return false;
    }

    this.rateLimitCounters.set(hourKey, hourCount + 1);
    this.rateLimitCounters.set(dayKey, dayCount + 1);
    return true;
  }

  /**
   * 检查是否在静默时间
   */
  private isInQuietHours(type: NotificationType): boolean {
    const typeSettings = this.settings.types[type];
    if (!typeSettings.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = typeSettings.quietHours.start;
    const end = typeSettings.quietHours.end;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // 跨天的情况
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * 获取优先级对应的最大重试次数
   */
  private getMaxRetriesForPriority(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT: return 5;
      case NotificationPriority.HIGH: return 3;
      case NotificationPriority.MEDIUM: return 2;
      case NotificationPriority.LOW: return 1;
      default: return 1;
    }
  }

  /**
   * 立即发送通知
   */
  private async sendNotificationImmediately(notification: Notification): Promise<void> {
    try {
      await this.sendNotification(notification);
    } catch (error: any) {
      console.error('立即发送通知失败:', error);
      this.addToQueue(notification);
    }
  }

  /**
   * 添加到发送队列
   */
  private addToQueue(notification: Notification): void {
    this.sendQueue.push(notification);
    
    // 如果是批量发送，设置延迟
    if (this.settings.frequency.batchDelay > 0 && !this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
        this.batchTimer = null;
      }, this.settings.frequency.batchDelay);
    }
  }

  /**
   * 处理批量发送
   */
  private async processBatch(): Promise<void> {
    if (this.sendQueue.length === 0) return;

    const batch = [...this.sendQueue];
    this.sendQueue = [];

    // 按优先级排序
    batch.sort((a, b) => {
      const priorityOrder = {
        [NotificationPriority.URGENT]: 4,
        [NotificationPriority.HIGH]: 3,
        [NotificationPriority.MEDIUM]: 2,
        [NotificationPriority.LOW]: 1
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const notification of batch) {
      try {
        await this.sendNotification(notification);
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms间隔
      } catch (error: any) {
        console.error('批量发送通知失败:', error);
      }
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(notification: Notification): Promise<void> {
    // 检查是否过期
    if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
      notification.status = NotificationStatus.FAILED;
      return;
    }

    try {
      const sendPromises = notification.channels.map(channel => 
        this.sendToChannel(notification, channel)
      );
      
      await Promise.allSettled(sendPromises);
      
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date().toISOString();
      
      this.emitEvent('sent', notification.id, { notification });
    } catch (error: any) {
      notification.retryCount++;
      
      if (notification.retryCount >= notification.maxRetries) {
        notification.status = NotificationStatus.FAILED;
        this.emitEvent('failed', notification.id, { notification, error });
      } else {
        // 重新加入队列
        setTimeout(() => {
          this.addToQueue(notification);
        }, Math.pow(2, notification.retryCount) * 1000); // 指数退避
      }
      
      throw error;
    }
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInAppNotification(notification);
        break;
      case NotificationChannel.PUSH:
        await this.sendPushNotification(notification);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification);
        break;
      case NotificationChannel.SMS:
        await this.sendSMSNotification(notification);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(notification);
        break;
      default:
        throw new Error(`不支持的通知渠道: ${channel}`);
    }
  }

  /**
   * 发送应用内通知
   */
  private async sendInAppNotification(notification: Notification): Promise<void> {
    // 应用内通知通常只是存储，由UI组件读取显示
    console.log('应用内通知:', notification.title, notification.message);
  }

  /**
   * 发送推送通知
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    // 这里应该集成实际的推送服务，如FCM、APNs等
    console.log('推送通知:', notification.title, notification.message);
    
    // 模拟推送API调用
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    // 这里应该集成邮件服务
    console.log('邮件通知:', notification.title, notification.message);
    
    // 模拟邮件发送
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * 发送短信通知
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    // 这里应该集成短信服务
    console.log('短信通知:', notification.message);
    
    // 模拟短信发送
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * 发送Webhook通知
   */
  private async sendWebhookNotification(notification: Notification): Promise<void> {
    // 这里应该发送HTTP请求到配置的webhook URL
    console.log('Webhook通知:', notification);
    
    // 模拟webhook调用
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  /**
   * 标记通知为已读
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date().toISOString();
    
    this.emitEvent('read', notificationId, { notification });
    return true;
  }

  /**
   * 标记通知为已忽略
   */
  dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.status = NotificationStatus.DISMISSED;
    notification.dismissedAt = new Date().toISOString();
    
    this.emitEvent('dismissed', notificationId, { notification });
    return true;
  }

  /**
   * 获取通知
   */
  getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * 获取通知列表
   */
  getNotifications(
    filter?: {
      type?: NotificationType;
      status?: NotificationStatus;
      priority?: NotificationPriority;
      fromDate?: string;
      toDate?: string;
    },
    limit: number = 50,
    offset: number = 0
  ): Notification[] {
    let notifications = Array.from(this.notifications.values());

    // 应用过滤器
    if (filter) {
      notifications = notifications.filter(notification => {
        if (filter.type && notification.type !== filter.type) return false;
        if (filter.status && notification.status !== filter.status) return false;
        if (filter.priority && notification.priority !== filter.priority) return false;
        if (filter.fromDate && notification.createdAt < filter.fromDate) return false;
        if (filter.toDate && notification.createdAt > filter.toDate) return false;
        return true;
      });
    }

    // 按创建时间降序排序
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 应用分页
    return notifications.slice(offset, offset + limit);
  }

  /**
   * 获取未读通知数量
   */
  getUnreadCount(): number {
    return Array.from(this.notifications.values())
      .filter(n => n.status === NotificationStatus.SENT).length;
  }

  /**
   * 获取通知统计
   */
  getNotificationStats(): NotificationStats {
    const notifications = Array.from(this.notifications.values());
    
    const stats: NotificationStats = {
      total: notifications.length,
      sent: 0,
      read: 0,
      dismissed: 0,
      failed: 0,
      byType: {},
      byChannel: {},
      byPriority: {}
    };

    notifications.forEach(notification => {
      // 按状态统计
      switch (notification.status) {
        case NotificationStatus.SENT:
          stats.sent++;
          break;
        case NotificationStatus.READ:
          stats.read++;
          break;
        case NotificationStatus.DISMISSED:
          stats.dismissed++;
          break;
        case NotificationStatus.FAILED:
          stats.failed++;
          break;
      }

      // 按类型统计
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // 按优先级统计
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;

      // 按渠道统计
      notification.channels.forEach(channel => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * 获取设置
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * 清理过期通知
   */
  cleanupExpiredNotifications(): number {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.expiresAt && new Date(notification.expiresAt) < now) {
        this.notifications.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 清理旧通知
   */
  cleanupOldNotifications(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    let deletedCount = 0;
    for (const [id, notification] of this.notifications) {
      if (notification.createdAt < cutoffTimestamp) {
        this.notifications.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 开始队列处理器
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.sendQueue.length > 0) {
        this.isProcessingQueue = true;
        this.processBatch().finally(() => {
          this.isProcessingQueue = false;
        });
      }
    }, 10000); // 每10秒检查一次队列
  }

  /**
   * 开始频率限制重置
   */
  private startRateLimitReset(): void {
    // 每小时清理过期的频率计数器
    setInterval(() => {
      const now = Date.now();
      const currentHour = Math.floor(now / (60 * 60 * 1000));
      const currentDay = Math.floor(now / (24 * 60 * 60 * 1000));

      // 清理过期的计数器
      for (const [key] of this.rateLimitCounters) {
        if (key.startsWith('hour_')) {
          const hour = parseInt(key.split('_')[1]);
          if (hour < currentHour - 1) {
            this.rateLimitCounters.delete(key);
          }
        } else if (key.startsWith('day_')) {
          const day = parseInt(key.split('_')[1]);
          if (day < currentDay - 1) {
            this.rateLimitCounters.delete(key);
          }
        }
      }
    }, 60 * 60 * 1000); // 每小时执行一次
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
  private emitEvent(type: string, notificationId: string, data: any): void {
    const event: NotificationEvent = {
      type: type as any,
      notificationId,
      timestamp: new Date().toISOString(),
      data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('通知事件监听器执行失败:', error);
        }
      });
    }
  }

  /**
   * 生成通知ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    this.notifications.clear();
    this.eventListeners.clear();
    this.sendQueue = [];
    this.rateLimitCounters.clear();
  }
}