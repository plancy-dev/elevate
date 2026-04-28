# Tech Stack — Elevate

| 레이어 | 선택 | 메모 |
|--------|------|------|
| 프레임워크 | Next.js 16 (App Router, RSC) | 요청 경계: `src/proxy.ts` (`proxy`) |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v4 | Editor's Desk v3 토큰 (`src/styles/tokens.css` + `globals.css`) |
| 인증·DB | Supabase (Auth, Postgres, RLS) | Browser/Server/Admin 클라이언트 분리 |
| 배포 | Vercel | 프리뷰 브랜치 권장 |
| 패키지 매니저 | pnpm | `pnpm-workspace` 사용 시 모노레포 확장 가능 |

## 환경 변수 (요약)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용 — 온보딩, waitlist insert, **`profiles.dashboard_access` 조회로 `/dashboard` 게이트** 등)
- `NEXT_PUBLIC_APP_URL` (OAuth·이메일 리다이렉트)
- `/dashboard` 게이트는 **환경 플래그 없음** — DB 컬럼 `dashboard_access` + 위 서비스 롤 ([`docs/DEVELOPMENT.md`](../docs/DEVELOPMENT.md))
- MCP용 `SUPABASE_ACCESS_TOKEN`은 **Supabase 대시보드 Personal Access Token** — 서비스 롤 JWT와 혼동 금지

## Design System v3 packages (S0)

- `framer-motion` (motion allowed only in scoped paths)
- `cmdk` (CommandBar primitive)
- `@radix-ui/react-dialog`
- `@radix-ui/react-popover`
- `@radix-ui/react-tooltip`
- `@react-aria/focus`

## 금지

- 서비스 롤 키를 클라이언트 번들·`NEXT_PUBLIC_*`에 넣지 않음
- RLS 우회를 클라이언트에서 시도하지 않음
