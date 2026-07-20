import { readCronSecretHeader, verifyCronSecretRequest } from "./_lib/cronAuth";
import { getSupabaseAnonServerClient } from "./_lib/supabaseServerAnon";

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
    const supabase = getSupabaseAnonServerClient();
    const { error } = await supabase.from("keepalive_ping").select("id").limit(1);

    if (error) {
      throw error;
    }

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
