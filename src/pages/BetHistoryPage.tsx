import { useMemo, useState } from "react";
import type { Bet } from "../types/bets";
import { computeProfitForResult } from "../utils/profit";
import { downloadCsv } from "../utils/exportCsv";
import { BetRowActions } from "../components/bets/BetRowActions";

interface BetHistoryPageProps {
  bets: Bet[];
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onDuplicate: (bet: Bet) => void;
  onQuickGrade: (bet: Bet, result: "win" | "loss" | "push") => void;
}

export function BetHistoryPage({ bets, onEdit, onDelete, onDuplicate, onQuickGrade }: BetHistoryPageProps) {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("all");
  const settled = useMemo(() => bets.filter((bet) => bet.result_status !== "pending"), [bets]);
  const sportsbooks = useMemo(() => Array.from(new Set(settled.map((bet) => bet.sportsbook).filter(Boolean))), [settled]);

  const filtered = useMemo(() => {
    return settled.filter((bet) => {
      if (resultFilter !== "all" && bet.result_status !== resultFilter) {
        return false;
      }
      if (bookFilter !== "all" && bet.sportsbook !== bookFilter) {
        return false;
      }
      if (search && !`${bet.player_name} ${bet.matchup} ${bet.market_type}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [settled, resultFilter, bookFilter, search]);

  const totalProfit = filtered.reduce(
    (sum, bet) =>
      sum +
      computeProfitForResult({
        stake: bet.stake,
        odds: bet.odds,
        resultStatus: bet.result_status,
        cashOutAmount: bet.cash_out_amount,
      }),
    0,
  );
  const winCount = filtered.filter((bet) => bet.result_status === "win").length;
  const lossCount = filtered.filter((bet) => bet.result_status === "loss").length;
  const roi = filtered.length ? (totalProfit / Math.max(filtered.reduce((sum, bet) => sum + bet.stake, 0), 1)) * 100 : 0;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard wide title="Total Ledger Profit" value={`${totalProfit >= 0 ? "+" : "-"}$${Math.abs(totalProfit).toFixed(2)}`} subtitle="Settled bets only" />
        <StatCard title="Win Rate" value={`${filtered.length ? ((winCount / filtered.length) * 100).toFixed(1) : "0.0"}%`} subtitle={`${winCount} Wins · ${lossCount} Losses`} />
        <StatCard title="Yield (ROI)" value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} subtitle="Tactical average" />
      </section>

      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full flex-wrap gap-3 md:w-auto">
            <div className="relative min-w-[240px] flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
              <input
                className="w-full rounded-full border-none bg-surface-container-lowest py-2 pl-10 pr-4 text-sm text-on-surface focus:ring-1 focus:ring-primary/30"
                placeholder="Search matchups or players..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="min-w-[150px] rounded-full border-none bg-surface-container-lowest px-4 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/30"
              value={resultFilter}
              onChange={(event) => setResultFilter(event.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="win">Wins Only</option>
              <option value="loss">Losses Only</option>
              <option value="push">Pushes</option>
              <option value="void">Voids</option>
              <option value="cash_out">Cash Out</option>
            </select>
            <select
              className="min-w-[170px] rounded-full border-none bg-surface-container-lowest px-4 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/30"
              value={bookFilter}
              onChange={(event) => setBookFilter(event.target.value)}
            >
              <option value="all">Sportsbook: All</option>
              {sportsbooks.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </div>
          <button
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            onClick={() => downloadCsv(`courtledger_history_${new Date().toISOString().slice(0, 10)}.csv`, filtered)}
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            Export to CSV
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-surface-container shadow-2xl shadow-surface-container-lowest/50">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-high/50">
                {["Date", "Matchup", "Market", "Odds", "Stake", "P/L", "Status", ""].map((header) => (
                  <th key={header} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filtered.map((bet) => {
                const profit = computeProfitForResult({
                  stake: bet.stake,
                  odds: bet.odds,
                  resultStatus: bet.result_status,
                  cashOutAmount: bet.cash_out_amount,
                });
                const isWin = profit >= 0;
                return (
                  <tr key={bet.id} className="group transition-colors hover:bg-surface-container-high">
                    <td className="px-6 py-5 text-sm font-medium">{bet.game_date}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{bet.matchup || bet.player_name}</span>
                        <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">{bet.team} vs {bet.opponent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm">{bet.market_type.replaceAll("_", " ")}</td>
                    <td className="px-6 py-5 text-center text-sm font-mono">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</td>
                    <td className="px-6 py-5 text-center text-sm font-bold">${bet.stake.toFixed(2)}</td>
                    <td className={`px-6 py-5 text-right text-sm font-bold ${isWin ? "text-primary" : "text-error"}`}>
                      {isWin ? "+" : "-"}${Math.abs(profit).toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`mx-auto block w-fit rounded-full border px-3 py-1 text-[10px] font-bold ${
                          isWin ? "border-primary/20 bg-primary/10 text-primary" : "border-error/20 bg-error/10 text-error"
                        }`}
                      >
                        {bet.result_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="opacity-0 transition-opacity group-hover:opacity-100">
                        <BetRowActions bet={bet} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onQuickGrade={onQuickGrade} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <button className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-[#002109] shadow-2xl shadow-primary/40 transition-transform active:scale-95 lg:bottom-10 lg:right-10">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}

function StatCard({ title, value, subtitle, wide = false }: { title: string; value: string; subtitle: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-surface-container p-6 ${wide ? "md:col-span-2" : ""}`}>
      <span className="label-md text-xs font-medium text-on-surface-variant">{title}</span>
      <h3 className="mt-4 font-headline text-4xl font-extrabold tracking-tighter text-primary">{value}</h3>
      <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
    </div>
  );
}
