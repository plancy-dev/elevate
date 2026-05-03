# No-Slack Ops Automations (Cursor Cloud Agents)

Slack/Linear 없이도 Elevate에서 운영 가능한 자동화 3종 설계안.

기본 원칙:

- Output은 Slack 대신 `GitHub PR`, `GitHub Issue`, `Repo docs`를 기본 채널로 사용한다.
- 모든 자동화는 "실행 -> 산출물 생성 -> 링크 반환"이 끝나야 성공으로 본다.
- 배포/머지는 자동화가 아니라 사람이 최종 승인한다.

---

## Automation 1: Weekly Blog Autopublish (already implemented)

### A1 목적

주 1회 블로그 초안 + 배포팩 자동 생성, PR까지 자동 생성.

### A1 트리거

- Schedule: 매주 월요일 00:00 UTC
- Manual: `workflow_dispatch` with `push_mode=pr`

### A1 실행 엔진

- GitHub Actions: `.github/workflows/blog-autopublish.yml`
- Script: `scripts/blog-autopublish-sdk.mjs`
- Queue: `docs/blog/automation/topics.json`

### A1 입력 소스

- 큐에서 첫 `status=pending` 항목
- `.env`/GitHub Secrets: `CURSOR_API_KEY`, `AUTOMATION_GH_TOKEN`

### A1 출력 대상

- `content/blog/en/<slug>.mdx`
- `content/blog/ko/<slug>.mdx`
- `docs/blog/distribution/<slug>.md`
- queue 상태 `done` + `completed_at_utc`
- GitHub PR (manual `push_mode=pr` 시)

### A1 자동화 프롬프트 (system-style payload)

```text
You are Elevate's automated blog writer operating directly in the repository.
Create production-ready EN/KO MDX posts and a distribution pack for one pending topic.

Hard requirements:
- Follow docs/BLOG_POST_PIPELINE.md and docs/templates/*.mdx.example
- Write files:
  - content/blog/en/<slug>.mdx
  - content/blog/ko/<slug>.mdx
  - docs/blog/distribution/<slug>.md
- Frontmatter keys required: title, description, date, slug, tags, access_tier, locale
- Keep EN and KO semantically aligned (not literal translation)
- Evidence contract: use topic.primary_sources and references as primary evidence; verify with tools before specific facts; no fabricated quotes/stats/dates; no deceptive hidden-benchmark claims
- Update docs/blog/automation/topics.json: pending -> done, set completed_at_utc
- Do not edit unrelated files.
```

---

## Automation 2: Daily Critical Bug Finder (GitHub Issue mode)

`cursor.com/marketplace`의 "Find critical bugs" 샘플을 Slack 없이 운영용으로 변환한 버전.

### A2 목적

최근 변경에서 high-severity correctness 버그를 찾아 "재현 가능한 이슈"로 남긴다.

### A2 트리거

- Schedule: 평일 매일 20:00 KST
- Optional Manual: 운영자가 필요 시 수동 실행

### A2 실행 범위

- `main` 최근 24h 커밋
- high-severity correctness only (data loss, auth bypass, crash, silent corruption)

### A2 출력 대상

- GitHub Issue (label: `auto-bug`, `severity:high`, `area:*`)
- 재현 단계 + 영향 범위 + 권장 수정안 포함
- false positive 가능성이 높으면 issue 생성 대신 `docs/internal/auto-findings/<date>.md`에만 기록

### A2 자동화 프롬프트

```text
You are a deep bug-finding automation focused on high-severity correctness issues.

Goal:
- Inspect commits to main from the last 24 hours.
- Report only validated high-impact findings.

Investigation rules:
- Trace code paths end-to-end; do not pattern-match diffs only.
- Prioritize auth/permission, data consistency, irreversible writes, and crash paths.
- Ignore style/perf-only concerns unless they cause correctness breakage.

Output:
1) If at least one high-confidence issue exists:
   - Open GitHub issue(s) with:
     - title: "[auto-bug] <short risk summary>"
     - sections: Impact, Reproduction, Root-cause hypothesis, Suggested fix, Owner hint
2) If no validated issue:
   - Post a short "no critical findings" comment to the run summary.
```

상세 실행 런북: `docs/automations/daily-critical-bug-finder-github-issue.md`

---

## Automation 3: Weekly Documentation Drift Guard

### A3 목적

실제 코드와 문서 간 드리프트를 주 1회 점검해 docs 부채를 줄인다.

### A3 트리거

- Schedule: 매주 금요일 18:00 KST

### A3 실행 범위

- 최근 7일 변경 파일 + 핵심 운영 문서
  - `README.md`
  - `docs/DEVELOPMENT.md`
  - `docs/BLOG_AUTOPUBLISH_SDK.md`
  - `docs/BLOG_POST_PIPELINE.md`

### A3 출력 대상

- GitHub PR (branch: `chore/docs-drift-<date>`) 또는
- 변경 없음이면 run summary에 "no drift"

### A3 자동화 프롬프트

```text
You are a docs-drift guard for Elevate.

Goal:
- Compare code changes from last 7 days with key docs and update only factual mismatches.

Constraints:
- Do not rewrite voice or structure for style only.
- Update only statements that are wrong/missing due to shipped code.
- Keep changes minimal and verifiable.

Required checks:
- package scripts and workflow names are current
- required env vars and secrets are documented
- blog pipeline file paths still match repository reality

Output:
- Create a single docs-only PR with concise summary and verification checklist.
```

상세 실행 런북: `docs/automations/weekly-docs-drift-guard.md`

---

## Cloud Agent Automations quick sample (recommended to try first)

`https://cursor.com/docs/cloud-agent/automations` 기준으로는 아래 순서가 가장 안전하다:

1. **Find critical bugs** 템플릿 복제
2. Output을 Slack 대신 **GitHub Issue**로 변경
3. Trigger를 daily로 설정
4. 첫 1주일은 "report-only" 모드로 false positive 비율 확인

### Dry-run protocol (first week)

- Day 1-3: report-only (no issue/PR creation), summary only
- Day 4-5: enable output creation only for high-confidence findings
- Week-end: review false-positive ratio and tighten prompts/labels before full automation mode

---

## Linear, 써야 하나?

현재 조건(회사에서 Linear 미사용)에서는 **필수 아님**.

- 지금 당장: GitHub Issues + PR만으로 충분
- 나중에 고려: PM/ops 티켓 워크플로가 복잡해지면 도입 검토
- 기준: 주간 이슈 triage가 30개 이상이고, 우선순위/소유자 관리가 GitHub만으로 버거울 때

즉, 지금은 **Linear 없이도 자동화 ROI가 충분히 나온다.**

---

## Operations scorecard

주간 지표/실패 분류/운영자 핸드오프 기준:

- `docs/automations/operations-scorecard.md`
