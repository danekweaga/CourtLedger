import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Bet } from "../types/bets";
import type {
  BetIntelligenceReportRow,
  BetIntelligenceScenarioInput,
  IntelligenceReportResult,
} from "../types/betIntelligence";
import { analyzeBetIntelligence } from "../lib/betIntelligenceEngine";
import { rowToReportResult } from "../lib/betIntelligenceService";
import { BetIntelligencePanel } from "../components/intelligence/BetIntelligencePanel";
import { AnalysisResultCard } from "../components/intelligence/AnalysisResultCard";
import { TopPicksToday } from "../components/intelligence/TopPicksToday";
import { useIntelligenceReports } from "../hooks/useIntelligenceReports";
import { emptyIntelligenceScenario, parseInputSnapshot } from "../utils/intelligenceForm";

interface BetIntelligencePageProps {
  userId: string;
  bets: Bet[];
  saveLoading?: boolean;
  onAddFromIntelligence?: (
    scenario: BetIntelligenceScenarioInput,
    options?: { source?: "top_picks" | "intelligence_analysis"; report?: IntelligenceReportResult | null },
  ) => Promise<void>;
}

export function BetIntelligencePage({ userId, bets, saveLoading = false, onAddFromIntelligence }: BetIntelligencePageProps) {
  const navigate = useNavigate();
  const { reports, loading, saving, saveReport, removeReport } = useIntelligenceReports(userId);
  const [scenario, setScenario] = useState(emptyIntelligenceScenario);
  const [report, setReport] = useState<IntelligenceReportResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [attachBetId, setAttachBetId] = useState<string>("");

  function handleAnalyze() {
    setAnalyzing(true);
    try {
      const next = analyzeBetIntelligence(scenario);
      setReport(next);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleOpenSaved(row: BetIntelligenceReportRow) {
    setScenario(parseInputSnapshot(row.input_snapshot));
    setReport(rowToReportResult(row));
    setAttachBetId(row.bet_id ?? "");
  }

  async function handleSave() {
    if (!report) {
      return;
    }
    const betId = attachBetId === "" ? null : attachBetId;
    await saveReport(scenario, report, betId);
  }

  async function handleAddAnalysisToTracker() {
    if (!onAddFromIntelligence || !report) {
      return;
    }
    await onAddFromIntelligence(scenario, { source: "intelligence_analysis", report });
    navigate("/");
  }

  async function handleAddTopPickToTracker(s: BetIntelligenceScenarioInput) {
    if (!onAddFromIntelligence) {
      return;
    }
    await onAddFromIntelligence(s, { source: "top_picks" });
    navigate("/");
  }

  const pendingBets = bets.filter((b) => b.result_status === "pending");

  return (
    <div className="space-y-10 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">NBA · Sharp tools</p>
        <h1 className="font-headline text-3xl font-extrabold text-white md:text-4xl">Bet Intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Rule-based analysis from your manual inputs and live odds when available. Save reports to Supabase, attach to open bets, and revisit history anytime.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-5">
          <BetIntelligencePanel scenario={scenario} onChange={setScenario} onAnalyze={handleAnalyze} analyzing={analyzing} />

          {report && (
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Attach to open bet (optional)</span>
                <select
                  className="mt-1 w-full rounded-lg border-none bg-slate-950 px-3 py-2 text-sm text-slate-200 ring-1 ring-slate-800"
                  value={attachBetId}
                  onChange={(e) => setAttachBetId(e.target.value)}
                >
                  <option value="">None</option>
                  {pendingBets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.matchup || b.player_name} — {b.market_type} ({b.id.slice(0, 8)}…)
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save report"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReport(null);
                    setScenario(emptyIntelligenceScenario());
                    setAttachBetId("");
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-7">
          {report ? (
            <AnalysisResultCard
              report={report}
              saveLoading={saveLoading}
              onAddToTracker={onAddFromIntelligence ? () => void handleAddAnalysisToTracker() : undefined}
            />
          ) : (
            <PlaceholderCard />
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-headline text-sm font-bold text-white">Report history</h2>
              {loading && <span className="text-xs text-slate-500">Loading…</span>}
            </div>
            {reports.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No saved reports yet.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar">
                {reports.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-3 py-2 ring-1 ring-slate-800">
                    <button type="button" className="text-left text-xs text-slate-300 hover:text-white" onClick={() => handleOpenSaved(r)}>
                      <span className="font-semibold text-slate-100">{r.pick_text.slice(0, 72)}{r.pick_text.length > 72 ? "…" : ""}</span>
                      <span className="ml-2 text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                    </button>
                    <button
                      type="button"
                      className="text-[10px] font-bold uppercase text-rose-400 hover:underline"
                      onClick={() => void removeReport(r.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <TopPicksToday saveLoading={saveLoading} onAddToTracker={onAddFromIntelligence ? handleAddTopPickToTracker : undefined} />
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-600">psychology</span>
      <p className="mt-4 font-headline text-lg font-bold text-slate-400">Run an analysis</p>
      <p className="mt-2 max-w-md text-sm text-slate-600">Fill the scenario, then Analyze Bet. Reports stay structured — no chat wall.</p>
    </div>
  );
}
