from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database import get_session, Video
from app.models.schemas import VideoAddRequest, VideoMetaResponse
from app.services.youtube import youtube_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[VideoMetaResponse])
async def list_videos(session: AsyncSession = Depends(get_session)):
    """Return all tracked videos with their stats."""
    result = await session.execute(select(Video).order_by(Video.video_id))
    return result.scalars().all()


@router.post("/", response_model=VideoMetaResponse, status_code=201)
async def add_video(payload: VideoAddRequest, session: AsyncSession = Depends(get_session)):
    """
    Add a video to the moderation dashboard.
    Validates the video exists on YouTube before persisting.
    """
    video_id = payload.video_id.strip()

    # Check if already tracked
    existing = await session.get(Video, video_id)
    if existing:
        raise HTTPException(status_code=409, detail="Video already being tracked.")

    metadata = await youtube_service.get_video_metadata(video_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Video not found on YouTube. Check the Video ID.")

    video = Video(
        video_id=video_id,
        title=metadata["title"],
        thumbnail_url=metadata["thumbnail_url"],
        channel_title=metadata.get("channel_title"),
    )
    session.add(video)
    await session.commit()
    await session.refresh(video)
    return video


@router.get("/{video_id}", response_model=VideoMetaResponse)
async def get_video(video_id: str, session: AsyncSession = Depends(get_session)):
    video = await session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not tracked.")
    return video


@router.delete("/{video_id}", status_code=204)
async def remove_video(video_id: str, session: AsyncSession = Depends(get_session)):
    video = await session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    await session.delete(video)
    await session.commit()
