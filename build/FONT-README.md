# 安装界面字体配置

## 📝 字体使用说明

HXK Terminal 安装界面现在使用与应用相同的字体：**AlimamaShuHeiTi-Bold**（阿里巴巴普惠体粗体）。

## ✨ 特性

### 字体一致性
- 安装界面与应用使用相同字体
- 提供统一的品牌视觉体验
- 中文显示效果更佳

### 字体信息
- **字体名称**: AlimamaShuHeiTi-Bold
- **文件路径**: `src/renderer/Assets/Fonts/AlimamaShuHeiTi-Bold.ttf`
- **文件大小**: ~1.4 MB
- **字体类型**: TrueType Font (.ttf)

## 🎨 字体大小配置

| 元素 | 字号 | 说明 |
|------|------|------|
| 欢迎页主标题 | 30px | "HXK" |
| 欢迎页副标题 | 26px | "TERMINAL" |
| 欢迎页描述 | 13px | "安装向导" |
| 欢迎页细节 | 10px | 说明文字 |
| 顶部横幅 | 17px | "HXK Terminal" |
| 安装中标题 | 28px | "安装中" |
| 安装中状态 | 12px | 状态文本 |
| 安装中提示 | 10px | 提示文本 |

## 🛠️ 字体渲染

图片生成脚本会自动检测并使用字体。如果字体文件不存在，会回退到系统默认字体。

## 📊 效果对比

### 使用自定义字体
- ✅ 与应用 UI 完全一致
- ✅ 中文字符渲染更美观
- ✅ 品牌识别度更高

### 使用系统字体
- 如果字体文件找不到，会使用 Arial-Bold
- 功能不受影响

## 🔧 如何禁用字体

如果需要使用系统默认字体，可以：

1. 临时重命名字体文件
2. 编辑 `build/create-installer-images.sh`，注释掉字体检测部分

## 📝 技术说明

### ImageMagick 字体渲染

ImageMagick 支持使用 .ttf 字体文件。脚本会自动：
1. 检测字体文件是否存在
2. 使用字体路径渲染文本
3. 生成包含字体的图片文件

### 字体路径处理

脚本使用绝对路径确保在不同环境下都能找到字体文件：
```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FONT_PATH="$PROJECT_ROOT/src/renderer/Assets/Fonts/AlimamaShuHeiTi-Bold.ttf"
```

## ✅ 验证字体是否使用

运行脚本后，查看输出：
```
✅ 使用自定义字体: AlimamaShuHeiTi-Bold.ttf
```

如果没有看到此消息，检查字体文件是否存在。

## 🎯 下一步

1. 运行 `./build/create-installer-images.sh`
2. 检查生成的图片是否使用了正确字体
3. 构建安装程序: `pnpm run build:win`
4. 测试安装程序界面

享受与应用一致的字体体验！🎉

