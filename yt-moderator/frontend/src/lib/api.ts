import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// Types
export interface Video {
  video_id: string;
  title: string;
  thumbnail_url: string;
  channel_title: string | null;
  total_count: number;
  deleted_count: number;
  review_count: number;
}

export interface Comment {
  comment_id: string;
  video_id: string;
  text: string;
  author: string | null;
  language: string | null;
  toxicity_score: number;
  status: "Toxic" | "Neutral" | "Review";
  deleted_on_youtube: boolean;
}

export interface FetchResult {
  fetched: number;
  newly_classified: number;
  auto_deleted: number;
  moved_to_review: number;
}

export interface ModerationStats {
  video_id: string;
  total: number;
  toxic: number;
  neutral: number;
  review: number;
  deleted_on_youtube: number;
  accuracy_estimate: number;
}

// API calls
export const videoApi = {
  list: () => api.get<Video[]>("/videos/").then((r) => r.data),
  add: (video_id: string, video_url?: string) =>
    api.post<Video>("/videos/", { video_id, video_url }).then((r) => r.data),
  get: (id: string) => api.get<Video>(`/videos/${id}`).then((r) => r.data),
  remove: (id: string) => api.delete(`/videos/${id}`),
};

export const commentApi = {
  list: (videoId: string, status?: string) =>
    api.get<Comment[]>(`/comments/${videoId}`, { params: { status } }).then((r) => r.data),
};

export const moderationApi = {
  fetch: (videoId: string) =>
    api.post<FetchResult>(`/moderation/fetch/${videoId}`).then((r) => r.data),
  verify: (comment_id: string, confirm_toxic: boolean) =>
    api.post<Comment>("/moderation/verify", { comment_id, confirm_toxic }).then((r) => r.data),
  stats: (videoId: string) =>
    api.get<ModerationStats>(`/moderation/stats/${videoId}`).then((r) => r.data),
};
