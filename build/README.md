# Windows 安装界面 - 使用应用 UI 设计

## 🎨 基于应用设计的安装界面

本项目将 **HXK Terminal 应用的设计风格**应用到 Windows 安装程序，提供一致的品牌体验。

## ⚡ 快速开始

### 1️⃣ 生成安装界面图片

```bash
# 生成应用风格的安装界面图片
./build/create-installer-images.sh
```

这将创建使用应用配色方案的图片：
- 紫色渐变欢迎页（#667eea → #764ba2）
- 导航栏风格侧边栏（#949dc0）
- 蓝色渐变进度条（#4299e1 → #63b3ed）

### 2️⃣ 构建安装程序

```bash
# 构建 Windows 安装程序
pnpm run build:win
```

### 3️⃣ 测试安装

生成的安装程序位于 `dist/` 目录。

## 🎨 设计特性

### 配色方案（参考应用 CSS）

| 元素 | 颜色 | 来源文件 | 用途 |
|------|------|----------|------|
| 主色渐变 | #667eea → #764ba2 | `task.css:50` | 按钮、重要元素 |
| 导航栏 | #949dc0 | `navigation.css:30` | 侧边栏 |
| 进度条 | #4299e1 → #63b3ed | `files.css:171` | 进度指示 |
| 背景色 | #f5f5f5 | `main.css:46` | 页面背景 |
| 成功色 | #48bb78 | `task.css:258` | 完成提示 |

### 动画效果

参考应用的动画设计：
- **过渡**: `cubic-bezier(0.4, 0, 0.2, 1)` - 0.3s
- **悬停**: `translateY(-1px)` + 阴影增强
- **按钮圆角**: 8-16px
- **卡片阴影**: `0 4px 12px rgba(0, 0, 0, 0.08)`

## 📁 文件结构

```
build/
├── create-installer-images.sh    # 图片生成脚本
├── installer-theme.nsh           # 主题配置
├── installer-ui.nsh              # UI 配置
├── custom-installer-script.nsh   # 自定义脚本
├── UI-DESIGN.md                  # 完整设计规范
├── README.md                     # 本文件
└── ui/                           # 生成的图片
    ├── welcome.bmp
    ├── header.bmp
    ├── sidebar.bmp
    └── installing.bmp
```

## 🔧 配置说明

### package.json

```json
{
  "nsis": {
    "oneClick": false,
    "language": "SimpChinese",
    "installerLanguages": ["SimpChinese", "TradChinese", "English"],
    "runAfterFinish": true,
    "createDesktopShortcut": true,
    "include": [
      "build/installer-theme.nsh",
      "build/installer-ui.nsh"
    ],
    "welcomeIcon": "build/ui/welcome.bmp",
    "sidebarImage": "build/ui/sidebar.bmp",
    "installerHeaderIcon": "build/ui/header.bmp"
  }
}
```

## ✏️ 自定义指南

### 修改文本

编辑 `build/installer-theme.nsh`:

```nsis
; 修改欢迎页文本
!define WELCOME_TEXT \
    "您的自定义文本..."
```

### 修改配色

编辑 `build/create-installer-images.sh`:

```bash
# 更改主色调
PRIMARY_START="#667eea"
PRIMARY_END="#764ba2"
```

### 修改安装行为

编辑 `build/installer-ui.nsh`:

```nsis
Function .onInstSuccess
    ; 您的自定义代码
FunctionEnd
```

## 📚 详细文档

- **设计规范**: 查看 `UI-DESIGN.md`
- **应用 CSS**: 参考 `src/renderer/styles/`
- **NSIS 文档**: https://nsis.sourceforge.io/

## ✨ 功能列表

✅ 应用风格设计（紫色渐变主题）  
✅ 简体中文界面  
✅ 自定义图标和图片  
✅ 向导式安装流程  
✅ 进度指示（蓝色渐变）  
✅ 自动启动应用  
✅ 多语言支持（简/繁/英）

## 🐛 常见问题

**Q: ImageMagick 未安装？**  
A: `brew install imagemagick` (macOS) 或 `apt-get install imagemagick` (Linux)

**Q: 图片不显示？**  
A: 确保图片是 BMP 格式，路径正确

**Q: 如何添加语言？**  
A: 编辑 `package.json` 的 `installerLanguages`

## 📝 下一步

1. ✅ 运行 `./build/create-installer-images.sh`
2. ✅ 运行 `pnpm run build:win`
3. ✅ 测试安装程序
4. ✅ （可选）自定义配色和文本

享受您的应用风格的安装界面！🎉
