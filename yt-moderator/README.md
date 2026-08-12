# 🛡️ SmartMod — AI-Powered YouTube Moderation Suite

> Real-time multilingual toxic comment detection and automated removal for YouTube creators.
> Built with FastAPI + React + HuggingFace Transformers.

---

## Architecture Overview

```
yt-moderator/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, lifespan
│   │   ├── api/
│   │   │   ├── videos.py         # CRUD for tracked videos
│   │   │   ├── comments.py       # Comment listing + filtering
│   │   │   └── moderation.py     # Fetch, classify, verify
│   │   ├── models/
│   │   │   ├── database.py       # SQLAlchemy async models + session
│   │   │   └── schemas.py        # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── youtube.py        # YouTube Data API v3 client
│   │   │   └── moderation.py     # Core Automate-then-Verify logic
│   │   └── ml/
│   │       └── toxicity.py       # HuggingFace multilingual model
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx     # Video grid + global stats
    │   │   ├── AddVideo.tsx      # Add + validate video
    │   │   └── VideoDetail.tsx   # Comment classification + verify
    │   ├── components/ui/
    │   │   └── index.tsx         # GlassCard, StatusBadge, ToxicityBar...
    │   ├── lib/api.ts            # Typed axios API client
    │   ├── App.tsx               # Router + Navbar
    │   └── index.css             # Antigravity design system
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## The "Automate-then-Verify" Logic (PRD §3.2)

```
Comment ingested
      │
      ▼
ML Analysis (multilingual-toxic-xlm-roberta)
      │
      ├── Score > 0.85  ──►  AUTO-DELETE via YouTube API  ──►  status=Toxic
      │
      ├── 0.50–0.85     ──►  Move to Review Queue         ──►  status=Review
      │                         │
      │                         └── Creator verifies
      │                               ├── Confirm → DELETE → status=Toxic
      │                               └── Dismiss → status=Neutral
      │
      └── Score < 0.50  ──►  Safe, no action              ──►  status=Neutral
```

---

## Setup & Running

### Prerequisites
- Python 3.11+
- Node.js 20+
- YouTube Data API v3 key
- YouTube OAuth 2.0 token (for delete operations)

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your YouTube API key + OAuth token

# 4. Run the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

UI available at: http://localhost:5173

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/videos/` | List all tracked videos |
| `POST` | `/api/videos/` | Add a video (validates via YT API) |
| `DELETE` | `/api/videos/{id}` | Remove a video |
| `GET` | `/api/comments/{video_id}` | List comments (filterable by status) |
| `POST` | `/api/moderation/fetch/{video_id}` | Sync + classify comments from YouTube |
| `POST` | `/api/moderation/verify` | Manual override for Review comments |
| `GET` | `/api/moderation/stats/{video_id}` | Aggregated stats |

---

## ML Model

**Model:** `unitary/multilingual-toxic-xlm-roberta`
- Supports 100+ languages natively
- Intent-based analysis (not just keyword matching)
- Falls back to heuristic scorer in dev mode (no model download needed)

To use real ML:
```bash
pip install transformers torch langdetect sentencepiece
# Model downloads automatically on first run (~1.1GB)
```

---

## YouTube API Setup

### Data API (read — video metadata + comments)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create API Key → add to `.env` as `YOUTUBE_API_KEY`

### OAuth (write — delete comments)
1. Create OAuth 2.0 credentials (Web application)
2. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
3. Authorize scope: `https://www.googleapis.com/auth/youtube.force-ssl`
4. Exchange for Bearer token → add to `.env` as `YOUTUBE_OAUTH_TOKEN`

> ⚠️ OAuth tokens expire. For production, implement the full refresh token flow.

---

## Production Notes

- **Database:** Swap SQLite for PostgreSQL (`postgresql+asyncpg://...`)
- **Model serving:** Host the HuggingFace model behind a separate inference service (e.g., TorchServe, Triton, or HF Inference Endpoints) for latency isolation
- **OAuth:** Implement proper refresh token flow with token storage
- **Rate limits:** YouTube Data API has a 10,000 quota units/day limit. Batch comment fetches to minimize quota usage
- **Queue:** For high-volume channels, add a task queue (Celery + Redis) for async classification

---

## Design System: Antigravity UI

- **Glassmorphism:** `backdrop-blur`, translucent surfaces, floating cards
- **Color palette:** Dark void background with neon-cyan/red/amber accents
- **Typography:** Syne (display) + DM Sans (body) + JetBrains Mono (code/data)
- **Motion:** CSS `animate-fade-up` with staggered delays, glow transitions
- **Grid:** Subtle 48px grid lines for spatial depth

---

## Success Metrics (PRD §5)

Track these via `/api/moderation/stats/{video_id}`:
- **Accuracy Rate:** `accuracy_estimate` field (classified / total)
- **API Efficiency:** Monitor fetched vs. newly_classified ratio
- **Resolution Time:** Time-to-clear Review queue (add timestamps for full tracking)
