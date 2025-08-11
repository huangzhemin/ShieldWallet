#!/bin/bash

# MPC多签钱包演示系统启动脚本
# 支持多种启动方式

echo "🚀 MPC多签钱包演示系统启动中..."
echo "=================================="

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "✅ 检测到Python3，使用Python启动服务器..."
    echo "🌐 服务器将在 http://localhost:8000 启动"
    echo "📱 请在浏览器中打开: http://localhost:8000/mpc-demo.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8000
    
elif command -v python &> /dev/null; then
    echo "✅ 检测到Python，使用Python启动服务器..."
    echo "🌐 服务器将在 http://localhost:8000 启动"
    echo "📱 请在浏览器中打开: http://localhost:8000/mpc-demo.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python -m http.server 8000
    
# 检查Node.js是否可用
elif command -v node &> /dev/null; then
    echo "✅ 检测到Node.js，使用npx serve启动服务器..."
    echo "🌐 服务器将在 http://localhost:3000 启动"
    echo "📱 请在浏览器中打开: http://localhost:3000/mpc-demo.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    npx serve . -p 3000
    
# 检查PHP是否可用
elif command -v php &> /dev/null; then
    echo "✅ 检测到PHP，使用PHP启动服务器..."
    echo "🌐 服务器将在 http://localhost:8000 启动"
    echo "📱 请在浏览器中打开: http://localhost:8000/mpc-demo.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    php -S localhost:8000
    
else
    echo "❌ 未检测到可用的服务器环境"
    echo ""
    echo "请安装以下任一环境："
    echo "  - Python 3.x: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo "  - PHP: https://www.php.net/downloads.php"
    echo ""
    echo "或者手动启动："
    echo "  - Python: python3 -m http.server 8000"
    echo "  - Node.js: npx serve . -p 3000"
    echo "  - PHP: php -S localhost:8000"
    echo ""
    echo "然后打开浏览器访问对应的URL"
    exit 1
fi 