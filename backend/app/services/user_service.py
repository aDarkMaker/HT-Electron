"""
用户服务
"""

from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import or_  # pyright: ignore[reportMissingImports]
from passlib.context import CryptContext  # pyright: ignore[reportMissingModuleSource]
from typing import Optional, List
import logging

from app.models import User, UserRole
from app.schemas import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def truncate_password_for_bcrypt(password: str) -> str:
    """截断密码以符合 bcrypt 的 72 字节限制"""
    # 将密码编码为字节
    password_bytes = password.encode('utf-8')
    
    # 如果超过72字节，截断
    if len(password_bytes) > 72:
        # 截断到72字节并尝试解码
        # 使用 errors='ignore' 忽略截断导致的不完整字符
        return password_bytes[:72].decode('utf-8', errors='ignore')
    
    return password


class UserService:
    """用户服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        # bcrypt 限制密码不能超过 72 字节
        plain_password = truncate_password_for_bcrypt(plain_password)
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """获取密码哈希"""
        # bcrypt 限制密码不能超过 72 字节
        password = truncate_password_for_bcrypt(password)
        return pwd_context.hash(password)
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_qq(self, qq: str) -> Optional[User]:
        """根据QQ号获取用户"""
        return self.db.query(User).filter(User.qq == qq).first()
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """验证用户"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_user(self, user_data: UserCreate) -> User:
        """创建用户"""
        # 检查用户名和邮箱是否已存在
        if self.get_user_by_username(user_data.username):
            raise ValueError("用户名已存在")
        if self.get_user_by_email(user_data.email):
            raise ValueError("邮箱已存在")
        # 检查QQ号是否已存在
        if user_data.qq and self.get_user_by_qq(user_data.qq):
            raise ValueError("QQ号已被注册")
        
        # 创建新用户
        hashed_password = self.get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            avatar=user_data.avatar,
            qq=user_data.qq,
            role=UserRole.USER
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info(f"创建新用户: {user_data.username}")
        
        # 确保默认例会存在，并为新用户创建出席记录
        try:
            from app.models import Meeting, MeetingAttendance, AttendanceStatus, MeetingType
            from datetime import datetime, timezone, timedelta
            
            # 查找默认双周例会
            default_meeting = self.db.query(Meeting).filter(
                Meeting.title == "双周例会",
                Meeting.is_recurring == True,
                Meeting.recurring_pattern == "biweekly"
            ).first()
            
            # 如果默认例会不存在，创建它
            if not default_meeting:
                # 使用中国时区（UTC+8）
                china_tz = timezone(timedelta(hours=8))
                next_meeting_date = datetime(2025, 11, 6, 16, 0, 0, tzinfo=china_tz)  # 中国时间下午4点
                default_meeting = Meeting(
                    title="双周例会",
                    description="定期团队例会，讨论项目进展和安排",
                    type=MeetingType.MEETING,
                    meeting_date=next_meeting_date,
                    duration=60,  # 1小时
                    is_recurring=True,
                    recurring_pattern="biweekly",
                    created_by_id=db_user.id  # 使用新注册的用户作为创建者
                )
                self.db.add(default_meeting)
                self.db.commit()
                logger.info(f"为新用户 {db_user.username} 创建了默认双周例会，下一次例会时间: {next_meeting_date.strftime('%Y-%m-%d %H:%M')}")
                # 注意：对于重复会议，出席记录会在生成实例时自动创建，不需要在这里创建
            # 对于已存在的默认例会，不需要为新用户创建出席记录，因为会在查看日历时自动创建
        except Exception as e:
            logger.warning(f"为新用户创建默认例会出席记录失败: {str(e)}", exc_info=True)
            # 不阻止用户创建，只是记录警告
        
        return db_user
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """更新用户"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        # 检查用户名和邮箱是否被其他用户使用
        if user_data.username and user_data.username != user.username:
            if self.get_user_by_username(user_data.username):
                raise ValueError("用户名已存在")
        
        if user_data.email and user_data.email != user.email:
            if self.get_user_by_email(user_data.email):
                raise ValueError("邮箱已存在")
        
        # 检查QQ号是否被其他用户使用
        if user_data.qq and user_data.qq != user.qq:
            if self.get_user_by_qq(user_data.qq):
                raise ValueError("QQ号已被注册")
        
        # 更新用户信息
        update_data = user_data.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = self.get_password_hash(update_data.pop("password"))
        
        # 特殊处理avatar：如果是base64数据，验证长度
        if "avatar" in update_data and update_data["avatar"]:
            avatar_data = update_data["avatar"]
            # 如果是base64编码的图片数据（通常以data:image开头）
            if isinstance(avatar_data, str) and avatar_data.startswith("data:image"):
                # base64数据可能很大，限制在10MB以内（约13,300,000字符）
                max_avatar_length = 13300000
                if len(avatar_data) > max_avatar_length:
                    raise ValueError("头像数据过大，请选择较小的图片")
                logger.info(f"更新用户头像: {user.username}, 头像大小: {len(avatar_data)} 字符")
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"更新用户: {user.username}, 更新的字段: {list(update_data.keys())}")
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        
        logger.info(f"删除用户: {user.username}")
        return True
    
    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """获取用户列表"""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def search_users(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """搜索用户"""
        return self.db.query(User).filter(
            or_(
                User.username.contains(query),
                User.name.contains(query),
                User.email.contains(query)
            )
        ).offset(skip).limit(limit).all()
