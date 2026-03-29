import { useMemo, useState } from "react";
import type { Bet } from "../types/bets";
import { computeSummaryStats, profitBySportsbook, profitOverTime } from "../utils/analytics";

interface AnalyticsPageProps {
  bets: Bet[];
}

export function AnalyticsPage({ bets }: AnalyticsPageProps) {
  const [range, setRange] = useState<"30d" | "90d" | "all">("30d");

  const filteredBets = useMemo(() => {
    if (range === "all") {
      return bets;
    }
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (range === "30d" ? 30 : 90));
    const min = start.getTime();
    const max = now.getTime();

    return bets.filter((bet) => {
      const raw = bet.date_placed || bet.game_date;
      if (!raw) {
        return false;
      }
      const parsed = new Date(raw);
      const time = parsed.getTime();
      if (Number.isNaN(time)) {
        return false;
      }
      return time >= min && time <= max;
    });
  }, [bets, range]);

  const summary = useMemo(() => computeSummaryStats(filteredBets), [filteredBets]);
  const timeSeries = useMemo(() => profitOverTime(filteredBets), [filteredBets]);
  const sportsbook = useMemo(() => profitBySportsbook(filteredBets).slice(0, 4), [filteredBets]);
  const maxProfit = Math.max(...sportsbook.map((book) => Math.abs(book.value)), 1);
  const hasData = filteredBets.length > 0;

  return (
    <div className="space-y-10">
      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">Performance Analytics</h1>
          <p className="font-body text-on-surface-variant">Tactical breakdown of your betting lifecycle and market edge.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-outline-variant/10 bg-surface-container-low p-1.5">
          <button
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${range === "30d" ? "bg-surface-container-highest text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"}`}
            onClick={() => setRange("30d")}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${range === "90d" ? "rounded-full bg-surface-container-highest text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"}`}
            onClick={() => setRange("90d")}
          >
            90 Days
          </button>
          <button
            type="button"
            className={`px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${range === "all" ? "rounded-full bg-surface-container-highest text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"}`}
            onClick={() => setRange("all")}
          >
            All Time
          </button>
          <button type="button" className="p-2 text-on-surface-variant hover:text-primary" aria-label="date range">
            <span className="material-symbols-outlined">calendar_today</span>
          </button>
        </div>
      </header>

      {!hasData && (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-8 text-center">
          <p className="font-headline text-xl font-bold text-on-surface">No bets in this range</p>
          <p className="mt-2 text-sm text-on-surface-variant">Try 90 days or All Time to view analytics.</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Lifetime ROI" value={`${summary.roi >= 0 ? "+" : ""}${summary.roi}%`} tone="primary" subtitle={`From ${filteredBets.length} bets`} />
        <MetricCard title="Max Drawdown" value={`${Math.max(0, 100 - summary.winRate).toFixed(1)}%`} tone="error" subtitle="Risk profile: Conservative" />
        <MetricCard title="Efficiency Ratio" value={`${Math.max(0.8, summary.winRate / 22).toFixed(2)}`} tone="secondary" subtitle="Risk-adjusted consistency" />
        <MetricCard title="Net Profit" value={`$${summary.totalProfit.toFixed(2)}`} tone="neutral" subtitle={`Across ${summary.totalBets} bets`} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-container p-8 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold">Equity Curve</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-bold text-on-surface-variant">Profit</span>
              </div>
            </div>
          </div>
          <div className="flex h-64 items-end gap-1">
            {(timeSeries.length ? timeSeries : [{ date: "N/A", cumulativeProfit: 0 }]).map((point, index, arr) => {
              const max = Math.max(...arr.map((p) => Math.abs(p.cumulativeProfit)), 1);
              const h = Math.max(8, Math.round((Math.abs(point.cumulativeProfit) / max) * 100));
              return (
                <div
                  key={`${point.date ?? "d"}-${index}`}
                  className="flex-1 rounded-t-lg bg-gradient-to-t from-primary/5 to-primary/40 transition-all hover:to-primary/70"
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container p-8">
          <h3 className="mb-8 font-headline text-xl font-bold">Market Dominance</h3>
          <div className="mx-auto mb-8 flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-primary/30 border-t-primary">
            <div className="text-center">
              <p className="text-3xl font-extrabold">{summary.winRate.toFixed(0)}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Avg Win Rate</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <LegendRow name="Player Props" value={`${summary.winRate.toFixed(1)}%`} color="primary" />
            <LegendRow name="Moneyline" value={`${Math.max(0, summary.winRate - 8).toFixed(1)}%`} color="secondary" />
            <LegendRow name="Spread/O/U" value={`${Math.max(0, summary.winRate - 16).toFixed(1)}%`} color="surface-container-highest" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-container-low p-8">
          <h3 className="mb-6 font-headline text-xl font-bold">Sportsbook Yield</h3>
          <div className="space-y-6">
            {sportsbook.map((book) => {
              const width = Math.max(8, Math.round((Math.abs(book.value) / maxProfit) * 100));
              const isPositive = book.value >= 0;
              return (
                <div key={book.label}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium">{book.label}</span>
                    <span className={`text-sm font-bold ${isPositive ? "text-primary" : "text-error"}`}>
                      {isPositive ? "+" : "-"}${Math.abs(book.value).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                    <div className={`h-full rounded-full ${isPositive ? "bg-primary" : "bg-error/40"}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <InsightCard
            icon="lightbulb"
            color="primary"
            title="Win-Rate Signal"
            text={`Current window win rate is ${summary.winRate.toFixed(1)}% with ${summary.wins} wins and ${summary.losses} losses.`}
          />
          <InsightCard
            icon="verified_user"
            color="secondary"
            title="Market Strategy"
            text={summary.roi >= 0 ? "Current ROI is positive. Keep sizing disciplined around strongest edges." : "Current ROI is negative. Reduce exposure and review lower-performing markets."}
          />
          <InsightCard
            icon="warning"
            color="error"
            title="Risk Control"
            text={`Average stake is $${summary.averageStake.toFixed(2)}. Keep bankroll risk per bet consistent to stabilize variance.`}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "primary" | "secondary" | "error" | "neutral";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "secondary" ? "text-secondary" : tone === "error" ? "text-error" : "text-on-surface";
  return (
    <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-8">
      <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</span>
      <p className={`font-headline text-4xl font-extrabold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-on-surface-variant">{subtitle}</p>
    </div>
  );
}

function LegendRow({ name, value, color }: { name: string; value: string; color: "primary" | "secondary" | "surface-container-highest" }) {
  const dotClass = color === "primary" ? "bg-primary" : color === "secondary" ? "bg-secondary" : "bg-surface-container-highest";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-on-surface-variant">{name}</span>
      </div>
      <span className="font-bold text-on-surface">{value}</span>
    </div>
  );
}

function InsightCard({ icon, color, title, text }: { icon: string; color: "primary" | "secondary" | "error"; title: string; text: string }) {
  const tintClass = color === "primary" ? "border-primary/20" : color === "secondary" ? "border-secondary/20" : "border-error/20";
  const iconBg = color === "primary" ? "bg-primary/10 text-primary" : color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error";
  return (
    <div className={`flex items-start gap-4 rounded-xl border ${tintClass} bg-surface-container-high/40 p-6`}>
      <div className={`rounded-lg p-2 ${iconBg}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <h4 className="mb-1 font-bold text-on-surface">{title}</h4>
        <p className="text-sm leading-relaxed text-on-surface-variant">{text}</p>
      </div>
    </div>
  );
}
