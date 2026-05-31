export interface HighlightVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface HighlightsResponse {
  ok: boolean;
  timestamp: string;
  count?: number;
  highlights: HighlightVideo[];
  error?: string;
  hint?: string;
}

function normalizeHighlight(raw: unknown): HighlightVideo | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const videoId = typeof item.videoId === "string" ? item.videoId : "";
  const title = typeof item.title === "string" ? item.title : "";
  const publishedAt = typeof item.publishedAt === "string" ? item.publishedAt : "";
  if (!videoId || !title || !publishedAt) {
    return null;
  }
  return {
    videoId,
    title,
    publishedAt,
    channelTitle: typeof item.channelTitle === "string" ? item.channelTitle : "NBA",
    thumbnailUrl: typeof item.thumbnailUrl === "string" ? item.thumbnailUrl : "",
  };
}

export async function fetchNbaHighlights(): Promise<HighlightVideo[]> {
  const response = await fetch("/api/youtube-highlights");

  let payload: HighlightsResponse;
  try {
    payload = (await response.json()) as HighlightsResponse;
  } catch {
    throw new Error("Could not parse highlights response.");
  }

  if (!response.ok || !payload.ok) {
    const detail = payload.hint ? `${payload.error ?? "Failed to load highlights"}. ${payload.hint}` : payload.error;
    throw new Error(detail ?? `Failed to load highlights (HTTP ${response.status}).`);
  }

  return (payload.highlights ?? [])
    .map(normalizeHighlight)
    .filter((item): item is HighlightVideo => item !== null);
}

export function highlightEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
}

export function highlightWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
