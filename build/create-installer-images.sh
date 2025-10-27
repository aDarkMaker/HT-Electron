#!/bin/bash
# 创建安装界面自定义图片
# 使用应用的设计风格：紫色渐变主题

echo "🎨 创建 HXK Terminal 安装界面图片（应用风格）..."

# 创建图片目录
mkdir -p build/ui

# 检查 ImageMagick 是否安装
if ! command -v convert &> /dev/null; then
    echo "❌ 错误: 需要安装 ImageMagick"
    echo "   安装方法:"
    echo "   macOS: brew install imagemagick"
    echo "   Linux: apt-get install imagemagick"
    exit 1
fi

# 应用配色方案（参考 CSS）
PRIMARY_START="#667eea"      # 主色开始（参考 task.css）
PRIMARY_END="#764ba2"         # 主色结束
SIDEBAR_COLOR="#949dc0"       # 侧边栏色（参考 navigation.css）
PROGRESS_START="#4299e1"      # 进度条开始（参考 files.css）
PROGRESS_END="#63b3ed"        # 进度条结束

# 字体路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FONT_PATH="$PROJECT_ROOT/src/renderer/Assets/Fonts/AlimamaShuHeiTi-Bold.ttf"

# 检查字体文件是否存在
if [ -f "$FONT_PATH" ]; then
    echo "✅ 使用自定义字体: AlimamaShuHeiTi-Bold.ttf"
    USE_CUSTOM_FONT=true
else
    echo "⚠️  未找到自定义字体，使用系统默认字体"
    USE_CUSTOM_FONT=false
fi

# 1. 欢迎页图片 (164x314) - 使用应用主色调
echo "📝 创建欢迎页图片（紫色渐变）..."
if [ "$USE_CUSTOM_FONT" = true ]; then
    convert -size 164x314 \
        gradient:"${PRIMARY_START}-${PRIMARY_END}" \
        -font "$FONT_PATH" -pointsize 30 \
        -fill white \
        -gravity North \
        -annotate +0+60 'HXK' \
        -font "$FONT_PATH" -pointsize 26 \
        -annotate +0+105 'TERMINAL' \
        -font "$FONT_PATH" -pointsize 13 \
        -annotate +0+175 '安装向导' \
        -fill rgba\(255,255,255,0.7\) \
        -font "$FONT_PATH" -pointsize 10 \
        -annotate +0+225 '欢迎使用' \
        -annotate +0+245 '华小科自己的工作台' \
        build/ui/welcome.bmp
else
    convert -size 164x314 \
        gradient:"${PRIMARY_START}-${PRIMARY_END}" \
        -font "Arial-Bold" -pointsize 28 \
        -fill white \
        -gravity North \
        -annotate +0+70 'HXK' \
        -font "Arial-Bold" -pointsize 24 \
        -annotate +0+110 'TERMINAL' \
        -font "Arial" -pointsize 12 \
        -annotate +0+180 '安装向导' \
        -fill rgba\(255,255,255,0.7\) \
        -font "Arial" -pointsize 10 \
        -annotate +0+230 '统一管理' \
        -annotate +0+250 '工作资料与任务' \
        build/ui/welcome.bmp
fi

# 2. 顶部横幅 (150x57) - 应用风格
echo "📝 创建顶部横幅（渐变风格）..."
if [ "$USE_CUSTOM_FONT" = true ]; then
    convert -size 150x57 \
        gradient:"${PRIMARY_START}-${PRIMARY_END}" \
        -font "$FONT_PATH" -pointsize 17 \
        -fill white \
        -gravity Center \
        -annotate +0+0 'HXK Terminal' \
        build/ui/header.bmp
else
    convert -size 150x57 \
        gradient:"${PRIMARY_START}-${PRIMARY_END}" \
        -font "Arial-Bold" -pointsize 16 \
        -fill white \
        -gravity Center \
        -annotate +0+0 'HXK Terminal' \
        build/ui/header.bmp
fi

# 3. 侧边栏 (55x317) - 使用导航栏配色
echo "📝 创建侧边栏（参考导航栏颜色）..."
convert -size 55x317 \
    xc:"${SIDEBAR_COLOR}" \
    -fill rgba\(255,255,255,0.3\) \
    -draw 'polygon 18,80 28,70 38,80 28,90 18,80' \
    -fill rgba\(255,255,255,0.2\) \
    -draw 'rectangle 5,5 50,310' \
    build/ui/sidebar.bmp

# 4. 安装中页面图片（进度条风格）
echo "📝 创建安装中页面图片（进度条配色）..."
if [ "$USE_CUSTOM_FONT" = true ]; then
    convert -size 164x314 \
        xc:"${PRIMARY_START}" \
        -fill white \
        -font "$FONT_PATH" -pointsize 28 \
        -gravity Center \
        -annotate +0-50 '安装中' \
        -fill rgba\(255,255,255,0.8\) \
        -font "$FONT_PATH" -pointsize 12 \
        -annotate +0+50 '正在安装文件...' \
        -fill rgba\(255,255,255,0.5\) \
        -font "$FONT_PATH" -pointsize 10 \
        -annotate +0+80 '请稍候' \
        build/ui/installing.bmp
else
    convert -size 164x314 \
        xc:"${PRIMARY_START}" \
        -fill white \
        -font "Arial-Bold" -pointsize 26 \
        -gravity Center \
        -annotate +0-50 '安装中' \
        -fill rgba\(255,255,255,0.8\) \
        -font "Arial" -pointsize 11 \
        -annotate +0+50 '正在安装文件...' \
        -fill rgba\(255,255,255,0.5\) \
        -font "Arial" -pointsize 9 \
        -annotate +0+80 '请稍候' \
        build/ui/installing.bmp
fi

# 5. 进度条示例（用于参考）
echo "📝 创建进度条示例..."
convert -size 300x4 \
    gradient:"${PROGRESS_START}-${PROGRESS_END}" \
    -blur 0x0.5 \
    build/ui/progress-example.bmp

echo ""
echo "✅ 完成！应用风格的图片已创建在 build/ui/ 目录"
echo ""
echo "📋 创建的文件："
echo "   • welcome.bmp - 欢迎页（紫色渐变）"
echo "   • header.bmp - 顶部横幅（紫色渐变）"
echo "   • sidebar.bmp - 侧边栏（#949dc0 色）"
echo "   • installing.bmp - 安装中页面（进度条配色）"
echo "   • progress-example.bmp - 进度条示例（蓝色渐变）"
echo ""
echo "🎨 使用的配色方案："
echo "   主色：${PRIMARY_START} → ${PRIMARY_END}"
echo "   导航栏：${SIDEBAR_COLOR}"
echo "   进度条：${PROGRESS_START} → ${PROGRESS_END}"
echo ""
echo "📝 下一步："
echo "   1. 检查图片是否符合应用设计风格"
echo "   2. 如果需要调整，编辑此脚本"
echo "   3. 运行: pnpm run build:win"

