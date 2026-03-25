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

Enable **Google** and/or **Azure** (Microsoft) under Authentication → Providers if you use those buttons.
