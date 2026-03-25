# Tech Stack — Elevate

| 레이어 | 선택 | 메모 |
|--------|------|------|
| 프레임워크 | Next.js 16 (App Router, RSC) | `middleware` → `proxy` 이전 예정 (1D) |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS v4 | Carbon-inspired 토큰 (`globals.css`) |
| 인증·DB | Supabase (Auth, Postgres, RLS) | Browser/Server/Admin 클라이언트 분리 |
| 배포 | Vercel | 프리뷰 브랜치 권장 |
| 패키지 매니저 | pnpm | `pnpm-workspace` 사용 시 모노레포 확장 가능 |

## 환경 변수 (요약)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 온보딩 등)
- `NEXT_PUBLIC_APP_URL` (OAuth·이메일 리다이렉트)
- MCP용 `SUPABASE_ACCESS_TOKEN`은 **Supabase 대시보드 Personal Access Token** — 서비스 롤 JWT와 혼동 금지

## 금지

- 서비스 롤 키를 클라이언트 번들·`NEXT_PUBLIC_*`에 넣지 않음
- RLS 우회를 클라이언트에서 시도하지 않음
