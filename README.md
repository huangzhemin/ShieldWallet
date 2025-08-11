# MPC多签钱包演示系统 - 快速启动

## 🚀 一键启动

### 方法1：使用启动脚本（推荐）

**Linux/Mac用户：**
```bash
chmod +x start-demo.sh
./start-demo.sh
```

**Windows用户：**
```cmd
start-demo.bat
```

### 方法2：使用Node.js
```bash
npm install
npm start
```

### 方法3：手动启动
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve . -p 3000

# PHP
php -S localhost:8000
```

## 🌐 访问地址

启动成功后，在浏览器中打开：

- **Python**: http://localhost:8000/mpc-demo.html
- **Node.js**: http://localhost:3000/mpc-demo.html
- **PHP**: http://localhost:8000/mpc-demo.html

## 🔧 故障排除

### 问题1：ethers.js加载失败
**解决方案：**
- 检查网络连接
- 刷新页面重试
- 检查浏览器控制台错误信息

### 问题2：密钥分片生成失败
**解决方案：**
- 确保ethers.js库正确加载
- 检查浏览器控制台错误
- 尝试使用不同的浏览器

### 问题3：页面显示异常
**解决方案：**
- 清除浏览器缓存
- 使用现代浏览器（Chrome 88+, Firefox 85+, Safari 14+）
- 检查JavaScript是否启用

## 📱 浏览器兼容性

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+
- ❌ Internet Explorer（不支持）

## 🎯 演示流程

1. **创建钱包** - 设置基本参数
2. **配置参与方** - 设置角色信息
3. **生成密钥分片** - MPC技术演示
4. **发起交易** - 创建多签交易
5. **签名确认** - 多方签名流程
6. **执行交易** - 完成交易

## 💡 使用技巧

- 建议使用Chrome或Firefox浏览器
- 确保网络连接稳定
- 按照步骤顺序操作
- 注意观察每个步骤的提示信息

## 🆘 获取帮助

如果遇到问题，请：

1. 检查浏览器控制台错误信息
2. 查看README.md详细文档
3. 提交GitHub Issue
4. 联系技术支持

---

**享受MPC多签钱包的演示体验！** 🎉 