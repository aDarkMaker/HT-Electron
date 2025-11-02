"""
数据库配置和连接管理
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timezone, timedelta
import os
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 根据数据库URL创建引擎
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite配置
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
else:
    # PostgreSQL/MySQL配置
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True
    )

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_default_meeting():
    """初始化默认双周例会"""
    # 在函数内部导入，避免循环导入
    from app.models import Meeting, User, MeetingType, MeetingAttendance, AttendanceStatus
    
    db = SessionLocal()
    try:
        # 检查是否已经存在双周例会
        existing_meeting = db.query(Meeting).filter(
            Meeting.title == "双周例会",
            Meeting.is_recurring == True,
            Meeting.recurring_pattern == "biweekly"
        ).first()
        
        if existing_meeting:
            logger.info("默认双周例会已存在，跳过创建")
            return
        
        # 获取第一个用户作为创建者（如果没有用户，则跳过）
        first_user = db.query(User).first()
        if not first_user:
            logger.warning("没有找到用户，暂不创建默认例会（将在有用户后创建）")
            return
        
        # 使用中国时区（UTC+8）
        china_tz = timezone(timedelta(hours=8))
        next_meeting_date = datetime(2025, 11, 6, 16, 0, 0, tzinfo=china_tz)  # 中国时间下午4点
        
        # 创建默认双周例会
        default_meeting = Meeting(
            title="双周例会",
            description="定期团队例会，讨论项目进展和安排",
            type=MeetingType.MEETING,
            meeting_date=next_meeting_date,
            duration=60,  # 1小时
            is_recurring=True,
            recurring_pattern="biweekly",
            created_by_id=first_user.id
        )
        
        db.add(default_meeting)
        db.commit()
        logger.info(f"成功创建默认双周例会，下一次例会时间: {next_meeting_date.strftime('%Y-%m-%d %H:%M')}, 会议ID: {default_meeting.id}")
        # 注意：对于重复会议，出席记录会在生成实例时自动创建，不需要在这里创建
    except Exception as e:
        logger.error(f"创建默认例会失败: {str(e)}", exc_info=True)
        db.rollback()
    finally:
        db.close()


async def init_db():
    """初始化数据库"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 确保上传目录存在
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # 初始化默认双周例会
    await init_default_meeting()