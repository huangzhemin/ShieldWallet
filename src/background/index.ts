/**
 * ShieldWallet 后台脚本
 * 处理钱包核心功能和安全操作
 */

import { WalletService } from '../services/wallet';
import { StorageService } from '../services/storage';
import { CryptoUtils } from '../utils/crypto';

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
async function checkWalletExists(): Promise<any> {
  try {
    const exists = await WalletService.walletExists();
    return { success: true, exists };
  } catch (error) {
    console.error('检查钱包存在出错:', error);
    return { success: false, error: '检查钱包状态失败' };
  }
}

// 创建新钱包
async function createWallet(password: string): Promise<any> {
  try {
    const result = await WalletService.createWallet(password);
    return { 
      success: true, 
      mnemonic: result.mnemonic,
      address: result.wallet.address 
    };
  } catch (error) {
    console.error('创建钱包出错:', error);
    return { success: false, error: '创建钱包失败' };
  }
}

// 导入钱包
async function importWallet(data: any): Promise<any> {
  try {
    const { type, value, password } = data;
    const result = await WalletService.importWallet(value, type, password);
    return { success: true, address: result.wallet.address };
  } catch (error) {
    console.error('导入钱包出错:', error);
    return { success: false, error: '导入钱包失败' };
  }
}

// 获取账户信息
async function getAccountInfo(): Promise<any> {
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
  } catch (error) {
    console.error('获取账户信息出错:', error);
    return { success: false, error: '获取账户信息失败' };
  }
}

// 发送交易
async function sendTransaction(data: any): Promise<any> {
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
  } catch (error) {
    console.error('发送交易出错:', error);
    return { success: false, error: '发送交易失败' };
  }
}

// 切换网络
async function switchNetwork(networkId: string): Promise<any> {
  try {
    await StorageService.saveCurrentNetwork(networkId);
    return { success: true };
  } catch (error) {
    console.error('切换网络出错:', error);
    return { success: false, error: '切换网络失败' };
  }
}