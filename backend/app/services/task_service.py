"""
任务服务
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
import logging
import json

from app.models import Task, TaskAcceptance, TaskType, TaskStatus, User
from app.schemas import TaskCreate, TaskUpdate, TaskAcceptanceCreate

logger = logging.getLogger(__name__)


class TaskService:
    """任务服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """根据ID获取任务"""
        return self.db.query(Task).filter(Task.id == task_id).first()
    
    def get_tasks(self, skip: int = 0, limit: int = 100, task_type: Optional[TaskType] = None) -> List[Task]:
        """获取任务列表"""
        query = self.db.query(Task)
        
        if task_type:
            query = query.filter(Task.type == task_type)
        
        return query.offset(skip).limit(limit).all()
    
    def get_available_tasks(self, skip: int = 0, limit: int = 100) -> List[Task]:
        """获取可用任务列表"""
        return self.db.query(Task).filter(
            Task.status == TaskStatus.AVAILABLE
        ).offset(skip).limit(limit).all()
    
    def get_user_tasks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        """获取用户发布的任务"""
        return self.db.query(Task).filter(
            Task.publisher_id == user_id
        ).offset(skip).limit(limit).all()
    
    def get_user_accepted_tasks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[TaskAcceptance]:
        """获取用户接取的任务"""
        return self.db.query(TaskAcceptance).filter(
            TaskAcceptance.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    def create_task(self, task_data: TaskCreate, publisher_id: int) -> Task:
        """创建任务"""
        # 处理标签
        tags_json = json.dumps(task_data.tags) if task_data.tags else None
        
        db_task = Task(
            title=task_data.title,
            description=task_data.description,
            type=task_data.type,
            priority=task_data.priority,
            deadline=task_data.deadline,
            tags=tags_json,
            max_accept_count=task_data.max_accept_count,
            publisher_id=publisher_id,
            status=TaskStatus.AVAILABLE
        )
        
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        
        logger.info(f"创建新任务: {task_data.title} (发布者: {publisher_id})")
        return db_task
    
    def update_task(self, task_id: int, task_data: TaskUpdate) -> Optional[Task]:
        """更新任务"""
        task = self.get_task_by_id(task_id)
        if not task:
            return None
        
        # 处理标签
        update_data = task_data.dict(exclude_unset=True)
        if "tags" in update_data:
            update_data["tags"] = json.dumps(update_data["tags"]) if update_data["tags"] else None
        
        # 更新任务信息
        for field, value in update_data.items():
            setattr(task, field, value)
        
        self.db.commit()
        self.db.refresh(task)
        
        logger.info(f"更新任务: {task.title}")
        return task
    
    def delete_task(self, task_id: int) -> bool:
        """删除任务"""
        task = self.get_task_by_id(task_id)
        if not task:
            return False
        
        # 删除相关的接取记录
        self.db.query(TaskAcceptance).filter(TaskAcceptance.task_id == task_id).delete()
        
        self.db.delete(task)
        self.db.commit()
        
        logger.info(f"删除任务: {task.title}")
        return True
    
    def accept_task(self, task_id: int, user_id: int) -> Optional[TaskAcceptance]:
        """接取任务"""
        task = self.get_task_by_id(task_id)
        if not task:
            return None
        
        # 检查任务是否可用
        if task.status != TaskStatus.AVAILABLE:
            raise ValueError("任务不可用")
        
        # 检查是否已经接取
        existing_acceptance = self.db.query(TaskAcceptance).filter(
            and_(TaskAcceptance.task_id == task_id, TaskAcceptance.user_id == user_id)
        ).first()
        
        if existing_acceptance:
            raise ValueError("您已接取该任务")
        
        # 检查团队任务人数限制
        if task.type == TaskType.TEAM and task.accepted_count >= task.max_accept_count:
            raise ValueError("该团队任务人数已满")
        
        # 创建接取记录
        acceptance = TaskAcceptance(
            task_id=task_id,
            user_id=user_id,
            status=TaskStatus.IN_PROGRESS
        )
        
        self.db.add(acceptance)
        
        # 更新任务接取人数
        task.accepted_count += 1
        
        # 如果是个人任务，标记为进行中
        if task.type == TaskType.PERSONAL:
            task.status = TaskStatus.IN_PROGRESS
        
        self.db.commit()
        self.db.refresh(acceptance)
        
        logger.info(f"用户 {user_id} 接取任务: {task.title}")
        return acceptance
    
    def complete_task(self, task_id: int, user_id: int) -> bool:
        """完成任务"""
        acceptance = self.db.query(TaskAcceptance).filter(
            and_(TaskAcceptance.task_id == task_id, TaskAcceptance.user_id == user_id)
        ).first()
        
        if not acceptance:
            return False
        
        if acceptance.status == TaskStatus.COMPLETED:
            raise ValueError("任务已完成")
        
        # 更新接取记录状态
        acceptance.status = TaskStatus.COMPLETED
        acceptance.completed_at = func.now()
        
        # 更新任务状态
        task = self.get_task_by_id(task_id)
        if task:
            # 不减少accepted_count，因为需要统计完成情况
            # task.accepted_count -= 1
            
            # 检查任务完成情况
            if task.type == TaskType.PERSONAL:
                # 个人任务：一个人完成就标记为已完成
                task.status = TaskStatus.COMPLETED
            elif task.type == TaskType.TEAM:
                # 团队任务：需要检查所有接取任务的人是否都完成了
                # 获取所有接取记录
                all_acceptances = self.db.query(TaskAcceptance).filter(
                    TaskAcceptance.task_id == task_id
                ).all()
                
                # 检查是否所有人都完成了
                all_completed = all(
                    acc.status == TaskStatus.COMPLETED 
                    for acc in all_acceptances
                )
                
                if all_completed:
                    # 所有接取的人都完成了，标记任务为已完成
                    task.status = TaskStatus.COMPLETED
                    logger.info(f"团队任务 {task.title} 所有成员已完成，任务标记为完成")
        
        self.db.commit()
        
        logger.info(f"用户 {user_id} 完成任务: {task.title if task else task_id}")
        return True
    
    def abandon_task(self, task_id: int, user_id: int) -> bool:
        """放弃任务"""
        acceptance = self.db.query(TaskAcceptance).filter(
            and_(TaskAcceptance.task_id == task_id, TaskAcceptance.user_id == user_id)
        ).first()
        
        if not acceptance:
            return False
        
        # 删除接取记录
        self.db.delete(acceptance)
        
        # 更新任务接取人数
        task = self.get_task_by_id(task_id)
        if task:
            task.accepted_count -= 1
            
            # 如果是个人任务，重新标记为可用
            if task.type == TaskType.PERSONAL and task.accepted_count == 0:
                task.status = TaskStatus.AVAILABLE
        
        self.db.commit()
        
        logger.info(f"用户 {user_id} 放弃任务: {task.title if task else task_id}")
        return True
    
    def search_tasks(self, query: str, skip: int = 0, limit: int = 100) -> List[Task]:
        """搜索任务"""
        return self.db.query(Task).filter(
            or_(
                Task.title.contains(query),
                Task.description.contains(query)
            )
        ).offset(skip).limit(limit).all()
