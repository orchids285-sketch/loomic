const devServerBaseUrl = "http://localhost:3001";

/**
 * Is this build pointed at a real agent server?
 *
 * `output: "export"` inlines NEXT_PUBLIC_* at build time, so the answer is fixed when the
 * bundle is made and cannot change at runtime.
 */
export function isServerConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SERVER_BASE_URL?.trim());
}

/**
 * The localhost fallback is for development only, and that distinction is not pedantry.
 *
 * In a deployed build it aimed every request at `http://localhost:3001` — which is not our
 * machine, it is **the visitor's**. Every call became a connection refused against their
 * own computer, and a public page reaching for a private address is something browsers
 * increasingly warn about. A missing server should look like a missing server, not like an
 * attempt to reach into whoever opened the page.
 *
 * Returning an empty string in production is deliberate: callers ask `isServerConfigured()`
 * and stop, instead of firing a request that cannot succeed.
 */
export function getServerBaseUrl() {
  // Must access process.env.NEXT_PUBLIC_* directly — webpack DefinePlugin
  // only replaces direct references, not indirect access via a variable.
  const configuredUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl;
  return process.env.NODE_ENV === "production" ? "" : devServerBaseUrl;
}

export type WebEnv = {
  serverBaseUrl: string;
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export function loadWebEnv(overrides: Partial<WebEnv> = {}): WebEnv {
  return {
    serverBaseUrl: overrides.serverBaseUrl ?? getServerBaseUrl(),
    supabaseUrl:
      overrides.supabaseUrl ??
      requireEnv(
        "NEXT_PUBLIC_SUPABASE_URL",
        process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
    supabaseAnonKey:
      overrides.supabaseAnonKey ??
      requireEnv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
  };
}

function requireEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required browser env: ${name}`);
  }

  return normalizedValue;
}

/**
 * Every call to the agent server goes through here.
 *
 * Without a configured server there is nothing to call, and the old behaviour -- build a
 * URL anyway and fetch it -- produced a wall of failed requests aimed at the visitor's own
 * machine. Rejecting immediately is both faster and truthful, and callers already handle a
 * rejected promise because that is what a failed fetch looked like.
 */
export class ServerNotConfiguredError extends Error {
  constructor() {
    super("The agent server is not configured for this deployment.");
    this.name = "ServerNotConfiguredError";
  }
}

export function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!isServerConfigured()) return Promise.reject(new ServerNotConfiguredError());
  return fetch(`${getServerBaseUrl()}${path}`, init);
}
