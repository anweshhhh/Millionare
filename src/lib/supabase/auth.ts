import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client.ts";

export async function getCurrentSession() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return null;
  }

  const { data } = await client.auth.getSession();
  return data.session satisfies Session | null;
}

export function onSupabaseAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return () => undefined;
  }

  const { data } = client.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function requestMagicLink(email: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase auth is not configured for this build.");
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    throw error;
  }
}

export async function signOutSupabase() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}
