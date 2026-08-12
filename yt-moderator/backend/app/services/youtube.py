import httpx
import os
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Force load .env from backend root directory
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path, override=True)

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeService:

    @property
    def api_key(self):
        key = os.getenv("YOUTUBE_API_KEY", "")
        if key:
            logger.info(f"YouTube API key loaded: {key[:8]}...")
        else:
            logger.warning("YOUTUBE_API_KEY is empty or not found in .env")
        return key

    @property
    def oauth_token(self):
        return os.getenv("YOUTUBE_OAUTH_TOKEN", "")

    async def get_video_metadata(self, video_id: str) -> Optional[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("No YouTube API key — returning mock metadata.")
            return {
                "video_id": video_id,
                "title": f"[Mock] Video {video_id}",
                "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                "channel_title": "Mock Channel",
            }

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{YOUTUBE_API_BASE}/videos",
                params={"part": "snippet", "id": video_id, "key": self.api_key},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        if not items:
            return None

        snippet = items[0]["snippet"]
        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("maxres", {}).get("url")
            or thumbnails.get("high", {}).get("url")
            or thumbnails.get("default", {}).get("url", "")
        )
        return {
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "thumbnail_url": thumb,
            "channel_title": snippet.get("channelTitle", ""),
        }

    async def fetch_comments(self, video_id: str, max_results: int = 100) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("No YouTube API key — returning mock comments.")
            return self._mock_comments(video_id)

        comments = []
        page_token = None

        async with httpx.AsyncClient() as client:
            while len(comments) < max_results:
                params = {
                    "part": "snippet",
                    "videoId": video_id,
                    "maxResults": min(100, max_results - len(comments)),
                    "key": self.api_key,
                    "textFormat": "plainText",
                }
                if page_token:
                    params["pageToken"] = page_token

                resp = await client.get(
                    f"{YOUTUBE_API_BASE}/commentThreads",
                    params=params,
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()

                for item in data.get("items", []):
                    top = item["snippet"]["topLevelComment"]["snippet"]
                    comments.append({
                        "comment_id": item["id"],
                        "text": top.get("textDisplay", ""),
                        "author": top.get("authorDisplayName", "Anonymous"),
                    })

                page_token = data.get("nextPageToken")
                if not page_token:
                    break

        logger.info(f"Fetched {len(comments)} real comments for video {video_id}")
        return comments

    async def delete_comment(self, comment_id: str) -> bool:
        if not self.oauth_token:
            logger.warning(f"No OAuth token — simulating delete for {comment_id}")
            return True

        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{YOUTUBE_API_BASE}/comments",
                params={"id": comment_id},
                headers={"Authorization": f"Bearer {self.oauth_token}"},
                timeout=10,
            )
            if resp.status_code == 204:
                return True
            logger.error(f"Failed to delete comment {comment_id}: {resp.text}")
            return False

    def _mock_comments(self, video_id: str) -> List[Dict[str, Any]]:
        return [
            {"comment_id": f"{video_id}_c1", "text": "This video is absolutely amazing!", "author": "Fan123"},
            {"comment_id": f"{video_id}_c2", "text": "You're a complete idiot!", "author": "Hater99"},
            {"comment_id": f"{video_id}_c3", "text": "Great tutorial, very helpful.", "author": "Learner42"},
            {"comment_id": f"{video_id}_c4", "text": "Esta persona es un maldito imbécil.", "author": "SpanishUser"},
            {"comment_id": f"{video_id}_c5", "text": "Could be better, decent effort.", "author": "Critic007"},
        ]


youtube_service = YouTubeService()