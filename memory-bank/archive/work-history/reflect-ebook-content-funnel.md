# REFLECT — AI 피벗 구현 검수 & 전자책 우선 퍼널

**일자**: 2026-04-01  
**범위**: Pretext·gstack·문서·`009` 스키마·Library·랜딩·레거시 MICE 정리

## 1. 계획 대비 구현 완료도

| 계획 항목 | 상태 | 비고 |
|-----------|------|------|
| Phase 0 인벤토리 + North Star | 완료 | `inventory-ai-pivot-phase0.md`, `creative-elevate-ai-pivot.md` |
| Phase 1 문서·AGENTS/CLAUDE | 완료 | README, domainKnowledge, tasks, activeContext |
| gstack vendored + `docs/GSTACK.md` | 완료 | `./setup`는 Bun 필요; ESLint에서 `.agents/**` 제외 |
| Pretext 랜딩 | 완료 | `PretextHeroStatement`, `globals.css` 애니메이션 |
| `009` 카탈로그·엔타이틀먼트 | 완료 | RLS 적용; 타입 수동 반영 |
| 대시보드 Library + Legacy MICE 네비 | 완료 | 사이드바 구조 분리 |
| `pnpm verify` | 통과 | lint / tsc / unit / build |

**미완·의도적 후속**: `pnpm db:types`(원격 DB 반영 후), Toss ↔ `content_product_id` 연동(B4), 공개 스토어프론트(비로그인 구매).

## 2. 데드 코드·드리프트 정리

- `messages/en.json`의 **`LibraryPage` 네임스페이스**는 대시보드가 `[locale]` 밖에 있어 미사용 → **삭제** (단일 소스 유지).
- **삭제하지 않은 것**: `.agents/skills/gstack`(업스트림 스킬 팩).

## 3. 전자책 우선 콘텐츠 비즈니스 — 퍼널·여정 적합성

### 3.1 목표 서사 (초기)

**전자책·디지털 콘텐츠 판매**로 현금·검증 → 후속 **프리미엄 가이드/번들/구독** → 장기 **워크플로 SaaS**.

### 3.2 이상적 사용자 퍼널 (요약)

1. **인지 (Awareness)**: SEO·소셜·랜딩(Pretext)·케이스 스터디
2. **관심 (Interest)**: `/pricing`, `/demo`, `/product`, 블로그/리소스
3. **전환 (Conversion)**: 결제(Toss)·주문 확정 → `content_products` + `organization_content_entitlements`(또는 개인 구매 시 확장)
4. **접근 (Access)**: 로그인 후 **Library**에서 엔타이틀먼트 확인 → (향후) 파일 다운로드·링크
5. **확장 (Expand)**: 팀 초대·조직 플랜·업셀

### 3.3 구현 대비 갭 (검수 결과)

| 영역 | 현재 | 갭 |
|------|------|-----|
| 카탈로그 | `content_products` 일반 | **전자책/가이드 구분** 필드 부재 → `product_kind` 추가 |
| 구매 | Toss PoC·`008` | 카탈로그 SKU와 **주문 연결** 미구현 |
| 딜리버리 | 없음 | **스토리지 URL·다운로드** 미구현 |
| 퍼널 상단 | 랜딩 카피 AI 피벗 | **전자책/디지털 상품** 문구를 North Star에 명시 필요 |
| 비로그인 구매 | 없음 | 전형적 전자책 퍼널은 게스트 결제 가능 → 백로그 |
| KPI | PostHog 옵션 | 전환·라이브러리 오픈 이벤트 정의 필요 |

### 3.4 결론

구조는 **B2B 조직·엔타이틀먼트**에 맞춰져 있어, **전자책 1인 구매** 퍼널과는 부분 겹침. 초기에 **전자책 = 조직 1인 org 또는 개인 프로필로 매핑**하거나, 추후 `purchases`에 `user_id` 추가로 보완. 문서·스키마·Library 카피로 **전자책 우선**을 명시하면 전략 정합성 확보.

## 4. 개선 페이즈 (이번 반영)

| 페이즈 | 내용 |
|--------|------|
| **Doc-1** | `docs/CONTENT_FUNNEL.md`, North Star·domainKnowledge에 전자책 단계 명시 |
| **Schema-1** | `010`: `content_products.product_kind` (ebook 기본) |
| **App-1** | Library: `product_kind` 표시, 카피를 전자책 퍼널에 맞게 조정 |
| **Clean-1** | 미사용 `LibraryPage` i18n 키 제거 |

후속(별도 스프린트): Toss 주문·SKU 연동, Storage, 게스트 결제, PostHog 퍼널 이벤트.

## 5. 본 라운드에서 반영한 개선 (Doc-1 / Schema-1 / App-1 / Clean-1)

- **`010_content_product_kind.sql`**: `content_products.product_kind` (기본 `ebook`).
- **타입·Library**: `product_kind` 조회 및 뱃지 표시; 카피를 전자책 우선 퍼널에 맞게 조정.
- **문서**: `docs/CONTENT_FUNNEL.md`, North Star·`domainKnowledge`·`tasks`·`activeContext` 갱신.
- **정리**: `messages/en.json` 미사용 `LibraryPage` 키 제거.
