import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Shield, Eye, CheckCircle } from "lucide-react";
import { videoApi, type Video } from "../lib/api";
import { GlassCard, StatChip, Skeleton, EmptyState } from "../components/ui/index";

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    videoApi
      .list()
      .then(setVideos)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await videoApi.remove(id);
    setVideos((v) => v.filter((x) => x.video_id !== id));
  };

  const totalDeleted = videos.reduce((a, v) => a + v.deleted_count, 0);
  const totalReview = videos.reduce((a, v) => a + v.review_count, 0);

  return (
    <div className="min-h-screen relative">
      {/* Ambient blobs */}
      <div className="ambient-blob w-96 h-96 bg-neon-cyan/5 top-[-5rem] left-[-5rem]" />
      <div className="ambient-blob w-64 h-64 bg-neon-purple/5 top-1/3 right-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-mono text-neon-cyan/60 uppercase tracking-[0.3em] mb-2">
              Smart Moderator
            </p>
            <h1 className="font-display text-4xl font-bold text-text-primary">
              Creator Dashboard
            </h1>
            <p className="text-text-secondary mt-2 text-sm">
              Real-time toxicity detection across your video library.
            </p>
          </div>
          <button
            onClick={() => navigate("/add")}
            className="flex items-center gap-2 bg-neon-cyan text-void font-display font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-neon-cyan/90 transition-all shadow-glow"
          >
            <Plus size={16} />
            Add Video
          </button>
        </div>

        {/* Global Stats */}
        {videos.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "Videos Tracked", value: videos.length, color: "cyan" as const },
              { label: "Auto-Deleted", value: totalDeleted, color: "red" as const },
              { label: "Awaiting Review", value: totalReview, color: "amber" as const },
            ].map(({ label, value, color }) => (
              <GlassCard key={label} className="p-5">
                <StatChip label={label} value={value} color={color} />
              </GlassCard>
            ))}
          </div>
        )}

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <EmptyState
            icon={<Shield />}
            title="No videos tracked yet"
            subtitle="Add your first YouTube video to start moderating comments automatically."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video, i) => (
              <VideoCard
                key={video.video_id}
                video={video}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => navigate(`/video/${video.video_id}`)}
                onRemove={(e) => handleRemove(e, video.video_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  onClick,
  onRemove,
  style,
}: {
  video: Video;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}) {
  const neutral = video.total_count - video.deleted_count - video.review_count;

  return (
    <GlassCard
      className="group overflow-hidden animate-fade-up"
      style={style as any}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden rounded-t-2xl">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/30 to-transparent" />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-void/60 border border-white/10 text-text-muted hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-sm text-text-primary line-clamp-2 mb-3 leading-snug">
          {video.title}
        </h3>

        {/* Mini stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-text-muted">{video.total_count} comments</span>
          <span className="text-neon-red flex items-center gap-1">
            <Trash2 size={10} /> {video.deleted_count}
          </span>
          <span className="text-neon-amber flex items-center gap-1">
            <Eye size={10} /> {video.review_count}
          </span>
          <span className="text-neon-green flex items-center gap-1">
            <CheckCircle size={10} /> {neutral}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
