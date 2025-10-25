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

# 检查Docker
check_docker() {
    print_message "检查Docker环境..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_message "Docker版本: $DOCKER_VERSION"
    else
        print_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_message "Docker Compose版本: $COMPOSE_VERSION"
    else
        print_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
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
    docker-compose build --no-cache
    print_message "镜像构建完成"
}

# 启动服务
start_services() {
    print_message "启动服务..."
    docker-compose up -d
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
    echo "  docker-compose logs -f hxkt-backend"
    echo "  docker-compose logs -f alist"
    echo ""
    print_message "停止服务命令:"
    echo "  docker-compose down"
}

# 主函数
main() {
    print_header
    
    check_docker
    check_env
    build_image
    start_services
    check_services
    show_info
    
    print_message "部署完成！"
}

# 运行主函数
main "$@"
