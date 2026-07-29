import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: { url: string; key: string; client: SupabaseClient } | null = null;

/** Strip mistaken /rest/v1 suffix from Project URL. */
function normalizeSupabaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

/** Server-only Supabase client using the secret key (bypasses RLS). */
export function getSupabase(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!rawUrl || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.",
    );
  }

  const url = normalizeSupabaseUrl(rawUrl);

  if (!cached || cached.url !== url || cached.key !== key) {
    cached = {
      url,
      key,
      client: createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
    };
  }

  return cached.client;
}
