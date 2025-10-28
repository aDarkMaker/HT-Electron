#!/bin/bash

# 图标生成脚本
# 用于将 PNG 图标转换为各平台所需的格式

ICON_SOURCE="icon/icon.png"
ICON_DIR="icon"

echo "开始生成应用图标..."

# 检查源文件是否存在
if [ ! -f "$ICON_SOURCE" ]; then
    echo "错误: 找不到源图标文件 $ICON_SOURCE"
    exit 1
fi

# 检测 macOS (Darwin)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "检测到 macOS 系统，开始生成 .icns 文件..."
    
    # 创建 .iconset 目录
    rm -rf icon/icon.iconset
    mkdir -p icon/icon.iconset
    
    # 生成所需的各种尺寸
    # 1. 使用 sips 命令生成各种尺寸
    sips -z 16 16 "$ICON_SOURCE" --out icon/icon.iconset/icon_16x16.png
    sips -z 32 32 "$ICON_SOURCE" --out icon/icon.iconset/icon_16x16@2x.png
    
    sips -z 32 32 "$ICON_SOURCE" --out icon/icon.iconset/icon_32x32.png
    sips -z 64 64 "$ICON_SOURCE" --out icon/icon.iconset/icon_32x32@2x.png
    
    sips -z 128 128 "$ICON_SOURCE" --out icon/icon.iconset/icon_128x128.png
    sips -z 256 256 "$ICON_SOURCE" --out icon/icon.iconset/icon_128x128@2x.png
    
    sips -z 256 256 "$ICON_SOURCE" --out icon/icon.iconset/icon_256x256.png
    sips -z 512 512 "$ICON_SOURCE" --out icon/icon.iconset/icon_256x256@2x.png
    
    sips -z 512 512 "$ICON_SOURCE" --out icon/icon.iconset/icon_512x512.png
    sips -z 1024 1024 "$ICON_SOURCE" --out icon/icon.iconset/icon_512x512@2x.png
    
    # 生成 .icns 文件
    iconutil -c icns icon/icon.iconset -o icon/icon.icns
    
    echo "✓ .icns 文件已生成: icon/icon.icns"
    
    # 清理临时文件
    rm -rf icon/icon.iconset
fi

# 检测 Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "检测到 Linux 系统，使用 PNG 作为图标..."
    # Linux 直接使用 PNG 文件
    echo "✓ Linux 平台将使用 PNG 图标"
fi

# Windows .ico 生成提示
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "检测到 Windows 系统..."
    echo "请使用在线工具或 ImageMagick 将 PNG 转换为 .ico 格式"
    echo "建议尺寸: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256"
else
    echo ""
    echo "注意: Windows .ico 文件需要单独生成"
    echo "可以使用 ImageMagick 命令:"
    echo "  convert -background none icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico"
    echo "或使用在线工具: https://convertio.co/png-ico/"
fi

echo ""
echo "图标生成完成!"
echo ""
echo "文件列表:"
ls -lh icon/

