import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface AppFrameProps {
  session: Session;
  title: string;
  subtitle?: string;
  activeNav: "command" | "history" | "markets" | "analytics";
  onAddBet: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

const navItems = [
  { key: "command", label: "Command Center", icon: "dashboard", to: "/" },
  { key: "history", label: "Bet History", icon: "receipt_long", to: "/history" },
  { key: "markets", label: "Market Intelligence", icon: "query_stats", to: "/markets" },
  { key: "analytics", label: "ROI Analytics", icon: "payments", to: "/analytics" },
] as const;

export function AppFrame({ session, title, subtitle, activeNav, onAddBet, onSignOut, children }: AppFrameProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-800/50 bg-slate-900 lg:flex">
        <div className="p-6">
          <h1 className="font-headline text-2xl font-extrabold tracking-tighter text-emerald-400">CourtLedger</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">Tactical Command</p>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const active = activeNav === item.key;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={
                  active
                    ? "translate-x-1 flex items-center gap-3 border-l-4 border-emerald-400 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-400"
                    : "group flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-200"
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-3 text-sm font-bold text-[#002109] hover:opacity-90"
            onClick={onAddBet}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Place New Bet
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            onClick={onSignOut}
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-slate-800/20 bg-slate-950/70 px-6 py-4 backdrop-blur-xl lg:pl-72">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface lg:text-2xl">{title}</h2>
          {subtitle ? <p className="text-xs text-on-surface-variant">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/analytics">
            Analytics
          </NavLink>
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/history">
            History
          </NavLink>
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/markets">
            Markets
          </NavLink>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/50">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/50">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="rounded-full border border-emerald-400/20 bg-surface-container-high px-2 py-1 text-xs text-slate-300">
            {session.user.email}
          </div>
        </div>
      </header>

      <main className="pb-28 pt-24 lg:ml-64 lg:pb-10">
        <div className="mx-auto max-w-7xl px-6">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl bg-slate-950/80 px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgb(6,14,32,0.5)] backdrop-blur-2xl lg:hidden">
        <MobileItem to="/analytics" icon="analytics" label="Stats" active={activeNav === "analytics"} />
        <MobileItem to="/history" icon="history" label="History" active={activeNav === "history"} />
        <MobileItem to="/markets" icon="leaderboard" label="Markets" active={activeNav === "markets"} />
        <button
          className="flex flex-col items-center justify-center rounded-2xl px-6 py-2 text-slate-500 transition-all duration-200 active:scale-90"
          onClick={onAddBet}
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest">Add</span>
        </button>
      </nav>
    </div>
  );
}

function MobileItem({ to, icon, label, active }: { to: string; icon: string; label: string; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={
        active
          ? "flex flex-col items-center justify-center rounded-2xl bg-emerald-500/20 px-6 py-2 text-emerald-400 transition-all duration-200 active:scale-90"
          : "flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-all duration-200 active:scale-90"
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </NavLink>
  );
}
