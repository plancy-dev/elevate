# CREATIVE — Dashboard sidebar rationalization (GitHub #62, partial)

**Refs:** [#62](https://github.com/plancy-dev/elevate/issues/62), audit §2.5 · [#60](https://github.com/plancy-dev/elevate/issues/60) (hero/카피·히어로 PR 게이트) · [`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`](../docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md) (마케팅 서사 Scenario A — **대시보드 IA와 별층**).

---

## Decision (이미 합의된 증분 — BUILD 가능)

1. **Library group vs item label** — TOC 섹션 제목과 자식 링크가 동일 문자열이면 안 됨 (KO “라이브러리/라이브러리” 등). **접근:** `Dashboard.toc.library.section`(카탈로그형 섹션 제목)과 `Dashboard.toc.library.library`(내비 항목)를 **모든 locale**에서 분리.
2. **Permission guards** — 사이드바는 `layout.tsx`의 `isOrgAdmin` / `isServiceAdmin`으로 Audit·Admin 노출을 이미 제어. **후속:** 직 URL `/dashboard/organization/audit` 등이 비관리자에게 **fail-closed**(데이터·리다이렉트)인지 BUILD에서 확인.
3. **#60에 맡기는 것(히어로·랜딩)** — 마케팅 히어로/CTA 카피·홈 IA는 #60 PR. **대시보드** TOC 붕괴(13→4)의 **최종 메타포**(Productions 노출 여부 등)는 #60 **코멘트·DoD**와 맞춘 뒤 큰 PR이 안전.

---

## CREATIVE — 합리화 경로 (3안, 2026-05)

**목표:** Claude audit §2.5 — 중복·과다 노출·멘탈모델 혼선 완화. **비목표:** 랜딩 히어로 리라이트(#60), PostHog 서버 Phase 2.

### 안 A — **얇은 슬라이스** (권장 1차 BUILD)

| 요소 | 내용 |
|------|------|
| **내비** | 항목 **개수는 유지**하되 (1) 라이브러리 이중 라벨 제거 (2) 비권한 항목 **TOC에서 숨김** 강화 (3) “스크립트/편집실” 등 **툴팁 또는 부제 한 줄**로만 구분 보조 — 구조 재배치 최소 |
| **장점** | #60과 파일 충돌 적음, `pnpm verify`·i18n 회귀 범위 작음 |
| **단점** | 13항목 체감은 남음; DoD “4~5개”에는 미달 → 이슈에 **Phase 1**로 명시 |
| **수용** | 5 locale 메시지 + 사이드바 컴포넌트만; PostHog 매트릭스는 **선택** 또는 이슈 하위 체크 |

### 안 B — **허브형 Settings** (중간 무게)

| 요소 | 내용 |
|------|------|
| **내비** | 상단 **주 4개**: Studio(또는 합의된 단일 라벨) · Library · Productions(조건부) · **Settings** 하나로 들어가면 내부에서 프로필/결제/팀/도움말 탭 또는 서브메뉴 |
| **장점** | 이슈 DoD “4~5개”에 근접; 스캔 비용 감소 |
| **단점** | 라우팅·딥링크·모바일 햄버거 UX 재설계; **L2+ CREATIVE→PLAN→BUILD** 필수 |
| **차단** | Productions를 숨길지는 **제품 스트랜드** 결정과 연동 — #60 단독이 아니라 PM/로드맵 한 줄이 있으면 안전 |

### 안 C — **전면 IA 교체** (보류)

13→4 + 네이밍 전부 통합 + aria·키보드 + PostHog 이벤트 세트 — **#60 히어로 PR과 같은 릴리즈 주**에 묶는 편이 리스크 대비 명확. 지금 CREATIVE에서는 **채택하지 않음**.

---

## CREATIVE — 라벨·멘탈 모델 (다국어 원칙만 고정)

| UI 자리 | EN 권장 톤 | KO 참고 | 비고 |
|---------|------------|---------|------|
| **프롬프트 워크스페이스** | “Studio” 또는 “Prompt Studio” **하나만** SoT | “프롬프트 스튜디오” vs “편집실” — **제품 카피 #60과 동일한 단어**를 쓸지 표로 고정 | “편집실”이 제품 공식명이면 EN도 `Editor` 등 **1:1 매핑** |
| **영상 제작 줄기** | “Productions” | “제작” | Scenario A **마케팅**과 혼동 방지: 대시보드는 **제품** SoT (`creative-elevate-ai-pivot` 층) |
| **라이브러리 블록** | section ≠ item (위 Decision 1) | 동일 | |

**원칙:** 마케팅용 용어(ADR-012)는 **랜딩·블로그**; 대시보드 문자열은 **`messages/*` + 이 CREATIVE 표**가 우선.

---

## Verification (공통)

- `pnpm verify` after i18n / nav touch.
- Manual: ko/en에서 라이브러리 **그룹 vs 항목** 문자열이 다름; 비관리자에 Audit/Admin 미노출.

## Out of scope (이 CREATIVE 문서 밖)

- PostHog 사이드바 클릭 매트릭스 전면 정의(안 A에서는 선택).
- 키보드·aria **전수** 스윕 — 안 B/C에서 별 체크리스트.
- #60 히어로/랜딩 카피.

---

## Recommendation to BUILD

1. **먼저 안 A** 머지 → 이슈 #62에 “Phase 1 = 라벨+가드”라고 본문에 남김.  
2. **안 B**는 #60 DoD + Productions 노출 정책 한 줄 확정 후 **별 PR**.  
3. **직 URL fail-closed**는 안 A와 같은 PR에 넣을지, 마이크로 PR로 쪼갤지 **엔지 리뷰**에서만 결정.
