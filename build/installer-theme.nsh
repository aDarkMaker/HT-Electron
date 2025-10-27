; HXK Terminal 安装界面主题配置
; 参考应用 UI 设计风格

; ------------------------ 颜色方案（参考应用CSS） ------------------------

; 主色调 - 紫色渐变（参考 task.css line 50）
!define COLOR_PRIMARY "#667eea"
!define COLOR_PRIMARY_END "#764ba2"
!define COLOR_GRADIENT ${COLOR_PRIMARY}-${COLOR_PRIMARY_END}

; 导航栏配色（参考 navigation.css line 30）
!define COLOR_SIDEBAR "#949dc0"

; 背景色（参考 main.css line 46）
!define COLOR_BG_LIGHT "#f5f5f5"
!define COLOR_BG_DARK "#1a202c"

; 进度条配色（参考 files.css line 171）
!define COLOR_PROGRESS_START "#4299e1"
!define COLOR_PROGRESS_END "#63b3ed"

; 成功色（参考按钮样式）
!define COLOR_SUCCESS "#48bb78"

; 文本颜色
!define COLOR_TEXT_LIGHT "#2d3748"
!define COLOR_TEXT_DARK "#f5f5f5"
!define COLOR_TEXT_SECONDARY "#718096"

; ------------------------ UI 文本（应用风格） ------------------------

; 安装标题（参考应用视图标题风格）
!define INSTALL_TITLE "HXK Terminal"
!define INSTALL_SUBTITLE "统一管理工作资料与任务的跨平台协作工具"

; 欢迎页文本
!define WELCOME_TITLE "欢迎使用 HXK Terminal"
!define WELCOME_SUBTITLE "安装向导"
!define WELCOME_TEXT \
    "感谢您选择 HXK Terminal！$\r$\n$\r$\n\
    HXK Terminal 是一个专业的统一管理工作资料与任务的跨平台协作工具，$\r$\n\
    将帮助您更高效地管理团队协作和工作流程。$\r$\n$\r$\n$\r$\n\
    点击「下一步」开始安装。"

; 安装目录页
!define DIRECTORY_TITLE "选择安装位置"
!define DIRECTORY_TEXT \
    "请选择 HXK Terminal 的安装目录。$\r$\n$\r$\n\
    如果没有特殊需求，建议使用默认安装位置。$\r$\n\
    安装程序需要至少 200 MB 的可用空间。"

; 安装进度页
!define PROGRESS_TITLE "正在安装..."
!define PROGRESS_TEXT \
    "正在将 HXK Terminal 安装到您的计算机。$\r$\n$\r$\n\
    这可能需要几分钟时间，请耐心等待。$\r$\n\
    请不要关闭此窗口。"

; 完成页
!define FINISH_TITLE "安装完成！"
!define FINISH_SUBTITLE "准备就绪"
!define FINISH_TEXT \
    "HXK Terminal 已成功安装到您的计算机。$\r$\n$\r$\n\
    您现在可以：$\r$\n$\r$\n\
    • 立即启动应用 $\r$\n\
    • 从桌面快捷方式启动 $\r$\n\
    • 从开始菜单启动"

; ------------------------ 自定义函数 ------------------------

; 初始化主题
Function InitTheme
    ; 设置窗口样式（可选）
    ; System::Call '*(&i2 0x41B0, &i2 0x1000, i r2, i 0, i 0, i r3) i.s'
FunctionEnd

; 安装进度更新
Function UpdateProgress
    ; 使用应用风格的进度条动画
    ; 参考 files.css line 169-182
FunctionEnd

; 应用风格的选择目录对话框
Function BrowseForFolder
    ; 自定义文件夹选择对话框样式
FunctionEnd

; ------------------------ 动画效果 ------------------------

; 平滑过渡动画（参考 CSS 中 cubic-bezier(0.4, 0, 0.2, 1)）
!define ANIMATION_EASE "cubic-bezier(0.4, 0, 0.2, 1)"

; 按钮悬停效果（参考 buttons）
!define BUTTON_HOVER_LIFT "translateY(-1px)"

; 卡片阴影（参考 task-card shadow）
!define CARD_SHADOW "0 4px 12px rgba(0, 0, 0, 0.08)"

