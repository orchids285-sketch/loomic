# Deploying Loomic as the FoundReach Images canvas

This fork is what the **Images** tab embeds. The tab is wired already — `warm.TOOL_URLS`,
the `wl-loomic` proxy and the session mint at `/api/loomic/user-session` all exist in the
app repo. What is left is standing the three pieces up.

## Topology

| piece | where | why there |
|---|---|---|
| `apps/web` | **Vercel** | `next.config.ts` sets `output: "export"` — it is a static SPA, so a Railway service for it would be a container that serves files and sleeps |
| `apps/server` | **Railway** (Dockerfile at `apps/server/Dockerfile`, `railway.json` already points at it) | long-lived Fastify + LangGraph + a queue worker |
| Supabase | **supabase.com free tier** | auth, Postgres, storage and the PGMQ job queue — the server throws without it, by design |
| `wl-loomic` | **Railway** (`proxies/wl-embed` in the app repo, `TOOL=loomic`) | strips the framing headers, hides Loomic's own login and pricing, carries the embed ticket |

## What is already live

**The web half is deployed: https://loomic-indol.vercel.app** (Vercel project `loomic`,
team `naouelbenjemaa-9107s-projects`). It is the real interface and it needs no Railway,
which is the reason it could ship while the rest could not.

Two settings had to be right, and both fail with the same misleading message
(*"No Next.js version detected"*): the project's **framework must be `null`**, not
`nextjs` — the root `package.json` of this pnpm workspace has no `next` dependency, so
detection fails at the root even though `apps/web` is a Next app — and the build must be
declared explicitly. Passing them in the deployment body is not enough; the **project's
stored settings win**, so PATCH the project:

```
framework=null
installCommand=pnpm install --no-frozen-lockfile
buildCommand=pnpm --filter @loomic/shared build && pnpm --filter @loomic/web build
outputDirectory=apps/web/out
```

Signing in will fail until Supabase exists. That is the expected state, not a regression.

## Steps

**1. Supabase.** Create a project, then from this directory:

```bash
supabase link --project-ref <ref>
supabase db push        # applies supabase/migrations
```

**2. The agent server** (Railway, one service):

```bash
railway up --service loomic-server
```

Variables — the model keys are the ones the app already uses; **no new paid key is
needed**:

```
SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL
SUPABASE_PROJECT_ID / SUPABASE_JWT_SECRET
GOOGLE_API_KEY          # Gemini + Imagen + Veo — the same key the backend uses
OPENAI_API_KEY          # OpenRouter key
OPENAI_API_BASE=https://openrouter.ai/api/v1
LOOMIC_WEB_ORIGIN=https://<the Vercel domain>
```

**3. The web app** (Vercel). Build settings come from `vercel.json`; set three build-time
variables, since `output: "export"` bakes them into the bundle — changing them later means
rebuilding, not restarting:

```
NEXT_PUBLIC_SERVER_BASE_URL=https://<the Railway server domain>
NEXT_PUBLIC_SUPABASE_URL=<supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

**4. The proxy** — from the app repo, `proxies/wl-embed`:

```bash
railway up --service wl-loomic
# UPSTREAM=https://loomic-indol.vercel.app  TOOL=loomic  FR_BACKEND=https://<api>  BRAND=Images
```

**5. The app backend** needs, for the session mint:

```
SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
LOOMIC_USER_SECRET=<any long random string>
LOOMIC_URL=https://<the wl-loomic domain>     # overrides the default in warm.TOOL_URLS
```

`LOOMIC_USER_SECRET` is what per-user Loomic passwords are derived from. **Set it once and
keep it.** Rotating it changes every derived password; the mint repairs accounts rather
than stranding them, but that is a repair, not a no-op.

## How the login works

The user signed into FoundReach and must not meet a second account. So:

1. the iframe URL carries `?fr_user=<clerk id>&t=<embed ticket>`;
2. `wl-loomic` injects a boot script that calls `/api/loomic/user-session`;
3. the backend verifies the **ticket** — without it, `?fr_user=<victim>` would mint the
   victim's canvas, because a public path skips the anti-IDOR check;
4. it signs in as that user's derived Supabase account and returns the session;
5. the boot script writes it to `sb-<project ref>-auth-token` and reloads.

The key comes from the backend rather than being guessed by the proxy: guess it wrong and
the write succeeds, nothing reads it, and the canvas simply shows its login — a failure
with no error anywhere.

If Supabase is not configured the mint answers `not configured` and the iframe stays
signed out. That is deliberate: a login screen is a state a user can understand.
