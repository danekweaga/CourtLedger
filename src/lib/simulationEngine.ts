import { getMarketVolatility } from "./projectionEngine";

export interface SimulationOutput {
  simulation_low: number;
  simulation_high: number;
  estimated_hit_frequency: number;
  volatility_note: string;
  variance_label: "stable" | "moderate variance" | "high variance";
}

export function runSimulation(args: {
  projection: number;
  line: number;
  side: "over" | "under" | null;
  market_type: string;
  inflated_volatility: boolean;
}): SimulationOutput {
  const baseVol = getMarketVolatility(args.market_type);
  const vol = baseVol * (args.inflated_volatility ? 1.18 : 1);
  const variance_label: SimulationOutput["variance_label"] =
    vol < baseVol * 0.95 ? "stable" : vol < baseVol * 1.15 ? "moderate variance" : "high variance";

  const low = Math.round((args.projection - 1.15 * vol) * 10) / 10;
  const high = Math.round((args.projection + 1.15 * vol) * 10) / 10;

  const span = Math.max(high - low, 0.5);
  let hitArea = 0;
  if (args.side === "over") {
    hitArea = Math.max(0, high - args.line) / span;
  } else if (args.side === "under") {
    hitArea = Math.max(0, args.line - low) / span;
  } else {
    hitArea = 0.45;
  }
  const estimated_hit_frequency = Math.min(0.62, Math.max(0.35, hitArea * 0.55 + 0.38));

  const volatility_note =
    variance_label === "high variance"
      ? "Wide outcome band — game script and minutes swing matter more than the median projection."
      : variance_label === "moderate variance"
        ? "Typical NBA prop variance; lean on role stability and line context."
        : "Relatively tight band vs market type — still not a lock.";

  return {
    simulation_low: low,
    simulation_high: high,
    estimated_hit_frequency: Math.round(estimated_hit_frequency * 1000) / 1000,
    volatility_note,
    variance_label,
  };
}
