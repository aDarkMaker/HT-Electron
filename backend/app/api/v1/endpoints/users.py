"""
用户API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.schemas import UserCreate, UserUpdate, UserResponse, Token, MessageResponse
from app.services.user_service import UserService
from app.core.auth import create_access_token
from app.models import User

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """用户注册"""
    user_service = UserService(db)
    
    try:
        user = user_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login_user(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """用户登录"""
    user_service = UserService(db)
    user = user_service.authenticate_user(username, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register-with-qq", response_model=UserResponse)
async def register_user_with_qq(
    username: str = Form(...),
    password: str = Form(...),
    qq: str = Form(...),
    db: Session = Depends(get_db)
):
    """使用QQ号注册用户（简化版，使用QQ号邮箱）"""
    user_service = UserService(db)
    
    # 检查用户名是否已存在
    if user_service.get_user_by_username(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查QQ号是否已存在
    if user_service.get_user_by_qq(qq):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QQ号已被注册"
        )
    
    # 使用QQ号邮箱格式
    email = f"{qq}@qq.com"
    
    try:
        from app.schemas import UserCreate
        user_data = UserCreate(
            username=username,
            password=password,
            email=email,
            name=username,  # 默认使用用户名作为姓名
            qq=qq
        )
        user = user_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户信息"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    user_service = UserService(db)
    
    try:
        updated_user = user_service.update_user(current_user.id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户列表（需要认证）"""
    user_service = UserService(db)
    users = user_service.get_users(skip=skip, limit=limit)
    return users


@router.get("/users/search", response_model=List[UserResponse])
async def search_users(
    query: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """搜索用户"""
    user_service = UserService(db)
    users = user_service.search_users(query=query, skip=skip, limit=limit)
    return users
