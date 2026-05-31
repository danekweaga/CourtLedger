import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import { fetchPlayerContext } from "./playerContextService";

/**
 * Enriches manual scenarios with balldontlie stats via the Vercel API proxy.
 */
export interface IntelligenceDataProvider {
  readonly id: string;
  enrichScenario(input: BetIntelligenceScenarioInput): Promise<Partial<BetIntelligenceScenarioInput>>;
}

export class BalldontlieIntelligenceDataProvider implements IntelligenceDataProvider {
  readonly id = "balldontlie";

  async enrichScenario(input: BetIntelligenceScenarioInput): Promise<Partial<BetIntelligenceScenarioInput>> {
    if (!input.player_name.trim()) {
      return {};
    }
    return fetchPlayerContext(input.player_name, input.market_type);
  }
}

export class ManualIntelligenceDataProvider implements IntelligenceDataProvider {
  readonly id = "manual";

  async enrichScenario(input: BetIntelligenceScenarioInput): Promise<Partial<BetIntelligenceScenarioInput>> {
    void input;
    return {};
  }
}

export const defaultIntelligenceDataProvider = new BalldontlieIntelligenceDataProvider();
