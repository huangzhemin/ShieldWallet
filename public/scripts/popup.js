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

;// ./src/popup/index.ts


/**
 * Popup界面控制器
 */
class PopupController {
    constructor() {
        this.currentScreen = 'welcomeScreen';
        this.walletUnlocked = false;
        this.init();
    }
    /**
     * 初始化popup
     */
    async init() {
        console.log('ShieldWallet Popup 启动');
        // 绑定事件监听器
        this.bindEventListeners();
        // 检查钱包状态
        await this.checkWalletStatus();
        // 加载网络信息
        await this.loadNetworkInfo();
        // 监听来自background的消息
        chrome.runtime.onMessage.addListener(this.handleBackgroundMessage.bind(this));
    }
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 欢迎界面按钮
        document.getElementById('createWalletBtn')?.addEventListener('click', () => {
            this.showScreen('createWalletScreen');
        });
        document.getElementById('importWalletBtn')?.addEventListener('click', () => {
            this.showScreen('importWalletScreen');
        });
        // 创建钱包表单
        document.getElementById('createWalletForm')?.addEventListener('submit', this.handleCreateWallet.bind(this));
        document.getElementById('backFromCreateBtn')?.addEventListener('click', () => {
            this.showScreen('welcomeScreen');
        });
        // 导入钱包表单
        document.getElementById('importWalletForm')?.addEventListener('submit', this.handleImportWallet.bind(this));
        document.getElementById('backFromImportBtn')?.addEventListener('click', () => {
            this.showScreen('welcomeScreen');
        });
        // 导入类型切换
        document.getElementById('importType')?.addEventListener('change', this.handleImportTypeChange.bind(this));
        // 钱包主界面按钮
        document.getElementById('sendBtn')?.addEventListener('click', () => {
            this.showScreen('sendScreen');
        });
        document.getElementById('receiveBtn')?.addEventListener('click', this.handleReceive.bind(this));
        document.getElementById('historyBtn')?.addEventListener('click', this.handleHistory.bind(this));
        document.getElementById('copyAddressBtn')?.addEventListener('click', this.handleCopyAddress.bind(this));
        // 发送交易表单
        document.getElementById('sendForm')?.addEventListener('submit', this.handleSendTransaction.bind(this));
        document.getElementById('backFromSendBtn')?.addEventListener('click', () => {
            this.showScreen('walletScreen');
        });
        // 网络选择器
        document.getElementById('networkSelect')?.addEventListener('change', this.handleNetworkChange.bind(this));
        // 添加代币按钮
        document.getElementById('addTokenBtn')?.addEventListener('click', this.handleAddToken.bind(this));
    }
    /**
     * 检查钱包状态
     */
    async checkWalletStatus() {
        try {
            const response = await this.sendMessageToBackground({ action: 'getWalletStatus' });
            if (response.exists) {
                if (response.isUnlocked) {
                    this.walletUnlocked = true;
                    await this.loadWalletData();
                    this.showScreen('walletScreen');
                }
                else {
                    // 显示解锁界面
                    this.showUnlockScreen();
                }
            }
            else {
                this.showScreen('welcomeScreen');
            }
        }
        catch (error) {
            console.error('检查钱包状态失败:', error);
            this.showError('检查钱包状态失败');
        }
    }
    /**
     * 显示解锁界面
     */
    showUnlockScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.innerHTML = `
        <div class="welcome-content">
          <h2>解锁钱包</h2>
          <form id="unlockForm">
            <div class="form-group">
              <label for="unlockPassword">密码</label>
              <input type="password" id="unlockPassword" required>
            </div>
            <div class="btn-group">
              <button type="submit" class="btn btn-primary">解锁</button>
            </div>
          </form>
        </div>
      `;
            document.getElementById('unlockForm')?.addEventListener('submit', this.handleUnlockWallet.bind(this));
        }
    }
    /**
     * 处理解锁钱包
     */
    async handleUnlockWallet(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const password = formData.get('unlockPassword');
        try {
            const response = await this.sendMessageToBackground({
                action: 'unlockWallet',
                password
            });
            if (response.success) {
                this.walletUnlocked = true;
                await this.loadWalletData();
                this.showScreen('walletScreen');
            }
            else {
                this.showError('密码错误');
            }
        }
        catch (error) {
            console.error('解锁钱包失败:', error);
            this.showError('解锁钱包失败');
        }
    }
    /**
     * 处理创建钱包
     */
    async handleCreateWallet(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const password = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        if (password !== confirmPassword) {
            this.showError('密码不匹配');
            return;
        }
        try {
            const { wallet, mnemonic } = await WalletService.createWallet(password);
            // 显示助记词
            this.showMnemonic(mnemonic);
            // 切换到钱包界面
            setTimeout(() => {
                this.walletUnlocked = true;
                this.loadWalletData();
                this.showScreen('walletScreen');
            }, 5000);
        }
        catch (error) {
            console.error('创建钱包失败:', error);
            this.showError(`创建钱包失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 处理导入钱包
     */
    async handleImportWallet(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const importType = formData.get('importType');
        const importData = importType === 'mnemonic'
            ? formData.get('mnemonic')
            : formData.get('privateKey');
        const password = formData.get('importPassword');
        const confirmPassword = formData.get('importConfirmPassword');
        if (password !== confirmPassword) {
            this.showError('密码不匹配');
            return;
        }
        try {
            await WalletService.importWallet(importData, importType, password);
            this.walletUnlocked = true;
            await this.loadWalletData();
            this.showScreen('walletScreen');
        }
        catch (error) {
            console.error('导入钱包失败:', error);
            this.showError(`导入钱包失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 处理导入类型变化
     */
    handleImportTypeChange(event) {
        const select = event.target;
        const mnemonicGroup = document.getElementById('mnemonicInputGroup');
        const privateKeyGroup = document.getElementById('privateKeyInputGroup');
        if (select.value === 'mnemonic') {
            mnemonicGroup?.classList.remove('hidden');
            privateKeyGroup?.classList.add('hidden');
        }
        else {
            mnemonicGroup?.classList.add('hidden');
            privateKeyGroup?.classList.remove('hidden');
        }
    }
    /**
     * 加载钱包数据
     */
    async loadWalletData() {
        try {
            // 获取地址
            const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
            if (addressResponse.address) {
                const shortAddress = ValidationUtils.shortenAddress(addressResponse.address);
                const addressElement = document.getElementById('accountAddressShort');
                if (addressElement) {
                    addressElement.textContent = shortAddress;
                }
            }
            // 获取余额
            const balanceResponse = await this.sendMessageToBackground({ action: 'getBalance' });
            if (balanceResponse.balance) {
                const balanceElement = document.getElementById('ethBalance');
                if (balanceElement) {
                    balanceElement.textContent = `${ValidationUtils.formatAmount(balanceResponse.balance)} ETH`;
                }
            }
        }
        catch (error) {
            console.error('加载钱包数据失败:', error);
        }
    }
    /**
     * 处理发送交易
     */
    async handleSendTransaction(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const to = formData.get('recipientAddress');
        const amount = formData.get('amount');
        const gasPrice = formData.get('gasPrice');
        // 验证输入
        if (!ValidationUtils.isValidEthereumAddress(to)) {
            this.showError('无效的收款地址');
            return;
        }
        if (!ValidationUtils.isValidAmount(amount)) {
            this.showError('无效的金额');
            return;
        }
        if (!ValidationUtils.isValidGasPrice(gasPrice)) {
            this.showError('无效的Gas价格');
            return;
        }
        // 请求密码确认
        const password = prompt('请输入密码确认交易:');
        if (!password) {
            return;
        }
        try {
            const transaction = {
                to,
                value: amount,
                gasPrice,
                gasLimit: '21000' // 标准ETH转账
            };
            const response = await this.sendMessageToBackground({
                action: 'sendTransaction',
                transaction,
                password
            });
            if (response.txHash) {
                this.showSuccess(`交易已发送! 交易哈希: ${response.txHash}`);
                this.showScreen('walletScreen');
                await this.loadWalletData(); // 刷新余额
            }
            else {
                this.showError(response.error || '发送交易失败');
            }
        }
        catch (error) {
            console.error('发送交易失败:', error);
            this.showError('发送交易失败');
        }
    }
    /**
     * 处理接收
     */
    async handleReceive() {
        const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
        if (addressResponse.address) {
            // 显示二维码或地址
            alert(`您的钱包地址:\n${addressResponse.address}`);
        }
    }
    /**
     * 处理历史记录
     */
    async handleHistory() {
        const response = await this.sendMessageToBackground({ action: 'getTransactionHistory' });
        if (response.transactions) {
            // 显示交易历史
            console.log('交易历史:', response.transactions);
            alert(`您有 ${response.transactions.length} 条交易记录`);
        }
    }
    /**
     * 处理复制地址
     */
    async handleCopyAddress() {
        const addressResponse = await this.sendMessageToBackground({ action: 'getCurrentAddress' });
        if (addressResponse.address) {
            try {
                await navigator.clipboard.writeText(addressResponse.address);
                this.showSuccess('地址已复制到剪贴板');
            }
            catch (error) {
                console.error('复制失败:', error);
            }
        }
    }
    /**
     * 处理网络变化
     */
    async handleNetworkChange(event) {
        const select = event.target;
        const networkId = select.value;
        try {
            await this.sendMessageToBackground({
                action: 'switchNetwork',
                networkId
            });
            // 刷新钱包数据
            if (this.walletUnlocked) {
                await this.loadWalletData();
            }
        }
        catch (error) {
            console.error('切换网络失败:', error);
            this.showError('切换网络失败');
        }
    }
    /**
     * 处理添加代币
     */
    handleAddToken() {
        // 简化实现
        alert('添加代币功能开发中...');
    }
    /**
     * 加载网络信息
     */
    async loadNetworkInfo() {
        try {
            const response = await this.sendMessageToBackground({ action: 'getNetworkInfo' });
            if (response.network) {
                const networkSelect = document.getElementById('networkSelect');
                if (networkSelect) {
                    networkSelect.value = response.network.id;
                }
            }
        }
        catch (error) {
            console.error('加载网络信息失败:', error);
        }
    }
    /**
     * 显示助记词
     */
    showMnemonic(mnemonic) {
        alert(`请安全保存您的助记词:\n\n${mnemonic}\n\n请务必将其保存在安全的地方，这是恢复钱包的唯一方式！`);
    }
    /**
     * 显示屏幕
     */
    showScreen(screenId) {
        // 隐藏所有屏幕
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
        // 显示目标屏幕
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenId;
        }
    }
    /**
     * 显示错误消息
     */
    showError(message) {
        alert(`错误: ${message}`);
    }
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        alert(`成功: ${message}`);
    }
    /**
     * 发送消息到background脚本
     */
    sendMessageToBackground(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    /**
     * 处理来自background的消息
     */
    handleBackgroundMessage(message) {
        switch (message.action) {
            case 'walletLocked':
                this.walletUnlocked = false;
                this.showUnlockScreen();
                break;
        }
    }
}
// 启动popup控制器
new PopupController();

/******/ })()
;