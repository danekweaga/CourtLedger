import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { CourtLedgerLogo } from "../branding/CourtLedgerLogo";

interface AppFrameProps {
  session: Session;
  title: string;
  subtitle?: string;
  activeNav: "command" | "history" | "markets" | "analytics" | "live" | "settings";
  onAddBet: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

const navItems = [
  { key: "command", label: "Command Center", icon: "dashboard", to: "/" },
  { key: "history", label: "Bet History", icon: "receipt_long", to: "/history" },
  { key: "live", label: "Highlight Hub", icon: "play_circle", to: "/live" },
  { key: "markets", label: "Market Intelligence", icon: "query_stats", to: "/markets" },
  { key: "analytics", label: "ROI Analytics", icon: "payments", to: "/analytics" },
  { key: "settings", label: "Settings", icon: "settings", to: "/settings" },
] as const;

export function AppFrame({ session, title, subtitle, activeNav, onAddBet, onSignOut, children }: AppFrameProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-800/50 bg-surface lg:flex">
        <div className="border-b border-slate-800/40 px-4 py-5">
          <NavLink to="/" aria-label="CourtLedger home" className="block">
            <CourtLedgerLogo className="mx-auto h-14 w-full max-w-[11rem] sm:h-16" />
          </NavLink>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
            Tactical Command
          </p>
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
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container px-4 py-3 text-sm font-bold text-[#002109] hover:opacity-90"
            onClick={onAddBet}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Place New Bet
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            onClick={onSignOut}
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <header className="fixed top-0 right-0 z-50 flex w-full items-center justify-between gap-3 border-b border-slate-800/20 bg-surface/95 px-4 py-3 backdrop-blur-xl lg:left-64 lg:w-[calc(100%-16rem)] lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <NavLink to="/" className="shrink-0 lg:hidden" aria-label="CourtLedger home">
            <CourtLedgerLogo variant="icon" className="h-10 w-10 rounded-lg" />
          </NavLink>
          <div className="min-w-0">
            <h2 className="truncate font-headline text-lg font-bold text-on-surface lg:text-2xl">{title}</h2>
            {subtitle ? <p className="truncate text-xs text-on-surface-variant">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/analytics">
            Analytics
          </NavLink>
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/history">
            History
          </NavLink>
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/live">
            Highlights
          </NavLink>
          <NavLink className="hidden text-sm text-slate-400 hover:text-slate-200 md:block" to="/markets">
            Markets
          </NavLink>
          <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/50">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <NavLink className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" to="/settings">
            <span className="material-symbols-outlined">settings</span>
          </NavLink>
          <div className="hidden max-w-[8rem] truncate rounded-full border border-emerald-400/20 bg-surface-container-high px-2 py-1 text-xs text-slate-300 md:block lg:max-w-[12rem]">
            {session.user.email}
          </div>
        </div>
      </header>

      <main className="pb-28 pt-[4.75rem] lg:ml-64 lg:pb-10 lg:pt-20">
        <div className="mx-auto max-w-7xl px-6">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between gap-0 rounded-t-3xl bg-surface/95 px-2 pb-5 pt-2 shadow-[0_-8px_30px_rgb(6,14,32,0.5)] backdrop-blur-2xl lg:hidden">
        <MobileItem to="/" icon="dashboard" label="Home" active={activeNav === "command"} />
        <MobileItem to="/analytics" icon="analytics" label="Stats" active={activeNav === "analytics"} />
        <MobileItem to="/history" icon="history" label="History" active={activeNav === "history"} />
        <MobileItem to="/live" icon="play_circle" label="Live" active={activeNav === "live"} />
        <button
          type="button"
          className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-3 py-2 text-emerald-400 transition-all duration-200 active:scale-90"
          onClick={onAddBet}
        >
          <span className="material-symbols-outlined text-[1.75rem]">add_circle</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Add</span>
        </button>
        <MobileItem to="/markets" icon="query_stats" label="Markets" active={activeNav === "markets"} />
        <MobileItem to="/settings" icon="settings" label="Settings" active={activeNav === "settings"} />
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
          ? "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl bg-emerald-500/20 px-1 py-2 text-emerald-400 transition-all duration-200 active:scale-90"
          : "flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 text-slate-500 transition-all duration-200 active:scale-90"
      }
    >
      <span className="material-symbols-outlined text-[1.35rem]">{icon}</span>
      <span className="mt-0.5 w-full truncate text-center text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  );
}
