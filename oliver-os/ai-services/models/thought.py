"""
Thought Models for Oliver-OS AI Services
Pydantic models for thought processing and analysis
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ThoughtStatus(str, Enum):
    """Status of a thought in the processing pipeline"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class InsightType(str, Enum):
    """Types of insights that can be extracted from thoughts"""
    KEY_CONCEPT = "key_concept"
    EMOTION = "emotion"
    ACTION_ITEM = "action_item"
    PATTERN = "pattern"
    RELATIONSHIP = "relationship"
    TREND = "trend"


class Insight(BaseModel):
    """Individual insight extracted from a thought"""
    type: InsightType
    content: str
    confidence: float = Field(ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = None


class Thought(BaseModel):
    """Core thought model"""
    id: str
    content: str
    user_id: str
    status: ThoughtStatus = ThoughtStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Processing results
    insights: List[Insight] = Field(default_factory=list)
    processed_content: Optional[str] = None
    patterns: List[str] = Field(default_factory=list)
    related_thoughts: List[str] = Field(default_factory=list)
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    tags: List[str] = Field(default_factory=list)
    
    class Config:
        use_enum_values = True


class ThoughtCreate(BaseModel):
    """Model for creating a new thought"""
    content: str
    user_id: str
    metadata: Optional[Dict[str, Any]] = None
    tags: List[str] = Field(default_factory=list)


class ThoughtUpdate(BaseModel):
    """Model for updating an existing thought"""
    content: Optional[str] = None
    status: Optional[ThoughtStatus] = None
    insights: Optional[List[Insight]] = None
    processed_content: Optional[str] = None
    patterns: Optional[List[str]] = None
    related_thoughts: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    
    class Config:
        use_enum_values = True


class ThoughtAnalysis(BaseModel):
    """Analysis results for a thought"""
    thought_id: str
    insights: List[Insight]
    patterns: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    processing_time: float  # seconds
    model_used: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ThoughtSearchResult(BaseModel):
    """Search result for thoughts"""
    thought: Thought
    relevance_score: float = Field(ge=0.0, le=1.0)
    matched_fields: List[str]
    highlights: Optional[Dict[str, str]] = None
