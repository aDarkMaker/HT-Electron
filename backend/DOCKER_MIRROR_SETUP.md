# Docker 镜像加速器配置指南

## 问题描述

在构建 Docker 镜像时遇到网络超时错误：

```
Get "https://registry-1.docker.io/v2/": net/http: request canceled while waiting for connection
```

这是因为从 Docker Hub 拉取镜像时网络连接较慢或不稳定。

## 解决方案

### 方案 1: 配置 Docker 镜像加速器（推荐）

#### 自动配置（部署脚本中已包含）

运行部署脚本时，会提示是否配置镜像加速器：

```bash
./deploy.sh
```

选择 `y` 即可自动配置。

#### 手动配置

```bash
# 1. 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 2. 配置镜像加速器
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
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

# 3. 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 4. 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

#### 常用国内镜像源

| 镜像源     | 地址                                             |
| ---------- | ------------------------------------------------ |
| 中科大镜像 | `https://docker.mirrors.ustc.edu.cn`             |
| 网易镜像   | `https://hub-mirror.c.163.com`                   |
| 百度云镜像 | `https://mirror.baidubce.com`                    |
| 阿里云镜像 | `https://<your-id>.mirror.aliyuncs.com` (需注册) |

### 方案 2: 使用代理（如果有）

如果服务器有代理，可以配置 Docker 代理：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null <<EOF
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案 3: 增加超时时间（临时方案）

修改 Docker 构建命令，增加超时时间：

```bash
DOCKER_CLIENT_TIMEOUT=300 docker-compose build --no-cache
```

或在 `docker-compose.yml` 中添加：

```yaml
services:
  hxkt-backend:
    build:
      context: .
      dockerfile: Dockerfile
    # 添加超时设置
    build:
      context: .
      timeout: 600s
```

## 验证配置

配置完成后，验证镜像加速器是否生效：

```bash
# 查看 Docker 信息
docker info | grep -A 10 "Registry Mirrors"

# 应该看到配置的镜像源地址

# 测试拉取镜像
docker pull hello-world

# 如果配置成功，应该很快就能拉取成功
```

## 部署脚本已更新

`deploy.sh` 脚本已更新，包含：

1. **自动检测镜像加速器配置**
2. **提示配置镜像加速器**
3. **构建失败自动重试**（最多3次）
4. **网络错误检测和处理**

## 如果仍然失败

### 检查网络连接

```bash
# 测试网络连接
ping docker.mirrors.ustc.edu.cn

# 测试 HTTPS 连接
curl -I https://docker.mirrors.ustc.edu.cn
```

### 使用离线镜像（最后方案）

1. 在有网络的机器上拉取镜像：

```bash
docker pull python:3.11-slim
docker save python:3.11-slim > python-3.11-slim.tar
```

2. 传输到服务器并加载：

```bash
docker load < python-3.11-slim.tar
```

### 检查 Docker 服务

```bash
# 检查 Docker 状态
sudo systemctl status docker

# 查看 Docker 日志
sudo journalctl -u docker -n 50

# 重启 Docker
sudo systemctl restart docker
```

## 完整配置示例

### 完整的 daemon.json

```json
{
    "registry-mirrors": [
        "https://docker.mirrors.ustc.edu.cn",
        "https://hub-mirror.c.163.com",
        "https://mirror.baidubce.com"
    ],
    "max-concurrent-downloads": 10,
    "max-concurrent-uploads": 5,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
```

### 配置后的完整步骤

```bash
# 1. 配置镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

# 2. 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. 验证
docker info | grep -A 5 "Registry Mirrors"

# 4. 重新运行部署
cd ~/backend
./deploy.sh
```

---

配置完成后，重新运行 `./deploy.sh` 应该就能正常构建镜像了！
