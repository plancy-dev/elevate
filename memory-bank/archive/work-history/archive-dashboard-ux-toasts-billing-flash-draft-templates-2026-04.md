# ARCHIVE — Dashboard UX toasts · Billing return flash · Episode draft templates P1 (2026-04)

**일자:** 2026-04-15  
**범위:** 서비스 전역 Sonner 토스트 정렬, Studio Productions 서버 액션 성공 구분자 + 폼 토스트, Lemon 커스텀 데이터 복사 토스트, 빌링 성공/실패 URL 일회성 플래시 토스트(`billingReturn`), G3.4 P1 시딩 초안 템플릿·`buildDraftPrompt` 바이어스·스냅샷 메타

## 1. 구현 요약

| 영역 | 내용 |
|------|------|
| Toaster | `AppToaster` + `sonner` 스타일을 루트 `app/layout.tsx`에 마운트(대시보드 중복 제거). 클라이언트는 `@/lib/ui/app-toast`에서 `toast` 사용. |
| Settings / Channels / Team / Integrations | 서버 액션 `success` 반환 + `useEffect`에서 `prevPending` 전이 시 `toast.success` (기존 인라인 성공 배너 정리). |
| Productions forms | `StudioProductionActionState`에 `success` 구분자; 에피소드 저장·아티팩트 추가·수정·삭제 토스트. `create`/`delete` episode는 `redirect()` 유지로 토스트 없음. |
| Billing · Lemon | `CopyButton`: 복사 성공 시 `toast.success`; 버튼 라벨 고정. |
| Billing · return flash | 쿼리 `billingReturn=success\|fail`; `BillingReturnFlashToast`가 토스트 1회 후 `router.replace`로 제거. Toss `successUrl`/`failUrl`, Lemon API 기본 `redirect_url`에 반영. |
| Draft templates (G3.4 P1) | `draft-prompt-templates.ts`: 키 4종 + 영문 bias; `buildDraftPrompt`에 `templateBias` 블록(방향 필드보다 앞); `draft_template_key`를 스냅샷 메타·LLM 스레드 유저 턴에 기록. 패널에 `FieldSelect`. |
| i18n | `Dashboard.productions` 토스트·템플릿 라벨, `Dashboard.billing` 플래시 문구 등 5 로케일 동기화. |

## 2. 비목표 · 의도적 제외

- 에피소드 **생성/삭제** 후 토스트(리다이렉트 중심 플로우).
- Toss 빌링 **성공 페이지** 본문과 토스트의 중복 가능성 — 짧은 확인용으로 허용(후속: 토스트 끄기 옵션).
- G3.4 **P2**(조직 커스텀 DB)·**P3**(시스템 프롬프트 변형) — 로드맵(`tasks.md` § G3.4).

## 3. 검증

- `pnpm verify` (ESLint, `tsc`, `vitest` unit 포함 `draft-prompt-templates`·`episode-llm-prompt`, `next build`) 통과 기준으로 마감.

## 4. 후속

- **`tasks.md` G3.4:** P2 org 커스텀 템플릿(CREATIVE → BUILD).
- **제품:** 템플릿 4종 실사용 체감 검증; bias 다국어화는 필요 시 별 이슈.

## 5. 코드 앵커 (참조)

- `src/lib/ui/app-toast.ts`, `src/components/ui/app-toaster.tsx`, `src/app/layout.tsx`
- `src/actions/studio-productions.ts`, `src/components/dashboard/studio-productions-forms.tsx`
- `src/components/dashboard/billing-lemon-checkout.tsx`
- `src/lib/billing/billing-return-flash.ts`, `src/components/dashboard/billing-return-flash-toast.tsx`
- `src/app/(dashboard)/dashboard/billing/success/page.tsx`, `fail/page.tsx`
- `src/components/dashboard/billing-toss-widget.tsx`, `src/lib/payments/resolve-lemon-checkout-for-billing.ts`
- `src/lib/studio-productions/draft-prompt-templates.ts`, `episode-llm.ts` (`buildDraftPrompt`)
- `src/actions/studio-episode-llm.ts` (`generateStudioEpisodeDraft`)
- `src/components/dashboard/production-episode-draft-panel.tsx`
- `tests/unit/draft-prompt-templates.test.ts`, `tests/unit/episode-llm-prompt.test.ts`

## 6. Memory Bank

- 로드맵·상태: `memory-bank/tasks.md` (§ G3.4 P1 완료 표기), `memory-bank/activeContext.md`.
