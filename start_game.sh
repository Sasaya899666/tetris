#!/bin/bash
echo "正在啟動俄羅斯方塊遊戲..."
echo ""
echo "如果遊戲沒有自動開啟，請手動開啟 tetris_standalone.html 文件"
echo ""

# 嘗試使用不同的瀏覽器開啟
if command -v google-chrome &> /dev/null; then
    google-chrome tetris_standalone.html
elif command -v firefox &> /dev/null; then
    firefox tetris_standalone.html
elif command -v safari &> /dev/null; then
    open -a Safari tetris_standalone.html
else
    echo "請手動開啟 tetris_standalone.html 文件"
fi

read -p "按任意鍵繼續..."