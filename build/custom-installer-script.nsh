; 完全自定义的安装界面脚本
; 使用这个文件可以完全控制安装界面的外观和行为

; ------------------------ 颜色方案 ------------------------

; 定义自定义颜色（RGB格式：0xBBGGRR）
!define COLOR_PRIMARY 0x00B2D2EE    ; 浅蓝色主题
!define COLOR_SECONDARY 0x0078D4    ; 深蓝色
!define COLOR_SUCCESS 0x00BB6B4A    ; 绿色
!define COLOR_ERROR 0x00D32F2F       ; 红色
!define COLOR_BACKGROUND 0x00F5F5F5  ; 浅灰色背景

; ------------------------ 页面文本 ------------------------

; 欢迎页
!define CUSTOM_WELCOME_TITLE "HXK Terminal 安装向导"
!define CUSTOM_WELCOME_SUBTITLE "统一管理工作资料与任务的跨平台协作工具"
!define CUSTOM_WELCOME_TEXT \
    "欢迎使用 HXK Terminal！$\r$\n$\r$\n\
    本向导将帮助您安装 HXK Terminal 到您的计算机。$\r$\n$\r$\n\
    在安装过程中，您可以：$\r$\n\
    • 选择安装位置$\r$\n\
    • 创建桌面快捷方式$\r$\n\
    • 启动应用$\r$\n$\r$\n\
    点击「下一步」继续。"

; 安装目录页
!define CUSTOM_DIRECTORY_TITLE "选择安装位置"
!define CUSTOM_DIRECTORY_TEXT \
    "选择 HXK Terminal 的安装目录。$\r$\n$\r$\n\
    如果您没有特殊要求，建议使用默认位置。"

; 安装进行中
!define CUSTOM_INSTALLING_TITLE "正在安装..."
!define CUSTOM_INSTALLING_TEXT \
    "正在安装 HXK Terminal，请稍候。$\r$\n$\r$\n\
    这可能需要几分钟时间。"

; 完成页
!define CUSTOM_FINISH_TITLE "安装完成！"
!define CUSTOM_FINISH_TEXT \
    "HXK Terminal 已成功安装。$\r$\n$\r$\n\
    您现在可以：$\r$\n\
    • 从桌面快捷方式启动$\r$\n\
    • 从开始菜单启动$\r$\n\
    • 立即启动应用"

; ------------------------ 自定义函数 ------------------------

; 安装前检查
Function PreInstallCheck
    ; 检查磁盘空间（至少需要 200MB）
    ${GetDrives} "FDD+" GetAllDrives
    
    ; 检查管理员权限
    UserInfo::GetAccountType
    pop $0
    ${If} $0 != "Admin"
        MessageBox MB_OK|MB_ICONEXCLAMATION \
            "需要管理员权限才能安装。$\r$\n$\r$\n\
            请右键点击安装程序，选择「以管理员身份运行」。"
        Abort
    ${EndIf}
FunctionEnd

; 安装后操作
Function PostInstall
    ; 创建应用程序数据目录
    CreateDirectory "$APPDATA\${PRODUCT_NAME}"
    
    ; 写入配置文件（可选）
    ; FileWrite "$APPDATA\${PRODUCT_NAME}\config.json" "{}"
    
    ; 写入安装日志
    FileOpen $0 "$APPDATA\${PRODUCT_NAME}\install.log" w
    FileWrite $0 "Install Date: $\r$\n"
    FileWrite $0 "Version: ${PRODUCT_VERSION}$\r$\n"
    FileWrite $0 "Path: $INSTDIR$\r$\n"
    FileClose $0
FunctionEnd

; 卸载前的清理
Function UninstallPreCleanup
    ; 清理用户数据（可选）
    ; RMDir /r "$APPDATA\${PRODUCT_NAME}"
    
    ; 清理注册表
    DeleteRegKey HKLM "Software\${PRODUCT_NAME}"
FunctionEnd

