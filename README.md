# HXK Terminal

一个基于 Electron 的跨平台任务管理与协作工具。

## 特性

- **任务管理** - 支持个人任务和团队任务，实时状态跟踪
- **日历视图** - 可视化日程安排，支持事件和会议管理
- **文件管理** - 集成 Alist 文件存储服务
- **主题切换** - 支持深色/浅色主题
- **国际化** - 支持中英文切换

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行

```bash
# 开发模式
pnpm dev

# 预览模式
pnpm start
```

### 构建

```bash
# 构建 Win 和 Mac 平台
bash build.sh

# 构建 Windows
pnpm build:win

# 构建 macOS
pnpm build:mac
```

## 项目结构

```
src/
├── main.js              # 主进程入口
├── preload.js           # 预加载脚本
└── renderer/            # 渲染进程
    ├── index.html        # 主页面
    ├── js/               # JavaScript 模块
    │   ├── app.js        # 应用核心
    │   ├── task.js       # 任务管理
    │   ├── calendar.js   # 日历管理
    │   ├── navigation.js # 导航管理
    │   ├── settings.js   # 设置管理
    │   └── files.js      # 文件管理
    ├── styles/           # CSS 样式
    ├── Assets/          # 静态资源
    └── i18n/            # 国际化
backend/                 # 后端服务（Python FastAPI）
```

## 核心模块

- **app.js** - 应用初始化、数据管理、模块协调
- **task.js** - 任务发布、接取、完成、放弃
- **calendar.js** - 日历渲染、事件管理
- **navigation.js** - 侧边栏导航、用户信息
- **settings.js** - 设置持久化、数据导入导出
- **files.js** - Alist 集成、文件管理

## 技术栈

- **Electron** - 桌面应用框架
- **electron-store** - 本地数据存储
- **FastAPI** - 后端 API 服务
- **ESLint + Prettier** - 代码质量控制
- **Husky + lint-staged** - Git 钩子和代码检查

## 开发

```bash
# 代码检查
pnpm spellcheck

# 格式化代码
pnpm prepare
```

## 使用指南

### 任务管理

1. **发布任务** - 点击 "发布任务" 填写信息并选择类型
2. **接取任务** - 在 "待接取" 中浏览并接取任务
3. **完成任务** - 在 "我的任务" 中完成任务
4. **放弃任务** - 个人任务可退回待接取，团队任务仅移除

### 日历管理

- 添加事件 - 设置日期、时间、类型和描述
- 查看详情 - 点击日历上的事件查看详情
- 会议出席 - 标记会议出勤状态（待确认/确认/请假）

## 许可证

[MIT](LICENSE)

---

Made with ❤️ by HXK Team
