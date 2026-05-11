# Drive Integration — Cross-Session Reference

**Status**: Phase 1 manual sync (production-ready 2026-05-11)
**Purpose**: Solve session isolation problem via Drive-mirrored critical files.

## Why this matters

Pre-Drive state: cross-session reference required founder to paste 4-5 line inline summary of ADR / ops-mode / Essay content into each new session. Recurring issue — 4 occurrences in W2 D1 sprint alone (Step 1 paste cycle, Essay content paste, etc.).

Post-Drive state: Drive URL share enables full-content cross-session reference. 80% of the session-isolation friction solves with this single mechanism.

## Folder structure

Recommended Drive structure under root:

```
Elevate Studio/ (root)
├── ADRs/
│   ├── ADR-014-elevate-studio-brand.md
│   ├── ADR-015-elevate-content-product-design.md
│   ├── ADR-016-content-infra-redesign.md
│   └── ADR-017-vertical-payment-localization.md
├── Essays/
│   └── the-60-minute-boardroom.mdx
├── Dispatches/
│   └── 0001-from-boardroom-to-production.md
├── Operations/
│   └── operations-mode-2026-q2.md
└── Skills/ (optional)
    └── README.md (skill registry overview mirror)
```

## File mirror table

| Repo path | Drive URL | Status |
|---|---|---|
| `docs/adr/ADR-014-elevate-studio-brand.md` | [pending] | Mirror needed |
| `docs/adr/ADR-015-elevate-content-product-design.md` | [pending] | Mirror needed |
| `docs/adr/ADR-016-content-infra-redesign.md` | [pending] | Mirror needed |
| `docs/adr/ADR-017-vertical-payment-localization.md` | [pending] | Mirror needed |
| `memory-bank/operations-mode-2026-q2.md` | [pending] | Mirror needed |
| `content/blog/en/the-60-minute-boardroom.mdx` | [pending] | Mirror needed |
| `content/dispatches/0001-from-boardroom-to-production.md` | [pending] | Mirror needed |
| `.claude/skills/README.md` | [pending] | Optional mirror |

Founder updates Drive URLs after Drive setup. Until URLs filled, Drive reference unavailable for the corresponding files.

## Cross-session usage

Other Claude session에서 ADR 또는 lock content reference 필요 시:

1. 위 table에서 file의 Drive URL copy.
2. 그 session에 paste: `Drive reference: [URL]`.
3. Session이 Drive MCP server (`drivemcp.googleapis.com`)를 통해 file content read.
4. Inline summary 또는 full content reference.

## Mirror sync workflow (Phase 1 — manual)

- Critical file commit/lock 후 founder가 Drive에 upload.
- First setup: 8 files (ADRs 4 + ops-mode + Boardroom Essay + Dispatch #1 + Skills README).
- Drive URL은 founder가 본 doc의 table에 채움 (또는 컨트롤타워에 share → Code 세션 update commission).
- 신규 ADR / Essay / Dispatch 작성 시 Drive sync = manual founder action (Phase 1).

## Phase 2 automation (deferred — W3-W4 candidate)

Three options to evaluate based on W3-W4 empirical data (founder action burden vs setup complexity):

- **Option A**: git post-commit hook + `gdrive` CLI auto-sync. Local-machine bound; founder commits trigger sync. Setup: gdrive auth + hook script. Risk: hook fails silently if gdrive CLI not installed on every machine.
- **Option B**: Vercel webhook + Drive API endpoint. Server-side; commit push triggers Vercel build → Vercel function → Drive API. Setup: API endpoint + auth + webhook. Risk: API rate limits, function timeout, secret management for service account.
- **Option C**: Cron job (`claude trigger`). Scheduled sync; pulls latest commit on cadence. Setup: cron + sync script. Risk: lag between commit and Drive freshness.

Selection criteria: founder action burden vs setup complexity. W3-W4 empirical 기반 결정.

## References

- ADR-016 (content infra redesign — stub, Phase 2 commission)
- `.claude/skills/README.md` § Cross-session reference via Drive
- Anthropic Drive MCP server: `drivemcp.googleapis.com`
