from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, ForeignKey, Text, Enum as SAEnum
from typing import Optional, List
import enum
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./moderator.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class CommentStatus(str, enum.Enum):
    TOXIC = "Toxic"
    NEUTRAL = "Neutral"
    REVIEW = "Review"


class Video(Base):
    __tablename__ = "videos"

    video_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    thumbnail_url: Mapped[str] = mapped_column(String(1000))
    channel_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    deleted_count: Mapped[int] = mapped_column(Integer, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)

    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="video", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    comment_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    video_id: Mapped[str] = mapped_column(String(20), ForeignKey("videos.video_id"))
    text: Mapped[str] = mapped_column(Text)
    author: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    toxicity_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[CommentStatus] = mapped_column(SAEnum(CommentStatus), default=CommentStatus.NEUTRAL)
    deleted_on_youtube: Mapped[bool] = mapped_column(default=False)

    video: Mapped["Video"] = relationship("Video", back_populates="comments")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
