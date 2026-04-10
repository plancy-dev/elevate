# Navigation loading — route transitions (App Router)

**Audience:** Engineering + design QA. **Supplements:** [`INTERACTIVE_AFFORDANCES.md`](INTERACTIVE_AFFORDANCES.md), [`SYSTEM.md`](SYSTEM.md).

## Goals

- Avoid the **“frozen click”** feeling when moving between dashboard routes (sidebar, header `ButtonLink`, in-page `DashboardNavLink`).
- Combine **immediate** feedback (link-level) with **segment-level** fallback (RSC loading).

## Implementation (Elevate)

| Mechanism | Where | Behavior |
|-----------|--------|----------|
| **`loading.tsx`** | [`src/app/(dashboard)/dashboard/loading.tsx`](../../src/app/(dashboard)/dashboard/loading.tsx) | Next.js shows this fallback while the `/dashboard/*` page segment loads (server + client navigation). |
| **`useLinkStatus()`** | Next.js 16 [`next/link`](https://nextjs.org/docs/app/api-reference/components/link) | `{ pending: true }` while the **specific** `<Link>`’s navigation is in flight. |
| **`DashboardNavLink`** | [`src/components/dashboard/dashboard-nav-link.tsx`](../../src/components/dashboard/dashboard-nav-link.tsx) | Small spinner on row/inline nav (sidebar, overview cards, text links). |
| **`ButtonLink`** | [`src/components/ui/button.tsx`](../../src/components/ui/button.tsx) | Frosted overlay + spinner on dashboard/marketing chrome buttons that navigate. |
| **`useTransition`** (tabs) | e.g. [`production-episode-workbench.tsx`](../../src/components/dashboard/production-episode-workbench.tsx) | `aria-busy` + ring on tab rail while `router.replace` for `?tab=` is pending. |

## Do / don’t

- **Do** add `loading.tsx` at segment boundaries when a route is slow to stream.
- **Do** use `DashboardNavLink` or `ButtonLink` for in-app navigation instead of raw `<Link>` when you want pending affordance.
- **Don’t** add a second global NProgress dependency unless product asks — prefer Next primitives + `useLinkStatus`.
- **Don’t** set `pointer-events` on pending overlays that block navigation (use `pointer-events-none` on spinners).

## Quality pipeline (gstack)

| Step | Skill / gate |
|------|----------------|
| Plan | **`/plan-design-review`** — new nav patterns, density. |
| After build | **`/design-review`** — click Studio/Library/Productions; confirm spinner + `loading` fallback. |
| Ship | **`pnpm verify`** |

## Changelog

- **2026-04-10:** Initial doc; `dashboard/loading.tsx`, `DashboardNavLink`, `ButtonLink` + `useLinkStatus`, workbench `useTransition`.
