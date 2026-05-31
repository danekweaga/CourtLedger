import { useCallback, useEffect, useState } from "react";
import {
  fetchNbaHighlights,
  highlightEmbedUrl,
  highlightWatchUrl,
  type HighlightVideo,
} from "../lib/youtubeHighlightsService";

export function LiveCenterPage() {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHighlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchNbaHighlights();
      setHighlights(items);
    } catch (e) {
      setHighlights([]);
      setError(e instanceof Error ? e.message : "Could not load highlights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHighlights();
  }, [loadHighlights]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-400/90">NBA · Official clips</p>
          <h1 className="font-headline text-3xl font-extrabold text-white md:text-4xl">Highlight Hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Recent highlight uploads from the official NBA YouTube channel. Refresh to pull the latest clips.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadHighlights()}
          className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-bold text-rose-200 ring-1 ring-rose-500/35 hover:bg-rose-500/30 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh highlights"}
        </button>
      </header>

      {loading && highlights.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadHighlights()} />
      ) : highlights.length === 0 ? (
        <EmptyState onRetry={() => void loadHighlights()} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {highlights.map((clip) => (
            <HighlightCard key={clip.videoId} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightCard({ clip }: { clip: HighlightVideo }) {
  const published = new Date(clip.publishedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
      <div className="aspect-video w-full bg-black">
        <iframe
          className="h-full w-full"
          src={highlightEmbedUrl(clip.videoId)}
          title={clip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="space-y-2 p-4">
        <h2 className="font-headline text-base font-bold leading-snug text-white">{clip.title}</h2>
        <p className="text-xs text-slate-500">
          {clip.channelTitle} · {published}
        </p>
        <a
          href={highlightWatchUrl(clip.videoId)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs font-semibold text-rose-300 hover:underline"
        >
          Open on YouTube
        </a>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <span className="material-symbols-outlined animate-pulse text-4xl text-slate-600">play_circle</span>
      <p className="mt-4 font-headline text-lg font-bold text-slate-400">Loading highlights…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 text-center">
      <p className="font-headline text-lg font-bold text-rose-200">Could not load highlights</p>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <p className="font-headline text-lg font-bold text-slate-400">No highlights found</p>
      <p className="mt-2 text-sm text-slate-500">The official NBA channel may not have recent highlight uploads right now.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700"
      >
        Refresh
      </button>
    </div>
  );
}
