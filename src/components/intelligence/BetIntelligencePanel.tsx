import type { BetIntelligenceScenarioInput } from "../../types/betIntelligence";
import { NBA_MARKETS } from "../../constants/markets";

const field =
  "w-full rounded-lg border-none bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-800 placeholder:text-slate-600 focus:ring-emerald-500/40";

interface BetIntelligencePanelProps {
  scenario: BetIntelligenceScenarioInput;
  onChange: (next: BetIntelligenceScenarioInput) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

export function BetIntelligencePanel({ scenario, onChange, onAnalyze, analyzing }: BetIntelligencePanelProps) {
  const set = <K extends keyof BetIntelligenceScenarioInput>(key: K, value: BetIntelligenceScenarioInput[K]) => {
    onChange({ ...scenario, [key]: value });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">Manual scenario</p>
          <h3 className="font-headline text-lg font-bold text-white">Build your prop</h3>
          <p className="mt-1 text-xs text-slate-500">NBA only. Add context — the engine stays conservative when data is thin.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Player</span>
          <input className={field} value={scenario.player_name} onChange={(e) => set("player_name", e.target.value)} placeholder="e.g. Tyrese Haliburton" />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Team</span>
          <input className={field} value={scenario.team} onChange={(e) => set("team", e.target.value)} placeholder="IND" />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Opponent</span>
          <input className={field} value={scenario.opponent} onChange={(e) => set("opponent", e.target.value)} placeholder="MIL" />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Market type</span>
          <select className={field} value={scenario.market_type} onChange={(e) => set("market_type", e.target.value)}>
            {NBA_MARKETS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Over / Under</span>
          <select
            className={field}
            value={scenario.over_under ?? ""}
            onChange={(e) => set("over_under", e.target.value === "" ? null : (e.target.value as "over" | "under"))}
          >
            <option value="">N/A</option>
            <option value="over">Over</option>
            <option value="under">Under</option>
          </select>
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Sportsbook line</span>
          <input className={field} type="number" step="0.5" value={scenario.line} onChange={(e) => set("line", Number(e.target.value))} />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Opening line</span>
          <input
            className={field}
            type="number"
            step="0.5"
            value={scenario.opening_line ?? ""}
            onChange={(e) => set("opening_line", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Optional"
          />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Current odds (American)</span>
          <input className={field} type="number" value={scenario.current_odds} onChange={(e) => set("current_odds", Number(e.target.value))} />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Home / Away</span>
          <select
            className={field}
            value={scenario.home_away ?? ""}
            onChange={(e) =>
              set("home_away", e.target.value === "" ? undefined : (e.target.value as BetIntelligenceScenarioInput["home_away"]))
            }
          >
            <option value="">Unknown</option>
            <option value="home">Home</option>
            <option value="away">Away</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Rest days (team)</span>
          <input
            className={field}
            type="number"
            min={0}
            max={7}
            value={scenario.rest_days ?? ""}
            onChange={(e) => set("rest_days", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Optional"
          />
        </label>
        <label>
          <span className="text-[10px] font-bold uppercase text-slate-500">Opp. pace rank (1 = fastest)</span>
          <input
            className={field}
            type="number"
            min={1}
            max={30}
            value={scenario.opponent_pace_rank ?? ""}
            onChange={(e) => set("opponent_pace_rank", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Optional"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Recent form (manual)</span>
          <textarea
            className={`${field} min-h-[72px]`}
            value={scenario.recent_form ?? ""}
            onChange={(e) => set("recent_form", e.target.value)}
            placeholder="e.g. L5 avg 27.4 ppg, or avg 24.5"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Injury / availability</span>
          <textarea className={`${field} min-h-[56px]`} value={scenario.injury_context ?? ""} onChange={(e) => set("injury_context", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Role / lineup notes</span>
          <textarea className={`${field} min-h-[56px]`} value={scenario.role_shift_notes ?? ""} onChange={(e) => set("role_shift_notes", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Matchup notes</span>
          <textarea className={`${field} min-h-[56px]`} value={scenario.matchup_notes ?? ""} onChange={(e) => set("matchup_notes", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Extra notes</span>
          <textarea className={`${field} min-h-[56px]`} value={scenario.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>

      <button
        type="button"
        disabled={analyzing || !scenario.player_name.trim()}
        onClick={onAnalyze}
        className="primary-gradient mt-6 w-full rounded-xl py-3 text-sm font-extrabold text-[#003915] shadow-lg disabled:opacity-50"
      >
        {analyzing ? "Analyzing…" : "Analyze Bet"}
      </button>
    </div>
  );
}
