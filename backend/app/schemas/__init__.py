"""
Pydantic数据模式定义
"""

from pydantic import BaseModel, EmailStr, Field  # pyright: ignore[reportMissingImports]
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models import TaskType, TaskStatus, UserRole, MeetingType, AttendanceStatus


# 基础模式
class BaseSchema(BaseModel):
    """基础模式"""
    class Config:
        from_attributes = True


# 用户相关模式
class UserBase(BaseSchema):
    """用户基础模式"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    avatar: Optional[str] = None  # 头像数据（base64编码或URL）
    qq: Optional[str] = Field(None, min_length=5, max_length=20)  # QQ号


class UserCreate(UserBase):
    """创建用户模式"""
    password: str = Field(..., min_length=6, max_length=72)


class UserUpdate(BaseSchema):
    """更新用户模式"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=72)
    avatar: Optional[str] = None
    qq: Optional[str] = Field(None, min_length=5, max_length=20)


class UserResponse(UserBase):
    """用户响应模式"""
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


# 任务相关模式
class TaskBase(BaseSchema):
    """任务基础模式"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    type: TaskType
    priority: int = Field(1, ge=1, le=5)
    deadline: Optional[datetime] = None
    tags: Optional[List[str]] = None
    max_accept_count: int = Field(1, ge=1)


class TaskCreate(TaskBase):
    """创建任务模式"""
    pass


class TaskUpdate(BaseSchema):
    """更新任务模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    type: Optional[TaskType] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    deadline: Optional[datetime] = None
    tags: Optional[List[str]] = None
    max_accept_count: Optional[int] = Field(None, ge=1)
    status: Optional[TaskStatus] = None


class TaskResponse(TaskBase):
    """任务响应模式"""
    id: int
    status: TaskStatus
    accepted_count: int
    publisher_id: int
    publisher_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class TaskAcceptanceCreate(BaseSchema):
    """创建任务接取模式"""
    task_id: int


class TaskAcceptanceResponse(BaseSchema):
    """任务接取响应模式"""
    id: int
    task_id: int
    user_id: int
    status: TaskStatus
    accepted_at: datetime
    completed_at: Optional[datetime] = None


# 文件相关模式
class FileUpload(BaseSchema):
    """文件上传模式"""
    task_id: Optional[int] = None


class FileResponse(BaseSchema):
    """文件响应模式"""
    id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    uploader_id: int
    task_id: Optional[int] = None
    created_at: datetime


# 通知相关模式
class NotificationCreate(BaseSchema):
    """创建通知模式"""
    user_id: int
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    type: str = Field("info", pattern="^(info|warning|error|success)$")


class NotificationResponse(BaseSchema):
    """通知响应模式"""
    id: int
    user_id: int
    title: str
    content: str
    type: str
    is_read: bool
    created_at: datetime


# 认证相关模式
class Token(BaseSchema):
    """令牌模式"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseSchema):
    """令牌数据模式"""
    username: Optional[str] = None


# 响应模式
class MessageResponse(BaseSchema):
    """消息响应模式"""
    message: str
    success: bool = True


class ErrorResponse(BaseSchema):
    """错误响应模式"""
    error: bool = True
    message: str
    details: Optional[dict] = None


# 会议相关模式
class MeetingBase(BaseSchema):
    """会议基础模式"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    type: MeetingType = MeetingType.MEETING
    meeting_date: datetime
    duration: int = Field(60, ge=15)  # 最少15分钟
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None


class MeetingCreate(MeetingBase):
    """创建会议模式"""
    pass


class MeetingUpdate(BaseSchema):
    """更新会议模式"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    type: Optional[MeetingType] = None
    meeting_date: Optional[datetime] = None
    duration: Optional[int] = Field(None, ge=15)
    is_recurring: Optional[bool] = None
    recurring_pattern: Optional[str] = None


class MeetingResponse(MeetingBase):
    """会议响应模式"""
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class AttendanceUpdate(BaseSchema):
    """更新出席状态模式"""
    status: AttendanceStatus
    notes: Optional[str] = None
    instance_date: Optional[datetime] = None  # 实例日期（用于区分重复会议的不同实例）


class AttendanceResponse(BaseSchema):
    """出席记录响应模式"""
    id: int
    meeting_id: int
    user_id: int
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    instance_date: Optional[datetime] = None  # 实例日期
    status: AttendanceStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class MeetingDetailResponse(MeetingResponse):
    """会议详情响应模式（包含出席情况）"""
    attendances: List[AttendanceResponse] = []
