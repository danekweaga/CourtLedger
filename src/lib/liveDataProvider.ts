import type { LiveStatUpdate } from "../types/bets";

export interface LiveDataProvider {
  fetchLiveStats(): Promise<LiveStatUpdate[]>;
}

// MVP provider: manual entry only, returns no auto updates.
export class ManualLiveDataProvider implements LiveDataProvider {
  async fetchLiveStats(): Promise<LiveStatUpdate[]> {
    return [];
  }
}
