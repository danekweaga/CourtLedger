import type { Bet } from "../../types/bets";
import { BetRowActions } from "./BetRowActions";
import { computeProfitForResult } from "../../utils/profit";

interface SettledBetsSectionProps {
  bets: Bet[];
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onDuplicate: (bet: Bet) => void;
  onQuickGrade: (bet: Bet, result: "win" | "loss" | "push") => void;
}

export function SettledBetsSection({ bets, onEdit, onDelete, onDuplicate, onQuickGrade }: SettledBetsSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">Recent Ledger</h3>
        <div className="flex gap-2">
          <button className="rounded-lg bg-surface-container-high p-1.5 text-on-surface-variant transition-colors hover:text-white">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
          <button className="rounded-lg bg-surface-container-high p-1.5 text-on-surface-variant transition-colors hover:text-white">
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
        </div>
      </div>
      {bets.length === 0 ? (
        <div className="rounded-xl bg-surface-container p-5 text-sm text-slate-400">No settled bets yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface-container">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/20 bg-surface-container-low text-on-surface-variant">
                <th className="px-6 py-4 text-xs font-semibold uppercase">Event / Market</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase">Risk/To Win</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase">Odds</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase">Result</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/10">
              {bets.map((bet) => {
                const profit = computeProfitForResult({
                  stake: bet.stake,
                  odds: bet.odds,
                  resultStatus: bet.result_status,
                  cashOutAmount: bet.cash_out_amount,
                });
                return (
                  <tr key={bet.id} className="transition-colors hover:bg-surface-container-high">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{bet.player_name || bet.matchup}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        {bet.matchup} - {bet.game_date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">${bet.stake.toFixed(2)}</div>
                      <div className="text-[10px] text-on-surface-variant">To win ${(bet.potential_payout - bet.stake).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${profit >= 0 ? "bg-primary/10 text-primary" : "bg-error/10 text-error"}`}>
                        {formatProfitPill(profit)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <BetRowActions
                        bet={bet}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onQuickGrade={onQuickGrade}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatProfitPill(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}
