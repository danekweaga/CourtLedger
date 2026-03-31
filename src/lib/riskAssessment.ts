import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import type { LineMovementInsight } from "./lineMovement";
import type { SimulationOutput } from "./simulationEngine";

export function buildRiskFlags(args: {
  input: BetIntelligenceScenarioInput;
  line: LineMovementInsight;
  sim: SimulationOutput;
  data_quality: "High" | "Medium" | "Low";
}): string[] {
  const flags: string[] = [];
  const notes = `${args.input.notes ?? ""} ${args.input.matchup_notes ?? ""}`.toLowerCase();

  if (args.sim.variance_label === "high variance") {
    flags.push("High stat variance — thin edge can evaporate with a cold stretch.");
  }
  if (/blowout|garbage|rest\s*star|sitting/.test(notes)) {
    flags.push("Blowout or rest risk could compress minutes or usage.");
  }
  if (/foul|fouls/.test(notes)) {
    flags.push("Foul trouble risk noted in your context.");
  }
  if (!args.input.recent_form?.trim() && args.data_quality !== "High") {
    flags.push("Role uncertainty — recent form field is thin.");
  }
  if (args.line.value_gone) {
    flags.push("Line may have already adjusted — stale manual inputs increase error.");
  }
  if (args.data_quality === "Low") {
    flags.push("Stale or incomplete manual data — downgrade trust in the projection.");
  }
  if (/regression|unsustainable|heater|hot\s*stretch/.test(notes)) {
    flags.push("Regression risk flagged in notes — verify sustainability.");
  }
  if (flags.length === 0) {
    flags.push("No extreme structural flags from manual inputs — still monitor news closer to lock.");
  }
  return flags.slice(0, 8);
}
