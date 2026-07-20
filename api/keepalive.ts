type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const SECRET_QUERY_PARAM_NAMES = ["cron_secret", "secret", "x-cron-secret", "token"] as const;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function hasSecretInQueryString(requestUrl: string): boolean {
  try {
    const url = new URL(requestUrl, "http://localhost");
    return SECRET_QUERY_PARAM_NAMES.some((name) => url.searchParams.has(name));
  } catch {
    return false;
  }
}

function readCronSecretHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
): string | null {
  if (!headers) {
    return null;
  }
  const raw = headers["x-cron-secret"] ?? headers["X-Cron-Secret"];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw ?? null;
}

function verifyCronSecretRequest(
  configuredSecret: string | undefined | null,
  headerValue: string | null | undefined,
  requestUrl?: string,
): { ok: true } | { ok: false; status: 503 | 401 | 400; message: string } {
  const secret = configuredSecret?.trim();
  if (!secret) {
    return { ok: false, status: 503, message: "CRON_SECRET is not configured" };
  }
  if (requestUrl && hasSecretInQueryString(requestUrl)) {
    return { ok: false, status: 400, message: "Secrets must not be sent in query strings" };
  }
  const provided = headerValue?.trim();
  if (!provided || !timingSafeEqual(provided, secret)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  return { ok: true };
}

function readServerSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing required server environment variable: SUPABASE_URL");
  }
  return value.replace(/\/$/, "");
}

function readServerAnonKey(): string {
  const value = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error("Missing required server environment variable: SUPABASE_ANON_KEY");
  }
  return value;
}

async function pingKeepaliveTable(): Promise<void> {
  const supabaseUrl = readServerSupabaseUrl();
  const anonKey = readServerAnonKey();
  const response = await fetch(`${supabaseUrl}/rest/v1/keepalive_ping?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase keepalive query failed with status ${response.status}`);
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const timestamp = new Date().toISOString();

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({
      ok: false,
      timestamp,
      error: "Method not allowed",
    });
    return;
  }

  const auth = verifyCronSecretRequest(
    process.env.CRON_SECRET,
    readCronSecretHeader(req.headers),
    req.url,
  );
  if (!auth.ok) {
    res.status(auth.status).json({
      ok: false,
      timestamp,
      error: auth.message,
    });
    return;
  }

  if (req.method === "HEAD") {
    res.status(200).json({ ok: true, timestamp });
    return;
  }

  try {
    await pingKeepaliveTable();
    res.status(200).json({
      ok: true,
      timestamp,
      message: "Keepalive completed",
    });
  } catch (error) {
    console.error("[keepalive] Supabase keepalive query failed", error);
    res.status(500).json({
      ok: false,
      timestamp,
      error: "Keepalive query failed",
    });
  }
}
