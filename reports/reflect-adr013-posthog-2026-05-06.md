# BUILD / REFLECT — PostHog ADR-013 (2026-05-06)

**트랙:** Marketing CTA instrumentation production gate + (참고) 대시보드 사이드바 nav 이벤트.  
**프로젝트:** PostHog **358775** (Elevate), MCP `query-run` HogQL.  
**스냅샷 시각:** [`posthog-adr013-build-snapshot-2026-05-06.json`](./posthog-adr013-build-snapshot-2026-05-06.json) `generatedAt`.

## 쿼리 결과

| 점검 | 결과 |
|------|------|
| `elevate_marketing_cta_click` — 최근 **7일** `count()` | **0** |
| 동 이벤트 **30일** `cta_id` breakdown | **행 없음** (이벤트 자체 없음) |
| `elevate_dashboard_sidebar_nav_click` — **14일** | **0** |
| 임의 이벤트 **90일** 총량 | **33** |
| 90일 이벤트 종류 | `$autocapture` 15, `$pageview` 13, `$web_vitals` 3, `$pageleave` 1, `$rageclick` 1 |
| `event LIKE 'elevate%'` — **365일** | **0건** |

## 결론

- **ADR-013 §5 REFLECT 게이트:** **미충족** — 14× `cta_id` non-zero를 말할 데이터가 없음.  
- **365일간 `elevate_*` 커스텀 이벤트가 프로젝트에 없음** → 단순 “클릭이 없음”을 넘어, **프로덕션 클라이언트가 이 프로젝트로 커스텀 이벤트를 보내지 않거나**, **키/프로젝트 불일치** 가능성이 높음. (자동 수집 `$pageview` 등은 소량 존재.)

## 권장 조치 (운영 / 배포)

1. Vercel **Production** 에서 `NEXT_PUBLIC_POSTHOG_KEY`가 비었는지 확인 — 비어 있으면 [`getPosthogPublicConfig`](../../src/lib/env/posthog-public.ts) 때문에 PostHog 루트가 마운트되지 않음.  
2. 키가 **프로젝트 358775**용인지 PostHog UI **Project settings** 와 대조.  
3. 배포 후 실제 사이트에서 마케팅 CTA·헤더 링크 **한 번씩 클릭** → Insights에서 `elevate_marketing_cta_click` / `cta_id` 확인.  
4. 스냅샷 JSON: [`posthog-adr013-build-snapshot-2026-05-06.json`](./posthog-adr013-build-snapshot-2026-05-06.json)

## 이전 증거

- [`reflect-adr013-posthog-2026-05-04.md`](./reflect-adr013-posthog-2026-05-04.md) (8d count 0)
