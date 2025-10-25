"""
数据库模型定义
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.core.database import Base


class TaskType(str, enum.Enum):
    """任务类型枚举"""
    PERSONAL = "personal"
    TEAM = "team"


class TaskStatus(str, enum.Enum):
    """任务状态枚举"""
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    USER = "user"
    ADMIN = "admin"


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    published_tasks = relationship("Task", back_populates="publisher", foreign_keys="Task.publisher_id")
    accepted_tasks = relationship("TaskAcceptance", back_populates="user")


class Task(Base):
    """任务模型"""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(Enum(TaskType), nullable=False)
    priority = Column(Integer, default=1)  # 1-5优先级
    status = Column(Enum(TaskStatus), default=TaskStatus.AVAILABLE)
    deadline = Column(DateTime(timezone=True), nullable=True)
    tags = Column(Text, nullable=True)  # JSON字符串存储标签
    max_accept_count = Column(Integer, default=1)  # 最大接取人数
    accepted_count = Column(Integer, default=0)  # 已接取人数
    
    # 外键
    publisher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    publisher = relationship("User", back_populates="published_tasks", foreign_keys=[publisher_id])
    acceptances = relationship("TaskAcceptance", back_populates="task")


class TaskAcceptance(Base):
    """任务接取记录模型"""
    __tablename__ = "task_acceptances"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.IN_PROGRESS)
    accepted_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # 关系
    task = relationship("Task", back_populates="acceptances")
    user = relationship("User", back_populates="accepted_tasks")


class File(Base):
    """文件模型"""
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # 关联任务
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    uploader = relationship("User")
    task = relationship("Task")


class Notification(Base):
    """通知模型"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, error, success
    is_read = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    user = relationship("User")
