import { buildNbaOddsSlate, OddsSlateUpstreamError } from "../lib/nbaOddsSlateCore";
import { verifyBearerUser } from "../lib/supabaseAuthServer";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function readHeader(req: ApiRequest, name: string): string | undefined {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function readServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const timestamp = new Date().toISOString();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, timestamp, error: "Method not allowed" });
    return;
  }

  const auth = await verifyBearerUser(readHeader(req, "authorization"));
  if (!auth.ok) {
    res.status(auth.status).json({
      ok: false,
      timestamp,
      code: auth.code,
      error: auth.message,
    });
    return;
  }

  try {
    const oddsKey = readServerEnv("THE_ODDS_API_KEY");
    const bdlKey = readServerEnv("BALLDONTLIE_API_KEY");
    const result = await buildNbaOddsSlate({ oddsKey, bdlKey });

    res.status(200).json({
      ok: true,
      timestamp,
      ...result,
    });
  } catch (error) {
    if (error instanceof OddsSlateUpstreamError) {
      console.error("[nba-odds-slate] upstream error", error.message, error.detail);
      res.status(502).json({
        ok: false,
        timestamp,
        error: error.message,
        detail: error.detail,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const isConfig = message.includes("Missing required server environment variable");
    console.error("[nba-odds-slate] request failed", error);
    res.status(isConfig ? 503 : 500).json({
      ok: false,
      timestamp,
      error: isConfig ? "Odds slate service is not configured" : "Failed to load odds slate",
      hint: isConfig
        ? "Add THE_ODDS_API_KEY and BALLDONTLIE_API_KEY in Vercel → Environment Variables, then redeploy."
        : undefined,
    });
  }
}
