"""
API路由配置
"""

from fastapi import APIRouter

from app.api.v1.endpoints import users, tasks

api_router = APIRouter()

# 包含各个模块的路由
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
