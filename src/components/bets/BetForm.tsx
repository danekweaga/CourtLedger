import type { FormEvent } from "react";
import { BET_CATEGORIES, LIVE_STATUSES, NBA_MARKETS, RESULT_STATUSES } from "../../constants/markets";
import type { Bet, BetDraft } from "../../types/bets";
import { computePotentialPayout } from "../../utils/profit";
import { BetSlipScanner } from "./BetSlipScanner";

interface BetFormProps {
  editingBet: Bet | null;
  draft: BetDraft;
  onChange: (draft: BetDraft) => void;
  onSubmit: (draft: BetDraft) => Promise<void>;
  onCancelEdit: () => void;
  loading: boolean;
}

const fieldClass =
  "w-full rounded-lg border-none bg-surface-container-lowest px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent placeholder:text-slate-500 focus:ring-primary/40";

export function BetForm({ editingBet, draft, onChange, onSubmit, onCancelEdit, loading }: BetFormProps) {
  const setValue = <K extends keyof BetDraft>(key: K, value: BetDraft[K]) => {
    const next = { ...draft, [key]: value };
    if (key === "stake" || key === "odds") {
      next.potential_payout = computePotentialPayout(Number(next.stake), Number(next.odds));
    }
    onChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(draft);
  };

  return (
    <section className="rounded-xl border border-primary/10 bg-surface-container p-6 shadow-lg">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <span className="material-symbols-outlined text-primary">add_circle</span>
        {editingBet ? "Edit Position" : "Log New Position"}
      </h3>
      {!editingBet && <BetSlipScanner draft={draft} onApplyPatch={onChange} disabled={loading} />}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Market Type</label>
          <div className="grid grid-cols-2 gap-2">
            <select className={fieldClass} value={draft.bet_category} onChange={(e) => setValue("bet_category", e.target.value as BetDraft["bet_category"])}>
              {BET_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select className={fieldClass} value={draft.market_type} onChange={(e) => setValue("market_type", e.target.value as BetDraft["market_type"])}>
              {NBA_MARKETS.map((market) => (
                <option key={market.value} value={market.value}>
                  {market.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Selection</label>
          <input className={fieldClass} placeholder="e.g. LeBron O 24.5 PTS vs GSW" value={draft.matchup} onChange={(e) => setValue("matchup", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Stake ($)</label>
            <input className={fieldClass} type="number" step="0.01" value={draft.stake} onChange={(e) => setValue("stake", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Odds</label>
            <input className={fieldClass} type="number" value={draft.odds} onChange={(e) => setValue("odds", Number(e.target.value))} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 text-xs">
          <span className="text-on-surface-variant">Potential Payout</span>
          <span className="font-bold text-primary">${draft.potential_payout.toFixed(2)}</span>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/15 bg-surface-container-low/80 px-3 py-3 text-xs text-slate-200">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-slate-600"
            checked={draft.auto_settle_enabled}
            onChange={(e) => setValue("auto_settle_enabled", e.target.checked)}
          />
          <span>
            <span className="font-bold text-primary">Auto-settle</span> from NBA box scores when the game goes final (supported player props only: points, rebounds,
            assists, threes, PRA, steals, blocks, turnovers). Requires the sync job and a balldontlie API key in Supabase.
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input className={fieldClass} placeholder="Player Name" value={draft.player_name} onChange={(e) => setValue("player_name", e.target.value)} />
          <input className={fieldClass} placeholder="Sportsbook" value={draft.sportsbook} onChange={(e) => setValue("sportsbook", e.target.value)} />
          <input className={fieldClass} placeholder="Team" value={draft.team} onChange={(e) => setValue("team", e.target.value)} />
          <input className={fieldClass} placeholder="Opponent" value={draft.opponent} onChange={(e) => setValue("opponent", e.target.value)} />
          <input className={fieldClass} type="date" value={draft.date_placed} onChange={(e) => setValue("date_placed", e.target.value)} />
          <input className={fieldClass} type="date" value={draft.game_date} onChange={(e) => setValue("game_date", e.target.value)} />
          <select className={fieldClass} value={draft.over_under ?? "over"} onChange={(e) => setValue("over_under", e.target.value as BetDraft["over_under"])}>
            <option value="over">Over</option>
            <option value="under">Under</option>
          </select>
          <input className={fieldClass} type="number" step="0.5" placeholder="Line" value={draft.line ?? ""} onChange={(e) => setValue("line", Number(e.target.value))} />
        </div>

        <details className="rounded-lg border border-slate-700/40 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Advanced Fields</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select className={fieldClass} value={draft.result_status} onChange={(e) => setValue("result_status", e.target.value as BetDraft["result_status"])}>
              {RESULT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select className={fieldClass} value={draft.live_status} onChange={(e) => setValue("live_status", e.target.value as BetDraft["live_status"])}>
              {LIVE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input className={fieldClass} placeholder="Current Stat Value" value={draft.current_stat_value ?? ""} onChange={(e) => setValue("current_stat_value", e.target.value ? Number(e.target.value) : null)} />
            <input className={fieldClass} placeholder="Target Remaining" value={draft.target_remaining ?? ""} onChange={(e) => setValue("target_remaining", e.target.value ? Number(e.target.value) : null)} />
            <input className={fieldClass} placeholder="Stream URL" value={draft.stream_url ?? ""} onChange={(e) => setValue("stream_url", e.target.value)} />
            <input className={fieldClass} placeholder="Stat Source URL" value={draft.stat_source_url ?? ""} onChange={(e) => setValue("stat_source_url", e.target.value)} />
            <input className={fieldClass} placeholder="Season" value={draft.season ?? ""} onChange={(e) => setValue("season", e.target.value)} />
            <select className={fieldClass} value={draft.season_type ?? "regular_season"} onChange={(e) => setValue("season_type", e.target.value as BetDraft["season_type"])}>
              <option value="regular_season">Regular Season</option>
              <option value="playoffs">Playoffs</option>
            </select>
            <select className={fieldClass} value={draft.bet_timing} onChange={(e) => setValue("bet_timing", e.target.value as BetDraft["bet_timing"])}>
              <option value="pregame">Pregame</option>
              <option value="live">Live</option>
            </select>
            <input className={fieldClass} type="number" step="0.1" placeholder="Units Staked" value={draft.units_staked ?? ""} onChange={(e) => setValue("units_staked", e.target.value ? Number(e.target.value) : null)} />
            <input className={fieldClass} type="number" step="0.01" placeholder="Cash Out Amount" value={draft.cash_out_amount ?? ""} onChange={(e) => setValue("cash_out_amount", e.target.value ? Number(e.target.value) : null)} />
            <input className={fieldClass} placeholder="Game Status" value={draft.game_status ?? ""} onChange={(e) => setValue("game_status", e.target.value)} />
            <input className={fieldClass} placeholder="Player Active Status" value={draft.player_active_status ?? ""} onChange={(e) => setValue("player_active_status", e.target.value)} />
            <input
              className={fieldClass}
              type="number"
              placeholder="Stats API player id (optional)"
              value={draft.stats_player_id ?? ""}
              onChange={(e) => setValue("stats_player_id", e.target.value === "" ? null : Number(e.target.value))}
            />
            <input
              className={fieldClass}
              type="number"
              placeholder="Stats API game id (optional)"
              value={draft.stats_game_id ?? ""}
              onChange={(e) => setValue("stats_game_id", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <textarea className={`${fieldClass} mt-2`} rows={2} placeholder="Notes" value={draft.notes ?? ""} onChange={(e) => setValue("notes", e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.is_parlay_leg} onChange={(e) => setValue("is_parlay_leg", e.target.checked)} />
              Is parlay leg
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.is_free_bet} onChange={(e) => setValue("is_free_bet", e.target.checked)} />
              Free bet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.promo_toggle} onChange={(e) => setValue("promo_toggle", e.target.checked)} />
              Promo toggle
            </label>
          </div>
        </details>

        <button
          type="submit"
          disabled={loading}
          className="primary-gradient w-full rounded-xl py-3 text-sm font-extrabold text-[#003915] shadow-xl shadow-primary/10 transition-transform hover:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Saving..." : editingBet ? "Update Bet" : "Confirm Bet"}
        </button>
        {editingBet && (
          <button type="button" className="w-full rounded-xl border border-slate-700 py-2 text-sm text-slate-300" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </form>
    </section>
  );
}
