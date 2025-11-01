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

# 配置Docker镜像加速器
setup_docker_mirror() {
    print_message "检查Docker镜像加速器配置..."
    
    DOCKER_DAEMON_FILE="/etc/docker/daemon.json"
    
    # 检查是否已配置镜像加速器
    if [ -f "$DOCKER_DAEMON_FILE" ] && grep -q "registry-mirrors" "$DOCKER_DAEMON_FILE"; then
        print_message "Docker镜像加速器已配置"
        return 0
    fi
    
    print_warning "未检测到Docker镜像加速器配置"
    print_warning "建议配置国内镜像源以加速镜像拉取"
    print_warning "可以手动执行以下命令配置："
    echo ""
    echo "sudo mkdir -p /etc/docker"
    echo "sudo tee /etc/docker/daemon.json > /dev/null <<EOF"
    echo "{"
    echo "  \"registry-mirrors\": ["
    echo "    \"https://docker.mirrors.ustc.edu.cn\","
    echo "    \"https://hub-mirror.c.163.com\","
    echo "    \"https://mirror.baidubce.com\""
    echo "  ]"
    echo "}"
    echo "EOF"
    echo "sudo systemctl daemon-reload"
    echo "sudo systemctl restart docker"
    echo ""
    
    read -p "是否现在配置Docker镜像加速器？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "配置Docker镜像加速器..."
        
        # 备份现有配置
        if [ -f "$DOCKER_DAEMON_FILE" ]; then
            sudo cp "$DOCKER_DAEMON_FILE" "${DOCKER_DAEMON_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # 创建配置目录
        sudo mkdir -p /etc/docker
        
        # 写入镜像加速器配置
        sudo tee "$DOCKER_DAEMON_FILE" > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF
        
        print_message "重启Docker服务..."
        sudo systemctl daemon-reload
        sudo systemctl restart docker
        sleep 3
        
        print_message "✅ Docker镜像加速器配置完成"
        return 0
    else
        print_warning "跳过镜像加速器配置，继续构建..."
        return 1
    fi
}

# 构建镜像（带重试机制）
build_image() {
    print_message "构建Docker镜像..."
    
    MAX_RETRIES=3
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker_cmd docker-compose build --no-cache 2>&1 | tee /tmp/docker-build.log; then
            print_message "镜像构建完成"
            return 0
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            
            # 检查是否是网络错误
            if grep -q "timeout\|connection\|network" /tmp/docker-build.log; then
                print_warning "构建失败（可能是网络问题），正在重试... ($RETRY_COUNT/$MAX_RETRIES)"
                
                if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                    sleep 5
                    continue
                else
                    print_error "构建失败：网络连接超时"
                    print_error "请检查网络连接，或配置Docker镜像加速器"
                    print_error "运行以下命令配置镜像加速器："
                    echo ""
                    echo "sudo mkdir -p /etc/docker"
                    echo "sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'"
                    echo "{"
                    echo "  \"registry-mirrors\": ["
                    echo "    \"https://docker.mirrors.ustc.edu.cn\","
                    echo "    \"https://hub-mirror.c.163.com\""
                    echo "  ]"
                    echo "}"
                    echo "EOF"
                    echo "sudo systemctl daemon-reload"
                    echo "sudo systemctl restart docker"
                    echo ""
                    return 1
                fi
            else
                print_error "构建失败，请查看上方错误信息"
                return 1
            fi
        fi
    done
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
    
    # 可选：配置镜像加速器
    setup_docker_mirror
    
    check_env
    
    # 构建镜像
    if ! build_image; then
        print_error "构建失败，请检查错误信息"
        exit 1
    fi
    
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
