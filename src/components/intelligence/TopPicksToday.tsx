import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { BetIntelligenceScenarioInput } from "../../types/betIntelligence";
import { buildTopPicksTodayWithScenarios, summarizeSlate } from "../../lib/betIntelligenceEngine";
import { fetchNbaOddsSlateScenarios } from "../../lib/nbaOddsSlateService";
import { sampleBetIntelligenceScenarios } from "../../data/sampleBetIntelligence";
import { emptyIntelligenceScenario } from "../../utils/intelligenceForm";

interface TopPicksTodayProps {
  saveLoading?: boolean;
  onAddToTracker?: (scenario: BetIntelligenceScenarioInput) => Promise<void>;
}

const ODDS_LOAD_COOLDOWN_MS = 90_000;

export function TopPicksToday({ saveLoading = false, onAddToTracker }: TopPicksTodayProps) {
  const [rows, setRows] = useState<BetIntelligenceScenarioInput[]>(() => [emptyIntelligenceScenario(), emptyIntelligenceScenario()]);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [oddsCooldownUntil, setOddsCooldownUntil] = useState(0);
  const [, setOddsRepaint] = useState(0);
  useEffect(() => {
    if (Date.now() >= oddsCooldownUntil) {
      return;
    }
    const id = setInterval(() => {
      setOddsRepaint((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [oddsCooldownUntil]);

  const picksWithScenarios = useMemo(
    () => buildTopPicksTodayWithScenarios(rows.filter((r) => r.player_name.trim() && r.team.trim())),
    [rows],
  );
  const picks = useMemo(() => picksWithScenarios.map((x) => x.card), [picksWithScenarios]);
  const slateInsight = useMemo(() => summarizeSlate(picks, rows), [picks, rows]);

  function updateRow(index: number, patch: Partial<BetIntelligenceScenarioInput>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyIntelligenceScenario()]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function loadSamples() {
    setRows(sampleBetIntelligenceScenarios.map((s) => ({ ...s })));
  }

  async function loadTopFromOddsApi() {
    if (oddsLoading || Date.now() < oddsCooldownUntil) {
      return;
    }
    setOddsLoading(true);
    try {
      const out = await fetchNbaOddsSlateScenarios();
      if (out.scenarios.length === 0) {
        toast.error("No player props returned (off-season, API limits, or books not listing those markets).");
        return;
      }
      setRows(out.scenarios);
      const rem = out.odds_requests_remaining;
      toast.success(
        `Loaded ${out.scenarios.length} high implied-prob lines${rem != null ? ` · Odds API credits left: ${rem}` : ""}.`,
      );
      toast(out.disclaimer, { duration: 7000 });
      setOddsCooldownUntil(Date.now() + ODDS_LOAD_COOLDOWN_MS);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load odds slate.");
    } finally {
      setOddsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/90">Top Picks Today</p>
          <h3 className="font-headline text-lg font-bold text-white">Slate scanner</h3>
          <p className="mt-1 max-w-xl text-xs text-slate-500">
            Enter scenarios manually, load demos, or pull up to <span className="font-bold text-slate-300">5 board lines</span> ranked by
            devigged implied probability (points / rebounds / assists only). Uses one Odds API request per click — 90s cooldown to protect free
            tiers. Not betting advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={oddsLoading || Date.now() < oddsCooldownUntil}
            onClick={() => void loadTopFromOddsApi()}
            className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-200 ring-1 ring-cyan-500/35 hover:bg-cyan-500/30 disabled:opacity-50"
          >
            {oddsLoading ? "Loading odds…" : Date.now() < oddsCooldownUntil ? "Odds cooldown…" : "Load top 5 from odds"}
          </button>
          <button type="button" onClick={loadSamples} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300">
            Load samples
          </button>
          <button type="button" onClick={addRow} className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300">
            Add row
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-600">Slate row {i + 1}</span>
              <button type="button" onClick={() => removeRow(i)} className="text-[10px] text-rose-400 hover:underline">
                Remove
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                placeholder="Player"
                value={row.player_name}
                onChange={(e) => updateRow(i, { player_name: e.target.value })}
              />
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                placeholder="Team"
                value={row.team}
                onChange={(e) => updateRow(i, { team: e.target.value })}
              />
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                placeholder="Opp"
                value={row.opponent}
                onChange={(e) => updateRow(i, { opponent: e.target.value })}
              />
              <select
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                value={row.market_type}
                onChange={(e) => updateRow(i, { market_type: e.target.value })}
              >
                <option value="points">Points</option>
                <option value="rebounds">Rebounds</option>
                <option value="assists">Assists</option>
                <option value="threes_made">Threes</option>
                <option value="pra">PRA</option>
                <option value="total_points">Total</option>
              </select>
              <select
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                value={row.over_under ?? ""}
                onChange={(e) => updateRow(i, { over_under: e.target.value === "" ? null : (e.target.value as "over" | "under") })}
              >
                <option value="over">Over</option>
                <option value="under">Under</option>
              </select>
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                type="number"
                step="0.5"
                placeholder="Line"
                value={row.line}
                onChange={(e) => updateRow(i, { line: Number(e.target.value) })}
              />
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                type="number"
                placeholder="Open"
                value={row.opening_line ?? ""}
                onChange={(e) => updateRow(i, { opening_line: e.target.value === "" ? null : Number(e.target.value) })}
              />
              <input
                className="rounded-lg bg-slate-900 px-2 py-2 text-xs text-slate-200 ring-1 ring-slate-800"
                type="number"
                placeholder="Odds"
                value={row.current_odds}
                onChange={(e) => updateRow(i, { current_odds: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
      </div>

      {picks.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
          No picks cleared the quality bar. Tighten lines, add opening numbers and form, or use &quot;Load samples&quot;.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {picksWithScenarios.map(({ card: p, scenario }, idx) => (
            <article key={`${idx}-${p.pick}`} className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-headline text-sm font-bold text-white">{p.pick}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Line {p.line} · Proj {p.projection} · {((p.hit_probability ?? 0) * 100).toFixed(1)}% · {p.confidence} · Edge {p.edge_score}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {onAddToTracker && (
                    <button
                      type="button"
                      disabled={saveLoading}
                      onClick={() => void onAddToTracker(scenario)}
                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      Add to tracker
                    </button>
                  )}
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold text-cyan-300">{p.best_time_to_bet}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-600">Why it hits</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                    {p.why_it_hits.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-600">What changed today</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
                    {p.what_changed_today.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase text-slate-600">Hidden edge</p>
                  <p className="mt-1 text-xs text-slate-400">{p.hidden_edge}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase text-slate-600">Trap warning</p>
                  <p className="mt-1 text-xs text-slate-400">{p.trap_warning}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase text-slate-600">Risk</p>
                  <p className="mt-1 text-xs text-rose-200/80">{p.risk}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <footer className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Slate insight</p>
        <p className="mt-2 text-sm text-slate-300">{slateInsight}</p>
      </footer>
    </div>
  );
}
