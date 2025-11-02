"""
HXK Terminal Backend API
统一管理工作资料与任务的跨平台协作工具后端服务
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
import logging
from logging.handlers import RotatingFileHandler

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.core.exceptions import setup_exception_handlers


def setup_logging():
    """配置日志系统，将日志写入logs文件夹"""
    # 确保logs文件夹存在
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # 获取日志级别
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # 清除现有的处理器
    root_logger.handlers.clear()
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 文件日志处理器 - 使用轮转日志，每个文件最大10MB，保留5个备份
    log_file = os.path.join(log_dir, "app.log")
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # 控制台日志处理器（仍然输出到控制台）
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # 设置uvicorn的日志级别
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING if not settings.DEBUG else logging.INFO)
    
    logging.info("日志系统初始化完成，日志文件: %s", log_file)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("🚀 HXK Terminal Backend 启动中...")
    
    # 配置日志系统
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("HXK Terminal Backend 启动")
    logger.info("=" * 60)
    
    await init_db()
    logger.info("✅ 数据库初始化完成")
    print("✅ 数据库初始化完成")
    
    yield
    
    # 关闭时执行
    logger.info("=" * 60)
    logger.info("HXK Terminal Backend 关闭")
    logger.info("=" * 60)
    print("🛑 HXK Terminal Backend 关闭中...")


# 创建FastAPI应用
app = FastAPI(
    title="HXK Terminal Backend",
    description="统一管理工作资料与任务的跨平台协作工具后端API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# 设置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 设置异常处理器
setup_exception_handlers(app)

# 包含API路由
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "HXK Terminal Backend API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    # 开发环境直接运行
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
