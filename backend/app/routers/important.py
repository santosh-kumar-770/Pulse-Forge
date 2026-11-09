from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import ImportantNote, User, AuditLog
from app.schemas import ImportantNoteCreate, ImportantNoteUpdate, ImportantNoteOut
from app.auth import get_current_user
from app.routers.rooms import check_room_membership

router = APIRouter(prefix="/api/rooms/{room_id}/important", tags=["important"])

@router.get("", response_model=List[ImportantNoteOut])
async def list_important_notes(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)
    result = await db.execute(
        select(ImportantNote)
        .options(selectinload(ImportantNote.creator))
        .where(ImportantNote.room_id == room_id)
        .order_by(ImportantNote.is_pinned.desc(), ImportantNote.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=ImportantNoteOut, status_code=status.HTTP_201_CREATED)
async def create_important_note(
    room_id: int,
    note_in: ImportantNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_note = ImportantNote(
        room_id=room_id,
        title=note_in.title,
        content_type=note_in.content_type,
        content=note_in.content,
        is_pinned=note_in.is_pinned,
        created_by=current_user.id
    )
    db.add(new_note)
    await db.flush()

    audit = AuditLog(
        room_id=room_id,
        action_type="note_pinned",
        description=f"📌 {current_user.name} pinned '{new_note.title}' ({new_note.content_type}).",
        metadata_json={"title": new_note.title, "type": new_note.content_type}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_note)

    res = await db.execute(
        select(ImportantNote).options(selectinload(ImportantNote.creator)).where(ImportantNote.id == new_note.id)
    )
    return res.scalars().first()

@router.put("/{note_id}", response_model=ImportantNoteOut)
async def update_important_note(
    room_id: int,
    note_id: int,
    note_in: ImportantNoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(ImportantNote).where(ImportantNote.id == note_id, ImportantNote.room_id == room_id)
    )
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Pinned note not found")

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content_type is not None:
        note.content_type = note_in.content_type
    if note_in.content is not None:
        note.content = note_in.content
    if note_in.is_pinned is not None:
        note.is_pinned = note_in.is_pinned

    await db.commit()
    await db.refresh(note)

    res = await db.execute(
        select(ImportantNote).options(selectinload(ImportantNote.creator)).where(ImportantNote.id == note.id)
    )
    return res.scalars().first()

@router.patch("/{note_id}/pin", response_model=ImportantNoteOut)
async def toggle_pin_note(
    room_id: int,
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(ImportantNote).where(ImportantNote.id == note_id, ImportantNote.room_id == room_id)
    )
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Pinned note not found")

    note.is_pinned = not note.is_pinned
    await db.commit()
    await db.refresh(note)

    res = await db.execute(
        select(ImportantNote).options(selectinload(ImportantNote.creator)).where(ImportantNote.id == note.id)
    )
    return res.scalars().first()

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_important_note(
    room_id: int,
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(ImportantNote).where(ImportantNote.id == note_id, ImportantNote.room_id == room_id)
    )
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Pinned note not found")

    await db.delete(note)
    await db.commit()
    return None
