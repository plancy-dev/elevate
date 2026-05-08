# RUNBOOK: Apply `052_drop_mice_legacy_tables.sql` (MICE schema removal)

**Scope:** Drops `public.venues`, `events`, `sessions`, `attendees`, `session_attendees` and enums `event_type`, `event_status`, `registration_type`. **Irreversible data loss** for any rows still in those tables.

**Refs:** [`supabase/migrations/052_drop_mice_legacy_tables.sql`](../../supabase/migrations/052_drop_mice_legacy_tables.sql)

**Project SoT:** the Supabase project behind `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_PROJECT_ID` in operator `.env.local` (must match staging vs prod intent).

---

## Preconditions (gates)

1. Confirm **zero production dependency** on MICE routes/data (already removed from app).
2. **Staging first**, then production — same migration file order.
3. **Do not run `pnpm db:types` until migration is applied on that project** — otherwise regenerated `database.types.ts` may re-include dropped tables while remote schema still carries them.

---

## 1. Backup (staging, then prod)

Pick one **per environment** before running `052`:

### A — Supabase Dashboard (recommended where available)

1. Supabase Dashboard → **Database** → **Backups** (or **Points in time** on Pro/plans with PITR).
2. Note backup window / retention; if only daily backups exist, coordinate a quiet window.

### B — Logical dump (`pg_dump`, operator machine)

Requires DB connection string (**never commit**).

```bash
# Example naming; replace placeholders. Use SSL/port from project settings.
pg_dump "$DATABASE_URL_STAGING" \
  --schema=public \
  --no-owner \
  --format=custom \
  -f "elevate-staging-public-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Optional: dump **only** legacy tables before drop (lighter evidence):

```bash
pg_dump "$DATABASE_URL_STAGING" \
  --schema=public \
  --table=public.events --table=public.venues \
  --table=public.sessions --table=public.attendees --table=public.session_attendees \
  --format=custom \
  -f "elevate-staging-mice-only-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Repeat with production URL **after staging success**.

---

## 2. Apply migration

**Staging**

1. SQL Editor → paste contents of `052_drop_mice_legacy_tables.sql` → run once.
2. Verify: `\dt public.events` (psql) or Dashboard **Table Editor** — tables absent.

**Production** (repeat after staging sign-off)

- Same SQL file, same verification.

(Optional) If using Supabase CLI with linked projects: `supabase db push` only if your workflow treats `052` as part of tracked migrations — match team convention.

---

## 3. Regenerate TypeScript types (after apply only)

From repo root, with `.env.local` pointing at the **same** project you migrated:

```bash
pnpm db:types
```

- Review git diff on `src/types/database.types.ts` — dropped tables/types must stay **gone**.
- **`pnpm verify`** before merge/deploy if types changed.

---

## 4. Evidence line (paste into GitHub issue / memory-bank)

```text
052 MICE schema drop applied | env=<staging|prod> | utc=<YYYY-MM-DDThh:mm:ssZ> | backup=<dashboard|dump path ref> | project_ref=<NEXT_PUBLIC_SUPABASE_URL host or project id> | types regen=<commit or pending>
```

---

## Rollback

No in-repo rollback DDL: restore from backup / PITR only.
