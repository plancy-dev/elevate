# ADR-002: Prompt Studio MVP (LLM-backed prompt improvement)

## Status

Proposed — **marketing IA and dashboard placeholder** shipped; **LLM integration** is gated until provider choice, cost controls, and product UX are locked.

## Context

North Star positions **Prompt Studio** as the Phase 0 killer: users select a **target model**, submit a **prompt**, receive **structured analysis and improvements**, and (roadmap) apply changes with **Cursor-style review / accept** semantics. This requires server-side calls to one or more LLM APIs, secrets management, and abuse protection.

Commercial loop: **e-books & guides** in Library remain the wedge; Studio drives engagement and future Pro/team limits.

## Decision

1. **Surface**
   - **UI**: `src/app/(dashboard)/dashboard/studio/` — client-heavy page; placeholder until MVP.
   - **API**: `POST /api/studio/improve` — returns `503` + `STUDIO_MVP_NOT_ENABLED` until implementation; contract documented here for clients.

2. **Providers (candidates)**
   - Start with **one** provider (e.g. OpenAI-compatible or Anthropic) behind a thin adapter interface in `src/lib/` to swap or multi-route later.
   - **Secrets**: only on the server (`process.env` / Vercel env); never expose keys to the browser.

3. **Auth & tenancy**
   - Require authenticated Supabase session for `POST /api/studio/improve`.
   - Associate usage with `profiles.organization_id` for metering and future billing.

4. **Rate limits & cost**
   - Per-user and/or per-org daily caps (e.g. in-memory LRU for PoC; Redis or DB counters for production).
   - Log token usage server-side for cost attribution; optional hard cap per request.

5. **MVP prompt behavior**
   - Input: `{ prompt: string, targetModel?: string }`.
   - Output: `{ suggestions: string[], improvedPrompt?: string }` — exact schema TBD with UI (diff blocks vs single blob).
   - No persistence required for first slice; optional `studio_sessions` table later.

6. **Out of scope (initial MVP)**
   - Full diff/merge UI parity with Cursor; streaming; fine-tuning; multi-file context.

## Consequences

- **Positive**: Clear path from placeholder to paid feature; aligns with North Star and funnel docs.
- **Negative**: Ongoing API spend and compliance review for enterprise; must monitor prompts for PII.

## Related

- North Star: `memory-bank/creative-elevate-ai-pivot.md`
- Funnel: `docs/CONTENT_FUNNEL.md`
- Payments PoC: `docs/adr/ADR-001-toss-payments-poc.md`
