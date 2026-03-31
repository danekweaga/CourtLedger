import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";

/**
 * Future hook for live injuries, odds, lineups, and stats.
 * MVP uses manual fields on `BetIntelligenceScenarioInput` only.
 */
export interface IntelligenceDataProvider {
  readonly id: string;
  enrichScenario(input: BetIntelligenceScenarioInput): Promise<Partial<BetIntelligenceScenarioInput>>;
}

export class ManualIntelligenceDataProvider implements IntelligenceDataProvider {
  readonly id = "manual";

  async enrichScenario(input: BetIntelligenceScenarioInput): Promise<Partial<BetIntelligenceScenarioInput>> {
    void input;
    return {};
  }
}

export const defaultIntelligenceDataProvider = new ManualIntelligenceDataProvider();
