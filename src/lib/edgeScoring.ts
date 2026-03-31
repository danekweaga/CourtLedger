import { impliedProbabilityFromAmerican } from "../utils/odds";
import type { IntelligenceDataQuality } from "../types/betIntelligence";

export interface EdgeModelOutput {
  edge_score: number;
  calibrated_hit_probability: number;
}

/**
 * Maps structural edge vs implied odds into a 1–10 score and a capped win probability.
 * Conservative by design — rarely exceeds mid-50s% without strong data_quality.
 */
export function computeEdgeModel(args: {
  line_gap: number;
  current_odds: number;
  data_quality: IntelligenceDataQuality;
  trap_warning: boolean;
  value_gone_from_line: boolean;
  volatility_factor: number;
}): EdgeModelOutput {
  const implied = impliedProbabilityFromAmerican(args.current_odds);
  const gap = args.line_gap;

  let rawEdge = 3 + Math.min(4, Math.abs(gap) * 0.55);
  if (gap > 0.5) {
    rawEdge += 0.8;
  }
  if (gap > 1.2) {
    rawEdge += 0.6;
  }
  if (gap < -0.8) {
    rawEdge -= 2.2;
  }

  if (args.data_quality === "High") {
    rawEdge += 1.1;
  } else if (args.data_quality === "Medium") {
    rawEdge += 0.35;
  } else {
    rawEdge -= 0.9;
  }

  if (args.trap_warning) {
    rawEdge -= 2.4;
  }
  if (args.value_gone_from_line) {
    rawEdge -= 1.6;
  }

  rawEdge -= Math.min(1.5, (args.volatility_factor - 1) * 0.8);

  const edge_score = Math.max(1, Math.min(10, Math.round(rawEdge)));

  const baseProb = implied + Math.tanh(gap / 6) * 0.06;
  let calibrated = Math.min(0.58, Math.max(0.38, baseProb));

  if (args.data_quality === "High") {
    calibrated = Math.min(0.6, calibrated + 0.02);
  }
  if (args.data_quality === "Low") {
    calibrated = Math.min(calibrated, 0.52);
  }
  if (args.trap_warning || args.value_gone_from_line) {
    calibrated = Math.min(calibrated, 0.5);
  }

  calibrated = Math.round(calibrated * 1000) / 1000;

  return { edge_score, calibrated_hit_probability: calibrated };
}
