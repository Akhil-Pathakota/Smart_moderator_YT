from dotenv import load_dotenv
from pathlib import Path

# Load .env FIRST before anything else
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import videos, comments, moderation
from app.models.database import init_db
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    # Log key status on startup
    api_key = os.getenv("YOUTUBE_API_KEY", "")
    oauth_token = os.getenv("YOUTUBE_OAUTH_TOKEN", "")
    logger.info(f"YouTube API Key: {'✅ Loaded' if api_key else '❌ Missing'}")
    logger.info(f"YouTube OAuth Token: {'✅ Loaded' if oauth_token else '❌ Missing'}")
    logger.info("Smart Moderator API ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI-Powered YouTube Moderation Suite",
    description="Real-time multilingual toxic comment detection and removal.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(moderation.router, prefix="/api/moderation", tags=["Moderation"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "YouTube Moderation Suite"}