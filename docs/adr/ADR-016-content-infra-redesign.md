# ADR-016: Content Infrastructure Redesign (Essays + Studio Dispatch)

## Status

**Proposed (Stub)** — 2026-05-11. **Phase 1 partial (D1 + D2 complete; D3 + D4 pending ADR-015 commit).**

본 ADR은 stub — full audit + proposal은 [`docs/proposals/2026-05-elevate-content-infra-redesign.md`](../proposals/2026-05-elevate-content-infra-redesign.md). ADR-015 land 후 D3/D4 lock 시 본 ADR을 *Accepted*로 promote.

## Context

ADR-014 (Studio brand identity) confirms Elevate는 vertical product 빌드하는 솔로 founder의 holding entity, content는 Studio operations documentation. ADR-015 (Content Product Design — 전략/기획 session 작성 중)는 Essays + Studio Dispatch 두 발행 product의 scope/voice/cadence/subscription model을 정의 중.

본 ADR은 그 두 product를 underpin할 **content infrastructure** (publication + subscription + dispatch + cron) 결정을 lock한다.

기존 schema 53개 migration audit 결과 (proposal §3):

- **37 surviving tables** (post-052 MICE drop).
- **13 KEEP** (foundation + active payment/content).
- **7 REUSE candidates** for essays/dispatches infra: `content_publications`, `content_items`, `content_sources`, `content_runs`, `content_item_source_map`, `newsletter_subscribers`, `waitlist_signups`.
- **16 DEPRECATE** (Prompt Studio era — *NOT DROP*, Phase 2 revival 가능성).
- **1 DEPRECATE → conditional DROP** (`toss_payment_intents`, sign-off 후).

## Decision

**[PENDING ADR-015 commit]** — full decision은 proposal §4 (Deliverable 3) 작성 시 본 ADR로 promote.

Stub-stage commitments (audit 결과로 immediate lock 가능):

1. **Essays + Dispatches 인프라는 새 verticle 빌드 X**, **기존 newsletter foundation tables를 REUSE-extend** (D2 §3.2 그룹). 별도 essays/dispatches 테이블 신설 vs ALTER로 extend는 ADR-015 voice/scope 확정 시 결정.
2. **Single subscription model** (founder implication) → `newsletter_subscribers` table을 unified subscribers role로 promote 후보. ADR-015 lock 후 ALTER migration draft.
3. **Email service: Resend** (founder approved, 2026-05-11). Postmark/SendGrid는 deliverability fallback only.
4. **Cron schedule**: Vercel Thursday 13:00 UTC year-round + handler 안에서 `America/New_York` timezone hour check (DST 자동 처리). Hourly essay publishing은 별도 cron.
5. **Prompt Studio era tables는 DEPRECATE only — DROP 금지** (ADR-014 hierarchy). Phase 2 vertical revival 시 schema reference 활용.
6. **`toss_payment_intents` DROP** — sign-off 후 phase-able. Code refs 0, draft script (`docs/operations/draft-drop-toss-payment-intents.sql`) 이미 존재.

## Consequences

### V0.5 ship 무관

본 ADR은 Phase 1 audit + proposal stage. **코드/migration 변경 X** — V0.5 (W1 D7) build를 block 하지 않음.

### Phase 2 build commission

Proposal §4 (D3) lock 후 별도 commission. **13–17h estimate** (task spec). Phase 2 deliverables: SQL migrations, RLS policies, API routes, cron handlers, Resend integration, subscription UI.

### Cleanup phasing

Proposal §5 (D4) phased cleanup:

- W1–W2: Studio video/distribution sub-pipeline schema reference 제외.
- W4–W8: `toss_payment_intents` DROP after sign-off; `prompt_studio_beta_allowlist` deprecation banner.
- Indefinite hold: `studio_production_*`, `studio_projects`, `studio_org_provider_connections` (encrypted secrets), reference data (niches/format packs/templates/channels).

### ADR-014 conformance

- Prompt Studio = Phase 2 vertical candidate (DEPRECATE not DROP). ✓
- 가게점수 = separate repo (out of scope, no change). ✓
- Content positioning = Studio operations documentation. ✓

## Alternatives Considered

### A1 — 새 essays/dispatches 테이블 fresh build (no reuse)

- **Pros**: Schema clean, naming explicit, ADR-015 결정 자유도 max.
- **Cons**: `content_items` 등 기존 50+ refs 코드 마이그레이션 필요. Newsletter foundation (049) 재작업.
- **Reject reason**: REUSE candidate 7개가 이미 admin/content-ops pipeline에서 active. ALTER로 extend가 V0.5 ship priority + Phase 2 13–17h budget에 적합.

### A2 — Prompt Studio era 전체 DROP (clean slate)

- **Pros**: Schema 단순화, encrypted secrets cleanup.
- **Cons**: ADR-014 명시 violation (archived ≠ deleted forever). Phase 2 vertical revival 시 character bible / project hierarchy / draft history 손실.
- **Reject reason**: ADR-014 hierarchy hard constraint.

### A3 — `toss_payment_intents` 보존 (no DROP)

- **Pros**: 0 code refs인데 굳이 DROP 위험 회피.
- **Cons**: Schema 노이즈, ADR-005 (Toss deferred) supersede 의도와 misalign. 이미 founder draft script 존재.
- **Reject reason**: Sign-off 후 안전. Conditional DROP recommendation 유지.

## References

- Proposal: [`docs/proposals/2026-05-elevate-content-infra-redesign.md`](../proposals/2026-05-elevate-content-infra-redesign.md)
- ADR-014: Elevate as Studio Brand
- ADR-015: Content Product Design *(전략/기획 session 작성 중 — commit 후 본 ADR D3/D4 lock)*
- ADR-012: Q2 2026 positioning (media-first)
- ADR-013: Marketing CTA + PostHog instrumentation
- ADR-005: Payment rails (Lemon primary, Toss deferred)
- `memory-bank/operations-mode-2026-q2.md` — Studio Brand Identity section
- `docs/operations/draft-drop-toss-payment-intents.sql` — pre-existing DROP draft

## Decision log

- **2026-05-11**: Stub draft. Status `Proposed (Stub)`. D1 + D2 audit complete (proposal §2–3). D3 + D4 pending ADR-015. Founder approved Resend default.
