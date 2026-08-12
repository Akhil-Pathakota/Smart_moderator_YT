from pydantic import BaseModel, Field
from typing import Optional
from app.models.database import CommentStatus


class VideoAddRequest(BaseModel):
    video_id: str = Field(..., min_length=5, max_length=20, description="YouTube Video ID")
    video_url: Optional[str] = Field(None, description="Optional full YouTube URL")


class VideoMetaResponse(BaseModel):
    video_id: str
    title: str
    thumbnail_url: str
    channel_title: Optional[str]
    total_count: int
    deleted_count: int
    review_count: int

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    comment_id: str
    video_id: str
    text: str
    author: Optional[str]
    language: Optional[str]
    toxicity_score: float
    status: CommentStatus
    deleted_on_youtube: bool

    class Config:
        from_attributes = True


class CommentVerifyRequest(BaseModel):
    comment_id: str
    confirm_toxic: bool


class ModerationStatsResponse(BaseModel):
    video_id: str
    total: int
    toxic: int
    neutral: int
    review: int
    deleted_on_youtube: int
    accuracy_estimate: float


class FetchCommentsResponse(BaseModel):
    fetched: int
    newly_classified: int
    auto_deleted: int
    moved_to_review: int
