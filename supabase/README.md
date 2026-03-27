# Supabase migrations

1. Open the [SQL Editor](https://supabase.com/dashboard/project/_/sql) for your project.
2. **Optional reset (dev/staging only):** Run `migrations/000_pre_init_cleanup.sql` first to drop `snapp*` schemas and all objects in `public`. **Back up first** — this deletes data.
3. Run in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_profiles_select_own.sql`
   - `migrations/003_session_attendees_policies.sql` (RLS for `session_attendees` writes)

## Auth redirect URLs

In **Authentication → URL Configuration**, add:

- Site URL: `http://localhost:3000` (and your production URL later)
- Redirect URLs: **must** include the exact recovery/OAuth callback the app uses, e.g.  
  `http://localhost:3000/auth/callback`  
  (You can use a wildcard such as `http://localhost:3000/**` if your project allows it.)  
  If the reset link redirects to `/` with `#error=...&error_code=otp_expired`, the link was already used, expired (~1 hour), or the callback URL is not allow-listed—request a **new** reset email after fixing URLs.

### Password recovery (production / Vercel)

- **Site URL root + PKCE:** If Supabase redirects to `https://your-app.vercel.app/?code=...` (because Site URL is the root, or dashboard “Send password recovery” did not use `/auth/callback`), **middleware** forwards that request to `/auth/callback?code=...` so `exchangeCodeForSession` runs. Without this, users briefly see the marketing home and never complete sign-in.
- **Do not** rely on `redirect_to` pointing only at the Site URL root for **implicit** flows: after verification, Supabase may send users to `/#access_token=...`; next-intl then redirects `/` → `/ko` (or another locale), and **many browsers drop the URL hash on that redirect**, so the session never applies and you only see the marketing home. (This project sets `localeDetection: false` to reduce that risk.)
- Add these to **Redirect URLs** (adjust host):  
  `https://your-app.vercel.app/auth/callback`  
  For preview deployments, add each host or a pattern your Supabase project allows (e.g. `https://*.vercel.app/auth/callback` if supported).
- The app uses `resetPasswordForEmail` and **magic link** (`signInWithOtp`) with `emailRedirectTo: <origin>/auth/callback?next=...` (password reset uses `next=/auth/update-password`). Those paths are **not** locale-prefixed, so fragments and PKCE queries stay intact.
- **PKCE** links use `?code=` on `/auth/callback`. After `exchangeCodeForSession`, Supabase JS includes **`redirectType: recovery`** (from PKCE storage) even when the URL has no `next` query—e.g. older emails or dashboard “Send password recovery.” The callback must route recovery sessions to `/auth/update-password` instead of defaulting to `/dashboard`.
- **Recovery session vs `/login`:** A reset link can leave the user with a valid session while they still need to choose a new password. Middleware must not treat that like a normal login: if the access token’s JWT `amr` indicates **recovery**, requests to `/login`, `/signup`, `/forgot-password`, or `/dashboard` are redirected to **`/auth/update-password`** (see `updateSession`).

Full checklist (redirect URIs, Client ID formatting, Azure secrets, **account linking**): **[docs/SOCIAL_AUTH.md](../docs/SOCIAL_AUTH.md)**.

### Google & Microsoft (Azure) sign-in

Under **Authentication → Providers**:

1. **Google** — enable, add OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com/) (authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Azure** — enable Microsoft provider; register an app in Azure Entra ID and paste Application (client) ID, client secret, and tenant. Redirect URI in Azure must include Supabase’s callback URL.

The app calls `signInWithOAuth` with `redirectTo: <origin>/auth/callback?next=...`. The callback is implemented as `src/app/auth/callback/page.tsx` (client exchange + hash handling).

### Email rate limits (`429: email rate limit exceeded`)

Supabase applies **rate limits on auth emails** (signup, magic link, password recovery). If you see `429: email rate limit exceeded` in **Auth logs** or the dashboard toast when using **Send password recovery**, you have hit that limit—often after many attempts in a few minutes.

**What to do:** wait (often on the order of an hour; exact windows are platform-defined), then send **one** reset request. Avoid clicking “Send reset link” or dashboard recovery repeatedly while testing.

### Auth flow debug logs (issue tracking)

The app emits structured lines prefixed with **`[elevate-auth-flow]`** (JSON per line). Use them to trace password recovery vs PKCE vs hash:

- **Vercel → Logs**: filter by `elevate-auth-flow` to see middleware (`middleware.pkce_forward`, `middleware.session_guard`) and Edge `updateSession` behavior.
- **Browser → DevTools Console**: same prefix; full client-side sequence (callback, hash handler, `auth.resolve.*`, update-password mount).
- **sessionStorage** key `elevate_auth_flow_v1`: rolling JSON array of the last events (safe: no raw tokens; `code` is length-only). Copy for tickets:  
  `JSON.parse(sessionStorage.getItem('elevate_auth_flow_v1'))`  
  Disable logging: set env **`NEXT_PUBLIC_AUTH_FLOW_DEBUG=0`** (build-time).

Docs: [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).

## Users & admin role (no seed script required)

**Recommended:** add users in **Authentication → Users** (email + password) or use the app’s **Sign up**. The `handle_new_user` trigger creates `public.profiles`.

On the **first successful login**, when the profile has no organization yet, the app’s onboarding (`ensureDefaultOrganization` in `src/actions/onboarding.ts`) creates a default organization and sets **`role` to `admin`** for that user. You do **not** need to run SQL or `pnpm db:seed-admin` for that flow.

### Optional: `pnpm db:seed-admin`

Use `scripts/seed-admin.mjs` only if you want to **create or reset a user from the CLI** (requires `SUPABASE_SERVICE_ROLE_KEY`). If the email already exists, the script resets the password and sets `role = admin` on `profiles`. This is a convenience for automation—not a requirement when the user already exists in the Dashboard.

## Login returns 400 (`grant_type=password`)

The browser calls `POST .../auth/v1/token?grant_type=password`. A **400** almost always means:

- The **password does not match** what Supabase has for that email, or  
- **Email confirmation** is required and the address is not confirmed (Supabase **Authentication → Providers → Email** → “Confirm email”).

**Fix:** In **Authentication → Users**, open the user and **set or reset the password**, or use **Forgot password** on the login page (with SMTP configured in Supabase if required). You do not need to run `db:seed-admin` just because the user row already exists.
