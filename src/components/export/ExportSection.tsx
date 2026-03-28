import { useMemo, useState } from "react";
import type { Bet } from "../../types/bets";
import { downloadCsv } from "../../utils/exportCsv";
import { downloadXlsx } from "../../utils/exportXlsx";

interface ExportSectionProps {
  allBets: Bet[];
}

export function ExportSection({ allBets }: ExportSectionProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState("");
  const [market, setMarket] = useState("");

  const filtered = useMemo(() => {
    return allBets.filter((bet) => {
      if (from && bet.game_date < from) {
        return false;
      }
      if (to && bet.game_date > to) {
        return false;
      }
      if (result && bet.result_status !== result) {
        return false;
      }
      if (market && bet.market_type !== market) {
        return false;
      }
      return true;
    });
  }, [allBets, from, to, result, market]);

  return (
    <section className="rounded-xl border border-slate-700/20 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-surface-container-high p-2">
          <span className="material-symbols-outlined text-on-surface-variant">csv</span>
        </div>
        <div>
          <p className="text-xs font-bold text-white">Tax Export</p>
          <p className="text-[10px] text-on-surface-variant">Download and filter your ledger</p>
        </div>
      </div>
      <div className="grid gap-2">
        <input className="rounded-lg border-none bg-surface-container-lowest px-2 py-2 text-xs text-slate-100" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="rounded-lg border-none bg-surface-container-lowest px-2 py-2 text-xs text-slate-100" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="rounded-lg border-none bg-surface-container-lowest px-2 py-2 text-xs text-slate-100" value={result} onChange={(e) => setResult(e.target.value)}>
          <option value="">All Results</option>
          <option value="win">Wins Only</option>
          <option value="loss">Losses Only</option>
          <option value="push">Pushes</option>
          <option value="void">Voids</option>
          <option value="cash_out">Cash Out</option>
        </select>
        <input
          className="rounded-lg border-none bg-surface-container-lowest px-2 py-2 text-xs text-slate-100"
          placeholder="Market type (e.g. points)"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-slate-200"
          onClick={() => downloadCsv(`courtledger_all_${new Date().toISOString().slice(0, 10)}.csv`, allBets)}
        >
          All CSV
        </button>
        <button
          className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-slate-200"
          onClick={() => downloadXlsx(`courtledger_all_${new Date().toISOString().slice(0, 10)}.xlsx`, allBets)}
        >
          All XLSX
        </button>
        <button
          className="rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary"
          onClick={() => downloadCsv(`courtledger_filtered_${new Date().toISOString().slice(0, 10)}.csv`, filtered)}
        >
          Filter CSV ({filtered.length})
        </button>
        <button
          className="rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary"
          onClick={() => downloadXlsx(`courtledger_filtered_${new Date().toISOString().slice(0, 10)}.xlsx`, filtered)}
        >
          Filter XLSX ({filtered.length})
        </button>
      </div>
    </section>
  );
}
