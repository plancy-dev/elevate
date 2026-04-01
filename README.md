# Elevate

**AI adoption and workflow platform (pivot in progress).**

Elevate helps teams turn **measurable AI outcomes** into repeatable workflows: premium guides and templates today; **organization-scoped** access, billing, and (roadmap) agent workspaces. The codebase still contains **legacy MICE** (meetings/events) modules for backward compatibility; new work follows [`memory-bank/creative-elevate-ai-pivot.md`](memory-bank/creative-elevate-ai-pivot.md).

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (Carbon-inspired enterprise dark theme)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel
- **Design Prototyping**: Google Stitch MCP (optional)

## Product docs

| Doc | Purpose |
|-----|---------|
| [`memory-bank/creative-elevate-ai-pivot.md`](memory-bank/creative-elevate-ai-pivot.md) | North Star: flywheel, dual GTM, pivot phases |
| [`memory-bank/inventory-ai-pivot-phase0.md`](memory-bank/inventory-ai-pivot-phase0.md) | Legacy vs new surface inventory |
| [`docs/CONTENT_FUNNEL.md`](docs/CONTENT_FUNNEL.md) | Ebook-first funnel & journey vs codebase |
| [`memory-bank/reflect-ebook-content-funnel.md`](memory-bank/reflect-ebook-content-funnel.md) | REFLECT audit (implementation + gaps) |
| [`memory-bank/tasks.md`](memory-bank/tasks.md) | Roadmap SoT |
| [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) | AI 도구 레이어 (gstack·Memory Bank·규칙) |
| [`docs/AI_AGENT_MATURITY_REPORT.md`](docs/AI_AGENT_MATURITY_REPORT.md) | AI 에이전트 활용 성숙도·벤치마크·점수 (리포트) |
| [`docs/MANUAL_OPERATOR_CHECKLIST.md`](docs/MANUAL_OPERATOR_CHECKLIST.md) | Toss / Supabase / PostHog 수동 작업 체크리스트 |
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
│   ├── (auth)/                 # Login, signup
│   ├── (dashboard)/            # App dashboard (library + legacy MICE)
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

Carbon-inspired enterprise dark theme:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0F62FE` | Brand, interactive, focus |
| Accent | `#42BE65` | Growth indicators, positive KPIs |
| Background | `#0D0D0D` | Page background |
| Layer 01 | `#161616` | Cards, panels |
| Layer 02 | `#1C1C1C` | Elevated surfaces |
| Border | `#393939` | Dividers, outlines |

## License

Proprietary. All rights reserved.
