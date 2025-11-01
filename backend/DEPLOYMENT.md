# HXK Terminal Backend 服务器部署文档

## 服务器信息

- **服务器IP**: http://118.195.243.30
- **后端服务端口**: 8000
- **API文档地址**: http://118.195.243.30:8000/docs

## 部署前准备

### 1. 服务器要求

- Linux 系统（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- Docker 和 Docker Compose 已安装
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

### 2. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# CentOS/RHEL
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

## 部署步骤

### 1. 克隆项目或上传文件

```bash
# 如果使用Git
git clone <repository-url>
cd backend

# 或直接上传backend目录到服务器
```

### 2. 配置环境变量

```bash
cd backend

# 复制生产环境配置
cp env.production .env

# 编辑环境变量（重要：修改安全密钥）
nano .env
```

**必须修改的配置项：**

```env
# 生成随机密钥（推荐使用openssl）
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# 修改数据库密码（如果使用PostgreSQL）
DATABASE_URL=postgresql://hxkt_user:your_secure_password@postgres:5432/hxkt_db
```

### 3. 修改 Docker Compose 配置（可选）

如果需要修改端口或配置，编辑 `docker-compose.yml`：

```yaml
services:
    hxkt-backend:
        ports:
            - '8000:8000' # 修改第一个端口号以更改外部访问端口
```

### 4. 构建和启动服务

```bash
# 方式1: 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 方式2: 手动部署
docker-compose build --no-cache
docker-compose up -d
```

### 5. 查看服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f hxkt-backend

# 检查服务健康状态
curl http://localhost:8000/health
```

### 6. 配置防火墙

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 8000/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## 配置 Nginx 反向代理（推荐）

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/hxkt-backend`:

```nginx
server {
    listen 80;
    server_name 118.195.243.30;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 启用配置

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/hxkt-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# CentOS/RHEL
sudo cp /etc/nginx/sites-available/hxkt-backend /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl reload nginx
```

## 数据库迁移

如果数据库结构有变更，需要执行迁移：

```bash
# 进入容器
docker-compose exec hxkt-backend bash

# 在容器内执行（如果有Alembic）
alembic upgrade head

# 或手动初始化（首次部署）
python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

## 常用运维命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f hxkt-backend

# 查看最近的日志
docker-compose logs --tail=100 hxkt-backend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart hxkt-backend
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

## 备份和恢复

### 备份数据库

```bash
# PostgreSQL
docker-compose exec postgres pg_dump -U hxkt_user hxkt_db > backup_$(date +%Y%m%d).sql

# SQLite（如果使用）
docker-compose exec hxkt-backend sqlite3 hxkt.db .dump > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
# PostgreSQL
docker-compose exec -T postgres psql -U hxkt_user hxkt_db < backup_20250115.sql

# SQLite
docker-compose exec hxkt-backend sqlite3 hxkt.db < backup_20250115.sql
```

## 监控和维护

### 健康检查

```bash
# API健康检查
curl http://118.195.243.30:8000/health

# 检查数据库连接
docker-compose exec hxkt-backend python -c "from app.core.database import get_db; next(get_db())"
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
docker system df
```

## 故障排除

### 服务无法启动

1. 检查日志：`docker-compose logs hxkt-backend`
2. 检查端口占用：`netstat -tulpn | grep 8000`
3. 检查环境变量：`docker-compose config`

### 数据库连接失败

1. 检查数据库容器状态：`docker-compose ps postgres`
2. 检查数据库日志：`docker-compose logs postgres`
3. 验证连接字符串：检查 `.env` 文件中的 `DATABASE_URL`

### API无法访问

1. 检查防火墙设置
2. 检查Nginx配置（如果使用）
3. 检查CORS配置：确认前端地址在 `ALLOWED_ORIGINS` 中

## 安全建议

1. **修改默认密钥**：必须修改 `.env` 中的 `SECRET_KEY` 和 `JWT_SECRET_KEY`
2. **使用HTTPS**：生产环境建议配置SSL证书
3. **限制访问**：使用防火墙限制只有必要IP可以访问
4. **定期备份**：设置自动备份任务
5. **更新依赖**：定期更新Python依赖包以修复安全漏洞

## 联系支持

如遇问题，请查看：

- API文档：http://118.195.243.30:8000/docs
- 日志文件：`./logs/app.log`
- GitHub Issues：[项目Issues页面]
