"""
Collaboration Models for Oliver-OS AI Services
Pydantic models for real-time collaboration features
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class CollaborationEventType(str, Enum):
    """Types of collaboration events"""
    USER_JOINED = "user_joined"
    USER_LEFT = "user_left"
    THOUGHT_CREATED = "thought_created"
    THOUGHT_UPDATED = "thought_updated"
    THOUGHT_DELETED = "thought_deleted"
    CURSOR_MOVED = "cursor_moved"
    SELECTION_CHANGED = "selection_changed"
    COMMENT_ADDED = "comment_added"
    REACTION_ADDED = "reaction_added"
    AGENT_SPAWNED = "agent_spawned"
    AGENT_COMPLETED = "agent_completed"


class UserPresence(BaseModel):
    """User presence information"""
    user_id: str
    username: str
    status: str = "online"  # online, away, busy, offline
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    current_thought_id: Optional[str] = None
    cursor_position: Optional[Dict[str, int]] = None


class CollaborationEvent(BaseModel):
    """Real-time collaboration event"""
    id: str
    type: CollaborationEventType
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Event-specific data
    data: Dict[str, Any] = Field(default_factory=dict)
    
    # Target information
    target_thought_id: Optional[str] = None
    target_user_id: Optional[str] = None
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        use_enum_values = True


class CursorPosition(BaseModel):
    """Cursor position in a thought"""
    line: int
    column: int
    thought_id: str
    user_id: str


class Selection(BaseModel):
    """Text selection in a thought"""
    start_line: int
    start_column: int
    end_line: int
    end_column: int
    thought_id: str
    user_id: str
    selected_text: str


class Comment(BaseModel):
    """Comment on a thought"""
    id: str
    thought_id: str
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Position in thought
    line: Optional[int] = None
    column: Optional[int] = None
    
    # Threading
    parent_comment_id: Optional[str] = None
    replies: List[str] = Field(default_factory=list)
    
    # Status
    resolved: bool = False


class Reaction(BaseModel):
    """Reaction to a thought or comment"""
    id: str
    user_id: str
    emoji: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Target
    target_type: str  # thought, comment
    target_id: str


class CollaborationSession(BaseModel):
    """Active collaboration session"""
    session_id: str
    thought_id: str
    participants: List[UserPresence] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    # Session settings
    is_public: bool = False
    allow_anonymous: bool = False
    max_participants: Optional[int] = None
    
    # Active elements
    cursors: List[CursorPosition] = Field(default_factory=list)
    selections: List[Selection] = Field(default_factory=list)
    comments: List[Comment] = Field(default_factory=list)
    reactions: List[Reaction] = Field(default_factory=list)
