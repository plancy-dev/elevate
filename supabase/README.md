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
- Redirect URLs: `http://localhost:3000/auth/callback` (and `https://your-domain.com/auth/callback`)

### Google & Microsoft (Azure) sign-in

Under **Authentication → Providers**:

1. **Google** — enable, add OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com/) (authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Azure** — enable Microsoft provider; register an app in Azure Entra ID and paste Application (client) ID, client secret, and tenant. Redirect URI in Azure must include Supabase’s callback URL.

The app calls `signInWithOAuth` with `redirectTo: <origin>/auth/callback?next=...`. No extra Next.js routes are required beyond `src/app/auth/callback/route.ts`.

## Admin user (email/password)

Raw `INSERT` into `auth.users` in SQL is **not** recommended (schema varies by version). Use one of:

1. **Dashboard**: **Authentication → Users → Add user** (email + password). The `handle_new_user` trigger creates `public.profiles`. Then run in SQL Editor:  
   `update public.profiles set role = 'admin' where email = 'your@email.com';`
2. **Script** (service role required): from repo root,  
   `ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm run db:seed-admin`  
   See `scripts/seed-admin.mjs`.
