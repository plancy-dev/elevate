# INIT — AI Newsletter/Blog Content Ops

## Request Summary

Build an operational system where AI-assisted content is generated, reviewed by humans, and distributed from `/admin` with one-click controls. The system must support:

- daily AI/news digest drafts
- deeper blog drafts for subscribers
- explicit review/approval gate before delivery
- queue-driven publish now / scheduled publish
- reusable content for future ebook packaging

## Fixed Decisions (INIT SoT)

1. **Publishing model:** move to DB-first CMS flow (`db-cms`) for queue/review/audit durability.
2. **Subscriber source:** create a dedicated `newsletter_subscribers` domain (do not overload `waitlist_signups`).
3. **Control point:** `/admin` is the primary operator surface.
4. **Safety model:** human-in-the-loop is required before any external send.

## Why This Direction

- File-based autopublish is useful for bootstrapping but weak for queue status transitions, reviewer workflows, retries, and post-send analytics.
- Dedicated subscriber lifecycle is required for opt-in/out compliance, preference controls, and long-term productization (newsletter -> paid bundles/ebooks).
- Existing Elevate assets already fit this shape: admin shell, content/payment foundation, and operational workflow patterns.

## Codebase Anchors

- Admin shell/access: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`
- Existing waitlist email path: `src/app/api/waitlist/route.ts`, `src/lib/email/send-waitlist-confirmation-email.ts`
- Existing admin waitlist ops: `src/actions/waitlist-admin.ts`
- Existing blog file automation path (to keep as temporary fallback): `.github/workflows/blog-autopublish.yml`, `scripts/blog-autopublish-sdk.mjs`, `docs/blog/automation/topics.json`
- Schema/types anchors: `supabase/migrations/`, `src/types/database.types.ts`

## Scope and Non-Goals

### In Scope (INIT -> PLAN input)

- Content queue lifecycle + status machine
- News source registry + ingestion/run logging
- Draft/review/approve/schedule/publish operations in `/admin`
- Subscriber lifecycle model with opt-in/out and frequency preference
- Delivery pathways for blog publish and newsletter send
- Operational retries and failure visibility

### Out of Scope (this INIT)

- Full auto-send without human approval
- Hard migration/deletion of legacy file-based blog autopublish on day one
- Complex personalization/recommendation engine
- Deep BI dashboards beyond minimum run/reporting metrics

## Complexity Assessment

**L4**

- Multiple surfaces: schema, server actions, admin routes, delivery integrations
- New domain model and transition rules
- Compliance and trust constraints (opt-in/out, source attribution)
- Migration strategy needed between legacy and new flow

## Deliverables Created from This INIT

- Schema draft: `docs/features/SCHEMA-ai-newsletter-blog-content-ops.md`
- Admin IA: `docs/features/IA-admin-content-ops.md`
- Workflow/state machine: `docs/features/WORKFLOW-ai-content-ops.md`
- 2-week MVP rollout: `docs/features/PLAN-ai-content-ops-2week-mvp.md`

## Success Criteria (MVP)

- Operators can generate N drafts/day, review, and publish from `/admin`
- Failed deliveries are retryable with visible failure reason
- Subscriber unsubscribe/resubscribe state applies immediately
- Blog/newsletter content is reusable as source material for ebook packaging

## Next Mode

`PLAN` for implementation breakdown, migration phases, and slice-level execution.
