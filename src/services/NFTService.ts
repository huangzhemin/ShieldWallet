import { ChainConfig, TransactionResult } from '../types/chain';
import { MultiChainWalletManager } from './MultiChainWalletManager';

/**
 * NFT元数据接口
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
  animation_url?: string;
  background_color?: string;
}

/**
 * 扩展的NFT信息接口
 */
export interface ExtendedNFTInfo {
  tokenId: string;
  contractAddress: string;
  chainId: string;
  owner: string;
  tokenURI: string;
  metadata?: NFTMetadata;
  standard: 'ERC721' | 'ERC1155' | 'SPL' | 'APTOS';
  amount?: string; // For ERC1155
  lastTransferTime?: string;
  floorPrice?: string;
  collection?: {
    name: string;
    slug: string;
    verified: boolean;
  };
}

/**
 * NFT集合信息
 */
export interface NFTCollection {
  contractAddress: string;
  chainId: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  totalSupply: string;
  floorPrice?: string;
  volume24h?: string;
  verified: boolean;
  standard: 'ERC721' | 'ERC1155' | 'SPL' | 'APTOS';
  createdAt?: string;
  website?: string;
  discord?: string;
  twitter?: string;
}

/**
 * NFT转移参数
 */
export interface NFTTransferParams {
  chainId: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  amount?: string; // For ERC1155
}

/**
 * NFT铸造参数
 */
export interface NFTMintParams {
  chainId: string;
  contractAddress: string;
  to: string;
  tokenURI?: string;
  metadata?: NFTMetadata;
  amount?: string; // For ERC1155
}

/**
 * NFT批准参数
 */
export interface NFTApprovalParams {
  chainId: string;
  contractAddress: string;
  tokenId: string;
  spender: string;
  approved: boolean;
}

/**
 * NFT市场订单
 */
export interface NFTMarketOrder {
  orderId: string;
  marketplace: string;
  type: 'listing' | 'offer';
  nft: {
    contractAddress: string;
    tokenId: string;
    chainId: string;
  };
  price: string;
  currency: string;
  seller?: string;
  buyer?: string;
  expiration: string;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: string;
}

/**
 * NFT服务类
 */
export class NFTService {
  private walletManager: MultiChainWalletManager;
  private metadataCache: Map<string, NFTMetadata> = new Map();
  private collectionCache: Map<string, NFTCollection> = new Map();

  constructor(walletManager: MultiChainWalletManager) {
    this.walletManager = walletManager;
  }

  /**
   * 获取用户的NFT列表
   */
  async getUserNFTs(address: string, chainId: string): Promise<ExtendedNFTInfo[]> {
    const adapter = this.walletManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    try {
      const nfts = await adapter.getNFTs(address);
      
      // 转换为扩展NFT信息并获取元数据
      const extendedNfts = await Promise.all(
        nfts.map(async (nft) => {
          try {
            // 构造tokenURI（如果原始NFTInfo没有，需要从合约查询）
            const tokenURI = nft.image || ''; // 临时使用image字段
            const metadata = tokenURI ? await this.getNFTMetadata(tokenURI) : null;
            
            const extendedNft: ExtendedNFTInfo = {
               tokenId: nft.tokenId,
               contractAddress: nft.contractAddress,
               chainId: nft.chainId,
               owner: address, // 设置为查询的地址
               tokenURI: tokenURI,
               metadata: metadata || undefined,
               standard: 'ERC721', // 默认标准
             };
            
            return extendedNft;
          } catch (error) {
            console.warn(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error);
            // 返回基本信息
            return {
              tokenId: nft.tokenId,
              contractAddress: nft.contractAddress,
              chainId: nft.chainId,
              owner: address,
              tokenURI: nft.image || '',
              standard: 'ERC721' as const,
            };
          }
        })
      );

      return extendedNfts;
    } catch (error) {
      console.error(`Failed to fetch NFTs for ${address} on ${chainId}:`, error);
      throw error;
    }
  }

  /**
   * 获取NFT详细信息
   */
  async getNFTDetails(contractAddress: string, tokenId: string, chainId: string): Promise<ExtendedNFTInfo | null> {
    const adapter = this.walletManager.getAdapter(chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    try {
      // 这里需要实现具体的NFT详情查询逻辑
      // 暂时返回null
      return null;
    } catch (error) {
      console.error(`Failed to fetch NFT details:`, error);
      return null;
    }
  }

  /**
   * 获取NFT元数据
   */
  async getNFTMetadata(tokenURI: string): Promise<NFTMetadata | null> {
    if (!tokenURI) {
      return null;
    }

    // 检查缓存
    if (this.metadataCache.has(tokenURI)) {
      return this.metadataCache.get(tokenURI)!;
    }

    try {
      let url = tokenURI;
      
      // 处理IPFS URL
      if (tokenURI.startsWith('ipfs://')) {
        url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const metadata: NFTMetadata = await response.json();
      
      // 处理图片URL
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // 缓存元数据
      this.metadataCache.set(tokenURI, metadata);
      
      return metadata;
    } catch (error) {
      console.error(`Failed to fetch metadata from ${tokenURI}:`, error);
      return null;
    }
  }

  /**
   * 转移NFT
   */
  async transferNFT(params: NFTTransferParams): Promise<TransactionResult> {
    const adapter = this.walletManager.getAdapter(params.chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${params.chainId}`);
    }

    const wallet = this.walletManager.getWallet(params.chainId);
    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    // 验证发送者是否为当前钱包地址
    if (params.from.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('只能转移自己拥有的NFT');
    }

    // 验证接收地址
    if (!this.walletManager.validateAddress(params.chainId, params.to)) {
      throw new Error('无效的接收地址');
    }

    try {
      // 这里需要实现具体的NFT转移逻辑
      throw new Error('NFT transfer implementation needed');
    } catch (error) {
      console.error('NFT transfer failed:', error);
      throw error;
    }
  }

  /**
   * 批准NFT操作
   */
  async approveNFT(params: NFTApprovalParams): Promise<TransactionResult> {
    const adapter = this.walletManager.getAdapter(params.chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${params.chainId}`);
    }

    const wallet = this.walletManager.getWallet(params.chainId);
    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    try {
      // 这里需要实现具体的NFT批准逻辑
      throw new Error('NFT approval implementation needed');
    } catch (error) {
      console.error('NFT approval failed:', error);
      throw error;
    }
  }

  /**
   * 铸造NFT
   */
  async mintNFT(params: NFTMintParams): Promise<TransactionResult> {
    const adapter = this.walletManager.getAdapter(params.chainId);
    if (!adapter) {
      throw new Error(`不支持的链: ${params.chainId}`);
    }

    const wallet = this.walletManager.getWallet(params.chainId);
    if (!wallet) {
      throw new Error(`未找到${params.chainId}链的钱包`);
    }

    try {
      // 这里需要实现具体的NFT铸造逻辑
      throw new Error('NFT minting implementation needed');
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw error;
    }
  }

  /**
   * 获取NFT集合信息
   */
  async getCollectionInfo(contractAddress: string, chainId: string): Promise<NFTCollection | null> {
    const cacheKey = `${chainId}:${contractAddress}`;
    
    // 检查缓存
    if (this.collectionCache.has(cacheKey)) {
      return this.collectionCache.get(cacheKey)!;
    }

    try {
      // 这里需要实现具体的集合信息查询逻辑
      // 可以调用OpenSea API、Alchemy API等
      throw new Error('Collection info query implementation needed');
    } catch (error) {
      console.error('Failed to fetch collection info:', error);
      return null;
    }
  }

  /**
   * 搜索NFT集合
   */
  async searchCollections(query: string, chainId: string, limit: number = 20): Promise<NFTCollection[]> {
    try {
      // 这里需要实现具体的集合搜索逻辑
      throw new Error('Collection search implementation needed');
    } catch (error) {
      console.error('Collection search failed:', error);
      return [];
    }
  }

  /**
   * 获取NFT价格历史
   */
  async getNFTPriceHistory(contractAddress: string, tokenId: string, chainId: string, days: number = 30): Promise<{
    timestamp: string;
    price: string;
    currency: string;
    marketplace: string;
  }[]> {
    try {
      // 这里需要实现具体的价格历史查询逻辑
      throw new Error('NFT price history implementation needed');
    } catch (error) {
      console.error('Failed to fetch NFT price history:', error);
      return [];
    }
  }

  /**
   * 获取NFT市场订单
   */
  async getNFTMarketOrders(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMarketOrder[]> {
    try {
      // 这里需要实现具体的市场订单查询逻辑
      // 可以集成OpenSea、LooksRare、X2Y2等市场API
      throw new Error('NFT market orders implementation needed');
    } catch (error) {
      console.error('Failed to fetch NFT market orders:', error);
      return [];
    }
  }

  /**
   * 获取用户的NFT交易历史
   */
  async getUserNFTTransactions(address: string, chainId: string, limit: number = 50): Promise<{
    txHash: string;
    type: 'transfer' | 'mint' | 'burn' | 'sale' | 'offer';
    nft: {
      contractAddress: string;
      tokenId: string;
    };
    from: string;
    to: string;
    price?: string;
    currency?: string;
    marketplace?: string;
    timestamp: string;
  }[]> {
    try {
      // 这里需要实现具体的NFT交易历史查询逻辑
      throw new Error('NFT transaction history implementation needed');
    } catch (error) {
      console.error('Failed to fetch NFT transaction history:', error);
      return [];
    }
  }

  /**
   * 验证NFT所有权
   */
  async verifyNFTOwnership(contractAddress: string, tokenId: string, owner: string, chainId: string): Promise<boolean> {
    try {
      const adapter = this.walletManager.getAdapter(chainId);
      if (!adapter) {
        throw new Error(`不支持的链: ${chainId}`);
      }

      // 这里需要实现具体的所有权验证逻辑
      throw new Error('NFT ownership verification implementation needed');
    } catch (error) {
      console.error('NFT ownership verification failed:', error);
      return false;
    }
  }

  /**
   * 获取NFT稀有度信息
   */
  async getNFTRarity(contractAddress: string, tokenId: string, chainId: string): Promise<{
    rank: number;
    score: number;
    totalSupply: number;
    traits: {
      trait_type: string;
      value: string;
      rarity: number;
    }[];
  } | null> {
    try {
      // 这里需要实现具体的稀有度查询逻辑
      // 可以集成rarity.tools、trait_sniper等服务
      throw new Error('NFT rarity query implementation needed');
    } catch (error) {
      console.error('Failed to fetch NFT rarity:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.metadataCache.clear();
    this.collectionCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    metadataCount: number;
    collectionCount: number;
  } {
    return {
      metadataCount: this.metadataCache.size,
      collectionCount: this.collectionCache.size
    };
  }
}

export default NFTService;