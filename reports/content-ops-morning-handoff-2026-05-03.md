# Content ops & newsletter — morning handoff report (2026-05-03)

Audience: operator tomorrow (INIT prep). Scope: blog + newsletter pipeline, automation reality, manual checklist, language behavior, gaps for follow-up BUILD.

---

## 1. Claude / workflow (your earlier question)

**Recommendation:** Drop **Claude-as-separate-orchestrator** (no “Cursor silently calls Anthropic for INIT/PLAN”). That does **not** mean you can never pick a Claude model inside Cursor; it means **do not depend on a second product loop** for daily ops.

**Default hub:** Cursor (model picker + repo context) + this repo’s **memory-bank / ADR / RUNBOOK**.

---

## 2. What is actually automated today (code + config)

### 2.1 Vercel Cron (still configured)

`vercel.json` schedules (UTC, **Mon–Fri only**):

| Schedule (cron) | Path |
|-------------------|------|
| `30 12 * * 1-5` | `/api/content-ops/automation-run?scenario=daily_generation&source=vercel-cron` |
| `0 15 * * 1-5` | `/api/content-ops/automation-run?scenario=publish_window&source=vercel-cron` |
| `30 18 * * 1-5` | `/api/content-ops/automation-run?scenario=retry_window&source=vercel-cron` |
| `45 18 * * 1-5` | `/api/content-ops/daily-snapshot` |

Rough US Eastern alignment: 12:30 UTC ≈ 08:30 EDT for the first window (matches runbook intent).

### 2.2 Cursor-first runtime guard (critical)

`CONTENT_OPS_AUTOMATION_RUNTIME` defaults to **`cursor`** when unset or anything other than `vercel-cron` (`src/lib/content-ops/automation-config.ts`). **Vercel Project → Environment Variables**에 키가 없어도 동일하게 `cursor`로 동작한다(검색 “No Results” ≠ 다른 런타임). 운영 가시성을 위해 **Production에 `CONTENT_OPS_AUTOMATION_RUNTIME=cursor`를 명시 생성**하는 것을 권장한다(2026-05-04 RUNBOOK / `.env.local.example` 반영).

When runtime is `cursor`, **`source=vercel-cron` is rejected**: `automation-run` returns `skipped: true` with `runtime_secret_mismatch:cursor:source=vercel-cron` and records a failed `content_runs` row (see `src/app/api/content-ops/automation-run/route.ts` + `resolveRuntimeMismatchRule`).

**Implication:** If production keeps `CONTENT_OPS_AUTOMATION_RUNTIME=cursor` (per `docs/features/RUNBOOK-content-ops.md`), **Vercel cron hits do not execute ingest/publish**; they only emit mismatch telemetry unless you temporarily switch runtime to `vercel-cron` for incident fallback.

**GitHub:** `.github/workflows/blog-autopublish.yml` exists (weekly + `workflow_dispatch`) with `CURSOR_API_KEY` / `CONTENT_OPS_AUTOMATION_TOKEN` — that path is **blog autopublish**, not the same as the Vercel content-ops crons.

### 2.3 Intended “Cursor drives schedule” path

Runbook: normal callers must use **`source=cursor`** + bearer/query token aligned with `CONTENT_OPS_AUTOMATION_TOKEN`. If Cursor Cloud Agent scheduling is unavailable, **manual morning ops** is the supported gap-fill (below).

---

## 3. Newsletter: does it send? Per-user language?

### 3.1 Send path (Resend)

- Publish pipeline loads `newsletter_subscribers` with `status = 'subscribed'`, cap **200** rows (`pipeline-runner.ts` → `publishNewsletterItem`).
- Each send: `sendNewsletterEmail({ to, subject: item.title, markdownBody: item.body_markdown, locale: subscriber.locale })` (`newsletter-send-adapter.ts`).
- Resend must be valid: `resolveResendSendConfig()`; failures normalize to reasons like `resend_not_configured`, `resend_from_domain_mismatch`, etc.

### 3.2 What “locale” actually changes

**Per subscriber `locale` only affects the email chrome** (preheader, heading, intro copy, CTA label) via `LOCALE_TEMPLATES` + `LOCALE_TEMPLATE_CONFIG`.

**The main body** is **one** `content_items` row: `item.title` + `item.body_markdown` for **every** subscriber. There is **no per-recipient translation** of the newsletter article in code.

So: “사용자별 적절한 언어” = **partial** (wrapper + CTA in their locale; **body language = whatever the single draft is**). If you need true localized bodies, that is a **product gap** (e.g. one item per locale or generation pass per locale).

### 3.3 Where `newsletter_subscribers.locale` is set

In-repo writes found:

- **Admin manual:** `addAdminNewsletterSubscriber` (`src/actions/admin-content-ops.ts`) — form fields `email`, `locale`, `frequency_pref`. No public self-serve subscription UI was found in the same grep sweep as `newsletter_subscribers` inserts.

**Implication:** Subscriber language preference today is effectively **operator-set** (or whatever future public flow you add). It is **not** wired to `profiles.ui_locale` in the snippets reviewed for this report.

### 3.4 How to verify delivery (tomorrow)

1. **Resend dashboard:** outbound volume, bounces, domain errors, last 24–48h.
2. **Supabase:** `content_publications` where `channel = 'email'` — `status`, `metadata.sent_count` / `failed_count` / `failed_reasons`, `last_error`.
3. **Admin UI:** `/admin/subscribers` — column `locale` distribution vs expectations.
4. **PostHog:** This codebase does **not** define a dedicated “newsletter_sent” product event in `posthog-events.ts`; delivery truth is **Resend + DB**, not analytics events, unless you added something outside this scan.

---

## 4. Blog + content queue (manual review)

### 4.1 Operator surfaces

- `/admin/content-queue` — triage / approve / publish candidates.
- `/admin/runs` — pipeline runs.
- `/admin/content-quality` — quality gate signals (see stabilization gates in RUNBOOK).
- `/admin/morning-ops` — funnel + automation heartbeat.
- `/admin/subscribers` — newsletter list + manual add.

### 4.2 What the agent (this session) cannot do without your session

Deleting or publishing production content requires **your logged-in admin** (or service role scripts with secrets). The following is a **checklist for you**, not performed against live data here.

---

## 5. Tomorrow morning — ordered checklist (no cloud agent)

1. **Automation heartbeat**  
   Open `/admin/morning-ops`. If you see `runtime_secret_mismatch` or stale scheduled runs, treat as **P0** before publishing.

2. **Confirm runtime intent**  
   - If staying Cursor-first: ensure **something** (manual or external scheduler) calls automation with `source=cursor` + valid token — **not** relying on Vercel cron alone.  
   - If you intentionally want Vercel-only for a period: set `CONTENT_OPS_AUTOMATION_RUNTIME=vercel-cron` in Vercel env (runbook: revert after incident).

3. **Content queue**  
   `/admin/content-queue`: for each item ready to ship — confirm quality, citations, tone; **publish** or **reject** / archive per policy.

4. **Published surface audit**  
   - Blog: public routes + feed; retract or edit posts that should not stay live.  
   - Newsletter: if a bad edition went out, there is **no** “unsend” in product code — use **Resend** + subscriber comms + optional `content_items` / site correction post.

5. **Newsletter subscribers**  
   `/admin/subscribers`: fix `locale` where wrong; pause `unsubscribed` as needed.

6. **Dry metrics**  
   - `pnpm run content-ops:runs-invariant-check` (from RUNBOOK) if you run against prod-backed env.  
   - `pnpm run content-ops:gate-check` for gate49/50/51 snapshot.

---

## 6. INIT follow-ups (product / eng)

| ID | Topic |
|----|--------|
| A | **True multilingual newsletter body** vs single `body_markdown` — decide product direction. |
| B | **Self-serve locale preference** (and optional sync from `profiles.ui_locale`) for subscribers. |
| C | **Public subscribe** flow if subscribers are not only admin-added. |
| D | Optional **PostHog** event on successful batch send (aggregate counts, not PII) if you want product visibility without Resend-only ops. |
| E | Document **weekend gap**: crons are Mon–Fri; Monday queue may need explicit review. |

---

## 7. References (in-repo)

- `docs/features/RUNBOOK-content-ops.md`
- `vercel.json`
- `src/lib/content-ops/automation-config.ts`
- `src/app/api/content-ops/automation-run/route.ts`
- `src/lib/content-ops/pipeline-runner.ts` (`publishNewsletterItem`)
- `src/lib/content-ops/newsletter-send-adapter.ts`
- `src/lib/content-ops/locale-template-config.ts`
- `src/actions/admin-content-ops.ts`
