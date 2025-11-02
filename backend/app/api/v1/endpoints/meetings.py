"""
会议API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.schemas import (
    MeetingCreate, MeetingUpdate, MeetingResponse, MeetingDetailResponse,
    AttendanceUpdate, AttendanceResponse, MessageResponse
)
from app.services.meeting_service import MeetingService
from app.models import User, MeetingType, AttendanceStatus

router = APIRouter()


@router.post("/", response_model=MeetingResponse)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建会议/事件"""
    meeting_service = MeetingService(db)
    
    try:
        meeting = meeting_service.create_meeting(meeting_data, current_user.id)
        return meeting
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建会议失败: {str(e)}"
        )


@router.get("/", response_model=List[Dict[str, Any]])
async def get_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    meeting_type: Optional[MeetingType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取会议列表（包括重复会议的所有实例）
    
    对于重复会议，会自动生成所有在日期范围内的实例
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"获取会议列表请求: skip={skip}, limit={limit}, start_date={start_date}, end_date={end_date}, meeting_type={meeting_type}")
        
        meeting_service = MeetingService(db)
        meetings = meeting_service.get_meetings_with_instances(
            skip=skip,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
            meeting_type=meeting_type,
            current_user_id=current_user.id  # 传递当前用户ID，用于获取出席状态
        )
        
        logger.info(f"成功返回 {len(meetings)} 个会议实例")
        
        # 确保返回的是列表
        if not isinstance(meetings, list):
            logger.error(f"返回的数据不是列表类型: {type(meetings)}")
            return []
        
        return meetings
    except Exception as e:
        logger.error(f"获取会议列表失败: {str(e)}", exc_info=True)
        # 返回空列表而不是抛出异常，避免前端错误
        return []


@router.get("/my-meetings", response_model=List[Dict[str, Any]])
async def get_my_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    获取我的会议（创建的或需要参加的），包括重复会议的所有实例
    
    对于重复会议，会自动生成所有在日期范围内的实例
    """
    meeting_service = MeetingService(db)
    meetings = meeting_service.get_user_meetings_with_instances(
        current_user.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date
    )
    return meetings


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取会议详情"""
    meeting_service = MeetingService(db)
    meeting = meeting_service.get_meeting_by_id(meeting_id)
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会议不存在"
        )
    
    # 获取出席记录
    attendances = meeting_service.get_meeting_attendances(meeting_id)
    
    # 转换为响应格式
    attendance_responses = []
    for att in attendances:
        user = db.query(User).filter(User.id == att.user_id).first()
        attendance_responses.append(AttendanceResponse(
            id=att.id,
            meeting_id=att.meeting_id,
            user_id=att.user_id,
            user_name=user.name if user else None,
            user_avatar=user.avatar if user else None,
            instance_date=att.instance_date,
            status=att.status,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at
        ))
    
    return MeetingDetailResponse(
        **meeting.__dict__,
        attendances=attendance_responses
    )


@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: int,
    meeting_data: MeetingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新会议"""
    meeting_service = MeetingService(db)
    
    meeting = meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会议不存在"
        )
    
    # 检查权限（只有创建者可以更新）
    if meeting.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限更新此会议"
        )
    
    try:
        updated_meeting = meeting_service.update_meeting(meeting_id, meeting_data)
        return updated_meeting
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"更新会议失败: {str(e)}"
        )


@router.delete("/{meeting_id}", response_model=MessageResponse)
async def delete_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除会议"""
    meeting_service = MeetingService(db)
    
    meeting = meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会议不存在"
        )
    
    # 检查权限（只有创建者可以删除）
    if meeting.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此会议"
        )
    
    success = meeting_service.delete_meeting(meeting_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除会议失败"
        )
    
    return MessageResponse(message="会议删除成功")


@router.post("/{meeting_id}/attendance", response_model=AttendanceResponse)
async def create_or_update_attendance(
    meeting_id: int,
    attendance_data: AttendanceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """创建或更新出席状态"""
    meeting_service = MeetingService(db)
    
    meeting = meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会议不存在"
        )
    
    try:
        attendance = meeting_service.update_attendance(
            meeting_id,
            current_user.id,
            attendance_data
        )
        
        # 获取用户信息
        user = db.query(User).filter(User.id == current_user.id).first()
        
        return AttendanceResponse(
            id=attendance.id,
            meeting_id=attendance.meeting_id,
            user_id=attendance.user_id,
            user_name=user.name if user else None,
            user_avatar=user.avatar if user else None,
            instance_date=attendance.instance_date,
            status=attendance.status,
            notes=attendance.notes,
            created_at=attendance.created_at,
            updated_at=attendance.updated_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"更新出席状态失败: {str(e)}"
        )


@router.get("/{meeting_id}/attendance", response_model=List[AttendanceResponse])
async def get_meeting_attendances(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取会议的出席记录"""
    meeting_service = MeetingService(db)
    
    meeting = meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会议不存在"
        )
    
    attendances = meeting_service.get_meeting_attendances(meeting_id)
    
    # 转换为响应格式
    attendance_responses = []
    for att in attendances:
        user = db.query(User).filter(User.id == att.user_id).first()
        attendance_responses.append(AttendanceResponse(
            id=att.id,
            meeting_id=att.meeting_id,
            user_id=att.user_id,
            user_name=user.name if user else None,
            user_avatar=user.avatar if user else None,
            instance_date=att.instance_date,
            status=att.status,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at
        ))
    
    return attendance_responses


@router.get("/user/attendances", response_model=List[AttendanceResponse])
async def get_my_attendances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取我的出席记录"""
    meeting_service = MeetingService(db)
    attendances = meeting_service.get_user_attendances(
        current_user.id,
        skip=skip,
        limit=limit
    )
    
    # 转换为响应格式
    attendance_responses = []
    for att in attendances:
        user = db.query(User).filter(User.id == att.user_id).first()
        attendance_responses.append(AttendanceResponse(
            id=att.id,
            meeting_id=att.meeting_id,
            user_id=att.user_id,
            user_name=user.name if user else None,
            user_avatar=user.avatar if user else None,
            instance_date=att.instance_date,
            status=att.status,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at
        ))
    
    return attendance_responses


@router.get("/date/{date}/attendances", response_model=List[dict])
async def get_attendances_by_date(
    date: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """根据日期获取该日期的所有例会及其出勤列表
    返回格式: id + 是否可以出席
    """
    meeting_service = MeetingService(db)
    
    try:
        # 解析日期
        from datetime import datetime, date as date_type
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        # 获取该日期的所有会议
        meetings = meeting_service.get_meetings(
            skip=0,
            limit=1000,
            start_date=start_datetime,
            end_date=end_datetime
        )
        
        result = []
        for meeting in meetings:
            # 获取该会议的所有出席记录
            attendances = meeting_service.get_meeting_attendances(meeting.id)
            
            # 构建出勤列表：id + 是否可以出席
            attendance_list = []
            for att in attendances:
                user = db.query(User).filter(User.id == att.user_id).first()
                if user:
                    # 是否可以出席：confirmed = True, absent/pending = False
                    can_attend = att.status == AttendanceStatus.CONFIRMED
                    attendance_list.append({
                        "id": user.id,
                        "can_attend": can_attend,
                        "status": att.status.value if hasattr(att.status, 'value') else str(att.status),
                        "user_name": user.name,
                        "user_avatar": user.avatar
                    })
            
            result.append({
                "meeting_id": meeting.id,
                "meeting_title": meeting.title,
                "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                "attendances": attendance_list
            })
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"日期格式错误，请使用 YYYY-MM-DD 格式: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取出勤列表失败: {str(e)}"
        )

