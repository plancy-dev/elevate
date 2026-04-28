# INIT: Editor's Desk — Design System v3 (편집자의 책상)

**상태:** INIT 재시작 (2026-04-27) — **구현 아님** · 다음: **PLAN (슬라이스 S0–S7) → CREATIVE → BUILD**
**브랜치:** `feat/editors-desk-v3` (main에서 분기, 별도 PR 단위로 머지)
**복잡도:** **L4** — 디자인 토큰 전면 교체 + 3서체 + UI 프리미티브 10개 재설계 + 앱 쉘 교체(Sidebar→TOC, Masthead) + 시그니처 **Columnar Timeline** 신규 + 마케팅·어드민·인증 + **Studio Phase 2 fullscreen editor 표면** 재기반 + 의존성 추가(framer-motion, cmdk, @react-aria/focus, @radix-ui/react-{dialog,popover,tooltip}) + 폰트(Fraunces, JetBrains Mono).

**이전 시도 (2026-04-24):** 동일 이름의 INIT/ADR-010/PLAN 산출물이 한 차례 작성되었으나 main에 머지되지 않은 채 사라졌고, 그 사이 ADR-010 번호는 별도 주제(`ADR-010-fullscreen-timeline-editor`)에 재배정되었다. 본 INIT은 **ADR-011**을 새 번호로 사용한다. 핵심 결정(Q1–Q9)은 그대로 가져간다.

**레거시 관계:** 본 문서는 [`docs/design/VISUAL_LANGUAGE_V2.md`](../design/VISUAL_LANGUAGE_V2.md) · [`DASHBOARD_UX_PRINCIPLES.md`](../design/DASHBOARD_UX_PRINCIPLES.md) · [`creative-apple-tier-visual-system.md`](../../memory-bank/creative-apple-tier-visual-system.md)를 **아키텍처적으로 대체**한다 (블루 주색·오렌지 마케팅·라운드·섀도우 → 전부 금지). PLAN 확정 시 v2 문서는 `memory-bank/archive/design-v2/`로 이관한다.

---

## 0. 한 줄 요약 (사용자 체감)

> **Elevate의 UI는 대시보드가 아니라 "편집자의 책상(Editor's Desk)"이다.**
> 모든 화면은 실시간 조판되는 활판 브로드시트 — 재단된 단(column), 룰 선, 편집 기호, 조용한 타이포그래피의 자신감. **둥근 모서리·그림자·그라디언트는 체계에서 원천 배제**된다.

---

## 1. 디자인 철학 (단일 무드)

| 원칙 | 내용 |
|------|------|
| **P1 — 하나의 무드** | 조용함(quiet) · 정확함(precise) · 자신감(confident). "delight" · 플레이풀 마이크로-애니 · 소프트 섀도우 금지. |
| **P2 — 분리는 1px 룰로만** | 섀도우·그라디언트가 아닌 **1px `--ink-100` 룰**로 레이어를 가른다. `box-shadow` 체계 전역 배제. |
| **P3 — 색은 3개뿐** | `ink` (블랙 계열) + `paper` (본 화이트) + `vermilion` (시그니처 주홍). **버밀리언은 오직 (1) 활성 선택 (2) 주 CTA (3) 편집 기호(커서·플레이헤드·현재 씬 지표)** 세 곳에서만 사용. |
| **P4 — 타이포그래피가 위계를 만든다** | Fraunces(가변 세리프, opsz 9–144) + Geist(정밀 그로테스크) + JetBrains Mono. 크기·굵기·opsz로 위계를 설정; 색은 위계 도구가 아니다(버밀리언·danger 제외). |
| **P5 — 모션은 기능적으로만** | 1 easing · 3 duration. bounce·float-on-hover·pulse·shimmer·parallax 전면 금지. hover = 색 변경 또는 룰 두께 변화; transform 금지. |
| **P6 — 키보드 퍼스트 (Linear DNA)** | 모든 클릭 가능 요소는 단축키를 mono로 내부 표시. `Cmd+K` 커맨드 바는 바닥 풀-너비 시트(중앙 모달 금지). |
| **P7 — 단 하나의 시그니처** | **Columnar Timeline** — 절대 일반 필름스트립/수평 바 타임라인으로 대체되지 않는다 (§3). |

---

## 2. 디자인 토큰 (교체 대상: `src/app/globals.css` + 신규 `src/styles/tokens.css`)

### 2.1 색상 (3 계열 + 시맨틱)

```css
:root {
  /* Ink & Paper - the base duality */
  --ink-900: #0A0A0A;
  --ink-700: #2B2B2B;
  --ink-500: #6B6B6B;
  --ink-300: #BDBDBD;
  --ink-100: #E6E2DA;   /* paper 위의 룰 라인 전용 */

  --paper-50:  #FAF7F0; /* 기본 배경, warm bone */
  --paper-100: #F3EEE1; /* 상승 표면 (Plate 내부) */
  --paper-0:   #FFFFFF; /* image frame 내부에서만 */

  /* Signature - 유일한 크로매틱 */
  --vermilion-600: #D4341C;
  --vermilion-100: #F9D9D1;

  /* Semantic - 기본은 모노크롬 */
  --ok: #2E7D48;
  --warn: #B8830E;
  --err: var(--vermilion-600);
}
```

**규칙.** `--primary`·`--accent`·`--marketing-accent`·`--interactive`·`--highlight` 등 v2 토큰 전면 폐기. **단**, S0에서는 v2 utility 콜러를 안전하게 보호하기 위해 **레거시 토큰을 v3 값으로 alias하는 shim**을 globals.css에 임시 추가(예: `--primary: var(--vermilion-600)`). S1~S6 슬라이스가 utility 이름을 단계적으로 제거한 후 S6 마지막에 shim 삭제.

### 2.2 타이포그래피 (세 서체, 더 이상 없음)

| 토큰 | 크기/라인 | 서체/웨이트 | 용도 |
|------|----------|-------------|------|
| `display-xl` | 72 / 1.0 | Fraunces 400, `opsz 144` | 씬 번호, 히어로 메트릭 |
| `display-lg` | 48 / 1.05 | Fraunces 400 | 페이지 매스트헤드 |
| `display-md` | 32 / 1.1 | Fraunces 500 | 섹션 타이틀 |
| `body-lg`    | 17 / 1.5 | Geist 400 | 스크립트/산문 |
| `body`       | 14 / 1.5 | Geist 400 | 기본 UI |
| `body-sm`    | 12 / 1.4 | Geist 500, tracking 0.02em | 레이블, 메타 |
| `mono`       | 12 / 1.3 | JetBrains Mono 400 | 타임코드, ID |
| `mono-sm`    | 11 / 1.3 | JetBrains Mono 500, uppercase | 단축키 배지 |

**강제:** display(>=48px)는 `font-variation-settings: "opsz" 144`. 산문 단 폭은 **66ch** 상한 — `.measure` 유틸리티로 강제.

**CJK 폴백 (Q7):** `[lang="ko|ja|zh-CN|zh-TW"]` 스코프로 `--font-display`/`--font-body`를 Noto Serif * + 시스템 산세리프로 오버라이드. tokens.css에 정의.

### 2.3 스페이싱 · 반경 · 모션

```css
/* 4pt base */
--space-{1,2,3,4,6,8,12,16,24}: 4|8|12|16|24|32|48|64|96px;

/* Near-zero radius */
--radius-0: 0;         /* 기본 - 모든 카드/모달/타임라인/썸네일 */
--radius-1: 2px;       /* 인풋·버튼 전용 */
--radius-full: 9999px; /* 아바타·로딩 도트 전용 */

/* Motion */
--ease-editorial: cubic-bezier(0.2, 0, 0, 1);
--dur-instant: 80ms;
--dur-quick:  160ms;
--dur-page:   240ms;
```

### 2.4 커스텀 유틸리티 (Tailwind v4 `@utility`)

- `.rule-t` / `.rule-r` / `.rule-b` / `.rule-l` — 1px 단변 룰 (`--ink-100`)
- `.measure` — `max-width: 66ch`
- `.font-display-opsz` — Fraunces + `font-variation-settings: "opsz" 144`
- `.rule-draw` — 1px 룰 좌→우 그리기 애니메이션 (240ms, 1회)

---

## 3. 시그니처 컴포넌트 (정확히 1개)

### **Columnar Timeline** — 비대체 시그니처

모든 씬은 **수직 타이포그래픽 단**으로 렌더링된다: 폭 **280px**, 다음 단과는 **1px 세로 룰**로 구분(여백 금지).

- 수평 스크롤. 라운드·섀도우 0.
- 플레이헤드: 2px 버밀리언 세로 라인 + 상단 Fraunces `▸` 글리프. 재생 시 0°→90° 회전.
- 재정렬: 드래그 후 즉시 스냅 — 트랜지션 없음.
- 스트레스 테스트(BUILD): 24씬으로 시각적·키보드·a11y 확인.

**대체 금지:** 일반 필름스트립(수평 썸네일 행)이나 수평 바 타임라인으로 바꾸는 PR은 자동 거절.

**Studio Phase 2 fullscreen editor와의 관계:** 이미 `src/app/(dashboard)/dashboard/productions/[episodeId]/editor/page.tsx`에 fullscreen editor가 존재한다 ([ADR-010 fullscreen-timeline-editor](../adr/ADR-010-fullscreen-timeline-editor.md)). v3 ColumnTimeline은 **Phase 2 editor 안의 타임라인 트랙 UI를 대체**한다 — DSL v3 (`editor-dsl.ts`)와 폴링 루프, FFmpeg 렌더 파이프라인은 그대로 재사용. ColumnTimeline 슬라이스(S3)에서 통합. 데이터 모델·서버 액션 **무변경**.

---

## 4. 컴포넌트 (사내 용어)

**경로 결정 (Q10 — 신규):** v3 디자인 프리미티브는 `src/components/desk/` 디렉터리에 둔다. Studio Phase 2 editor 도메인 컴포넌트가 이미 `src/components/dashboard/editor/`에 있어 어휘 충돌을 피하기 위함. "Desk" = "Editor's Desk"의 핵심 어휘이며, 명확한 의미 분리.

| 신규 이름 (`src/components/desk/`) | 금지 이름 | 스펙 요약 |
|-----------|-----------|-----------|
| **Plate** | ~~Card~~ | 1px ink-700 border · radius 0 · `--paper-100` 채움. 타이틀 Fraunces, 메타 mono. **hover-lift 금지**. 선택 = 좌측 3px 버밀리언 바. |
| **Mark** | (신규) | 편집 글리프: `¶ § ⁋ ▸ • — ––`. 이모지 UI 사용 금지 — 오직 이 글리프 세트만. |
| **ShortcutBadge** | — | mono 11/12px uppercase tracking-0.04em — 버튼 우측·모달 닫기·CommandBar 결과에 임베드. |
| **Masthead** | ~~Header~~ | `display-lg` Fraunces + 전체 너비 룰. 페이지 상단. |
| **TOC** | ~~Sidebar~~ | 좌측 고정 240px, `--paper-100`. **Roman numerals (I, II, III)** 섹션 + small caps 레이블. 활성 = 좌측 버밀리언 `•` bullet (**bg 채움 금지**). `Cmd+\`로 접기. |
| **CommandBar** | ~~CommandPalette~~ | `Cmd+K` 풀-너비 바닥 시트. 결과 = **역순 번호 mono 리스트** (가장 관련 항목이 커서 가까이). |
| **ColumnTimeline** | ~~Timeline / Filmstrip~~ | §3 시그니처. 서브: `Column` · `Playhead` · `Rule`. Phase 2 editor 안에 통합. |
| **FramePicker** | ~~KeyframePicker~~ | 두 Plate 수직 쌓기 — `FIRST ——` / `—— LAST` (uppercase mono). 중간은 em dash 1개. |
| **Button** (`src/components/ui/`) | — | 직사각형, 2px radius, 1px ink border. Primary = 버밀리언 채움 + paper 텍스트. **hover에서 크기 변화 없음** (insetborder가 1→2px). 단축키 mono 우측 정렬 내부 표시. |
| **Input** (`src/components/ui/`) | — | **박스 없음** — 1px 하단 룰(`--ink-300`)만. focus 시 룰이 `--vermilion-600` 2px로. 레이블 `body-sm` uppercase 0.08em tracking. 캐럿 2px 버밀리언 바. |
| **Modal** (`src/components/ui/`) | — | Radix Dialog. 60% ink 오버레이. 데스크톱 640px 중앙 / 모바일 풀-너비 바닥 슬라이드업. 헤더 `display-md` + 룰. `ESC` mono 배지 우상단. |

---

## 5. 레이아웃

```
+------+------------------------------------------+
|      |  Masthead (display-lg + ruled line)      |
| TOC  +------------------------------------------+
| 240  |                                          |
| px   |        Work surface (--paper-50)         |
|      |                                          |
|      +------------------------------------------+
|      |  Columnar Timeline (320px tall, fixed)   |
+------+------------------------------------------+
```

**네비게이션 - 키보드 퍼스트.** `Cmd+K` 커맨드 바 · `g→s` (Scripts) · `g→t` (Timeline) · `g→p` (Publish) · `Cmd+\` (TOC 접기). 모든 클릭 요소는 단축키 노출; 숨겨진 단축키 금지.

**반응형.** Desktop-first, 최소 1280px. 1024px 이하: TOC는 상단 56px 스트립으로 접히고 ColumnTimeline은 수직 스택. **모바일 에디터 없음** — 모바일은 view / approve / publish 전용 (Phase 2 editor는 이미 데스크톱 전용으로 정합).

---

## 6. 미세 인터랙션 (정확히 5개)

1. **Scene Number Set** — LLM 씬 응답 시 `01`, `02`, `03`… 번호가 좌→우 40ms stagger로 찍힘.
2. **Rule Draw** — 모든 1px 수평 룰은 마운트 시 `clip-path` inset로 좌→우 그려짐 (240ms · `--ease-editorial`). 1회, 루프 없음.
3. **Playhead Scrub** — 플레이헤드 드래그 시 인접 단 썸네일 즉시 갱신. 재생 시작 시 `▸` 글리프 0°→90° 회전.
4. **Publish Confirm** — CTA 레이블 글자 단위 트윈: `Publish` → `Publishing 01/03...` → `Published Cmd+↵`.
5. **Command Bar Summon** — `Cmd+K`로 풀-너비 바가 바닥에서 160ms 슬라이드 업. 결과 역순 번호 mono 리스트.

**Framer Motion 경로 제한 (Q3):** ESLint `no-restricted-imports`로 `framer-motion` import를 `src/components/desk/**` + 지정된 micro-interaction 파일로만 허용.

---

## 7. 스택 · 의존성 (신규)

```
신규:
  framer-motion           §6 5개 인터랙션 전용 (import-boundary 규칙)
  cmdk                    CommandBar
  @radix-ui/react-dialog  Modal headless
  @radix-ui/react-popover Tooltip/Popover
  @radix-ui/react-tooltip Tooltip
  @react-aria/focus       FocusScope + roving tabindex
  (구글 폰트) Fraunces + JetBrains Mono
```

기존 재사용: `@radix-ui/react-dropdown-menu` · `@radix-ui/react-select` · `next-themes` · `sonner`(재스타일 필요).

### 7.1 Tailwind 설정 변경

- `boxShadow` → `--shadow-card`/`--shadow-ambient` shim을 `none`으로 매핑 (S0)
- `borderRadius` → `--radius-sm: 2px`, 기타 default `--radius-md/lg/xl` 값을 `0`으로 collapse (S0)
- 그라디언트 유틸 → 3개 파일만 수동 sweep (S5에서)
- 신규 유틸리티: `.rule-{t,r,b,l}` · `.measure` · `.font-display-opsz`

### 7.2 폰트 로딩 (`layout.tsx`)

`next/font/google`의 `Geist`/`Geist_Mono` 제거 → CSS 링크 방식으로 통합:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
```

---

## 8. 파일 구조 (어휘 강제)

```
src/
  styles/tokens.css              # CSS vars only
  styles/globals.css 또는 app/globals.css  # rules, @font-face, reset
  components/desk/               # Editor's Desk 핵심 어휘
    Plate.tsx                    # NOT Card
    Masthead.tsx                 # NOT Header
    TOC.tsx                      # NOT Sidebar
    CommandBar.tsx
    ColumnTimeline/
      Column.tsx
      Playhead.tsx
      Rule.tsx
    FramePicker.tsx
    Mark.tsx                     # ¶ § ⁋ ▸ 글리프
    ShortcutBadge.tsx
    index.ts
  components/ui/                 # 기존 primitives 재작성 대상 (Button/Input/Modal/Select/...)
  components/dashboard/editor/   # Studio Phase 2 fullscreen editor (변경 없음, 단 클래스명만 v3 토큰으로 sweep)
```

**기존 `src/components/dashboard/sidebar.tsx` → `src/components/desk/TOC.tsx`로 대체** (S2). 기존 `film-strip.css` · `src/lib/design-system-classes.ts` **삭제** (S0). v2 디자인 문서 7건 → `memory-bank/archive/design-v2/`로 git mv (S0).

---

## 9. 영향 범위 (inventory)

| 범주 | 파일 수(추정) | 비고 |
|------|--------------|------|
| `rounded-*` 사용 tsx | ~90 | 전면 sweep 필요 (S1~S6) |
| `shadow-*` 사용 tsx | ~43 | 전면 삭제 (S1~S6) |
| 그라디언트 유틸 사용 tsx | 3 | 전면 삭제 (S5) |
| `ui/` 프리미티브 | 10 | Button/Input/Textarea/Select/FieldSelect/Card/Modal/Badge/Toaster/button-styles — 전면 재작성 (S1) |
| 앱 쉘 | ~8 | sidebar/dashboard-nav-link/elevate-logo/theme-toggle/marketing-nav-dropdown/header-auth-cluster/admin-sidebar/app-toaster (S1+S2) |
| 씬·타임라인 UI | ~8 | scene-image-gallery/scene-clip-upload-rows/scene-render-pipeline-step/scene-i2v-trigger/production-episode-scenes-overview/production-episode-pipeline/publish-scheduler/resolve-episode-scenes — ColumnTimeline으로 통합 (S3+S4) |
| **Studio Phase 2 editor** | `src/components/dashboard/editor/` | 클래스명만 v3 토큰으로 sweep (S4) — DSL/server pipeline 무변경 |
| 마케팅 라우트 | ~7 | `[locale]/(marketing)/{page,blog,pricing,product,solutions}` · kpi-dashboard-preview · marketing-nav-dropdown (S5) |
| 어드민·빌링 | ~10 | admin-*·billing-*·content-products-*·waitlist-* (S6) |
| 인증 | ~8 | login-form·signup-form·oauth-provider-buttons·update-password-form·access-pending-sign-out·forgot-password-form·connected-identities·sign-out-button (S5) |

**스키마·서버 액션·DB 마이그레이션:** 변경 없음 (순수 표현 계층 리빌드).

---

## 10. 기존 문서·규칙과의 충돌 (반드시 PLAN에서 해결)

| # | 충돌 지점 | 기존 (v2) | 신규 (v3) | 해결 |
|---|----------|-----------|-----------|------|
| C1 | 주 인터랙션 색 | IBM 블루(`--primary`) | 버밀리언(`--vermilion-600`) | v2 문서 archive → v3 SoT 승격 (Q1) |
| C2 | 마케팅 오렌지 | 마케팅 CTA 오렌지 | **크로매틱 1개 (vermilion only)** | 마케팅 오렌지 폐기 (Q2) |
| C3 | 라운드 반경 | `rounded-lg` 기본 + 마케팅 CTA `rounded-full` | `--radius-0` 기본 · `--radius-1: 2px` 인풋·버튼 | 토큰 collapse (Q4) |
| C4 | 섀도우 | `--elevate-shadow-card` + `shadow-card` | **전면 금지** | shim → `none`, S6에서 wipe |
| C5 | 사이드바 활성 상태 | bg-layer-02 + 작은 pill marker | TOC = bullet `•`만, bg 채움 금지 | TOC 신규 (Q6 Option A) |
| C6 | 모션 | 120-180ms ease-out | 1 easing + 3 duration; bounce 금지 | motion 토큰 재정의 (Q3) |
| C7 | 타이포 | Geist 단일 | Fraunces + Geist + JetBrains Mono | layout.tsx 폰트 재로드 (Q7+Q8) |
| C8 | 필름스트립 | `film-strip.css` + scene-image-gallery | **Columnar Timeline** | film-strip.css 삭제 (S0), 통합 (S3) |
| C9 | Studio Phase 2 editor | v2 스타일로 빌드됨 (`src/components/dashboard/editor/`) | v3 토큰으로 클래스명 sweep | S4에서 점진 (DSL/서버 무변경) |

---

## 11. 확정 결정 (Q1–Q10) — 이전 세션에서 사용자 락

| # | 결정 |
|---|------|
| **Q1** | v2 문서 즉시 archive → `memory-bank/archive/design-v2/` |
| **Q2** | 마케팅 오렌지 폐기 (버밀리언 유일 크로매틱) |
| **Q3** | Framer Motion 경로 제한 — `src/components/desk/**` + 지정 micro-interaction 경로만 |
| **Q4** | Tailwind config 완전 교체 (단, S0는 v2 토큰 shim으로 빌드 보호) |
| **Q5** | 다크 테마 Phase 2 (S7) — 토큰 정의만, 토글 비활성 |
| **Q6** | TOC IA Option A (Editorial metaphor): I. Studio / II. Scripts / III. Library / IV. House / V. Settings |
| **Q7** | CJK 폴백 — Noto Serif KR/JP/SC/TC + 시스템 산세리프 |
| **Q8** | 성능 예산 — Fraunces display-lg 1 weight만 preload + `display=swap` |
| **Q9** | ColumnTimeline 데이터 — 기존 `resolve-episode-scenes.ts` + `studio-productions.ts` 재사용; 스키마 변경 없음 |
| **Q10** | **신규** — v3 디자인 프리미티브 경로 = `src/components/desk/` (`/components/dashboard/editor/`와 어휘 충돌 회피) |

---

## 12. 슬라이스 (PLAN 입력용 — merge-order)

| # | 슬라이스 | 산출물 | 복잡도 |
|---|---------|--------|-------|
| **S0** | **Tokens & Fonts + Archive** | tokens.css · globals.css 재작성 + v2 shim · layout.tsx 폰트 · ESLint framer-motion 경로 제한 · v2 문서 7건 archive · film-strip.css/design-system-classes.ts 삭제 | L2 |
| **S1** | **Primitives** | `desk/{Plate,Mark,ShortcutBadge}` + `ui/*` 10개 재작성 (Button·Input·Textarea·Modal·Select·FieldSelect·Card→Plate 어댑터·Badge·Toaster) | L3 |
| **S2** | **Shell** | `desk/{TOC,Masthead,CommandBar,logo-typographic}` + `useShortcut` 훅 + sidebar 삭제 | L3 |
| **S3** | **🌟 Columnar Timeline (시그니처)** | `desk/ColumnTimeline/{Column,Playhead,Rule}` + 24씬 스트레스 + Phase 2 editor 통합 진입점 | L3 |
| **S4** | **Scene / Publish 표면 + Phase 2 editor sweep** | FramePicker · PublishScheduler 재레이아웃 · `dashboard/editor/*` 클래스명만 v3 토큰으로 sweep · scene-image-gallery → ColumnTimeline 통합 | L3 |
| **S5** | **Marketing + Auth 재기반** | `[locale]/(marketing)/*` · `(auth)/*` · elevate-logo 타이포 버전 · 그라디언트 3건 sweep | L3 |
| **S6** | **Admin + Billing sweep + Lock** | `(admin)/*` · `dashboard/billing/*` · `dashboard/team` · 남은 `rounded-*`·`shadow-*` grep 0건 + Tailwind shim 최종 wipe | L2 |
| **S7** | **다크 테마 (선택)** | data-theme="dark" 토큰 스왑 검증 · 토글 활성화 | L2 |

**Merge order:** S0 → S1 → S2 → S3 (시그니처 우선 락) → S4 · S5 · S6 (병렬 가능) → S7. 각 슬라이스 = 1 commit, 전체 = 1 PR (브랜치 `feat/editors-desk-v3`).

---

## 13. 빌드 체크리스트 (모든 PR 게이트)

- [ ] Zero `rounded-lg/xl/2xl/md` — 신규 코드에서. 기존은 슬라이스 진행 중에 점진 제거.
- [ ] Zero `box-shadow` · `shadow-*` 유틸 — S6 lock에서 0건.
- [ ] Zero 퍼플·블루·그라디언트 유틸.
- [ ] 모든 클릭 요소에 단축키 mono 표시.
- [ ] Fraunces for 타이틀/번호; Geist for UI; JetBrains Mono for 코드/시간.
- [ ] Columnar Timeline은 S3 슬라이스에서 24씬 스트레스 통과.
- [ ] hover-lift transform 금지. hover = 색 변화 또는 룰 두께 변화만.
- [ ] 컴포넌트 이름 = 편집자 어휘(Plate/Masthead/TOC/Rule/Mark) — `src/components/desk/`에 위치.
- [ ] UI에 이모지 없음 — 오직 편집 글리프 세트.

**"Build Elevate as if composing a magazine. The craft must show."**

---

## 14. 학습 — 이전 시도(2026-04-24)에서 발견된 함정

| # | 함정 | 회피책 |
|---|------|--------|
| **L1** | PostCSS 8.4.31 + Turbopack은 CSS 주석 안의 unicode em-dash(`—`)에서 `Unknown word` 빌드 에러 발생 | tokens.css/globals.css의 모든 주석은 **ASCII 하이픈(`-`)만 사용**. 이모지·특수문자도 코드 영역 밖 |
| **L2** | Tailwind v4 `@theme { --shadow-*: initial; }`로 namespace 전체를 wipe하면 ~40개 파일이 즉시 빌드 실패 (`shadow-card`, `shadow-md` 미해소) | S0는 **레거시 토큰 shim**으로 utility 이름 보존 + 값만 v3로 swap. namespace wipe는 S6 lock에서 모든 콜러 제거 후 |
| **L3** | Modal/CommandBar는 framer-motion이 필요한데 `src/components/ui/modal.tsx`는 ESLint 차단됨 | 옵션 (a) Modal을 `src/components/desk/Modal.tsx`로 이동 (b) ESLint allowlist에 `src/components/ui/modal.tsx` 추가 (c) Modal은 CSS transitions만 사용 → **PLAN에서 (a) 선택 권장** |
| **L4** | `next/font/google` 제거 후 `${geistSans.variable}` 참조 잔존하면 SSR 빌드 깨짐 | layout.tsx 클래스 attr에서 폰트 변수 참조 전부 제거 + body className 명시적 설정 |
| **L5** | `design-system-classes.ts` 즉시 삭제 시 3개 callers 빌드 깨짐 | S0에서 deprecated stub (`export const modalPanelClassName = ""`) 유지 → S1 마이그레이션 후 삭제 |

---

## 15. 다음 모드

**PLAN** — S0/S1/S2 상세 체크리스트 (`docs/features/PLAN-editors-desk-s0-s1-s2.md`) → ADR-011 작성 (`docs/adr/ADR-011-design-system-v3-editors-desk.md`) → CREATIVE TOC IA (`docs/design/v3-creative/toc-ia-mapping.md`) → BUILD S0 순차.

**진입 조건 (Q1~Q10 모두 락 완료):** 본 INIT 작성 직후 PLAN으로 진입 가능.
