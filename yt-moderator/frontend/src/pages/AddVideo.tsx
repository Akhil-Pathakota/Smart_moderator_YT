import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { videoApi, type Video } from "../lib/api";
import { GlassCard, GlowButton } from "../components/ui/index";

type State = "idle" | "loading" | "preview" | "error";

export default function AddVideo() {
  const navigate = useNavigate();
  const [videoId, setVideoId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Video | null>(null);

  const extractId = (input: string) => {
    // Support full URL or bare ID
    const urlMatch = input.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return urlMatch ? urlMatch[1] : input.trim();
  };

  const handleAdd = async () => {
    const id = extractId(videoId || videoUrl);
    if (!id || id.length < 5) {
      setError("Please enter a valid YouTube Video ID.");
      return;
    }

    setState("loading");
    setError("");

    try {
      const video = await videoApi.add(id, videoUrl || undefined);
      setPreview(video);
      setState("preview");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to add video.";
      setError(msg);
      setState("error");
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="ambient-blob w-80 h-80 bg-neon-purple/5 top-0 right-1/4" />

      <div className="relative z-10 max-w-xl mx-auto px-6 py-12">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <p className="text-xs font-mono text-neon-cyan/60 uppercase tracking-[0.3em] mb-2">
          New Target
        </p>
        <h1 className="font-display text-3xl font-bold mb-8">Add YouTube Video</h1>

        <GlassCard className="p-6 space-y-5">
          {/* Video ID */}
          <div>
            <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
              Video ID <span className="text-neon-red">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. dQw4w9WgXcQ"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 font-mono transition-all"
            />
          </div>

          {/* Video URL (optional) */}
          <div>
            <label className="block text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
              Video URL <span className="text-text-muted">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-cyan/40 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-neon-red text-sm bg-neon-red/10 border border-neon-red/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <GlowButton
            onClick={handleAdd}
            disabled={state === "loading"}
            className="w-full justify-center"
          >
            {state === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader size={14} className="animate-spin" /> Fetching from YouTube...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={14} /> Validate & Add
              </span>
            )}
          </GlowButton>
        </GlassCard>

        {/* Preview on success */}
        {state === "preview" && preview && (
          <GlassCard className="mt-6 overflow-hidden animate-fade-up">
            <div className="relative h-40 overflow-hidden rounded-t-2xl">
              <img
                src={preview.thumbnail_url}
                alt={preview.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-neon-green text-xs bg-neon-green/10 border border-neon-green/30 rounded-full px-3 py-1 font-mono">
                <CheckCircle size={11} /> Added
              </div>
            </div>
            <div className="p-5">
              <p className="font-display font-semibold text-text-primary text-sm mb-1">{preview.title}</p>
              {preview.channel_title && (
                <p className="text-xs text-text-muted">{preview.channel_title}</p>
              )}
              <div className="mt-4 flex gap-3">
                <GlowButton onClick={() => navigate(`/video/${preview.video_id}`)}>
                  <span className="flex items-center gap-2"><Plus size={14} /> Open Video</span>
                </GlowButton>
                <GlowButton variant="ghost" onClick={() => navigate("/")}>
                  Back to Dashboard
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
