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
  
  // 头部按钮
  const copyBtn = document.getElementById('copyBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const networkBtn = document.getElementById('networkBtn');
  
  // 功能按钮
  const swapBtn = document.getElementById('swapBtn');
  const toolsBtn = document.getElementById('toolsBtn');
  
  // 标签页
  const tabItems = document.querySelectorAll('.tab-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
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
    console.log('创建钱包按钮找到，绑定事件监听器');
    createWalletBtn.addEventListener('click', () => {
      console.log('创建钱包按钮被点击');
      uiManager.showScreen('createWalletScreen');
    });
  } else {
    console.error('未找到创建钱包按钮');
  }
  
  if (importWalletBtn) {
    console.log('导入钱包按钮找到，绑定事件监听器');
    importWalletBtn.addEventListener('click', () => {
      console.log('导入钱包按钮被点击');
      uiManager.showScreen('importWalletScreen');
    });
  } else {
    console.error('未找到导入钱包按钮');
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
  
  // 头部按钮事件
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const address = await walletController.getCurrentAddress();
      if (address) {
        navigator.clipboard.writeText(address)
          .then(() => uiManager.showMessage('地址已复制到剪贴板'))
          .catch(err => console.error('复制失败:', err));
      }
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // TODO: 实现设置功能
      uiManager.showMessage('设置功能即将上线');
    });
  }
  
  if (networkBtn) {
    networkBtn.addEventListener('click', () => {
      // TODO: 实现网络切换功能
      uiManager.showMessage('网络切换功能即将上线');
    });
  }
  
  // 功能按钮事件
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      // TODO: 实现兑换功能
      uiManager.showMessage('兑换功能即将上线');
    });
  }
  
  if (toolsBtn) {
    toolsBtn.addEventListener('click', () => {
      // TODO: 实现工具集功能
      uiManager.showMessage('工具集功能即将上线');
    });
  }
  
  // 标签页切换事件
  tabItems.forEach(tabItem => {
    tabItem.addEventListener('click', () => {
      const targetTab = tabItem.getAttribute('data-tab');
      
      // 移除所有活动状态
      tabItems.forEach(item => item.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // 添加当前活动状态
      tabItem.classList.add('active');
      const targetPane = document.getElementById(targetTab + 'Tab');
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });
  
  // 账户切换相关事件
  const closeAccountModal = document.getElementById('closeAccountModal');
  const modalOverlay = document.getElementById('accountSwitcherModal');
  const accountNameBtn = document.getElementById('accountNameBtn');
  const accountItems = document.querySelectorAll('.account-item');
  const addAccountBtn = document.getElementById('addAccountBtn');
  
  console.log('关闭按钮元素:', closeAccountModal);
  console.log('遮罩层元素:', modalOverlay);
  console.log('账户名称按钮:', accountNameBtn);
  console.log('账户项:', accountItems);
  
  // 账户名称点击事件 - 显示账户切换弹窗
  if (accountNameBtn && modalOverlay) {
    console.log('绑定账户名称点击事件');
    accountNameBtn.addEventListener('click', (e) => {
      console.log('账户名称被点击，显示账户切换弹窗');
      e.preventDefault();
      e.stopPropagation();
      modalOverlay.classList.remove('hidden');
    });
  } else {
    console.error('未找到账户名称按钮或遮罩层元素');
  }
  
  // 直接绑定关闭按钮事件
  if (closeAccountModal) {
    console.log('找到关闭按钮，绑定点击事件');
    closeAccountModal.addEventListener('click', (e) => {
      console.log('关闭按钮被点击！！！');
      e.preventDefault();
      e.stopPropagation();
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
        console.log('弹窗已隐藏');
      }
    });
  } else {
    console.error('未找到关闭按钮元素');
  }
  
  // 直接绑定遮罩层事件
  if (modalOverlay) {
    console.log('找到遮罩层，绑定点击事件');
    modalOverlay.addEventListener('click', (e) => {
      console.log('遮罩层被点击');
      if (e.target === modalOverlay) {
        console.log('点击的是遮罩层本身，关闭弹窗');
        modalOverlay.classList.add('hidden');
      }
    });
  } else {
    console.error('未找到遮罩层元素');
  }
  
  // 账户项点击事件
  accountItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      console.log(`账户项 ${index + 1} 被点击`);
      e.preventDefault();
      e.stopPropagation();
      
      // 移除所有账户项的活动状态
      accountItems.forEach(accountItem => {
        accountItem.classList.remove('active');
      });
      
      // 添加当前账户项的活动状态
      item.classList.add('active');
      
      // 更新头部显示的账户名称
      const accountName = item.querySelector('.account-name')?.textContent;
      if (accountName && accountNameBtn) {
        accountNameBtn.innerHTML = `${accountName} <span class="dropdown-arrow">▼</span>`;
      }
      
      // 关闭弹窗
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
      
      // 这里可以添加切换账户的逻辑
      uiManager.showSuccess(`已切换到${accountName}`);
    });
  });
  
  // 添加账户按钮事件
  if (addAccountBtn) {
    addAccountBtn.addEventListener('click', (e) => {
      console.log('添加账户按钮被点击');
      e.preventDefault();
      e.stopPropagation();
      
      // 关闭弹窗
      if (modalOverlay) {
        modalOverlay.classList.add('hidden');
      }
      
      // 这里可以添加创建新账户的逻辑
      uiManager.showMessage('添加账户功能即将上线');
    });
  }
}