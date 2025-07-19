/**
 * ShieldWallet 弹出窗口脚本
 * 处理用户界面交互和显示
 */

import { UIManager } from './ui-manager';
import { WalletController } from './wallet-controller';

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
function setupEventListeners(uiManager: UIManager, walletController: WalletController) {
  // 欢迎页面按钮
  const createWalletBtn = document.getElementById('createWalletBtn');
  const importWalletBtn = document.getElementById('importWalletBtn');
  
  // 创建钱包页面
  const createWalletForm = document.getElementById('createWalletForm') as HTMLFormElement;
  const backFromCreateBtn = document.getElementById('backFromCreateBtn');
  
  // 导入钱包页面
  const importWalletForm = document.getElementById('importWalletForm') as HTMLFormElement;
  const backFromImportBtn = document.getElementById('backFromImportBtn');
  const importTypeSelect = document.getElementById('importType') as HTMLSelectElement;
  
  // 钱包主页面
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  const sendBtn = document.getElementById('sendBtn');
  const receiveBtn = document.getElementById('receiveBtn');
  const historyBtn = document.getElementById('historyBtn');
  const addTokenBtn = document.getElementById('addTokenBtn');
  
  // 发送页面
  const sendForm = document.getElementById('sendForm') as HTMLFormElement;
  const backFromSendBtn = document.getElementById('backFromSendBtn');
  
  // 接收页面
  const backFromReceiveBtn = document.getElementById('backFromReceiveBtn');
  const copyFullAddressBtn = document.getElementById('copyFullAddressBtn');
  
  // 网络选择器
  const networkSelect = document.getElementById('networkSelect') as HTMLSelectElement;
  
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
      const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
      const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;
      
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
      } else {
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
        importValue = (document.getElementById('mnemonic') as HTMLTextAreaElement).value;
      } else {
        importValue = (document.getElementById('privateKey') as HTMLInputElement).value;
      }
      
      const importPassword = (document.getElementById('importPassword') as HTMLInputElement).value;
      const importConfirmPassword = (document.getElementById('importConfirmPassword') as HTMLInputElement).value;
      
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
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', () => {
      const address = document.getElementById('accountAddressShort')?.textContent;
      if (address) {
        navigator.clipboard.writeText(address)
          .then(() => uiManager.showMessage('地址已复制到剪贴板'))
          .catch(err => console.error('复制失败:', err));
      }
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
  
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      // TODO: 实现交易历史功能
      uiManager.showMessage('交易历史功能即将上线');
    });
  }
  
  // 发送表单提交
  if (sendForm) {
    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const to = (document.getElementById('recipientAddress') as HTMLInputElement).value;
      const amount = (document.getElementById('amount') as HTMLInputElement).value;
      const gasPrice = (document.getElementById('gasPrice') as HTMLInputElement).value;
      const asset = (document.getElementById('assetSelect') as HTMLSelectElement).value;
      
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
  
  // 添加代币按钮
  if (addTokenBtn) {
    addTokenBtn.addEventListener('click', () => {
      // TODO: 实现添加代币功能
      uiManager.showMessage('添加代币功能即将上线');
    });
  }
}