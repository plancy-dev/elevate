# Elevate

**AI adoption and workflow platform (pivot in progress).**

Elevate helps teams turn **measurable AI outcomes** into repeatable workflows: premium guides and templates today; **organization-scoped** access, billing, and (roadmap) agent workspaces. The codebase still contains **legacy MICE** (meetings/events) modules for backward compatibility; new work follows [`memory-bank/creative-elevate-ai-pivot.md`](memory-bank/creative-elevate-ai-pivot.md).

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + semantic tokens (`globals.css`; marketing vs app surfaces)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel
- **Design Prototyping**: Google Stitch MCP (optional)

## Product docs

| Doc | Purpose |
|-----|---------|
| [`memory-bank/creative-elevate-ai-pivot.md`](memory-bank/creative-elevate-ai-pivot.md) | North Star: flywheel, dual GTM, pivot phases |
| [`memory-bank/inventory-ai-pivot-phase0.md`](memory-bank/inventory-ai-pivot-phase0.md) | Legacy vs new surface inventory |
| [`docs/CONTENT_FUNNEL.md`](docs/CONTENT_FUNNEL.md) | Ebook-first funnel & journey vs codebase |
| [`memory-bank/archive/work-history/reflect-ebook-content-funnel.md`](memory-bank/archive/work-history/reflect-ebook-content-funnel.md) | REFLECT audit (implementation + gaps; archived) |
| [`memory-bank/tasks.md`](memory-bank/tasks.md) | Roadmap SoT |
| [`docs/adr/ADR-011-design-system-v3-editors-desk.md`](docs/adr/ADR-011-design-system-v3-editors-desk.md) | Editor's Desk v3 architectural decision record |
| [`docs/features/INIT-editors-desk-design-system.md`](docs/features/INIT-editors-desk-design-system.md) | Design philosophy, constraints, and rollout scope |
| [`docs/features/PLAN-editors-desk-s0-s1-s2.md`](docs/features/PLAN-editors-desk-s0-s1-s2.md) | S0-S2 build checklist and acceptance gates |
| [`docs/design/v3-creative/toc-ia-mapping.md`](docs/design/v3-creative/toc-ia-mapping.md) | Locked TOC IA mapping (Option A) |
| [`.github/DESIGN.md`](.github/DESIGN.md) | Studio scene render — GitHub epic/labels pointer [#1](https://github.com/plancy-dev/elevate/issues/1) |
| [`docs/DEV_PROCESS_GITHUB.md`](docs/DEV_PROCESS_GITHUB.md) | Issues/PR/gh CLI + gstack — 원격 작업 큐·`pnpm issues:studio` |
| [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) | AI 도구 레이어 (gstack·Memory Bank·규칙) |
| [`docs/AI_AGENT_MATURITY_REPORT.md`](docs/AI_AGENT_MATURITY_REPORT.md) | AI 에이전트 활용 성숙도·벤치마크·점수 (리포트) |
| [`docs/AUTOMATIONS_NO_SLACK_OPS.md`](docs/AUTOMATIONS_NO_SLACK_OPS.md) | Slack/Linear 없이 운영하는 Cloud Agent 자동화 3종 |
| [`docs/MANUAL_OPERATOR_CHECKLIST.md`](docs/MANUAL_OPERATOR_CHECKLIST.md) | Toss / Supabase / PostHog / env 수동 작업 체크리스트 |
| [`docs/AI_USER_TEMPLATES.md`](docs/AI_USER_TEMPLATES.md) | 버그·기능 요청 권장 형식 |
| [`docs/AI_WORKFLOW_PORTABILITY.md`](docs/AI_WORKFLOW_PORTABILITY.md) | 다른 프로젝트로 워크플로 이식 시 수정 파일 |

## Getting Started

### Prerequisites

- **Node.js 20+** (see `.nvmrc`)
- **pnpm** 9+
- Supabase project

### Setup

```bash
pnpm install

cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Apply SQL migrations in order — see supabase/README.md

pnpm dev
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for scripts, CI, and editor notes. Testing (unit, optional Supabase integration, Playwright) is in [docs/TESTING.md](docs/TESTING.md). Optional **gstack** install (Bun + `./setup`): [docs/GSTACK.md](docs/GSTACK.md).

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── [locale]/(marketing)/   # Landing, pricing, about
│   ├── (auth)/                 # Login, signup, access-pending
│   ├── (dashboard)/            # App dashboard (library, studio, productions, …)
│   └── api/                    # API routes, webhooks
├── components/
│   ├── ui/                     # Button, Card, Badge (Carbon-inspired)
│   ├── layout/                 # Header, Footer, ElevateLogo
│   └── marketing/              # Landing sections, Pretext helpers
├── lib/
│   ├── supabase/               # Client (browser, server, proxy session helper)
│   ├── env/                    # Public env validation (Supabase URL / anon)
│   └── utils.ts                # Utility functions
tests/
├── unit/                       # Vitest (CI)
├── integration/                # Opt-in Supabase smoke
└── e2e/                        # Playwright

memory-bank/                    # Project documentation
supabase/migrations/            # Database migration SQL
```

## Architecture

- **Multi-tenant**: Organization-scoped data with Supabase RLS
- **Roles**: admin, organizer, coordinator, viewer
- **Data model (current)**:
  - **New**: content catalog & org entitlements (see migration `009`)
  - **Legacy MICE**: Organizations → Events → Sessions → Attendees (deprecated for new features)

## Design System

Semantic tokens live in **`src/styles/tokens.css`** and are bridged via **`src/app/globals.css`** (`@theme inline`). Editor's Desk v3 uses ink/paper/vermilion and 1px rules (no shadows, near-zero radius) per [`docs/adr/ADR-011-design-system-v3-editors-desk.md`](docs/adr/ADR-011-design-system-v3-editors-desk.md).

| Token (examples) | Typical usage |
|------------------|----------------|
| `primary` / `interactive` | App shell buttons, links, focus |
| `marketing-accent` | Marketing primary CTA only (scoped; now vermilion) |
| `layer-01` / `layer-02` | Panels, list row hover |
| `background` / `border-subtle` | Page chrome, dividers |

Current mapping and rollout docs: [`docs/features/INIT-editors-desk-design-system.md`](docs/features/INIT-editors-desk-design-system.md) · [`docs/features/PLAN-editors-desk-s0-s1-s2.md`](docs/features/PLAN-editors-desk-s0-s1-s2.md).

## License

Proprietary. All rights reserved.
