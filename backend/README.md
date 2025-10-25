# HXK Terminal Backend

HXK Terminal 统一管理工作资料与任务的跨平台协作工具后端API服务。

## 功能特性

- 🚀 **FastAPI** - 高性能异步Web框架
- 🔐 **JWT认证** - 安全的用户认证系统
- 📝 **任务管理** - 完整的任务CRUD操作
- 👥 **用户管理** - 用户注册、登录、权限管理
- 📁 **文件管理** - 集成Alist文件服务
- 🗄️ **数据库支持** - SQLite/PostgreSQL/MySQL
- 🐳 **Docker支持** - 容器化部署
- 📊 **API文档** - 自动生成的Swagger文档

## 技术栈

- **框架**: FastAPI 0.104.1
- **数据库**: SQLAlchemy 2.0.23
- **认证**: JWT (python-jose)
- **密码**: bcrypt (passlib)
- **验证**: Pydantic 2.5.0
- **服务器**: Uvicorn
- **容器**: Docker & Docker Compose

## 快速开始

### 本地开发环境

#### 1. 克隆项目
```bash
git clone <repository-url>
cd backend
```

#### 2. 创建虚拟环境
```bash
# 使用uv（推荐）
uv venv
source .venv/bin/activate  # macOS/Linux
# 或 .venv\Scripts\activate  # Windows

# 或使用传统方式
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

#### 3. 安装依赖
```bash
# 使用uv（推荐）
uv sync

# 或使用pip
pip install -r requirements.txt
```

#### 4. 配置环境变量
```bash
# 复制环境配置文件
cp env.example .env

# 编辑配置文件
nano .env
```

#### 5. 启动服务
```bash
# 使用uv启动脚本（推荐）
./start-uv.sh

# 或使用传统启动脚本
# macOS/Linux
./start.sh

# Windows
start.bat

# 或直接运行
# 使用uv
uv run python main.py

# 或直接运行
python main.py
```

服务将在 http://localhost:8000 启动，API文档地址：http://localhost:8000/docs

### Docker部署

#### 1. 使用Docker Compose（推荐）
```bash
# 部署所有服务
./deploy.sh

# 或手动部署
docker-compose up -d
```

#### 2. 单独构建镜像
```bash
# 构建镜像
docker build -t hxkt-backend .

# 运行容器
docker run -p 8000:8000 hxkt-backend
```

## API端点

### 认证相关
- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `GET /api/v1/users/me` - 获取当前用户信息
- `PUT /api/v1/users/me` - 更新当前用户信息

### 任务管理
- `GET /api/v1/tasks/` - 获取任务列表
- `GET /api/v1/tasks/available` - 获取可用任务
- `GET /api/v1/tasks/my-tasks` - 获取我发布的任务
- `GET /api/v1/tasks/accepted` - 获取我接取的任务
- `POST /api/v1/tasks/` - 创建任务
- `GET /api/v1/tasks/{task_id}` - 获取任务详情
- `PUT /api/v1/tasks/{task_id}` - 更新任务
- `DELETE /api/v1/tasks/{task_id}` - 删除任务
- `POST /api/v1/tasks/{task_id}/accept` - 接取任务
- `POST /api/v1/tasks/{task_id}/complete` - 完成任务
- `POST /api/v1/tasks/{task_id}/abandon` - 放弃任务

### 系统相关
- `GET /` - 根路径健康检查
- `GET /health` - 健康检查端点

## 环境配置

### 开发环境 (.env)
```env
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///./hxkt.db
ALIST_URL=http://localhost:5244
```

### 生产环境
```env
DEBUG=false
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/hxkt_db
ALIST_URL=http://alist:5244
REDIS_URL=redis://redis:6379/0
```

## 数据库迁移

使用Alembic进行数据库迁移：

```bash
# 初始化迁移
alembic init alembic

# 创建迁移
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

## 开发指南

### 项目结构
```
backend/
├── app/
│   ├── api/           # API路由
│   ├── core/          # 核心配置
│   ├── models/        # 数据库模型
│   ├── schemas/       # Pydantic模式
│   └── services/      # 业务逻辑
├── alembic/           # 数据库迁移
├── uploads/           # 文件上传目录
├── logs/              # 日志文件
├── main.py            # 应用入口
├── requirements.txt   # 依赖包
├── Dockerfile         # Docker配置
├── docker-compose.yml # Docker Compose配置
└── README.md          # 项目文档
```

### 添加新功能

1. **创建模型** (`app/models/`)
2. **定义模式** (`app/schemas/`)
3. **实现服务** (`app/services/`)
4. **添加端点** (`app/api/v1/endpoints/`)
5. **更新路由** (`app/api/v1/api.py`)

### 代码规范

- 使用类型提示
- 遵循PEP 8规范
- 添加适当的注释和文档字符串
- 编写单元测试

## 部署指南

### Linux服务器部署

1. **安装Docker和Docker Compose**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose
```

2. **克隆项目**
```bash
git clone <repository-url>
cd backend
```

3. **配置环境**
```bash
cp env.production .env
nano .env  # 修改配置
```

4. **部署服务**
```bash
./deploy.sh
```

5. **配置反向代理** (可选)
```nginx
# Nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 监控和日志

### 查看日志
```bash
# Docker Compose
docker-compose logs -f hxkt-backend

# 直接运行
tail -f logs/app.log
```

### 健康检查
```bash
curl http://localhost:8000/health
```

## 故障排除

### 常见问题

1. **端口冲突**
   - 修改 `docker-compose.yml` 中的端口映射
   - 或修改 `.env` 中的端口配置

2. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接字符串配置

3. **权限问题**
   - 确保上传目录有写权限
   - 检查Docker容器用户权限

### 调试模式

启用调试模式获取详细错误信息：
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: [Contact Email]