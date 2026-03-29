import { useState } from "react";
import type { Bet } from "../types/bets";
import { StreamPanel } from "../components/stream/StreamPanel";
import { isValidHttpUrl, normalizeHttpUrl } from "../utils/url";

interface LiveCenterPageProps {
  activeBets: Bet[];
  selectedStreamBet: Bet | null;
  onSelectStream: (bet: Bet | null) => void;
  onManualLiveUpdate: (bet: Bet, value: number) => void;
}

export function LiveCenterPage({
  activeBets,
  selectedStreamBet,
  onSelectStream,
  onManualLiveUpdate,
}: LiveCenterPageProps) {
  const [draftUpdates, setDraftUpdates] = useState<Record<string, string>>({});

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-7">
        <header>
          <h3 className="font-headline text-2xl font-bold">Live Center</h3>
          <p className="text-sm text-on-surface-variant">
            Add stream links and update stats manually now. Auto live scores can be plugged in later through `liveDataProvider`.
          </p>
        </header>

        {activeBets.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-sm text-on-surface-variant">
            No active bets to track right now.
          </div>
        ) : (
          <div className="space-y-3">
            {activeBets.map((bet) => (
              <article key={bet.id} className="rounded-xl border border-outline-variant/15 bg-surface-container p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-on-surface">{bet.player_name || bet.matchup}</p>
                    <p className="text-xs text-on-surface-variant">
                      {bet.matchup} · {bet.market_type.replaceAll("_", " ")} · {bet.over_under ?? ""} {bet.line ?? "-"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Current: {bet.current_stat_value ?? "-"} · Remaining: {bet.target_remaining ?? "-"} · {bet.game_status ?? "Live"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isValidHttpUrl(bet.stream_url) ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
                          onClick={() => onSelectStream(bet)}
                        >
                          View In Panel
                        </button>
                        <a
                          href={normalizeHttpUrl(bet.stream_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
                        >
                          Open Stream Link
                        </a>
                      </>
                    ) : (
                      <span className="rounded-lg bg-surface-container-high px-3 py-2 text-xs text-rose-300">
                        No valid stream URL saved for this bet
                      </span>
                    )}
                    {isValidHttpUrl(bet.stat_source_url) ? (
                      <a
                        href={normalizeHttpUrl(bet.stat_source_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
                      >
                        Open Stat Source
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    className="w-40 rounded-lg border-none bg-surface-container-lowest px-3 py-2 text-sm text-on-surface ring-1 ring-transparent placeholder:text-on-surface-variant focus:ring-primary/40"
                    type="number"
                    step="0.1"
                    placeholder="Live stat value"
                    value={draftUpdates[bet.id] ?? ""}
                    onChange={(event) =>
                      setDraftUpdates((prev) => ({
                        ...prev,
                        [bet.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-[#002109]"
                    onClick={() => {
                      const nextValue = Number(draftUpdates[bet.id]);
                      if (Number.isFinite(nextValue)) {
                        onManualLiveUpdate(bet, nextValue);
                      }
                    }}
                  >
                    Save Live Update
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lg:col-span-5">
        <StreamPanel selectedBet={selectedStreamBet} onClose={() => onSelectStream(null)} />
        {!selectedStreamBet ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 text-sm text-on-surface-variant">
            Pick an active bet with a stream URL to view the embedded stream panel here.
          </div>
        ) : null}
      </section>
    </div>
  );
}
