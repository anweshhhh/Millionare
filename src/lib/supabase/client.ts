import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import { assertSupabaseEnv, getSupabaseEnv } from "./env.ts";

let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured() {
  return getSupabaseEnv().isConfigured;
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const env = assertSupabaseEnv();

  browserClient = createClient<Database>(env.url, env.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserClient;
}
