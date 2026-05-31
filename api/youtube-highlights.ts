/** Official @NBA YouTube channel. Override with YOUTUBE_NBA_CHANNEL_ID if needed. */
const DEFAULT_NBA_CHANNEL_ID = "UCWJ2lWNubArHWmf3FIHbfcQ";

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      high?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  error?: { message?: string; code?: number };
};

export type HighlightVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  channelTitle: string;
  thumbnailUrl: string;
};

function readApiKey(): string {
  const key = process.env.YOUTUBE_DATA_API_KEY;
  if (!key) {
    throw new Error("Missing required server environment variable: YOUTUBE_DATA_API_KEY");
  }
  return key;
}

function normalizeHighlight(item: YouTubeSearchItem): HighlightVideo | null {
  const videoId = item.id?.videoId;
  const snippet = item.snippet;
  if (!videoId || !snippet?.title || !snippet.publishedAt) {
    return null;
  }

  const thumbnailUrl =
    snippet.thumbnails?.medium?.url ??
    snippet.thumbnails?.high?.url ??
    snippet.thumbnails?.default?.url ??
    "";

  return {
    videoId,
    title: snippet.title,
    publishedAt: snippet.publishedAt,
    channelTitle: snippet.channelTitle ?? "NBA",
    thumbnailUrl,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const timestamp = new Date().toISOString();

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({
      ok: false,
      timestamp,
      error: "Method not allowed",
    });
    return;
  }

  if (req.method === "HEAD") {
    res.status(200).json({ ok: true, timestamp });
    return;
  }

  try {
    const apiKey = readApiKey();
    const channelId = process.env.YOUTUBE_NBA_CHANNEL_ID ?? DEFAULT_NBA_CHANNEL_ID;

    const params = new URLSearchParams({
      part: "snippet",
      channelId,
      q: "highlights",
      type: "video",
      order: "date",
      maxResults: "12",
      key: apiKey,
    });

    const upstream = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error("[youtube-highlights] YouTube API error", upstream.status, body.slice(0, 300));
      res.status(502).json({
        ok: false,
        timestamp,
        error: "Failed to fetch highlights from YouTube",
      });
      return;
    }

    const payload = (await upstream.json()) as YouTubeSearchResponse;

    if (payload.error?.message) {
      console.error("[youtube-highlights] YouTube API payload error", payload.error.message);
      res.status(502).json({
        ok: false,
        timestamp,
        error: "YouTube API returned an error",
      });
      return;
    }

    const highlights = (payload.items ?? [])
      .map(normalizeHighlight)
      .filter((item): item is HighlightVideo => item !== null);

    res.status(200).json({
      ok: true,
      timestamp,
      count: highlights.length,
      highlights,
    });
  } catch (error) {
    console.error("[youtube-highlights] Request failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isConfig = message.includes("YOUTUBE_DATA_API_KEY");
    res.status(isConfig ? 503 : 500).json({
      ok: false,
      timestamp,
      error: isConfig ? "Highlight service is not configured" : "Failed to load highlights",
      hint: isConfig
        ? "Add YOUTUBE_DATA_API_KEY in Vercel → Project Settings → Environment Variables (Production), then redeploy."
        : undefined,
    });
  }
}
