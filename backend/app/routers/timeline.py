from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import TimelineEvent, AuditLog, User
from app.schemas import (
    TimelineEventCreate, TimelineEventUpdate, TimelineEventOut,
    AuditLogCreate, AuditLogOut, TimelineCombinedOut
)
from app.auth import get_current_user
from app.routers.rooms import check_room_membership

router = APIRouter(prefix="/api/rooms/{room_id}/timeline", tags=["timeline"])

@router.get("", response_model=TimelineCombinedOut)
async def get_timeline_and_history(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    # 1. Fetch upcoming / roadmap events
    events_res = await db.execute(
        select(TimelineEvent)
        .options(selectinload(TimelineEvent.owner))
        .where(TimelineEvent.room_id == room_id)
        .order_by(TimelineEvent.target_time.asc())
    )
    events = events_res.scalars().all()

    # 2. Fetch past retrospective changelog / audit logs
    history_res = await db.execute(
        select(AuditLog)
        .where(AuditLog.room_id == room_id)
        .order_by(AuditLog.timestamp.desc())
        .limit(100)
    )
    history = history_res.scalars().all()

    return TimelineCombinedOut(events=events, history=history)

@router.post("/events", response_model=TimelineEventOut, status_code=status.HTTP_201_CREATED)
async def create_timeline_event(
    room_id: int,
    event_in: TimelineEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_event = TimelineEvent(
        room_id=room_id,
        event_name=event_in.event_name,
        target_time=event_in.target_time,
        status=event_in.status or "pending",
        owner_id=event_in.owner_id or current_user.id
    )
    db.add(new_event)
    await db.flush()

    audit = AuditLog(
        room_id=room_id,
        action_type="milestone_scheduled",
        description=f"⏳ Milestone scheduled: '{new_event.event_name}' by {current_user.name}.",
        metadata_json={"target_time": str(new_event.target_time), "event_name": new_event.event_name}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_event)

    res = await db.execute(
        select(TimelineEvent).options(selectinload(TimelineEvent.owner)).where(TimelineEvent.id == new_event.id)
    )
    return res.scalars().first()

@router.patch("/events/{event_id}/status", response_model=TimelineEventOut)
async def update_timeline_event_status(
    room_id: int,
    event_id: int,
    status_in: TimelineEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(TimelineEvent).where(TimelineEvent.id == event_id, TimelineEvent.room_id == room_id)
    )
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")

    old_status = event.status
    if status_in.status:
        event.status = status_in.status

    if status_in.event_name is not None:
        event.event_name = status_in.event_name
    if status_in.target_time is not None:
        event.target_time = status_in.target_time
    if status_in.owner_id is not None:
        event.owner_id = status_in.owner_id

    # If completed or missed, write audit log
    if status_in.status and status_in.status != old_status:
        if event.status == "completed":
            audit = AuditLog(
                room_id=room_id,
                action_type="milestone_reached",
                description=f"✅ MILESTONE REACHED: '{event.event_name}' marked completed by {current_user.name}!",
                metadata_json={"event_id": event.id, "event_name": event.event_name}
            )
            db.add(audit)
        elif event.status == "missed":
            audit = AuditLog(
                room_id=room_id,
                action_type="milestone_missed",
                description=f"⚠️ Milestone missed: '{event.event_name}'.",
                metadata_json={"event_id": event.id, "event_name": event.event_name}
            )
            db.add(audit)

    await db.commit()
    await db.refresh(event)

    res = await db.execute(
        select(TimelineEvent).options(selectinload(TimelineEvent.owner)).where(TimelineEvent.id == event.id)
    )
    return res.scalars().first()

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline_event(
    room_id: int,
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(TimelineEvent).where(TimelineEvent.id == event_id, TimelineEvent.room_id == room_id)
    )
    event = result.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")

    await db.delete(event)
    await db.commit()
    return None

@router.post("/retrospective", response_model=AuditLogOut, status_code=status.HTTP_201_CREATED)
async def add_retrospective_log(
    room_id: int,
    log_in: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_log = AuditLog(
        room_id=room_id,
        action_type=log_in.action_type or "manual_retro",
        description=f"📝 [{current_user.name}]: {log_in.description}",
        metadata_json=log_in.metadata_json or {"author": current_user.name, "role": current_user.role_title}
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log
