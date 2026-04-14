# PLAN: Studio provider integrations (v2)

**ADR:** [`docs/adr/ADR-006-studio-provider-integrations-v2.md`](../adr/ADR-006-studio-provider-integrations-v2.md)  
**API vs shipped (living doc):** [`STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](./STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md)  
**Goal:** Same episode + artifact model as v1; **optional** org-level credentials and **server-side** provider steps for connected orgs only.

## Principles

1. **v1 unchanged** when flags off — paste workflows keep working.
2. **Opt-in per org** — no global keys in env for end-user creative tools (except future shared demo mode if ever added; document separately).
3. **Server-only secrets** — see ADR-006 trust boundaries.
4. **Idempotent / auditable jobs** — follow patterns similar to Lemon webhook idempotency ([`ADR-004`](../adr/ADR-004-lemon-squeezy-global-payments.md)) for “integration run” rows (table TBD).

## Phases

### Phase 0 — Scaffolding (current)

- [x] ADR-006 + this PLAN
- [x] `src/lib/studio-integrations/` — provider enum, feature helpers
- [x] `/dashboard/productions/integrations` — roadmap / status page (i18n)
- [ ] `pnpm verify` on every change

### Phase 1 — Credentials storage

- [ ] Migration: org-scoped connection table + RLS (see ADR-006)
- [ ] Encryption key strategy (`STUDIO_INTEGRATIONS_ENCRYPTION_KEY` or Vault) — ops checklist
- [ ] Server Actions: save / delete / “test connection” (no-op or ping) for **one** provider first (OpenAI-compatible)

### Phase 2 — First vertical slice (OpenAI)

- [ ] Adapter: `generateShortScriptFromEpisode` (inputs: episode title, notes, template shell if any)
- [ ] Write result to **new artifact** or update draft artifact — user-visible, reversible
- [ ] Rate limit + org quota (reuse existing rate-limit helpers if applicable)

### Phase 3 — Runway / assets

**상세 PLAN (Runway만):** [`PLAN-runway-integration.md`](./PLAN-runway-integration.md) — 엔드포인트·페이로드·UI 상태머신·BUILD 순서.

- [ ] Adapter: submit job + poll (or webhook if vendor supports)
- [ ] Store `external_url` / asset reference on artifact when complete

### Phase 4 — YouTube upload

- [ ] OAuth or API key flow per Google policy — **separate security review**
- [ ] Upload from stored file URL or bytes; set `publish_url` on success

### Phase 5 — Product polish

- [ ] PostHog events (single enum file per [posthog-integration.mdc](../../.cursor/rules/posthog-integration.mdc))
- [ ] Docs: operator runbook for key rotation

## Open questions (CREATIVE / PLAN before BUILD)

- Which **roles** may save org credentials? (org admin only vs any editor)
- **Billing**: metered API usage vs bring-your-own-key only for v2 MVP
- **Runway** API availability and ToS for automated server calls

## File map (target)

```
src/lib/studio-integrations/
  types.ts
  feature.ts
  index.ts
  providers/
    openai/
    runway/
    youtube/
```

## Env (document in `.env.local.example` only; never commit secrets)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_STUDIO_INTEGRATIONS_UI` | Show integrations nav + page shell |
| `STUDIO_INTEGRATIONS_ENABLED` | Allow server to call providers (default false) |
| `STUDIO_INTEGRATIONS_ENCRYPTION_KEY` | Encrypt org credential blobs at rest (if app-layer encryption) |
