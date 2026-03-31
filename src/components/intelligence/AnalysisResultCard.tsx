import type { IntelligenceReportResult } from "../../types/betIntelligence";

interface AnalysisResultCardProps {
  report: IntelligenceReportResult;
}

export function AnalysisResultCard({ report }: AnalysisResultCardProps) {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-2xl shadow-black/40">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">Bet Intelligence</p>
          <h3 className="mt-1 font-headline text-xl font-extrabold text-white">Analysis Report</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              report.final_verdict === "Bet"
                ? "bg-emerald-500/20 text-emerald-300"
                : report.final_verdict === "Lean"
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-slate-700/60 text-slate-300"
            }`}
          >
            {report.final_verdict}
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">Edge {report.edge_score}/10</span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">{report.confidence} confidence</span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Pick" value={report.pick} wide />
        <Metric label="Prediction" value={report.prediction} highlight={report.prediction === "HIT"} />
        <Metric label="Line" value={String(report.line)} />
        <Metric label="Projection" value={String(report.projection)} />
        <Metric label="Calibrated Hit Probability" value={pct(report.calibrated_hit_probability)} />
        <Metric label="Confidence" value={report.confidence} />
        <Metric label="Edge Score" value={`${report.edge_score} / 10`} />
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Main Reasons</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
          {report.main_reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">What Changed Today</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
          {report.what_changed_today.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hidden Edge</h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{report.hidden_edge}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trap Warning</h4>
        <p className="mt-2 text-sm font-bold text-white">{report.trap_warning ? "Yes" : "No"}</p>
        <p className="mt-1 text-sm text-slate-400">{report.trap_warning_reason}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Simulation Insight</h4>
        <p className="mt-2 text-sm text-slate-300">
          Expected range ≈ <span className="font-bold text-white">{report.simulation_low}</span> –{" "}
          <span className="font-bold text-white">{report.simulation_high}</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">Estimated hit frequency (band heuristic): {pct(report.estimated_hit_frequency)}</p>
        <p className="mt-2 text-xs italic text-slate-500">Volatility: outcomes can swing with minutes and game script — not a Monte Carlo live sim.</p>
      </section>

      <section>
        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300/80">Risk Flags</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
          {report.risk_flags.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-6 border-t border-slate-800 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Quality</p>
          <p className="mt-1 text-sm font-semibold text-white">{report.data_quality}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Best Time to Bet</p>
          <p className="mt-1 text-sm font-semibold text-emerald-300">{report.best_time_to_bet}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Verdict</p>
          <p className="mt-1 text-sm font-semibold text-white">{report.final_verdict}</p>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, wide, highlight }: { label: string; value: string; wide?: boolean; highlight?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-emerald-400" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}
