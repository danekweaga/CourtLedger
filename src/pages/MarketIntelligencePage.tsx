import type { Bet } from "../types/bets";
import { profitByMarketType, computeSummaryStats } from "../utils/analytics";

interface MarketIntelligencePageProps {
  bets: Bet[];
}

export function MarketIntelligencePage({ bets }: MarketIntelligencePageProps) {
  const summary = computeSummaryStats(bets);
  const marketProfit = profitByMarketType(bets).slice(0, 8);
  const maxAbs = Math.max(...marketProfit.map((m) => Math.abs(m.value)), 1);
  const best = [...marketProfit].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-10 rounded-xl bg-mesh p-2">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">Market Intelligence</span>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">Tactical Outlook</h2>
          <p className="mt-2 max-w-xl text-on-surface-variant">
            Aggregated performance data across your NBA markets with confidence heatmap and trend diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-2">
          <span className="text-xs font-bold uppercase text-on-surface-variant">Timeframe</span>
          <select className="bg-transparent text-sm font-bold text-primary focus:outline-none">
            <option>Last 30 Days</option>
            <option>Season to Date</option>
            <option>Last 7 Days</option>
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border-l-2 border-primary bg-surface-container p-6 xl:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-headline text-xl font-bold">Market Profitability Heatmap</h3>
              <p className="mt-1 text-sm text-on-surface-variant">ROI distribution across core NBA categories</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">grid_view</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {marketProfit.map((market) => {
              const positive = market.value >= 0;
              const width = Math.max(8, Math.round((Math.abs(market.value) / maxAbs) * 100));
              return (
                <div
                  key={market.label}
                  className={`rounded-xl border p-4 transition-colors ${
                    positive
                      ? "border-primary/30 bg-primary/20 hover:bg-primary/30"
                      : "border-error/20 bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{market.label.replaceAll("_", " ")}</span>
                  <div className="mt-2 flex items-end justify-between">
                    <span className={`font-headline text-2xl font-extrabold ${positive ? "text-primary" : "text-on-surface"}`}>
                      {market.value >= 0 ? "+" : ""}
                      {market.value.toFixed(1)}%
                    </span>
                    <div className={`mb-2 h-2 rounded-full ${positive ? "bg-primary" : "bg-error"}`} style={{ width: `${width / 2}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-surface-container p-6">
          <div>
            <h3 className="mb-6 font-headline text-xl font-bold">Efficiency Comparison</h3>
            <div className="space-y-6">
              <BarMetric label="Player Props" value={summary.winRate} color="primary" />
              <BarMetric label="Game Totals" value={Math.max(0, summary.winRate - 11)} color="secondary" />
            </div>
          </div>
          <div className="mt-8 border-t border-outline-variant/20 pt-6">
            <p className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
              Strategy: Allocate more capital to your strongest market group.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-xl bg-surface-container p-6 xl:col-span-3">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-headline text-xl font-bold">Volume vs. Profit Analysis</h3>
              <p className="text-sm text-on-surface-variant">Identifying high-frequency profitable zones</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Net Profit</span>
            </div>
          </div>
          <div className="flex h-64 items-end gap-3 px-2">
            {(marketProfit.length ? marketProfit : [{ label: "none", value: 0 }]).map((item) => {
              const height = Math.max(14, Math.round((Math.abs(item.value) / maxAbs) * 100));
              return (
                <div key={item.label} className="group relative flex flex-1 flex-col items-center">
                  <div className="w-full rounded-t-lg bg-primary/40 transition-all group-hover:bg-primary/70" style={{ height: `${height}%` }} />
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{item.label.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-[#002109] xl:col-span-2">
          <span className="mb-4 inline-block rounded bg-[#002109] px-2 py-1 text-[10px] font-black tracking-widest text-primary">TOP PERFORMING</span>
          <h3 className="font-headline text-3xl font-extrabold">{best?.label?.replaceAll("_", " ") ?? "N/A"}</h3>
          <p className="text-sm font-medium text-[#003915]/80">Market Dominance Score: {Math.min(99, Math.round(summary.winRate + 30))}/100</p>
          <div className="mt-10 space-y-6">
            <div className="border-b border-[#003915]/20 pb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#003915]/70">Win Rate</p>
              <p className="font-headline text-4xl font-black">{summary.winRate.toFixed(1)}%</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#003915]/70">Avg. Odds</p>
                <p className="font-headline text-xl font-bold">{summary.averageOdds > 0 ? `+${summary.averageOdds}` : summary.averageOdds}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#003915]/70">Total ROI</p>
                <p className="font-headline text-xl font-bold">{summary.roi >= 0 ? "+" : ""}{summary.roi}%</p>
              </div>
            </div>
          </div>
          <button className="mt-8 w-full rounded-xl bg-[#002109] py-4 font-bold text-primary transition-colors hover:bg-black/40">
            View Detailed Prop History
          </button>
        </div>
      </div>
    </div>
  );
}

function BarMetric({ label, value, color }: { label: string; value: number; color: "primary" | "secondary" }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className={`text-sm font-bold ${color === "primary" ? "text-primary" : "text-secondary"}`}>{value.toFixed(1)}% Win Rate</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-lowest">
        <div className={`h-full ${color === "primary" ? "bg-primary" : "bg-secondary"}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
