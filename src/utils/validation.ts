/**
 * 验证工具类
 */
export class ValidationUtils {
  /**
   * 验证以太坊地址格式
   */
  static isValidEthereumAddress(address: string): boolean {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * 验证私钥格式
   */
  static isValidPrivateKey(privateKey: string): boolean {
    const privateKeyRegex = /^0x[a-fA-F0-9]{64}$/;
    return privateKeyRegex.test(privateKey);
  }

  /**
   * 验证助记词
   */
  static isValidMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    
    // 检查单词数量（通常是12、15、18、21或24个单词）
    const validWordCounts = [12, 15, 18, 21, 24];
    if (!validWordCounts.includes(words.length)) {
      return false;
    }

    // 检查每个单词是否只包含字母
    const wordRegex = /^[a-zA-Z]+$/;
    return words.every(word => wordRegex.test(word));
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: '密码长度至少8位' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: '密码必须包含至少一个大写字母' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: '密码必须包含至少一个小写字母' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: '密码必须包含至少一个数字' };
    }

    return { isValid: true, message: '密码强度良好' };
  }

  /**
   * 验证金额格式
   */
  static isValidAmount(amount: string): boolean {
    const amountRegex = /^\d+(\.\d+)?$/;
    if (!amountRegex.test(amount)) {
      return false;
    }

    const numAmount = parseFloat(amount);
    return numAmount > 0 && numAmount < Number.MAX_SAFE_INTEGER;
  }

  /**
   * 验证Gas价格
   */
  static isValidGasPrice(gasPrice: string): boolean {
    const gasPriceRegex = /^\d+(\.\d+)?$/;
    if (!gasPriceRegex.test(gasPrice)) {
      return false;
    }

    const numGasPrice = parseFloat(gasPrice);
    return numGasPrice > 0 && numGasPrice <= 1000; // 最大1000 Gwei
  }

  /**
   * 清理和格式化地址
   */
  static formatAddress(address: string): string {
    return address.toLowerCase().trim();
  }

  /**
   * 缩短地址显示
   */
  static shortenAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (!this.isValidEthereumAddress(address)) {
      return address;
    }
    
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  /**
   * 验证网络ID
   */
  static isValidNetworkId(networkId: string): boolean {
    const validNetworks = ['1', '5', '11155111']; // 主网、Goerli、Sepolia
    return validNetworks.includes(networkId);
  }

  /**
   * 格式化金额显示
   */
  static formatAmount(amount: string, decimals: number = 6): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  }
}