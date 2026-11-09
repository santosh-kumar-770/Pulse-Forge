import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.database import get_db
from app.models import Room, RoomMember, User, AuditLog, RoomJoinRequest
from app.schemas import (
    RoomCreate, RoomUpdate, RoomSettingsUpdate, RoomOut, RoomDetailOut,
    RoomMemberOut, AddMemberRequest, JoinRequestCreate, JoinRequestReview,
    JoinRequestOut, PublicRoomDiscoveryOut
)
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active member of this workspace room."
        )
    if allowed_roles and member.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action requires one of roles: {allowed_roles}"
        )
    return member


# ----------------- My Rooms -----------------
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
        count_res = await db.execute(
            select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
        )
        member_count = count_res.scalar_one()

        pending_count = 0
        if role in ["owner", "admin"]:
            req_res = await db.execute(
                select(func.count(RoomJoinRequest.id)).where(
                    RoomJoinRequest.room_id == room.id,
                    RoomJoinRequest.status == "pending"
                )
            )
            pending_count = req_res.scalar_one()

        item = RoomOut(
            id=room.id,
            name=room.name,
            slug=room.slug,
            mission_statement=room.mission_statement,
            is_private=getattr(room, 'is_private', False),
            requires_approval=getattr(room, 'requires_approval', True),
            created_by=room.created_by,
            created_at=room.created_at,
            my_role=role,
            member_count=member_count,
            pending_request_count=pending_count
        )
        rooms_out.append(item)
    return rooms_out


# ----------------- Discovery: Public Rooms -----------------
@router.get("/discover", response_model=List[PublicRoomDiscoveryOut])
async def discover_public_rooms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all public rooms
    query = (
        select(Room)
        .where(Room.is_private == False)
        .order_by(Room.created_at.desc())
    )
    result = await db.execute(query)
    rooms = result.scalars().all()

    # Get user memberships
    my_mems = await db.execute(
        select(RoomMember.room_id).where(RoomMember.user_id == current_user.id)
    )
    my_member_room_ids = set(my_mems.scalars().all())

    # Get user pending join requests
    my_reqs = await db.execute(
        select(RoomJoinRequest.room_id, RoomJoinRequest.status)
        .where(RoomJoinRequest.user_id == current_user.id)
    )
    req_map = {r.room_id: r.status for r in my_reqs.all()}

    output = []
    for room in rooms:
        count_res = await db.execute(
            select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
        )
        member_count = count_res.scalar_one()

        # Fetch owner
        owner_res = await db.execute(select(User).where(User.id == room.created_by))
        owner = owner_res.scalars().first()

        status_str = "none"
        if room.id in my_member_room_ids:
            status_str = "member"
        elif room.id in req_map:
            status_str = req_map[room.id]

        output.append(PublicRoomDiscoveryOut(
            id=room.id,
            name=room.name,
            slug=room.slug,
            mission_statement=room.mission_statement,
            is_private=room.is_private,
            requires_approval=room.requires_approval,
            created_by=room.created_by,
            created_at=room.created_at,
            member_count=member_count,
            owner_name=owner.name if owner else "Unknown",
            owner_avatar=owner.avatar_url if owner else None,
            my_status=status_str
        ))

    return output


# ----------------- Create Room -----------------
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
        is_private=room_in.is_private,
        requires_approval=room_in.requires_approval,
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

    audit = AuditLog(
        room_id=new_room.id,
        action_type="room_created",
        description=f"{current_user.name} created war room '{new_room.name}'.",
        metadata_json={
            "created_by": current_user.name,
            "slug": slug,
            "is_private": new_room.is_private,
            "requires_approval": new_room.requires_approval
        }
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_room)

    return RoomOut(
        id=new_room.id,
        name=new_room.name,
        slug=new_room.slug,
        mission_statement=new_room.mission_statement,
        is_private=new_room.is_private,
        requires_approval=new_room.requires_approval,
        created_by=new_room.created_by,
        created_at=new_room.created_at,
        my_role="owner",
        member_count=1,
        pending_request_count=0
    )


# ----------------- Get Room Details -----------------
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

    pending_reqs_out = []
    if member.role in ["owner", "admin"]:
        reqs_res = await db.execute(
            select(RoomJoinRequest)
            .options(selectinload(RoomJoinRequest.user))
            .where(RoomJoinRequest.room_id == room_id, RoomJoinRequest.status == "pending")
            .order_by(RoomJoinRequest.created_at.desc())
        )
        pending_reqs = reqs_res.scalars().all()
        pending_reqs_out = [
            JoinRequestOut(
                id=r.id,
                room_id=r.room_id,
                user_id=r.user_id,
                status=r.status,
                message=r.message,
                created_at=r.created_at,
                user=r.user
            )
            for r in pending_reqs
        ]

    return RoomDetailOut(
        id=room.id,
        name=room.name,
        slug=room.slug,
        mission_statement=room.mission_statement,
        is_private=room.is_private,
        requires_approval=room.requires_approval,
        created_by=room.created_by,
        created_at=room.created_at,
        my_role=member.role,
        member_count=len(members_out),
        pending_request_count=len(pending_reqs_out),
        members=members_out,
        pending_requests=pending_reqs_out
    )


# ----------------- Update Room / Settings -----------------
@router.put("/{room_id}", response_model=RoomOut)
@router.patch("/{room_id}/settings", response_model=RoomOut)
async def update_room_settings(
    room_id: int,
    settings_in: RoomSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await check_room_membership(room_id, current_user.id, db, allowed_roles=["owner", "admin"])
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    changes = []
    if settings_in.name is not None and settings_in.name != room.name:
        room.name = settings_in.name
        changes.append("name")
    if settings_in.mission_statement is not None and settings_in.mission_statement != room.mission_statement:
        room.mission_statement = settings_in.mission_statement
        changes.append("mission statement")
    if settings_in.is_private is not None and settings_in.is_private != room.is_private:
        room.is_private = settings_in.is_private
        changes.append(f"visibility to {'private' if room.is_private else 'public'}")
    if settings_in.requires_approval is not None and settings_in.requires_approval != room.requires_approval:
        room.requires_approval = settings_in.requires_approval
        changes.append(f"approval requirement to {'enabled' if room.requires_approval else 'disabled'}")

    if changes:
        audit = AuditLog(
            room_id=room.id,
            action_type="room_settings_updated",
            description=f"{current_user.name} updated {', '.join(changes)}.",
            metadata_json={"updated_by": current_user.name, "changes": changes}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(room)

    count_res = await db.execute(
        select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
    )
    member_count = count_res.scalar_one()

    req_res = await db.execute(
        select(func.count(RoomJoinRequest.id)).where(
            RoomJoinRequest.room_id == room.id,
            RoomJoinRequest.status == "pending"
        )
    )
    pending_count = req_res.scalar_one()

    return RoomOut(
        id=room.id,
        name=room.name,
        slug=room.slug,
        mission_statement=room.mission_statement,
        is_private=room.is_private,
        requires_approval=room.requires_approval,
        created_by=room.created_by,
        created_at=room.created_at,
        my_role=member.role,
        member_count=member_count,
        pending_request_count=pending_count
    )


# ----------------- Join Requests & Review -----------------
@router.post("/{room_id}/join-request")
async def request_to_join_room(
    room_id: int,
    req_in: JoinRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Workspace room not found.")

    # Check if already a member
    mem_res = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id)
    )
    if mem_res.scalars().first():
        return {
            "status": "member",
            "room_id": room.id,
            "message": "You are already an active member of this room."
        }

    # If approval not required: join immediately!
    if not room.requires_approval:
        new_member = RoomMember(
            room_id=room.id,
            user_id=current_user.id,
            role="member"
        )
        db.add(new_member)
        audit = AuditLog(
            room_id=room.id,
            action_type="member_joined",
            description=f"{current_user.name} joined public war room '{room.name}'.",
            metadata_json={"user_name": current_user.name}
        )
        db.add(audit)
        await db.commit()
        return {
            "status": "joined",
            "room_id": room.id,
            "message": f"Welcome aboard! You have joined {room.name}."
        }

    # Check for existing pending request
    existing_req = await db.execute(
        select(RoomJoinRequest).where(
            RoomJoinRequest.room_id == room.id,
            RoomJoinRequest.user_id == current_user.id,
            RoomJoinRequest.status == "pending"
        )
    )
    if existing_req.scalars().first():
        return {
            "status": "pending",
            "room_id": room.id,
            "message": "Your join request is already pending host approval."
        }

    # Create new join request
    new_req = RoomJoinRequest(
        room_id=room.id,
        user_id=current_user.id,
        status="pending",
        message=req_in.message.strip() if req_in.message else None
    )
    db.add(new_req)

    audit = AuditLog(
        room_id=room.id,
        action_type="join_request_submitted",
        description=f"{current_user.name} requested to join the war room.",
        metadata_json={"candidate": current_user.name, "role_title": current_user.role_title}
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "pending",
        "room_id": room.id,
        "message": "Join request submitted successfully. Awaiting host review."
    }


@router.get("/{room_id}/join-requests", response_model=List[JoinRequestOut])
async def list_join_requests(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db, allowed_roles=["owner", "admin"])

    result = await db.execute(
        select(RoomJoinRequest)
        .options(selectinload(RoomJoinRequest.user))
        .where(RoomJoinRequest.room_id == room_id, RoomJoinRequest.status == "pending")
        .order_by(RoomJoinRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{room_id}/join-requests/{request_id}/review")
async def review_join_request(
    room_id: int,
    request_id: int,
    review_in: JoinRequestReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db, allowed_roles=["owner", "admin"])

    res = await db.execute(
        select(RoomJoinRequest)
        .options(selectinload(RoomJoinRequest.user))
        .where(RoomJoinRequest.id == request_id, RoomJoinRequest.room_id == room_id)
    )
    req = res.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Join request not found.")

    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    if review_in.action == "accept":
        req.status = "accepted"
        req.reviewed_at = now
        req.reviewed_by = current_user.id

        # Check if already a member
        mem_check = await db.execute(
            select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == req.user_id)
        )
        if not mem_check.scalars().first():
            new_member = RoomMember(
                room_id=room_id,
                user_id=req.user_id,
                role="member"
            )
            db.add(new_member)

        audit = AuditLog(
            room_id=room_id,
            action_type="join_request_accepted",
            description=f"{current_user.name} accepted {req.user.name}'s request to join.",
            metadata_json={"reviewer": current_user.name, "candidate": req.user.name}
        )
        db.add(audit)
        await db.commit()

        return {
            "status": "accepted",
            "message": f"{req.user.name} has been welcomed into the war room!"
        }

    else:  # reject
        req.status = "rejected"
        req.reviewed_at = now
        req.reviewed_by = current_user.id

        audit = AuditLog(
            room_id=room_id,
            action_type="join_request_rejected",
            description=f"{current_user.name} declined {req.user.name}'s request to join.",
            metadata_json={"reviewer": current_user.name, "candidate": req.user.name}
        )
        db.add(audit)
        await db.commit()

        return {
            "status": "rejected",
            "message": f"Join request from {req.user.name} has been declined."
        }


# ----------------- Check User Status for a Room -----------------
@router.get("/{room_id}/membership-status")
async def get_room_membership_status(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room_res = await db.execute(select(Room).where(Room.id == room_id))
    room = room_res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    mem_res = await db.execute(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id)
    )
    member = mem_res.scalars().first()

    req_res = await db.execute(
        select(RoomJoinRequest).where(
            RoomJoinRequest.room_id == room_id,
            RoomJoinRequest.user_id == current_user.id,
            RoomJoinRequest.status == "pending"
        )
    )
    pending_req = req_res.scalars().first()

    return {
        "room_id": room.id,
        "room_name": room.name,
        "is_private": room.is_private,
        "requires_approval": room.requires_approval,
        "is_member": member is not None,
        "role": member.role if member else None,
        "has_pending_request": pending_req is not None,
        "request_id": pending_req.id if pending_req else None
    }


# ----------------- Members List & Manual Add -----------------
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

    user_res = await db.execute(select(User).where(User.email == member_in.email.lower()))
    target_user = user_res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email '{member_in.email}'.")

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

    res = await db.execute(
        select(RoomMember).options(selectinload(RoomMember.user)).where(RoomMember.id == new_member.id)
    )
    return res.scalars().first()


# ----------------- Join via Invite Code / Slug -----------------
@router.post("/join/{slug}")
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
    if existing:
        return {
            "status": "member",
            "room_id": room.id,
            "message": "You are already a member of this room.",
            "room": {
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "mission_statement": room.mission_statement
            }
        }

    # If requires approval, submit a join request
    if room.requires_approval:
        # Check if already requested
        pending_check = await db.execute(
            select(RoomJoinRequest).where(
                RoomJoinRequest.room_id == room.id,
                RoomJoinRequest.user_id == current_user.id,
                RoomJoinRequest.status == "pending"
            )
        )
        if pending_check.scalars().first():
            return {
                "status": "pending",
                "room_id": room.id,
                "message": "This room requires host approval. Your request is currently pending.",
                "room": {"id": room.id, "name": room.name, "slug": room.slug}
            }

        new_req = RoomJoinRequest(
            room_id=room.id,
            user_id=current_user.id,
            status="pending",
            message="Joined via direct invite link/code."
        )
        db.add(new_req)
        await db.commit()
        return {
            "status": "pending",
            "room_id": room.id,
            "message": "This room requires host approval. Your request has been sent to the host.",
            "room": {"id": room.id, "name": room.name, "slug": room.slug}
        }

    # Direct join
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

    count_res = await db.execute(
        select(func.count(RoomMember.id)).where(RoomMember.room_id == room.id)
    )
    member_count = count_res.scalar_one()

    return {
        "status": "joined",
        "room_id": room.id,
        "message": f"Welcome! You have joined {room.name}.",
        "room": {
            "id": room.id,
            "name": room.name,
            "slug": room.slug,
            "mission_statement": room.mission_statement,
            "my_role": "member",
            "member_count": member_count
        }
    }
