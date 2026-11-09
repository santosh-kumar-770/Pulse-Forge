import json
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError

from app.database import get_db, AsyncSessionLocal
from app.models import Message, Room, RoomMember, User
from app.schemas import MessageCreate, MessageOut, MessagePinUpdate, UserOut
from app.auth import get_current_user
from app.config import settings
from app.routers.rooms import check_room_membership

router = APIRouter(tags=["messages"])

# ----------------- Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        # Maps room_id -> set of active WebSockets
        self.rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket):
        if room_id in self.rooms:
            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, room_id: int, payload: dict):
        if room_id not in self.rooms:
            return
        dead_connections = []
        msg_text = json.dumps(payload, default=str)
        for connection in list(self.rooms[room_id]):
            try:
                await connection.send_text(msg_text)
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(room_id, dead)

ws_manager = ConnectionManager()

# ----------------- REST Endpoints -----------------
@router.get("/api/rooms/{room_id}/messages", response_model=List[MessageOut])
async def list_messages(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
        .limit(150)
    )
    return result.scalars().all()


@router.post("/api/rooms/{room_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(
    room_id: int,
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    new_msg = Message(
        room_id=room_id,
        sender_id=current_user.id,
        content=msg_in.content.strip(),
        is_pinned=False
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    # Re-fetch with sender details
    res = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.id == new_msg.id)
    )
    msg_full = res.scalars().first()

    # Format for broadcast
    msg_dict = {
        "id": msg_full.id,
        "room_id": msg_full.room_id,
        "sender_id": msg_full.sender_id,
        "content": msg_full.content,
        "is_pinned": msg_full.is_pinned,
        "created_at": msg_full.created_at.isoformat() if msg_full.created_at else None,
        "sender": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role_title": current_user.role_title,
            "avatar_url": current_user.avatar_url,
            "skills": current_user.skills,
            "bio": current_user.bio,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        }
    }

    await ws_manager.broadcast(room_id, {
        "type": "new_message",
        "message": msg_dict
    })

    return msg_full


@router.patch("/api/rooms/{room_id}/messages/{message_id}/pin", response_model=MessageOut)
async def toggle_pin_message(
    room_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await check_room_membership(room_id, current_user.id, db)

    res = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.id == message_id, Message.room_id == room_id)
    )
    msg = res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found in this room.")

    msg.is_pinned = not msg.is_pinned
    await db.commit()
    await db.refresh(msg)

    msg_dict = {
        "id": msg.id,
        "room_id": msg.room_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "is_pinned": msg.is_pinned,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
        "sender": {
            "id": msg.sender.id,
            "name": msg.sender.name,
            "email": msg.sender.email,
            "role_title": msg.sender.role_title,
            "avatar_url": msg.sender.avatar_url
        } if msg.sender else None
    }

    await ws_manager.broadcast(room_id, {
        "type": "message_pinned",
        "message": msg_dict
    })

    return msg


@router.delete("/api/rooms/{room_id}/messages/{message_id}")
async def delete_message(
    room_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = await check_room_membership(room_id, current_user.id, db)

    res = await db.execute(
        select(Message).where(Message.id == message_id, Message.room_id == room_id)
    )
    msg = res.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    if msg.sender_id != current_user.id and member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="You can only delete your own messages unless you are a room owner/admin.")

    await db.delete(msg)
    await db.commit()

    await ws_manager.broadcast(room_id, {
        "type": "message_deleted",
        "message_id": message_id
    })

    return {"status": "deleted", "message_id": message_id}


# ----------------- WebSocket Endpoint -----------------
@router.websocket("/api/ws/rooms/{room_id}")
async def websocket_room_chat(
    websocket: WebSocket,
    room_id: int,
    token: Optional[str] = Query(None)
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify room membership
    async with AsyncSessionLocal() as db:
        mem_res = await db.execute(
            select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == user_id)
        )
        member = mem_res.scalars().first()
        if not member:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await ws_manager.connect(room_id, websocket)

    try:
        # Notify room that user connected
        await ws_manager.broadcast(room_id, {
            "type": "user_presence",
            "user": {"id": user.id, "name": user.name, "avatar_url": user.avatar_url},
            "status": "online"
        })

        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                msg_type = parsed.get("type")

                if msg_type == "send_message":
                    content = (parsed.get("content") or "").strip()
                    if content:
                        async with AsyncSessionLocal() as db:
                            new_msg = Message(
                                room_id=room_id,
                                sender_id=user.id,
                                content=content,
                                is_pinned=False
                            )
                            db.add(new_msg)
                            await db.commit()
                            await db.refresh(new_msg)

                            msg_dict = {
                                "id": new_msg.id,
                                "room_id": new_msg.room_id,
                                "sender_id": new_msg.sender_id,
                                "content": new_msg.content,
                                "is_pinned": new_msg.is_pinned,
                                "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
                                "sender": {
                                    "id": user.id,
                                    "name": user.name,
                                    "email": user.email,
                                    "role_title": user.role_title,
                                    "avatar_url": user.avatar_url
                                }
                            }

                            await ws_manager.broadcast(room_id, {
                                "type": "new_message",
                                "message": msg_dict
                            })

                elif msg_type == "typing":
                    await ws_manager.broadcast(room_id, {
                        "type": "user_typing",
                        "user": {"id": user.id, "name": user.name}
                    })

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(room_id, websocket)
        await ws_manager.broadcast(room_id, {
            "type": "user_presence",
            "user": {"id": user.id, "name": user.name},
            "status": "offline"
        })
