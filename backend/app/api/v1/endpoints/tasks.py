"""
任务API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.schemas import (
    TaskCreate, TaskUpdate, TaskResponse, TaskAcceptanceCreate, 
    TaskAcceptanceResponse, MessageResponse
)
from app.services.task_service import TaskService
from app.models import User, TaskType, TaskStatus

router = APIRouter()


@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建任务"""
    task_service = TaskService(db)
    
    try:
        task = task_service.create_task(task_data, current_user.id)
        # 添加发布者姓名
        task.publisher_name = current_user.name
        return task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建任务失败: {str(e)}"
        )


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    task_type: Optional[TaskType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取任务列表"""
    task_service = TaskService(db)
    tasks = task_service.get_tasks(skip=skip, limit=limit, task_type=task_type)
    
    # 添加发布者姓名并转换数据格式
    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "type": task.type.value if hasattr(task.type, 'value') else str(task.type),
            "priority": task.priority,
            "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "tags": json.loads(task.tags) if task.tags else [],
            "accepted_count": task.accepted_count,
            "max_accept_count": task.max_accept_count,
            "publisher_id": task.publisher_id,
            "publisher_name": task.publisher.name if task.publisher else "未知",
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None
        }
        result.append(task_dict)
    
    return result


@router.get("/available", response_model=List[TaskResponse])
async def get_available_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取可用任务列表"""
    task_service = TaskService(db)
    tasks = task_service.get_available_tasks(skip=skip, limit=limit)
    
    # 添加发布者姓名并转换数据格式
    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "type": task.type.value if hasattr(task.type, 'value') else str(task.type),
            "priority": task.priority,
            "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "tags": json.loads(task.tags) if task.tags else [],
            "accepted_count": task.accepted_count,
            "max_accept_count": task.max_accept_count,
            "publisher_id": task.publisher_id,
            "publisher_name": task.publisher.name if task.publisher else "未知",
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None
        }
        result.append(task_dict)
    
    return result


@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取我发布的任务"""
    task_service = TaskService(db)
    tasks = task_service.get_user_tasks(current_user.id, skip=skip, limit=limit)
    
    # 添加发布者姓名
    for task in tasks:
        task.publisher_name = current_user.name
    
    return tasks


@router.get("/accepted", response_model=List[dict])
async def get_accepted_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取我接取的任务"""
    task_service = TaskService(db)
    acceptances = task_service.get_user_accepted_tasks(current_user.id, skip=skip, limit=limit)
    
    # 构建包含任务信息的响应
    result = []
    for acc in acceptances:
        task = acc.task
        result.append({
            "id": acc.id,
            "task_id": acc.task_id,
            "user_id": acc.user_id,
            "status": acc.status.value if hasattr(acc.status, 'value') else str(acc.status),
            "accepted_at": acc.accepted_at.isoformat() if acc.accepted_at else None,
            "completed_at": acc.completed_at.isoformat() if acc.completed_at else None,
            "task": {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "type": task.type.value if hasattr(task.type, 'value') else str(task.type),
                "priority": task.priority,
                "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "tags": json.loads(task.tags) if task.tags else [],
                "accepted_count": task.accepted_count,
                "max_accept_count": task.max_accept_count,
                "publisher_id": task.publisher_id,
                "publisher_name": task.publisher.name if task.publisher else "未知",
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None
            }
        })
    
    return result


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取单个任务详情"""
    task_service = TaskService(db)
    task = task_service.get_task_by_id(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    # 添加发布者姓名
    task.publisher_name = task.publisher.name
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新任务"""
    task_service = TaskService(db)
    
    # 检查任务是否存在
    task = task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    # 检查权限（只有发布者可以更新）
    if task.publisher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限更新此任务"
        )
    
    try:
        updated_task = task_service.update_task(task_id, task_data)
        updated_task.publisher_name = current_user.name
        return updated_task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"更新任务失败: {str(e)}"
        )


@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除任务"""
    task_service = TaskService(db)
    
    # 检查任务是否存在
    task = task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    # 检查权限（只有发布者可以删除）
    if task.publisher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此任务"
        )
    
    success = task_service.delete_task(task_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除任务失败"
        )
    
    return MessageResponse(message="任务删除成功")


@router.post("/{task_id}/accept", response_model=TaskAcceptanceResponse)
async def accept_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """接取任务"""
    task_service = TaskService(db)
    
    try:
        acceptance = task_service.accept_task(task_id, current_user.id)
        if not acceptance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="任务不存在"
            )
        return acceptance
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{task_id}/complete", response_model=MessageResponse)
async def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """完成任务"""
    task_service = TaskService(db)
    
    try:
        success = task_service.complete_task(task_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="任务不存在或未接取"
            )
        return MessageResponse(message="任务完成")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{task_id}/abandon", response_model=MessageResponse)
async def abandon_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """放弃任务"""
    task_service = TaskService(db)
    
    success = task_service.abandon_task(task_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在或未接取"
        )
    
    return MessageResponse(message="任务已放弃")


@router.get("/search", response_model=List[TaskResponse])
async def search_tasks(
    query: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """搜索任务"""
    task_service = TaskService(db)
    tasks = task_service.search_tasks(query=query, skip=skip, limit=limit)
    
    # 添加发布者姓名并转换数据格式
    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "type": task.type.value if hasattr(task.type, 'value') else str(task.type),
            "priority": task.priority,
            "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "tags": json.loads(task.tags) if task.tags else [],
            "accepted_count": task.accepted_count,
            "max_accept_count": task.max_accept_count,
            "publisher_id": task.publisher_id,
            "publisher_name": task.publisher.name if task.publisher else "未知",
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None
        }
        result.append(task_dict)
    
    return result
