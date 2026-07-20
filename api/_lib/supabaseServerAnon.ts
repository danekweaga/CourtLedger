import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAnonServer: SupabaseClient | null = null;

function readServerSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing required server environment variable: SUPABASE_URL");
  }
  return value;
}

function readServerAnonKey(): string {
  const value = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error("Missing required server environment variable: SUPABASE_ANON_KEY");
  }
  return value;
}

export function getSupabaseAnonServerClient(): SupabaseClient {
  if (supabaseAnonServer) {
    return supabaseAnonServer;
  }

  supabaseAnonServer = createClient(readServerSupabaseUrl(), readServerAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAnonServer;
}
