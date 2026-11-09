from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_title = Column(String(100), default="Hacker")
    avatar_url = Column(String(500), nullable=True)
    skills = Column(JSON, default=list)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    room_memberships = relationship("RoomMember", back_populates="user", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", back_populates="assigned_user")
    created_notes = relationship("ImportantNote", back_populates="creator")
    celebrated_achievements = relationship("Achievement", back_populates="celebrator")
    owned_events = relationship("TimelineEvent", back_populates="owner")
    join_requests = relationship("RoomJoinRequest", foreign_keys="[RoomJoinRequest.user_id]", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    mission_statement = Column(Text, nullable=True)
    is_private = Column(Boolean, default=False, nullable=False)
    requires_approval = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    members = relationship("RoomMember", back_populates="room", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="room", cascade="all, delete-orphan")
    important_notes = relationship("ImportantNote", back_populates="room", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="room", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="room", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="room", cascade="all, delete-orphan")
    join_requests = relationship("RoomJoinRequest", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), default="member")  # 'owner', 'admin', 'member'
    joined_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")


class RoomJoinRequest(Base):
    __tablename__ = "room_join_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)  # 'pending', 'accepted', 'rejected'
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    room = relationship("Room", back_populates="join_requests")
    user = relationship("User", foreign_keys=[user_id], back_populates="join_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="backlog", index=True)  # 'backlog', 'in_progress', 'review', 'done'
    priority = Column(String(20), default="medium")  # 'low', 'medium', 'high', 'urgent'
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="tasks")
    assigned_user = relationship("User", back_populates="assigned_tasks")


class ImportantNote(Base):
    __tablename__ = "important_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content_type = Column(String(20), default="link")  # 'link', 'snippet', 'markdown'
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="important_notes")
    creator = relationship("User", back_populates="created_notes")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    impact_note = Column(Text, nullable=True)
    is_starred = Column(Boolean, default=True)
    achieved_at = Column(DateTime(timezone=True), default=utc_now)
    celebrated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    room = relationship("Room", back_populates="achievements")
    celebrator = relationship("User", back_populates="celebrated_achievements")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    event_name = Column(String(255), nullable=False)
    target_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'completed', 'missed'
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="timeline_events")
    owner = relationship("User", back_populates="owned_events")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)  # 'task_completed', 'task_created', 'achievement_unlocked', etc.
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    room = relationship("Room", back_populates="audit_logs")
