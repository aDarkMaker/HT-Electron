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
    
    def get_attendance(
        self, 
        meeting_id: int, 
        user_id: int, 
        instance_date: Optional[datetime] = None
    ) -> Optional[MeetingAttendance]:
        """获取用户的出席记录（支持按实例日期查找）"""
        query = self.db.query(MeetingAttendance).filter(
            and_(
                MeetingAttendance.meeting_id == meeting_id,
                MeetingAttendance.user_id == user_id
            )
        )
        
        # 如果提供了实例日期，按实例日期查找；否则查找没有实例日期的记录（非重复会议）
        if instance_date:
            # 需要比较日期部分（忽略时间部分）
            # 使用日期范围来比较（在同一天内）
            instance_date_start = instance_date.replace(hour=0, minute=0, second=0, microsecond=0)
            instance_date_end = instance_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.filter(
                and_(
                    MeetingAttendance.instance_date >= instance_date_start,
                    MeetingAttendance.instance_date <= instance_date_end
                )
            )
        else:
            query = query.filter(MeetingAttendance.instance_date.is_(None))
        
        return query.first()
    
    def create_attendance(
        self, 
        meeting_id: int, 
        user_id: int, 
        instance_date: Optional[datetime] = None
    ) -> MeetingAttendance:
        """创建出席记录（默认待确认状态）"""
        # 检查是否已存在
        existing = self.get_attendance(meeting_id, user_id, instance_date)
        if existing:
            return existing
        
        attendance = MeetingAttendance(
            meeting_id=meeting_id,
            user_id=user_id,
            instance_date=instance_date,
            status=AttendanceStatus.PENDING
        )
        
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        
        logger.info(f"创建出席记录: 会议 {meeting_id}, 用户 {user_id}, 实例日期: {instance_date}")
        return attendance
    
    def update_attendance(
        self,
        meeting_id: int,
        user_id: int,
        attendance_data: AttendanceUpdate
    ) -> Optional[MeetingAttendance]:
        """更新出席状态（支持按实例日期更新）"""
        # 使用实例日期查找或创建出席记录
        attendance = self.get_attendance(meeting_id, user_id, attendance_data.instance_date)
        if not attendance:
            # 如果不存在，创建一条新记录
            attendance = self.create_attendance(meeting_id, user_id, attendance_data.instance_date)
        
        attendance.status = attendance_data.status
        if attendance_data.notes is not None:
            attendance.notes = attendance_data.notes
        
        self.db.commit()
        self.db.refresh(attendance)
        
        logger.info(f"更新出席状态: 会议 {meeting_id}, 用户 {user_id}, 实例日期: {attendance_data.instance_date}, 状态: {attendance_data.status}")
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
    
    def generate_recurring_instances(
        self,
        meeting: Meeting,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        current_user_id: Optional[int] = None
    ) -> List[dict]:
        """
        为重复会议生成所有实例
        
        Args:
            meeting: 会议对象
            start_date: 开始日期（可选，用于过滤生成的实例）
            end_date: 结束日期（可选，用于过滤生成的实例）
        
        Returns:
            重复实例列表，每个实例是一个字典，包含会议的所有字段和新的 meeting_date
        """
        instances = []
        
        # 如果不是重复会议，返回原会议
        if not meeting.is_recurring or not meeting.recurring_pattern:
            # 获取当前用户的出席状态（如果有），不存在则自动创建
            attendance_status = "pending"  # 默认状态
            if current_user_id:
                attendance = self.get_attendance(meeting.id, current_user_id)
                if not attendance:
                    # 如果不存在出席记录，自动创建一条（状态为待确认）
                    attendance = self.create_attendance(meeting.id, current_user_id)
                attendance_status = attendance.status.value if hasattr(attendance.status, 'value') else str(attendance.status)
            
            meeting_dict = {
                "id": meeting.id,
                "title": meeting.title,
                "description": meeting.description,
                "type": meeting.type.value if hasattr(meeting.type, 'value') else str(meeting.type),
                "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                "duration": meeting.duration,
                "is_recurring": meeting.is_recurring,
                "recurring_pattern": meeting.recurring_pattern,
                "created_by_id": meeting.created_by_id,
                "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None,
                "meetingId": meeting.id,  # 前端需要的字段
                "attendance": attendance_status  # 出席状态
            }
            return [meeting_dict]
        
        # 确保 base_date 是 datetime 对象且没有时区信息
        base_date = meeting.meeting_date
        if not base_date:
            logger.warning(f"会议 {meeting.id} 没有设置日期")
            return []
        
        # 移除时区信息（如果有）
        if base_date.tzinfo:
            base_date = base_date.replace(tzinfo=None)
        
        # 确定日期范围
        if not start_date:
            # 默认从会议日期开始，向前扩展1个月
            start_date = base_date - timedelta(days=30)
        else:
            # 移除时区信息
            if start_date.tzinfo:
                start_date = start_date.replace(tzinfo=None)
        
        if not end_date:
            # 默认向后扩展1个月
            end_date = base_date + timedelta(days=30)
        else:
            # 移除时区信息
            if end_date.tzinfo:
                end_date = end_date.replace(tzinfo=None)
        
        # 设置最大日期限制：最多生成到未来1年
        max_end_date = base_date + timedelta(days=365)
        if end_date > max_end_date:
            end_date = max_end_date
            logger.debug(f"限制日期范围：end_date超过1年，已调整为: {end_date}")
        
        logger.debug(f"生成重复实例: 会议日期={base_date}, 范围={start_date} 到 {end_date}")
        
        # 处理双周例会 (biweekly)
        if meeting.recurring_pattern == 'biweekly':
            current_date = base_date
            
            # 从原会议日期开始，每次增加14天
            # 限制：最多生成50个实例，避免无限生成
            instance_count = 0
            max_instances = 50
            while current_date <= end_date and instance_count < max_instances:
                # 如果日期在范围内，添加到实例列表
                if current_date >= start_date:
                    instance_date_str = current_date.strftime('%Y-%m-%d')
                    
                    # 获取当前用户的出席状态（如果有），不存在则自动创建
                    # 对于重复会议，使用实例日期来区分不同的实例
                    attendance_status = "pending"  # 默认状态
                    if current_user_id:
                        # 传入实例日期，查找该实例的出席记录
                        attendance = self.get_attendance(meeting.id, current_user_id, current_date)
                        if not attendance:
                            # 如果不存在出席记录，自动创建一条（状态为待确认）
                            attendance = self.create_attendance(meeting.id, current_user_id, current_date)
                        attendance_status = attendance.status.value if hasattr(attendance.status, 'value') else str(attendance.status)
                    
                    instances.append({
                        "id": f"{meeting.id}_{instance_date_str}",  # 组合ID，前端使用
                        "meetingId": meeting.id,  # 原始会议ID
                        "title": meeting.title,
                        "description": meeting.description,
                        "type": meeting.type.value if hasattr(meeting.type, 'value') else str(meeting.type),
                        "meeting_date": current_date.isoformat(),
                        "date": current_date.isoformat(),  # 前端可能需要的字段
                        "duration": meeting.duration,
                        "is_recurring": True,
                        "recurring_pattern": meeting.recurring_pattern,
                        "created_by_id": meeting.created_by_id,
                        "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                        "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None,
                        "isRecurring": True,  # 前端标记
                        "attendance": attendance_status  # 出席状态
                    })
                    instance_count += 1
                # 增加两周（14天）
                current_date = current_date + timedelta(days=14)
            
            logger.debug(f"双周例会生成了 {instance_count} 个实例")
        
        # 可以在这里添加其他重复模式，如 weekly, monthly 等
        # elif meeting.recurring_pattern == 'weekly':
        #     ...
        # elif meeting.recurring_pattern == 'monthly':
        #     ...
        
        # 如果没有生成任何实例，返回原会议
        if not instances:
            meeting_dict = {
                "id": meeting.id,
                "meetingId": meeting.id,
                "title": meeting.title,
                "description": meeting.description,
                "type": meeting.type.value if hasattr(meeting.type, 'value') else str(meeting.type),
                "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                "date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                "duration": meeting.duration,
                "is_recurring": meeting.is_recurring,
                "recurring_pattern": meeting.recurring_pattern,
                "created_by_id": meeting.created_by_id,
                "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None
            }
            return [meeting_dict]
        
        return instances
    
    def get_meetings_with_instances(
        self,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        meeting_type: Optional[MeetingType] = None,
        current_user_id: Optional[int] = None
    ) -> List[dict]:
        """
        获取会议列表，包括重复会议的所有实例
        
        Returns:
            会议实例列表（字典格式）
        """
        # 处理时区问题：如果传入的日期有时区信息，转换为本地时间
        if start_date and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if end_date and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        
        # 首先获取所有会议（对于重复会议，需要获取原始会议，不受日期限制）
        try:
            query = self.db.query(Meeting)
            
            if meeting_type:
                query = query.filter(Meeting.type == meeting_type)
            
            # 获取所有重复会议和指定日期范围内的非重复会议
            # 对于重复会议，不进行日期过滤，因为我们会在生成实例时处理
            all_meetings = query.order_by(Meeting.meeting_date.asc()).all()
            
            logger.info(f"获取所有会议: 共 {len(all_meetings)} 个，日期范围: {start_date} 到 {end_date}")
        except Exception as e:
            logger.error(f"查询会议失败: {str(e)}", exc_info=True)
            return []
        
        # 生成所有实例
        all_instances = []
        try:
            for meeting in all_meetings:
                try:
                    logger.debug(f"处理会议 {meeting.id}: {meeting.title}, 重复: {meeting.is_recurring}, 日期: {meeting.meeting_date}")
                    if meeting.is_recurring:
                        # 对于重复会议，生成实例
                        logger.debug(f"生成重复会议实例: {meeting.id} - {meeting.title}, 模式: {meeting.recurring_pattern}")
                        instances = self.generate_recurring_instances(
                            meeting,
                            start_date=start_date,
                            end_date=end_date,
                            current_user_id=current_user_id
                        )
                        logger.debug(f"生成了 {len(instances)} 个实例")
                        all_instances.extend(instances)
                    else:
                        # 对于非重复会议，只返回在日期范围内的
                        meeting_date = meeting.meeting_date
                        if meeting_date:
                            # 移除时区信息（如果有）
                            if meeting_date.tzinfo:
                                meeting_date = meeting_date.replace(tzinfo=None)
                            
                            include = True
                            if start_date and meeting_date < start_date:
                                include = False
                            if end_date and meeting_date > end_date:
                                include = False
                            
                            if include:
                                # 获取当前用户的出席状态（如果有），不存在则自动创建
                                attendance_status = "pending"  # 默认状态
                                if current_user_id:
                                    attendance = self.get_attendance(meeting.id, current_user_id)
                                    if not attendance:
                                        # 如果不存在出席记录，自动创建一条（状态为待确认）
                                        attendance = self.create_attendance(meeting.id, current_user_id)
                                    attendance_status = attendance.status.value if hasattr(attendance.status, 'value') else str(attendance.status)
                                
                                meeting_dict = {
                                    "id": meeting.id,
                                    "meetingId": meeting.id,
                                    "title": meeting.title,
                                    "description": meeting.description,
                                    "type": meeting.type.value if hasattr(meeting.type, 'value') else str(meeting.type),
                                    "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                                    "date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                                    "duration": meeting.duration,
                                    "is_recurring": meeting.is_recurring,
                                    "recurring_pattern": meeting.recurring_pattern,
                                    "created_by_id": meeting.created_by_id,
                                    "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                                    "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None,
                                    "attendance": attendance_status  # 出席状态
                                }
                                all_instances.append(meeting_dict)
                                logger.debug(f"添加非重复会议: {meeting.id} - {meeting.title}")
                except Exception as e:
                    logger.error(f"处理会议 {meeting.id} 时出错: {str(e)}", exc_info=True)
                    # 继续处理下一个会议，不中断整个流程
                    continue
        except Exception as e:
            logger.error(f"生成会议实例时出错: {str(e)}", exc_info=True)
        
        logger.info(f"共生成 {len(all_instances)} 个会议实例")
        
        # 按日期排序
        all_instances.sort(key=lambda x: x.get('meeting_date') or '')
        
        # 应用分页
        result = all_instances[skip:skip + limit]
        logger.info(f"应用分页后返回 {len(result)} 个实例")
        
        return result
    
    def get_user_meetings_with_instances(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[dict]:
        """
        获取用户相关的会议列表，包括重复会议的所有实例
        
        Returns:
            会议实例列表（字典格式）
        """
        # 处理时区问题：如果传入的日期有时区信息，转换为本地时间
        if start_date and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if end_date and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        
        # 获取用户创建的会议
        created_meetings_query = self.db.query(Meeting).filter(
            Meeting.created_by_id == user_id
        )
        created_meetings = created_meetings_query.all()
        
        # 获取用户需要参加的会议（通过出席记录）
        attendance_meetings_query = self.db.query(Meeting).join(
            MeetingAttendance
        ).filter(MeetingAttendance.user_id == user_id)
        attendance_meetings = attendance_meetings_query.all()
        
        logger.info(f"获取用户 {user_id} 的会议: 创建的 {len(created_meetings)} 个, 参加的 {len(attendance_meetings)} 个")
        
        # 合并并去重（使用set保存ID）
        all_meeting_ids = set()
        all_meetings = []
        
        for meeting in created_meetings:
            if meeting.id not in all_meeting_ids:
                all_meeting_ids.add(meeting.id)
                all_meetings.append(meeting)
                logger.debug(f"找到创建的会议: {meeting.id} - {meeting.title}, 重复: {meeting.is_recurring}, 日期: {meeting.meeting_date}")
        
        for meeting in attendance_meetings:
            if meeting.id not in all_meeting_ids:
                all_meeting_ids.add(meeting.id)
                all_meetings.append(meeting)
                logger.debug(f"找到参加的会议: {meeting.id} - {meeting.title}, 重复: {meeting.is_recurring}, 日期: {meeting.meeting_date}")
        
        logger.info(f"合并后共 {len(all_meetings)} 个唯一会议")
        logger.info(f"日期范围: {start_date} 到 {end_date}")
        
        # 按日期排序
        all_meetings.sort(key=lambda m: m.meeting_date or datetime.min)
        
        # 生成所有实例
        all_instances = []
        for meeting in all_meetings:
            if meeting.is_recurring:
                # 对于重复会议，生成实例
                logger.debug(f"处理重复会议 {meeting.id}: {meeting.title}, 模式: {meeting.recurring_pattern}")
                instances = self.generate_recurring_instances(
                    meeting,
                    start_date=start_date,
                    end_date=end_date
                )
                logger.debug(f"生成 {len(instances)} 个实例")
                all_instances.extend(instances)
            else:
                # 对于非重复会议，只返回在日期范围内的
                meeting_date = meeting.meeting_date
                if meeting_date:
                    # 移除时区信息（如果有）
                    if meeting_date.tzinfo:
                        meeting_date = meeting_date.replace(tzinfo=None)
                    
                    include = True
                    if start_date and meeting_date < start_date:
                        include = False
                    if end_date and meeting_date > end_date:
                        include = False
                    
                    if include:
                        meeting_dict = {
                            "id": meeting.id,
                            "meetingId": meeting.id,
                            "title": meeting.title,
                            "description": meeting.description,
                            "type": meeting.type.value if hasattr(meeting.type, 'value') else str(meeting.type),
                            "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                            "date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                            "duration": meeting.duration,
                            "is_recurring": meeting.is_recurring,
                            "recurring_pattern": meeting.recurring_pattern,
                            "created_by_id": meeting.created_by_id,
                            "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                            "updated_at": meeting.updated_at.isoformat() if meeting.updated_at else None
                        }
                        all_instances.append(meeting_dict)
                        logger.debug(f"添加非重复会议: {meeting.id} - {meeting.title}")
        
        logger.info(f"共生成 {len(all_instances)} 个会议实例")
        
        # 按日期排序
        all_instances.sort(key=lambda x: x.get('meeting_date') or '')
        
        # 应用分页
        result = all_instances[skip:skip + limit]
        logger.info(f"应用分页后返回 {len(result)} 个实例")
        
        return result

