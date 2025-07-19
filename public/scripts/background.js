/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

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
            // 加密私钥
            const encryptedPrivateKey = await CryptoUtils.encrypt(privateKey, password);
            // 创建钱包对象
            const wallet = {
                address,
                encryptedPrivateKey,
                mnemonic: await CryptoUtils.encrypt(mnemonic, password),
                createdAt: Date.now()
            };
            // 保存到存储
            await StorageService.saveWallet(wallet);
            this.currentWallet = wallet;
            this.isUnlocked = true;
            return { wallet, mnemonic };
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
            if (importType === 'mnemonic') {
                if (!ValidationUtils.isValidMnemonic(importData)) {
                    throw new Error('无效的助记词格式');
                }
                mnemonic = importData;
                const walletData = await this.generateWalletFromMnemonic(mnemonic);
                privateKey = walletData.privateKey;
                address = walletData.address;
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
            // 创建钱包对象
            const wallet = {
                address,
                encryptedPrivateKey,
                mnemonic: mnemonic ? await CryptoUtils.encrypt(mnemonic, password) : undefined,
                createdAt: Date.now()
            };
            // 保存到存储
            await StorageService.saveWallet(wallet);
            this.currentWallet = wallet;
            this.isUnlocked = true;
            return wallet;
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
}
WalletService.currentWallet = null;
WalletService.isUnlocked = false;

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
        const result = await WalletService.importWallet(value, type, password);
        return { success: true, address: result.address };
    }
    catch (error) {
        console.error('导入钱包出错:', error);
        return { success: false, error: '导入钱包失败' };
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

/******/ })()
;