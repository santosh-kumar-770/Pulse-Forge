from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role_title: Optional[str] = "Full-Stack Engineer"
    avatar_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role_title: Optional[str] = None
    avatar_url: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_verified: bool = True
    last_login_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ----------------- Room Schemas -----------------
class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    mission_statement: Optional[str] = None
    is_private: bool = False
    requires_approval: bool = True

class RoomCreate(RoomBase):
    slug: Optional[str] = None

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    mission_statement: Optional[str] = None
    is_private: Optional[bool] = None
    requires_approval: Optional[bool] = None

class RoomSettingsUpdate(BaseModel):
    name: Optional[str] = None
    mission_statement: Optional[str] = None
    is_private: Optional[bool] = None
    requires_approval: Optional[bool] = None

class RoomMemberOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

class AddMemberRequest(BaseModel):
    email: EmailStr
    role: str = "member"

class JoinRequestCreate(BaseModel):
    message: Optional[str] = None

class JoinRequestReview(BaseModel):
    action: str = Field(..., pattern="^(accept|reject)$")

class JoinRequestOut(BaseModel):
    id: int
    room_id: int
    user_id: int
    status: str
    message: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

class RoomOut(RoomBase):
    id: int
    slug: str
    created_by: int
    created_at: datetime
    my_role: Optional[str] = None
    member_count: Optional[int] = 0
    pending_request_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

class RoomDetailOut(RoomOut):
    members: List[RoomMemberOut] = []
    pending_requests: List[JoinRequestOut] = []
    model_config = ConfigDict(from_attributes=True)

class PublicRoomDiscoveryOut(BaseModel):
    id: int
    name: str
    slug: str
    mission_statement: Optional[str] = None
    is_private: bool = False
    requires_approval: bool = True
    created_by: int
    created_at: datetime
    member_count: int = 0
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None
    my_status: Optional[str] = "none"  # 'member', 'pending', 'rejected', 'none'
    model_config = ConfigDict(from_attributes=True)

# ----------------- Message (War-Room Chat) Schemas -----------------
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class MessageCreate(MessageBase):
    pass

class MessagePinUpdate(BaseModel):
    is_pinned: bool

class MessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: str
    is_pinned: bool = False
    created_at: datetime
    sender: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Task Schemas -----------------
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field(default="backlog", pattern="^(backlog|in_progress|review|done)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(backlog|in_progress|review|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(backlog|in_progress|review|done)$")

class TaskOut(TaskBase):
    id: int
    room_id: int
    deadline_warning_sent: bool = False
    overdue_notice_sent: bool = False
    created_at: datetime
    assigned_user: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Important Note Schemas -----------------
class ImportantNoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(default="link", pattern="^(link|snippet|markdown)$")
    content: str
    is_pinned: bool = True

class ImportantNoteCreate(ImportantNoteBase):
    pass

class ImportantNoteUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = Field(None, pattern="^(link|snippet|markdown)$")
    content: Optional[str] = None
    is_pinned: Optional[bool] = None

class ImportantNoteOut(ImportantNoteBase):
    id: int
    room_id: int
    created_by: Optional[int] = None
    created_at: datetime
    creator: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Achievement Schemas -----------------
class AchievementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    impact_note: Optional[str] = None
    is_starred: bool = True
    achieved_at: Optional[datetime] = None

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    impact_note: Optional[str] = None
    is_starred: Optional[bool] = None

class AchievementOut(AchievementBase):
    id: int
    room_id: int
    celebrated_by: Optional[int] = None
    celebrator: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Timeline Schemas -----------------
class TimelineEventBase(BaseModel):
    event_name: str = Field(..., min_length=1, max_length=255)
    target_time: datetime
    status: str = Field(default="pending", pattern="^(pending|completed|missed)$")
    owner_id: Optional[int] = None

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEventUpdate(BaseModel):
    event_name: Optional[str] = None
    target_time: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed|missed)$")
    owner_id: Optional[int] = None

class TimelineEventOut(TimelineEventBase):
    id: int
    room_id: int
    created_at: datetime
    owner: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

class AuditLogBase(BaseModel):
    action_type: str
    description: str
    metadata_json: Optional[Any] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogOut(AuditLogBase):
    id: int
    room_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class TimelineCombinedOut(BaseModel):
    events: List[TimelineEventOut] = []
    history: List[AuditLogOut] = []
