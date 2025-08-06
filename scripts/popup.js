/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/popup/ui-manager.ts
/**
 * UI管理器类
 * 负责处理界面显示、切换和消息提示
 */
class UIManager {
    constructor() {
        this.screens = [
            'welcomeScreen',
            'createWalletScreen',
            'importWalletScreen',
            'walletScreen',
            'sendScreen',
            'receiveScreen'
        ];
        // 初始化UI
        this.setupToastContainer();
    }
    /**
     * 显示指定屏幕，隐藏其他屏幕
     */
    showScreen(screenId) {
        console.log(`切换到屏幕: ${screenId}`);
        // 隐藏所有屏幕
        this.screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
                screen.classList.add('hidden');
            }
        });
        // 显示目标屏幕
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
        else {
            console.error(`找不到屏幕: ${screenId}`);
        }
    }
    /**
     * 更新账户信息显示
     */
    updateAccountInfo(address, balance) {
        // 更新主余额显示
        const mainBalanceElement = document.getElementById('mainBalance');
        if (mainBalanceElement) {
            mainBalanceElement.textContent = `$${balance}`;
        }
        
        // 更新总资产显示
        const totalAssetsElement = document.getElementById('totalAssets');
        if (totalAssetsElement) {
            totalAssetsElement.textContent = `$${balance}`;
        }
    }
    
    /**
     * 初始化标签页切换功能
     */
    initTabNavigation() {
        const tabItems = document.querySelectorAll('.tab-item');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // 移除所有活动状态
                tabItems.forEach(item => item.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // 添加当前活动状态
                tab.classList.add('active');
                const targetPane = document.getElementById(targetTab + 'Tab');
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
    /**
     * 更新接收页面信息
     */
    updateReceiveInfo(address) {
        // 更新完整地址
        const fullAddressElement = document.getElementById('fullAddress');
        if (fullAddressElement) {
            fullAddressElement.textContent = address;
        }
        // 生成二维码
        this.generateQRCode(address);
    }
    /**
     * 更新代币列表
     */
    updateTokenList(tokens) {
        const tokenListContainer = document.getElementById('tokenList');
        if (!tokenListContainer)
            return;
        // 清空现有列表
        tokenListContainer.innerHTML = '';
        if (tokens.length === 0) {
            tokenListContainer.innerHTML = '<div class="empty-message">暂无代币</div>';
            return;
        }
        // 添加代币列表项
        tokens.forEach(token => {
            const tokenItem = document.createElement('div');
            tokenItem.className = 'token-item';
            tokenItem.innerHTML = `
        <div class="token-info">
          <div class="token-symbol">${token.symbol}</div>
          <div class="token-name">${token.name}</div>
        </div>
        <div class="token-balance">${token.balance}</div>
      `;
            tokenListContainer.appendChild(tokenItem);
        });
    }
    /**
     * 显示错误消息
     */
    showError(message) {
        this.showToast(message, 'error');
    }
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    /**
     * 显示普通消息
     */
    showMessage(message) {
        this.showToast(message, 'info');
    }
    /**
     * 显示助记词
     */
    showMnemonic(mnemonic) {
        // 创建模态框显示助记词
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
      <div class="modal-content">
        <h3>请备份您的助记词</h3>
        <div class="mnemonic-container">${mnemonic}</div>
        <p class="warning">警告：请将助记词保存在安全的地方，任何获得您助记词的人都能控制您的资产。</p>
        <button id="mnemonicConfirmBtn" class="btn btn-primary">我已安全备份</button>
      </div>
    `;
        document.body.appendChild(modal);
        // 添加确认按钮事件
        const confirmBtn = document.getElementById('mnemonicConfirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                this.showScreen('walletScreen');
            });
        }
    }
    /**
     * 生成二维码
     * 注：实际实现中需要引入QR码生成库
     */
    generateQRCode(data) {
        const qrContainer = document.getElementById('addressQRCode');
        if (!qrContainer)
            return;
        // 这里应该使用QR码生成库，如qrcode.js
        // 简化实现，显示一个占位符
        qrContainer.innerHTML = `
      <div style="width: 200px; height: 200px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
        <span>QR Code for:<br>${data.substring(0, 10)}...${data.substring(data.length - 6)}</span>
      </div>
    `;
    }
    /**
     * 设置Toast消息容器
     */
    setupToastContainer() {
        // 创建toast容器
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .toast {
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
      }
      
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .toast.info {
        background-color: var(--primary-color);
      }
      
      .toast.success {
        background-color: var(--success-color);
      }
      
      .toast.error {
        background-color: var(--error-color);
      }
      
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(128,128,128,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 400px;
      }
      
      .mnemonic-container {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        margin: 15px 0;
        word-break: break-all;
        font-family: monospace;
        font-size: 16px;
      }
      
      .warning {
        color: var(--error-color);
        font-size: 12px;
        margin-bottom: 15px;
      }
    `;
        document.head.appendChild(style);
    }
    /**
     * 显示Toast消息
     */
    showToast(message, type) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer)
            return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

;// ./src/popup/wallet-controller.ts
class WalletController {
    constructor(uiManager) {
        this.currentAddress = '';
        this.currentNetwork = '1'; // 默认以太坊主网
        this.uiManager = uiManager;
    }
    /**
     * 初始化钱包控制器
     */
    async initialize() {
        try {
            // 检查钱包是否存在
            const response = await this.sendMessage({ type: 'CHECK_WALLET_EXISTS' });
            if (response.success) {
                if (response.exists) {
                    // 钱包已存在，获取账户信息
                    await this.loadAccountInfo();
                    this.uiManager.showScreen('walletScreen');
                }
                else {
                    // 钱包不存在，显示欢迎页面
                    this.uiManager.showScreen('welcomeScreen');
                }
            }
            else {
                this.uiManager.showError('初始化失败: ' + response.error);
            }
        }
        catch (error) {
            console.error('初始化错误:', error);
            this.uiManager.showError('初始化失败，请重试');
        }
    }
    /**
     * 创建新钱包
     */
    async createWallet(password) {
        try {
            this.uiManager.showMessage('正在创建钱包...');
            const response = await this.sendMessage({
                type: 'CREATE_WALLET',
                data: { password }
            });
            if (response.success) {
                this.currentAddress = response.address;
                this.uiManager.showSuccess('钱包创建成功!');
                // 显示助记词备份提示
                this.uiManager.showMnemonic(response.mnemonic);
                // 加载账户信息
                await this.loadAccountInfo();
            }
            else {
                this.uiManager.showError('创建钱包失败: ' + response.error);
            }
        }
        catch (error) {
            console.error('创建钱包错误:', error);
            this.uiManager.showError('创建钱包失败，请重试');
        }
    }
    /**
     * 导入钱包
     */
    async importWallet(type, value, password) {
        try {
            this.uiManager.showMessage('正在导入钱包...');
            const response = await this.sendMessage({
                type: 'IMPORT_WALLET',
                data: { type, value, password }
            });
            if (response.success) {
                this.currentAddress = response.address;
                this.uiManager.showSuccess('钱包导入成功!');
                // 加载账户信息
                await this.loadAccountInfo();
                this.uiManager.showScreen('walletScreen');
            }
            else {
                this.uiManager.showError('导入钱包失败: ' + response.error);
            }
        }
        catch (error) {
            console.error('导入钱包错误:', error);
            this.uiManager.showError('导入钱包失败，请重试');
        }
    }
    /**
     * 发送交易
     */
    async sendTransaction(to, amount, gasPrice, asset) {
        try {
            // 简单验证
            if (!to.startsWith('0x') || to.length !== 42) {
                this.uiManager.showError('无效的接收地址');
                return;
            }
            if (amount <= 0) {
                this.uiManager.showError('金额必须大于0');
                return;
            }
            // 显示密码输入对话框
            this.promptForPassword(async (password) => {
                if (!password) {
                    this.uiManager.showError('需要密码来签名交易');
                    return;
                }
                this.uiManager.showMessage('正在发送交易...');
                const response = await this.sendMessage({
                    type: 'SEND_TRANSACTION',
                    data: { to, amount, gasPrice, password, asset }
                });
                if (response.success) {
                    this.uiManager.showSuccess('交易已发送!');
                    this.uiManager.showScreen('walletScreen');
                    // 刷新账户信息
                    setTimeout(() => this.loadAccountInfo(), 1000);
                }
                else {
                    this.uiManager.showError('发送交易失败: ' + response.error);
                }
            });
        }
        catch (error) {
            console.error('发送交易错误:', error);
            this.uiManager.showError('发送交易失败，请重试');
        }
    }
    /**
     * 切换网络
     */
    async switchNetwork(networkId) {
        try {
            if (this.currentNetwork === networkId) {
                return; // 已经是当前网络
            }
            this.uiManager.showMessage('正在切换网络...');
            const response = await this.sendMessage({
                type: 'SWITCH_NETWORK',
                data: { networkId }
            });
            if (response.success) {
                this.currentNetwork = networkId;
                this.uiManager.showSuccess('网络已切换');
                // 刷新账户信息
                await this.loadAccountInfo();
            }
            else {
                this.uiManager.showError('切换网络失败: ' + response.error);
            }
        }
        catch (error) {
            console.error('切换网络错误:', error);
            this.uiManager.showError('切换网络失败，请重试');
        }
    }
    /**
     * 显示接收信息
     */
    async showReceiveInfo() {
        if (!this.currentAddress) {
            await this.loadAccountInfo();
        }
        this.uiManager.updateReceiveInfo(this.currentAddress);
    }
    /**
     * 加载账户信息
     */
    async loadAccountInfo() {
        try {
            const response = await this.sendMessage({ type: 'GET_ACCOUNT_INFO' });
            if (response.success) {
                this.currentAddress = response.address;
                this.currentNetwork = response.networkId;
                // 更新UI
                this.uiManager.updateAccountInfo(response.address, response.balance);
                this.uiManager.updateTokenList(response.tokens || []);
                // 更新网络选择器
                const networkSelect = document.getElementById('networkSelect');
                if (networkSelect) {
                    networkSelect.value = this.currentNetwork;
                }
            }
            else {
                console.error('获取账户信息失败:', response.error);
            }
        }
        catch (error) {
            console.error('加载账户信息错误:', error);
        }
    }
    /**
     * 显示密码输入对话框
     */
    promptForPassword(callback) {
        // 创建密码输入对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
      <div class="modal-content">
        <h3>请输入密码</h3>
        <div class="form-group">
          <input type="password" id="txPassword" placeholder="钱包密码" />
        </div>
        <div class="btn-group">
          <button id="cancelPasswordBtn" class="btn btn-secondary">取消</button>
          <button id="confirmPasswordBtn" class="btn btn-primary">确认</button>
        </div>
      </div>
    `;
        document.body.appendChild(modal);
        // 聚焦密码输入框
        const passwordInput = document.getElementById('txPassword');
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
        }
        // 取消按钮
        const cancelBtn = document.getElementById('cancelPasswordBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                callback(null);
            });
        }
        // 确认按钮
        const confirmBtn = document.getElementById('confirmPasswordBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const password = passwordInput ? passwordInput.value : '';
                document.body.removeChild(modal);
                callback(password);
            });
        }
        // 回车键确认
        if (passwordInput) {
            passwordInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    const password = passwordInput.value;
                    document.body.removeChild(modal);
                    callback(password);
                }
            });
        }
    }
    /**
     * 发送消息到后台脚本
     */
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        }
                        else {
                            resolve(response);
                        }
                    });
                } else {
                    // 在非扩展环境中返回模拟响应
                    resolve({ success: false, error: '非扩展环境' });
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
}

;// ./src/popup/index.ts
/**
 * ShieldWallet 弹出窗口脚本
 * 处理用户界面交互和显示
 */


// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ShieldWallet 弹出窗口已加载');
    // 初始化UI管理器和钱包控制器
    const uiManager = new UIManager();
    const walletController = new WalletController(uiManager);
    // 初始化应用
    await walletController.initialize();
    // 设置事件监听器
    setupEventListeners(uiManager, walletController);
});
// 设置所有UI事件监听器
function setupEventListeners(uiManager, walletController) {
    // 初始化标签页功能
    uiManager.initTabNavigation();
    
    // 欢迎页面按钮
    const createWalletBtn = document.getElementById('createWalletBtn');
    const importWalletBtn = document.getElementById('importWalletBtn');
    // 创建钱包页面
    const createWalletForm = document.getElementById('createWalletForm');
    const backFromCreateBtn = document.getElementById('backFromCreateBtn');
    // 导入钱包页面
    const importWalletForm = document.getElementById('importWalletForm');
    const backFromImportBtn = document.getElementById('backFromImportBtn');
    const importTypeSelect = document.getElementById('importType');
    // 钱包主页面
    const copyBtn = document.getElementById('copyBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const networkBtn = document.getElementById('networkBtn');
    const sendBtn = document.getElementById('sendBtn');
    const receiveBtn = document.getElementById('receiveBtn');
    const swapBtn = document.getElementById('swapBtn');
    const historyBtn = document.getElementById('historyBtn');
    const toolsBtn = document.getElementById('toolsBtn');
    // 发送页面
    const sendForm = document.getElementById('sendForm');
    const backFromSendBtn = document.getElementById('backFromSendBtn');
    // 接收页面
    const backFromReceiveBtn = document.getElementById('backFromReceiveBtn');
    const copyFullAddressBtn = document.getElementById('copyFullAddressBtn');
    // 网络选择器
    const networkSelect = document.getElementById('networkSelect');
    // 欢迎页面事件
    if (createWalletBtn) {
        createWalletBtn.addEventListener('click', () => {
            uiManager.showScreen('createWalletScreen');
        });
    }
    if (importWalletBtn) {
        importWalletBtn.addEventListener('click', () => {
            uiManager.showScreen('importWalletScreen');
        });
    }
    // 创建钱包表单提交
    if (createWalletForm) {
        createWalletForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (newPassword !== confirmPassword) {
                uiManager.showError('两次输入的密码不一致');
                return;
            }
            await walletController.createWallet(newPassword);
        });
    }
    // 返回按钮
    if (backFromCreateBtn) {
        backFromCreateBtn.addEventListener('click', () => {
            uiManager.showScreen('welcomeScreen');
        });
    }
    // 导入类型切换
    if (importTypeSelect) {
        importTypeSelect.addEventListener('change', () => {
            const mnemonicGroup = document.getElementById('mnemonicInputGroup');
            const privateKeyGroup = document.getElementById('privateKeyInputGroup');
            if (importTypeSelect.value === 'mnemonic') {
                mnemonicGroup?.classList.remove('hidden');
                privateKeyGroup?.classList.add('hidden');
            }
            else {
                mnemonicGroup?.classList.add('hidden');
                privateKeyGroup?.classList.remove('hidden');
            }
        });
    }
    // 导入钱包表单提交
    if (importWalletForm) {
        importWalletForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const importType = importTypeSelect.value;
            let importValue = '';
            if (importType === 'mnemonic') {
                importValue = document.getElementById('mnemonic').value;
            }
            else {
                importValue = document.getElementById('privateKey').value;
            }
            const importPassword = document.getElementById('importPassword').value;
            const importConfirmPassword = document.getElementById('importConfirmPassword').value;
            if (importPassword !== importConfirmPassword) {
                uiManager.showError('两次输入的密码不一致');
                return;
            }
            await walletController.importWallet(importType, importValue, importPassword);
        });
    }
    // 返回按钮
    if (backFromImportBtn) {
        backFromImportBtn.addEventListener('click', () => {
            uiManager.showScreen('welcomeScreen');
        });
    }
    // 复制地址
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // TODO: 获取当前钱包地址
            const address = '0x1234...5678'; // 临时地址
            navigator.clipboard.writeText(address)
                .then(() => uiManager.showMessage('地址已复制到剪贴板'))
                .catch(err => console.error('复制失败:', err));
        });
    }
    
    // 设置按钮
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            uiManager.showMessage('设置功能即将上线');
        });
    }
    
    // 网络按钮
    if (networkBtn) {
        networkBtn.addEventListener('click', () => {
            uiManager.showMessage('网络切换功能即将上线');
        });
    }
    // 操作按钮
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            uiManager.showScreen('sendScreen');
        });
    }
    if (receiveBtn) {
        receiveBtn.addEventListener('click', async () => {
            uiManager.showScreen('receiveScreen');
            await walletController.showReceiveInfo();
        });
    }
    // 兑换按钮
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            uiManager.showMessage('兑换功能即将上线');
        });
    }
    
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            // TODO: 实现交易历史功能
            uiManager.showMessage('交易历史功能即将上线');
        });
    }
    
    // 工具集按钮
    if (toolsBtn) {
        toolsBtn.addEventListener('click', () => {
            uiManager.showMessage('工具集功能即将上线');
        });
    }
    // 发送表单提交
    if (sendForm) {
        sendForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const to = document.getElementById('recipientAddress').value;
            const amount = document.getElementById('amount').value;
            const gasPrice = document.getElementById('gasPrice').value;
            const asset = document.getElementById('assetSelect').value;
            await walletController.sendTransaction(to, parseFloat(amount), parseInt(gasPrice), asset);
        });
    }
    // 返回按钮
    if (backFromSendBtn) {
        backFromSendBtn.addEventListener('click', () => {
            uiManager.showScreen('walletScreen');
        });
    }
    // 接收页面
    if (backFromReceiveBtn) {
        backFromReceiveBtn.addEventListener('click', () => {
            uiManager.showScreen('walletScreen');
        });
    }
    if (copyFullAddressBtn) {
        copyFullAddressBtn.addEventListener('click', () => {
            const address = document.getElementById('fullAddress')?.textContent;
            if (address) {
                navigator.clipboard.writeText(address)
                    .then(() => uiManager.showMessage('地址已复制到剪贴板'))
                    .catch(err => console.error('复制失败:', err));
            }
        });
    }
    // 网络选择
    if (networkSelect) {
        networkSelect.addEventListener('change', async () => {
            const networkId = networkSelect.value;
            await walletController.switchNetwork(networkId);
        });
    }

}

/******/ })()
;