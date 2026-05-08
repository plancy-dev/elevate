# 전자책(카탈로그) 읽기 허용 — 무엇이 “허용 리스트”인가

랜딩·`#waitlist`로 모은 **마케팅 화이트리스트**(`waitlist_signups`)는 **전자책 읽기 권한과 연결되어 있지 않습니다.**  
이메일만 등록한 사용자는 **회원가입·조직·결제/구독**을 거치기 전에는 Library / 리더에 접근할 수 없습니다.

## 허용 조건 (구현 상 단일 규칙)

앱에서 카탈로그 SKU를 “읽을 수 있다”고 판단하는 조건은 **`canReadCatalogProduct`** 한 곳에 모여 있습니다 (`src/lib/content/ebook-access.ts`).

아래 **둘 중 하나**면 해당 조직은 그 SKU를 읽을 수 있습니다.

| 경로 | 데이터 | 설명 |
|------|--------|------|
| **구독** | `organizations.plan`이 `professional` 또는 `enterprise` | 유료 조직 구독으로 카탈로그 전반 이용 (코드: `hasPaidServiceSubscription`) |
| **개별 구매** | `organization_content_entitlements`에 `(organization_id, content_product_id)` 행 존재 | 결제 확정 후 부여 (Lemon 웹훅 등: `grantOrganizationContentEntitlement`, `src/lib/payments/content-entitlement.ts`) |

`Starter` 플랜이고 entitlement도 없으면 **읽기 불가**입니다.

## 관련 코드 경로

- **권한 판단**: `canReadCatalogProduct`
- **조직·플랜·entitlement 집합 로딩**: `getOrganizationCatalogAccess` (`src/lib/data/organization-catalog-access.ts`)
- **UI**: `src/app/(dashboard)/dashboard/library/page.tsx`
- **다운로드 API**: `src/app/api/content/[productId]/download/route.ts`
- **웹 리더**: `src/app/(dashboard)/dashboard/library/[slug]/read/page.tsx`
- **개별 구매 후 entitlement 부여**: `grantOrganizationContentEntitlement` (결제 확인 성공 시)

## “초대-only” 결제 게이트

카탈로그 **결제(Checkout)** 만 별도로 막으려면 `catalog_purchase_allowlist` + `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST` — [`docs/CATALOG_PURCHASE_ALLOWLIST.md`](./CATALOG_PURCHASE_ALLOWLIST.md) 참고.  
읽기 권한은 여전히 **구독 + entitlement** (`canReadCatalogProduct`)입니다.
