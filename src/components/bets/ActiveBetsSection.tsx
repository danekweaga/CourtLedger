import { useState } from "react";
import type { Bet } from "../../types/bets";
import { calculateProgressPercentage } from "../../utils/progress";
import { getHitStateLabel } from "../../utils/grading";
import { BetRowActions } from "./BetRowActions";

interface ActiveBetsSectionProps {
  bets: Bet[];
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onDuplicate: (bet: Bet) => void;
  onQuickGrade: (bet: Bet, result: "win" | "loss" | "push") => void;
  onManualLiveUpdate: (bet: Bet, currentStat: number) => void;
  onSelectStream: (bet: Bet) => void;
}

export function ActiveBetsSection({
  bets,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickGrade,
  onManualLiveUpdate,
  onSelectStream,
}: ActiveBetsSectionProps) {
  const [draftUpdates, setDraftUpdates] = useState<Record<string, string>>({});

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          Live Props
        </h3>
        <button className="text-xs font-bold text-primary">View All Live</button>
      </div>
      {bets.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-5 text-sm text-slate-400">No active bets right now.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bets.map((bet) => {
            const progress = calculateProgressPercentage(bet.line, bet.current_stat_value, bet.over_under);
            const status = getHitStateLabel(bet);
            return (
              <article key={bet.id} className="rounded-xl border border-slate-700/20 bg-surface-container p-5">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white">{bet.player_name || "Team/Game Bet"}</h4>
                    <p className="text-[10px] text-on-surface-variant">
                      {bet.over_under ? `${bet.over_under.toUpperCase()} ` : ""}
                      {bet.line ?? "-"} {bet.market_type.replaceAll("_", " ")} vs {bet.opponent || "-"}
                    </p>
                    {bet.auto_settle_enabled && (
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-cyan-400/90">Auto-settle on</p>
                    )}
                    {bet.auto_settle_error ? (
                      <p className="mt-1 text-[9px] text-amber-300/90" title={bet.auto_settle_error}>
                        Settle note: {bet.auto_settle_error.length > 80 ? `${bet.auto_settle_error.slice(0, 80)}…` : bet.auto_settle_error}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">LIVE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span>
                      {(bet.current_stat_value ?? 0).toFixed(1)} / {(bet.line ?? 0).toFixed(1)} {bet.market_type.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-secondary">{status}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(progress, 4)}%` }} />
                  </div>
                  <div className="flex justify-between pt-1 text-[9px] text-on-surface-variant">
                    <span>{bet.game_status ?? "Live"}</span>
                    <span className="font-bold italic text-primary-container">{bet.target_remaining !== null && bet.target_remaining <= 2 ? "VERY CLOSE" : "ON PACE"}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    className="rounded-lg border-none bg-surface-container-lowest px-2 py-1 text-xs text-slate-100"
                    placeholder="Update stat"
                    type="number"
                    step="0.1"
                    value={draftUpdates[bet.id] ?? ""}
                    onChange={(event) => setDraftUpdates((prev) => ({ ...prev, [bet.id]: event.target.value }))}
                  />
                  <button
                    className="rounded-lg bg-surface-container-high px-2 py-1 text-xs text-slate-200"
                    onClick={() => {
                      const value = Number(draftUpdates[bet.id]);
                      if (Number.isFinite(value)) {
                        onManualLiveUpdate(bet, value);
                      }
                    }}
                  >
                    Save Live Update
                  </button>
                  {bet.stream_url && (
                    <button className="rounded-lg bg-surface-container-high px-2 py-1 text-xs text-slate-200" onClick={() => onSelectStream(bet)}>
                      Open Stream
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <BetRowActions
                    bet={bet}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onQuickGrade={onQuickGrade}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
