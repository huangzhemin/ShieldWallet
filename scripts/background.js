/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 1281:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 5340:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 7746:
/***/ ((__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) => {

"use strict";

;// ./src/utils/crypto.ts
/**
 * 加密工具类 - 使用Web Crypto API
 */
class CryptoUtils {
    /**
     * 使用密码加密数据
     */
    static async encrypt(data, password) {
        return this.encryptForBrowser(data, password);
    }
    /**
     * 使用密码解密数据
     */
    static async decrypt(encryptedData, password) {
        return this.decryptForBrowser(encryptedData, password);
    }
    /**
     * 生成随机字节
     */
    static generateRandomBytes(length) {
        return crypto.getRandomValues(new Uint8Array(length));
    }
    /**
     * 简单的哈希函数（用于浏览器环境）
     */
    static async simpleHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    /**
     * 生成随机盐
     */
    static generateSalt() {
        return crypto.getRandomValues(new Uint8Array(32));
    }
    /**
     * 哈希密码
     */
    static async hashPassword(password, salt) {
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
    static async encryptForBrowser(data, password) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        // 使用PBKDF2派生密钥
        const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
        const key = await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: 10000,
            hash: 'SHA-256'
        }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encoder.encode(data));
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
    static async decryptForBrowser(encryptedHex, password) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        // 将十六进制字符串转换为Uint8Array
        const encryptedData = new Uint8Array(encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 28);
        const encrypted = encryptedData.slice(28);
        // 使用PBKDF2派生密钥
        const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
        const key = await crypto.subtle.deriveKey({
            name: 'PBKDF2',
            salt: salt,
            iterations: 10000,
            hash: 'SHA-256'
        }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);
        return decoder.decode(decrypted);
    }
}

;// ./src/utils/validation.ts
/**
 * 验证工具类
 */
class ValidationUtils {
    /**
     * 验证以太坊地址格式
     */
    static isValidEthereumAddress(address) {
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethAddressRegex.test(address);
    }
    /**
     * 验证私钥格式
     */
    static isValidPrivateKey(privateKey) {
        const privateKeyRegex = /^0x[a-fA-F0-9]{64}$/;
        return privateKeyRegex.test(privateKey);
    }
    /**
     * 验证助记词
     */
    static isValidMnemonic(mnemonic) {
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
    static isStrongPassword(password) {
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
    static isValidAmount(amount) {
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
    static isValidGasPrice(gasPrice) {
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
    static formatAddress(address) {
        return address.toLowerCase().trim();
    }
    /**
     * 缩短地址显示
     */
    static shortenAddress(address, startLength = 6, endLength = 4) {
        if (!this.isValidEthereumAddress(address)) {
            return address;
        }
        return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
    }
    /**
     * 验证网络ID
     */
    static isValidNetworkId(networkId) {
        const validNetworks = ['1', '5', '11155111']; // 主网、Goerli、Sepolia
        return validNetworks.includes(networkId);
    }
    /**
     * 格式化金额显示
     */
    static formatAmount(amount, decimals = 6) {
        const num = parseFloat(amount);
        if (isNaN(num))
            return '0';
        return num.toFixed(decimals).replace(/\.?0+$/, '');
    }
}

;// ./src/services/storage.ts
/**
 * Chrome扩展存储服务
 */
class StorageService {
    /**
     * 保存数据到Chrome存储
     */
    static async set(key, value) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * 从Chrome存储获取数据
     */
    static async get(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(result[key]);
                }
            });
        });
    }
    /**
     * 从Chrome存储删除数据
     */
    static async remove(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([key], () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * 清空所有存储数据
     */
    static async clear() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * 获取所有存储的键值对
     */
    static async getAll() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    /**
     * 保存钱包数据
     */
    static async saveWallet(walletData) {
        await this.set(this.WALLET_KEY, walletData);
    }
    /**
     * 获取钱包数据
     */
    static async getWallet() {
        return await this.get(this.WALLET_KEY);
    }
    /**
     * 删除钱包数据
     */
    static async removeWallet() {
        await this.remove(this.WALLET_KEY);
    }
    /**
     * 保存设置
     */
    static async saveSettings(settings) {
        await this.set(this.SETTINGS_KEY, settings);
    }
    /**
     * 获取设置
     */
    static async getSettings() {
        const defaultSettings = {
            autoLock: true,
            lockTimeout: 15, // 分钟
            showTestNetworks: false,
            currency: 'USD'
        };
        const settings = await this.get(this.SETTINGS_KEY);
        return { ...defaultSettings, ...settings };
    }
    /**
     * 保存当前网络
     */
    static async saveCurrentNetwork(networkId) {
        await this.set(this.NETWORK_KEY, networkId);
    }
    /**
     * 获取当前网络
     */
    static async getCurrentNetwork() {
        const network = await this.get(this.NETWORK_KEY);
        return network || '1'; // 默认主网
    }
    /**
     * 保存自定义代币
     */
    static async saveCustomTokens(tokens) {
        await this.set(this.TOKENS_KEY, tokens);
    }
    /**
     * 获取自定义代币
     */
    static async getCustomTokens() {
        const tokens = await this.get(this.TOKENS_KEY);
        return tokens || [];
    }
    /**
     * 保存交易历史
     */
    static async saveTransactionHistory(transactions) {
        await this.set(this.TRANSACTIONS_KEY, transactions);
    }
    /**
     * 获取交易历史
     */
    static async getTransactionHistory() {
        const transactions = await this.get(this.TRANSACTIONS_KEY);
        return transactions || [];
    }
    /**
     * 添加交易到历史记录
     */
    static async addTransaction(transaction) {
        const transactions = await this.getTransactionHistory();
        transactions.unshift(transaction); // 添加到开头
        // 只保留最近100条交易
        if (transactions.length > 100) {
            transactions.splice(100);
        }
        await this.saveTransactionHistory(transactions);
    }
}
// 钱包相关的存储键
StorageService.WALLET_KEY = 'wallet_data';
StorageService.SETTINGS_KEY = 'wallet_settings';
StorageService.NETWORK_KEY = 'current_network';
StorageService.TOKENS_KEY = 'custom_tokens';
StorageService.TRANSACTIONS_KEY = 'transaction_history';

;// ./src/services/network.ts
/**
 * 网络服务类
 */
class NetworkService {
    /**
     * 获取当前网络配置
     */
    static getCurrentNetwork() {
        return this.NETWORKS[this.currentNetworkId];
    }
    /**
     * 设置当前网络
     */
    static setCurrentNetwork(networkId) {
        if (this.NETWORKS[networkId]) {
            this.currentNetworkId = networkId;
        }
        else {
            throw new Error(`不支持的网络ID: ${networkId}`);
        }
    }
    /**
     * 获取所有支持的网络
     */
    static getAllNetworks() {
        return Object.values(this.NETWORKS);
    }
    /**
     * 发送RPC请求
     */
    static async sendRpcRequest(method, params = []) {
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
    static async getBalance(address) {
        try {
            const balance = await this.sendRpcRequest('eth_getBalance', [address, 'latest']);
            // 将wei转换为ETH
            return this.weiToEth(balance);
        }
        catch (error) {
            console.error('获取余额失败:', error);
            return '0';
        }
    }
    /**
     * 获取交易数量（nonce）
     */
    static async getTransactionCount(address) {
        const count = await this.sendRpcRequest('eth_getTransactionCount', [address, 'latest']);
        return parseInt(count, 16);
    }
    /**
     * 获取Gas价格
     */
    static async getGasPrice() {
        const gasPrice = await this.sendRpcRequest('eth_gasPrice');
        return this.weiToGwei(gasPrice);
    }
    /**
     * 估算Gas限制
     */
    static async estimateGas(transaction) {
        const gasLimit = await this.sendRpcRequest('eth_estimateGas', [transaction]);
        return parseInt(gasLimit, 16).toString();
    }
    /**
     * 发送原始交易
     */
    static async sendRawTransaction(signedTransaction) {
        return await this.sendRpcRequest('eth_sendRawTransaction', [signedTransaction]);
    }
    /**
     * 获取交易详情
     */
    static async getTransaction(txHash) {
        return await this.sendRpcRequest('eth_getTransactionByHash', [txHash]);
    }
    /**
     * 获取交易收据
     */
    static async getTransactionReceipt(txHash) {
        return await this.sendRpcRequest('eth_getTransactionReceipt', [txHash]);
    }
    /**
     * 获取当前区块号
     */
    static async getBlockNumber() {
        const blockNumber = await this.sendRpcRequest('eth_blockNumber');
        return parseInt(blockNumber, 16);
    }
    /**
     * Wei转ETH
     */
    static weiToEth(wei) {
        const weiValue = BigInt(wei);
        const ethValue = Number(weiValue) / Math.pow(10, 18);
        return ethValue.toFixed(6);
    }
    /**
     * ETH转Wei
     */
    static ethToWei(eth) {
        const ethValue = parseFloat(eth);
        const weiValue = BigInt(Math.floor(ethValue * Math.pow(10, 18)));
        return '0x' + weiValue.toString(16);
    }
    /**
     * Wei转Gwei
     */
    static weiToGwei(wei) {
        const weiValue = BigInt(wei);
        const gweiValue = Number(weiValue) / Math.pow(10, 9);
        return gweiValue.toFixed(2);
    }
    /**
     * Gwei转Wei
     */
    static gweiToWei(gwei) {
        const gweiValue = parseFloat(gwei);
        const weiValue = BigInt(Math.floor(gweiValue * Math.pow(10, 9)));
        return '0x' + weiValue.toString(16);
    }
    /**
     * 获取区块浏览器交易URL
     */
    static getTransactionUrl(txHash) {
        const network = this.getCurrentNetwork();
        return `${network.blockExplorerUrl}/tx/${txHash}`;
    }
    /**
     * 获取区块浏览器地址URL
     */
    static getAddressUrl(address) {
        const network = this.getCurrentNetwork();
        return `${network.blockExplorerUrl}/address/${address}`;
    }
    /**
     * 检查网络连接
     */
    static async checkConnection() {
        try {
            await this.getBlockNumber();
            return true;
        }
        catch (error) {
            console.error('网络连接检查失败:', error);
            return false;
        }
    }
}
// 支持的网络配置
NetworkService.NETWORKS = {
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
NetworkService.currentNetworkId = '1';

;// ./src/types/chain.ts
/**
 * 链类型枚举
 */
var ChainType;
(function (ChainType) {
    ChainType["EVM"] = "evm";
    ChainType["SOLANA"] = "solana";
    ChainType["APTOS"] = "aptos";
})(ChainType || (ChainType = {}));
/**
 * 网络类别枚举
 */
var NetworkCategory;
(function (NetworkCategory) {
    NetworkCategory["MAINNET"] = "mainnet";
    NetworkCategory["TESTNET"] = "testnet";
    NetworkCategory["LAYER2"] = "layer2";
})(NetworkCategory || (NetworkCategory = {}));

// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/providers/provider-jsonrpc.js + 13 modules
var provider_jsonrpc = __webpack_require__(5642);
// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/wallet/hdwallet.js + 3 modules
var hdwallet = __webpack_require__(1187);
// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/utils/units.js + 1 modules
var units = __webpack_require__(9770);
// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/contract/contract.js + 2 modules
var contract_contract = __webpack_require__(2724);
// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/wallet/wallet.js + 1 modules
var wallet_wallet = __webpack_require__(4532);
// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/address/checks.js
var checks = __webpack_require__(1442);
// EXTERNAL MODULE: ./node_modules/bip39/src/index.js
var src = __webpack_require__(749);
;// ./src/adapters/BaseAdapter.ts

/**
 * 链适配器抽象基类
 * 提供通用的钱包生成和验证功能
 */
class BaseAdapter {
    constructor(config) {
        this.config = config;
    }
    getChainConfig() {
        return this.config;
    }
    /**
     * 验证助记词
     */
    validateMnemonic(mnemonic) {
        return src/* validateMnemonic */.JB(mnemonic);
    }
    /**
     * 从助记词生成种子
     */
    async generateSeed(mnemonic) {
        if (!this.validateMnemonic(mnemonic)) {
            throw new Error('无效的助记词');
        }
        return await src/* mnemonicToSeed */.nl(mnemonic);
    }
    /**
     * 格式化余额显示
     */
    formatBalance(balance, decimals) {
        const balanceNum = parseFloat(balance);
        return (balanceNum / Math.pow(10, decimals)).toFixed(6);
    }
    /**
     * 解析金额到最小单位
     */
    parseAmount(amount, decimals) {
        const amountNum = parseFloat(amount);
        return (amountNum * Math.pow(10, decimals)).toString();
    }
}

;// ./src/adapters/EVMAdapter.ts


/**
 * EVM链适配器
 * 支持以太坊、Polygon、Arbitrum、zkSync等EVM兼容链
 */
class EVMAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            // 从助记词生成种子
            const seed = await this.generateSeed(mnemonic);
            // 创建HD钱包
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            // 派生指定路径的钱包
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取账户余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取余额失败: ${error.message}`);
        }
    }
    /**
     * 获取代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            // ERC-20代币ABI（简化版）
            const erc20ABI = [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)'
            ];
            const contract = new contract_contract/* Contract */.NZ(tokenAddress, erc20ABI, this.provider);
            const balance = await contract.balanceOf(address);
            const decimals = await contract.decimals();
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用
     */
    async estimateGas(params) {
        try {
            const transaction = {
                to: params.to,
                value: units/* parseEther */.g5(params.value),
                data: params.data || '0x'
            };
            // 估算Gas限制
            const gasLimit = await this.provider.estimateGas(transaction);
            // 获取Gas价格
            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('20', 'gwei');
            // 计算总费用
            const estimatedCost = units/* formatEther */.ck(gasLimit * gasPrice);
            const result = {
                gasLimit: gasLimit.toString(),
                gasPrice: gasPrice.toString(),
                estimatedCost
            };
            // EIP-1559支持
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                result.maxFeePerGas = feeData.maxFeePerGas.toString();
                result.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
            }
            return result;
        }
        catch (error) {
            throw new Error(`Gas估算失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            // 创建钱包实例
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            // 构建交易
            const transaction = {
                to: params.to,
                value: units/* parseEther */.g5(params.value)
            };
            // 设置Gas参数
            if (params.gasLimit) {
                transaction.gasLimit = params.gasLimit;
            }
            if (params.gasPrice) {
                transaction.gasPrice = params.gasPrice;
            }
            else if (params.maxFeePerGas && params.maxPriorityFeePerGas) {
                transaction.maxFeePerGas = params.maxFeePerGas;
                transaction.maxPriorityFeePerGas = params.maxPriorityFeePerGas;
            }
            if (params.data) {
                transaction.data = params.data;
            }
            if (params.nonce !== undefined) {
                transaction.nonce = params.nonce;
            }
            // 发送交易
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里需要集成第三方NFT API，如OpenSea、Alchemy等
            // 简化实现，实际项目中需要调用相应的API
            const nfts = [];
            // TODO: 实现NFT查询逻辑
            // 可以使用Alchemy NFT API、OpenSea API等
            return nfts;
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里需要集成区块链浏览器API
            // 如Etherscan API、Polygonscan API等
            const transactions = [];
            // TODO: 实现交易历史查询
            return transactions;
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 获取代币信息
     */
    async getTokenInfo(tokenAddress) {
        try {
            const erc20ABI = [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)',
                'function totalSupply() view returns (uint256)'
            ];
            const contract = new contract_contract/* Contract */.NZ(tokenAddress, erc20ABI, this.provider);
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);
            return {
                address: tokenAddress,
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString(),
                chainId: this.config.id
            };
        }
        catch (error) {
            throw new Error(`获取代币信息失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易执行
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: units/* parseEther */.g5(params.value),
                data: params.data || '0x'
            };
            // 使用静态调用模拟交易
            const result = await this.provider.call(transaction);
            return {
                success: true,
                result,
                gasEstimate: await this.estimateGas(params)
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                gasEstimate: null
            };
        }
    }
}

// EXTERNAL MODULE: ./node_modules/@solana/web3.js/lib/index.browser.esm.js + 22 modules
var index_browser_esm = __webpack_require__(6189);
// EXTERNAL MODULE: ./node_modules/@solana/spl-token/lib/esm/state/mint.js
var mint = __webpack_require__(1498);
// EXTERNAL MODULE: ./node_modules/@solana/spl-token/lib/esm/state/account.js + 2 modules
var account = __webpack_require__(4545);
// EXTERNAL MODULE: ./node_modules/@solana/spl-token/lib/esm/constants.js
var constants = __webpack_require__(9215);
// EXTERNAL MODULE: ./node_modules/ed25519-hd-key/dist/index.js
var dist = __webpack_require__(7680);
// EXTERNAL MODULE: ./node_modules/bs58/index.js
var bs58 = __webpack_require__(6763);
var bs58_default = /*#__PURE__*/__webpack_require__.n(bs58);
// EXTERNAL MODULE: ./node_modules/tweetnacl/nacl-fast.js
var nacl_fast = __webpack_require__(8947);
var nacl_fast_default = /*#__PURE__*/__webpack_require__.n(nacl_fast);
;// ./src/adapters/SolanaAdapter.ts






/**
 * Solana链适配器
 */
class SolanaAdapter {
    constructor(config) {
        this.config = config;
        this.connection = new index_browser_esm/* Connection */.Ng(config.rpcUrl, 'confirmed');
    }
    getChainConfig() {
        return this.config;
    }
    /**
     * 从助记词生成Solana钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/501'/0'/0'") {
        try {
            // 验证助记词
            if (!src/* validateMnemonic */.JB(mnemonic)) {
                throw new Error('无效的助记词');
            }
            // 从助记词生成种子
            const seed = await src/* mnemonicToSeed */.nl(mnemonic);
            // 派生私钥
            const derivedSeed = (0,dist.derivePath)(derivationPath, seed.toString('hex')).key;
            // 创建密钥对
            const keypair = nacl_fast_default().sign.keyPair.fromSeed(derivedSeed);
            // 创建Solana密钥对
            const solanaKeypair = index_browser_esm/* Keypair */.AX.fromSecretKey(keypair.secretKey);
            return {
                address: solanaKeypair.publicKey.toBase58(),
                privateKey: bs58_default().encode(solanaKeypair.secretKey)
            };
        }
        catch (error) {
            throw new Error(`生成Solana钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取SOL余额
     */
    async getBalance(address) {
        try {
            const publicKey = new index_browser_esm/* PublicKey */.J3(address);
            const balance = await this.connection.getBalance(publicKey);
            return (balance / index_browser_esm/* LAMPORTS_PER_SOL */.Sr).toString();
        }
        catch (error) {
            throw new Error(`获取SOL余额失败: ${error.message}`);
        }
    }
    /**
     * 获取SPL代币余额
     */
    async getTokenBalance(address, tokenMintAddress) {
        try {
            const publicKey = new index_browser_esm/* PublicKey */.J3(address);
            const tokenMint = new index_browser_esm/* PublicKey */.J3(tokenMintAddress);
            // 获取关联代币账户地址
            const associatedTokenAddress = await (0,mint/* getAssociatedTokenAddress */.Ob)(tokenMint, publicKey);
            try {
                // 获取代币账户信息
                const tokenAccount = await (0,account/* getAccount */.sU)(this.connection, associatedTokenAddress);
                // 获取代币精度
                const mintInfo = await this.connection.getParsedAccountInfo(tokenMint);
                const decimals = mintInfo.value?.data?.parsed?.info?.decimals || 0;
                const balance = Number(tokenAccount.amount) / Math.pow(10, decimals);
                return balance.toString();
            }
            catch {
                // 如果代币账户不存在，返回0
                return '0';
            }
        }
        catch (error) {
            throw new Error(`获取SPL代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算交易费用
     */
    async estimateGas(params) {
        try {
            // Solana使用固定的交易费用结构
            const recentBlockhash = await this.connection.getLatestBlockhash();
            // 创建模拟交易
            const fromPubkey = new index_browser_esm/* PublicKey */.J3(params.to); // 临时使用to地址作为from
            const toPubkey = new index_browser_esm/* PublicKey */.J3(params.to);
            const lamports = Math.floor(parseFloat(params.value) * index_browser_esm/* LAMPORTS_PER_SOL */.Sr);
            const transaction = new index_browser_esm/* Transaction */.ZX({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: fromPubkey
            });
            transaction.add(index_browser_esm/* SystemProgram */.yq.transfer({
                fromPubkey,
                toPubkey,
                lamports
            }));
            // 获取交易费用
            const fee = await this.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
            const estimatedCost = (fee.value || 5000) / index_browser_esm/* LAMPORTS_PER_SOL */.Sr;
            return {
                gasLimit: '1',
                gasPrice: fee.value?.toString() || '5000',
                estimatedCost: estimatedCost.toString()
            };
        }
        catch (error) {
            throw new Error(`估算Solana交易费用失败: ${error.message}`);
        }
    }
    /**
     * 发送SOL交易
     */
    async sendTransaction(params, privateKey) {
        try {
            // 从私钥创建密钥对
            const secretKey = bs58_default().decode(privateKey);
            const keypair = index_browser_esm/* Keypair */.AX.fromSecretKey(secretKey);
            const toPubkey = new index_browser_esm/* PublicKey */.J3(params.to);
            const lamports = Math.floor(parseFloat(params.value) * index_browser_esm/* LAMPORTS_PER_SOL */.Sr);
            // 获取最新区块哈希
            const recentBlockhash = await this.connection.getLatestBlockhash();
            // 创建交易
            const transaction = new index_browser_esm/* Transaction */.ZX({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: keypair.publicKey
            });
            transaction.add(index_browser_esm/* SystemProgram */.yq.transfer({
                fromPubkey: keypair.publicKey,
                toPubkey,
                lamports
            }));
            // 签名并发送交易
            const signature = await (0,index_browser_esm/* sendAndConfirmTransaction */.El)(this.connection, transaction, [keypair], {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed'
            });
            return {
                hash: signature,
                status: 'confirmed'
            };
        }
        catch (error) {
            throw new Error(`发送Solana交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const status = await this.connection.getSignatureStatus(hash);
            if (!status.value) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            const confirmationStatus = status.value.confirmationStatus;
            let txStatus;
            if (status.value.err) {
                txStatus = 'failed';
            }
            else if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
                txStatus = 'confirmed';
            }
            else {
                txStatus = 'pending';
            }
            return {
                hash,
                status: txStatus,
                blockNumber: status.value.slot
            };
        }
        catch (error) {
            throw new Error(`获取Solana交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            const publicKey = new index_browser_esm/* PublicKey */.J3(address);
            // 获取所有代币账户
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: constants/* TOKEN_PROGRAM_ID */.x5
            });
            const nfts = [];
            // 筛选NFT（余额为1且精度为0的代币）
            for (const tokenAccount of tokenAccounts.value) {
                const accountData = tokenAccount.account.data.parsed.info;
                if (accountData.tokenAmount.decimals === 0 && accountData.tokenAmount.uiAmount === 1) {
                    // 这是一个NFT
                    const mintAddress = accountData.mint;
                    // TODO: 获取NFT元数据
                    // 需要查询Metaplex程序获取NFT详细信息
                    nfts.push({
                        tokenId: mintAddress,
                        contractAddress: mintAddress,
                        name: `Solana NFT ${mintAddress.slice(0, 8)}`,
                        chainId: this.config.id
                    });
                }
            }
            return nfts;
        }
        catch (error) {
            throw new Error(`获取Solana NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证Solana地址格式
     */
    validateAddress(address) {
        try {
            new index_browser_esm/* PublicKey */.J3(address);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, limit = 20) {
        try {
            const publicKey = new index_browser_esm/* PublicKey */.J3(address);
            const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit });
            const transactions = [];
            for (const sig of signatures) {
                const tx = await this.connection.getParsedTransaction(sig.signature);
                if (tx) {
                    transactions.push({
                        hash: sig.signature,
                        blockTime: sig.blockTime,
                        slot: sig.slot,
                        status: sig.err ? 'failed' : 'confirmed',
                        fee: tx.meta?.fee
                    });
                }
            }
            return transactions;
        }
        catch (error) {
            throw new Error(`获取Solana交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易执行
     */
    async simulateTransaction(params, fromAddress) {
        try {
            const fromPubkey = new index_browser_esm/* PublicKey */.J3(fromAddress);
            const toPubkey = new index_browser_esm/* PublicKey */.J3(params.to);
            const lamports = Math.floor(parseFloat(params.value) * index_browser_esm/* LAMPORTS_PER_SOL */.Sr);
            // 获取最新区块哈希
            const recentBlockhash = await this.connection.getLatestBlockhash();
            // 创建交易
            const transaction = new index_browser_esm/* Transaction */.ZX({
                recentBlockhash: recentBlockhash.blockhash,
                feePayer: fromPubkey
            });
            transaction.add(index_browser_esm/* SystemProgram */.yq.transfer({
                fromPubkey,
                toPubkey,
                lamports
            }));
            // 模拟交易
            const simulation = await this.connection.simulateTransaction(transaction);
            return {
                success: !simulation.value.err,
                error: simulation.value.err?.toString(),
                logs: simulation.value.logs,
                unitsConsumed: simulation.value.unitsConsumed
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// EXTERNAL MODULE: ./node_modules/aptos/dist/index.mjs + 66 modules
var aptos_dist = __webpack_require__(741);
;// ./src/adapters/AptosAdapter.ts



/**
 * Aptos链适配器
 */
class AptosAdapter {
    constructor(config) {
        this.config = config;
        this.client = new aptos_dist/* AptosClient */.HN(config.rpcUrl);
        this.coinClient = new aptos_dist/* CoinClient */.P0(this.client);
        this.tokenClient = new aptos_dist/* TokenClient */.J(this.client);
    }
    getChainConfig() {
        return this.config;
    }
    /**
     * 从助记词生成Aptos钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/637'/0'/0'/0'") {
        try {
            // 验证助记词
            if (!src/* validateMnemonic */.JB(mnemonic)) {
                throw new Error('无效的助记词');
            }
            // 从助记词生成种子
            const seed = await src/* mnemonicToSeed */.nl(mnemonic);
            // 派生私钥
            const derivedSeed = (0,dist.derivePath)(derivationPath, seed.toString('hex')).key;
            // 创建Aptos账户
            const account = new aptos_dist/* AptosAccount */.dI(derivedSeed);
            return {
                address: account.address().hex(),
                privateKey: account.toPrivateKeyObject().privateKeyHex
            };
        }
        catch (error) {
            throw new Error(`生成Aptos钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取APT余额
     */
    async getBalance(address) {
        try {
            const balance = await this.coinClient.checkBalance(address);
            // APT使用8位小数
            return (Number(balance) / Math.pow(10, 8)).toString();
        }
        catch (error) {
            throw new Error(`获取APT余额失败: ${error.message}`);
        }
    }
    /**
     * 获取代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            // 获取账户资源
            const resources = await this.client.getAccountResources(address);
            // 查找特定代币的余额
            const coinStore = resources.find((resource) => resource.type === `0x1::coin::CoinStore<${tokenAddress}>`);
            if (!coinStore) {
                return '0';
            }
            const balance = coinStore.data.coin.value;
            // 获取代币信息以确定小数位数
            try {
                const coinInfo = await this.client.getAccountResource(tokenAddress.split('::')[0], `0x1::coin::CoinInfo<${tokenAddress}>`);
                const decimals = coinInfo.data.decimals;
                return (Number(balance) / Math.pow(10, decimals)).toString();
            }
            catch {
                // 如果无法获取小数位数，假设为8位
                return (Number(balance) / Math.pow(10, 8)).toString();
            }
        }
        catch (error) {
            throw new Error(`获取Aptos代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算交易费用
     */
    async estimateGas(params) {
        try {
            // 创建临时账户用于模拟
            const tempAccount = new aptos_dist/* AptosAccount */.dI();
            // 构建转账交易载荷
            const rawTxn = await this.client.generateTransaction(tempAccount.address(), {
                function: '0x1::coin::transfer',
                type_arguments: ['0x1::aptos_coin::AptosCoin'],
                arguments: [
                    params.to,
                    Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
                ]
            });
            // 模拟交易以获取Gas估算
            const simulation = await this.client.simulateTransaction(tempAccount, rawTxn);
            const gasUsed = simulation[0]?.gas_used || '1000';
            const gasUnitPrice = simulation[0]?.gas_unit_price || '100';
            const estimatedCost = (Number(gasUsed) * Number(gasUnitPrice)) / Math.pow(10, 8);
            return {
                gasLimit: gasUsed,
                gasPrice: gasUnitPrice,
                estimatedCost: estimatedCost.toString()
            };
        }
        catch (error) {
            // 如果模拟失败，返回默认值
            return {
                gasLimit: '1000',
                gasPrice: '100',
                estimatedCost: '0.0001'
            };
        }
    }
    /**
     * 发送APT交易
     */
    async sendTransaction(params, privateKey) {
        try {
            // 从私钥创建账户
            const account = new aptos_dist/* AptosAccount */.dI(Buffer.from(privateKey.replace('0x', ''), 'hex'));
            // 构建转账交易载荷
            const payload = {
                type: 'entry_function_payload',
                function: '0x1::coin::transfer',
                type_arguments: ['0x1::aptos_coin::AptosCoin'],
                arguments: [
                    params.to,
                    Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
                ]
            };
            // 提交交易
            const txnRequest = await this.client.generateTransaction(account.address(), payload);
            const signedTxn = await this.client.signTransaction(account, txnRequest);
            const transactionRes = await this.client.submitTransaction(signedTxn);
            // 等待交易确认
            await this.client.waitForTransaction(transactionRes.hash);
            return {
                hash: transactionRes.hash,
                status: 'confirmed'
            };
        }
        catch (error) {
            throw new Error(`发送Aptos交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const transaction = await this.client.getTransactionByHash(hash);
            let status;
            // 检查交易类型和状态
            if (transaction.type === 'pending_transaction') {
                status = 'pending';
            }
            else if (transaction.type === 'user_transaction') {
                status = transaction.success ? 'confirmed' : 'failed';
            }
            else {
                status = 'confirmed';
            }
            return {
                hash,
                status,
                blockNumber: transaction.version || undefined
            };
        }
        catch (error) {
            // 如果交易不存在，可能还在pending状态
            return {
                hash,
                status: 'pending'
            };
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // Aptos NFT查询需要使用不同的API
            // 这里返回空数组，实际实现需要使用Aptos Indexer API
            const nfts = [];
            // TODO: 实现Aptos NFT查询
            // 可以使用Aptos Indexer API或其他NFT查询服务
            return nfts;
        }
        catch (error) {
            console.error('获取Aptos NFT失败:', error.message);
            return [];
        }
    }
    /**
     * 验证Aptos地址格式
     */
    validateAddress(address) {
        try {
            // Aptos地址是64位十六进制字符串，可能带0x前缀
            const cleanAddress = address.replace('0x', '');
            return /^[0-9a-fA-F]{64}$/.test(cleanAddress) || /^[0-9a-fA-F]{1,64}$/.test(cleanAddress);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, limit = 20) {
        try {
            const transactions = await this.client.getAccountTransactions(address, {
                limit
            });
            return transactions.map((tx) => ({
                hash: tx.hash,
                version: tx.version,
                timestamp: tx.timestamp,
                success: tx.success,
                gasUsed: tx.gas_used,
                gasUnitPrice: tx.gas_unit_price,
                type: tx.type
            }));
        }
        catch (error) {
            throw new Error(`获取Aptos交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易执行
     */
    async simulateTransaction(params, fromAddress) {
        try {
            // 创建临时账户用于模拟
            const tempAccount = new aptos_dist/* AptosAccount */.dI();
            // 构建转账交易载荷
            const rawTxn = await this.client.generateTransaction(tempAccount.address(), {
                function: '0x1::coin::transfer',
                type_arguments: ['0x1::aptos_coin::AptosCoin'],
                arguments: [
                    params.to,
                    Math.floor(parseFloat(params.value) * Math.pow(10, 8)).toString()
                ]
            });
            // 模拟交易
            const simulation = await this.client.simulateTransaction(tempAccount, rawTxn);
            const result = simulation[0];
            return {
                success: result.success,
                gasUsed: result.gas_used,
                gasUnitPrice: result.gas_unit_price,
                vmStatus: result.vm_status,
                changes: result.changes
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

;// ./src/config/chains.ts

/**
 * 支持的区块链网络配置
 */
const CHAIN_CONFIGS = {
    // EVM 主网
    'ethereum': {
        id: 'ethereum',
        name: '以太坊主网',
        type: ChainType.EVM,
        category: NetworkCategory.MAINNET,
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
        chainId: 1,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://etherscan.io',
        iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        isTestnet: false
    },
    'polygon': {
        id: 'polygon',
        name: 'Polygon主网',
        type: ChainType.EVM,
        category: NetworkCategory.LAYER2,
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        symbol: 'MATIC',
        decimals: 18,
        blockExplorerUrl: 'https://polygonscan.com',
        iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        isTestnet: false
    },
    'bsc': {
        id: 'bsc',
        name: 'BSC主网',
        type: ChainType.EVM,
        category: NetworkCategory.MAINNET,
        rpcUrl: 'https://bsc-dataseed1.binance.org',
        chainId: 56,
        symbol: 'BNB',
        decimals: 18,
        blockExplorerUrl: 'https://bscscan.com',
        iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        isTestnet: false
    },
    // Layer 2
    'arbitrum': {
        id: 'arbitrum',
        name: 'Arbitrum One',
        type: ChainType.EVM,
        category: NetworkCategory.LAYER2,
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        chainId: 42161,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://arbiscan.io',
        iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
        isTestnet: false
    },
    'optimism': {
        id: 'optimism',
        name: 'Optimism',
        type: ChainType.EVM,
        category: NetworkCategory.LAYER2,
        rpcUrl: 'https://mainnet.optimism.io',
        chainId: 10,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://optimistic.etherscan.io',
        iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
        isTestnet: false
    },
    'zksync': {
        id: 'zksync',
        name: 'zkSync Era',
        type: ChainType.EVM,
        category: NetworkCategory.LAYER2,
        rpcUrl: 'https://mainnet.era.zksync.io',
        chainId: 324,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://explorer.zksync.io',
        iconUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
        isTestnet: false
    },
    // 非EVM链
    'solana': {
        id: 'solana',
        name: 'Solana主网',
        type: ChainType.SOLANA,
        category: NetworkCategory.MAINNET,
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        symbol: 'SOL',
        decimals: 9,
        blockExplorerUrl: 'https://explorer.solana.com',
        iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        isTestnet: false
    },
    'aptos': {
        id: 'aptos',
        name: 'Aptos主网',
        type: ChainType.APTOS,
        category: NetworkCategory.MAINNET,
        rpcUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
        symbol: 'APT',
        decimals: 8,
        blockExplorerUrl: 'https://explorer.aptoslabs.com',
        iconUrl: 'https://cryptologos.cc/logos/aptos-apt-logo.png',
        isTestnet: false
    },
    // 测试网
    'ethereum-goerli': {
        id: 'ethereum-goerli',
        name: 'Ethereum Goerli',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/demo',
        chainId: 5,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://goerli.etherscan.io',
        iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        isTestnet: true
    },
    'ethereum-sepolia': {
        id: 'ethereum-sepolia',
        name: 'Sepolia测试网',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
        chainId: 11155111,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://sepolia.etherscan.io',
        iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        isTestnet: true
    },
    'polygon-mumbai': {
        id: 'polygon-mumbai',
        name: 'Mumbai测试网',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        symbol: 'MATIC',
        decimals: 18,
        blockExplorerUrl: 'https://mumbai.polygonscan.com',
        iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        isTestnet: true
    },
    'arbitrum-goerli': {
        id: 'arbitrum-goerli',
        name: 'Arbitrum Goerli',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
        chainId: 421613,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://goerli.arbiscan.io',
        iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
        isTestnet: true
    },
    'optimism-goerli': {
        id: 'optimism-goerli',
        name: 'Optimism Goerli',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://goerli.optimism.io',
        chainId: 420,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://goerli-optimism.etherscan.io',
        iconUrl: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
        isTestnet: true
    },
    'zksync-testnet': {
        id: 'zksync-testnet',
        name: 'zkSync Era Testnet',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://testnet.era.zksync.dev',
        chainId: 280,
        symbol: 'ETH',
        decimals: 18,
        blockExplorerUrl: 'https://goerli.explorer.zksync.io',
        iconUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
        isTestnet: true
    },
    'bsc-testnet': {
        id: 'bsc-testnet',
        name: 'BSC Testnet',
        type: ChainType.EVM,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        chainId: 97,
        symbol: 'BNB',
        decimals: 18,
        blockExplorerUrl: 'https://testnet.bscscan.com',
        iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        isTestnet: true
    },
    'solana-devnet': {
        id: 'solana-devnet',
        name: 'Solana开发网',
        type: ChainType.SOLANA,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://api.devnet.solana.com',
        symbol: 'SOL',
        decimals: 9,
        blockExplorerUrl: 'https://explorer.solana.com?cluster=devnet',
        iconUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        isTestnet: true
    },
    'aptos-testnet': {
        id: 'aptos-testnet',
        name: 'Aptos测试网',
        type: ChainType.APTOS,
        category: NetworkCategory.TESTNET,
        rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
        symbol: 'APT',
        decimals: 8,
        blockExplorerUrl: 'https://explorer.aptoslabs.com/?network=testnet',
        iconUrl: 'https://cryptologos.cc/logos/aptos-apt-logo.png',
        isTestnet: true
    }
};
/**
 * 支持的链列表
 */
const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS);
/**
 * 获取所有支持的链
 */
function getAllChains() {
    return Object.values(CHAIN_CONFIGS);
}
/**
 * 根据类型获取链
 */
function getChainsByType(type) {
    return Object.values(CHAIN_CONFIGS).filter(chain => chain.type === type);
}
/**
 * 根据类别获取链
 */
function getChainsByCategory(category) {
    return Object.values(CHAIN_CONFIGS).filter(chain => chain.category === category);
}
/**
 * 获取主网链
 */
function getMainnetChains() {
    return Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet);
}
/**
 * 获取测试网链
 */
function getTestnetChains() {
    return Object.values(CHAIN_CONFIGS).filter(chain => chain.isTestnet);
}
/**
 * 根据链ID获取配置
 */
function getChainConfig(chainId) {
    return CHAIN_CONFIGS[chainId];
}
/**
 * 检查是否支持指定链
 */
function isSupportedChain(chainId) {
    return chainId in CHAIN_CONFIGS;
}

;// ./src/services/ChainManager.ts





/**
 * 多链管理器
 * 统一管理所有区块链适配器
 */
class ChainManager {
    constructor() {
        this.adapters = new Map();
        this.currentChainId = 'ethereum';
        this.initializeAdapters();
    }
    /**
     * 初始化所有链适配器
     */
    initializeAdapters() {
        Object.values(CHAIN_CONFIGS).forEach((chainConfig) => {
            let adapter;
            switch (chainConfig.type) {
                case ChainType.EVM:
                    adapter = new EVMAdapter(chainConfig);
                    break;
                case ChainType.SOLANA:
                    adapter = new SolanaAdapter(chainConfig);
                    break;
                case ChainType.APTOS:
                    adapter = new AptosAdapter(chainConfig);
                    break;
                default:
                    console.warn(`不支持的链类型: ${chainConfig.type}`);
                    return;
            }
            this.adapters.set(chainConfig.id, adapter);
        });
    }
    /**
     * 获取当前链适配器
     */
    getCurrentAdapter() {
        const adapter = this.adapters.get(this.currentChainId);
        if (!adapter) {
            throw new Error(`未找到链适配器: ${this.currentChainId}`);
        }
        return adapter;
    }
    /**
     * 获取指定链的适配器
     */
    getAdapter(chainId) {
        const adapter = this.adapters.get(chainId);
        if (!adapter) {
            throw new Error(`未找到链适配器: ${chainId}`);
        }
        return adapter;
    }
    /**
     * 切换当前链
     */
    switchChain(chainId) {
        if (!this.adapters.has(chainId)) {
            throw new Error(`不支持的链: ${chainId}`);
        }
        this.currentChainId = chainId;
    }
    /**
     * 获取当前链ID
     */
    getCurrentChainId() {
        return this.currentChainId;
    }
    /**
     * 获取当前链配置
     */
    getCurrentChainConfig() {
        return this.getCurrentAdapter().getChainConfig();
    }
    /**
     * 获取所有支持的链
     */
    getSupportedChains() {
        return Object.values(CHAIN_CONFIGS);
    }
    /**
     * 检查是否支持指定链
     */
    isChainSupported(chainId) {
        return this.adapters.has(chainId);
    }
    /**
     * 从助记词生成多链钱包
     */
    async generateMultiChainWallet(mnemonic) {
        const wallets = {};
        for (const [chainId, adapter] of this.adapters) {
            try {
                const wallet = await adapter.generateWallet(mnemonic);
                wallets[chainId] = wallet;
            }
            catch (error) {
                console.error(`生成${chainId}钱包失败:`, error.message);
            }
        }
        return wallets;
    }
    /**
     * 获取多链余额
     */
    async getMultiChainBalances(addresses) {
        const balances = {};
        for (const [chainId, address] of Object.entries(addresses)) {
            try {
                const adapter = this.getAdapter(chainId);
                const balance = await adapter.getBalance(address);
                balances[chainId] = balance;
            }
            catch (error) {
                console.error(`获取${chainId}余额失败:`, error.message);
                balances[chainId] = '0';
            }
        }
        return balances;
    }
    /**
     * 获取当前链余额
     */
    async getBalance(address) {
        return this.getCurrentAdapter().getBalance(address);
    }
    /**
     * 获取代币余额
     */
    async getTokenBalance(address, tokenAddress, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.getTokenBalance(address, tokenAddress);
    }
    /**
     * 估算交易费用
     */
    async estimateGas(params, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.estimateGas(params);
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.sendTransaction(params, privateKey);
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.getTransactionStatus(hash);
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.getNFTs(address);
    }
    /**
     * 获取多链NFT
     */
    async getMultiChainNFTs(addresses) {
        const allNFTs = [];
        for (const [chainId, address] of Object.entries(addresses)) {
            try {
                const adapter = this.getAdapter(chainId);
                const nfts = await adapter.getNFTs(address);
                allNFTs.push(...nfts);
            }
            catch (error) {
                console.error(`获取${chainId} NFT失败:`, error.message);
            }
        }
        return allNFTs;
    }
    /**
     * 验证地址格式
     */
    validateAddress(address, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.validateAddress(address);
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, limit = 20, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        if ('getTransactionHistory' in adapter) {
            return adapter.getTransactionHistory(address, limit);
        }
        throw new Error('当前链不支持交易历史查询');
    }
    /**
     * 模拟交易执行
     */
    async simulateTransaction(params, fromAddress, chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        if ('simulateTransaction' in adapter) {
            return adapter.simulateTransaction(params, fromAddress);
        }
        throw new Error('当前链不支持交易模拟');
    }
    /**
     * 获取链类型
     */
    getChainType(chainId) {
        const adapter = chainId ? this.getAdapter(chainId) : this.getCurrentAdapter();
        return adapter.getChainConfig().type;
    }
    /**
     * 检查是否为EVM链
     */
    isEVMChain(chainId) {
        return this.getChainType(chainId) === ChainType.EVM;
    }
    /**
     * 检查是否为Solana链
     */
    isSolanaChain(chainId) {
        return this.getChainType(chainId) === ChainType.SOLANA;
    }
    /**
     * 检查是否为Aptos链
     */
    isAptosChain(chainId) {
        return this.getChainType(chainId) === ChainType.APTOS;
    }
    /**
     * 获取链的原生代币符号
     */
    getNativeTokenSymbol(chainId) {
        const config = chainId ? this.getAdapter(chainId).getChainConfig() : this.getCurrentChainConfig();
        return config.symbol || 'ETH';
    }
    /**
     * 获取链的原生代币精度
     */
    getNativeTokenDecimals(chainId) {
        const config = chainId ? this.getAdapter(chainId).getChainConfig() : this.getCurrentChainConfig();
        return 18; // 默认18位小数
    }
    /**
     * 格式化金额
     */
    formatAmount(amount, decimals, chainId) {
        const tokenDecimals = decimals || this.getNativeTokenDecimals(chainId);
        const num = parseFloat(amount);
        return num.toFixed(Math.min(tokenDecimals, 6));
    }
    /**
     * 解析金额（从用户输入转换为最小单位）
     */
    parseAmount(amount, decimals, chainId) {
        const tokenDecimals = decimals || this.getNativeTokenDecimals(chainId);
        const num = parseFloat(amount);
        return Math.floor(num * Math.pow(10, tokenDecimals)).toString();
    }
}
// 导出单例实例
const chainManager = new ChainManager();

;// ./src/services/DeFiService.ts


/**
 * DeFi服务类
 * 处理去中心化金融相关功能
 */
class DeFiService {
    constructor() {
        this.provider = null;
        this.chainConfig = null;
    }
    /**
     * 初始化DeFi服务
     */
    async initialize(chainConfig) {
        this.chainConfig = chainConfig;
        if (chainConfig.type === ChainType.EVM) {
            this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(chainConfig.rpcUrl);
        }
    }
    /**
     * 获取代币价格
     */
    async getTokenPrice(tokenAddress) {
        // 实现代币价格查询逻辑
        // 这里可以集成价格API如CoinGecko、CoinMarketCap等
        return 0;
    }
    /**
     * 获取流动性池信息
     */
    async getLiquidityPools(tokenAddress) {
        // 实现流动性池查询逻辑
        return [];
    }
    /**
     * 执行代币交换
     */
    async swapTokens(fromToken, toToken, amount, slippage = 0.5) {
        // 实现代币交换逻辑
        throw new Error('Token swap not implemented');
    }
    /**
     * 添加流动性
     */
    async addLiquidity(tokenA, tokenB, amountA, amountB) {
        // 实现添加流动性逻辑
        throw new Error('Add liquidity not implemented');
    }
    /**
     * 移除流动性
     */
    async removeLiquidity(tokenA, tokenB, liquidity) {
        // 实现移除流动性逻辑
        throw new Error('Remove liquidity not implemented');
    }
    /**
     * 获取收益农场信息
     */
    async getYieldFarms() {
        // 实现收益农场查询逻辑
        return [];
    }
    /**
     * 质押代币
     */
    async stakeTokens(poolAddress, amount) {
        // 实现代币质押逻辑
        throw new Error('Token staking not implemented');
    }
    /**
     * 取消质押
     */
    async unstakeTokens(poolAddress, amount) {
        // 实现取消质押逻辑
        throw new Error('Token unstaking not implemented');
    }
    /**
     * 获取质押奖励
     */
    async getStakingRewards(poolAddress, userAddress) {
        // 实现质押奖励查询逻辑
        return '0';
    }
    /**
     * 领取质押奖励
     */
    async claimRewards(poolAddress) {
        // 实现奖励领取逻辑
        throw new Error('Claim rewards not implemented');
    }
}
/* harmony default export */ const services_DeFiService = ((/* unused pure expression or super */ null && (DeFiService)));

;// ./src/services/BridgeService.ts

/**
 * 跨链桥服务
 * 支持多种跨链协议和路径
 */
class BridgeService {
    constructor(chainManager, priceService, gasService) {
        this.bridgeProtocols = [];
        this.bridgeTransactions = new Map();
        this.statusCheckInterval = null;
        this.chainManager = chainManager;
        this.priceService = priceService;
        this.gasService = gasService;
        this.initializeBridgeProtocols();
        this.startStatusMonitoring();
    }
    /**
     * 初始化跨链桥协议
     */
    initializeBridgeProtocols() {
        this.bridgeProtocols = [
            {
                id: 'wormhole',
                name: 'Wormhole',
                supportedChains: ['ethereum', 'solana', 'polygon', 'arbitrum', 'aptos'],
                fee: '0.1',
                estimatedTime: '5-15分钟',
                maxAmount: '1000000',
                minAmount: '0.01',
                supportsSVMToEVM: true,
                supportsEVMToSVM: true,
                gasOptimization: true,
                liquidityDepth: '50000000'
            },
            {
                id: 'layerzero',
                name: 'LayerZero',
                supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
                fee: '0.05',
                estimatedTime: '2-10分钟',
                maxAmount: '500000',
                minAmount: '0.001',
                supportsSVMToEVM: false,
                supportsEVMToSVM: false,
                gasOptimization: true,
                liquidityDepth: '30000000'
            },
            {
                id: 'allbridge',
                name: 'Allbridge',
                supportedChains: ['ethereum', 'solana', 'polygon', 'aptos'],
                fee: '0.15',
                estimatedTime: '3-12分钟',
                maxAmount: '100000',
                minAmount: '0.1',
                supportsSVMToEVM: true,
                supportsEVMToSVM: true,
                gasOptimization: false,
                liquidityDepth: '20000000'
            },
            {
                id: 'portal',
                name: 'Portal (Wormhole)',
                supportedChains: ['ethereum', 'solana', 'polygon', 'arbitrum'],
                fee: '0.08',
                estimatedTime: '5-20分钟',
                maxAmount: '2000000',
                minAmount: '0.05',
                supportsSVMToEVM: true,
                supportsEVMToSVM: true,
                gasOptimization: true,
                liquidityDepth: '80000000'
            },
            {
                id: 'celer',
                name: 'Celer cBridge',
                supportedChains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
                fee: '0.03',
                estimatedTime: '1-5分钟',
                maxAmount: '1500000',
                minAmount: '0.01',
                supportsSVMToEVM: false,
                supportsEVMToSVM: false,
                gasOptimization: true,
                liquidityDepth: '40000000'
            }
        ];
    }
    /**
     * 获取支持的跨链桥协议
     */
    getSupportedBridges(fromChain, toChain) {
        if (!fromChain || !toChain) {
            return this.bridgeProtocols;
        }
        return this.bridgeProtocols.filter(bridge => bridge.supportedChains.includes(fromChain) &&
            bridge.supportedChains.includes(toChain));
    }
    /**
     * 获取跨链转账报价
     */
    async getBridgeQuote(params) {
        const availableBridges = this.getSupportedBridges(params.fromChain, params.toChain);
        if (availableBridges.length === 0) {
            throw new Error(`不支持从${params.fromChain}到${params.toChain}的跨链转账`);
        }
        const quotes = [];
        for (const bridge of availableBridges) {
            try {
                const quote = await this.getBridgeQuoteForProtocol(params, bridge);
                quotes.push(quote);
            }
            catch (error) {
                console.warn(`获取${bridge.name}报价失败:`, error.message);
            }
        }
        // 按费用排序
        return quotes.sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
    }
    /**
     * 获取特定协议的跨链报价
     */
    async getBridgeQuoteForProtocol(params, bridge) {
        // 模拟获取跨链报价
        const amount = parseFloat(params.amount);
        const feeAmount = amount * parseFloat(bridge.fee) / 100;
        const toAmount = amount - feeAmount;
        // 根据不同的跨链路径计算汇率
        let exchangeRate = '1.0';
        if (params.fromChain !== params.toChain) {
            // SVM -> EVM 或其他跨链路径可能有不同的汇率
            if (this.isSVMToEVM(params.fromChain, params.toChain)) {
                exchangeRate = '0.998'; // SVM到EVM可能有轻微损失
            }
            else if (this.isEVMToSVM(params.fromChain, params.toChain)) {
                exchangeRate = '0.997';
            }
            else {
                exchangeRate = '0.999'; // EVM到EVM之间
            }
        }
        return {
            fromChain: params.fromChain,
            toChain: params.toChain,
            fromAmount: params.amount,
            toAmount: (toAmount * parseFloat(exchangeRate)).toString(),
            fee: feeAmount.toString(),
            estimatedTime: bridge.estimatedTime,
            exchangeRate,
            bridgeProtocol: bridge.id
        };
    }
    /**
     * 执行跨链转账
     */
    async executeBridge(params, privateKey, quote) {
        try {
            // 验证参数
            this.validateBridgeParams(params, quote);
            // 生成跨链转账ID
            const bridgeId = this.generateBridgeId();
            // 根据不同的跨链协议执行转账
            let fromTxHash;
            switch (quote.bridgeProtocol) {
                case 'wormhole':
                    fromTxHash = await this.executeWormholeBridge(params, privateKey, quote);
                    break;
                case 'layerzero':
                    fromTxHash = await this.executeLayerZeroBridge(params, privateKey, quote);
                    break;
                case 'allbridge':
                    fromTxHash = await this.executeAllbridgeBridge(params, privateKey, quote);
                    break;
                case 'portal':
                    fromTxHash = await this.executePortalBridge(params, privateKey, quote);
                    break;
                case 'celer':
                    fromTxHash = await this.executeCelerBridge(params, privateKey, quote);
                    break;
                default:
                    throw new Error(`不支持的跨链协议: ${quote.bridgeProtocol}`);
            }
            // 记录跨链转账状态
            this.bridgeTransactions.set(bridgeId, {
                id: bridgeId,
                status: 'processing',
                fromTxHash,
                fromChain: params.fromChain,
                toChain: params.toChain,
                amount: params.amount,
                token: params.token,
                estimatedCompletion: Date.now() + this.parseEstimatedTime(quote.estimatedTime),
                bridgeProtocol: quote.bridgeProtocol,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                confirmations: 0,
                requiredConfirmations: this.getRequiredConfirmations(params.fromChain),
                retryCount: 0
            });
            return bridgeId;
        }
        catch (error) {
            throw new Error(`执行跨链转账失败: ${error.message}`);
        }
    }
    /**
     * 执行Wormhole跨链转账
     */
    async executeWormholeBridge(params, privateKey, quote) {
        const fromChainType = this.chainManager.getChainType(params.fromChain);
        if (fromChainType === ChainType.SOLANA) {
            return this.executeWormholeSolana(params, privateKey);
        }
        else if (fromChainType === ChainType.EVM) {
            return this.executeWormholeEVM(params, privateKey);
        }
        else {
            throw new Error(`Wormhole不支持的链类型: ${fromChainType}`);
        }
    }
    /**
     * 执行Wormhole Solana端转账
     */
    async executeWormholeSolana(params, privateKey) {
        // 这里应该调用Wormhole Solana SDK
        // 为了演示，构建一个模拟交易
        const txParams = {
            to: '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5', // Wormhole Solana合约
            value: params.amount,
            data: this.buildWormholeSolanaData(params),
            chainType: ChainType.SOLANA,
            from: params.recipient // 使用recipient作为from地址的占位符
        };
        const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
        return result.hash;
    }
    /**
     * 执行Wormhole EVM端转账
     */
    async executeWormholeEVM(params, privateKey) {
        // 这里应该调用Wormhole EVM SDK
        const wormholeContracts = {
            'ethereum': '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
            'polygon': '0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7',
            'arbitrum': '0xa5f208e072434bC67592E4C49C1B991BA79BCA46'
        };
        const contractAddress = wormholeContracts[params.fromChain];
        if (!contractAddress) {
            throw new Error(`不支持的Wormhole EVM链: ${params.fromChain}`);
        }
        const txParams = {
            to: contractAddress,
            value: params.token === 'ETH' ? params.amount : '0',
            data: this.buildWormholeEVMData(params),
            chainType: ChainType.EVM,
            from: params.recipient // 使用recipient作为from地址的占位符
        };
        const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
        return result.hash;
    }
    /**
     * 执行LayerZero跨链转账
     */
    async executeLayerZeroBridge(params, privateKey, quote) {
        // LayerZero主要支持EVM链
        const layerZeroContracts = {
            'ethereum': '0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675',
            'polygon': '0x3c2269811836af69497E5F486A85D7316753cf62',
            'arbitrum': '0x3c2269811836af69497E5F486A85D7316753cf62'
        };
        const contractAddress = layerZeroContracts[params.fromChain];
        if (!contractAddress) {
            throw new Error(`不支持的LayerZero链: ${params.fromChain}`);
        }
        const txParams = {
            to: contractAddress,
            value: params.token === 'ETH' ? params.amount : '0',
            data: this.buildLayerZeroData(params),
            chainType: ChainType.EVM,
            from: params.recipient // 使用recipient作为from地址的占位符
        };
        const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
        return result.hash;
    }
    /**
     * 执行其他跨链协议（简化实现）
     */
    async executeAllbridgeBridge(params, privateKey, quote) {
        return this.executeGenericBridge(params, privateKey, 'allbridge');
    }
    async executePortalBridge(params, privateKey, quote) {
        return this.executeGenericBridge(params, privateKey, 'portal');
    }
    async executeCelerBridge(params, privateKey, quote) {
        return this.executeGenericBridge(params, privateKey, 'celer');
    }
    /**
     * 通用跨链执行方法
     */
    async executeGenericBridge(params, privateKey, protocol) {
        // 这里应该根据具体协议实现
        // 为了演示，返回模拟交易哈希
        const mockContracts = {
            'allbridge': {
                'ethereum': '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
                'solana': 'A11bridge11111111111111111111111111111111111',
                'polygon': '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
            },
            'portal': {
                'ethereum': '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
                'solana': 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
                'polygon': '0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7'
            },
            'celer': {
                'ethereum': '0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820',
                'polygon': '0x88DCDC47D2f83a99CF0000FDF667A468bB958a78',
                'arbitrum': '0x1619DE6B6B20eD217a58d00f37B9d47C7663feca'
            }
        };
        const contractAddress = mockContracts[protocol]?.[params.fromChain];
        if (!contractAddress) {
            throw new Error(`${protocol}不支持链: ${params.fromChain}`);
        }
        const txParams = {
            to: contractAddress,
            value: params.token === 'ETH' || params.token === 'SOL' ? params.amount : '0',
            data: '0x', // 简化的数据
            chainType: ChainType.EVM,
            from: params.recipient // 使用recipient作为from地址的占位符
        };
        const result = await this.chainManager.sendTransaction(txParams, privateKey, params.fromChain);
        return result.hash;
    }
    /**
     * 获取跨链转账状态
     */
    getBridgeStatus(bridgeId) {
        return this.bridgeTransactions.get(bridgeId) || null;
    }
    /**
     * 更新跨链转账状态
     */
    updateBridgeStatus(bridgeId, status) {
        const currentStatus = this.bridgeTransactions.get(bridgeId);
        if (currentStatus) {
            this.bridgeTransactions.set(bridgeId, { ...currentStatus, ...status });
        }
    }
    /**
     * 获取所有跨链转账记录
     */
    getAllBridgeTransactions() {
        return Array.from(this.bridgeTransactions.values());
    }
    /**
     * 验证跨链参数
     */
    validateBridgeParams(params, quote) {
        const amount = parseFloat(params.amount);
        const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
        if (!bridge) {
            throw new Error('无效的跨链协议');
        }
        if (amount < parseFloat(bridge.minAmount)) {
            throw new Error(`转账金额不能小于${bridge.minAmount}`);
        }
        if (amount > parseFloat(bridge.maxAmount)) {
            throw new Error(`转账金额不能大于${bridge.maxAmount}`);
        }
        if (!this.chainManager.validateAddress(params.recipient, params.toChain)) {
            throw new Error('无效的接收地址');
        }
    }
    /**
     * 生成跨链转账ID
     */
    generateBridgeId() {
        return 'bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    /**
     * 解析预计时间为毫秒
     */
    parseEstimatedTime(timeStr) {
        // 简化解析，假设格式为 "5-15分钟"
        const match = timeStr.match(/(\d+)-(\d+)分钟/);
        if (match) {
            const avgMinutes = (parseInt(match[1]) + parseInt(match[2])) / 2;
            return avgMinutes * 60 * 1000; // 转换为毫秒
        }
        return 10 * 60 * 1000; // 默认10分钟
    }
    /**
     * 检查是否为SVM到EVM的跨链
     */
    isSVMToEVM(fromChain, toChain) {
        const svmChains = ['solana'];
        const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
        return svmChains.includes(fromChain) && evmChains.includes(toChain);
    }
    /**
     * 检查是否为EVM到SVM的跨链
     */
    isEVMToSVM(fromChain, toChain) {
        const svmChains = ['solana'];
        const evmChains = ['ethereum', 'polygon', 'arbitrum', 'optimism'];
        return evmChains.includes(fromChain) && svmChains.includes(toChain);
    }
    /**
     * 构建Wormhole Solana交易数据
     */
    buildWormholeSolanaData(params) {
        // 这里应该构建实际的Wormhole Solana指令数据
        return '';
    }
    /**
     * 构建Wormhole EVM交易数据
     */
    buildWormholeEVMData(params) {
        // 这里应该构建实际的Wormhole EVM合约调用数据
        return '0x';
    }
    /**
     * 构建LayerZero交易数据
     */
    buildLayerZeroData(params) {
        // 这里应该构建实际的LayerZero合约调用数据
        return '0x';
    }
    /**
     * 获取链所需的确认数
     */
    getRequiredConfirmations(chainId) {
        const confirmations = {
            'ethereum': 12,
            'polygon': 20,
            'arbitrum': 1,
            'optimism': 1,
            'solana': 32,
            'aptos': 10
        };
        return confirmations[chainId] || 6;
    }
    /**
     * 启动状态监控
     */
    startStatusMonitoring() {
        this.statusCheckInterval = setInterval(() => {
            this.checkPendingTransactions();
        }, 30000); // 每30秒检查一次
    }
    /**
     * 检查待处理的交易
     */
    async checkPendingTransactions() {
        for (const [bridgeId, status] of this.bridgeTransactions) {
            if (status.status === 'processing' || status.status === 'confirming') {
                try {
                    await this.updateTransactionStatus(bridgeId, status);
                }
                catch (error) {
                    console.error(`更新交易状态失败 ${bridgeId}:`, error.message);
                }
            }
        }
    }
    /**
     * 更新交易状态
     */
    async updateTransactionStatus(bridgeId, status) {
        if (!status.fromTxHash)
            return;
        try {
            // 检查源链交易状态
            const txStatus = await this.chainManager.getTransactionStatus(status.fromTxHash, status.fromChain);
            if (txStatus.status === 'confirmed') {
                const confirmations = txStatus.blockNumber ? Math.max(0, txStatus.blockNumber - (status.confirmations || 0)) : 0;
                const requiredConfirmations = status.requiredConfirmations || 6;
                this.updateBridgeStatus(bridgeId, {
                    confirmations,
                    updatedAt: Date.now()
                });
                if (confirmations >= requiredConfirmations && status.status === 'processing') {
                    this.updateBridgeStatus(bridgeId, {
                        status: 'confirming',
                        updatedAt: Date.now()
                    });
                    // 开始监控目标链交易
                    await this.monitorDestinationTransaction(bridgeId, status);
                }
            }
        }
        catch (error) {
            console.error(`检查交易状态失败:`, error.message);
            // 增加重试次数
            const retryCount = (status.retryCount || 0) + 1;
            if (retryCount >= 5) {
                this.updateBridgeStatus(bridgeId, {
                    status: 'failed',
                    errorMessage: error.message,
                    retryCount,
                    updatedAt: Date.now()
                });
            }
            else {
                this.updateBridgeStatus(bridgeId, {
                    retryCount,
                    updatedAt: Date.now()
                });
            }
        }
    }
    /**
     * 监控目标链交易
     */
    async monitorDestinationTransaction(bridgeId, status) {
        // 这里应该根据不同的跨链协议实现目标链交易监控
        // 简化实现：模拟目标链交易完成
        setTimeout(() => {
            this.updateBridgeStatus(bridgeId, {
                status: 'completed',
                toTxHash: 'mock_destination_tx_hash_' + Date.now(),
                updatedAt: Date.now()
            });
        }, 60000); // 1分钟后模拟完成
    }
    /**
     * 获取增强的跨链报价（包含手续费优化）
     */
    async getEnhancedBridgeQuote(params, options) {
        const basicQuotes = await this.getBridgeQuote(params);
        const enhancedQuotes = [];
        for (const quote of basicQuotes) {
            try {
                const gasCost = await this.estimateGasCost(params, quote, options);
                const totalCost = (parseFloat(quote.fee) + parseFloat(gasCost)).toString();
                const priceImpact = await this.calculatePriceImpact(params, quote);
                const liquidityUtilization = this.calculateLiquidityUtilization(params, quote);
                const confidence = this.calculateConfidence(quote);
                const route = this.buildRoute(params, quote);
                enhancedQuotes.push({
                    ...quote,
                    gasCost,
                    totalCost,
                    priceImpact,
                    liquidityUtilization,
                    confidence,
                    route
                });
            }
            catch (error) {
                console.warn(`生成增强报价失败:`, error.message);
            }
        }
        // 根据优化选项排序
        return this.sortQuotesByOptimization(enhancedQuotes, options);
    }
    /**
     * 估算Gas费用
     */
    async estimateGasCost(params, quote, options) {
        try {
            const gasPrice = options?.gasPrice || await this.getOptimalGasPrice(params.fromChain);
            const gasLimit = await this.estimateGasLimit(params, quote);
            return (parseFloat(gasPrice) * parseFloat(gasLimit)).toString();
        }
        catch (error) {
            return '0.001'; // 默认Gas费用
        }
    }
    /**
     * 获取最优Gas价格
     */
    async getOptimalGasPrice(chainId) {
        try {
            const chainConfig = this.chainManager.getAdapter(chainId).getChainConfig();
            await this.gasService.initialize(chainConfig);
            const gasPrices = await this.gasService.getCurrentGasPrice();
            return gasPrices.standard;
        }
        catch (error) {
            // 返回默认Gas价格
            const defaultPrices = {
                'ethereum': '20000000000', // 20 gwei
                'polygon': '30000000000', // 30 gwei
                'arbitrum': '1000000000', // 1 gwei
                'optimism': '1000000000', // 1 gwei
                'solana': '5000', // 5000 lamports
            };
            return defaultPrices[chainId] || '20000000000';
        }
    }
    /**
     * 估算Gas限制
     */
    async estimateGasLimit(params, quote) {
        const gasLimits = {
            'wormhole': '200000',
            'allbridge': '150000',
            'portal': '180000',
            'layerzero': '120000',
            'celer': '100000'
        };
        return gasLimits[quote.bridgeProtocol] || '150000';
    }
    /**
     * 计算价格影响
     */
    async calculatePriceImpact(params, quote) {
        try {
            const amount = parseFloat(params.amount);
            const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
            if (!bridge)
                return '0';
            const liquidityDepth = parseFloat(bridge.liquidityDepth || '0');
            const impact = (amount / liquidityDepth) * 100;
            return Math.min(impact, 5).toFixed(4); // 最大5%影响
        }
        catch (error) {
            return '0';
        }
    }
    /**
     * 计算流动性利用率
     */
    calculateLiquidityUtilization(params, quote) {
        try {
            const amount = parseFloat(params.amount);
            const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
            if (!bridge)
                return '0';
            const liquidityDepth = parseFloat(bridge.liquidityDepth || '0');
            const utilization = (amount / liquidityDepth) * 100;
            return Math.min(utilization, 100).toFixed(2);
        }
        catch (error) {
            return '0';
        }
    }
    /**
     * 计算报价可信度
     */
    calculateConfidence(quote) {
        const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
        if (!bridge)
            return 50;
        let confidence = 70; // 基础可信度
        // 根据协议特性调整
        if (bridge.gasOptimization)
            confidence += 10;
        if (parseFloat(bridge.liquidityDepth || '0') > 50000000)
            confidence += 15;
        if (parseFloat(bridge.fee) < 0.1)
            confidence += 5;
        return Math.min(confidence, 100);
    }
    /**
     * 构建跨链路径
     */
    buildRoute(params, quote) {
        const route = [params.fromChain];
        // 对于某些协议，可能需要中间链
        if (quote.bridgeProtocol === 'layerzero' &&
            params.fromChain !== 'ethereum' &&
            params.toChain !== 'ethereum') {
            route.push('ethereum'); // LayerZero可能通过以太坊中转
        }
        route.push(params.toChain);
        return route;
    }
    /**
     * 根据优化选项排序报价
     */
    sortQuotesByOptimization(quotes, options) {
        if (!options) {
            // 默认按总费用排序
            return quotes.sort((a, b) => parseFloat(a.totalCost) - parseFloat(b.totalCost));
        }
        if (options.prioritizeSpeed) {
            // 优先速度：按预计时间排序
            return quotes.sort((a, b) => {
                const timeA = this.parseEstimatedTime(a.estimatedTime);
                const timeB = this.parseEstimatedTime(b.estimatedTime);
                return timeA - timeB;
            });
        }
        if (options.prioritizeCost) {
            // 优先成本：按总费用排序
            return quotes.sort((a, b) => parseFloat(a.totalCost) - parseFloat(b.totalCost));
        }
        // 综合排序：考虑费用、时间和可信度
        return quotes.sort((a, b) => {
            const scoreA = this.calculateOverallScore(a);
            const scoreB = this.calculateOverallScore(b);
            return scoreB - scoreA; // 分数越高越好
        });
    }
    /**
     * 计算综合评分
     */
    calculateOverallScore(quote) {
        const costScore = 100 - parseFloat(quote.totalCost) * 10; // 费用越低分数越高
        const timeScore = 100 - this.parseEstimatedTime(quote.estimatedTime) / 60000; // 时间越短分数越高
        const confidenceScore = quote.confidence;
        return (costScore * 0.4 + timeScore * 0.3 + confidenceScore * 0.3);
    }
    /**
     * 获取SVM到EVM的专用跨链桥
     */
    getSVMToEVMBridges() {
        return this.bridgeProtocols.filter(bridge => bridge.supportsSVMToEVM);
    }
    /**
     * 获取EVM到SVM的专用跨链桥
     */
    getEVMToSVMBridges() {
        return this.bridgeProtocols.filter(bridge => bridge.supportsEVMToSVM);
    }
    /**
     * 执行SVM到EVM跨链
     */
    async executeSVMToEVMBridge(params, privateKey, quote) {
        // 验证是否支持SVM到EVM
        const bridge = this.bridgeProtocols.find(b => b.id === quote.bridgeProtocol);
        if (!bridge?.supportsSVMToEVM) {
            throw new Error(`协议 ${quote.bridgeProtocol} 不支持SVM到EVM跨链`);
        }
        // 执行跨链转账
        return this.executeBridge(params, privateKey, quote);
    }
    /**
     * 停止状态监控
     */
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }
}

;// ./src/services/NFTService.ts
/**
 * NFT服务类
 */
class NFTService {
    constructor(walletManager) {
        this.metadataCache = new Map();
        this.collectionCache = new Map();
        this.walletManager = walletManager;
    }
    /**
     * 获取用户的NFT列表
     */
    async getUserNFTs(address, chainId) {
        const adapter = this.walletManager.getAdapter(chainId);
        if (!adapter) {
            throw new Error(`不支持的链: ${chainId}`);
        }
        try {
            const nfts = await adapter.getNFTs(address);
            // 转换为扩展NFT信息并获取元数据
            const extendedNfts = await Promise.all(nfts.map(async (nft) => {
                try {
                    // 构造tokenURI（如果原始NFTInfo没有，需要从合约查询）
                    const tokenURI = nft.image || ''; // 临时使用image字段
                    const metadata = tokenURI ? await this.getNFTMetadata(tokenURI) : null;
                    const extendedNft = {
                        tokenId: nft.tokenId,
                        contractAddress: nft.contractAddress,
                        chainId: nft.chainId,
                        owner: address, // 设置为查询的地址
                        tokenURI: tokenURI,
                        metadata: metadata || undefined,
                        standard: 'ERC721', // 默认标准
                    };
                    return extendedNft;
                }
                catch (error) {
                    console.warn(`Failed to fetch metadata for NFT ${nft.tokenId}:`, error);
                    // 返回基本信息
                    return {
                        tokenId: nft.tokenId,
                        contractAddress: nft.contractAddress,
                        chainId: nft.chainId,
                        owner: address,
                        tokenURI: nft.image || '',
                        standard: 'ERC721',
                    };
                }
            }));
            return extendedNfts;
        }
        catch (error) {
            console.error(`Failed to fetch NFTs for ${address} on ${chainId}:`, error);
            throw error;
        }
    }
    /**
     * 获取NFT详细信息
     */
    async getNFTDetails(contractAddress, tokenId, chainId) {
        const adapter = this.walletManager.getAdapter(chainId);
        if (!adapter) {
            throw new Error(`不支持的链: ${chainId}`);
        }
        try {
            // 这里需要实现具体的NFT详情查询逻辑
            // 暂时返回null
            return null;
        }
        catch (error) {
            console.error(`Failed to fetch NFT details:`, error);
            return null;
        }
    }
    /**
     * 获取NFT元数据
     */
    async getNFTMetadata(tokenURI) {
        if (!tokenURI) {
            return null;
        }
        // 检查缓存
        if (this.metadataCache.has(tokenURI)) {
            return this.metadataCache.get(tokenURI);
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
            const metadata = await response.json();
            // 处理图片URL
            if (metadata.image && metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            // 缓存元数据
            this.metadataCache.set(tokenURI, metadata);
            return metadata;
        }
        catch (error) {
            console.error(`Failed to fetch metadata from ${tokenURI}:`, error);
            return null;
        }
    }
    /**
     * 转移NFT
     */
    async transferNFT(params) {
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
        }
        catch (error) {
            console.error('NFT transfer failed:', error);
            throw error;
        }
    }
    /**
     * 批准NFT操作
     */
    async approveNFT(params) {
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
        }
        catch (error) {
            console.error('NFT approval failed:', error);
            throw error;
        }
    }
    /**
     * 铸造NFT
     */
    async mintNFT(params) {
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
        }
        catch (error) {
            console.error('NFT minting failed:', error);
            throw error;
        }
    }
    /**
     * 获取NFT集合信息
     */
    async getCollectionInfo(contractAddress, chainId) {
        const cacheKey = `${chainId}:${contractAddress}`;
        // 检查缓存
        if (this.collectionCache.has(cacheKey)) {
            return this.collectionCache.get(cacheKey);
        }
        try {
            // 这里需要实现具体的集合信息查询逻辑
            // 可以调用OpenSea API、Alchemy API等
            throw new Error('Collection info query implementation needed');
        }
        catch (error) {
            console.error('Failed to fetch collection info:', error);
            return null;
        }
    }
    /**
     * 搜索NFT集合
     */
    async searchCollections(query, chainId, limit = 20) {
        try {
            // 这里需要实现具体的集合搜索逻辑
            throw new Error('Collection search implementation needed');
        }
        catch (error) {
            console.error('Collection search failed:', error);
            return [];
        }
    }
    /**
     * 获取NFT价格历史
     */
    async getNFTPriceHistory(contractAddress, tokenId, chainId, days = 30) {
        try {
            // 这里需要实现具体的价格历史查询逻辑
            throw new Error('NFT price history implementation needed');
        }
        catch (error) {
            console.error('Failed to fetch NFT price history:', error);
            return [];
        }
    }
    /**
     * 获取NFT市场订单
     */
    async getNFTMarketOrders(contractAddress, tokenId, chainId) {
        try {
            // 这里需要实现具体的市场订单查询逻辑
            // 可以集成OpenSea、LooksRare、X2Y2等市场API
            throw new Error('NFT market orders implementation needed');
        }
        catch (error) {
            console.error('Failed to fetch NFT market orders:', error);
            return [];
        }
    }
    /**
     * 获取用户的NFT交易历史
     */
    async getUserNFTTransactions(address, chainId, limit = 50) {
        try {
            // 这里需要实现具体的NFT交易历史查询逻辑
            throw new Error('NFT transaction history implementation needed');
        }
        catch (error) {
            console.error('Failed to fetch NFT transaction history:', error);
            return [];
        }
    }
    /**
     * 验证NFT所有权
     */
    async verifyNFTOwnership(contractAddress, tokenId, owner, chainId) {
        try {
            const adapter = this.walletManager.getAdapter(chainId);
            if (!adapter) {
                throw new Error(`不支持的链: ${chainId}`);
            }
            // 这里需要实现具体的所有权验证逻辑
            throw new Error('NFT ownership verification implementation needed');
        }
        catch (error) {
            console.error('NFT ownership verification failed:', error);
            return false;
        }
    }
    /**
     * 获取NFT稀有度信息
     */
    async getNFTRarity(contractAddress, tokenId, chainId) {
        try {
            // 这里需要实现具体的稀有度查询逻辑
            // 可以集成rarity.tools、trait_sniper等服务
            throw new Error('NFT rarity query implementation needed');
        }
        catch (error) {
            console.error('Failed to fetch NFT rarity:', error);
            return null;
        }
    }
    /**
     * 清除缓存
     */
    clearCache() {
        this.metadataCache.clear();
        this.collectionCache.clear();
    }
    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            metadataCount: this.metadataCache.size,
            collectionCount: this.collectionCache.size
        };
    }
}
/* harmony default export */ const services_NFTService = ((/* unused pure expression or super */ null && (NFTService)));

;// ./src/services/GasService.ts


/**
 * Gas服务类
 * 处理Gas费用估算和优化
 */
class GasService {
    constructor() {
        this.provider = null;
        this.chainConfig = null;
    }
    /**
     * 初始化Gas服务
     */
    async initialize(chainConfig) {
        this.chainConfig = chainConfig;
        if (chainConfig.type === ChainType.EVM) {
            this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(chainConfig.rpcUrl);
        }
    }
    /**
     * 估算Gas费用
     */
    async estimateGas(params) {
        if (!this.provider || !this.chainConfig) {
            throw new Error('Gas service not initialized');
        }
        if (this.chainConfig.type !== ChainType.EVM) {
            throw new Error('Gas estimation only supported for EVM chains');
        }
        try {
            // 估算Gas限制
            const gasLimit = await this.provider.estimateGas({
                to: params.to,
                value: params.value,
                data: params.data || '0x'
            });
            // 获取当前Gas价格
            const feeData = await this.provider.getFeeData();
            let gasPrice = feeData.gasPrice || units/* parseUnits */.XS('20', 'gwei');
            let maxFeePerGas = feeData.maxFeePerGas;
            let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            // 如果支持EIP-1559，使用动态费用
            if (maxFeePerGas && maxPriorityFeePerGas) {
                const estimatedCost = gasLimit * maxFeePerGas;
                return {
                    gasLimit: gasLimit.toString(),
                    gasPrice: gasPrice.toString(),
                    maxFeePerGas: maxFeePerGas.toString(),
                    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
                    estimatedCost: units/* formatEther */.ck(estimatedCost)
                };
            }
            else {
                // 传统Gas价格模式
                const estimatedCost = gasLimit * gasPrice;
                return {
                    gasLimit: gasLimit.toString(),
                    gasPrice: gasPrice.toString(),
                    estimatedCost: units/* formatEther */.ck(estimatedCost)
                };
            }
        }
        catch (error) {
            console.error('Error estimating gas:', error);
            throw error;
        }
    }
    /**
     * 获取当前Gas价格
     */
    async getCurrentGasPrice() {
        if (!this.provider || !this.chainConfig) {
            throw new Error('Gas service not initialized');
        }
        if (this.chainConfig.type !== ChainType.EVM) {
            throw new Error('Gas price only supported for EVM chains');
        }
        try {
            const feeData = await this.provider.getFeeData();
            const baseGasPrice = feeData.gasPrice || units/* parseUnits */.XS('20', 'gwei');
            // 提供不同速度的Gas价格选项
            const slow = baseGasPrice * BigInt(80) / BigInt(100); // 80% of base
            const standard = baseGasPrice; // 100% of base
            const fast = baseGasPrice * BigInt(120) / BigInt(100); // 120% of base
            return {
                slow: units/* formatUnits */.Js(slow, 'gwei'),
                standard: units/* formatUnits */.Js(standard, 'gwei'),
                fast: units/* formatUnits */.Js(fast, 'gwei')
            };
        }
        catch (error) {
            console.error('Error getting gas price:', error);
            throw error;
        }
    }
    /**
     * 获取EIP-1559费用建议
     */
    async getEIP1559Fees() {
        if (!this.provider || !this.chainConfig) {
            throw new Error('Gas service not initialized');
        }
        if (this.chainConfig.type !== ChainType.EVM) {
            throw new Error('EIP-1559 fees only supported for EVM chains');
        }
        try {
            const feeData = await this.provider.getFeeData();
            if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
                throw new Error('EIP-1559 not supported on this network');
            }
            const baseMaxFee = feeData.maxFeePerGas;
            const basePriorityFee = feeData.maxPriorityFeePerGas;
            return {
                slow: {
                    maxFeePerGas: units/* formatUnits */.Js(baseMaxFee * BigInt(80) / BigInt(100), 'gwei'),
                    maxPriorityFeePerGas: units/* formatUnits */.Js(basePriorityFee * BigInt(80) / BigInt(100), 'gwei')
                },
                standard: {
                    maxFeePerGas: units/* formatUnits */.Js(baseMaxFee, 'gwei'),
                    maxPriorityFeePerGas: units/* formatUnits */.Js(basePriorityFee, 'gwei')
                },
                fast: {
                    maxFeePerGas: units/* formatUnits */.Js(baseMaxFee * BigInt(120) / BigInt(100), 'gwei'),
                    maxPriorityFeePerGas: units/* formatUnits */.Js(basePriorityFee * BigInt(120) / BigInt(100), 'gwei')
                }
            };
        }
        catch (error) {
            console.error('Error getting EIP-1559 fees:', error);
            throw error;
        }
    }
    /**
     * 计算交易费用（以USD计算）
     */
    async calculateTransactionCostUSD(gasEstimate, ethPriceUSD) {
        if (!ethPriceUSD) {
            // 如果没有提供ETH价格，可以从价格API获取
            // 这里简化处理，返回0
            return '0';
        }
        const costInEth = parseFloat(gasEstimate.estimatedCost);
        const costInUSD = costInEth * ethPriceUSD;
        return costInUSD.toFixed(2);
    }
    /**
     * 优化Gas参数
     */
    async optimizeGasParams(params, priority = 'standard') {
        if (!this.provider || !this.chainConfig) {
            throw new Error('Gas service not initialized');
        }
        if (this.chainConfig.type !== ChainType.EVM) {
            return params; // 非EVM链直接返回原参数
        }
        try {
            const feeData = await this.provider.getFeeData();
            // 如果支持EIP-1559
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                const eip1559Fees = await this.getEIP1559Fees();
                const selectedFees = eip1559Fees[priority];
                return {
                    ...params,
                    maxFeePerGas: units/* parseUnits */.XS(selectedFees.maxFeePerGas, 'gwei').toString(),
                    maxPriorityFeePerGas: units/* parseUnits */.XS(selectedFees.maxPriorityFeePerGas, 'gwei').toString()
                };
            }
            else {
                // 传统Gas价格模式
                const gasPrices = await this.getCurrentGasPrice();
                const selectedGasPrice = gasPrices[priority];
                return {
                    ...params,
                    gasPrice: units/* parseUnits */.XS(selectedGasPrice, 'gwei').toString()
                };
            }
        }
        catch (error) {
            console.error('Error optimizing gas params:', error);
            return params; // 出错时返回原参数
        }
    }
    /**
     * 检查Gas费用是否合理
     */
    async validateGasFees(params) {
        const warnings = [];
        const suggestions = [];
        if (!this.provider || !this.chainConfig) {
            return {
                isValid: false,
                warnings: ['Gas service not initialized'],
                suggestions: ['Initialize gas service before validating fees']
            };
        }
        if (this.chainConfig.type !== ChainType.EVM) {
            return {
                isValid: true,
                warnings: [],
                suggestions: []
            };
        }
        try {
            const currentPrices = await this.getCurrentGasPrice();
            const standardGasPrice = units/* parseUnits */.XS(currentPrices.standard, 'gwei');
            if (params.gasPrice) {
                const userGasPrice = BigInt(params.gasPrice);
                // 检查Gas价格是否过低
                if (userGasPrice < standardGasPrice * BigInt(50) / BigInt(100)) {
                    warnings.push('Gas price is very low, transaction may take long time to confirm');
                    suggestions.push('Consider increasing gas price for faster confirmation');
                }
                // 检查Gas价格是否过高
                if (userGasPrice > standardGasPrice * BigInt(200) / BigInt(100)) {
                    warnings.push('Gas price is very high, you may be overpaying');
                    suggestions.push('Consider reducing gas price to save on fees');
                }
            }
            return {
                isValid: warnings.length === 0,
                warnings,
                suggestions
            };
        }
        catch (error) {
            console.error('Error validating gas fees:', error);
            return {
                isValid: false,
                warnings: ['Failed to validate gas fees'],
                suggestions: ['Try again later']
            };
        }
    }
}
/* harmony default export */ const services_GasService = ((/* unused pure expression or super */ null && (GasService)));

;// ./src/services/PriceService.ts

/**
 * 价格时间范围
 */
var PriceTimeframe;
(function (PriceTimeframe) {
    PriceTimeframe["HOUR_1"] = "1h";
    PriceTimeframe["HOUR_4"] = "4h";
    PriceTimeframe["HOUR_12"] = "12h";
    PriceTimeframe["DAY_1"] = "1d";
    PriceTimeframe["DAY_7"] = "7d";
    PriceTimeframe["DAY_30"] = "30d";
    PriceTimeframe["DAY_90"] = "90d";
    PriceTimeframe["YEAR_1"] = "1y";
})(PriceTimeframe || (PriceTimeframe = {}));
/**
 * 价格服务类
 */
class PriceService {
    constructor() {
        this.priceCache = new Map();
        this.historyCache = new Map();
        this.marketDataCache = new Map();
        this.priceAlerts = new Map();
        this.providers = [];
        this.cacheTimeout = 60000; // 1分钟缓存
        this.updateInterval = null;
        this.alertCheckInterval = null;
        this.initializeProviders();
        this.startPriceUpdates();
        this.startAlertMonitoring();
    }
    /**
     * 初始化价格提供商
     */
    initializeProviders() {
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
    async getPrice(symbol, chainType, forceRefresh = false) {
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
        }
        catch (error) {
            console.error('获取价格失败:', error);
            return null;
        }
    }
    /**
     * 批量获取价格
     */
    async getPrices(tokens) {
        const promises = tokens.map(token => this.getPrice(token.symbol, token.chainType));
        const results = await Promise.allSettled(promises);
        return results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
    }
    /**
     * 从提供商获取价格
     */
    async fetchPriceFromProviders(symbol, chainType) {
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
            }
            catch (error) {
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
    async fetchFromProvider(provider, symbol, chainType) {
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
    async fetchFromCoinGecko(symbol, chainType) {
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
        }
        catch (error) {
            throw new Error(`CoinGecko API error: ${error.message}`);
        }
    }
    /**
     * 从CoinMarketCap获取价格
     */
    async fetchFromCoinMarketCap(symbol, chainType) {
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
        }
        catch (error) {
            throw new Error(`CoinMarketCap API error: ${error.message}`);
        }
    }
    /**
     * 从Binance获取价格
     */
    async fetchFromBinance(symbol, chainType) {
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
        }
        catch (error) {
            throw new Error(`Binance API error: ${error.message}`);
        }
    }
    /**
     * 检查速率限制
     */
    checkRateLimit(provider) {
        const now = Date.now();
        const timeSinceLastRequest = now - provider.lastRequest;
        const minInterval = (60 * 1000) / provider.rateLimit; // 毫秒
        return timeSinceLastRequest >= minInterval;
    }
    /**
     * 获取价格历史
     */
    async getPriceHistory(symbol, chainType, timeframe, forceRefresh = false) {
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
        }
        catch (error) {
            console.error('获取价格历史失败:', error);
            return null;
        }
    }
    /**
     * 获取价格历史数据
     */
    async fetchPriceHistory(symbol, chainType, timeframe) {
        try {
            // 这里应该调用实际的API来获取历史数据
            // 暂时生成模拟数据
            const dataPoints = this.getDataPointsForTimeframe(timeframe);
            const basePrice = Math.random() * 1000 + 100;
            const data = [];
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
        }
        catch (error) {
            throw new Error(`Failed to fetch price history: ${error.message}`);
        }
    }
    /**
     * 获取时间范围对应的数据点数量
     */
    getDataPointsForTimeframe(timeframe) {
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
    getIntervalForTimeframe(timeframe) {
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
    async getMarketData(symbol, chainType) {
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
            const marketData = {
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
        }
        catch (error) {
            console.error('获取市场数据失败:', error);
            return null;
        }
    }
    /**
     * 创建价格警报
     */
    createPriceAlert(symbol, chainType, targetPrice, condition) {
        const alertId = this.generateAlertId();
        const alert = {
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
    deletePriceAlert(alertId) {
        return this.priceAlerts.delete(alertId);
    }
    /**
     * 获取价格警报
     */
    getPriceAlert(alertId) {
        return this.priceAlerts.get(alertId);
    }
    /**
     * 获取所有价格警报
     */
    getAllPriceAlerts() {
        return Array.from(this.priceAlerts.values());
    }
    /**
     * 检查价格警报
     */
    checkPriceAlerts(symbol, chainType, currentPrice) {
        for (const alert of this.priceAlerts.values()) {
            if (alert.symbol === symbol &&
                alert.chainType === chainType &&
                alert.isActive &&
                !alert.notificationSent) {
                const shouldTrigger = (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
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
    sendPriceAlertNotification(alert, currentPrice) {
        console.log(`价格警报触发: ${alert.symbol} 当前价格 $${currentPrice}, 目标价格 $${alert.targetPrice}`);
        // 这里应该实现实际的通知逻辑，如推送通知、邮件等
    }
    /**
     * 开始价格更新
     */
    startPriceUpdates() {
        // 每分钟更新一次热门代币价格
        this.updateInterval = setInterval(() => {
            this.updatePopularTokenPrices();
        }, 60000);
    }
    /**
     * 开始警报监控
     */
    startAlertMonitoring() {
        // 每30秒检查一次价格警报
        this.alertCheckInterval = setInterval(() => {
            this.checkAllActiveAlerts();
        }, 30000);
    }
    /**
     * 更新热门代币价格
     */
    async updatePopularTokenPrices() {
        const popularTokens = [
            { symbol: 'ETH', chainType: ChainType.EVM },
            { symbol: 'SOL', chainType: ChainType.SOLANA },
            { symbol: 'APT', chainType: ChainType.APTOS }
        ];
        for (const token of popularTokens) {
            try {
                await this.getPrice(token.symbol, token.chainType, true);
            }
            catch (error) {
                console.error(`更新 ${token.symbol} 价格失败:`, error);
            }
        }
    }
    /**
     * 检查所有活跃警报
     */
    async checkAllActiveAlerts() {
        const activeAlerts = Array.from(this.priceAlerts.values())
            .filter(alert => alert.isActive && !alert.notificationSent);
        for (const alert of activeAlerts) {
            try {
                const priceData = await this.getPrice(alert.symbol, alert.chainType);
                if (priceData) {
                    this.checkPriceAlerts(alert.symbol, alert.chainType, priceData.price);
                }
            }
            catch (error) {
                console.error(`检查警报失败:`, error);
            }
        }
    }
    /**
     * 生成警报ID
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 清除缓存
     */
    clearCache() {
        this.priceCache.clear();
        this.historyCache.clear();
        this.marketDataCache.clear();
    }
    /**
     * 设置缓存超时时间
     */
    setCacheTimeout(timeout) {
        this.cacheTimeout = timeout;
    }
    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            priceCache: this.priceCache.size,
            historyCache: this.historyCache.size,
            marketDataCache: this.marketDataCache.size
        };
    }
    /**
     * 添加自定义提供商
     */
    addProvider(provider) {
        this.providers.push(provider);
        this.providers.sort((a, b) => a.priority - b.priority);
    }
    /**
     * 移除提供商
     */
    removeProvider(providerName) {
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
    getProviderStatus() {
        return [...this.providers];
    }
    /**
     * 销毁服务
     */
    destroy() {
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

;// ./src/adapters/PolygonAdapter.ts


/**
 * Polygon链适配器
 * 支持Polygon主网和测试网
 */
class PolygonAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            const seed = await this.generateSeed(mnemonic);
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成Polygon钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取MATIC余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取MATIC余额失败: ${error.message}`);
        }
    }
    /**
     * 获取ERC-20代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            const tokenContract = new contract_contract/* Contract */.NZ(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用
     */
    async estimateGas(params) {
        try {
            const feeData = await this.provider.getFeeData();
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(transaction);
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('30', 'gwei'); // Polygon默认30 gwei
            const maxFeePerGas = feeData.maxFeePerGas || units/* parseUnits */.XS('40', 'gwei');
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || units/* parseUnits */.XS('2', 'gwei');
            const estimatedCost = gasLimit * gasPrice;
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: units/* formatUnits */.Js(gasPrice, 'gwei'),
                maxFeePerGas: units/* formatUnits */.Js(maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: units/* formatUnits */.Js(maxPriorityFeePerGas, 'gwei'),
                estimatedCost: units/* formatEther */.ck(estimatedCost)
            };
        }
        catch (error) {
            throw new Error(`估算Gas失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x',
                gasLimit: params.gasLimit || undefined,
                gasPrice: params.gasPrice ? units/* parseUnits */.XS(params.gasPrice, 'gwei') : undefined,
                maxFeePerGas: params.maxFeePerGas ? units/* parseUnits */.XS(params.maxFeePerGas, 'gwei') : undefined,
                maxPriorityFeePerGas: params.maxPriorityFeePerGas ? units/* parseUnits */.XS(params.maxPriorityFeePerGas, 'gwei') : undefined,
                nonce: params.nonce
            };
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里可以集成Polygon NFT API或使用Moralis等服务
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里可以集成PolygonScan API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const result = await this.provider.call(transaction);
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}

;// ./src/adapters/ArbitrumAdapter.ts


/**
 * Arbitrum链适配器
 * 支持Arbitrum One和Arbitrum Nova
 */
class ArbitrumAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            const seed = await this.generateSeed(mnemonic);
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成Arbitrum钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取ETH余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取ETH余额失败: ${error.message}`);
        }
    }
    /**
     * 获取ERC-20代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            const tokenContract = new contract_contract/* Contract */.NZ(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用 (Arbitrum使用L1+L2费用模型)
     */
    async estimateGas(params) {
        try {
            const feeData = await this.provider.getFeeData();
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(transaction);
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('0.1', 'gwei'); // Arbitrum较低的gas价格
            const maxFeePerGas = feeData.maxFeePerGas || units/* parseUnits */.XS('0.2', 'gwei');
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || units/* parseUnits */.XS('0.01', 'gwei');
            // Arbitrum的L2费用通常很低
            const l2Cost = gasLimit * gasPrice;
            // 估算L1数据费用 (简化计算)
            const dataSize = params.data ? (params.data.length - 2) / 2 : 0;
            const l1DataFee = BigInt(dataSize * 16) * units/* parseUnits */.XS('20', 'gwei'); // 估算L1费用
            const totalCost = l2Cost + l1DataFee;
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: units/* formatUnits */.Js(gasPrice, 'gwei'),
                maxFeePerGas: units/* formatUnits */.Js(maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: units/* formatUnits */.Js(maxPriorityFeePerGas, 'gwei'),
                estimatedCost: units/* formatEther */.ck(totalCost)
            };
        }
        catch (error) {
            throw new Error(`估算Gas失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x',
                gasLimit: params.gasLimit || undefined,
                gasPrice: params.gasPrice ? units/* parseUnits */.XS(params.gasPrice, 'gwei') : undefined,
                maxFeePerGas: params.maxFeePerGas ? units/* parseUnits */.XS(params.maxFeePerGas, 'gwei') : undefined,
                maxPriorityFeePerGas: params.maxPriorityFeePerGas ? units/* parseUnits */.XS(params.maxPriorityFeePerGas, 'gwei') : undefined,
                nonce: params.nonce
            };
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里可以集成Arbitrum NFT API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里可以集成Arbiscan API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const result = await this.provider.call(transaction);
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取Arbitrum特定信息
     */
    async getArbitrumInfo() {
        try {
            // 获取L1和L2的区块信息
            const latestBlock = await this.provider.getBlock('latest');
            return {
                latestL2Block: latestBlock?.number,
                l2BlockTime: latestBlock?.timestamp
            };
        }
        catch (error) {
            throw new Error(`获取Arbitrum信息失败: ${error.message}`);
        }
    }
}

;// ./src/adapters/zkSyncAdapter.ts


/**
 * zkSync Era链适配器
 * 支持zkSync Era主网和测试网
 */
class zkSyncAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            const seed = await this.generateSeed(mnemonic);
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成zkSync钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取ETH余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取ETH余额失败: ${error.message}`);
        }
    }
    /**
     * 获取ERC-20代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            const tokenContract = new contract_contract/* Contract */.NZ(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用 (zkSync使用不同的费用模型)
     */
    async estimateGas(params) {
        try {
            const feeData = await this.provider.getFeeData();
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(transaction);
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('0.25', 'gwei'); // zkSync较低的gas价格
            const maxFeePerGas = feeData.maxFeePerGas || units/* parseUnits */.XS('0.5', 'gwei');
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || units/* parseUnits */.XS('0.01', 'gwei');
            const estimatedCost = gasLimit * gasPrice;
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: units/* formatUnits */.Js(gasPrice, 'gwei'),
                maxFeePerGas: units/* formatUnits */.Js(maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: units/* formatUnits */.Js(maxPriorityFeePerGas, 'gwei'),
                estimatedCost: units/* formatEther */.ck(estimatedCost)
            };
        }
        catch (error) {
            throw new Error(`估算Gas失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x',
                gasLimit: params.gasLimit || undefined,
                gasPrice: params.gasPrice ? units/* parseUnits */.XS(params.gasPrice, 'gwei') : undefined,
                maxFeePerGas: params.maxFeePerGas ? units/* parseUnits */.XS(params.maxFeePerGas, 'gwei') : undefined,
                maxPriorityFeePerGas: params.maxPriorityFeePerGas ? units/* parseUnits */.XS(params.maxPriorityFeePerGas, 'gwei') : undefined,
                nonce: params.nonce
            };
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里可以集成zkSync NFT API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里可以集成zkSync Explorer API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const result = await this.provider.call(transaction);
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取zkSync特定信息
     */
    async getzkSyncInfo() {
        try {
            const latestBlock = await this.provider.getBlock('latest');
            return {
                latestBlock: latestBlock?.number,
                blockTime: latestBlock?.timestamp,
                // zkSync特有的信息可以在这里添加
                zkSyncVersion: 'Era'
            };
        }
        catch (error) {
            throw new Error(`获取zkSync信息失败: ${error.message}`);
        }
    }
    /**
     * 获取账户nonce (zkSync可能有特殊处理)
     */
    async getNonce(address) {
        try {
            return await this.provider.getTransactionCount(address, 'pending');
        }
        catch (error) {
            throw new Error(`获取nonce失败: ${error.message}`);
        }
    }
}

// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/transaction/transaction.js + 1 modules
var transaction = __webpack_require__(9453);
;// ./src/adapters/OptimismAdapter.ts


/**
 * Optimism链适配器
 * 支持Optimism主网和测试网
 */
class OptimismAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            const seed = await this.generateSeed(mnemonic);
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成Optimism钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取ETH余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取ETH余额失败: ${error.message}`);
        }
    }
    /**
     * 获取ERC-20代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            const tokenContract = new contract_contract/* Contract */.NZ(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用 (Optimism使用L1+L2费用模型)
     */
    async estimateGas(params) {
        try {
            const feeData = await this.provider.getFeeData();
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(transaction);
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('0.001', 'gwei'); // Optimism很低的gas价格
            const maxFeePerGas = feeData.maxFeePerGas || units/* parseUnits */.XS('0.002', 'gwei');
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || units/* parseUnits */.XS('0.0001', 'gwei');
            // L2执行费用
            const l2ExecutionFee = gasLimit * gasPrice;
            // L1数据费用估算 (Optimism特有)
            const dataSize = params.data ? (params.data.length - 2) / 2 : 0;
            const l1DataFee = BigInt(dataSize * 16) * units/* parseUnits */.XS('15', 'gwei'); // 估算L1数据费用
            const totalCost = l2ExecutionFee + l1DataFee;
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: units/* formatUnits */.Js(gasPrice, 'gwei'),
                maxFeePerGas: units/* formatUnits */.Js(maxFeePerGas, 'gwei'),
                maxPriorityFeePerGas: units/* formatUnits */.Js(maxPriorityFeePerGas, 'gwei'),
                estimatedCost: units/* formatEther */.ck(totalCost)
            };
        }
        catch (error) {
            throw new Error(`估算Gas失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x',
                gasLimit: params.gasLimit || undefined,
                gasPrice: params.gasPrice ? units/* parseUnits */.XS(params.gasPrice, 'gwei') : undefined,
                maxFeePerGas: params.maxFeePerGas ? units/* parseUnits */.XS(params.maxFeePerGas, 'gwei') : undefined,
                maxPriorityFeePerGas: params.maxPriorityFeePerGas ? units/* parseUnits */.XS(params.maxPriorityFeePerGas, 'gwei') : undefined,
                nonce: params.nonce
            };
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里可以集成Optimism NFT API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里可以集成Optimistic Etherscan API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const result = await this.provider.call(transaction);
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取Optimism特定信息
     */
    async getOptimismInfo() {
        try {
            const latestBlock = await this.provider.getBlock('latest');
            return {
                latestL2Block: latestBlock?.number,
                l2BlockTime: latestBlock?.timestamp,
                // 可以添加更多Optimism特有的信息
                rollupType: 'Optimistic Rollup'
            };
        }
        catch (error) {
            throw new Error(`获取Optimism信息失败: ${error.message}`);
        }
    }
    /**
     * 获取L1费用估算
     */
    async getL1Fee(params) {
        try {
            // Optimism的L1费用预言机合约地址
            const L1_FEE_ORACLE = '0x420000000000000000000000000000000000000F';
            const oracleContract = new contract_contract/* Contract */.NZ(L1_FEE_ORACLE, ['function getL1Fee(bytes) view returns (uint256)'], this.provider);
            // 构造交易数据
            const txData = transaction/* Transaction */.Z.from({
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            }).serialized;
            const l1Fee = await oracleContract.getL1Fee(txData);
            return units/* formatEther */.ck(l1Fee);
        }
        catch (error) {
            throw new Error(`获取L1费用失败: ${error.message}`);
        }
    }
}

// EXTERNAL MODULE: ./node_modules/ethers/lib.esm/constants/addresses.js
var addresses = __webpack_require__(8982);
;// ./src/adapters/BSCAdapter.ts


/**
 * BSC (Binance Smart Chain) 适配器
 * 支持BSC主网和测试网
 */
class BSCAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.provider = new provider_jsonrpc/* JsonRpcProvider */.FR(config.rpcUrl);
    }
    /**
     * 从助记词生成钱包
     */
    async generateWallet(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        try {
            const seed = await this.generateSeed(mnemonic);
            const hdNode = hdwallet/* HDNodeWallet */.QX.fromSeed(seed);
            const wallet = hdNode.derivePath(derivationPath);
            return {
                address: wallet.address,
                privateKey: wallet.privateKey
            };
        }
        catch (error) {
            throw new Error(`生成BSC钱包失败: ${error.message}`);
        }
    }
    /**
     * 获取BNB余额
     */
    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return units/* formatEther */.ck(balance);
        }
        catch (error) {
            throw new Error(`获取BNB余额失败: ${error.message}`);
        }
    }
    /**
     * 获取BEP-20代币余额
     */
    async getTokenBalance(address, tokenAddress) {
        try {
            const tokenContract = new contract_contract/* Contract */.NZ(tokenAddress, ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'], this.provider);
            const [balance, decimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);
            return units/* formatUnits */.Js(balance, decimals);
        }
        catch (error) {
            throw new Error(`获取代币余额失败: ${error.message}`);
        }
    }
    /**
     * 估算Gas费用
     */
    async estimateGas(params) {
        try {
            const feeData = await this.provider.getFeeData();
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const gasLimit = await this.provider.estimateGas(transaction);
            const gasPrice = feeData.gasPrice || units/* parseUnits */.XS('5', 'gwei'); // BSC默认5 gwei
            const estimatedCost = gasLimit * gasPrice;
            return {
                gasLimit: gasLimit.toString(),
                gasPrice: units/* formatUnits */.Js(gasPrice, 'gwei'),
                estimatedCost: units/* formatEther */.ck(estimatedCost)
            };
        }
        catch (error) {
            throw new Error(`估算Gas失败: ${error.message}`);
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(params, privateKey) {
        try {
            const wallet = new wallet_wallet/* Wallet */.u(privateKey, this.provider);
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x',
                gasLimit: params.gasLimit || undefined,
                gasPrice: params.gasPrice ? units/* parseUnits */.XS(params.gasPrice, 'gwei') : undefined,
                nonce: params.nonce
            };
            const tx = await wallet.sendTransaction(transaction);
            return {
                hash: tx.hash,
                status: 'pending'
            };
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error.message}`);
        }
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(hash) {
        try {
            const tx = await this.provider.getTransaction(hash);
            if (!tx) {
                throw new Error('交易不存在');
            }
            const receipt = await this.provider.getTransactionReceipt(hash);
            if (!receipt) {
                return {
                    hash,
                    status: 'pending'
                };
            }
            return {
                hash,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.gasPrice?.toString()
            };
        }
        catch (error) {
            throw new Error(`获取交易状态失败: ${error.message}`);
        }
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(address) {
        try {
            // 这里可以集成BSC NFT API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取NFT失败: ${error.message}`);
        }
    }
    /**
     * 验证地址格式
     */
    validateAddress(address) {
        try {
            return checks/* isAddress */.PW(address);
        }
        catch {
            return false;
        }
    }
    /**
     * 获取交易历史
     */
    async getTransactionHistory(address, page = 1, limit = 20) {
        try {
            // 这里可以集成BscScan API
            // 暂时返回空数组
            return [];
        }
        catch (error) {
            throw new Error(`获取交易历史失败: ${error.message}`);
        }
    }
    /**
     * 模拟交易
     */
    async simulateTransaction(params) {
        try {
            const transaction = {
                to: params.to,
                value: params.value ? units/* parseEther */.g5(params.value) : 0,
                data: params.data || '0x'
            };
            const result = await this.provider.call(transaction);
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取PancakeSwap相关信息
     */
    async getPancakeSwapInfo() {
        try {
            // PancakeSwap Router地址
            const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
            const routerContract = new contract_contract/* Contract */.NZ(PANCAKE_ROUTER, ['function factory() view returns (address)', 'function WETH() view returns (address)'], this.provider);
            const [factory, wbnb] = await Promise.all([
                routerContract.factory(),
                routerContract.WETH()
            ]);
            return {
                routerAddress: PANCAKE_ROUTER,
                factoryAddress: factory,
                wbnbAddress: wbnb
            };
        }
        catch (error) {
            throw new Error(`获取PancakeSwap信息失败: ${error.message}`);
        }
    }
    /**
     * 获取代币价格 (通过PancakeSwap)
     */
    async getTokenPrice(tokenAddress, baseToken = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c') {
        try {
            // PancakeSwap Factory地址
            const PANCAKE_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
            const factoryContract = new contract_contract/* Contract */.NZ(PANCAKE_FACTORY, ['function getPair(address,address) view returns (address)'], this.provider);
            const pairAddress = await factoryContract.getPair(tokenAddress, baseToken);
            if (pairAddress === addresses/* ZeroAddress */.j) {
                throw new Error('交易对不存在');
            }
            const pairContract = new contract_contract/* Contract */.NZ(pairAddress, ['function getReserves() view returns (uint112,uint112,uint32)'], this.provider);
            const reserves = await pairContract.getReserves();
            const price = Number(reserves[1]) / Number(reserves[0]);
            return price.toString();
        }
        catch (error) {
            throw new Error(`获取代币价格失败: ${error.message}`);
        }
    }
}

;// ./src/adapters/AdapterFactory.ts









/**
 * 适配器工厂类
 * 负责创建和管理不同链的适配器实例
 */
class AdapterFactory {
    /**
     * 创建链适配器
     */
    static createAdapter(config) {
        const key = `${config.type}-${config.id}`;
        // 如果已存在适配器实例，直接返回
        if (this.adapters.has(key)) {
            return this.adapters.get(key);
        }
        let adapter;
        switch (config.type) {
            case ChainType.EVM:
                adapter = this.createEVMAdapter(config);
                break;
            case ChainType.SOLANA:
                adapter = new SolanaAdapter(config);
                break;
            case ChainType.APTOS:
                adapter = new AptosAdapter(config);
                break;
            default:
                throw new Error(`不支持的链类型: ${config.type}`);
        }
        // 缓存适配器实例
        this.adapters.set(key, adapter);
        return adapter;
    }
    /**
     * 创建EVM类型的适配器
     */
    static createEVMAdapter(config) {
        switch (config.id) {
            case 'ethereum':
            case 'ethereum-goerli':
            case 'ethereum-sepolia':
                return new EVMAdapter(config);
            case 'polygon':
            case 'polygon-mumbai':
                return new PolygonAdapter(config);
            case 'arbitrum':
            case 'arbitrum-goerli':
            case 'arbitrum-nova':
                return new ArbitrumAdapter(config);
            case 'zksync':
            case 'zksync-testnet':
                return new zkSyncAdapter(config);
            case 'optimism':
            case 'optimism-goerli':
                return new OptimismAdapter(config);
            case 'bsc':
            case 'bsc-testnet':
                return new BSCAdapter(config);
            default:
                // 对于其他EVM兼容链，使用通用EVMAdapter
                return new EVMAdapter(config);
        }
    }
    /**
     * 获取已创建的适配器
     */
    static getAdapter(chainType, chainId) {
        const key = `${chainType}-${chainId}`;
        return this.adapters.get(key);
    }
    /**
     * 移除适配器实例
     */
    static removeAdapter(chainType, chainId) {
        const key = `${chainType}-${chainId}`;
        return this.adapters.delete(key);
    }
    /**
     * 清空所有适配器实例
     */
    static clearAdapters() {
        this.adapters.clear();
    }
    /**
     * 获取所有已创建的适配器
     */
    static getAllAdapters() {
        return Array.from(this.adapters.values());
    }
    /**
     * 检查是否支持指定链
     */
    static isChainSupported(chainType, chainId) {
        switch (chainType) {
            case ChainType.EVM:
                return true; // EVM链都支持
            case ChainType.SOLANA:
                return true;
            case ChainType.APTOS:
                return true;
            default:
                return false;
        }
    }
    /**
     * 获取支持的链列表
     */
    static getSupportedChains() {
        return [
            // Ethereum
            'ethereum',
            'ethereum-goerli',
            'ethereum-sepolia',
            // Polygon
            'polygon',
            'polygon-mumbai',
            // Arbitrum
            'arbitrum',
            'arbitrum-goerli',
            'arbitrum-nova',
            // zkSync
            'zksync',
            'zksync-testnet',
            // Optimism
            'optimism',
            'optimism-goerli',
            // BSC
            'bsc',
            'bsc-testnet',
            // Solana
            'solana',
            'solana-devnet',
            // Aptos
            'aptos',
            'aptos-testnet'
        ];
    }
    /**
     * 批量创建适配器
     */
    static createMultipleAdapters(configs) {
        return configs.map(config => this.createAdapter(config));
    }
    /**
     * 验证链配置
     */
    static validateChainConfig(config) {
        try {
            // 基本字段验证
            if (!config.id || !config.name || !config.type || !config.rpcUrl) {
                return false;
            }
            // URL格式验证
            new URL(config.rpcUrl);
            // EVM链需要chainId
            if (config.type === ChainType.EVM && !config.chainId) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
}
AdapterFactory.adapters = new Map();

;// ./src/services/MultiChainWalletManager.ts



/**
 * 多链钱包管理器
 * 统一管理所有支持的区块链网络
 */
class MultiChainWalletManager {
    constructor() {
        this.adapters = new Map();
        this.wallets = new Map();
        this.currentChain = 'ethereum';
        this.initializeAdapters();
    }
    /**
     * 初始化所有支持的链适配器
     */
    initializeAdapters() {
        Object.values(CHAIN_CONFIGS).forEach(config => {
            try {
                const adapter = AdapterFactory.createAdapter(config);
                this.adapters.set(config.id, adapter);
            }
            catch (error) {
                console.warn(`Failed to initialize adapter for ${config.name}:`, error);
            }
        });
    }
    /**
     * 获取指定链的适配器
     */
    getAdapter(chainId) {
        const adapter = this.adapters.get(chainId);
        if (!adapter) {
            throw new Error(`不支持的链: ${chainId}`);
        }
        return adapter;
    }
    /**
     * 获取所有支持的链
     */
    getSupportedChains() {
        return Array.from(this.adapters.values()).map(adapter => adapter.getChainConfig());
    }
    /**
     * 设置当前活跃链
     */
    setCurrentChain(chainId) {
        if (!this.adapters.has(chainId)) {
            throw new Error(`不支持的链: ${chainId}`);
        }
        this.currentChain = chainId;
    }
    /**
     * 获取当前活跃链
     */
    getCurrentChain() {
        return this.currentChain;
    }
    /**
     * 获取当前链的适配器
     */
    getCurrentAdapter() {
        return this.getAdapter(this.currentChain);
    }
    /**
     * 从助记词生成所有链的钱包
     */
    async generateWalletsFromMnemonic(mnemonic) {
        const wallets = {};
        for (const [chainId, adapter] of this.adapters) {
            try {
                const wallet = await adapter.generateWallet(mnemonic);
                wallets[chainId] = wallet;
                this.wallets.set(chainId, wallet);
            }
            catch (error) {
                console.error(`Failed to generate wallet for ${chainId}:`, error);
            }
        }
        return wallets;
    }
    /**
     * 获取指定链的钱包
     */
    getWallet(chainId) {
        return this.wallets.get(chainId);
    }
    /**
     * 获取所有钱包地址
     */
    getAllWalletAddresses() {
        const addresses = {};
        for (const [chainId, wallet] of this.wallets) {
            addresses[chainId] = wallet.address;
        }
        return addresses;
    }
    /**
     * 获取指定链和地址的余额
     */
    async getBalance(chainId, address) {
        const adapter = this.getAdapter(chainId);
        return await adapter.getBalance(address);
    }
    /**
     * 获取所有链的余额
     */
    async getAllBalances() {
        const balances = {};
        for (const [chainId, wallet] of this.wallets) {
            try {
                const balance = await this.getBalance(chainId, wallet.address);
                balances[chainId] = balance;
            }
            catch (error) {
                console.error(`Failed to get balance for ${chainId}:`, error);
                balances[chainId] = '0';
            }
        }
        return balances;
    }
    /**
     * 获取代币余额
     */
    async getTokenBalance(chainId, address, tokenAddress) {
        const adapter = this.getAdapter(chainId);
        return await adapter.getTokenBalance(address, tokenAddress);
    }
    /**
     * 估算Gas费用
     */
    async estimateGas(chainId, params) {
        const adapter = this.getAdapter(chainId);
        return await adapter.estimateGas(params);
    }
    /**
     * 发送交易
     */
    async sendTransaction(chainId, params) {
        const adapter = this.getAdapter(chainId);
        const wallet = this.getWallet(chainId);
        if (!wallet) {
            throw new Error(`未找到${chainId}链的钱包`);
        }
        return await adapter.sendTransaction(params, wallet.privateKey);
    }
    /**
     * 获取交易状态
     */
    async getTransactionStatus(chainId, hash) {
        const adapter = this.getAdapter(chainId);
        return await adapter.getTransactionStatus(hash);
    }
    /**
     * 获取NFT列表
     */
    async getNFTs(chainId, address) {
        const adapter = this.getAdapter(chainId);
        return await adapter.getNFTs(address);
    }
    /**
     * 获取所有链的NFT
     */
    async getAllNFTs() {
        const nfts = {};
        for (const [chainId, wallet] of this.wallets) {
            try {
                const chainNFTs = await this.getNFTs(chainId, wallet.address);
                nfts[chainId] = chainNFTs;
            }
            catch (error) {
                console.error(`Failed to get NFTs for ${chainId}:`, error);
                nfts[chainId] = [];
            }
        }
        return nfts;
    }
    /**
     * 验证地址格式
     */
    validateAddress(chainId, address) {
        const adapter = this.getAdapter(chainId);
        return adapter.validateAddress(address);
    }
    /**
     * 获取账户信息
     */
    async getAccountInfo(chainId, address) {
        const adapter = this.getAdapter(chainId);
        const balance = await adapter.getBalance(address);
        return {
            address,
            balance,
            nativeBalance: balance,
            tokens: [] // 可以扩展为获取所有代币余额
        };
    }
    /**
     * 获取链配置
     */
    getChainConfig(chainId) {
        const config = getChainConfig(chainId);
        if (!config) {
            throw new Error(`未找到链配置: ${chainId}`);
        }
        return config;
    }
    /**
     * 根据类型获取链列表
     */
    getChainsByType(type) {
        return this.getSupportedChains().filter(config => config.type === type);
    }
    /**
     * 获取主网链列表
     */
    getMainnetChains() {
        return this.getSupportedChains().filter(config => !config.isTestnet);
    }
    /**
     * 获取测试网链列表
     */
    getTestnetChains() {
        return this.getSupportedChains().filter(config => config.isTestnet);
    }
    /**
     * 清除所有钱包数据
     */
    clearWallets() {
        this.wallets.clear();
    }
    /**
     * 检查是否已初始化钱包
     */
    hasWallets() {
        return this.wallets.size > 0;
    }
    /**
     * 获取钱包统计信息
     */
    getWalletStats() {
        const supportedChains = this.getSupportedChains();
        const evmChains = supportedChains.filter(config => config.type === ChainType.EVM).length;
        return {
            totalChains: Object.keys(CHAIN_CONFIGS).length,
            supportedChains: supportedChains.length,
            initializedWallets: this.wallets.size,
            evmChains,
            nonEvmChains: supportedChains.length - evmChains
        };
    }
}
// 导出单例实例
const multiChainWalletManager = new MultiChainWalletManager();

;// ./src/services/wallet.ts











/**
 * 钱包服务类
 */
class WalletService {
    /**
     * 创建新钱包
     */
    static async createWallet(password) {
        // 验证密码强度
        const passwordValidation = ValidationUtils.isStrongPassword(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }
        try {
            // 生成助记词（简化版本，实际应使用bip39库）
            const mnemonic = this.generateMnemonic();
            // 从助记词生成私钥和地址
            const { privateKey, address } = await this.generateWalletFromMnemonic(mnemonic);
            // 生成多链钱包
            const multiChainWallets = await this.chainManager.generateMultiChainWallet(mnemonic);
            // 加密私钥
            const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
            // 加密多链私钥
            const encryptedMultiChainKeys = {};
            for (const [chainId, chainWallet] of Object.entries(multiChainWallets)) {
                encryptedMultiChainKeys[chainId] = await CryptoUtils.encrypt(chainWallet.privateKey, password);
            }
            // 创建钱包对象
            const wallet = {
                address,
                encryptedPrivateKey,
                mnemonic: await CryptoUtils.encrypt(mnemonic, password),
                createdAt: Date.now(),
                multiChainAddresses: Object.fromEntries(Object.entries(multiChainWallets).map(([chainId, wallet]) => [chainId, wallet.address])),
                encryptedMultiChainKeys
            };
            // 保存到存储
            await StorageService.saveWallet(wallet);
            this.currentWallet = wallet;
            this.multiChainWallets = multiChainWallets;
            this.isUnlocked = true;
            return { wallet, mnemonic, multiChainAddresses: wallet.multiChainAddresses || {} };
        }
        catch (error) {
            throw new Error(`创建钱包失败: ${error}`);
        }
    }
    /**
     * 导入钱包
     */
    static async importWallet(importData, importType, password) {
        // 验证密码强度
        const passwordValidation = ValidationUtils.isStrongPassword(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message);
        }
        try {
            let privateKey;
            let address;
            let mnemonic;
            let multiChainWallets = {};
            if (importType === 'mnemonic') {
                if (!ValidationUtils.isValidMnemonic(importData)) {
                    throw new Error('无效的助记词格式');
                }
                mnemonic = importData;
                const walletData = await this.generateWalletFromMnemonic(mnemonic);
                privateKey = walletData.privateKey;
                address = walletData.address;
                // 生成多链钱包
                multiChainWallets = await this.chainManager.generateMultiChainWallet(mnemonic);
            }
            else {
                if (!ValidationUtils.isValidPrivateKey(importData)) {
                    throw new Error('无效的私钥格式');
                }
                privateKey = importData;
                address = await this.getAddressFromPrivateKey(privateKey);
            }
            // 加密私钥
            const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
            // 加密多链私钥
            const encryptedMultiChainKeys = {};
            for (const [chainId, chainWallet] of Object.entries(multiChainWallets)) {
                encryptedMultiChainKeys[chainId] = await CryptoUtils.encrypt(chainWallet.privateKey, password);
            }
            // 创建钱包对象
            const wallet = {
                address,
                encryptedPrivateKey,
                mnemonic: mnemonic ? await CryptoUtils.encrypt(mnemonic, password) : undefined,
                createdAt: Date.now(),
                multiChainAddresses: Object.fromEntries(Object.entries(multiChainWallets).map(([chainId, wallet]) => [chainId, wallet.address])),
                encryptedMultiChainKeys
            };
            // 保存到存储
            await StorageService.saveWallet(wallet);
            this.currentWallet = wallet;
            this.multiChainWallets = multiChainWallets;
            this.isUnlocked = true;
            return { wallet, multiChainAddresses: wallet.multiChainAddresses || {} };
        }
        catch (error) {
            throw new Error(`导入钱包失败: ${error}`);
        }
    }
    /**
     * 解锁钱包
     */
    static async unlockWallet(password) {
        try {
            const wallet = await StorageService.getWallet();
            if (!wallet) {
                throw new Error('未找到钱包');
            }
            // 尝试解密私钥来验证密码
            await CryptoUtils.decrypt(wallet.encryptedPrivateKey, password);
            // 解密多链私钥
            if (wallet.encryptedMultiChainKeys) {
                for (const [chainId, encryptedKey] of Object.entries(wallet.encryptedMultiChainKeys)) {
                    const privateKey = await CryptoUtils.decrypt(encryptedKey, password);
                    const address = wallet.multiChainAddresses?.[chainId] || '';
                    this.multiChainWallets[chainId] = { address, privateKey };
                }
            }
            this.currentWallet = wallet;
            this.isUnlocked = true;
            return true;
        }
        catch (error) {
            console.error('解锁钱包失败:', error);
            return false;
        }
    }
    /**
     * 锁定钱包
     */
    static lockWallet() {
        this.currentWallet = null;
        this.isUnlocked = false;
    }
    /**
     * 检查钱包是否已解锁
     */
    static isWalletUnlocked() {
        return this.isUnlocked && this.currentWallet !== null;
    }
    /**
     * 获取当前钱包地址
     */
    static getCurrentAddress() {
        return this.currentWallet?.address || null;
    }
    /**
     * 获取钱包余额
     */
    static async getBalance() {
        if (!this.isWalletUnlocked() || !this.currentWallet) {
            throw new Error('钱包未解锁');
        }
        return await NetworkService.getBalance(this.currentWallet.address);
    }
    /**
     * 发送交易
     */
    static async sendTransaction(transaction, password) {
        if (!this.isWalletUnlocked() || !this.currentWallet) {
            throw new Error('钱包未解锁');
        }
        try {
            // 解密私钥
            const privateKey = await CryptoUtils.decrypt(this.currentWallet.encryptedPrivateKey, password);
            // 获取nonce
            const nonce = await NetworkService.getTransactionCount(this.currentWallet.address);
            // 构建交易对象
            const txData = {
                nonce: '0x' + nonce.toString(16),
                gasPrice: NetworkService.gweiToWei(transaction.gasPrice),
                gasLimit: '0x' + parseInt(transaction.gasLimit).toString(16),
                to: transaction.to,
                value: NetworkService.ethToWei(transaction.value),
                data: transaction.data || '0x'
            };
            // 签名交易
            const signedTx = await this.signTransaction(txData, privateKey);
            // 发送交易
            const txHash = await NetworkService.sendRawTransaction(signedTx);
            // 保存交易历史
            await StorageService.addTransaction({
                hash: txHash,
                from: this.currentWallet.address,
                to: transaction.to,
                value: transaction.value,
                gasPrice: transaction.gasPrice,
                timestamp: Date.now(),
                status: 'pending'
            });
            return txHash;
        }
        catch (error) {
            throw new Error(`发送交易失败: ${error}`);
        }
    }
    /**
     * 检查钱包是否存在
     */
    static async walletExists() {
        const wallet = await StorageService.getWallet();
        return wallet !== null && wallet !== undefined;
    }
    /**
     * 删除钱包
     */
    static async deleteWallet() {
        await StorageService.removeWallet();
        this.currentWallet = null;
        this.isUnlocked = false;
    }
    /**
     * 生成助记词（简化版本）
     */
    static generateMnemonic() {
        // 这是一个简化的实现，实际应该使用bip39库
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
            'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
            'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
            'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
            'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album'
        ];
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            mnemonic.push(words[randomIndex]);
        }
        return mnemonic.join(' ');
    }
    /**
     * 从助记词生成钱包（简化版本）
     */
    static async generateWalletFromMnemonic(mnemonic) {
        // 这是一个简化的实现，实际应该使用ethers.js或web3.js
        const seed = await CryptoUtils.simpleHash(mnemonic);
        const privateKey = '0x' + seed.slice(0, 64);
        const address = await this.getAddressFromPrivateKey(privateKey);
        return { privateKey, address };
    }
    /**
     * 从私钥获取地址（简化版本）
     */
    static async getAddressFromPrivateKey(privateKey) {
        // 这是一个简化的实现，实际应该使用ethers.js或web3.js
        const hash = await CryptoUtils.simpleHash(privateKey);
        return '0x' + hash.slice(0, 40);
    }
    /**
     * 签名交易（简化版本）
     */
    static async signTransaction(transaction, privateKey) {
        // 这是一个简化的实现，实际应该使用ethers.js或web3.js进行正确的交易签名
        const txString = JSON.stringify(transaction);
        const signature = await CryptoUtils.simpleHash(txString + privateKey);
        return '0x' + signature;
    }
    /**
     * 获取助记词（需要密码验证）
     */
    static async getMnemonic(password) {
        if (!this.isWalletUnlocked() || !this.currentWallet) {
            throw new Error('钱包未解锁');
        }
        if (!this.currentWallet.mnemonic) {
            return null;
        }
        try {
            return await CryptoUtils.decrypt(this.currentWallet.mnemonic, password);
        }
        catch (error) {
            throw new Error('密码错误');
        }
    }
    // DeFi服务访问器
    static get defi() {
        return WalletService.defiService;
    }
    // 跨链桥服务访问器
    static get bridge() {
        return WalletService.bridgeService;
    }
    // NFT服务访问器
    static get nft() {
        return WalletService.nftService;
    }
    // Gas服务访问器
    static get gas() {
        return WalletService.gasService;
    }
}
WalletService.currentWallet = null;
WalletService.isUnlocked = false;
WalletService.chainManager = chainManager;
WalletService.priceService = new PriceService();
WalletService.gasService = new GasService();
WalletService.multiChainWalletManager = new MultiChainWalletManager();
WalletService.defiService = new DeFiService();
WalletService.bridgeService = new BridgeService(WalletService.chainManager, WalletService.priceService, WalletService.gasService);
WalletService.nftService = new NFTService(WalletService.multiChainWalletManager);
WalletService.multiChainWallets = {};

;// ./src/background/index.ts
/**
 * ShieldWallet 后台脚本
 * 处理钱包核心功能和安全操作
 */


console.log('ShieldWallet 后台脚本已加载');
// 服务都是静态类，无需实例化
console.log('服务已准备就绪');
// 处理来自弹出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.type);
    // 根据消息类型处理不同的请求
    switch (request.type) {
        case 'CHECK_WALLET_EXISTS':
            checkWalletExists().then(sendResponse);
            return true;
        case 'CREATE_WALLET':
            createWallet(request.data.password).then(sendResponse);
            return true;
        case 'IMPORT_WALLET':
            importWallet(request.data).then(sendResponse);
            return true;
        case 'GET_ACCOUNT_INFO':
            getAccountInfo().then(sendResponse);
            return true;
        case 'SEND_TRANSACTION':
            sendTransaction(request.data).then(sendResponse);
            return true;
        case 'SWITCH_NETWORK':
            switchNetwork(request.data.networkId).then(sendResponse);
            return true;
        default:
            sendResponse({ success: false, error: '未知请求类型' });
            return false;
    }
});
// 检查钱包是否已存在
async function checkWalletExists() {
    try {
        const exists = await WalletService.walletExists();
        return { success: true, exists };
    }
    catch (error) {
        console.error('检查钱包存在出错:', error);
        return { success: false, error: '检查钱包状态失败' };
    }
}
// 创建新钱包
async function createWallet(password) {
    try {
        const result = await WalletService.createWallet(password);
        return {
            success: true,
            mnemonic: result.mnemonic,
            address: result.wallet.address
        };
    }
    catch (error) {
        console.error('创建钱包出错:', error);
        return { success: false, error: '创建钱包失败' };
    }
}
// 导入钱包
async function importWallet(data) {
    try {
        const { type, value, password } = data;
        // 验证输入参数
        if (!type || !value || !password) {
            return { success: false, error: '缺少必要参数' };
        }
        if (!['mnemonic', 'privateKey'].includes(type)) {
            return { success: false, error: '不支持的导入类型' };
        }
        const result = await WalletService.importWallet(value, type, password);
        return { success: true, address: result.wallet.address };
    }
    catch (error) {
        console.error('导入钱包出错:', error);
        // 传递具体的错误信息
        const errorMessage = error instanceof Error ? error.message : '导入钱包失败';
        return { success: false, error: errorMessage };
    }
}
// 获取账户信息
async function getAccountInfo() {
    try {
        if (!WalletService.isWalletUnlocked()) {
            return { success: false, error: '钱包未解锁' };
        }
        const address = WalletService.getCurrentAddress();
        const balance = await WalletService.getBalance();
        return {
            success: true,
            address,
            balance,
            isUnlocked: true
        };
    }
    catch (error) {
        console.error('获取账户信息出错:', error);
        return { success: false, error: '获取账户信息失败' };
    }
}
// 发送交易
async function sendTransaction(data) {
    try {
        const { to, amount, gasPrice, gasLimit, password } = data;
        const transaction = {
            to,
            value: amount,
            gasPrice,
            gasLimit: gasLimit || '21000'
        };
        const txHash = await WalletService.sendTransaction(transaction, password);
        return { success: true, txHash };
    }
    catch (error) {
        console.error('发送交易出错:', error);
        return { success: false, error: '发送交易失败' };
    }
}
// 切换网络
async function switchNetwork(networkId) {
    try {
        await StorageService.saveCurrentNetwork(networkId);
        return { success: true };
    }
    catch (error) {
        console.error('切换网络出错:', error);
        return { success: false, error: '切换网络失败' };
    }
}


/***/ }),

/***/ 7790:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 9838:
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			471: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkshieldwallet"] = self["webpackChunkshieldwallet"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96], () => (__webpack_require__(7746)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;