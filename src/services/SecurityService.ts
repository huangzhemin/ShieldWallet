import * as crypto from 'crypto';
import * as bip39 from 'bip39';

/**
 * 加密配置接口
 */
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
}

/**
 * 钱包备份数据接口
 */
export interface WalletBackup {
  version: string;
  timestamp: string;
  encryptedData: string;
  checksum: string;
  metadata: {
    walletCount: number;
    supportedChains: string[];
    createdAt: string;
  };
}

/**
 * 安全策略接口
 */
export interface SecurityPolicy {
  requireBiometric: boolean;
  autoLockTimeout: number; // 分钟
  maxFailedAttempts: number;
  requirePasswordComplexity: boolean;
  enableTransactionConfirmation: boolean;
  enableAddressWhitelist: boolean;
}

/**
 * 生物识别类型
 */
export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_ID = 'face_id',
  VOICE = 'voice'
}

/**
 * 安全事件类型
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  WALLET_CREATED = 'wallet_created',
  WALLET_IMPORTED = 'wallet_imported',
  TRANSACTION_SIGNED = 'transaction_signed',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  SECURITY_BREACH = 'security_breach'
}

/**
 * 安全事件接口
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * 安全服务类
 */
export class SecurityService {
  private encryptionConfig: EncryptionConfig;
  private securityPolicy: SecurityPolicy;
  private securityEvents: SecurityEvent[] = [];
  private failedAttempts: number = 0;
  private isLocked: boolean = false;
  private lastActivity: number = Date.now();

  constructor() {
    this.encryptionConfig = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 32,
      iterations: 100000
    };

    this.securityPolicy = {
      requireBiometric: false,
      autoLockTimeout: 15, // 15分钟
      maxFailedAttempts: 5,
      requirePasswordComplexity: true,
      enableTransactionConfirmation: true,
      enableAddressWhitelist: false
    };

    this.startAutoLockTimer();
  }

  /**
   * 生成安全的随机助记词
   */
  generateMnemonic(strength: number = 128): string {
    if (![128, 160, 192, 224, 256].includes(strength)) {
      throw new Error('Invalid mnemonic strength');
    }
    return bip39.generateMnemonic(strength);
  }

  /**
   * 验证助记词
   */
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('密码长度至少8位');
    }

    // 包含大写字母
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含大写字母');
    }

    // 包含小写字母
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含小写字母');
    }

    // 包含数字
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含数字');
    }

    // 包含特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含特殊字符');
    }

    // 检查常见密码
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('不能使用常见密码');
    }

    const isValid = this.securityPolicy.requirePasswordComplexity ? score >= 4 : score >= 2;

    return {
      isValid,
      score,
      feedback
    };
  }

  /**
   * 从密码派生密钥
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.encryptionConfig.iterations,
      this.encryptionConfig.keyLength,
      'sha256'
    );
  }

  /**
   * 加密数据
   */
  encrypt(data: string, password: string): {
    encryptedData: string;
    salt: string;
    iv: string;
    authTag: string;
  } {
    try {
      const salt = crypto.randomBytes(this.encryptionConfig.saltLength);
      const iv = crypto.randomBytes(this.encryptionConfig.ivLength);
      const key = this.deriveKey(password, salt);

      const cipher = crypto.createCipheriv(this.encryptionConfig.algorithm, key, iv) as crypto.CipherGCM;
      cipher.setAAD(salt); // 使用salt作为附加认证数据

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error: any) {
      throw new Error(`加密失败: ${error.message}`);
    }
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string, password: string, salt: string, iv: string, authTag: string): string {
    try {
      const saltBuffer = Buffer.from(salt, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const key = this.deriveKey(password, saltBuffer);

      const decipher = crypto.createDecipheriv(this.encryptionConfig.algorithm, key, ivBuffer) as crypto.DecipherGCM;
      decipher.setAAD(saltBuffer);
      decipher.setAuthTag(authTagBuffer);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      throw new Error(`解密失败: ${error.message}`);
    }
  }

  /**
   * 创建钱包备份
   */
  createWalletBackup(walletData: any, password: string): WalletBackup {
    try {
      const dataString = JSON.stringify(walletData);
      const encrypted = this.encrypt(dataString, password);
      const checksum = crypto.createHash('sha256').update(dataString).digest('hex');

      const backup: WalletBackup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        encryptedData: JSON.stringify(encrypted),
        checksum,
        metadata: {
          walletCount: walletData.wallets ? Object.keys(walletData.wallets).length : 0,
          supportedChains: walletData.supportedChains || [],
          createdAt: new Date().toISOString()
        }
      };

      this.logSecurityEvent(SecurityEventType.BACKUP_CREATED, {
        walletCount: backup.metadata.walletCount,
        timestamp: backup.timestamp
      });

      return backup;
    } catch (error: any) {
      throw new Error(`创建备份失败: ${error.message}`);
    }
  }

  /**
   * 恢复钱包备份
   */
  restoreWalletBackup(backup: WalletBackup, password: string): any {
    try {
      const encrypted = JSON.parse(backup.encryptedData);
      const decryptedData = this.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv,
        encrypted.authTag
      );

      // 验证校验和
      const checksum = crypto.createHash('sha256').update(decryptedData).digest('hex');
      if (checksum !== backup.checksum) {
        throw new Error('备份数据校验失败');
      }

      const walletData = JSON.parse(decryptedData);

      this.logSecurityEvent(SecurityEventType.BACKUP_RESTORED, {
        version: backup.version,
        timestamp: backup.timestamp,
        walletCount: backup.metadata.walletCount
      });

      return walletData;
    } catch (error: any) {
      throw new Error(`恢复备份失败: ${error.message}`);
    }
  }

  /**
   * 生成安全哈希
   */
  generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * 验证数据完整性
   */
  verifyIntegrity(data: string, expectedHash: string, algorithm: string = 'sha256'): boolean {
    const actualHash = this.generateHash(data, algorithm);
    return actualHash === expectedHash;
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(type: SecurityEventType, details: any, riskLevel: 'low' | 'medium' | 'high' = 'low'): void {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      details,
      riskLevel
    };

    this.securityEvents.push(event);

    // 保持最近1000条记录
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // 高风险事件处理
    if (riskLevel === 'high') {
      this.handleHighRiskEvent(event);
    }
  }

  /**
   * 处理高风险事件
   */
  private handleHighRiskEvent(event: SecurityEvent): void {
    console.warn('High risk security event detected:', event);
    // 这里可以添加更多安全措施，如发送警报、锁定钱包等
  }

  /**
   * 获取安全事件历史
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * 验证登录尝试
   */
  validateLoginAttempt(password: string, storedHash: string): boolean {
    const isValid = this.verifyIntegrity(password, storedHash);
    
    if (isValid) {
      this.failedAttempts = 0;
      this.isLocked = false;
      this.updateActivity();
      this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, { timestamp: new Date().toISOString() });
    } else {
      this.failedAttempts++;
      this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, { 
        attempts: this.failedAttempts,
        timestamp: new Date().toISOString()
      }, 'medium');
      
      if (this.failedAttempts >= this.securityPolicy.maxFailedAttempts) {
        this.isLocked = true;
        this.logSecurityEvent(SecurityEventType.SECURITY_BREACH, {
          reason: 'Too many failed login attempts',
          attempts: this.failedAttempts
        }, 'high');
      }
    }

    return isValid && !this.isLocked;
  }

  /**
   * 检查是否被锁定
   */
  isWalletLocked(): boolean {
    return this.isLocked;
  }

  /**
   * 手动锁定钱包
   */
  lockWallet(): void {
    this.isLocked = true;
    this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, { 
      reason: 'Manual lock',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 解锁钱包
   */
  unlockWallet(password: string, storedHash: string): boolean {
    if (this.validateLoginAttempt(password, storedHash)) {
      this.isLocked = false;
      return true;
    }
    return false;
  }

  /**
   * 更新活动时间
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * 启动自动锁定计时器
   */
  private startAutoLockTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivity;
      const lockTimeout = this.securityPolicy.autoLockTimeout * 60 * 1000; // 转换为毫秒

      if (timeSinceLastActivity > lockTimeout && !this.isLocked) {
        this.lockWallet();
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 获取安全策略
   */
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy };
  }

  /**
   * 更新安全策略
   */
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy };
  }

  /**
   * 生成安全报告
   */
  generateSecurityReport(): {
    totalEvents: number;
    recentEvents: SecurityEvent[];
    riskSummary: { [key: string]: number };
    recommendations: string[];
  } {
    const recentEvents = this.getSecurityEvents(50);
    const riskSummary = recentEvents.reduce((acc, event) => {
      acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const recommendations: string[] = [];
    
    if (riskSummary.high > 0) {
      recommendations.push('检测到高风险事件，建议立即检查安全设置');
    }
    
    if (this.failedAttempts > 0) {
      recommendations.push('存在登录失败记录，建议更改密码');
    }
    
    if (!this.securityPolicy.requireBiometric) {
      recommendations.push('建议启用生物识别验证以提高安全性');
    }

    return {
      totalEvents: this.securityEvents.length,
      recentEvents,
      riskSummary,
      recommendations
    };
  }

  /**
   * 清除安全事件历史
   */
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * 重置失败尝试计数
   */
  resetFailedAttempts(): void {
    this.failedAttempts = 0;
  }
}