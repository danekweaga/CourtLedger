import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
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

/** Edge Function can run ~30–60s (odds + many balldontlie lookups); default fetch may feel “stuck” on slow networks. */
const INVOKE_TIMEOUT_MS = 120_000;

async function describeInvokeFailure(error: unknown): Promise<string> {
  if (error instanceof FunctionsFetchError) {
    const ctx = error.context;
    const inner =
      ctx instanceof Error
        ? ctx.message
        : ctx && typeof ctx === "object" && "message" in ctx
          ? String((ctx as { message?: string }).message)
          : "";
    return [
      "Could not reach Supabase Edge Functions (network error before any response).",
      inner ? `Browser reported: ${inner}` : null,
      "Fix: confirm VITE_SUPABASE_URL is https://YOUR-PROJECT.supabase.co (no typo), disable ad blockers for this site, and deploy: supabase functions deploy nba-odds-slate",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (error instanceof FunctionsRelayError) {
    return "Supabase could not run the Edge Function (relay error). Redeploy nba-odds-slate or check Dashboard → Edge Functions → Logs.";
  }
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    let body = "";
    try {
      body = (await res.clone().text()).slice(0, 280);
    } catch {
      /* ignore */
    }
    const hint =
      res.status === 404
        ? " (Function missing — run: supabase functions deploy nba-odds-slate)"
        : res.status === 401
          ? " (Sign out and sign in again; session must be valid.)"
          : res.status >= 500
            ? " (Check function logs; set secrets THE_ODDS_API_KEY and BALLDONTLIE_API_KEY.)"
            : "";
    return `Edge Function HTTP ${res.status}${hint}${body ? ` — ${body}` : ""}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * One Edge Function call → one Odds API request (3 player markets × US) + sparse balldontlie lookups.
 * Requires deployed function `nba-odds-slate` and secrets THE_ODDS_API_KEY, BALLDONTLIE_API_KEY.
 */
export async function fetchNbaOddsSlateScenarios(): Promise<NbaOddsSlateResponse> {
  const { data, error } = await supabase.functions.invoke<NbaOddsSlateResponse>("nba-odds-slate", {
    body: {},
    timeout: INVOKE_TIMEOUT_MS,
  });
  if (error) {
    throw new Error(await describeInvokeFailure(error));
  }
  if (!data || typeof data !== "object") {
    throw new Error("Empty response from nba-odds-slate");
  }
  const raw = data as unknown as Record<string, unknown>;
  if (typeof raw.error === "string") {
    throw new Error(raw.error);
  }
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
