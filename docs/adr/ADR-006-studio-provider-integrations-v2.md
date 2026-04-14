# ADR-006: Studio provider integrations (v2 — org credentials & server adapters)

## Status

**Proposed** — scaffolding and plan only; no production API calls to Runway / OpenAI / YouTube until Phases 1–3 in [`PLAN-studio-provider-integrations.md`](../features/PLAN-studio-provider-integrations.md) are implemented and reviewed.

## Context

- [`ADR-003`](ADR-003-studio-productions-mvp.md) **remains valid for v1**: ledger, artifacts, links, RLS — **no vendor APIs**.
- Product copy and roadmap now describe a **superset**: organizations that **opt in** and **store provider credentials** can later run **server-side steps** (generate script, render clip, upload Short) **on the same episode record** without replacing manual paste workflows.
- This ADR defines **v2** boundaries so implementation does not blur v1 guarantees or leak secrets to the client.

## Decision

### 1. Versioning

| Layer | Scope |
|--------|--------|
| **v1** | Unchanged — paste-only, no OAuth/API from Elevate servers to creative tools. |
| **v2** | Optional, org-scoped **integrations**: encrypted or vault-backed credentials, **server-only** adapters, explicit **feature flags**, audit trail. |

### 2. Trust boundaries

- **Secrets never** in `metadata` jsonb on artifacts, **never** in `NEXT_PUBLIC_*`, **never** returned to the browser as plaintext.
- Read/write credentials only via **Server Actions** or **Route Handlers** with `getOrgMemberContext` (or stricter admin role if product requires).
- **Provider calls** run **only on the server** (Node runtime); no streaming API keys to the client.

### 3. Data model (target — see PLAN for migration timing)

- **`studio_org_provider_connections`** (name TBD in PLAN): `organization_id`, `provider` (enum-like text check), `status`, `encrypted_payload` **or** external secret reference, `last_verified_at`, `updated_by`, RLS = same org as existing Studio tables.
- **Encryption**: application-layer (e.g. AES-GCM with `STUDIO_INTEGRATIONS_ENCRYPTION_KEY`) or Supabase Vault — choose in BUILD after ops review; document in PLAN Phase 1.

### 4. Providers (priority order for MVP)

1. **OpenAI-compatible** (ChatGPT API use cases) — script / hook generation from episode context.
2. **Runway** (or documented REST) — job creation + poll (subject to vendor ToS and quotas).
3. **YouTube Data API** — upload **only** after OAuth or API key policy is validated; **hardest** quota/policy surface — likely last.

Each provider = **thin adapter** under `src/lib/studio-integrations/providers/<id>/` implementing a shared interface (`healthCheck`, `runStep` — exact shape in PLAN).

### 5. Feature flags

- **`NEXT_PUBLIC_STUDIO_INTEGRATIONS_UI`**: show Integrations UI shell and navigation entry (default off until UX ready).
- **Server-only** `STUDIO_INTEGRATIONS_ENABLED`: master switch for any outbound provider call (default false in production until security review).

### 6. Relationship to ADR-003

- ADR-003 **out of scope** list stays true for **v1 code paths**.
- v2 **adds** new code paths behind flags; v1 users see **no behavior change** when flags are off.

## Consequences

- **Positive**: Clear split between ledger (v1) and automation (v2); auditable path for credentials.
- **Negative**: Operational burden (key rotation, vendor downtime, compliance); requires ongoing security review.

## Related

- [`ADR-003`](ADR-003-studio-productions-mvp.md) — v1 ledger
- [`PLAN-studio-provider-integrations.md`](../features/PLAN-studio-provider-integrations.md)
- [`src/lib/studio-integrations/`](../../src/lib/studio-integrations/) — types and feature helpers
