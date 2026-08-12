"""
Hybrid Toxicity Engine v2
Flow:
  Comment
     │
     ├── 1. HuggingFace Inference API (free, no key, multilingual)
     │
     ├── 2. Telugu/Hinglish/Regional keyword list
     │
     └── Take HIGHEST score → Classify as Toxic / Review / Neutral
"""
import logging
import re
import os
import httpx
from dataclasses import dataclass
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env", override=True)

logger = logging.getLogger(__name__)

HIGH_CONFIDENCE = 0.85
LOW_CONFIDENCE = 0.50

# HuggingFace Inference API — free, no key required for basic usage
HF_API_URL = "https://api-inference.huggingface.co/models/unitary/multilingual-toxic-xlm-roberta"

# ── Regional / Telugu / Hinglish keyword list ─────────────────────────────────
REGIONAL_SLANG = [
    # Telugu slang (Romanized)
    "howley", "hhole", "puku", "dengey", "dengu", "lanja", "bokka",
    "modda", "pooku", "gudda", "nakala", "dengedi","howlepukaaa", "denguta","bondha",
    "nee amma", "nee akka", "poda", "podi", "thevidiya","randa", "sulli",
    "gand","falthu", "myiru", "koothi","mayakkiloudey","munda","kojja",
    # Tamil slang
    "thevidiya", "otha", "punda", "sunni", "myiru", "koothi",
    # Hindi/Hinglish slang
    "chutiya", "chutiye", "bhenchod", "bhencho", "behenchod",
    "madarchod", "maderchod", "gaandu", "gandu", "kamina", "kamine",
    "randi", "harami", "haramzada", "lauda", "lavda", "bhosdi",
    "bsdk", "saala", "sala", "ullu", "suar", "kutti", "kuttey",
    # Common short forms
    "mc", "bc", "bkl", "lodu", "lund",
    # English slurs used in Indian context  
    "idiot", "stupid", "moron", "loser", "trash", "garbage",
    "shut up", "kys", "kill yourself", "die",
]

_SLANG_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(w) for w in REGIONAL_SLANG) + r')\b',
    re.IGNORECASE
)


@dataclass
class ToxicityResult:
    score: float
    language: str
    source: str  # "huggingface", "keyword", "heuristic"
    is_multilingual: bool


class ToxicityEngine:
    def __init__(self):
        self._lang_detector = None
        self._load_lang_detector()

    def _load_lang_detector(self):
        try:
            import langdetect
            self._lang_detector = langdetect
            logger.info("Language detector loaded.")
        except ImportError:
            logger.warning("langdetect not available.")

    def _detect_language(self, text: str) -> str:
        if self._lang_detector:
            try:
                return self._lang_detector.detect(text)
            except Exception:
                pass
        return "en"

    # ── 1. HuggingFace Inference API ─────────────────────────────────────────
    async def _huggingface_score(self, text: str) -> float | None:
        hf_token = os.getenv("HF_TOKEN", "")
        headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    HF_API_URL,
                    headers=headers,
                    json={"inputs": text[:512]},
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Response: [[{"label": "toxic", "score": 0.9}, {"label": "neutral", "score": 0.1}]]
                    if isinstance(data, list) and len(data) > 0:
                        results = data[0] if isinstance(data[0], list) else data
                        for item in results:
                            if item.get("label", "").lower() in ["toxic", "toxicity"]:
                                score = round(item["score"], 4)
                                logger.debug(f"HF score: {score:.3f} | {text[:50]}")
                                return score
                elif resp.status_code == 503:
                    logger.warning("HuggingFace model is loading, using fallback.")
                    return None
                else:
                    logger.warning(f"HuggingFace API error {resp.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"HuggingFace API failed: {e}")
            return None

    # ── 2. Regional keyword check ─────────────────────────────────────────────
    def _keyword_score(self, text: str) -> float:
        matches = _SLANG_PATTERN.findall(text.lower())
        if not matches:
            return 0.0
        logger.info(f"Keyword matches: {matches} in '{text[:60]}'")
        if len(matches) >= 3: return 0.97
        if len(matches) == 2: return 0.93
        return 0.88  # Single match → above HIGH_CONFIDENCE threshold

    # ── 3. Heuristic fallback ─────────────────────────────────────────────────
    def _heuristic_score(self, text: str) -> float:
        patterns = [
            r"\b(idiot|stupid|moron|dumb|trash|garbage|hate|kill|loser)\b",
            r"\b(imbécil|maldito|idiota|dummkopf|müll)\b",
        ]
        hits = sum(1 for p in patterns if re.search(p, text, re.IGNORECASE))
        if hits >= 2: return 0.92
        if hits == 1: return 0.72
        return 0.10

    # ── Main async analyze ────────────────────────────────────────────────────
    async def analyze_async(self, text: str) -> ToxicityResult:
        language = self._detect_language(text)
        is_multilingual = language != "en"

        # Run both checks
        hf_score = await self._huggingface_score(text)
        keyword_score = self._keyword_score(text)

        # Take highest score
        scores = {"keyword": keyword_score}
        if hf_score is not None:
            scores["huggingface"] = hf_score
        else:
            scores["heuristic"] = self._heuristic_score(text)

        best_source = max(scores, key=lambda k: scores[k])
        final_score = scores[best_source]

        logger.info(
            f"[{best_source.upper()}] {final_score:.2f} | "
            f"lang={language} | scores={scores} | '{text[:50]}'"
        )

        return ToxicityResult(
            score=round(final_score, 4),
            language=language,
            source=best_source,
            is_multilingual=is_multilingual,
        )

    # ── Sync fallback (keyword + heuristic only) ──────────────────────────────
    def analyze(self, text: str) -> ToxicityResult:
        language = self._detect_language(text)
        keyword = self._keyword_score(text)
        heuristic = self._heuristic_score(text)
        score = max(keyword, heuristic)
        source = "keyword" if keyword >= heuristic else "heuristic"
        return ToxicityResult(
            score=round(score, 4),
            language=language,
            source=source,
            is_multilingual=language != "en",
        )

    def classify(self, score: float) -> str:
        from app.models.database import CommentStatus
        if score > HIGH_CONFIDENCE:
            return CommentStatus.TOXIC
        elif score > LOW_CONFIDENCE:
            return CommentStatus.REVIEW
        return CommentStatus.NEUTRAL


toxicity_engine = ToxicityEngine()