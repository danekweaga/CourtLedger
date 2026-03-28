import type { BetFilters, BetSortKey } from "../../types/bets";

interface BetsFiltersProps {
  filters: BetFilters;
  sort: BetSortKey;
  onChange: (next: BetFilters) => void;
  onSortChange: (next: BetSortKey) => void;
}

const defaultInputClass =
  "w-full rounded-lg border-none bg-surface-container-lowest px-2 py-2 text-xs text-slate-100 outline-none ring-1 ring-transparent focus:ring-primary/30";

export function BetsFilters({ filters, sort, onChange, onSortChange }: BetsFiltersProps) {
  return (
    <section className="rounded-xl bg-surface-container p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Filters & Sorting</h2>
        <button
          className="rounded bg-surface-container-high px-2 py-1 text-[10px] font-semibold text-slate-300"
          onClick={() =>
            onChange({
              search: "",
              dateFrom: "",
              dateTo: "",
              player: "",
              team: "",
              opponent: "",
              sportsbook: "",
              marketType: "",
              resultStatus: "",
            })
          }
        >
          Clear
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <input
          className={defaultInputClass}
          placeholder="Search player / matchup / notes"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
        <input
          className={defaultInputClass}
          placeholder="Player"
          value={filters.player}
          onChange={(event) => onChange({ ...filters, player: event.target.value })}
        />
        <input
          className={defaultInputClass}
          placeholder="Team"
          value={filters.team}
          onChange={(event) => onChange({ ...filters, team: event.target.value })}
        />
        <input
          className={defaultInputClass}
          placeholder="Opponent"
          value={filters.opponent}
          onChange={(event) => onChange({ ...filters, opponent: event.target.value })}
        />
        <input
          className={defaultInputClass}
          placeholder="Sportsbook"
          value={filters.sportsbook}
          onChange={(event) => onChange({ ...filters, sportsbook: event.target.value })}
        />
        <input
          className={defaultInputClass}
          placeholder="Market Type"
          value={filters.marketType}
          onChange={(event) => onChange({ ...filters, marketType: event.target.value })}
        />
        <select
          className={defaultInputClass}
          value={filters.resultStatus}
          onChange={(event) => onChange({ ...filters, resultStatus: event.target.value })}
        >
          <option value="">All Results</option>
          <option value="pending">Pending</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="push">Push</option>
          <option value="void">Void</option>
          <option value="cash_out">Cash Out</option>
        </select>
        <select className={defaultInputClass} value={sort} onChange={(event) => onSortChange(event.target.value as BetSortKey)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="biggest_stake">Biggest Stake</option>
          <option value="biggest_profit">Biggest Profit</option>
          <option value="closest_to_hitting">Closest To Hitting</option>
        </select>
        <input
          className={defaultInputClass}
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        />
        <input
          className={defaultInputClass}
          type="date"
          value={filters.dateTo}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
        />
      </div>
    </section>
  );
}
