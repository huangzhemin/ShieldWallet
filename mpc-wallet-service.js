/**
 * MPC钱包核心服务类
 * 实现多方计算钱包的核心功能
 */

class MPCWalletService {
    constructor() {
        this.wallets = new Map();
        this.transactions = new Map();
        this.keyShares = new Map();
        this.parties = new Map();
        this.signatureSessions = new Map();
    }

    /**
     * 创建新的MPC钱包
     * @param {Object} params 钱包创建参数
     * @returns {Object} 创建的钱包信息
     */
    async createWallet(params) {
        const {
            name,
            totalParties,
            threshold,
            chainType,
            parties
        } = params;

        // 验证参数
        this.validateWalletParams(params);

        // 生成钱包ID
        const walletId = this.generateWalletId();

        // 生成主密钥对
        const masterKeyPair = await this.generateMasterKeyPair(chainType);

        // 生成密钥分片
        const shares = await this.generateKeyShares(
            masterKeyPair.privateKey,
            totalParties,
            threshold,
            chainType
        );

        // 创建钱包对象
        const wallet = {
            id: walletId,
            name,
            address: masterKeyPair.address,
            chainType,
            threshold,
            totalParties,
            parties: parties || [],
            status: 'active',
            createdAt: new Date(),
            lastActivity: new Date(),
            metadata: {
                version: '1.0.0',
                algorithm: 'Shamir Secret Sharing',
                curve: this.getCurveForChain(chainType)
            }
        };

        // 存储钱包信息
        this.wallets.set(walletId, wallet);
        this.keyShares.set(walletId, shares);
        this.parties.set(walletId, parties || []);

        return {
            wallet,
            shares,
            publicKey: masterKeyPair.publicKey
        };
    }

    /**
     * 验证钱包创建参数
     * @param {Object} params 参数对象
     */
    validateWalletParams(params) {
        const { totalParties, threshold, chainType } = params;

        if (!totalParties || totalParties < 2) {
            throw new Error('参与方数量至少为2');
        }

        if (!threshold || threshold < 2) {
            throw new Error('阈值至少为2');
        }

        if (threshold > totalParties) {
            throw new Error('阈值不能大于参与方总数');
        }

        if (!chainType) {
            throw new Error('必须指定区块链类型');
        }

        // 验证阈值合理性（建议遵循 n/2 + 1 原则）
        const recommendedThreshold = Math.ceil(totalParties / 2) + 1;
        if (threshold < recommendedThreshold) {
            console.warn(`建议阈值至少为 ${recommendedThreshold} 以确保安全性`);
        }
    }

    /**
     * 生成钱包ID
     * @returns {string} 钱包ID
     */
    generateWalletId() {
        return 'wallet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成主密钥对
     * @param {string} chainType 区块链类型
     * @returns {Object} 密钥对对象
     */
    async generateMasterKeyPair(chainType) {
        let privateKey, publicKey, address;

        switch (chainType) {
            case 'ethereum':
            case 'bsc':
            case 'polygon':
            case 'arbitrum':
                // 使用ethers.js生成以太坊兼容的密钥对
                const wallet = ethers.Wallet.createRandom();
                privateKey = wallet.privateKey;
                publicKey = wallet.publicKey;
                address = wallet.address;
                break;

            case 'solana':
                // 使用Solana Web3.js生成密钥对
                if (typeof solana !== 'undefined') {
                    const keypair = solana.Keypair.generate();
                    privateKey = Buffer.from(keypair.secretKey).toString('hex');
                    publicKey = keypair.publicKey.toString();
                    address = keypair.publicKey.toString();
                } else {
                    throw new Error('Solana Web3.js未加载');
                }
                break;

            default:
                throw new Error(`不支持的区块链类型: ${chainType}`);
        }

        return {
            privateKey,
            publicKey,
            address
        };
    }

    /**
     * 生成密钥分片
     * @param {string} privateKey 主私钥
     * @param {number} totalParties 总参与方数量
     * @param {number} threshold 阈值
     * @param {string} chainType 区块链类型
     * @returns {Array} 密钥分片数组
     */
    async generateKeyShares(privateKey, totalParties, threshold, chainType) {
        // 模拟Shamir秘密共享算法
        // 在实际应用中，这里应该使用真正的密码学库
        
        const shares = [];
        // 在ethers.js v6中，使用toBigInt和fromBigInt来处理私钥
        const privateKeyBigInt = BigInt(privateKey);
        const privateKeyHex = privateKeyBigInt.toString(16).padStart(64, '0');
        
        for (let i = 0; i < totalParties; i++) {
            // 生成随机分片（实际应用中应该是数学计算得出的分片）
            const shareValue = privateKeyBigInt ^ BigInt(i + 1);
            const shareHex = shareValue.toString(16).padStart(64, '0');
            
            const share = {
                id: `share_${i + 1}`,
                partyId: `party_${i + 1}`,
                share: '0x' + shareHex,
                index: i + 1,
                chainType,
                status: 'active',
                createdAt: new Date()
            };
            
            shares.push(share);
        }
        
        return shares;
    }

    /**
     * 获取指定区块链的椭圆曲线
     * @param {string} chainType 区块链类型
     * @returns {string} 曲线名称
     */
    getCurveForChain(chainType) {
        const curveMap = {
            'ethereum': 'secp256k1',
            'bsc': 'secp256k1',
            'polygon': 'secp256k1',
            'arbitrum': 'secp256k1',
            'solana': 'ed25519'
        };
        
        return curveMap[chainType] || 'secp256k1';
    }

    /**
     * 创建交易
     * @param {string} walletId 钱包ID
     * @param {Object} transactionParams 交易参数
     * @returns {Object} 交易对象
     */
    async createTransaction(walletId, transactionParams) {
        const wallet = this.wallets.get(walletId);
        if (!wallet) {
            throw new Error('钱包不存在');
        }

        if (wallet.status !== 'active') {
            throw new Error('钱包状态异常');
        }

        // 验证交易参数
        this.validateTransactionParams(transactionParams);

        // 生成交易ID
        const transactionId = this.generateTransactionId();

        // 创建交易对象
        const transaction = {
            id: transactionId,
            walletId,
            from: wallet.address,
            to: transactionParams.to,
            amount: transactionParams.amount,
            gasPrice: transactionParams.gasPrice,
            gasLimit: transactionParams.gasLimit,
            nonce: await this.getNextNonce(wallet.address, wallet.chainType),
            data: transactionParams.data || '0x',
            note: transactionParams.note,
            status: 'pending',
            requiredSignatures: wallet.threshold,
            currentSignatures: 0,
            signatures: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 存储交易
        this.transactions.set(transactionId, transaction);

        // 创建签名会话
        await this.createSignatureSession(transactionId, wallet);

        return transaction;
    }

    /**
     * 验证交易参数
     * @param {Object} params 交易参数
     */
    validateTransactionParams(params) {
        const { to, amount, gasPrice } = params;

        if (!to || !ethers.isAddress(to)) {
            throw new Error('无效的接收地址');
        }

        if (!amount || amount <= 0) {
            throw new Error('转账金额必须大于0');
        }

        if (!gasPrice || gasPrice <= 0) {
            throw new Error('Gas价格必须大于0');
        }
    }

    /**
     * 生成交易ID
     * @returns {string} 交易ID
     */
    generateTransactionId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取下一个nonce值
     * @param {string} address 地址
     * @param {string} chainType 区块链类型
     * @returns {number} nonce值
     */
    async getNextNonce(address, chainType) {
        // 在实际应用中，这里应该从区块链网络获取nonce
        // 这里使用模拟值
        return Math.floor(Math.random() * 1000);
    }

    /**
     * 创建签名会话
     * @param {string} transactionId 交易ID
     * @param {Object} wallet 钱包对象
     */
    async createSignatureSession(transactionId, wallet) {
        const session = {
            id: `session_${transactionId}`,
            transactionId,
            walletId: wallet.id,
            status: 'active',
            requiredSignatures: wallet.threshold,
            currentSignatures: 0,
            participants: wallet.parties.map(party => ({
                ...party,
                hasSigned: false,
                signature: null,
                signedAt: null
            })),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
        };

        this.signatureSessions.set(session.id, session);
    }

    /**
     * 参与方签名
     * @param {string} sessionId 会话ID
     * @param {string} partyId 参与方ID
     * @param {string} signature 签名
     * @returns {Object} 签名结果
     */
    async signTransaction(sessionId, partyId, signature) {
        const session = this.signatureSessions.get(sessionId);
        if (!session) {
            throw new Error('签名会话不存在');
        }

        if (session.status !== 'active') {
            throw new Error('签名会话已结束');
        }

        // 查找参与方
        const participant = session.participants.find(p => p.id === partyId);
        if (!participant) {
            throw new Error('参与方不在签名列表中');
        }

        if (participant.hasSigned) {
            throw new Error('参与方已经签名');
        }

        // 验证签名
        const isValid = await this.verifySignature(sessionId, partyId, signature);
        if (!isValid) {
            throw new Error('签名验证失败');
        }

        // 记录签名
        participant.hasSigned = true;
        participant.signature = signature;
        participant.signedAt = new Date();
        session.currentSignatures++;

        // 更新会话状态
        session.updatedAt = new Date();

        // 检查是否达到阈值
        if (session.currentSignatures >= session.requiredSignatures) {
            session.status = 'completed';
            await this.executeTransaction(session.transactionId);
        }

        return {
            success: true,
            currentSignatures: session.currentSignatures,
            requiredSignatures: session.requiredSignatures,
            isComplete: session.currentSignatures >= session.requiredSignatures
        };
    }

    /**
     * 验证签名
     * @param {string} sessionId 会话ID
     * @param {string} partyId 参与方ID
     * @param {string} signature 签名
     * @returns {boolean} 验证结果
     */
    async verifySignature(sessionId, partyId, signature) {
        // 在实际应用中，这里应该验证签名的有效性
        // 这里使用模拟验证
        return signature && signature.length > 0;
    }

    /**
     * 执行交易
     * @param {string} transactionId 交易ID
     */
    async executeTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('交易不存在');
        }

        try {
            // 更新交易状态
            transaction.status = 'processing';
            transaction.updatedAt = new Date();

            // 模拟交易执行
            await new Promise(resolve => setTimeout(resolve, 2000));

                    // 生成交易哈希
        const txHash = '0x' + Array.from({length: 32}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

            // 更新交易状态
            transaction.status = 'completed';
            transaction.txHash = txHash;
            transaction.completedAt = new Date();
            transaction.updatedAt = new Date();

            // 更新钱包最后活动时间
            const wallet = this.wallets.get(transaction.walletId);
            if (wallet) {
                wallet.lastActivity = new Date();
            }

        } catch (error) {
            transaction.status = 'failed';
            transaction.error = error.message;
            transaction.updatedAt = new Date();
            throw error;
        }
    }

    /**
     * 获取钱包信息
     * @param {string} walletId 钱包ID
     * @returns {Object} 钱包信息
     */
    getWallet(walletId) {
        return this.wallets.get(walletId);
    }

    /**
     * 获取所有钱包
     * @returns {Array} 钱包列表
     */
    getAllWallets() {
        return Array.from(this.wallets.values());
    }

    /**
     * 获取交易信息
     * @param {string} transactionId 交易ID
     * @returns {Object} 交易信息
     */
    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }

    /**
     * 获取钱包的所有交易
     * @param {string} walletId 钱包ID
     * @returns {Array} 交易列表
     */
    getWalletTransactions(walletId) {
        return Array.from(this.transactions.values())
            .filter(tx => tx.walletId === walletId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 获取签名会话
     * @param {string} sessionId 会话ID
     * @returns {Object} 会话信息
     */
    getSignatureSession(sessionId) {
        return this.signatureSessions.get(sessionId);
    }

    /**
     * 删除钱包
     * @param {string} walletId 钱包ID
     * @returns {boolean} 删除结果
     */
    deleteWallet(walletId) {
        const wallet = this.wallets.get(walletId);
        if (!wallet) {
            return false;
        }

        // 检查是否有待处理的交易
        const pendingTransactions = this.getWalletTransactions(walletId)
            .filter(tx => tx.status === 'pending' || tx.status === 'processing');

        if (pendingTransactions.length > 0) {
            throw new Error('钱包有待处理的交易，无法删除');
        }

        // 删除相关数据
        this.wallets.delete(walletId);
        this.keyShares.delete(walletId);
        this.parties.delete(walletId);

        return true;
    }

    /**
     * 导出钱包
     * @param {string} walletId 钱包ID
     * @param {string} format 导出格式
     * @returns {Object} 导出数据
     */
    exportWallet(walletId, format = 'json') {
        const wallet = this.wallets.get(walletId);
        if (!wallet) {
            throw new Error('钱包不存在');
        }

        const exportData = {
            wallet,
            parties: this.parties.get(walletId) || [],
            transactions: this.getWalletTransactions(walletId),
            exportedAt: new Date(),
            version: '1.0.0'
        };

        switch (format.toLowerCase()) {
            case 'json':
                return exportData;
            case 'csv':
                return this.convertToCSV(exportData);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 转换为CSV格式
     * @param {Object} data 数据对象
     * @returns {string} CSV字符串
     */
    convertToCSV(data) {
        // 简单的CSV转换实现
        const lines = [];
        
        // 钱包信息
        lines.push('Wallet Information');
        lines.push(`ID,${data.wallet.id}`);
        lines.push(`Name,${data.wallet.name}`);
        lines.push(`Address,${data.wallet.address}`);
        lines.push(`Chain Type,${data.wallet.chainType}`);
        lines.push(`Threshold,${data.wallet.threshold}`);
        lines.push(`Total Parties,${data.wallet.totalParties}`);
        lines.push(`Status,${data.wallet.status}`);
        lines.push(`Created At,${data.wallet.createdAt}`);
        lines.push('');
        
        // 参与方信息
        lines.push('Parties');
        lines.push('ID,Name,Role,Status');
        data.parties.forEach(party => {
            lines.push(`${party.id},${party.name},${party.role},${party.status}`);
        });
        lines.push('');
        
        // 交易信息
        lines.push('Transactions');
        lines.push('ID,From,To,Amount,Status,Created At');
        data.transactions.forEach(tx => {
            lines.push(`${tx.id},${tx.from},${tx.to},${tx.amount},${tx.status},${tx.createdAt}`);
        });
        
        return lines.join('\n');
    }

    /**
     * 获取钱包统计信息
     * @returns {Object} 统计信息
     */
    getWalletStats() {
        const wallets = this.getAllWallets();
        const transactions = Array.from(this.transactions.values());
        
        return {
            totalWallets: wallets.length,
            activeWallets: wallets.filter(w => w.status === 'active').length,
            totalTransactions: transactions.length,
            pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
            completedTransactions: transactions.filter(tx => tx.status === 'completed').length,
            failedTransactions: transactions.filter(tx => tx.status === 'failed').length,
            totalValue: transactions
                .filter(tx => tx.status === 'completed')
                .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
        };
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        const now = new Date();
        
        // 清理过期的签名会话
        for (const [sessionId, session] of this.signatureSessions.entries()) {
            if (session.expiresAt < now) {
                this.signatureSessions.delete(sessionId);
            }
        }
        
        // 清理过期的交易（保留30天）
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        for (const [txId, tx] of this.transactions.entries()) {
            if (tx.createdAt < thirtyDaysAgo && tx.status !== 'pending') {
                this.transactions.delete(txId);
            }
        }
    }
}

// 导出服务类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MPCWalletService;
} else if (typeof window !== 'undefined') {
    window.MPCWalletService = MPCWalletService;
} 