@echo off
REM HXK Terminal Backend 启动脚本 (Windows)

setlocal enabledelayedexpansion

echo ================================
echo   HXK Terminal Backend 启动脚本
echo ================================
echo.

REM 检查Python
echo [INFO] 检查Python版本...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 未安装，请先安装Python
    pause
    exit /b 1
)
python --version
echo.

REM 检查虚拟环境
if defined VIRTUAL_ENV (
    echo [INFO] 虚拟环境已激活: %VIRTUAL_ENV%
) else (
    echo [WARNING] 建议在虚拟环境中运行
    set /p continue="是否继续？(y/N): "
    if /i not "!continue!"=="y" (
        echo [INFO] 创建虚拟环境...
        python -m venv venv
        call venv\Scripts\activate.bat
        echo [INFO] 虚拟环境已创建并激活
    )
)
echo.

REM 安装依赖
echo [INFO] 安装依赖包...
if exist requirements.txt (
    pip install -r requirements.txt
    echo [INFO] 依赖安装完成
) else (
    echo [ERROR] requirements.txt 文件不存在
    pause
    exit /b 1
)
echo.

REM 检查环境配置
echo [INFO] 检查环境配置...
if not exist .env (
    if exist env.example (
        echo [WARNING] .env 文件不存在，从 env.example 创建...
        copy env.example .env
        echo [WARNING] 请编辑 .env 文件配置您的环境变量
    ) else (
        echo [ERROR] 环境配置文件不存在
        pause
        exit /b 1
    )
)
echo.

REM 创建必要目录
echo [INFO] 创建必要目录...
if not exist uploads mkdir uploads
if not exist logs mkdir logs
echo [INFO] 目录创建完成
echo.

REM 启动服务
echo [INFO] 启动HXK Terminal Backend服务...
echo [INFO] 服务将在 http://localhost:8000 启动
echo [INFO] API文档地址: http://localhost:8000/docs
echo [INFO] 按 Ctrl+C 停止服务
echo.

python main.py

pause
