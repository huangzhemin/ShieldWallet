import { ethers } from 'ethers';
import { ChainConfig, ChainType, NFTInfo } from '../types/chain';

/**
 * NFT服务类
 * 处理非同质化代币相关功能
 */
export class NFTService {
  private provider: ethers.Provider | null = null;
  private chainConfig: ChainConfig | null = null;

  /**
   * 初始化NFT服务
   */
  async initialize(chainConfig: ChainConfig): Promise<void> {
    this.chainConfig = chainConfig;
    if (chainConfig.type === ChainType.EVM) {
      this.provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    }
  }

  /**
   * 获取用户的NFT列表
   */
  async getUserNFTs(address: string): Promise<NFTInfo[]> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    // 实现NFT查询逻辑
    // 这里可以集成OpenSea API、Alchemy NFT API等
    return [];
  }

  /**
   * 获取NFT详细信息
   */
  async getNFTDetails(contractAddress: string, tokenId: string): Promise<NFTInfo | null> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      // 实现NFT详情查询逻辑
      // 调用合约的tokenURI方法获取元数据
      const contract = new ethers.Contract(
        contractAddress,
        ['function tokenURI(uint256 tokenId) view returns (string)'],
        this.provider
      );

      const tokenURI = await contract.tokenURI(tokenId);
      
      // 获取元数据
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      return {
        tokenId,
        contractAddress,
        name: metadata.name || '',
        description: metadata.description || '',
        image: metadata.image || '',
        attributes: metadata.attributes || [],
        chainId: this.chainConfig.id
      };
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      return null;
    }
  }

  /**
   * 转移NFT
   */
  async transferNFT(
    contractAddress: string,
    tokenId: string,
    from: string,
    to: string,
    privateKey: string
  ): Promise<string> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function transferFrom(address from, address to, uint256 tokenId)',
          'function safeTransferFrom(address from, address to, uint256 tokenId)'
        ],
        wallet
      );

      const tx = await contract.safeTransferFrom(from, to, tokenId);
      return tx.hash;
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  }

  /**
   * 批准NFT操作
   */
  async approveNFT(
    contractAddress: string,
    tokenId: string,
    spender: string,
    privateKey: string
  ): Promise<string> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(
        contractAddress,
        ['function approve(address to, uint256 tokenId)'],
        wallet
      );

      const tx = await contract.approve(spender, tokenId);
      return tx.hash;
    } catch (error) {
      console.error('Error approving NFT:', error);
      throw error;
    }
  }

  /**
   * 设置全部批准
   */
  async setApprovalForAll(
    contractAddress: string,
    operator: string,
    approved: boolean,
    privateKey: string
  ): Promise<string> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = new ethers.Contract(
        contractAddress,
        ['function setApprovalForAll(address operator, bool approved)'],
        wallet
      );

      const tx = await contract.setApprovalForAll(operator, approved);
      return tx.hash;
    } catch (error) {
      console.error('Error setting approval for all:', error);
      throw error;
    }
  }

  /**
   * 获取NFT所有者
   */
  async getNFTOwner(contractAddress: string, tokenId: string): Promise<string> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        ['function ownerOf(uint256 tokenId) view returns (address)'],
        this.provider
      );

      return await contract.ownerOf(tokenId);
    } catch (error) {
      console.error('Error getting NFT owner:', error);
      throw error;
    }
  }

  /**
   * 检查NFT批准状态
   */
  async getApproved(contractAddress: string, tokenId: string): Promise<string> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        ['function getApproved(uint256 tokenId) view returns (address)'],
        this.provider
      );

      return await contract.getApproved(tokenId);
    } catch (error) {
      console.error('Error getting approved address:', error);
      throw error;
    }
  }

  /**
   * 检查全部批准状态
   */
  async isApprovedForAll(contractAddress: string, owner: string, operator: string): Promise<boolean> {
    if (!this.provider || !this.chainConfig) {
      throw new Error('NFT service not initialized');
    }

    try {
      const contract = new ethers.Contract(
        contractAddress,
        ['function isApprovedForAll(address owner, address operator) view returns (bool)'],
        this.provider
      );

      return await contract.isApprovedForAll(owner, operator);
    } catch (error) {
      console.error('Error checking approval for all:', error);
      throw error;
    }
  }
}

export default NFTService;