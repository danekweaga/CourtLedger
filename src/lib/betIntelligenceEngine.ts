import type {
  BetIntelligenceScenarioInput,
  IntelligenceDataQuality,
  IntelligenceReportResult,
  IntelligenceVerdict,
  TopPickCardModel,
} from "../types/betIntelligence";
import { computeEdgeModel } from "./edgeScoring";
import { analyzeLineMovement } from "./lineMovement";
import { computeProjection } from "./projectionEngine";
import { buildRiskFlags } from "./riskAssessment";
import { runSimulation } from "./simulationEngine";

function scoreDataQuality(input: BetIntelligenceScenarioInput): IntelligenceDataQuality {
  let score = 0;
  if (input.player_name.trim()) {
    score += 1;
  }
  if (input.team.trim() && input.opponent.trim()) {
    score += 1;
  }
  if (input.recent_form?.trim()) {
    score += 2;
  }
  if (input.matchup_notes?.trim()) {
    score += 1;
  }
  if (input.injury_context?.trim() || input.role_shift_notes?.trim()) {
    score += 2;
  }
  if (input.opening_line != null && input.opening_line > 0) {
    score += 2;
  }
  if (input.opponent_pace_rank != null) {
    score += 1;
  }
  if (input.rest_days != null) {
    score += 1;
  }
  if (score >= 8) {
    return "High";
  }
  if (score >= 4) {
    return "Medium";
  }
  return "Low";
}

function detectTrap(input: BetIntelligenceScenarioInput, line: ReturnType<typeof analyzeLineMovement>, lineGap: number): { flag: boolean; reason: string } {
  const notes = `${input.notes ?? ""} ${input.matchup_notes ?? ""}`.toLowerCase();
  if (line.inflated_line && lineGap < 1) {
    return { flag: true, reason: "Line moved sharply toward a number that now looks too comfortable — possible public bait." };
  }
  if (/public|steam|everyone|lock|easy\s*money/.test(notes) && lineGap < 0.5) {
    return { flag: true, reason: "Narrative-heavy spot with thin numeric edge — classic trap profile." };
  }
  if (line.value_gone && lineGap > 0 && lineGap < 0.75) {
    return { flag: true, reason: "Most of the edge likely cleared as the line moved — residual price is marginal." };
  }
  return { flag: false, reason: "" };
}

function pickVerdict(
  edge: number,
  prob: number,
  trap: boolean,
  valueGone: boolean,
): IntelligenceVerdict {
  if (trap || edge <= 3) {
    return "Pass";
  }
  if (valueGone && edge < 7) {
    return "Pass";
  }
  if (edge >= 8 && prob >= 0.52 && !trap) {
    return "Bet";
  }
  if (edge >= 6 && prob >= 0.48) {
    return "Lean";
  }
  return "Pass";
}

function bestTimeToBet(line: ReturnType<typeof analyzeLineMovement>, verdict: IntelligenceVerdict, trap: boolean): IntelligenceReportResult["best_time_to_bet"] {
  if (trap || verdict === "Pass") {
    return "Avoid";
  }
  if (line.value_gone) {
    return "Wait";
  }
  if (line.inflated_line && !line.value_gone) {
    return "Wait";
  }
  if (verdict === "Bet") {
    return "Now";
  }
  return "Wait";
}

function buildWhatChangedToday(input: BetIntelligenceScenarioInput, line: ReturnType<typeof analyzeLineMovement>): string[] {
  const bullets: string[] = [];
  bullets.push(line.summary);
  if (input.injury_context?.trim()) {
    bullets.push(`Injury / availability (manual): ${input.injury_context.trim()}`);
  } else {
    bullets.push("No injury notes supplied — verify closer to tip.");
  }
  if (input.role_shift_notes?.trim()) {
    bullets.push(`Lineup / role (manual): ${input.role_shift_notes.trim()}`);
  }
  if (input.opening_line != null) {
    bullets.push(`Odds context: ${input.current_odds > 0 ? "+" : ""}${input.current_odds} listed — compare to your book before locking.`);
  }
  return bullets.slice(0, 6);
}

function buildMainReasons(
  input: BetIntelligenceScenarioInput,
  lineGap: number,
  side: BetIntelligenceScenarioInput["over_under"],
  dq: IntelligenceDataQuality,
  line: ReturnType<typeof analyzeLineMovement>,
): string[] {
  const reasons: string[] = [];
  if (side === "over" && lineGap > 0.4) {
    reasons.push(`Projection sits ${lineGap.toFixed(1)} above the posted line on the over — modest structural cushion.`);
  } else if (side === "under" && lineGap > 0.4) {
    reasons.push(`Projection sits ${lineGap.toFixed(1)} below the posted line on the under — modest cushion.`);
  } else if (side) {
    reasons.push("Projection hugs the number — edge is thin; market is pricing this efficiently.");
  } else {
    reasons.push("No clear over/under side declared — analysis defaults to conservative reads.");
  }

  if (input.recent_form?.trim()) {
    reasons.push("Recent-form text was incorporated with regression shrink to avoid chasing heaters.");
  }
  if (input.opponent_pace_rank != null && input.opponent_pace_rank <= 10) {
    reasons.push("Fast-paced opponent environment — extra possessions can lift counting stats.");
  }
  if (input.opponent_pace_rank != null && input.opponent_pace_rank >= 22) {
    reasons.push("Slower-paced matchup — fewer possessions cap ceiling relative to season averages.");
  }
  if (/(usage|role|starter|minutes)/i.test(`${input.role_shift_notes} ${input.injury_context}`)) {
    reasons.push("Manual role/usage cues detected — opportunity shift is part of the baseline.");
  }
  if (line.direction !== "unknown" && !line.value_gone) {
    reasons.push("Line movement has not fully erased the structural gap vs projection.");
  }
  if (dq === "Low") {
    reasons.push("Data quality is low — reasons above are tentative until you add harder inputs.");
  }
  return reasons.slice(0, 7);
}

function buildHiddenEdge(input: BetIntelligenceScenarioInput, line: ReturnType<typeof analyzeLineMovement>): string {
  if (line.inflated_line) {
    return "Sharps often fade inflated \"easy\" numbers after steam — the market may be offering a false sense of safety on the popular side.";
  }
  if (input.role_shift_notes?.toLowerCase().includes("bench") && input.recent_form?.match(/\d+/)) {
    return "Secondary creation leaving the floor can be under-reflected in static season-long priors — your minutes/usage notes matter more than the raw line.";
  }
  return "Without live feeds, the hidden edge is mostly about whether your manual minutes and matchup notes are ahead of the book's stale priors.";
}

/**
 * Full deterministic intelligence pass for one NBA scenario (manual inputs).
 */
export function analyzeBetIntelligence(input: BetIntelligenceScenarioInput): IntelligenceReportResult {
  const projection = computeProjection(input);
  const lineMove = analyzeLineMovement(input.opening_line, input.line, input.over_under);
  const side = input.over_under;

  let line_gap = 0;
  let prediction: IntelligenceReportResult["prediction"] = "MISS";

  if (side === "over") {
    line_gap = projection - input.line;
    prediction = projection > input.line + 0.25 ? "HIT" : "MISS";
  } else if (side === "under") {
    line_gap = input.line - projection;
    prediction = projection < input.line - 0.25 ? "HIT" : "MISS";
  } else {
    line_gap = 0;
    prediction = Math.abs(projection - input.line) < 0.5 ? "MISS" : projection > input.line ? "HIT" : "MISS";
  }

  const data_quality = scoreDataQuality(input);
  const trap = detectTrap(input, lineMove, line_gap);
  const sim = runSimulation({
    projection,
    line: input.line,
    side,
    market_type: input.market_type,
    inflated_volatility: trap.flag || lineMove.inflated_line,
  });

  const edgePack = computeEdgeModel({
    line_gap,
    current_odds: input.current_odds,
    data_quality,
    trap_warning: trap.flag,
    value_gone_from_line: lineMove.value_gone,
    volatility_factor: sim.variance_label === "high variance" ? 1.35 : sim.variance_label === "moderate variance" ? 1.12 : 1,
  });

  const final_verdict = pickVerdict(edgePack.edge_score, edgePack.calibrated_hit_probability, trap.flag, lineMove.value_gone);
  const best_time_to_bet = bestTimeToBet(lineMove, final_verdict, trap.flag);

  const risk_flags = buildRiskFlags({ input, line: lineMove, sim, data_quality });

  const pick = `${input.player_name || "Player"} ${input.market_type}${side ? ` ${side}` : ""} ${input.line} (${input.team} vs ${input.opponent})`;

  return {
    pick,
    prediction,
    line: input.line,
    projection,
    calibrated_hit_probability: edgePack.calibrated_hit_probability,
    confidence: edgePack.edge_score >= 7 ? "High" : edgePack.edge_score >= 5 ? "Medium" : "Low",
    edge_score: edgePack.edge_score,
    main_reasons: buildMainReasons(input, line_gap, side, data_quality, lineMove),
    what_changed_today: buildWhatChangedToday(input, lineMove),
    hidden_edge: buildHiddenEdge(input, lineMove),
    trap_warning: trap.flag,
    trap_warning_reason: trap.flag ? trap.reason : "No major trap pattern from manual inputs and line shape.",
    simulation_low: sim.simulation_low,
    simulation_high: sim.simulation_high,
    estimated_hit_frequency: sim.estimated_hit_frequency,
    risk_flags,
    data_quality,
    best_time_to_bet,
    final_verdict,
  };
}

function toTopPickCard(scenario: BetIntelligenceScenarioInput, report: IntelligenceReportResult): TopPickCardModel {
  return {
    pick: report.pick,
    line: scenario.line,
    projection: report.projection,
    hit_probability: report.calibrated_hit_probability,
    confidence: report.confidence,
    edge_score: report.edge_score,
    why_it_hits: report.main_reasons.slice(0, 4),
    what_changed_today: report.what_changed_today.slice(0, 4),
    hidden_edge: report.hidden_edge,
    trap_warning: report.trap_warning ? report.trap_warning_reason : "No — line context looks standard for manual review.",
    risk: report.risk_flags.slice(0, 2).join(" "),
    best_time_to_bet: report.best_time_to_bet,
  };
}

export interface TopPickWithScenario {
  card: TopPickCardModel;
  scenario: BetIntelligenceScenarioInput;
}

function selectTopPickAnalyses(candidates: BetIntelligenceScenarioInput[]): { scenario: BetIntelligenceScenarioInput; report: IntelligenceReportResult }[] {
  if (candidates.length === 0) {
    return [];
  }
  const analyzed = candidates.map((scenario) => ({
    scenario,
    report: analyzeBetIntelligence(scenario),
  }));

  let filtered = analyzed.filter(
    (x) => !x.report.trap_warning && x.report.edge_score >= 6 && (x.report.final_verdict === "Bet" || x.report.final_verdict === "Lean"),
  );

  if (filtered.length < 2) {
    filtered = analyzed.filter(
      (x) => !x.report.trap_warning && x.report.edge_score >= 5 && x.report.final_verdict !== "Pass" && x.report.data_quality !== "Low",
    );
  }

  if (filtered.length < 1) {
    return [];
  }

  filtered.sort((a, b) => b.report.edge_score - a.report.edge_score || b.report.calibrated_hit_probability - a.report.calibrated_hit_probability);

  return filtered.slice(0, 5);
}

export function buildTopPicksTodayWithScenarios(candidates: BetIntelligenceScenarioInput[]): TopPickWithScenario[] {
  return selectTopPickAnalyses(candidates).map(({ scenario, report }) => ({
    card: toTopPickCard(scenario, report),
    scenario,
  }));
}

export function buildTopPicksToday(candidates: BetIntelligenceScenarioInput[]): TopPickCardModel[] {
  return selectTopPickAnalyses(candidates).map(({ scenario, report }) => toTopPickCard(scenario, report));
}

export function summarizeSlate(picks: TopPickCardModel[], candidates: BetIntelligenceScenarioInput[]): string {
  if (picks.length === 0) {
    return "Low-edge slate on manual inputs — no forced plays. Add injuries, opening numbers, and form before re-running.";
  }
  const inj = candidates.some((c) => c.injury_context?.trim());
  const pace = candidates.filter((c) => c.opponent_pace_rank != null && c.opponent_pace_rank <= 10).length;
  if (inj && pace >= 2) {
    return "Injury-heavy, faster-paced environment — edges can move quickly; re-check lines closer to lock.";
  }
  if (inj) {
    return "Injury notes present — volatility is elevated; prioritize confirmed starters.";
  }
  if (pace >= Math.ceil(candidates.length / 2)) {
    return "Fast-paced slate skew — counting markets carry extra variance.";
  }
  if (picks.every((p) => p.confidence === "Medium" || p.confidence === "Low")) {
    return "Actionable but not pristine — keep stakes disciplined until data quality improves.";
  }
  return "Selective slate with a few structurally clean spots vs your manual priors.";
}
