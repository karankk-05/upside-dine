"""
Pydantic schemas for request/response models.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool = False
    active_feeds: int = 0


class CrowdResult(BaseModel):
    mess_id: int
    person_count: int
    density_percentage: float
    density_level: str  # low / moderate / high
    estimated_wait_minutes: float
    timestamp: str
    feed_url: Optional[str] = None


class AnalyzeRequest(BaseModel):
    mess_id: int = 1


class FeedRegisterRequest(BaseModel):
    mess_id: int
    feed_url: str  # e.g. http://192.168.1.5:8080/video
    description: str = ""


class FeedResponse(BaseModel):
    id: int
    mess_id: int
    feed_url: str
    description: str
    is_active: bool
    last_analyzed: Optional[str] = None
