# 环境配置指南

## env.production 配置文件说明

### 1. 安全密钥配置（第6-8行）

#### SECRET_KEY 和 JWT_SECRET_KEY

这两个密钥用于：

- **SECRET_KEY**: 应用的安全密钥，用于加密和签名
- **JWT_SECRET_KEY**: JWT令牌的签名密钥，用于用户认证

**重要提示**：

- ✅ 必须使用强随机字符串（64个字符以上）
- ✅ 生产环境必须修改默认值
- ✅ 不要泄露给任何人
- ✅ 不要提交到版本控制系统

**生成随机密钥的方法**：

```bash
# 方法1: 使用 openssl（推荐）
openssl rand -hex 32

# 方法2: 使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# 方法3: 使用在线工具（不推荐，除非是可信工具）
# https://randomkeygen.com/
```

**示例配置**：

```env
SECRET_KEY=61633e34bc2f137ac24e3f94eda879738db1ace032cd43760a5584f391e4310b
JWT_SECRET_KEY=e459d7a7a83df8f82bccf6e662708e03dc2f04df3dd47d0e97201f10ca11e892
```

### 2. 数据库配置（第10-15行）

#### 选项1: PostgreSQL（推荐用于生产环境）

**使用 Docker Compose 部署**（已包含 PostgreSQL）：

```env
DATABASE_URL=postgresql://hxkt_user:hxkt_password@postgres:5432/hxkt_db
```

- 不需要修改，直接使用即可
- `postgres` 是 Docker Compose 中的服务名

**使用独立 PostgreSQL 数据库**：

```env
DATABASE_URL=postgresql://用户名:密码@数据库地址:5432/数据库名
```

示例：

```env
# 本地PostgreSQL
DATABASE_URL=postgresql://admin:mypassword@localhost:5432/hxkt_db

# 远程PostgreSQL（如云数据库）
DATABASE_URL=postgresql://admin:mypassword@118.195.243.30:5432/hxkt_db

# 带SSL连接
DATABASE_URL=postgresql://admin:mypassword@example.com:5432/hxkt_db?sslmode=require
```

**创建PostgreSQL数据库的SQL命令**：

```sql
CREATE DATABASE hxkt_db;
CREATE USER hxkt_user WITH ENCRYPTED PASSWORD 'hxkt_password';
GRANT ALL PRIVILEGES ON DATABASE hxkt_db TO hxkt_user;
```

#### 选项2: SQLite（简单部署，适合小型项目）

```env
# 取消注释下面这行，并注释掉PostgreSQL配置
DATABASE_URL=sqlite:///./hxkt.db
```

**优点**：

- ✅ 无需单独安装数据库
- ✅ 配置简单
- ✅ 适合小型项目或测试环境

**缺点**：

- ❌ 性能较差，不适合高并发
- ❌ 不支持多服务器部署
- ❌ 备份和迁移较复杂

## 完整配置示例

### 使用 Docker Compose（推荐）

```env
# 安全密钥
SECRET_KEY=61633e34bc2f137ac24e3f94eda879738db1ace032cd43760a5584f391e4310b
JWT_SECRET_KEY=e459d7a7a83df8f82bccf6e662708e03dc2f04df3dd47d0e97201f10ca11e892

# 数据库（使用Docker Compose中的PostgreSQL）
DATABASE_URL=postgresql://hxkt_user:hxkt_password@postgres:5432/hxkt_db
```

### 使用独立 PostgreSQL

```env
# 安全密钥
SECRET_KEY=你的64位随机字符串
JWT_SECRET_KEY=你的64位随机字符串

# 数据库（连接到独立的PostgreSQL服务器）
DATABASE_URL=postgresql://用户名:密码@118.195.243.30:5432/hxkt_db
```

### 使用 SQLite（简单部署）

```env
# 安全密钥
SECRET_KEY=你的64位随机字符串
JWT_SECRET_KEY=你的64位随机字符串

# 数据库（使用SQLite）
DATABASE_URL=sqlite:///./hxkt.db
```

## 配置步骤

### 在服务器上配置

1. **复制配置文件**：

```bash
cd backend
cp env.production .env
```

2. **编辑配置文件**：

```bash
nano .env
# 或使用 vim
vim .env
```

3. **修改配置项**：
    - 生成并替换 `SECRET_KEY` 和 `JWT_SECRET_KEY`
    - 根据实际情况配置 `DATABASE_URL`

4. **保存并退出**

5. **验证配置**：

```bash
# 检查配置是否正确
cat .env | grep -E "SECRET_KEY|DATABASE_URL"
```

## 安全建议

1. **密钥管理**：
    - 不要将 `.env` 文件提交到 Git
    - 使用环境变量或密钥管理服务（如 AWS Secrets Manager）
    - 定期轮换密钥（建议每3-6个月）

2. **数据库安全**：
    - 使用强密码
    - 限制数据库访问IP
    - 启用SSL/TLS连接
    - 定期备份数据库

3. **文件权限**：

```bash
# 设置 .env 文件权限（仅所有者可读写）
chmod 600 .env
```

## 常见问题

### Q: 密钥泄露了怎么办？

A: 立即更换所有密钥，并让所有用户重新登录。

### Q: 如何测试数据库连接？

A: 在Python中测试：

```python
from app.core.database import get_db
db = next(get_db())
# 如果成功连接，不会报错
```

### Q: PostgreSQL 连接失败？

A: 检查：

1. PostgreSQL 服务是否运行
2. 用户名、密码是否正确
3. 数据库是否存在
4. 防火墙是否允许5432端口
5. 连接地址是否正确（Docker中使用服务名，独立部署使用IP）

### Q: SQLite 数据库文件位置？

A: 默认在 `backend/hxkt.db`，与 `main.py` 同级目录。
