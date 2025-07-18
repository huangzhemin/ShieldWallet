/**
 * 网络配置接口
 */
interface NetworkConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  blockExplorerUrl: string;
}

/**
 * 网络服务类
 */
export class NetworkService {
  // 支持的网络配置
  static readonly NETWORKS: { [key: string]: NetworkConfig } = {
    '1': {
      id: '1',
      name: '以太坊主网',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      chainId: 1,
      symbol: 'ETH',
      blockExplorerUrl: 'https://etherscan.io'
    },
    '5': {
      id: '5',
      name: 'Goerli测试网',
      rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
      chainId: 5,
      symbol: 'ETH',
      blockExplorerUrl: 'https://goerli.etherscan.io'
    },
    '11155111': {
      id: '11155111',
      name: 'Sepolia测试网',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      chainId: 11155111,
      symbol: 'ETH',
      blockExplorerUrl: 'https://sepolia.etherscan.io'
    }
  };

  private static currentNetworkId: string = '1';

  /**
   * 获取当前网络配置
   */
  static getCurrentNetwork(): NetworkConfig {
    return this.NETWORKS[this.currentNetworkId];
  }

  /**
   * 设置当前网络
   */
  static setCurrentNetwork(networkId: string): void {
    if (this.NETWORKS[networkId]) {
      this.currentNetworkId = networkId;
    } else {
      throw new Error(`不支持的网络ID: ${networkId}`);
    }
  }

  /**
   * 获取所有支持的网络
   */
  static getAllNetworks(): NetworkConfig[] {
    return Object.values(this.NETWORKS);
  }

  /**
   * 发送RPC请求
   */
  static async sendRpcRequest(method: string, params: any[] = []): Promise<any> {
    const network = this.getCurrentNetwork();
    
    const response = await fetch(network.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`网络请求失败: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC错误: ${data.error.message}`);
    }

    return data.result;
  }

  /**
   * 获取账户余额
   */
  static async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.sendRpcRequest('eth_getBalance', [address, 'latest']);
      // 将wei转换为ETH
      return this.weiToEth(balance);
    } catch (error) {
      console.error('获取余额失败:', error);
      return '0';
    }
  }

  /**
   * 获取交易数量（nonce）
   */
  static async getTransactionCount(address: string): Promise<number> {
    const count = await this.sendRpcRequest('eth_getTransactionCount', [address, 'latest']);
    return parseInt(count, 16);
  }

  /**
   * 获取Gas价格
   */
  static async getGasPrice(): Promise<string> {
    const gasPrice = await this.sendRpcRequest('eth_gasPrice');
    return this.weiToGwei(gasPrice);
  }

  /**
   * 估算Gas限制
   */
  static async estimateGas(transaction: any): Promise<string> {
    const gasLimit = await this.sendRpcRequest('eth_estimateGas', [transaction]);
    return parseInt(gasLimit, 16).toString();
  }

  /**
   * 发送原始交易
   */
  static async sendRawTransaction(signedTransaction: string): Promise<string> {
    return await this.sendRpcRequest('eth_sendRawTransaction', [signedTransaction]);
  }

  /**
   * 获取交易详情
   */
  static async getTransaction(txHash: string): Promise<any> {
    return await this.sendRpcRequest('eth_getTransactionByHash', [txHash]);
  }

  /**
   * 获取交易收据
   */
  static async getTransactionReceipt(txHash: string): Promise<any> {
    return await this.sendRpcRequest('eth_getTransactionReceipt', [txHash]);
  }

  /**
   * 获取当前区块号
   */
  static async getBlockNumber(): Promise<number> {
    const blockNumber = await this.sendRpcRequest('eth_blockNumber');
    return parseInt(blockNumber, 16);
  }

  /**
   * Wei转ETH
   */
  static weiToEth(wei: string): string {
    const weiValue = BigInt(wei);
    const ethValue = Number(weiValue) / Math.pow(10, 18);
    return ethValue.toFixed(6);
  }

  /**
   * ETH转Wei
   */
  static ethToWei(eth: string): string {
    const ethValue = parseFloat(eth);
    const weiValue = BigInt(Math.floor(ethValue * Math.pow(10, 18)));
    return '0x' + weiValue.toString(16);
  }

  /**
   * Wei转Gwei
   */
  static weiToGwei(wei: string): string {
    const weiValue = BigInt(wei);
    const gweiValue = Number(weiValue) / Math.pow(10, 9);
    return gweiValue.toFixed(2);
  }

  /**
   * Gwei转Wei
   */
  static gweiToWei(gwei: string): string {
    const gweiValue = parseFloat(gwei);
    const weiValue = BigInt(Math.floor(gweiValue * Math.pow(10, 9)));
    return '0x' + weiValue.toString(16);
  }

  /**
   * 获取区块浏览器交易URL
   */
  static getTransactionUrl(txHash: string): string {
    const network = this.getCurrentNetwork();
    return `${network.blockExplorerUrl}/tx/${txHash}`;
  }

  /**
   * 获取区块浏览器地址URL
   */
  static getAddressUrl(address: string): string {
    const network = this.getCurrentNetwork();
    return `${network.blockExplorerUrl}/address/${address}`;
  }

  /**
   * 检查网络连接
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await this.getBlockNumber();
      return true;
    } catch (error) {
      console.error('网络连接检查失败:', error);
      return false;
    }
  }
}