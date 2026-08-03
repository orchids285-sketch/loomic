import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@loomic/shared";

let client: SupabaseClient<Database> | null = null;

/**
 * Is this build pointed at a real Supabase project?
 *
 * `output: "export"` inlines these at build time, so an unconfigured deployment can be
 * detected once, here, rather than by every caller guessing from a failed request.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL
                 && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * This used to throw when the environment was missing. That is the correct instinct in the
 * wrong place: `AuthProvider` builds the client inside an effect and it is mounted in the
 * root layout, so the throw unmounted the entire application -- a blank page for a missing
 * environment variable, with the real cause only visible in the console.
 *
 * Now an unconfigured build gets a client aimed at an address that resolves nowhere. Auth
 * calls fail as network errors, which is what callers already handle, and the interface
 * renders signed-out instead of not at all. Ask `isSupabaseConfigured()` when the answer
 * should change what the user is told.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unconfigured.invalid";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "unconfigured";

  client = createClient<Database>(url, anonKey, {
    auth: {
      detectSessionInUrl: false,
      flowType: "pkce",
      // Nothing to persist or refresh against an address that resolves nowhere, and
      // leaving the refresh timer on means a failing request every few seconds forever.
      ...(isSupabaseConfigured() ? {} : { persistSession: false, autoRefreshToken: false }),
    },
  });

  return client;
}
