import { supabase } from "./supabase";
import type { BetIntelligenceReportRow, BetIntelligenceScenarioInput, IntelligenceReportResult } from "../types/betIntelligence";

const TABLE = "bet_intelligence_reports";
const MAX_PRUNE = 12;

function extractMissingColumn(error: unknown): string | null {
  const message = (error as { message?: string } | null)?.message ?? "";
  const m1 = message.match(/Could not find the '([^']+)' column/i);
  if (m1?.[1]) {
    return m1[1];
  }
  const m2 = message.match(/column "?([a-zA-Z0-9_]+)"? of relation/i);
  if (m2?.[1]) {
    return m2[1];
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export function normalizeIntelligenceRow(row: Record<string, unknown>): BetIntelligenceReportRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    bet_id: row.bet_id != null ? String(row.bet_id) : null,
    pick_text: String(row.pick_text ?? ""),
    player_name: String(row.player_name ?? ""),
    team: String(row.team ?? ""),
    opponent: String(row.opponent ?? ""),
    market_type: String(row.market_type ?? ""),
    over_under: row.over_under != null ? String(row.over_under) : null,
    line: Number(row.line ?? 0),
    opening_line: row.opening_line != null ? Number(row.opening_line) : null,
    current_odds: Number(row.current_odds ?? -110),
    projection: Number(row.projection ?? 0),
    hit_probability: Number(row.hit_probability ?? 0),
    confidence: String(row.confidence ?? "Low"),
    edge_score: Number(row.edge_score ?? 1),
    prediction: String(row.prediction ?? "MISS"),
    main_reasons: row.main_reasons,
    what_changed_today: row.what_changed_today,
    hidden_edge: String(row.hidden_edge ?? ""),
    trap_warning: Boolean(row.trap_warning),
    trap_warning_reason: String(row.trap_warning_reason ?? ""),
    simulation_low: Number(row.simulation_low ?? 0),
    simulation_high: Number(row.simulation_high ?? 0),
    estimated_hit_frequency: Number(row.estimated_hit_frequency ?? 0),
    risk_flags: row.risk_flags,
    data_quality: String(row.data_quality ?? "Low"),
    best_time_to_bet: String(row.best_time_to_bet ?? "Wait"),
    final_verdict: String(row.final_verdict ?? "Pass"),
    input_snapshot: row.input_snapshot,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function rowToReportResult(row: BetIntelligenceReportRow): IntelligenceReportResult {
  return {
    pick: row.pick_text,
    prediction: row.prediction === "HIT" ? "HIT" : "MISS",
    line: row.line,
    projection: row.projection,
    calibrated_hit_probability: row.hit_probability,
    confidence: row.confidence as IntelligenceReportResult["confidence"],
    edge_score: row.edge_score,
    main_reasons: parseStringArray(row.main_reasons),
    what_changed_today: parseStringArray(row.what_changed_today),
    hidden_edge: row.hidden_edge,
    trap_warning: row.trap_warning,
    trap_warning_reason: row.trap_warning_reason,
    simulation_low: row.simulation_low,
    simulation_high: row.simulation_high,
    estimated_hit_frequency: row.estimated_hit_frequency,
    risk_flags: parseStringArray(row.risk_flags),
    data_quality: row.data_quality as IntelligenceReportResult["data_quality"],
    best_time_to_bet: row.best_time_to_bet as IntelligenceReportResult["best_time_to_bet"],
    final_verdict: row.final_verdict as IntelligenceReportResult["final_verdict"],
  };
}

export function buildInsertPayload(
  userId: string,
  betId: string | null,
  input: BetIntelligenceScenarioInput,
  report: IntelligenceReportResult,
): Record<string, unknown> {
  return {
    user_id: userId,
    bet_id: betId,
    pick_text: report.pick,
    player_name: input.player_name,
    team: input.team,
    opponent: input.opponent,
    market_type: input.market_type,
    over_under: input.over_under,
    line: input.line,
    opening_line: input.opening_line,
    current_odds: input.current_odds,
    projection: report.projection,
    hit_probability: report.calibrated_hit_probability,
    confidence: report.confidence,
    edge_score: report.edge_score,
    prediction: report.prediction,
    main_reasons: report.main_reasons,
    what_changed_today: report.what_changed_today,
    hidden_edge: report.hidden_edge,
    trap_warning: report.trap_warning,
    trap_warning_reason: report.trap_warning_reason,
    simulation_low: report.simulation_low,
    simulation_high: report.simulation_high,
    estimated_hit_frequency: report.estimated_hit_frequency,
    risk_flags: report.risk_flags,
    data_quality: report.data_quality,
    best_time_to_bet: report.best_time_to_bet,
    final_verdict: report.final_verdict,
    input_snapshot: input,
  };
}

async function insertWithPruning(payload: Record<string, unknown>): Promise<BetIntelligenceReportRow> {
  const candidate = { ...payload };
  for (let i = 0; i < MAX_PRUNE; i += 1) {
    const { data, error } = await supabase.from(TABLE).insert([candidate]).select("*").single();
    if (!error && data) {
      return normalizeIntelligenceRow(data as Record<string, unknown>);
    }
    const col = extractMissingColumn(error);
    if (!col || !(col in candidate)) {
      throw error ?? new Error("Insert failed.");
    }
    delete candidate[col];
  }
  throw new Error("Insert failed after column pruning.");
}

export async function fetchIntelligenceReports(userId: string): Promise<BetIntelligenceReportRow[]> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []).map((row) => normalizeIntelligenceRow(row as Record<string, unknown>));
}

export async function saveIntelligenceReport(
  userId: string,
  betId: string | null,
  input: BetIntelligenceScenarioInput,
  report: IntelligenceReportResult,
): Promise<BetIntelligenceReportRow> {
  return insertWithPruning(buildInsertPayload(userId, betId, input, report));
}

export async function deleteIntelligenceReport(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id).eq("user_id", userId);
  if (error) {
    throw error;
  }
}
