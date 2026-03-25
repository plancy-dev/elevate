# Elevate

**Enterprise MICE Event Platform.**

Elevate is a B2B SaaS platform for the MICE (Meetings, Incentives, Conferences, Exhibitions) industry. Orchestrate world-class events with AI-powered insights that drive measurable business outcomes.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (Carbon-inspired enterprise dark theme)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment**: Vercel
- **Design Prototyping**: Google Stitch MCP

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

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for scripts, CI, and editor notes.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Landing, pricing, about
│   ├── (auth)/                 # Login, signup
│   ├── (dashboard)/            # Event management dashboard
│   ├── (legal)/                # Terms, privacy
│   └── api/                    # API routes, webhooks
├── components/
│   ├── ui/                     # Button, Card, Badge (Carbon-inspired)
│   ├── layout/                 # Header, Footer, ElevateLogo
│   └── marketing/              # KPI Dashboard Preview, etc.
├── lib/
│   ├── supabase/               # Client (browser, server, middleware)
│   └── utils.ts                # Utility functions
└── types/                      # TypeScript type definitions

memory-bank/                    # Project documentation
supabase/migrations/            # Database migration SQL
```

## Architecture

- **Multi-tenant**: Organization-scoped data with Supabase RLS
- **Roles**: admin, organizer, coordinator, viewer
- **Data model**: Organizations → Events → Sessions → Attendees

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
