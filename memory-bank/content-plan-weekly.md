# Weekly content plan — Elevate

**SoT for upcoming blog + newsletter topics.** Refresh **Sunday evening** for the week ahead. Daily seeds after publish go at the bottom.

**Cadence:** Blog Mon/Wed/Fri · Newsletter Thu · axes rotated (one dominant axis per post).

---

## Week of 2026-05-05 (current)

| Day | Type | Topic / axis | Status | Notes |
|-----|------|----------------|--------|--------|
| Mon 2026-05-06 | Blog | **Direction announcement** — first vertical + Elevate content mode | **Shipped** | Slug: `elevate-first-vertical-content-focus` · Founder/insight axis |
| Wed 2026-05-07 | Blog | **Locked:** Cursor session discipline · Axis **1** | **EN + KO in repo** | [`en`](../content/blog/en/cursor-session-discipline-that-ships.mdx) · [`ko`](../content/blog/ko/cursor-session-discipline-that-ships.mdx) · SoT: [`docs/content-queue/topics/2026-05-07-cursor-session-discipline.md`](../docs/content-queue/topics/2026-05-07-cursor-session-discipline.md) · **Prod (recheck #7):** **`curl` 404 / 404** — [`reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json`](../reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json). |
| Thu 2026-05-08 | Newsletter | Week 1 mail — intro + Mon post as main or condensed | **Draft in weekly § below** | See **§ Thu 2026-05-08 newsletter draft**. Wed URL: **omit until prod `200`**; slugs만 언급 가능. |
| Fri 2026-05-09 | Blog | **Locked:** Prompt pattern 실패 vs 성공 한 장면 · Axis **3** | **Outlined** | One pair of prompts (dead vs survived), story-led; [`tasks.md`](tasks.md) Q2 ops — 기능 로드맵 약속 없이. |

**Next-week draft topics (ideas)**

- Cursor / Claude real workflow (axis 1).
- Prompt pattern that failed vs worked (axis 3).
- One operational metric we watch on Elevate (axis 4 or 5).

**Post-publish seed (update after each ship)**

- **Wed prod:** 최신 스모크 [`reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json`](../reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json) — **`curl` 404/404**, HogQL **`cnt=0`** → §4 **`발송 승인: 예` 교체 안 함** (선행조건 EN/KO **200**).
- **Fri 2026-05-09:** 위 표대로 **`prompt-engineering` 대비 패턴 한 쌍** 확정 · MDX 작성 시 [`docs/templates/blog-authoring-templates.md`](../docs/templates/blog-authoring-templates.md) 준수.

---

## Thu 2026-05-08 — Newsletter draft (Week 1 mail)

**SoT:** Mon 중심 + (prod `200`일 때만) Wed HTTPS 링크 + **sajagnote 비활성 홍보** + 대기명단 CTA. Elevate Q2 = 콘텐츠 채널 ([`memory-bank/tasks.md`](tasks.md) operations mode); **sajagnote는 별도 레포** — 본 메일에서 제품 세일즈·런치 일정 언급 금지.

1. **Subject seed:** Elevate가 Q2에 왜 글과 리스트 우선으로 가는지 (한 줄 훅; 기능 릴리즈 날짜 없음).
2. **Lead (3–4문장):** Mon 방향글 요지 — 미디어 퍼스트, 큰 기능 홍보 잠깐 접기, 쓸 가치 있는 글이 먼저.
3. **Primary links (항상 안전):** `https://elevate.ai.kr/blog/elevate-first-vertical-content-focus` · `https://elevate.ai.kr/ko/blog/elevate-first-vertical-content-focus`.
4. **Wed (`cursor-session-discipline-that-ships`) — 발송 승인:** **아니오** (recheck #7: `curl` **404 / 404**, PostHog 7d HogQL **`cnt=0`** — [`reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json`](../reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json)). **`curl` EN/KO 각 **200**이면** 첫 줄을 **`발송 승인: 예` (HogQL `cnt=…`)** 형태로 바꾼 뒤 아래 URL을 본문에 포함.  
   - EN: `https://elevate.ai.kr/blog/cursor-session-discipline-that-ships`  
   - KO: `https://elevate.ai.kr/ko/blog/cursor-session-discipline-that-ships`  
   Copy line: **“실무 — Cursor 세션을 끝까지 배포로 묶기”** + 위 두 URL.
5. **CTA:** 홈 **`/#waitlist`** (또는 로케일별 동일 패턴)—베타·업데이트 **한 통**만 부탁하는 톤; 구체 SKU 약속 없음.

---

## Axis checklist (pick one star per post)

1. AI workflow · 2. Solo productivity · 3. Prompt engineering · 4. B2B SaaS ops · 5. Founder insight · 6. Trend curation

---

*Older weeks can be archived to `memory-bank/archive/` when noisy.*
