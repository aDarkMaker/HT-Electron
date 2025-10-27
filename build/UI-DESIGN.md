# HXK Terminal 安装界面 UI 设计规范

## 📐 设计概览

基于应用的设计风格，安装界面使用统一的视觉语言和交互体验。

## 🎨 配色方案

### 主色调（参考 `task.css`）
```css
/* 主要渐变色 */
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```
- **开始色**: `#667eea` (紫蓝色)
- **结束色**: `#764ba2` (深紫色)
- **用途**: 按钮、重要元素、强调色

### 导航栏配色（参考 `navigation.css`）
```css
background: #949dc0;
```
- **颜色**: `#949dc0`
- **用途**: 侧边栏、导航区域

### 背景色
- **浅色主题**: `#f5f5f5` (参考 `main.css` line 46)
- **深色主题**: `#1a202c` (参考 `modal.css`)

### 进度条配色（参考 `files.css` line 171）
```css
linear-gradient(90deg, #4299e1, #63b3ed)
```
- **开始色**: `#4299e1` (蓝色)
- **结束色**: `#63b3ed` (浅蓝色)
- **用途**: 安装进度条、加载动画

### 成功色
- **颜色**: `#48bb78`
- **用途**: 完成状态、成功提示

## 📝 字体规范

### 字体族（参考 `main.css`）
```
'AlimamaShuHeiTi-Bold',
-apple-system,
BlinkMacSystemFont,
'Segoe UI',
'PingFang SC',
'Hiragino Sans GB',
'Microsoft YaHei',
'Helvetica Neue',
Helvetica,
Arial,
sans-serif
```

### 字号
- **标题**: 28px（参考 `.view-title h2`）
- **副标题**: 14px（参考 `.view-title p`）
- **正文**: 15-16px
- **辅助文本**: 12-14px

## 🎭 动画效果

### 过渡动画（参考 CSS）
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```
- **缓动函数**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **持续时间**: 0.3-0.4s

### 按钮悬停效果（参考 buttons）
```css
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

## 🎨 UI 组件样式

### 按钮风格

#### 主按钮（参考 `main.css` line 119）
```css
.primary-btn {
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    transition: all 0.2s ease;
}
```

#### 卡片样式（参考 `task.css`）
```css
.task-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

## 📊 进度条设计

### 动画进度条（参考 `files.css` line 169）
```css
.progress-bar {
    background: linear-gradient(90deg, #4299e1, #63b3ed);
    animation: progress 1.5s ease-in-out infinite;
}

@keyframes progress {
    0% { width: 0%; transform: translateX(0); }
    50% { width: 50%; transform: translateX(0); }
    100% { width: 100%; transform: translateX(0); }
}
```

### 加载动画（参考 `files.css` line 134）
```css
.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
```

## 🖼️ 安装界面元素

### 欢迎页
- **背景**: 紫色渐变（#667eea → #764ba2）
- **文本**: 白色，粗体
- **图标**: 无（或使用简单几何图形）

### 安装进度页
- **主色**: 紫色（#667eea）
- **进度条**: 蓝色渐变（#4299e1 → #63b3ed）
- **背景**: 浅灰色（#f5f5f5）

### 完成页
- **主色**: 成功绿（#48bb78）
- **图标**: 圆形对勾
- **按钮**: 紫色渐变，带阴影

## 📐 布局规范

### 间距
- **外边距**: 16-20px
- **内边距**: 12-16px
- **圆角**: 8-16px

### 阴影
- **卡片阴影**: `0 4px 12px rgba(0, 0, 0, 0.08)`
- **按钮阴影**: `0 2px 8px rgba(102, 126, 234, 0.3)`

## 🔄 交互反馈

### 悬停效果
- **按钮**: 上移 1-2px
- **阴影增强**: 提升 1-2 个单位
- **透明度变化**: 0.2-0.3

### 点击效果
- **按压**: 回到原位置
- **反馈时间**: 0.2s

## 📱 响应式设计

### 断点
- **移动端**: < 768px
- **桌面端**: >= 768px

### 适配
- 按钮最小尺寸: 44x44px（触摸友好）
- 文本最小字号: 12px

## 🎯 设计原则

1. **一致性**: 与应用 UI 保持一致的设计语言
2. **简洁性**: 避免不必要的装饰元素
3. **清晰性**: 信息层次分明，易于理解
4. **可访问性**: 足够的颜色对比度（4.5:1+）

## 📚 参考文件

- 主样式: `src/renderer/styles/main.css`
- 任务样式: `src/renderer/styles/task.css`
- 导航样式: `src/renderer/styles/navigation.css`
- 文件样式: `src/renderer/styles/files.css`

## 🛠️ 实现指南

1. **使用提供的脚本**生成图片:
   ```bash
   ./build/create-installer-images.sh
   ```

2. **编辑主题配置**（如需要）:
   ```bash
   # 修改颜色
   vim build/installer-theme.nsh
   
   # 修改文本
   vim build/installer-ui.nsh
   ```

3. **构建安装程序**:
   ```bash
   pnpm run build:win
   ```

## ✨ 示例

### 按钮样式示例
```nsis
; 主按钮（紫色渐变）
!define BUTTON_PRIMARY_BG "#667eea-#764ba2"

; 成功按钮（绿色）
!define BUTTON_SUCCESS_BG "#48bb78-#38a169"
```

### 进度条示例
```nsis
; 进度条（蓝色渐变）
!define PROGRESS_BAR "#4299e1-#63b3ed"
```

