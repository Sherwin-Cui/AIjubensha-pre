#!/bin/bash
# 启动AVG游戏演示

echo "🎮 启动萨勒密小镇谋杀案 AVG 演示..."
echo ""
echo "📝 系统已创建以下文件："
echo "  - index.html: 主页面"
echo "  - style.css: 样式文件"
echo "  - game.js: 游戏逻辑"
echo "  - data.js: 剧本数据"
echo "  - parse_script.js: 脚本解析器"
echo ""
echo "🌐 在浏览器中打开游戏..."

# 使用Python启动简单的HTTP服务器
python3 -m http.server 8080 &
SERVER_PID=$!

# 等待服务器启动
sleep 1

# 在默认浏览器中打开
open "http://localhost:8080"

echo ""
echo "✅ 游戏已启动！"
echo "📱 建议使用浏览器的开发者工具切换到手机视图以获得最佳体验"
echo "   Chrome: F12 -> 点击设备切换按钮"
echo ""
echo "按 Ctrl+C 停止服务器..."

# 等待用户中断
wait $SERVER_PID