import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Throwing early makes local setup failures obvious.
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

function getProjectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const [subdomain] = host.split(".");
    return subdomain || null;
  } catch {
    return null;
  }
}

function getProjectRefFromAnonKey(key: string): string | null {
  try {
    const payloadB64 = key.split(".")[1];
    if (!payloadB64) {
      return null;
    }
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as { ref?: string };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

const urlRef = getProjectRefFromUrl(supabaseUrl);
const anonRef = getProjectRefFromAnonKey(supabaseAnonKey);
if (urlRef && anonRef && urlRef !== anonRef) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are from different Supabase projects. Copy both from the same Dashboard → Settings → API page.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
