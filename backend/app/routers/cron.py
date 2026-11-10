from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Task, User, Room
from app.config import settings
from app.services.email import send_deadline_alert_email, send_overdue_checkin_email

router = APIRouter(prefix="/api/cron", tags=["cron"])

def verify_cron_auth(request: Request):
    expected_secret = (settings.CRON_SECRET or "").strip()
    if not expected_secret:
        return True

    auth_header = request.headers.get("Authorization") or ""
    cron_header = request.headers.get("x-cron-secret") or ""
    query_secret = request.query_params.get("secret") or ""

    bearer_token = auth_header.replace("Bearer ", "").strip() if "Bearer " in auth_header else ""

    if (
        bearer_token == expected_secret or
        cron_header == expected_secret or
        query_secret == expected_secret
    ):
        return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized cron invocation. Invalid or missing CRON_SECRET."
    )

@router.get("/check-deadlines")
@router.post("/check-deadlines")
async def check_deadlines(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    verify_cron_auth(request)
    now = datetime.now(timezone.utc)

    # 1. Near-Deadline Check (Tasks due within next 2 hours that haven't been alerted)
    two_hours_ahead = now + timedelta(hours=2)
    near_query = (
        select(Task)
        .options(selectinload(Task.assigned_user), selectinload(Task.room))
        .where(
            Task.status != "done",
            Task.assigned_to.is_not(None),
            Task.due_date.is_not(None),
            Task.due_date <= two_hours_ahead,
            Task.due_date >= now - timedelta(hours=1),
            Task.deadline_warning_sent == False
        )
    )
    near_res = await db.execute(near_query)
    near_tasks = near_res.scalars().all()

    near_notified = 0
    for task in near_tasks:
        if task.assigned_user and task.assigned_user.email:
            room_name = task.room.name if task.room else "War Room"
            send_deadline_alert_email(
                to_email=task.assigned_user.email,
                user_name=task.assigned_user.name,
                task_title=task.title,
                room_name=room_name,
                status=task.status,
                due_date=task.due_date
            )
            near_notified += 1
        task.deadline_warning_sent = True

    # 2. Overdue Check (Tasks past due date that haven't received an overdue notice)
    overdue_query = (
        select(Task)
        .options(selectinload(Task.assigned_user), selectinload(Task.room))
        .where(
            Task.status != "done",
            Task.assigned_to.is_not(None),
            Task.due_date.is_not(None),
            Task.due_date < now,
            Task.overdue_notice_sent == False
        )
    )
    overdue_res = await db.execute(overdue_query)
    overdue_tasks = overdue_res.scalars().all()

    overdue_notified = 0
    for task in overdue_tasks:
        if task.assigned_user and task.assigned_user.email:
            room_name = task.room.name if task.room else "War Room"
            send_overdue_checkin_email(
                to_email=task.assigned_user.email,
                user_name=task.assigned_user.name,
                task_title=task.title,
                room_name=room_name,
                due_date=task.due_date
            )
            overdue_notified += 1
        task.overdue_notice_sent = True

    await db.commit()

    return {
        "status": "success",
        "message": "Deadline check execution completed.",
        "near_deadline_tasks_found": len(near_tasks),
        "near_deadline_notices_sent": near_notified,
        "overdue_tasks_found": len(overdue_tasks),
        "overdue_notices_sent": overdue_notified,
        "executed_at": now.isoformat()
    }
