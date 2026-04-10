# ARCHIVE — Dashboard Library · Billing · Lemon catalog (2026-04)

**일자:** 2026-04-10  
**범위:** 대시보드 라이브러리 상세·결제 진입, 빌링 UX, 관리자 카탈로그, Lemon 최소 가격·체크아웃 해석, i18n(5 로케일), Supabase 마이그레이션 `020`–`021`, 사용자 대면 카피 정리

## 1. 구현 요약

| 영역 | 내용 |
|------|------|
| Library | 제목 상세 `/dashboard/library/[slug]`, 체크아웃 리다이렉트 `/library/[slug]/checkout`, 목록·다운로드 버튼 정합 |
| Billing | Lemon 기본 시 `?product=` 있을 때만 체크아웃 UI; 슬러그 없을 때는 조직 요약(`BillingOrgSummary`)만으로 중복 카드 제거 |
| Purchases | `/dashboard/billing/purchases` + `purchase-history` 데이터 레이어 |
| Admin | 카탈로그 편집 다이얼로그, Lemon 셀 단순화, `content-products-admin` 액션 확장 |
| Payments | `resolve-app-origin`, `resolve-lemon-checkout-for-billing`, `lemon-custom-price-minimum`, API 체크아웃 URL 해석 |
| Storage | 다운로드 파일명: `storage-filename` + `original_file_name` (`020`) |
| DB | `021` Lemon 처리 주문 org SELECT RLS 보강 |
| i18n | 개발자 전용 문구(URL 트릭, env·웹훅 노출) 제거; 5 로케일 키 동기화 |

## 2. 제거·정리

- 빌링: `lemonBillingNoProductBody` / `lemonBillingLibraryCta` 및 이에 대응하던 중복 카드 UI 삭제 (기능은 org 요약 + CTA로 통합).
- `BillingLemonCheckout`: `contentProductSlug`는 호출부에서 항상 문자열로 전달.

## 3. 검증

- `pnpm verify` (ESLint, `tsc`, `vitest` unit, `next build`) 통과 기준으로 마감.

## 4. 후속(로드맵 참고)

- **`tasks.md` Phase G2:** Lemon 웹훅 → 엔타이틀먼트 고도화(idempotency·운영 테스트).
- **`pnpm db:types`:** 마이그레이션 적용 프로젝트에서 재생성.

## 5. 코드 앵커 (참조)

- `src/app/(dashboard)/dashboard/billing/page.tsx`
- `src/components/dashboard/billing-lemon-checkout.tsx`, `billing-org-summary.tsx`
- `src/app/(dashboard)/dashboard/library/[slug]/page.tsx`, `[slug]/checkout/`
- `src/lib/payments/resolve-lemon-checkout-for-billing.ts`, `lemon-custom-price-minimum.ts`
- `src/lib/url/resolve-app-origin.ts`
- `supabase/migrations/020_content_products_original_file_name.sql`, `021_lemon_squeezy_processed_orders_org_select.sql`
