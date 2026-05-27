const viteEnv: Record<string, string | undefined> =
  (typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env) ||
  {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey =
  viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? viteEnv.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
};

export function getSupabaseEnv(): SupabaseEnv {
  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    isConfigured: Boolean(supabaseUrl && supabasePublishableKey)
  };
}

export function assertSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new Error(
      "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return env;
}
