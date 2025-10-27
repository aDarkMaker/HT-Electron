; NSIS 安装界面完全自定义
; 这个文件定义了安装界面的所有UI元素

; 引入 Modern UI
!include "MUI2.nsh"
!include "FileFunc.nsh"

; ------------------------ 界面配置 ------------------------

; 定义安装界面变量
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; 欢迎页面
!define MUI_WELCOMEPAGE_TITLE "欢迎使用 HXK Terminal"
!define MUI_WELCOMEPAGE_TITLE_3LINES
!define MUI_WELCOMEPAGE_TEXT_TOP "欢迎使用 HXK Terminal 安装向导"

; 自定义欢迎页文本
!define MUI_WELCOMEPAGE_TEXT \
    "这将安装 HXK Terminal 到您的计算机。$\r$\n$\r$\n\
    HXK Terminal 是一个统一管理工作资料与任务的跨平台协作工具。$\r$\n$\r$\n$\r$\n\
    点击「下一步」继续安装。"

; 安装目录页面
!define MUI_INSTFILESPAGE_HEADER_TEXT "安装 HXK Terminal"
!define MUI_INSTFILESPAGE_HEADER_SUBTEXT "选择安装目录"
!define MUI_INSTFILESPAGE_TEXT_TOP "HXK Terminal 将安装到以下目录："
!define MUI_INSTFILESPAGE_TEXT_LOCATION "安装路径："

; 安装进度页面
!define MUI_INSTFILESPAGE_TEXT_COMPLETED_TITLE "正在安装 HXK Terminal..."
!define MUI_INSTFILESPAGE_TEXT_COMPLETED_INFO "请稍候，正在安装程序文件..."

; 完成页面
!define MUI_FINISHPAGE_TITLE "安装完成"
!define MUI_FINISHPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TEXT_LARGE
!define MUI_FINISHPAGE_TEXT \
    "HXK Terminal 已成功安装到您的计算机。$\r$\n$\r$\n\
    您现在可以从桌面快捷方式启动应用。"

; 完成页按钮配置
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "启动 HXK Terminal"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"

; 卸载页面
!define MUI_UNINSTFILESPAGE_HEADER_TEXT "卸载 HXK Terminal"
!define MUI_UNINSTFILESPAGE_HEADER_SUBTEXT "正在卸载..."
!define MUI_UNINSTFILESPAGE_TEXT_TOP "正在从您的计算机移除 HXK Terminal。"

; ------------------------ 自定义函数 ------------------------

; 安装完成时启动应用
Function LaunchApp
    ExecShell "open" "$INSTDIR\${PRODUCT_NAME}.exe"
FunctionEnd

; 安装前的自定义初始化
Function .onInit
    ; 设置注册表权限
    SetRegView 64
    
    ; 自定义初始化操作
    InitPluginsDir
    
    ; 检查是否已经安装
    ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString"
    StrCmp $0 "" done
    
    MessageBox MB_YESNO|MB_ICONQUESTION "检测到已安装 HXK Terminal。$\n$\n是否要重新安装？" IDYES done
    Abort
    
    done:
FunctionEnd

; 安装开始前
Function .onGUIInit
    ; GUI初始化时的自定义操作
    
    ; 设置窗口标题颜色（可选）
    ; System::Call 'user32::SendMessage(i $HWNDPARENT, i 0x408, i 0, i 0x00B2D2EE)'
FunctionEnd

; 安装完成后
Function .onInstSuccess
    ; 安装成功后的自定义操作
    ; 例如：写日志、发送统计等
FunctionEnd

; 卸载初始化
Function un.onInit
    ; 卸载初始化操作
FunctionEnd

; 卸载GUI初始化
Function un.onGUIInit
    ; 卸载GUI初始化
FunctionEnd

; 卸载完成
Function un.onUninstSuccess
    ; 卸载成功后的操作
FunctionEnd

