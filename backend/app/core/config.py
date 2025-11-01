"""
应用配置管理
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hxkt.db")
    
    # CORS配置
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://localhost:5244",  # Alist服务
        "http://127.0.0.1:5244",
        "http://118.195.243.30:8000",  # 生产服务器
        "file://",  # Electron应用
        "electron://"  # Electron应用协议
    ]
    
    # JWT配置
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 文件上传配置
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Alist集成配置
    ALIST_URL: str = os.getenv("ALIST_URL", "http://localhost:5244")
    ALIST_TOKEN: Optional[str] = os.getenv("ALIST_TOKEN")
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # Redis配置（可选，用于缓存）
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局设置实例
settings = Settings()
