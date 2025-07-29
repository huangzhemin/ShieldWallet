import { ChainManager } from './ChainManager';
import { ChainType, NFTInfo, TransactionParams } from '../types/chain';

/**
 * NFT元数据
 */
export interface NFTMetadata {
  name: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties?: {
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

/**
 * NFT集合信息
 */
export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  totalSupply: string;
  floorPrice?: string;
  chainId: string;
}

/**
 * NFT转移参数
 */
export interface NFTTransferParams {
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  chainId?: string;
}

/**
 * NFT市场数据
 */
export interface NFTMarketData {
  floorPrice: string;
  volume24h: string;
  volumeTotal: string;
  owners: number;
  totalSupply: number;
  listedCount: number;
}

/**
 * NFT服务
 * 提供多链NFT管理功能
 */
export class NFTService {
  private chainManager: ChainManager;
  private nftCache: Map<string, NFTInfo[]> = new Map();
  private metadataCache: Map<string, NFTMetadata> = new Map();

  constructor(chainManager: ChainManager) {
    this.chainManager = chainManager;
  }

  /**
   * 获取用户的所有NFT
   */
  async getUserNFTs(address: string, chainId?: string): Promise<NFTInfo[]> {
    try {
      if (chainId) {
        return this.getNFTsForChain(address, chainId);
      }

      // 获取所有链的NFT
      const allNFTs: NFTInfo[] = [];
      const supportedChains = this.chainManager.getSupportedChains();

      for (const chain of supportedChains) {
        try {
          const nfts = await this.getNFTsForChain(address, chain.id);
          allNFTs.push(...nfts);
        } catch (error: any) {
          console.warn(`获取${chain.id}链NFT失败:`, error.message);
        }
      }

      return allNFTs;
    } catch (error: any) {
      throw new Error(`获取用户NFT失败: ${error.message}`);
    }
  }

  /**
   * 获取特定链的NFT
   */
  private async getNFTsForChain(address: string, chainId: string): Promise<NFTInfo[]> {
    const cacheKey = `${address}_${chainId}`;
    
    // 检查缓存
    if (this.nftCache.has(cacheKey)) {
      const cached = this.nftCache.get(cacheKey)!;
      // 缓存5分钟
      if (Date.now() - (cached as any).timestamp < 5 * 60 * 1000) {
        return cached;
      }
    }

    try {
      const adapter = this.chainManager.getAdapter(chainId);
      const nfts = await adapter.getNFTs(address);
      
      // 获取NFT元数据
      const enrichedNFTs = await Promise.all(
        nfts.map(async (nft) => {
          try {
            const metadata = await this.getNFTMetadata(nft.contractAddress, nft.tokenId, chainId);
            return {
              ...nft,
              name: metadata.name || nft.name,
              description: metadata.description || nft.description,
              image: metadata.image || nft.image,
              attributes: metadata.attributes
            };
          } catch {
            return nft; // 如果获取元数据失败，返回原始NFT信息
          }
        })
      );

      // 缓存结果
      (enrichedNFTs as any).timestamp = Date.now();
      this.nftCache.set(cacheKey, enrichedNFTs);

      return enrichedNFTs;
    } catch (error: any) {
      throw new Error(`获取${chainId}链NFT失败: ${error.message}`);
    }
  }

  /**
   * 获取NFT元数据
   */
  async getNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata> {
    const cacheKey = `${chainId}_${contractAddress}_${tokenId}`;
    
    // 检查缓存
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey)!;
    }

    try {
      const chainType = this.chainManager.getChainType(chainId);
      let metadata: NFTMetadata;

      switch (chainType) {
        case ChainType.EVM:
          metadata = await this.getEVMNFTMetadata(contractAddress, tokenId, chainId);
          break;
        case ChainType.SOLANA:
          metadata = await this.getSolanaNFTMetadata(contractAddress, tokenId);
          break;
        case ChainType.APTOS:
          metadata = await this.getAptosNFTMetadata(contractAddress, tokenId);
          break;
        default:
          throw new Error(`不支持的链类型: ${chainType}`);
      }

      // 缓存元数据
      this.metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error: any) {
      throw new Error(`获取NFT元数据失败: ${error.message}`);
    }
  }

  /**
   * 获取EVM链NFT元数据
   */
  private async getEVMNFTMetadata(contractAddress: string, tokenId: string, chainId: string): Promise<NFTMetadata> {
    try {
      const adapter = this.chainManager.getAdapter(chainId) as any;
      
      // 调用ERC721的tokenURI方法
      const tokenURI = await adapter.callContract(contractAddress, 'tokenURI', [tokenId]);
      
      if (!tokenURI) {
        throw new Error('无法获取tokenURI');
      }

      // 处理IPFS链接
      const metadataUrl = this.resolveMetadataUrl(tokenURI);
      
      // 获取元数据
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const metadata = await response.json();
      return this.normalizeMetadata(metadata);
    } catch (error: any) {
      throw new Error(`获取EVM NFT元数据失败: ${error.message}`);
    }
  }

  /**
   * 获取Solana NFT元数据
   */
  private async getSolanaNFTMetadata(mintAddress: string, tokenId: string): Promise<NFTMetadata> {
    try {
      // 这里应该调用Metaplex SDK获取NFT元数据
      // 为了演示，返回模拟数据
      return {
        name: `Solana NFT #${tokenId}`,
        description: 'A unique Solana NFT',
        image: `https://example.com/solana-nft/${mintAddress}.png`,
        attributes: [
          { trait_type: 'Chain', value: 'Solana' },
          { trait_type: 'Type', value: 'Digital Art' }
        ]
      };
    } catch (error: any) {
      throw new Error(`获取Solana NFT元数据失败: ${error.message}`);
    }
  }

  /**
   * 获取Aptos NFT元数据
   */
  private async getAptosNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata> {
    try {
      // 这里应该调用Aptos Token SDK获取NFT元数据
      // 为了演示，返回模拟数据
      return {
        name: `Aptos NFT #${tokenId}`,
        description: 'A unique Aptos NFT',
        image: `https://example.com/aptos-nft/${contractAddress}.png`,
        attributes: [
          { trait_type: 'Chain', value: 'Aptos' },
          { trait_type: 'Type', value: 'Digital Collectible' }
        ]
      };
    } catch (error: any) {
      throw new Error(`获取Aptos NFT元数据失败: ${error.message}`);
    }
  }

  /**
   * 转移NFT
   */
  async transferNFT(params: NFTTransferParams, privateKey: string): Promise<string> {
    try {
      const chainId = params.chainId || this.chainManager.getCurrentChainId();
      const chainType = this.chainManager.getChainType(chainId);

      let txParams: TransactionParams;

      switch (chainType) {
        case ChainType.EVM:
          txParams = await this.buildEVMNFTTransfer(params);
          break;
        case ChainType.SOLANA:
          txParams = await this.buildSolanaNFTTransfer(params);
          break;
        case ChainType.APTOS:
          txParams = await this.buildAptosNFTTransfer(params);
          break;
        default:
          throw new Error(`不支持的链类型: ${chainType}`);
      }

      const result = await this.chainManager.sendTransaction(txParams, privateKey, chainId);
      
      // 清除相关缓存
      this.clearNFTCache(params.from, chainId);
      this.clearNFTCache(params.to, chainId);

      return result.hash;
    } catch (error: any) {
      throw new Error(`转移NFT失败: ${error.message}`);
    }
  }

  /**
   * 构建EVM NFT转移交易
   */
  private async buildEVMNFTTransfer(params: NFTTransferParams): Promise<TransactionParams> {
    // ERC721 safeTransferFrom方法
    const methodSignature = '0x42842e0e'; // safeTransferFrom(address,address,uint256)
    const fromAddress = params.from.replace('0x', '').padStart(64, '0');
    const toAddress = params.to.replace('0x', '').padStart(64, '0');
    const tokenId = parseInt(params.tokenId).toString(16).padStart(64, '0');
    
    const data = methodSignature + fromAddress + toAddress + tokenId;

    return {
      to: params.contractAddress,
      value: '0',
      data
    };
  }

  /**
   * 构建Solana NFT转移交易
   */
  private async buildSolanaNFTTransfer(params: NFTTransferParams): Promise<TransactionParams> {
    // Solana NFT转移需要构建特定的指令
    return {
      to: params.contractAddress,
      value: '0',
      data: '' // 这里应该构建Solana NFT转移指令
    };
  }

  /**
   * 构建Aptos NFT转移交易
   */
  private async buildAptosNFTTransfer(params: NFTTransferParams): Promise<TransactionParams> {
    // Aptos NFT转移
    return {
      to: params.contractAddress,
      value: '0',
      data: '' // 这里应该构建Aptos NFT转移载荷
    };
  }

  /**
   * 获取NFT集合信息
   */
  async getNFTCollection(contractAddress: string, chainId?: string): Promise<NFTCollection> {
    try {
      const currentChainId = chainId || this.chainManager.getCurrentChainId();
      const chainType = this.chainManager.getChainType(currentChainId);

      switch (chainType) {
        case ChainType.EVM:
          return this.getEVMNFTCollection(contractAddress, currentChainId);
        case ChainType.SOLANA:
          return this.getSolanaNFTCollection(contractAddress, currentChainId);
        case ChainType.APTOS:
          return this.getAptosNFTCollection(contractAddress, currentChainId);
        default:
          throw new Error(`不支持的链类型: ${chainType}`);
      }
    } catch (error: any) {
      throw new Error(`获取NFT集合信息失败: ${error.message}`);
    }
  }

  /**
   * 获取EVM NFT集合信息
   */
  private async getEVMNFTCollection(contractAddress: string, chainId: string): Promise<NFTCollection> {
    try {
      const adapter = this.chainManager.getAdapter(chainId) as any;
      
      // 调用ERC721合约方法
      const [name, symbol, totalSupply] = await Promise.all([
        adapter.callContract(contractAddress, 'name', []),
        adapter.callContract(contractAddress, 'symbol', []),
        adapter.callContract(contractAddress, 'totalSupply', []).catch(() => '0')
      ]);

      return {
        address: contractAddress,
        name: name || 'Unknown Collection',
        symbol: symbol || 'UNKNOWN',
        totalSupply: totalSupply || '0',
        chainId
      };
    } catch (error: any) {
      throw new Error(`获取EVM NFT集合信息失败: ${error.message}`);
    }
  }

  /**
   * 获取Solana NFT集合信息
   */
  private async getSolanaNFTCollection(contractAddress: string, chainId: string): Promise<NFTCollection> {
    // 这里应该调用Metaplex SDK获取集合信息
    return {
      address: contractAddress,
      name: 'Solana Collection',
      symbol: 'SOL_NFT',
      totalSupply: '0',
      chainId
    };
  }

  /**
   * 获取Aptos NFT集合信息
   */
  private async getAptosNFTCollection(contractAddress: string, chainId: string): Promise<NFTCollection> {
    // 这里应该调用Aptos Token SDK获取集合信息
    return {
      address: contractAddress,
      name: 'Aptos Collection',
      symbol: 'APT_NFT',
      totalSupply: '0',
      chainId
    };
  }

  /**
   * 获取NFT市场数据
   */
  async getNFTMarketData(contractAddress: string, chainId?: string): Promise<NFTMarketData> {
    try {
      // 这里应该调用NFT市场API（如OpenSea、Magic Eden等）
      // 为了演示，返回模拟数据
      return {
        floorPrice: '0.1',
        volume24h: '10.5',
        volumeTotal: '1250.8',
        owners: 850,
        totalSupply: 1000,
        listedCount: 45
      };
    } catch (error: any) {
      throw new Error(`获取NFT市场数据失败: ${error.message}`);
    }
  }

  /**
   * 搜索NFT
   */
  async searchNFTs(query: string, chainId?: string): Promise<NFTInfo[]> {
    try {
      // 这里应该实现NFT搜索功能
      // 可以搜索集合名称、NFT名称、属性等
      const allNFTs: NFTInfo[] = [];
      
      if (chainId) {
        // 搜索特定链
        const nfts = this.nftCache.get(`search_${chainId}`) || [];
        allNFTs.push(...nfts.filter(nft => 
          nft.name?.toLowerCase().includes(query.toLowerCase()) ||
          nft.description?.toLowerCase().includes(query.toLowerCase())
        ));
      } else {
        // 搜索所有链
        for (const [key, nfts] of this.nftCache.entries()) {
          if (key.startsWith('search_')) continue;
          allNFTs.push(...nfts.filter(nft => 
            nft.name?.toLowerCase().includes(query.toLowerCase()) ||
            nft.description?.toLowerCase().includes(query.toLowerCase())
          ));
        }
      }

      return allNFTs;
    } catch (error: any) {
      throw new Error(`搜索NFT失败: ${error.message}`);
    }
  }

  /**
   * 获取NFT历史记录
   */
  async getNFTHistory(contractAddress: string, tokenId: string, chainId?: string): Promise<any[]> {
    try {
      const currentChainId = chainId || this.chainManager.getCurrentChainId();
      
      // 这里应该调用区块链浏览器API或索引服务获取NFT历史
      // 为了演示，返回模拟数据
      return [
        {
          type: 'transfer',
          from: '0x1234...5678',
          to: '0x8765...4321',
          txHash: '0xabcd...efgh',
          timestamp: Date.now() - 86400000,
          price: '0.5'
        },
        {
          type: 'mint',
          to: '0x1234...5678',
          txHash: '0x1234...abcd',
          timestamp: Date.now() - 172800000,
          price: '0'
        }
      ];
    } catch (error: any) {
      throw new Error(`获取NFT历史失败: ${error.message}`);
    }
  }

  /**
   * 解析元数据URL
   */
  private resolveMetadataUrl(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (uri.startsWith('ar://')) {
      return uri.replace('ar://', 'https://arweave.net/');
    }
    return uri;
  }

  /**
   * 标准化元数据格式
   */
  private normalizeMetadata(metadata: any): NFTMetadata {
    return {
      name: metadata.name || 'Unnamed NFT',
      description: metadata.description,
      image: this.resolveMetadataUrl(metadata.image || ''),
      animation_url: metadata.animation_url ? this.resolveMetadataUrl(metadata.animation_url) : undefined,
      external_url: metadata.external_url,
      attributes: metadata.attributes || metadata.traits || [],
      properties: metadata.properties
    };
  }

  /**
   * 清除NFT缓存
   */
  private clearNFTCache(address: string, chainId: string): void {
    const cacheKey = `${address}_${chainId}`;
    this.nftCache.delete(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.nftCache.clear();
    this.metadataCache.clear();
  }

  /**
   * 验证NFT所有权
   */
  async verifyNFTOwnership(contractAddress: string, tokenId: string, ownerAddress: string, chainId?: string): Promise<boolean> {
    try {
      const currentChainId = chainId || this.chainManager.getCurrentChainId();
      const chainType = this.chainManager.getChainType(currentChainId);

      if (chainType === ChainType.EVM) {
        const adapter = this.chainManager.getAdapter(currentChainId) as any;
        const owner = await adapter.callContract(contractAddress, 'ownerOf', [tokenId]);
        return owner.toLowerCase() === ownerAddress.toLowerCase();
      }

      // 对于其他链类型，需要实现相应的验证逻辑
      return false;
    } catch (error: any) {
      throw new Error(`验证NFT所有权失败: ${error.message}`);
    }
  }
}