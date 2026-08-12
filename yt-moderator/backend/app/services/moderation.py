"""
Core Moderation Service
Implements the PRD "Automate-then-Verify" deletion logic:
  - Score > 0.85  → Auto-delete from YouTube
  - 0.50–0.85     → Move to Review queue
  - Score < 0.50  → Mark Neutral
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, case
from app.models.database import Comment, Video, CommentStatus
from app.models.schemas import FetchCommentsResponse, ModerationStatsResponse
from app.services.youtube import youtube_service
from app.ml.toxicity import toxicity_engine

logger = logging.getLogger(__name__)


class ModerationService:

    async def fetch_and_classify(self, video_id: str, session: AsyncSession) -> FetchCommentsResponse:
        raw_comments = await youtube_service.fetch_comments(video_id)
        if not raw_comments:
            return FetchCommentsResponse(fetched=0, newly_classified=0, auto_deleted=0, moved_to_review=0)

        # Get existing comment IDs to avoid reprocessing
        existing_ids_result = await session.execute(
            select(Comment.comment_id).where(Comment.video_id == video_id)
        )
        existing_ids = {row[0] for row in existing_ids_result.fetchall()}

        new_comments = [c for c in raw_comments if c["comment_id"] not in existing_ids]

        if not new_comments:
            return FetchCommentsResponse(fetched=len(raw_comments), newly_classified=0, auto_deleted=0, moved_to_review=0)

        auto_deleted = 0
        moved_to_review = 0

        for raw in new_comments:
            result = toxicity_engine.analyze(raw["text"])
            status = toxicity_engine.classify(result.score)

            deleted_on_youtube = False
            if status == CommentStatus.TOXIC:
                success = await youtube_service.delete_comment(raw["comment_id"])
                deleted_on_youtube = success
                auto_deleted += 1
            elif status == CommentStatus.REVIEW:
                moved_to_review += 1

            comment = Comment(
                comment_id=raw["comment_id"],
                video_id=video_id,
                text=raw["text"],
                author=raw.get("author"),
                language=result.language,
                toxicity_score=result.score,
                status=status,
                deleted_on_youtube=deleted_on_youtube,
            )
            session.add(comment)

        await session.flush()
        await self._sync_video_counts(video_id, session)
        await session.commit()

        return FetchCommentsResponse(
            fetched=len(raw_comments),
            newly_classified=len(new_comments),
            auto_deleted=auto_deleted,
            moved_to_review=moved_to_review,
        )

    async def manual_verify(self, comment_id: str, confirm_toxic: bool, session: AsyncSession) -> Comment:
        result = await session.execute(select(Comment).where(Comment.comment_id == comment_id))
        comment = result.scalar_one_or_none()
        if not comment:
            raise ValueError(f"Comment {comment_id} not found.")

        if confirm_toxic:
            success = await youtube_service.delete_comment(comment_id)
            comment.status = CommentStatus.TOXIC
            comment.deleted_on_youtube = success
            comment.toxicity_score = max(comment.toxicity_score, 0.86)
        else:
            comment.status = CommentStatus.NEUTRAL

        await self._sync_video_counts(comment.video_id, session)
        await session.commit()
        await session.refresh(comment)
        return comment

    async def get_stats(self, video_id: str, session: AsyncSession) -> ModerationStatsResponse:
        counts = await session.execute(
            select(
                func.count(Comment.comment_id).label("total"),
                func.sum(case((Comment.status == CommentStatus.TOXIC, 1), else_=0)).label("toxic"),
                func.sum(case((Comment.status == CommentStatus.NEUTRAL, 1), else_=0)).label("neutral"),
                func.sum(case((Comment.status == CommentStatus.REVIEW, 1), else_=0)).label("review"),
                func.sum(case((Comment.deleted_on_youtube == True, 1), else_=0)).label("deleted"),
            ).where(Comment.video_id == video_id)
        )
        row = counts.fetchone()
        total = row.total or 0
        toxic = row.toxic or 0
        neutral = row.neutral or 0
        review = row.review or 0
        deleted = row.deleted or 0

        accuracy = round((toxic + neutral) / total, 3) if total > 0 else 0.0

        return ModerationStatsResponse(
            video_id=video_id,
            total=total,
            toxic=toxic,
            neutral=neutral,
            review=review,
            deleted_on_youtube=deleted,
            accuracy_estimate=accuracy,
        )

    async def _sync_video_counts(self, video_id: str, session: AsyncSession):
        counts = await session.execute(
            select(
                func.count(Comment.comment_id).label("total"),
                func.sum(case((Comment.status == CommentStatus.TOXIC, 1), else_=0)).label("deleted"),
                func.sum(case((Comment.status == CommentStatus.REVIEW, 1), else_=0)).label("review"),
            ).where(Comment.video_id == video_id)
        )
        row = counts.fetchone()
        await session.execute(
            update(Video)
            .where(Video.video_id == video_id)
            .values(
                total_count=row.total or 0,
                deleted_count=row.deleted or 0,
                review_count=row.review or 0,
            )
        )


moderation_service = ModerationService()