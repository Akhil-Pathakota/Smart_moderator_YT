from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import get_session
from app.models.schemas import FetchCommentsResponse, ModerationStatsResponse, CommentVerifyRequest, CommentResponse
from app.services.moderation import moderation_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/fetch/{video_id}", response_model=FetchCommentsResponse)
async def fetch_and_moderate(video_id: str, session: AsyncSession = Depends(get_session)):
    """
    Force-sync comments from YouTube and run ML classification.
    Implements Automate-then-Verify logic from PRD.
    """
    try:
        result = await moderation_service.fetch_and_classify(video_id, session)
        return result
    except Exception as e:
        logger.error(f"Moderation fetch error for {video_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=CommentResponse)
async def verify_comment(payload: CommentVerifyRequest, session: AsyncSession = Depends(get_session)):
    """
    Manual override: Creator confirms or dismisses a Review comment.
    If confirmed toxic → triggers YouTube API delete.
    """
    try:
        comment = await moderation_service.manual_verify(
            payload.comment_id, payload.confirm_toxic, session
        )
        return comment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Verify error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{video_id}", response_model=ModerationStatsResponse)
async def get_moderation_stats(video_id: str, session: AsyncSession = Depends(get_session)):
    """Aggregated moderation statistics for a video."""
    return await moderation_service.get_stats(video_id, session)
