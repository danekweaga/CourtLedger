import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import { getSupabaseRefDiagnostic, supabase } from "./supabase";
import { parseInputSnapshot } from "../utils/intelligenceForm";

export interface NbaOddsSlateResponse {
  scenarios: BetIntelligenceScenarioInput[];
  count: number;
  odds_requests_remaining: string | null;
  odds_requests_used: string | null;
  disclaimer: string;
}

type OddsSlateErrorCode =
  | "AuthSessionMissing"
  | "AuthTokenInvalid"
  | "FunctionUnauthorized"
  | "FunctionNotFound"
  | "UpstreamProviderError"
  | "FunctionUnavailable"
  | "NetworkError"
  | "UnknownInvokeError";

type StructuredEdgeError = {
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
  error?: string;
  detail?: string;
};

class OddsSlateError extends Error {
  readonly code: OddsSlateErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly details: string | null;

  constructor(
    code: OddsSlateErrorCode,
    message: string,
    status: number,
    retryable = false,
    details: string | null = null,
  ) {
    super(message);
    this.name = "OddsSlateError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}

const INVOKE_TIMEOUT_MS = 120_000;
const AUTH_TOKEN_INVALID_EVENT = "courtledger:auth-token-invalid";

function notifyAuthTokenInvalid(message: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKEN_INVALID_EVENT, {
      detail: { message },
    }),
  );
}

function extractHttpResponse(error: unknown, invokeResponse?: Response | null): Response | null {
  if (invokeResponse) {
    return invokeResponse;
  }
  if (error && typeof error === "object" && "context" in error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      return ctx;
    }
  }
  return null;
}

function toBodyText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const json = JSON.parse(trimmed) as StructuredEdgeError;
    const parts = [json.code, json.message, json.error, json.detail].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" · ");
    }
  } catch {
    // non-json body
  }
  return trimmed.slice(0, 400);
}

async function readResponseBody(res: Response | null): Promise<{ status: number; text: string; parsed: StructuredEdgeError | null }> {
  if (!res) {
    return { status: 0, text: "", parsed: null };
  }
  try {
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed) {
      return { status: res.status, text: "", parsed: null };
    }
    try {
      return { status: res.status, text: toBodyText(trimmed), parsed: JSON.parse(trimmed) as StructuredEdgeError };
    } catch {
      return { status: res.status, text: toBodyText(trimmed), parsed: null };
    }
  } catch {
    return { status: res.status, text: "", parsed: null };
  }
}

function classifyInvokeFailure(args: { error: unknown; status: number; bodyText: string; parsed: StructuredEdgeError | null }): OddsSlateError {
  const { error, status, bodyText, parsed } = args;
  if (error instanceof FunctionsFetchError) {
    return new OddsSlateError(
      "NetworkError",
      "Could not reach Supabase Edge Functions (network error before any response). Check connectivity/ad blockers and verify VITE_SUPABASE_URL.",
      0,
      true,
      bodyText || null,
    );
  }
  if (error instanceof FunctionsRelayError) {
    return new OddsSlateError(
      "FunctionUnavailable",
      "Supabase relay could not run nba-odds-slate. Redeploy the function or check Edge Function logs.",
      0,
      true,
      bodyText || null,
    );
  }
  const edgeCode = parsed?.code ?? "";
  const gatewayInvalidJwt = /invalid\s+jwt/i.test(bodyText) && !edgeCode;
  const invalidJwt = /invalid\s+jwt/i.test(bodyText) || edgeCode.includes("TOKEN_REF_MISMATCH");
  if (status === 401 && invalidJwt) {
    const prefix = gatewayInvalidJwt ? "Supabase gateway rejected JWT." : "Edge auth rejected JWT.";
    return new OddsSlateError(
      "AuthTokenInvalid",
      `${prefix} Sign out and sign in again. If it persists, verify Supabase project alignment (${getSupabaseRefDiagnostic()}).`,
      401,
      true,
      bodyText || null,
    );
  }
  if (status === 401) {
    return new OddsSlateError(
      "FunctionUnauthorized",
      "Unauthorized call to nba-odds-slate. Ensure the user is signed in and function auth is configured correctly.",
      401,
      false,
      bodyText || null,
    );
  }
  if (status === 404) {
    return new OddsSlateError(
      "FunctionNotFound",
      "Function not found (404). Ensure `nba-odds-slate` is deployed to the same Supabase project as your frontend URL.",
      404,
      false,
      bodyText || null,
    );
  }
  if (status === 502) {
    return new OddsSlateError(
      "UpstreamProviderError",
      "Odds provider request failed (502). Check THE_ODDS_API_KEY quota/validity and function logs.",
      502,
      true,
      bodyText || null,
    );
  }
  if (status >= 500) {
    return new OddsSlateError(
      "FunctionUnavailable",
      "Edge function failed (5xx). Check THE_ODDS_API_KEY/BALLDONTLIE_API_KEY secrets and function logs.",
      status,
      true,
      bodyText || null,
    );
  }
  if (error instanceof FunctionsHttpError) {
    return new OddsSlateError("UnknownInvokeError", `HTTP ${status || "?"} while calling nba-odds-slate.`, status, false, bodyText || null);
  }
  if (error instanceof Error) {
    return new OddsSlateError("UnknownInvokeError", error.message, status, false, bodyText || null);
  }
  return new OddsSlateError("UnknownInvokeError", String(error), status, false, bodyText || null);
}

async function invokeNbaOddsSlate(accessToken: string) {
  return supabase.functions.invoke<NbaOddsSlateResponse>("nba-odds-slate", {
    body: {},
    timeout: INVOKE_TIMEOUT_MS,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function normalizeResponse(data: unknown): NbaOddsSlateResponse {
  if (!data || typeof data !== "object") {
    throw new OddsSlateError("UnknownInvokeError", "Empty response from nba-odds-slate.", 0);
  }
  const raw = data as Record<string, unknown>;
  if (typeof raw.error === "string") {
    throw new OddsSlateError("UnknownInvokeError", raw.error, 0);
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

export async function fetchNbaOddsSlateScenarios(): Promise<NbaOddsSlateResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new OddsSlateError("UnknownInvokeError", `Session error: ${sessionError.message}`, 0);
  }
  const currentSession = sessionData.session;
  if (!currentSession?.access_token) {
    throw new OddsSlateError("AuthSessionMissing", "You must be signed in to load odds. Sign in and try again.", 401);
  }

  async function validateTokenOrRefresh(token: string): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (!userError && userData.user) {
      return token;
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      const msg = "Session refresh failed. Sign in again and retry.";
      notifyAuthTokenInvalid(msg);
      throw new OddsSlateError("AuthTokenInvalid", msg, 401, false, refreshError?.message ?? userError?.message ?? null);
    }

    const refreshedToken = refreshed.session.access_token;
    const { data: refreshedUser, error: refreshedUserError } = await supabase.auth.getUser(refreshedToken);
    if (refreshedUserError || !refreshedUser.user) {
      const msg = "Session refresh did not yield a usable auth token. Sign in again and retry.";
      notifyAuthTokenInvalid(msg);
      throw new OddsSlateError("AuthTokenInvalid", msg, 401, false, refreshedUserError?.message ?? null);
    }
    return refreshedToken;
  }

  let token = await validateTokenOrRefresh(currentSession.access_token);
  let triedRefresh = false;

  for (;;) {
    const { data, error, response } = await invokeNbaOddsSlate(token);
    if (!error) {
      return normalizeResponse(data);
    }

    const res = extractHttpResponse(error, response);
    const body = await readResponseBody(res);
    const mapped = classifyInvokeFailure({ error, status: body.status, bodyText: body.text, parsed: body.parsed });

    if (mapped.code === "AuthTokenInvalid" && !triedRefresh) {
      triedRefresh = true;
      token = await validateTokenOrRefresh(token);
      continue;
    }

    if (mapped.code === "AuthTokenInvalid") {
      notifyAuthTokenInvalid(mapped.message);
    }
    if (mapped.details) {
      throw new Error(`${mapped.message} · ${mapped.details}`);
    }
    throw new Error(mapped.message);
  }
}
