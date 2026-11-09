import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database import get_db
from app.models import Room, RoomMember, User, AuditLog
from app.schemas import RoomCreate, RoomUpdate, RoomOut, RoomDetailOut, RoomMemberOut, AddMemberRequest
from app.auth import get_current_user

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'[^a-z0-9-]', '', s)
    return s[:40] or "room"

async def check_room_membership(room_id: int, user_id: int, db: AsyncSession, allowed_roles=None) -> RoomMember:
    result = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
    )
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this workspace room.")
    if allowed_roles and member.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Action requires one of roles: {allowed_roles}")
    return member

@router.get("", response_model=List[RoomOut])
async def list_my_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(Room, RoomMember.role)
        .join(RoomMember, Room.id == RoomMember.room_id)
        .where(RoomMember.user_id == current_user.id)
        .order_by(Room.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    rooms_out = []
    for room, role in rows:
        # count members
        count_res = await db.execute(
            select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
        )
        member_count = count_res.scalar_one()

        item = RoomOut(
            id=room.id,
            name=room.name,
            slug=room.slug,
            mission_statement=room.mission_statement,
            created_by=room.created_by,
            created_at=room.created_at,
            my_role=role,
            member_count=member_count
        )
        rooms_out.append(item)
    return rooms_out

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_in: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    base_slug = room_in.slug if room_in.slug else slugify(room_in.name)
    slug = base_slug
    suffix = 1
    while True:
        existing = await db.execute(select(Room).where(Room.slug == slug))
        if not existing.scalars().first():
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    new_room = Room(
        name=room_in.name,
        slug=slug,
        mission_statement=room_in.mission_statement,
        created_by=current_user.id
    )
    db.add(new_room)
    await db.flush()

    # Add owner membership
    membership = RoomMember(
        room_id=new_room.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(membership)

    # Add initial audit log
    audit = AuditLog(
        room_id=new_room.id,
        action_type="room_created",
        description=f"{current_user.name} created war room '{new_room.name}'.",
        metadata_json={"created_by": current_user.name, "slug": slug}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_room)

    return RoomOut(
        id=new_room.id,
        name=new_room.name,
        slug=new_room.slug,
        mission_statement=new_room.mission_statement,
        created_by=new_room.created_by,
        created_at=new_room.created_at,
        my_role="owner",
        member_count=1
    )

@router.get("/{room_id}", response_model=RoomDetailOut)
async def get_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await check_room_membership(room_id, current_user.id, db)
    result = await db.execute(
        select(Room)
        .options(selectinload(Room.members).selectinload(RoomMember.user))
        .where(Room.id == room_id)
    )
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    members_out = [
        RoomMemberOut(
            id=m.id,
            room_id=m.room_id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            user=m.user
        )
        for m in room.members
    ]

    return RoomDetailOut(
        id=room.id,
        name=room.name,
        slug=room.slug,
        mission_statement=room.mission_statement,
        created_by=room.created_by,
        created_at=room.created_at,
        my_role=member.role,
        member_count=len(members_out),
        members=members_out
    )

@router.put("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: int,
    room_in: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await check_room_membership(room_id, current_user.id, db, allowed_roles=["owner", "admin"])
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room_in.name is not None:
        room.name = room_in.name
    if room_in.mission_statement is not None:
        room.mission_statement = room_in.mission_statement

    audit = AuditLog(
        room_id=room.id,
        action_type="room_updated",
        description=f"{current_user.name} updated the war room details.",
        metadata_json={"updated_by": current_user.name}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(room)

    count_res = await db.execute(
        select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
    )
    member_count = count_res.scalar_one()

    return RoomOut(
        id=room.id,
        name=room.name,
        slug=room.slug,
        mission_statement=room.mission_statement,
        created_by=room.created_by,
        created_at=room.created_at,
        my_role=member.role,
        member_count=member_count
    )

@router.get("/{room_id}/members", response_model=List[RoomMemberOut])
async def list_room_members(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)
    result = await db.execute(
        select(RoomMember)
        .options(selectinload(RoomMember.user))
        .where(RoomMember.room_id == room_id)
        .order_by(RoomMember.joined_at.asc())
    )
    return result.scalars().all()

@router.post("/{room_id}/members", response_model=RoomMemberOut)
async def add_room_member(
    room_id: int,
    member_in: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db, allowed_roles=["owner", "admin"])

    # Find user by email
    user_res = await db.execute(select(User).where(User.email == member_in.email.lower()))
    target_user = user_res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email '{member_in.email}'.")

    # Check if already member
    existing_res = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == target_user.id)
    )
    if existing_res.scalars().first():
        raise HTTPException(status_code=400, detail="User is already a member of this room.")

    new_member = RoomMember(
        room_id=room_id,
        user_id=target_user.id,
        role=member_in.role if member_in.role in ["admin", "member"] else "member"
    )
    db.add(new_member)

    audit = AuditLog(
        room_id=room_id,
        action_type="member_joined",
        description=f"{target_user.name} joined the room as {new_member.role} (added by {current_user.name}).",
        metadata_json={"user_name": target_user.name, "role": new_member.role}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_member)

    # Load user
    res = await db.execute(
        select(RoomMember).options(selectinload(RoomMember.user)).where(RoomMember.id == new_member.id)
    )
    return res.scalars().first()

@router.post("/join/{slug}", response_model=RoomOut)
async def join_room_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Room).where(Room.slug == slug))
    room = res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Workspace room not found with this code/slug.")

    mem_res = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room.id, RoomMember.user_id == current_user.id)
    )
    existing = mem_res.scalars().first()
    if not existing:
        new_member = RoomMember(
            room_id=room.id,
            user_id=current_user.id,
            role="member"
        )
        db.add(new_member)
        audit = AuditLog(
            room_id=room.id,
            action_type="member_joined",
            description=f"{current_user.name} joined via room code '{slug}'.",
            metadata_json={"user_name": current_user.name}
        )
        db.add(audit)
        await db.commit()
        role = "member"
    else:
        role = existing.role

    count_res = await db.execute(
        select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
    )
    member_count = count_res.scalar_one()

    return RoomOut(
        id=room.id,
        name=room.name,
        slug=room.slug,
        mission_statement=room.mission_statement,
        created_by=room.created_by,
        created_at=room.created_at,
        my_role=role,
        member_count=member_count
    )
