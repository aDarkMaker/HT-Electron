"""
用户服务
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from typing import Optional, List
import logging

from app.models import User, UserRole
from app.schemas import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """用户服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """获取密码哈希"""
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
        
        # 创建新用户
        hashed_password = self.get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            role=UserRole.USER
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info(f"创建新用户: {user_data.username}")
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
        
        # 更新用户信息
        update_data = user_data.dict(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = self.get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"更新用户: {user.username}")
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
