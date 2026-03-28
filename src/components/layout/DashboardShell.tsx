import type { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
  onAddBetClick?: () => void;
}

export function DashboardShell({ children, onAddBetClick }: DashboardShellProps) {
  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-slate-800/40 bg-[#0b1326]/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 bg-[#131b2e] px-4 py-3 md:px-6">
          <div className="flex items-center gap-8">
            <span className="brand-font text-xl font-bold tracking-tight text-white">CourtLedger</span>
            <nav className="hidden items-center gap-6 md:flex">
              <a className="border-b-2 border-green-400 pb-1 text-sm font-bold text-green-400" href="#">
                Dashboard
              </a>
              <a className="text-sm text-slate-400 transition-colors hover:text-white" href="#">
                Analytics
              </a>
              <a className="text-sm text-slate-400 transition-colors hover:text-white" href="#">
                History
              </a>
              <a className="text-sm text-slate-400 transition-colors hover:text-white" href="#">
                Markets
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-700/30 bg-[#060e20] px-4 py-1.5 lg:flex">
              <span className="material-symbols-outlined text-lg text-slate-400">search</span>
              <input
                className="w-48 border-none bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                placeholder="Search bets or players..."
                type="text"
              />
            </div>
            <button
              className="primary-gradient rounded-full px-5 py-2 text-sm font-bold text-[#003915] transition-transform duration-100 hover:scale-95 active:scale-90"
              onClick={onAddBetClick}
            >
              Add Bet
            </button>
            <button className="rounded-full p-2 text-slate-400 hover:bg-[#222a3d]">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full border border-primary/30 bg-gradient-to-br from-[#4be277] to-[#22c55e]" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-24 pt-20 md:px-8 md:pb-8">{children}</main>

      <nav className="glass-panel fixed bottom-4 left-4 right-4 z-50 flex h-16 items-center justify-around rounded-3xl shadow-2xl md:hidden">
        <a className="flex scale-90 flex-col items-center justify-center rounded-2xl bg-green-500/20 p-2 px-4 text-green-400" href="#">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Home</span>
        </a>
        <a className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-white" href="#">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] font-medium">Bets</span>
        </a>
        <a className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-white" href="#">
          <span className="material-symbols-outlined text-3xl text-primary">add_circle</span>
          <span className="text-[10px] font-medium">Add</span>
        </a>
        <a className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-white" href="#">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="text-[10px] font-medium">Stats</span>
        </a>
        <a className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-white" href="#">
          <span className="material-symbols-outlined">menu</span>
          <span className="text-[10px] font-medium">Menu</span>
        </a>
      </nav>
    </>
  );
}
