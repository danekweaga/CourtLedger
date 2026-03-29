import type { Bet } from "../../types/bets";

interface BetRowActionsProps {
  bet: Bet;
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onDuplicate: (bet: Bet) => void;
  onQuickGrade: (bet: Bet, result: "win" | "loss" | "push") => void;
}

export function BetRowActions({ bet, onEdit, onDelete, onDuplicate, onQuickGrade }: BetRowActionsProps) {
  const buttonClass = "rounded-lg bg-surface-container-high px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-surface-container-highest";

  return (
    <div className="flex flex-wrap gap-1">
      <button type="button" className={buttonClass} onClick={() => onEdit(bet)}>
        Edit
      </button>
      <button type="button" className={buttonClass} onClick={() => onDuplicate(bet)}>
        Duplicate
      </button>
      <button type="button" className={buttonClass} onClick={() => onQuickGrade(bet, "win")}>
        Mark Win
      </button>
      <button type="button" className={buttonClass} onClick={() => onQuickGrade(bet, "loss")}>
        Mark Loss
      </button>
      <button type="button" className={buttonClass} onClick={() => onQuickGrade(bet, "push")}>
        Mark Push
      </button>
      <button type="button" className="rounded-lg bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/25" onClick={() => onDelete(bet)}>
        Delete
      </button>
    </div>
  );
}
