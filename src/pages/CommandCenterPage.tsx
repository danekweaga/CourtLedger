import type { RefObject } from "react";
import { BetForm } from "../components/bets/BetForm";
import { ActiveBetsSection } from "../components/bets/ActiveBetsSection";
import { SettledBetsSection } from "../components/bets/SettledBetsSection";
import { BetsFilters } from "../components/filters/BetsFilters";
import { ExportSection } from "../components/export/ExportSection";
import { StreamPanel } from "../components/stream/StreamPanel";
import type { Bet, BetDraft, BetFilters, BetSortKey } from "../types/bets";

interface CommandCenterPageProps {
  summary: {
    totalProfit: number;
    winRate: number;
    wins: number;
    losses: number;
    roi: number;
    averageOdds: number;
  };
  filters: BetFilters;
  sort: BetSortKey;
  draft: BetDraft;
  editingBet: Bet | null;
  saveLoading: boolean;
  loadingBets: boolean;
  activeBets: Bet[];
  settledBets: Bet[];
  filteredBets: Bet[];
  selectedStreamBet: Bet | null;
  formRef: RefObject<HTMLDivElement | null>;
  onFiltersChange: (next: BetFilters) => void;
  onSortChange: (next: BetSortKey) => void;
  onDraftChange: (next: BetDraft) => void;
  onSaveBet: (draft: BetDraft) => Promise<void>;
  onCancelEdit: () => void;
  onRefresh: () => void;
  onLoadSamples: () => void;
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onDuplicate: (bet: Bet) => void;
  onQuickGrade: (bet: Bet, result: "win" | "loss" | "push") => void;
  onLiveUpdate: (bet: Bet, currentStat: number) => void;
  onSelectStream: (bet: Bet | null) => void;
}

export function CommandCenterPage(props: CommandCenterPageProps) {
  const {
    summary,
    filters,
    sort,
    draft,
    editingBet,
    saveLoading,
    loadingBets,
    activeBets,
    settledBets,
    filteredBets,
    selectedStreamBet,
    formRef,
    onFiltersChange,
    onSortChange,
    onDraftChange,
    onSaveBet,
    onCancelEdit,
    onRefresh,
    onLoadSamples,
    onEdit,
    onDelete,
    onDuplicate,
    onQuickGrade,
    onLiveUpdate,
    onSelectStream,
  } = props;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <article className="relative overflow-hidden rounded-xl bg-surface-container p-6 md:col-span-2">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-on-surface-variant">Total Profit</p>
          <h2 className="brand-font text-4xl font-extrabold tracking-tight text-white">{formatSigned(summary.totalProfit)}</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              {summary.roi}% ROI
            </span>
          </div>
        </article>
        <article className="rounded-xl bg-surface-container p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-on-surface-variant">Win Rate</p>
          <h2 className="brand-font text-3xl font-bold text-white">{summary.winRate}%</h2>
          <div className="mt-4 h-1.5 w-full rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(summary.winRate, 1), 100)}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-on-surface-variant">
            {summary.wins} Wins - {summary.losses} Losses
          </p>
        </article>
        <article className="rounded-xl bg-surface-container p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-on-surface-variant">ROI / Avg Odds</p>
          <h2 className="brand-font text-3xl font-bold text-white">{summary.roi >= 0 ? `+${summary.roi}` : summary.roi}%</h2>
          <p className="mt-4 text-xs text-on-surface-variant">
            Avg Odds: <span className="font-medium text-white">{summary.averageOdds > 0 ? `+${summary.averageOdds}` : summary.averageOdds}</span>
          </p>
        </article>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-slate-300" onClick={onRefresh}>
              Refresh
            </button>
            <button
              className="rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-slate-300"
              disabled={saveLoading}
              onClick={onLoadSamples}
            >
              Load realistic sample bets
            </button>
            {loadingBets && <span className="self-center text-xs text-slate-400">Loading bets...</span>}
          </div>
          <BetsFilters filters={filters} sort={sort} onChange={onFiltersChange} onSortChange={onSortChange} />
          <ActiveBetsSection
            bets={activeBets}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onQuickGrade={onQuickGrade}
            onManualLiveUpdate={onLiveUpdate}
            onSelectStream={(bet) => onSelectStream(bet)}
          />
          <SettledBetsSection
            bets={settledBets}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onQuickGrade={onQuickGrade}
          />
        </div>
        <div className="space-y-8 lg:col-span-4">
          <div ref={formRef}>
            <BetForm
              editingBet={editingBet}
              draft={draft}
              onChange={onDraftChange}
              onSubmit={onSaveBet}
              onCancelEdit={onCancelEdit}
              loading={saveLoading}
            />
          </div>
          <ExportSection allBets={filteredBets} />
        </div>
      </div>
      <StreamPanel key={selectedStreamBet?.id ?? "none"} selectedBet={selectedStreamBet} onClose={() => onSelectStream(null)} />
    </div>
  );
}

function formatSigned(value: number) {
  const formatted = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}$${formatted}`;
}
