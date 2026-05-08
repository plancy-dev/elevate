# Wed 2026-05-07 — Blog topic (locked): Cursor session discipline

**Status:** EN + KO MDX in repo · **Type:** `blog` · **Primary axis:** 1 — AI workflow

**Why this topic (one line):** Monday’s post set direction; Wednesday should ship something **immediately useful** to builders—how we **finish** a Cursor session instead of opening 30 tabs and stalling. It matches **operations mode** (shipping writing/features in tight loops) without selling sajangnote.

**Weekly plan pointer:** [`memory-bank/content-plan-weekly.md`](../../../memory-bank/content-plan-weekly.md)

---

## Slug & locales

| Field | Value |
|--------|--------|
| **Slug (all MDX files)** | `cursor-session-discipline-that-ships` |
| **Publish date (MDX `date`)** | `2026-05-07` (adjust if you ship a day late) |
| **access_tier** | `public` |
| **Rollout** | **P0:** `en` + `ko` (same slug). **P1:** `ja`, `zh-CN`, `zh-TW` only after explicit translate pass ([`docs/BLOG_POST_PIPELINE.md`](../../BLOG_POST_PIPELINE.md) §0). |

---

## English — outline (base draft; target **900–1,800 words**)

Follow [`docs/templates/blog-post-public.mdx.example`](../../templates/blog-post-public.mdx.example) and voice rules in [`docs/BLOG_POST_PIPELINE.md`](../../BLOG_POST_PIPELINE.md) §2–2.5.

### 1. Hook

- Open with a **concrete scene**: new chat, no clear “done,” 11pm, same prompt tweaked five times.
- One line thesis: **discipline isn’t more prompts—it’s a session contract.**

### 2. Why this matters now

- With AI editors, **cost of starting** dropped; **cost of finishing** didn’t.
- Hidden tax: context thrash, half-written diffs, no artifact.

### 3. What most people miss (3 bullets)

- Treating the session like **infinite brainstorming** instead of **one outcome**.
- No **stop rule** (time or artifact).
- No **single source of truth** for “what shipped this session.”

### 4. Insight (one frame)

- **Session = bounded box**: one primary outcome artifact (PR, doc section, or decision note)—not “explore the codebase.”

### 5. What to do this week (actionable)

Numbered list, genuinely copy-pasteable:

1. **Timebox** — e.g. 45 minutes; timer visible.
2. **One branch / one note** — link or branch name in the first 3 minutes.
3. **Definition of done** — one sentence before the first model call (“merged README section” / “issue comment with repro” / “draft section in Notion linked here”).
4. **Stop** — when the timer ends, either ship the artifact or write **one** paragraph “blocked because…” (no tab spiral).

### 6. Where Elevate fits (short—not a brochure)

- We’re in **content / ops mode**; the same loop applies to **drafting posts** and small fixes. No roadmap promises; honest constraint: if you only adopt one habit, pick **definition of done before first prompt**.

### 7. Close + CTA

- Single CTA: **EN** `[Join the waitlist →](/#waitlist)` · **KO** `[대기명단 →](/ko#waitlist)` per pipeline.

### 8. Evidence / anti-hallucination

- This piece is **practice-led**. If you cite a tool changelog or another blog, **link it**. Avoid precise market stats without a source ([`docs/BLOG_POST_PIPELINE.md`](../../BLOG_POST_PIPELINE.md) §2.6).

---

## Korean — 목차 초안 (영어 직역이 아니라 **두 번째 원고**로 작성)

1. **후킹** — 탭만 늘고 끝이 없는 밤, Cursor 켜 놓고 뭐가 달라졌는지 모르겠는 상태.
2. **왜 지금** — 시작은 쉬운데 끝맺음이 없으면 compound가 안 된다.
3. **흔한 실수** — 무한 탐색, 종료 조건 없음, 산출물 정의 없음.
4. **한 가지 프레임** — 세션 = **한 가지 결과물**을 위한 상자.
5. **이번 주 할 일** — 위 영어 액션 4스텝을 한국 실무 맥락으로 풀기 (회의·방해가 끼면 어떻게 하는지 한 문장).
6. **Elevate 한 줄** — 지금은 기능 대신 글·운영에 집중; 그래서 이 루프가 더 중요하다 (과장 금지).
7. **마무리 + CTA** — `/ko#waitlist`

---

## `content_items` — suggested row (EN master draft)

Use for `/admin/content-queue` or SQL seed. Expand `body_markdown` from this outline into full prose in admin **or** skip the row and ship **repo MDX only**—but keep this file as SoT.

| Column | Suggested value |
|--------|-----------------|
| `type` | `blog` |
| `locale` | `en` |
| `title` | `Cursor session discipline that actually ships` |
| `slug` | `cursor-session-discipline-that-ships` |
| `summary` | `Timebox, one artifact, one stop rule—how to finish an AI editor session without tab thrash.` |
| `status` | `draft` → `review_required` → `approved` when MDX-ready |
| `metadata` | See JSON block below |

```json
{
  "topic_axis": "ai_workflow",
  "axis_index": 1,
  "scheduled_slot": "2026-05-07",
  "slug": "cursor-session-discipline-that-ships",
  "rollout_locales": ["en", "ko"],
  "primary_sources": [],
  "topic_doc": "docs/content-queue/topics/2026-05-07-cursor-session-discipline.md",
  "pipeline_ref": "docs/BLOG_POST_PIPELINE.md",
  "review_gate": {
    "latest": {
      "status": "pending_outline",
      "reasons": []
    }
  }
}
```

---

## After publish

- Add the same slug to `tests/unit/blog-posts.test.ts` **when** `en` + `ko` MDX exist (`EN_SLUGS` / `KO_SLUGS`).
- Optional locale rows: duplicate `content_items` with same `slug`, `locale` = `ko` | `ja` | … only if you manage drafts in the DB per language.
