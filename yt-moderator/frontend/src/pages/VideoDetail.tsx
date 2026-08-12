import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, Trash2, CheckCircle, XCircle,
  Globe, Loader, BarChart3, ExternalLink,
} from "lucide-react";
import { videoApi, commentApi, moderationApi, type Video, type Comment, type FetchResult } from "../lib/api";
import { GlassCard, StatusBadge, ToxicityBar, GlowButton, Skeleton, EmptyState } from "../components/ui/index";

type TabId = "All" | "Toxic" | "Review" | "Neutral";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("All");
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(
    async (status?: string) => {
      if (!id) return;
      const data = await commentApi.list(id, status === "All" ? undefined : status);
      setComments(data);
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    Promise.all([videoApi.get(id), commentApi.list(id)])
      .then(([v, c]) => {
        setVideo(v);
        setComments(c);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadComments(activeTab);
  }, [activeTab, loadComments]);

  const handleFetch = async () => {
    if (!id) return;
    setFetching(true);
    setFetchResult(null);
    try {
      const result = await moderationApi.fetch(id);
      setFetchResult(result);
      const [updatedVideo, updatedComments] = await Promise.all([videoApi.get(id), commentApi.list(id)]);
      setVideo(updatedVideo);
      setComments(updatedComments);
      setActiveTab("All");
    } finally {
      setFetching(false);
    }
  };

  const handleVerify = async (commentId: string, confirm: boolean) => {
    setVerifying(commentId);
    try {
      const updated = await moderationApi.verify(commentId, confirm);
      setComments((prev) => prev.map((c) => (c.comment_id === updated.comment_id ? updated : c)));
      const updatedVideo = await videoApi.get(id!);
      setVideo(updatedVideo);
    } finally {
      setVerifying(null);
    }
  };

  const tabs: TabId[] = ["All", "Review", "Toxic", "Neutral"];

  const tabCount = (tab: TabId) => {
    if (!video) return 0;
    if (tab === "All") return video.total_count;
    if (tab === "Toxic") return video.deleted_count;
    if (tab === "Review") return video.review_count;
    return video.total_count - video.deleted_count - video.review_count;
  };

  const tabColor: Record<TabId, string> = {
    All: "text-text-secondary",
    Toxic: "text-neon-red",
    Review: "text-neon-amber",
    Neutral: "text-neon-green",
  };

  return (
    <div className="min-h-screen relative">
      <div className="ambient-blob w-72 h-72 bg-neon-red/4 top-0 right-0" />
      <div className="ambient-blob w-64 h-64 bg-neon-cyan/4 bottom-0 left-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
        ) : !video ? (
          <EmptyState icon={<XCircle />} title="Video not found" />
        ) : (
          <>
            {/* Video Header Card */}
            <GlassCard className="p-0 overflow-hidden mb-6">
              <div className="flex gap-0">
                {/* Thumbnail — clickable, opens YouTube */}
                <a
                  href={`https://www.youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-56 h-36 flex-shrink-0 overflow-hidden group"
                >
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink size={24} className="text-white" />
                  </div>
                </a>

                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    {/* Title — clickable, opens YouTube */}
                    <a
                      href={`https://www.youtube.com/watch?v=${video.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2"
                    >
                      <h1 className="font-display font-bold text-lg text-text-primary leading-snug mb-1 group-hover:text-neon-cyan transition-colors">
                        {video.title}
                      </h1>
                      <ExternalLink size={13} className="text-text-muted group-hover:text-neon-cyan transition-colors mt-1 flex-shrink-0" />
                    </a>
                    {video.channel_title && (
                      <p className="text-xs text-text-muted">{video.channel_title}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5 text-sm font-mono">
                      <span className="text-text-muted">{video.total_count} total</span>
                      <span className="text-neon-red">{video.deleted_count} deleted</span>
                      <span className="text-neon-amber">{video.review_count} review</span>
                    </div>
                    <GlowButton onClick={handleFetch} disabled={fetching}>
                      <span className="flex items-center gap-2">
                        {fetching ? (
                          <Loader size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        {fetching ? "Syncing..." : "Fetch Comments"}
                      </span>
                    </GlowButton>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Fetch Result Banner */}
            {fetchResult && (
              <GlassCard className="mb-6 p-4 border-neon-cyan/20 animate-fade-up">
                <div className="flex items-center gap-6 text-sm font-mono">
                  <BarChart3 size={14} className="text-neon-cyan" />
                  <span className="text-text-secondary">
                    Fetched <span className="text-neon-cyan">{fetchResult.fetched}</span> comments
                  </span>
                  <span className="text-text-secondary">
                    Classified <span className="text-text-primary">{fetchResult.newly_classified}</span> new
                  </span>
                  <span className="text-neon-red">Auto-deleted {fetchResult.auto_deleted}</span>
                  <span className="text-neon-amber">In review {fetchResult.moved_to_review}</span>
                </div>
              </GlassCard>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-white/3 border border-white/6 rounded-xl p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-display font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white/8 text-text-primary shadow-sm"
                      : `${tabColor[tab]} hover:text-text-primary`
                  }`}
                >
                  {tab}
                  <span className="ml-2 text-xs opacity-60">{tabCount(tab)}</span>
                </button>
              ))}
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <EmptyState
                icon={<CheckCircle />}
                title={`No ${activeTab.toLowerCase()} comments`}
                subtitle={activeTab === "All" ? "Click 'Fetch Comments' to sync from YouTube." : undefined}
              />
            ) : (
              <div className="space-y-3">
                {comments.map((comment, i) => (
                  <CommentRow
                    key={comment.comment_id}
                    comment={comment}
                    verifying={verifying === comment.comment_id}
                    onVerify={handleVerify}
                    style={{ animationDelay: `${i * 30}ms` }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  verifying,
  onVerify,
  style,
}: {
  comment: Comment;
  verifying: boolean;
  onVerify: (id: string, confirm: boolean) => void;
  style?: React.CSSProperties;
}) {
  return (
    <GlassCard className="p-4 animate-fade-up" style={style as any}>
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex-shrink-0 flex items-center justify-center text-xs font-display text-text-muted">
          {(comment.author?.[0] || "?").toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-medium text-text-secondary">{comment.author || "Anonymous"}</span>
            {comment.language && comment.language !== "en" && (
              <span className="flex items-center gap-1 text-xs text-text-muted font-mono">
                <Globe size={10} /> {comment.language.toUpperCase()}
              </span>
            )}
            <StatusBadge status={comment.status} />
            {comment.deleted_on_youtube && (
              <span className="text-xs text-neon-red/60 font-mono flex items-center gap-1">
                <Trash2 size={10} /> removed from YT
              </span>
            )}
          </div>

          <p className="text-sm text-text-primary leading-relaxed mb-3">{comment.text}</p>
          <ToxicityBar score={comment.toxicity_score} />
        </div>

        {/* Verify Actions (Review only) */}
        {comment.status === "Review" && !comment.deleted_on_youtube && (
          <div className="flex-shrink-0 flex gap-2 ml-2">
            {verifying ? (
              <Loader size={14} className="animate-spin text-text-muted mt-1" />
            ) : (
              <>
                <button
                  onClick={() => onVerify(comment.comment_id, true)}
                  title="Confirm Toxic — Delete from YouTube"
                  className="p-2 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red hover:bg-neon-red/20 transition-all"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => onVerify(comment.comment_id, false)}
                  title="Mark as Safe"
                  className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green hover:bg-neon-green/20 transition-all"
                >
                  <CheckCircle size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
