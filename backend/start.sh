#!/bin/bash

# HXK Terminal Backend 启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  HXK Terminal Backend 启动脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Python版本
check_python() {
    print_message "检查Python版本..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
        print_message "Python版本: $PYTHON_VERSION"
    else
        print_error "Python3 未安装，请先安装Python3"
        exit 1
    fi
}

# 检查虚拟环境
check_venv() {
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        print_message "虚拟环境已激活: $VIRTUAL_ENV"
    else
        print_warning "建议在虚拟环境中运行"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "创建虚拟环境..."
            # 检查是否安装了uv
            if command -v uv &> /dev/null; then
                print_message "使用uv创建虚拟环境..."
                uv venv
                source .venv/bin/activate
                print_message "uv虚拟环境已创建并激活"
            else
                print_message "使用python3创建虚拟环境..."
                python3 -m venv venv
                source venv/bin/activate
                print_message "虚拟环境已创建并激活"
            fi
        fi
    fi
}

# 安装依赖
install_dependencies() {
    print_message "安装依赖包..."
    if [ -f "requirements.txt" ]; then
        # 检查是否安装了uv
        if command -v uv &> /dev/null; then
            print_message "使用uv安装依赖..."
            uv pip install -r requirements.txt
        else
            print_message "使用pip安装依赖..."
            pip install -r requirements.txt
        fi
        print_message "依赖安装完成"
    else
        print_error "requirements.txt 文件不存在"
        exit 1
    fi
}

# 检查环境配置
check_env() {
    print_message "检查环境配置..."
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            print_warning ".env 文件不存在，从 env.example 创建..."
            cp env.example .env
            print_warning "请编辑 .env 文件配置您的环境变量"
        else
            print_error "环境配置文件不存在"
            exit 1
        fi
    fi
}

# 创建必要目录
create_directories() {
    print_message "创建必要目录..."
    mkdir -p uploads
    mkdir -p logs
    print_message "目录创建完成"
}

# 启动服务
start_server() {
    print_message "启动HXK Terminal Backend服务..."
    print_message "服务将在 http://localhost:8000 启动"
    print_message "API文档地址: http://localhost:8000/docs"
    print_message "按 Ctrl+C 停止服务"
    echo
    
    python main.py
}

# 主函数
main() {
    print_header
    
    check_python
    check_venv
    install_dependencies
    check_env
    create_directories
    start_server
}

# 运行主函数
main "$@"
