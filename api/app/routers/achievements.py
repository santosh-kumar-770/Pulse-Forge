from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Achievement, User, AuditLog
from app.schemas import AchievementCreate, AchievementUpdate, AchievementOut
from app.auth import get_current_user
from app.routers.rooms import check_room_membership

router = APIRouter(prefix="/api/rooms/{room_id}/achievements", tags=["achievements"])

@router.get("", response_model=List[AchievementOut])
async def list_achievements(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)
    result = await db.execute(
        select(Achievement)
        .options(selectinload(Achievement.celebrator))
        .where(Achievement.room_id == room_id)
        .order_by(Achievement.is_starred.desc(), Achievement.achieved_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=AchievementOut, status_code=status.HTTP_201_CREATED)
async def create_achievement(
    room_id: int,
    ach_in: AchievementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_ach = Achievement(
        room_id=room_id,
        title=ach_in.title,
        impact_note=ach_in.impact_note,
        is_starred=ach_in.is_starred,
        achieved_at=ach_in.achieved_at,
        celebrated_by=current_user.id
    )
    db.add(new_ach)
    await db.flush()

    audit = AuditLog(
        room_id=room_id,
        action_type="achievement_unlocked",
        description=f"🏆 TROPHY UNLOCKED: '{new_ach.title}' celebrated by {current_user.name}! {new_ach.impact_note or ''}",
        metadata_json={
            "achievement_id": new_ach.id,
            "title": new_ach.title,
            "impact": new_ach.impact_note,
            "celebrated_by": current_user.name
        }
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_ach)

    res = await db.execute(
        select(Achievement).options(selectinload(Achievement.celebrator)).where(Achievement.id == new_ach.id)
    )
    return res.scalars().first()

@router.patch("/{achievement_id}/star", response_model=AchievementOut)
async def toggle_star_achievement(
    room_id: int,
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(Achievement).where(Achievement.id == achievement_id, Achievement.room_id == room_id)
    )
    ach = result.scalars().first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    ach.is_starred = not ach.is_starred
    await db.commit()
    await db.refresh(ach)

    res = await db.execute(
        select(Achievement).options(selectinload(Achievement.celebrator)).where(Achievement.id == ach.id)
    )
    return res.scalars().first()

@router.put("/{achievement_id}", response_model=AchievementOut)
async def update_achievement(
    room_id: int,
    achievement_id: int,
    ach_in: AchievementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(Achievement).where(Achievement.id == achievement_id, Achievement.room_id == room_id)
    )
    ach = result.scalars().first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    if ach_in.title is not None:
        ach.title = ach_in.title
    if ach_in.impact_note is not None:
        ach.impact_note = ach_in.impact_note
    if ach_in.is_starred is not None:
        ach.is_starred = ach_in.is_starred

    await db.commit()
    await db.refresh(ach)

    res = await db.execute(
        select(Achievement).options(selectinload(Achievement.celebrator)).where(Achievement.id == ach.id)
    )
    return res.scalars().first()

@router.delete("/{achievement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_achievement(
    room_id: int,
    achievement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(Achievement).where(Achievement.id == achievement_id, Achievement.room_id == room_id)
    )
    ach = result.scalars().first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    await db.delete(ach)
    await db.commit()
    return None
