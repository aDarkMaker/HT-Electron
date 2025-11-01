#!/bin/bash

# HXK Terminal Backend Docker 部署脚本

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
    echo -e "${BLUE}  HXK Terminal Backend 部署脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Docker权限
check_docker_permission() {
    print_message "检查Docker权限..."
    
    # 检查用户是否在docker组中
    if groups $USER | grep -q '\bdocker\b'; then
        print_message "用户已在docker组中"
        return 0
    fi
    
    # 检查是否可以使用docker命令（不需要sudo）
    if docker ps &> /dev/null; then
        print_message "Docker权限正常"
        return 0
    fi
    
    # 检查是否需要sudo
    if sudo docker ps &> /dev/null; then
        print_warning "当前用户没有Docker权限，需要使用sudo"
        print_warning "建议：将用户添加到docker组（需要重新登录生效）"
        print_warning "执行命令: sudo usermod -aG docker $USER"
        print_warning "然后重新登录或执行: newgrp docker"
        print_warning "当前将使用 sudo 运行 Docker 命令"
        return 1
    else
        print_error "无法访问Docker，请检查Docker服务是否运行"
        print_error "执行: sudo systemctl status docker"
        exit 1
    fi
}

# 检查Docker
check_docker() {
    print_message "检查Docker环境..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null || sudo docker --version)
        print_message "Docker版本: $DOCKER_VERSION"
    else
        print_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || sudo docker-compose --version)
        print_message "Docker Compose版本: $COMPOSE_VERSION"
    else
        print_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查权限
    check_docker_permission
    NEED_SUDO=$?
}

# 执行Docker命令（自动处理sudo）
docker_cmd() {
    if [ "$NEED_SUDO" -eq 1 ]; then
        sudo "$@"
    else
        "$@"
    fi
}

# 检查环境配置
check_env() {
    print_message "检查环境配置..."
    if [ ! -f ".env" ]; then
        if [ -f "env.production" ]; then
            print_warning ".env 文件不存在，从 env.production 创建..."
            cp env.production .env
            print_warning "请编辑 .env 文件配置您的环境变量"
            print_warning "特别是 SECRET_KEY 和 JWT_SECRET_KEY"
        else
            print_error "环境配置文件不存在"
            exit 1
        fi
    fi
}

# 构建镜像
build_image() {
    print_message "构建Docker镜像..."
    docker_cmd docker-compose build --no-cache
    print_message "镜像构建完成"
}

# 启动服务
start_services() {
    print_message "启动服务..."
    docker_cmd docker-compose up -d
    print_message "服务启动完成"
}

# 检查服务状态
check_services() {
    print_message "检查服务状态..."
    sleep 10
    
    # 检查后端服务
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_message "✅ Backend服务运行正常"
    else
        print_warning "⚠️  Backend服务可能未正常启动"
    fi
    
    # 检查Alist服务
    if curl -f http://localhost:5244/api/me > /dev/null 2>&1; then
        print_message "✅ Alist服务运行正常"
    else
        print_warning "⚠️  Alist服务可能未正常启动"
    fi
}

# 显示服务信息
show_info() {
    print_message "服务信息:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API文档: http://localhost:8000/docs"
    echo "  - Alist文件管理: http://localhost:5244"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    print_message "查看日志命令:"
    if [ "$NEED_SUDO" -eq 1 ]; then
        echo "  sudo docker-compose logs -f hxkt-backend"
        echo "  sudo docker-compose logs -f alist"
        echo ""
        print_message "停止服务命令:"
        echo "  sudo docker-compose down"
    else
        echo "  docker-compose logs -f hxkt-backend"
        echo "  docker-compose logs -f alist"
        echo ""
        print_message "停止服务命令:"
        echo "  docker-compose down"
    fi
}

# 主函数
main() {
    print_header
    
    NEED_SUDO=0  # 初始化变量
    check_docker
    check_env
    build_image
    start_services
    check_services
    show_info
    
    print_message "部署完成！"
    
    # 提示权限信息
    if [ "$NEED_SUDO" -eq 1 ]; then
        echo ""
        print_warning "注意：当前使用sudo运行Docker命令"
        print_warning "建议执行以下命令以永久解决权限问题："
        echo "  sudo usermod -aG docker $USER"
        echo "  newgrp docker"
        echo "  然后重新运行部署脚本（不需要sudo）"
    fi
}

# 运行主函数
main "$@"
