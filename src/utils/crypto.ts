/**
 * 加密工具类 - 使用Web Crypto API
 */
export class CryptoUtils {
  /**
   * 使用密码加密数据
   */
  static async encrypt(data: string, password: string): Promise<string> {
    return this.encryptForBrowser(data, password);
  }

  /**
   * 使用密码解密数据
   */
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    return this.decryptForBrowser(encryptedData, password);
  }

  /**
   * 生成随机字节
   */
  static generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * 简单的哈希函数（用于浏览器环境）
   */
  static async simpleHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 生成随机盐
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const combinedData = new Uint8Array(passwordData.length + salt.length);
    combinedData.set(passwordData);
    combinedData.set(salt, passwordData.length);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', combinedData);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 浏览器环境下的加密函数
   */
  static async encryptForBrowser(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // 使用PBKDF2派生密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );
    
    // 组合salt + iv + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 浏览器环境下的解密函数
   */
  static async decryptForBrowser(encryptedHex: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // 将十六进制字符串转换为Uint8Array
    const encryptedData = new Uint8Array(
      encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const encrypted = encryptedData.slice(28);
    
    // 使用PBKDF2派生密钥
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  }

}