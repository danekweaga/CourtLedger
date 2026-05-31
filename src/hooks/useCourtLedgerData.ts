import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Bet, BetDraft, BetFilters, BetSortKey } from "../types/bets";
import { createBet, deleteBet, duplicateBet, fetchBets, quickGradeBet, updateBet } from "../lib/betsService";
import { upsertLiveStat, updateBetLiveTracking } from "../lib/liveStatsService";
import { calculateTargetRemaining } from "../utils/progress";
import { createEmptyBetDraft } from "../utils/betDraft";
import { applyFiltersAndSort } from "../utils/betFiltering";
import { computeSummaryStats } from "../utils/analytics";
import { readMoneySavedFromBetting, writeMoneySavedFromBetting } from "../utils/moneySavedStorage";
import { sampleBets } from "../data/mockBets";

export function useCourtLedgerData(userId: string) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loadingBets, setLoadingBets] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [selectedStreamBet, setSelectedStreamBet] = useState<Bet | null>(null);
  const [draft, setDraft] = useState<BetDraft>(createEmptyBetDraft());
  const [sort, setSort] = useState<BetSortKey>("newest");
  const [filters, setFilters] = useState<BetFilters>({
    search: "",
    dateFrom: "",
    dateTo: "",
    player: "",
    team: "",
    opponent: "",
    sportsbook: "",
    marketType: "",
    resultStatus: "",
  });

  useEffect(() => {
    void loadBets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filteredBets = useMemo(() => applyFiltersAndSort(bets, filters, sort), [bets, filters, sort]);
  const activeBets = useMemo(() => filteredBets.filter((bet) => bet.result_status === "pending"), [filteredBets]);
  const settledBets = useMemo(() => filteredBets.filter((bet) => bet.result_status !== "pending"), [filteredBets]);
  const summary = useMemo(() => computeSummaryStats(bets), [bets]);

  const [moneySavedFromBetting, setMoneySavedState] = useState(readMoneySavedFromBetting);
  const setMoneySavedFromBetting = useCallback((value: number) => {
    const n = Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
    setMoneySavedState(n);
    writeMoneySavedFromBetting(n);
  }, []);

  async function loadBets() {
    setLoadingBets(true);
    try {
      const data = await fetchBets(userId);
      setBets(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load bets.");
    } finally {
      setLoadingBets(false);
    }
  }

  async function saveBet(next: BetDraft) {
    setSaveLoading(true);
    try {
      if (editingBet) {
        const updated = await updateBet(editingBet.id, {
          ...next,
          target_remaining: calculateTargetRemaining(next.line, next.current_stat_value, next.over_under),
        });
        setBets((prev) => prev.map((bet) => (bet.id === editingBet.id ? updated : bet)));
        setEditingBet(null);
        toast.success("Bet updated.");
      } else {
        const created = await createBet(userId, {
          ...next,
          target_remaining: calculateTargetRemaining(next.line, next.current_stat_value, next.over_under),
        });
        setBets((prev) => [created, ...prev]);
        toast.success("Bet created.");
      }
      setDraft(createEmptyBetDraft());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bet.");
    } finally {
      setSaveLoading(false);
    }
  }

  function startEdit(bet: Bet) {
    setEditingBet(bet);
    setDraft({
      date_placed: bet.date_placed,
      game_date: bet.game_date,
      matchup: bet.matchup,
      sportsbook: bet.sportsbook,
      player_name: bet.player_name,
      team: bet.team,
      opponent: bet.opponent,
      bet_category: bet.bet_category,
      market_type: bet.market_type,
      over_under: bet.over_under,
      line: bet.line,
      odds: bet.odds,
      stake: bet.stake,
      potential_payout: bet.potential_payout,
      result_status: bet.result_status,
      live_status: bet.live_status,
      current_stat_value: bet.current_stat_value,
      target_remaining: bet.target_remaining,
      notes: bet.notes,
      stream_url: bet.stream_url,
      stat_source_url: bet.stat_source_url,
      is_parlay_leg: bet.is_parlay_leg,
      bet_timing: bet.bet_timing,
      season: bet.season,
      season_type: bet.season_type,
      is_free_bet: bet.is_free_bet,
      promo_toggle: bet.promo_toggle,
      cash_out_amount: bet.cash_out_amount,
      units_staked: bet.units_staked,
      game_status: bet.game_status,
      player_active_status: bet.player_active_status,
      auto_settle_enabled: bet.auto_settle_enabled ?? false,
      stats_player_id: bet.stats_player_id ?? null,
      stats_game_id: bet.stats_game_id ?? null,
      last_auto_settle_at: bet.last_auto_settle_at ?? null,
      auto_settle_error: bet.auto_settle_error ?? null,
    });
  }

  async function removeBet(bet: Bet) {
    try {
      await deleteBet(bet.id);
      setBets((prev) => prev.filter((entry) => entry.id !== bet.id));
      toast.success("Bet deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function cloneBet(bet: Bet) {
    try {
      const duplicated = await duplicateBet(userId, bet);
      setBets((prev) => [duplicated, ...prev]);
      toast.success("Bet duplicated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Duplicate failed.");
    }
  }

  async function gradeBet(bet: Bet, result: "win" | "loss" | "push") {
    try {
      const updated = await quickGradeBet(bet.id, result);
      setBets((prev) => prev.map((entry) => (entry.id === bet.id ? updated : entry)));
      toast.success(`Marked ${result}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quick grade failed.");
    }
  }

  async function updateLiveStat(bet: Bet, currentStat: number) {
    try {
      const updated = await updateBetLiveTracking(bet.id, {
        betId: bet.id,
        currentStatValue: currentStat,
        liveStatus: "in_progress",
        playerActiveStatus: "Active",
        gameStatus: bet.game_status ?? "Live",
      });
      await upsertLiveStat(userId, {
        betId: bet.id,
        currentStatValue: currentStat,
        liveStatus: "in_progress",
        playerActiveStatus: updated.player_active_status ?? "Active",
        gameStatus: updated.game_status ?? "Live",
      });
      setBets((prev) => prev.map((entry) => (entry.id === bet.id ? updated : entry)));
      toast.success("Live stat updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Live update failed.");
    }
  }

  async function loadSampleData() {
    setSaveLoading(true);
    try {
      for (const item of sampleBets) {
        await createBet(userId, item);
      }
      await loadBets();
      toast.success("Sample NBA bets inserted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sample insert failed.");
    } finally {
      setSaveLoading(false);
    }
  }

  return {
    bets,
    filteredBets,
    activeBets,
    settledBets,
    summary,
    moneySavedFromBetting,
    setMoneySavedFromBetting,
    loadingBets,
    saveLoading,
    editingBet,
    selectedStreamBet,
    draft,
    sort,
    filters,
    setDraft,
    setSort,
    setFilters,
    setEditingBet,
    setSelectedStreamBet,
    loadBets,
    saveBet,
    startEdit,
    removeBet,
    cloneBet,
    gradeBet,
    updateLiveStat,
    loadSampleData,
  };
}
