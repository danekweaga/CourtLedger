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

function formatErrorBodyText(status: number, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return status === 500
      ? "Empty body — usually missing Edge Function secrets (THE_ODDS_API_KEY, BALLDONTLIE_API_KEY) or a cold-start crash. Check Dashboard → Edge Functions → nba-odds-slate → Logs."
      : "";
  }
  try {
    const j = JSON.parse(trimmed) as { error?: string; detail?: string; message?: string };
    const parts = [j.error, j.detail, j.message].filter(Boolean);
    if (parts.length) {
      return parts.join(" — ");
    }
  } catch {
    /* not JSON */
  }
  return trimmed.slice(0, 400);
}

async function readResponseDetail(res: Response | null | undefined): Promise<string> {
  if (!res) {
    return "";
  }
  try {
    const text = await res.text();
    return formatErrorBodyText(res.status, text);
  } catch {
    return "";
  }
}

async function describeInvokeFailure(error: unknown, invokeResponse?: Response | null): Promise<string> {
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
  const httpErr = error instanceof FunctionsHttpError ? error : null;
  const maybeName = error && typeof error === "object" && "name" in error ? String((error as { name: string }).name) : "";
  if (httpErr || maybeName === "FunctionsHttpError") {
    const res = (invokeResponse ?? (httpErr?.context as Response | undefined)) as Response | undefined;
    const status = res?.status ?? 0;
    const body = res ? await readResponseDetail(res) : "";
    const invalidJwt = /invalid\s+jwt/i.test(body);
    const hint401 = invalidJwt
      ? "Invalid JWT usually means tokens are for a different Supabase project than your .env: sign out, clear site data (or localStorage keys starting with sb-), fix VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from the same Dashboard → Settings → API, restart npm run dev, sign in again."
      : "Sign out and sign in again. VITE_SUPABASE_* must match the project where nba-odds-slate is deployed.";
    const hint =
      status === 404
        ? "Function not found (404). Almost always: VITE_SUPABASE_URL is a different Supabase project than where you deployed. The ref in https://YOUR_REF.supabase.co must match Dashboard → Edge Functions (where nba-odds-slate appears). Fix .env, restart npm run dev. If it is still missing on that project: npx supabase functions deploy nba-odds-slate"
        : status === 401
          ? hint401
          : status === 502
            ? "Odds API rejected the request (invalid key, quota, or upstream error). Check THE_ODDS_API_KEY secret."
            : status >= 500
              ? "Set secrets THE_ODDS_API_KEY and BALLDONTLIE_API_KEY (Dashboard → Edge Functions → Secrets), then redeploy if needed."
              : "";
    const parts = [`HTTP ${status || "?"}`, hint, body].filter(Boolean);
    return parts.join(" · ");
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
const REFRESH_IF_EXPIRES_WITHIN_SEC = 600;

function extractHttpResponse(error: unknown, invokeResponse?: Response | null): Response | null {
  if (invokeResponse) {
    return invokeResponse;
  }
  if (error && typeof error === "object" && "context" in error) {
    const maybeContext = (error as { context?: unknown }).context;
    if (maybeContext instanceof Response) {
      return maybeContext;
    }
  }
  return null;
}

async function invokeNbaOddsSlate(accessToken: string) {
  return supabase.functions.invoke<NbaOddsSlateResponse>("nba-odds-slate", {
    body: {},
    timeout: INVOKE_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function fetchNbaOddsSlateScenarios(): Promise<NbaOddsSlateResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }
  if (!sessionData.session) {
    throw new Error("You must be signed in to load odds. Sign in and try again.");
  }

  let accessToken = sessionData.session.access_token;
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = sessionData.session.expires_at ?? 0;
  if (!exp || exp - nowSec < REFRESH_IF_EXPIRES_WITHIN_SEC) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session) {
      accessToken = refreshed.session.access_token;
    }
  }

  let { data, error, response: invokeResponse } = await invokeNbaOddsSlate(accessToken);
  if (error) {
    const res = extractHttpResponse(error, invokeResponse);
    const status = res?.status ?? 0;
    const body = res ? await readResponseDetail(res.clone()) : "";
    const invalidJwt = status === 401 && /invalid\s+jwt/i.test(body);

    if (invalidJwt) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        accessToken = refreshed.session.access_token;
        const retry = await invokeNbaOddsSlate(accessToken);
        data = retry.data;
        error = retry.error;
        invokeResponse = retry.response;
      }
    }
  }
  if (error) {
    const res = extractHttpResponse(error, invokeResponse);
    const status = res?.status ?? 0;
    const body = res ? await readResponseDetail(res.clone()) : "";
    const invalidJwt = status === 401 && /invalid\s+jwt/i.test(body);
    if (invalidJwt) {
      // Ensure stale/wrong-project tokens are removed so the next login is clean.
      await supabase.auth.signOut({ scope: "local" });
      throw new Error(
        "HTTP 401 · Invalid JWT. Cleared local auth session to recover from stale or wrong-project tokens. Sign in again, then verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are from the same Supabase project, and restart npm run dev after .env changes.",
      );
    }
    throw new Error(await describeInvokeFailure(error, invokeResponse ?? null));
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
