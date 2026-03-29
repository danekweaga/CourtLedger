import { useMemo, useState } from "react";
import type { Bet } from "../../types/bets";
import { normalizeHttpUrl } from "../../utils/url";

interface StreamPanelProps {
  selectedBet: Bet | null;
  onClose: () => void;
}

export function StreamPanel({ selectedBet, onClose }: StreamPanelProps) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const streamUrl = selectedBet?.stream_url ?? "";
  const source = useMemo(() => {
    const normalized = normalizeHttpUrl(streamUrl);
    if (!normalized) {
      return "";
    }
    try {
      return new URL(normalized).toString();
    } catch {
      return "";
    }
  }, [streamUrl]);

  if (!selectedBet) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">Stream Panel</h2>
        <button className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="text-sm text-slate-400">
        {selectedBet.player_name} - {selectedBet.matchup}
      </p>
      {!source ? (
        <p className="mt-2 text-sm text-rose-300">Invalid stream URL.</p>
      ) : embedFailed ? (
        <div className="mt-3">
          <p className="text-sm text-slate-400">Embedding is blocked by the provider. Open in a new tab instead.</p>
          <a className="mt-2 inline-flex rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white" href={source} target="_blank" rel="noreferrer">
            Open Stream Link
          </a>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <a
            className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
            href={source}
            target="_blank"
            rel="noreferrer"
          >
            Open Stream In New Tab
          </a>
          <iframe
            className="h-72 w-full rounded-lg border border-slate-700"
            src={source}
            title="Bet stream"
            referrerPolicy="no-referrer"
            onError={() => setEmbedFailed(true)}
          />
        </div>
      )}
    </section>
  );
}
