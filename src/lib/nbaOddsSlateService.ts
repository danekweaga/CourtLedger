import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import { supabase } from "./supabase";
import { parseInputSnapshot } from "../utils/intelligenceForm";

export interface NbaOddsSlateResponse {
  scenarios: BetIntelligenceScenarioInput[];
  count: number;
  odds_requests_remaining: string | null;
  odds_requests_used: string | null;
  disclaimer: string;
}

type ApiPayload = {
  ok?: boolean;
  scenarios?: unknown[];
  count?: number;
  odds_requests_remaining?: string | null;
  odds_requests_used?: string | null;
  disclaimer?: string;
  error?: string;
  hint?: string;
  detail?: string;
  code?: string;
};

const REQUEST_TIMEOUT_MS = 120_000;

function normalizeResponse(raw: ApiPayload): NbaOddsSlateResponse {
  const scenariosIn = Array.isArray(raw.scenarios) ? raw.scenarios : [];
  const scenarios = scenariosIn.map((row) => parseInputSnapshot(row));
  return {
    scenarios,
    count: typeof raw.count === "number" ? raw.count : scenarios.length,
    odds_requests_remaining: typeof raw.odds_requests_remaining === "string" ? raw.odds_requests_remaining : null,
    odds_requests_used: typeof raw.odds_requests_used === "string" ? raw.odds_requests_used : null,
    disclaimer: typeof raw.disclaimer === "string" ? raw.disclaimer : "",
  };
}

async function callOddsSlateApi(accessToken: string): Promise<{ response: Response; payload: ApiPayload }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/nba-odds-slate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    let payload: ApiPayload = {};
    try {
      payload = (await response.json()) as ApiPayload;
    } catch {
      payload = {};
    }

    return { response, payload };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Odds slate request timed out. Try again in a moment.");
    }
    throw new Error("Could not reach odds slate API. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatApiError(status: number, payload: ApiPayload): string {
  const parts = [payload.error, payload.hint, payload.detail, payload.code].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" · ");
  }
  if (status === 401) {
    return "Unauthorized. Sign in again and retry.";
  }
  if (status === 503) {
    return "Odds slate service is not configured on the server.";
  }
  if (status === 502) {
    return "Odds provider request failed. Check THE_ODDS_API_KEY quota and validity.";
  }
  return `Failed to load odds slate (HTTP ${status}).`;
}

export async function fetchNbaOddsSlateScenarios(): Promise<NbaOddsSlateResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }

  let accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error("You must be signed in to load odds. Sign in and try again.");
  }

  let triedRefresh = false;

  for (;;) {
    const { response, payload } = await callOddsSlateApi(accessToken);

    if (response.ok && payload.ok !== false) {
      return normalizeResponse(payload);
    }

    if (response.status === 401 && !triedRefresh) {
      triedRefresh = true;
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session?.access_token) {
        throw new Error("Session refresh failed. Sign in again and retry.");
      }
      accessToken = refreshed.session.access_token;
      continue;
    }

    throw new Error(formatApiError(response.status, payload));
  }
}
