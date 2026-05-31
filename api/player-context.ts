import { bdlFetch } from "../lib/balldontlieClient";
import { verifyBearerUser } from "../lib/supabaseAuthServer";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: string | Record<string, unknown>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

interface BdlPlayer {
  id: number;
  first_name: string;
  last_name: string;
}

interface BdlSeasonAvg {
  pts?: number;
  reb?: number;
  ast?: number;
  fg3m?: number;
  min?: string;
}

interface BdlGameStat {
  pts?: number;
  reb?: number;
  ast?: number;
  fg3m?: number;
  min?: string;
}

const MARKET_STAT: Record<string, keyof BdlSeasonAvg> = {
  points: "pts",
  rebounds: "reb",
  assists: "ast",
  threes_made: "fg3m",
};

function readHeader(req: ApiRequest, name: string): string | undefined {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function parseBody(req: ApiRequest): Record<string, unknown> {
  if (!req.body) {
    return {};
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return req.body;
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
    res.status(auth.status).json({ ok: false, timestamp, code: auth.code, error: auth.message });
    return;
  }

  const body = parseBody(req);
  const playerName = typeof body.player_name === "string" ? body.player_name.trim() : "";
  const marketType = typeof body.market_type === "string" ? body.market_type.trim().toLowerCase() : "points";

  if (!playerName) {
    res.status(400).json({ ok: false, timestamp, error: "player_name is required" });
    return;
  }

  try {
    const bdlKey = readServerEnv("BALLDONTLIE_API_KEY");
    const searchQ = encodeURIComponent(playerName.slice(0, 40));
    const playersJson = (await bdlFetch(`/players?search=${searchQ}&per_page=10`, bdlKey)) as { data: BdlPlayer[] };
    const player = playersJson.data?.[0];
    if (!player) {
      res.status(404).json({ ok: false, timestamp, error: "Player not found in balldontlie" });
      return;
    }

    const seasonJson = (await bdlFetch(`/season_averages?season=2024&player_ids[]=${player.id}`, bdlKey)) as {
      data: BdlSeasonAvg[];
    };
    const season = seasonJson.data?.[0];

    const statsJson = (await bdlFetch(`/stats?player_ids[]=${player.id}&per_page=5`, bdlKey)) as { data: BdlGameStat[] };
    const lastGames = statsJson.data ?? [];

    const statKey = MARKET_STAT[marketType] ?? "pts";
    const seasonVal = season?.[statKey];
    const recentVals = lastGames
      .map((g) => g[statKey as keyof BdlGameStat])
      .filter((v): v is number => typeof v === "number");

    const recentAvg =
      recentVals.length > 0 ? recentVals.reduce((a, b) => a + b, 0) / recentVals.length : null;

    const recentFormParts: string[] = [];
    if (typeof seasonVal === "number") {
      recentFormParts.push(`Season avg ${statKey}: ${seasonVal.toFixed(1)}`);
    }
    if (recentAvg != null) {
      recentFormParts.push(`L${recentVals.length} avg ${statKey}: ${recentAvg.toFixed(1)}`);
    }
    if (lastGames[0] && typeof lastGames[0][statKey as keyof BdlGameStat] === "number") {
      recentFormParts.push(`Last game ${statKey}: ${lastGames[0][statKey as keyof BdlGameStat]}`);
    }

    res.status(200).json({
      ok: true,
      timestamp,
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`.trim(),
      recent_form: recentFormParts.join(" · "),
      matchup_notes: recentFormParts.length
        ? "Enriched from balldontlie season and recent game logs."
        : "No stat history returned for this market.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isConfig = message.includes("Missing required server environment variable");
    console.error("[player-context] request failed", error);
    res.status(isConfig ? 503 : 500).json({
      ok: false,
      timestamp,
      error: isConfig ? "Player context service is not configured" : "Failed to load player context",
      hint: isConfig ? "Add BALLDONTLIE_API_KEY in Vercel → Environment Variables, then redeploy." : undefined,
    });
  }
}
