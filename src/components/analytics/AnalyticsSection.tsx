import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Bet } from "../../types/bets";
import { profitByMarketType } from "../../utils/analytics";

interface AnalyticsSectionProps {
  bets: Bet[];
}

export function AnalyticsSection({ bets }: AnalyticsSectionProps) {
  const byMarket = profitByMarketType(bets);
  const total = byMarket.reduce((sum, item) => sum + Math.abs(item.value), 0) || 1;
  const topThree = [...byMarket].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 3);

  return (
    <section className="rounded-xl bg-surface-container p-6">
      <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-on-surface-variant">Volume by Market</h3>
      <div className="space-y-6">
        {topThree.map((entry, index) => {
          const pct = Math.round((Math.abs(entry.value) / total) * 100);
          const colors = [
            { ring: "border-primary border-r-transparent border-b-transparent -rotate-45", bar: "bg-primary" },
            { ring: "border-secondary border-l-transparent border-t-transparent rotate-12", bar: "bg-secondary" },
            { ring: "border-tertiary border-opacity-40", bar: "bg-tertiary" },
          ][index] ?? { ring: "border-primary", bar: "bg-primary" };
          return (
            <div className="flex items-center gap-4" key={entry.label}>
              <div className={`h-12 w-12 rounded-full border-4 ${colors.ring}`} />
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-white">{entry.label.replaceAll("_", " ")}</span>
                  <span className="text-on-surface-variant">{pct}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-36 rounded-lg bg-surface-container-low p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topThree.map((item) => ({ ...item, value: Math.abs(item.value) }))}>
            <Tooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "#131b2e",
                borderColor: "#3d4a3d",
                borderRadius: "0.6rem",
                color: "#dae2fd",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#4be277" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
