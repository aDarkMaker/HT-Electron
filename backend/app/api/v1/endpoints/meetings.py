"""
会议API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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


@router.get("/", response_model=List[MeetingResponse])
async def get_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    meeting_type: Optional[MeetingType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取会议列表"""
    meeting_service = MeetingService(db)
    meetings = meeting_service.get_meetings(
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        meeting_type=meeting_type
    )
    return meetings


@router.get("/my-meetings", response_model=List[MeetingResponse])
async def get_my_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取我的会议（创建的或需要参加的）"""
    meeting_service = MeetingService(db)
    meetings = meeting_service.get_user_meetings(
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
            status=att.status,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at
        ))
    
    return attendance_responses

