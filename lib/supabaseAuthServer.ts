import { createClient } from "@supabase/supabase-js";

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAuthClient() {
  const supabaseUrl = readEnv("SUPABASE_URL");
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("Missing required server environment variable: SUPABASE_ANON_KEY");
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function verifyBearerUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, code: "AUTH_HEADER_INVALID", message: "Missing or invalid Authorization header." };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false as const,
      status: 401,
      code: "AUTH_USER_INVALID",
      message: error?.message ?? "Unauthorized",
    };
  }

  return { ok: true as const, user: data.user };
}
