import { useEffect, useMemo, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthGate } from "./components/auth/AuthGate";
import { AppFrame } from "./components/layout/AppFrame";
import { ToastProvider } from "./components/ui/ToastProvider";
import { createEmptyBetDraft } from "./utils/betDraft";
import { useCourtLedgerData } from "./hooks/useCourtLedgerData";
import { CommandCenterPage } from "./pages/CommandCenterPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { MarketIntelligencePage } from "./pages/MarketIntelligencePage";
import { BetHistoryPage } from "./pages/BetHistoryPage";
import { LiveCenterPage } from "./pages/LiveCenterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BetIntelligencePage } from "./pages/BetIntelligencePage";
import { signOut } from "./lib/auth";

function App() {
  return (
    <>
      <AuthGate>{(session) => <CourtLedgerApp session={session} />}</AuthGate>
      <ToastProvider />
    </>
  );
}

function CourtLedgerApp({ session }: { session: Session }) {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useCourtLedgerData(session.user.id);
  const formRef = useRef<HTMLDivElement | null>(null);

  const frameConfig = useMemo(() => {
    if (location.pathname === "/analytics") {
      return { title: "Tactical Command Analytics", subtitle: "Performance diagnostics and risk intelligence", active: "analytics" as const };
    }
    if (location.pathname === "/markets") {
      return { title: "Market Intelligence", subtitle: "Market heatmap, volume and tactical outlook", active: "markets" as const };
    }
    if (location.pathname === "/live") {
      return { title: "Live Center", subtitle: "Stream panel and live stat tracking", active: "live" as const };
    }
    if (location.pathname === "/history") {
      return { title: "Bet History", subtitle: "Ledger, outcomes and tactical audit trail", active: "history" as const };
    }
    if (location.pathname === "/settings") {
      return { title: "Settings", subtitle: "Account and preferences", active: "settings" as const };
    }
    if (location.pathname === "/intelligence") {
      return { title: "Bet Intelligence", subtitle: "Structured prop analysis and slate scan", active: "intelligence" as const };
    }
    return { title: "Command Center", subtitle: "Live tracking and execution dashboard", active: "command" as const };
  }, [location.pathname]);

  async function handleAddBetClick() {
    if (location.pathname !== "/") {
      navigate("/?focus=bet-form");
      return;
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/" && params.get("focus") === "bet-form") {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navigate("/", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Logged out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed.");
    }
  }

  return (
    <AppFrame session={session} title={frameConfig.title} subtitle={frameConfig.subtitle} activeNav={frameConfig.active} onAddBet={handleAddBetClick} onSignOut={handleSignOut}>
      <Routes>
        <Route
          path="/"
          element={
            <CommandCenterPage
              summary={data.summary}
              moneySavedFromBetting={data.moneySavedFromBetting}
              onMoneySavedFromBettingChange={data.setMoneySavedFromBetting}
              filters={data.filters}
              sort={data.sort}
              draft={data.draft}
              editingBet={data.editingBet}
              saveLoading={data.saveLoading}
              loadingBets={data.loadingBets}
              activeBets={data.activeBets}
              settledBets={data.settledBets}
              filteredBets={data.filteredBets}
              selectedStreamBet={data.selectedStreamBet}
              formRef={formRef}
              onFiltersChange={data.setFilters}
              onSortChange={data.setSort}
              onDraftChange={data.setDraft}
              onSaveBet={data.saveBet}
              onCancelEdit={() => {
                data.setEditingBet(null);
                data.setDraft(createEmptyBetDraft());
              }}
              onRefresh={() => void data.loadBets()}
              onLoadSamples={() => void data.loadSampleData()}
              onEdit={data.startEdit}
              onDelete={(bet) => void data.removeBet(bet)}
              onDuplicate={(bet) => void data.cloneBet(bet)}
              onQuickGrade={(bet, result) => void data.gradeBet(bet, result)}
              onLiveUpdate={(bet, currentStat) => void data.updateLiveStat(bet, currentStat)}
              onSelectStream={data.setSelectedStreamBet}
            />
          }
        />
        <Route path="/analytics" element={<AnalyticsPage bets={data.bets} />} />
        <Route
          path="/intelligence"
          element={
            <BetIntelligencePage
              userId={session.user.id}
              bets={data.bets}
              saveLoading={data.saveLoading}
              onAddFromIntelligence={data.addBetFromIntelligence}
            />
          }
        />
        <Route path="/markets" element={<MarketIntelligencePage bets={data.bets} />} />
        <Route
          path="/live"
          element={
            <LiveCenterPage
              activeBets={data.activeBets}
              selectedStreamBet={data.selectedStreamBet}
              onSelectStream={data.setSelectedStreamBet}
              onManualLiveUpdate={(bet, value) => void data.updateLiveStat(bet, value)}
            />
          }
        />
        <Route
          path="/history"
          element={
            <BetHistoryPage
              bets={data.bets}
              onEdit={data.startEdit}
              onDelete={(bet) => void data.removeBet(bet)}
              onDuplicate={(bet) => void data.cloneBet(bet)}
              onQuickGrade={(bet, result) => void data.gradeBet(bet, result)}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              session={session}
              moneySavedFromBetting={data.moneySavedFromBetting}
              onMoneySavedFromBettingChange={data.setMoneySavedFromBetting}
            />
          }
        />
      </Routes>
    </AppFrame>
  );
}

export default App;
