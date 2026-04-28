# INIT — Blog Subscription (Lemon Squeezy, Phase 1)

## 요청 요약

Elevate에 기존 단일 구독/권한 모델을 유지한 채, 블로그 전용 3티어 구독(`free`, `monthly`, `annual`)을 도입한다. 결제는 Lemon Squeezy hosted checkout + webhook 기반으로 동기화하며, 프리미엄 글은 프리뷰 컷오프 + CTA 페이월 UI를 적용한다.

## 제품/결제 고정값 (사용자 제공 SoT)

- Monthly: Product `1010143`, Variant `1585015`, `$5.99/month`
- Annual: Product `1010154`, Variant `1585028`, `$47.99/year`
- Checkout URL pattern:
  - `https://elevate.lemonsqueezy.com/checkout/buy/{variant_id}?checkout[email]={user_email}`

## 현재 코드베이스 매핑 (앵커)

### 이미 존재

- Lemon webhook 엔드포인트: `src/app/api/webhooks/lemonsqueezy/route.ts`
- Lemon webhook 처리기(현재 order_created 1회성 구매 중심): `src/lib/payments/lemon-squeezy-webhook.ts`
- 공통 결제 API/checkout 생성기: `src/lib/payments/lemon-squeezy-api.ts`
- 기존 권한 모델:
  - 조직 단위 entitlement: `organization_content_entitlements`
  - 접근 판정: `src/lib/content/ebook-access.ts`
- 블로그 렌더링 엔트리: `src/app/[locale]/(marketing)/blog/[slug]/page.tsx`
- 블로그 메타 파서: `src/lib/blog/posts.ts`

### 아직 없음 (이번 작업 대상)

- 사용자 구독 상태 스키마 (`subscription_tier`, `subscription_status`, LS subscription id, variant id, current period end)
- Lemon `subscription_*` 이벤트 처리 경로
- 블로그 포스트 `is_premium` 메타/플래그
- 프리미엄 프리뷰 컷오프 + reusable paywall CTA 컴포넌트
- 블로그 구독형 pricing/subscription 관리 화면
- Lemon checkout에 이메일 prefill 강제 규칙을 공통 유틸로 고정

## 복잡도 판단

**L4**

- 파일 수: 10+ (DB migration, webhook, auth-bound subscription resolver, blog renderer, CTA UI, pricing page, i18n)
- 설계 결정: 다수 (기존 org-plan/entitlement와 신규 user subscription tier 공존 모델)
- DB 변경: 있음 (새 테이블 또는 `profiles` 확장 + enum/status 모델)

## 설계 핵심 결정 (INIT 잠정안, PLAN에서 확정)

1. **권한 모델 분리**
   - 기존 `organization_content_entitlements`는 전자책/카탈로그 구매 경로 유지.
   - 블로그 구독은 사용자 단위 `blog_subscriptions` (가칭)로 분리.
   - 이유: 이후 콘텐츠 타입별 규칙 확장(블로그/전자책/제품 기능)을 위해 결합도 축소.

2. **웹훅 이벤트 수용**
   - 처리 대상: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`.
   - 이벤트 payload의 variant id를 내부 tier로 매핑:
     - `1585015` -> `monthly`
     - `1585028` -> `annual`

3. **접근 판정 계층**
   - 블로그 렌더링은 "전체 공개 vs 프리미엄"만 판단.
   - 실제 구독 판정은 별도 도메인 서비스(`lib/subscriptions/*`)가 담당.
   - 렌더링 레이어는 boolean contract만 받도록 유지.

4. **프리뷰 컷오프 정책**
   - 기본 35% 컷오프 (요구사항 30~40% 중앙값).
   - 컷오프/CTA/blur는 reusable component로 분리하여 향후 콘텐츠 타입 재사용.

5. **영문 카피 고정**
   - 사용자-facing 텍스트는 영어만 사용.
   - 기존 i18n 구조와의 충돌은 PLAN에서 "영문 고정 문자열 vs i18n 키" 선택.

## 리스크 및 선제 대응

- **리스크 A: 기존 org plan(`starter/professional/enterprise`)과 신규 blog tier 충돌**
  - 대응: blog access는 org plan 무시, 신규 subscription source of truth로 단일화.
- **리스크 B: Lemon webhook payload 신뢰성(이메일 매칭 실패/중복 이벤트)**
  - 대응: LS subscription id 기준 멱등 업데이트, 이메일은 fallback만 사용.
- **리스크 C: 프리미엄 글 렌더링 성능/UX 저하**
  - 대응: 서버에서 컷오프 문자열 계산 + 클라이언트는 표시만 수행.
- **리스크 D: 추후 ebook/제품 게이팅과의 얽힘**
  - 대응: 정책 엔진 함수명을 `canReadPremiumBlogPost`로 분리해 확장 지점 명확화.

## PLAN 진입용 구현 단위 (다음 단계)

1. DB 스키마 + 타입 갱신
2. Lemon subscription webhook 확장 + idempotency
3. subscription status 조회 서비스 + auth 연계
4. blog `is_premium` 메타 지원 + 프리뷰 컷오프 유틸
5. paywall CTA 컴포넌트 구현 (monthly/annual checkout 링크 + sign-in)
6. pricing/subscription page 개편 + manage subscription 링크
7. QA (typecheck/lint/unit + blog premium access integration smoke)

## 완료 기준 (INIT)

- 요구사항이 현재 코드 구조와 어디서 연결/확장되는지 명확히 맵핑됨
- 복잡도/리스크/다음 모드(PLAN) 진입 기준이 고정됨
- 구현 범위와 비범위가 분리됨
