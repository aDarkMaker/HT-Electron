# HXK Terminal

<div align="center">

![HXK Terminal](https://img.shields.io/badge/HXK-Terminal-ff6b6b?style=for-the-badge&logo=electron&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

*一个超级可爱的跨平台任务管理与协作工具* ✨

[![Star](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=social)](https://github.com/aDarkMaker/HT-Electron)
[![Fork](https://img.shields.io/badge/🍴-Fork%20this%20repo-blue?style=social)](https://github.com/aDarkMaker/HT-Electron)

</div>

---

## 🌟 简介

HXK Terminal 是一个基于 Electron 构建的现代化任务管理应用，专为团队协作而设计！它不仅仅是一个任务管理器，更是一个让你的工作变得井井有条的可爱小助手 🎯

### ✨ 主要特性

- 🎨 **超美界面** - 采用现代化设计，支持深色/浅色主题
- 📅 **智能日历** - 可视化任务时间线，会议状态一目了然
- 👥 **团队协作** - 支持个人任务和团队任务，灵活分配
- 🔔 **实时通知** - 任务提醒，再也不会错过重要事项
- 💾 **本地存储** - 数据安全，支持导入导出
- 🎯 **状态管理** - 任务状态实时更新，进度清晰可见

---

## 🎮 功能展示

### 📋 任务管理
- **个人任务** - 专属你的小任务，完成后直接消失 ✨
- **团队任务** - 多人协作，接取人数实时统计 👥
- **智能状态** - 待接取 → 进行中 → 已完成，状态流转清晰 📊

### 📅 日历视图
- **会议管理** - 出勤状态：待确认 🟡 / 确认前往 🟢 / 请假 🔴
- **截止日期** - 重要任务截止时间高亮显示 ⏰
- **事件详情** - 点击查看详细信息，支持快速操作 🖱️

### ⚙️ 个性化设置
- **主题切换** - 深色/浅色主题，护眼又美观 🌙☀️
- **数据管理** - 一键导入导出，数据安全有保障 💾
- **用户信息** - 个性化头像和昵称设置 👤

---

## 🚀 快速开始

### 📦 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 🎯 运行项目

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm start

# 构建应用
pnpm build
```

### 🎨 开发工具

```bash
# 代码检查
pnpm spellcheck

# 代码格式化
pnpm prepare
```

---

## 🏗️ 项目结构

```
HXK Terminal/
├── 📁 src/
│   ├── 📁 main/           # 主进程代码
│   ├── 📁 renderer/       # 渲染进程代码
│   │   ├── 📁 js/         # JavaScript 模块
│   │   ├── 📁 styles/     # CSS 样式文件
│   │   ├── 📁 Assets/     # 静态资源
│   │   └── 📄 index.html  # 主页面
│   └── 📄 preload.js      # 预加载脚本
├── 📄 package.json        # 项目配置
└── 📄 README.md          # 项目说明
```

---

## 🎯 核心模块

### 🧠 应用核心 (`app.js`)
- 应用初始化和生命周期管理
- 数据加载和保存
- 模块间通信协调

### 📋 任务管理 (`task.js`)
- 任务发布、接取、完成、放弃
- 个人任务和团队任务逻辑
- 任务状态管理和界面更新

### 📅 日历管理 (`calendar.js`)
- 日历视图渲染和交互
- 事件详情模态框
- 会议出勤状态管理

### 🧭 导航管理 (`navigation.js`)
- 侧边栏导航控制
- 用户信息管理
- 主题切换功能

### ⚙️ 设置管理 (`settings.js`)
- 应用设置持久化
- 数据导入导出
- 用户偏好管理

---

## 🎨 技术栈

- **🖥️ Electron** - 跨平台桌面应用框架
- **💾 Electron Store** - 本地数据存储
- **🎨 CSS3** - 现代化样式设计
- **📱 响应式设计** - 适配不同屏幕尺寸
- **🔧 ESLint + Prettier** - 代码质量保证

---

## 🎯 使用指南

### 📝 发布任务
1. 点击 "发布任务" 按钮 📝
2. 填写任务信息（标题、描述、类型、截止时间）
3. 选择任务类型：个人任务 🧑‍💻 或团队任务 👥
4. 设置优先级和标签 🏷️
5. 发布完成！任务将出现在待接取列表中 ✨

### 🎯 接取任务
1. 在 "待接取任务" 标签页浏览可用任务 👀
2. 点击感兴趣的任务查看详情 📋
3. 点击 "接取任务" 按钮 🎯
4. 任务自动移动到 "我的任务" 中 📌

### ✅ 完成任务
1. 在 "我的任务" 中找到要完成的任务 🎯
2. 点击 "完成" 按钮 ✅
3. 任务立即从列表中消失，完成！🎉

### 🗑️ 放弃任务
- **个人任务** - 放弃后重新回到待接取列表，其他人可以接取 🔄
- **团队任务** - 放弃后不会退回，只是从你的任务列表中移除 🚫

---

## 🎨 界面预览

### 🏠 主页
- 任务统计概览 📊
- 快速操作按钮 🚀
- 最近活动时间线 📈

### 📋 任务管理
- 标签页切换：待接取 / 我的任务 📑
- 任务卡片展示：状态、优先级、截止时间 🎯
- 实时任务计数徽章 🔢

### 📅 日历视图
- 月历导航：上一月 / 下一月 ⬅️➡️
- 事件标记：不同类型用不同颜色 🎨
- 点击查看详情：会议出勤、任务信息 📋

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码、文档、设计还是想法 💡

### 🐛 报告问题
- 使用 GitHub Issues 报告 bug 🐛
- 提供详细的复现步骤 📝
- 包含系统信息和错误日志 💻

### 💻 提交代码
1. Fork 项目 🍴
2. 创建功能分支 `git checkout -b feature/amazing-feature` 🌟
3. 提交更改 `git commit -m 'Add amazing feature'` ✨
4. 推送分支 `git push origin feature/amazing-feature` 🚀
5. 创建 Pull Request 📝

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 


## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！你们让 HXK Terminal 变得更加可爱和实用 ✨

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！⭐**

Made with by Orange

</div>
