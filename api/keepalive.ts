import { getSupabaseAdminClient } from "../lib/supabaseAdmin";

type ApiRequest = {
  method?: string;
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

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("bets").select("id").limit(1);

    if (error) {
      throw error;
    }

    res.status(200).json({
      ok: true,
      timestamp,
      message: "Keepalive completed",
      query: "select id from bets limit 1",
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
