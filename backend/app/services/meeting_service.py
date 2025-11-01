"""
会议服务
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from app.models import Meeting, MeetingAttendance, MeetingType, AttendanceStatus, User
from app.schemas import MeetingCreate, MeetingUpdate, AttendanceUpdate

logger = logging.getLogger(__name__)


class MeetingService:
    """会议服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_meeting_by_id(self, meeting_id: int) -> Optional[Meeting]:
        """根据ID获取会议"""
        return self.db.query(Meeting).filter(Meeting.id == meeting_id).first()
    
    def get_meetings(
        self,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        meeting_type: Optional[MeetingType] = None
    ) -> List[Meeting]:
        """获取会议列表"""
        query = self.db.query(Meeting)
        
        if start_date:
            query = query.filter(Meeting.meeting_date >= start_date)
        if end_date:
            query = query.filter(Meeting.meeting_date <= end_date)
        if meeting_type:
            query = query.filter(Meeting.type == meeting_type)
        
        return query.order_by(Meeting.meeting_date.asc()).offset(skip).limit(limit).all()
    
    def get_user_meetings(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Meeting]:
        """获取用户相关的会议（创建的或需要参加的）"""
        # 获取用户创建的会议
        created_meetings = self.db.query(Meeting).filter(
            Meeting.created_by_id == user_id
        )
        
        # 获取用户需要参加的会议（通过出席记录）
        attendance_meetings = self.db.query(Meeting).join(
            MeetingAttendance
        ).filter(MeetingAttendance.user_id == user_id)
        
        if start_date:
            created_meetings = created_meetings.filter(Meeting.meeting_date >= start_date)
            attendance_meetings = attendance_meetings.filter(Meeting.meeting_date >= start_date)
        
        if end_date:
            created_meetings = created_meetings.filter(Meeting.meeting_date <= end_date)
            attendance_meetings = attendance_meetings.filter(Meeting.meeting_date <= end_date)
        
        # 合并并去重
        all_meetings = created_meetings.union(attendance_meetings).order_by(
            Meeting.meeting_date.asc()
        ).offset(skip).limit(limit).all()
        
        return all_meetings
    
    def create_meeting(self, meeting_data: MeetingCreate, created_by_id: int) -> Meeting:
        """创建会议"""
        db_meeting = Meeting(
            title=meeting_data.title,
            description=meeting_data.description,
            type=meeting_data.type,
            meeting_date=meeting_data.meeting_date,
            duration=meeting_data.duration,
            is_recurring=meeting_data.is_recurring,
            recurring_pattern=meeting_data.recurring_pattern,
            created_by_id=created_by_id
        )
        
        self.db.add(db_meeting)
        self.db.commit()
        self.db.refresh(db_meeting)
        
        logger.info(f"创建新会议: {meeting_data.title} (创建者: {created_by_id})")
        return db_meeting
    
    def update_meeting(self, meeting_id: int, meeting_data: MeetingUpdate) -> Optional[Meeting]:
        """更新会议"""
        meeting = self.get_meeting_by_id(meeting_id)
        if not meeting:
            return None
        
        update_data = meeting_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(meeting, field, value)
        
        self.db.commit()
        self.db.refresh(meeting)
        
        logger.info(f"更新会议: {meeting.title}")
        return meeting
    
    def delete_meeting(self, meeting_id: int) -> bool:
        """删除会议"""
        meeting = self.get_meeting_by_id(meeting_id)
        if not meeting:
            return False
        
        # 删除相关的出席记录
        self.db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id
        ).delete()
        
        self.db.delete(meeting)
        self.db.commit()
        
        logger.info(f"删除会议: {meeting.title}")
        return True
    
    def get_attendance(self, meeting_id: int, user_id: int) -> Optional[MeetingAttendance]:
        """获取用户的出席记录"""
        return self.db.query(MeetingAttendance).filter(
            and_(
                MeetingAttendance.meeting_id == meeting_id,
                MeetingAttendance.user_id == user_id
            )
        ).first()
    
    def create_attendance(self, meeting_id: int, user_id: int) -> MeetingAttendance:
        """创建出席记录（默认待确认状态）"""
        # 检查是否已存在
        existing = self.get_attendance(meeting_id, user_id)
        if existing:
            return existing
        
        attendance = MeetingAttendance(
            meeting_id=meeting_id,
            user_id=user_id,
            status=AttendanceStatus.PENDING
        )
        
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        
        logger.info(f"创建出席记录: 会议 {meeting_id}, 用户 {user_id}")
        return attendance
    
    def update_attendance(
        self,
        meeting_id: int,
        user_id: int,
        attendance_data: AttendanceUpdate
    ) -> Optional[MeetingAttendance]:
        """更新出席状态"""
        attendance = self.get_attendance(meeting_id, user_id)
        if not attendance:
            # 如果不存在，创建一条新记录
            attendance = self.create_attendance(meeting_id, user_id)
        
        attendance.status = attendance_data.status
        if attendance_data.notes is not None:
            attendance.notes = attendance_data.notes
        
        self.db.commit()
        self.db.refresh(attendance)
        
        logger.info(f"更新出席状态: 会议 {meeting_id}, 用户 {user_id}, 状态: {attendance_data.status}")
        return attendance
    
    def get_meeting_attendances(self, meeting_id: int) -> List[MeetingAttendance]:
        """获取会议的所有出席记录"""
        return self.db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == meeting_id
        ).all()
    
    def get_user_attendances(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[MeetingAttendance]:
        """获取用户的出席记录"""
        return self.db.query(MeetingAttendance).filter(
            MeetingAttendance.user_id == user_id
        ).offset(skip).limit(limit).all()
    
    def search_meetings(self, query: str, skip: int = 0, limit: int = 100) -> List[Meeting]:
        """搜索会议"""
        return self.db.query(Meeting).filter(
            or_(
                Meeting.title.contains(query),
                Meeting.description.contains(query)
            )
        ).offset(skip).limit(limit).all()

