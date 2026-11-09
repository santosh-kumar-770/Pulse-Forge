from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Task, User, AuditLog
from app.schemas import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskOut
from app.auth import get_current_user
from app.routers.rooms import check_room_membership

router = APIRouter(prefix="/api/rooms/{room_id}/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskOut])
async def list_tasks(
    room_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)
    query = (
        select(Task)
        .options(selectinload(Task.assigned_user))
        .where(Task.room_id == room_id)
    )

    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority_filter:
        query = query.where(Task.priority == priority_filter)
    if search:
        query = query.where(Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%"))

    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    room_id: int,
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_task = Task(
        room_id=room_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status or "backlog",
        priority=task_in.priority or "medium",
        assigned_to=task_in.assigned_to,
        due_date=task_in.due_date
    )
    db.add(new_task)
    await db.flush()

    # Log to retrospective audit log
    audit = AuditLog(
        room_id=room_id,
        action_type="task_created",
        description=f"{current_user.name} added task '{new_task.title}' [{new_task.priority.upper()}].",
        metadata_json={
            "task_id": new_task.id,
            "title": new_task.title,
            "priority": new_task.priority,
            "author": current_user.name
        }
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_task)

    res = await db.execute(
        select(Task).options(selectinload(Task.assigned_user)).where(Task.id == new_task.id)
    )
    return res.scalars().first()

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    room_id: int,
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(select(Task).where(Task.id == task_id, Task.room_id == room_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.status is not None:
        task.status = task_in.status
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.assigned_to is not None:
        task.assigned_to = task_in.assigned_to
    if task_in.due_date is not None:
        task.due_date = task_in.due_date

    # If status changed to 'done'
    if task_in.status and task_in.status != old_status:
        action = "task_completed" if task.status == "done" else "task_status_changed"
        desc = (f"🎯 {current_user.name} marked task '{task.title}' as COMPLETED!"
                if task.status == "done"
                else f"{current_user.name} moved task '{task.title}' to {task.status.replace('_', ' ').title()}")
        audit = AuditLog(
            room_id=room_id,
            action_type=action,
            description=desc,
            metadata_json={"task_id": task.id, "from": old_status, "to": task.status}
        )
        db.add(audit)

    await db.commit()
    await db.refresh(task)

    res = await db.execute(
        select(Task).options(selectinload(Task.assigned_user)).where(Task.id == task.id)
    )
    return res.scalars().first()

@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(
    room_id: int,
    task_id: int,
    status_in: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(select(Task).where(Task.id == task_id, Task.room_id == room_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task.status = status_in.status

    action = "task_completed" if task.status == "done" else "task_status_changed"
    desc = (f"🎯 {current_user.name} marked task '{task.title}' as COMPLETED!"
            if task.status == "done"
            else f"{current_user.name} moved '{task.title}' from {old_status} to {task.status}")

    audit = AuditLog(
        room_id=room_id,
        action_type=action,
        description=desc,
        metadata_json={"task_id": task.id, "from": old_status, "to": task.status, "user": current_user.name}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(task)

    res = await db.execute(
        select(Task).options(selectinload(Task.assigned_user)).where(Task.id == task.id)
    )
    return res.scalars().first()

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    room_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(select(Task).where(Task.id == task_id, Task.room_id == room_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    audit = AuditLog(
        room_id=room_id,
        action_type="task_deleted",
        description=f"{current_user.name} removed task '{task.title}'.",
        metadata_json={"task_id": task.id, "title": task.title}
    )
    db.add(audit)

    await db.delete(task)
    await db.commit()
    return None
