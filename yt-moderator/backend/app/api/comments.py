from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database import get_session, Comment, CommentStatus
from app.models.schemas import CommentResponse
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{video_id}", response_model=list[CommentResponse])
async def get_comments(
    video_id: str,
    status: Optional[CommentStatus] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve comments for a video with optional status filter."""
    query = select(Comment).where(Comment.video_id == video_id)
    if status:
        query = query.where(Comment.status == status)
    query = query.order_by(Comment.toxicity_score.desc()).limit(limit).offset(offset)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/detail/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: str, session: AsyncSession = Depends(get_session)):
    comment = await session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    return comment
