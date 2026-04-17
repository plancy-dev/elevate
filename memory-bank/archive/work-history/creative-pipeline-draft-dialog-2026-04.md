# CREATIVE — 파이프라인 「초안 저장됨」 다이얼로그

**Status:** CREATIVE lock for BUILD — 구현은 본 문서·[`VISUAL_LANGUAGE_V2.md`](../../../docs/design/VISUAL_LANGUAGE_V2.md)·[`DASHBOARD_UX_PRINCIPLES.md`](../../../docs/design/DASHBOARD_UX_PRINCIPLES.md)에 맞출 것.  
**SoT 상위:** [`tasks.md`](../../tasks.md) § G3.1.2 (PLAN). **아카이브:** `memory-bank/archive/work-history/` (2026-04).

---

## 1. Design intent

| Goal | How |
|------|-----|
| **Instrument-like** | 한 모달 안에서 **읽기→생성→비교→저장**이 위에서 아래로 흐르고, 장식 없이 **타이포·구분선·레이어**로만 위계를 만든다. |
| **Calm chrome** | 모달은 **depth budget 3** (오버레이 → 패널)만 허용; 본문 안에서는 **카드 탑재 카드** 금지 — inset은 `bg-layer-02/25` + `border-border-subtle` 한 겹. |
| **One accent story** | 주요 CTA는 **저장·적용** 등 기존 `Button` 계열 **primary** 하나씩만 강조; 성공/완료 상태는 파이프라인 카드의 그린만 쓰고 모달 안에서는 **중립 톤** 유지. |

---

## 2. Modal shell

| Decision | Choice |
|----------|--------|
| **Primitive** | 기존 [`Modal`](../../../src/components/ui/modal.tsx) — `role="dialog"` · Esc · 백드롭 클릭 닫기 유지. |
| **Width** | `size="xl"` (`max-w-3xl`) **기본**. 스크립트 필드 가독성이 부족하면 **한 단계만** 넓히기: `Modal`에 `size="2xl"` 추가 시 `max-w-4xl` (BUILD에서 실제 줄 길이로 검증). |
| **Height** | `max-h-[90vh]` 유지; **본문 단일 스크롤** — 헤더(제목·닫기)는 스크롤과 함께 움직여도 되고, **sticky 헤더**는 선택(구현 단순성 우선). |
| **Title / description** | 제목: 짧은 명사구( i18n 키 예: `pipelineDraftDialogTitle`). 설명 1줄: **파이프라인 맥락**만 — “훅·제목·대본을 여기서 바꾸면 다음 단계에 반영됩니다” 수준; draft 탭 소개 문단은 **넣지 않음**. |
| **Footer row (선택)** | 본문 하단에 `text-xs text-text-tertiary` + 텍스트 링크 1개: **「레퍼런스·전체 작업대」** → `episodePanel=draft` (query 유지: `tab=episode`). 보조 진입로일 뿐 시각적 무게 최소. |

---

## 3. 본문 정보 구조 (위 → 아래)

스크롤 한 덩어리. 섹션 라벨은 기존 draft 패널과 동일한 **uppercase / `text-[10px]`–`text-xs` / `text-text-tertiary`** 리듬.

```
┌ Modal header (title · ✕) ─────────────────────────┐
│ [선택] 한 줄 description                          │
├───────────────────────────────────────────────────┤
│ A. 오류 배너 (액션 에러 시만)                       │
│ B. 비교 영역 (compareOpen 시만) — 기존 FieldDiff   │
│    블록 + 적용/되돌리기 (primary/secondary)         │
│ C. LLM 도구 띠 — provider/model (기존 2열 그리드)   │
│ D. 생성 폼 — develop/fresh · briefing · template   │
│ E. 훅 / 제목 / 대본 필드 — 스크립트 textarea        │
│    rows ≥ 8, 모달에서는 가능하면 +2 rows           │
│ F. 다듬기 폼 (짧은 instruction)                     │
│ G. 수동 저장 (primary sm)                           │
│ H. 스냅샷 — 제목 + `max-h` 스크롤 리스트 + 복원      │
│ [선택] I. 푸터 링크 → draft 탭                     │
└───────────────────────────────────────────────────┘
```

| Section | CREATIVE note |
|---------|----------------|
| **B** | AI 생성 직후 비교는 **모달 내부 상단**에 두어 “방금 바뀐 것”이 먼저 보이게 한다 (패널과 동일 논리). |
| **C–F** | 기존 패널의 `rounded-xl border … bg-layer-02/25` 띠를 **재사용** — 새 decoration 추가 금지. |
| **E** | 필드 순서 **훅 → 제목 → 대본** 고정; 라벨은 기존 `draftHookLabel` 등 재사용. |
| **H** | 스냅샷 리스트는 **컴팩트 카드** 한 줄(시간·소스) + 복원 버튼; `max-h-72` 패널과 동일 또는 모달 높이에 맞게 약간 축소 가능. |

---

## 4. 파이프라인 카드 (`PreprodInfoRow`)

| Decision | Choice |
|----------|--------|
| **진입** | **보기/다시**가 있는 옆 스텝과 시각적 균형을 맞추기 위해, 오른쪽에 **`cursor-pointer` 텍스트/고스트 버튼** 하나: **「편집」**( i18n `pipelineDraftCardEditCta` ). 카드 전체를 `<button>`으로 감싸면 스크린리더가 중복 읽을 수 있어 **우선: 행 = flex, 오른쪽 편집만 버튼**; 완료 상태에서 행 클릭 = 편집과 동일 동작은 **선택** (클릭 영역 확대 시 `role="button"` + 키보드 Enter 한 번에 열리게). |
| **완료 상태** | 기존 그린 배경 유지; **편집**만 primary 링크 톤 (`text-primary` hover:underline 또는 `Button variant` ghost). |
| **미완료** | 기존 힌트 + 동일 **편집** CTA로 빈 초안 진입. |
| **읽기 전용** | `canEditDraft === false`: 편집 CTA 숨김, 카드에 `draftPanelReadOnly` 한 줄 또는 툴팁 수준 안내. |

---

## 5. 닫기 · 미저장 (PLAN 미결 → CREATIVE 잠금)

| Trigger | Behavior |
|---------|----------|
| **저장 성공 후** | 토스트 유지 · `router.refresh()` — 모달은 **열려 둔 채** 닫지 않아도 됨(사용자가 연속 편집 가능). 선택: 저장 후 자동 닫기 **안 함**. |
| **Esc / 백드롭 / ✕** | 로컬 편집 상태가 **마지막 `artifacts` 시드와 다름**이거나 **`compareOpen`** 이면 **확인 다이얼로그** 1단: “저장하지 않은 변경이 있습니다. 닫을까요?” — **취소** / **닫기**(discard). |
| **구현 단순화** | “더티” 판정은 패널이 쓰는 `hook/title/scriptDraft` vs `draftTripleFromArtifacts(artifacts)` 문자열 비교 + `compareOpen` OR. |

---

## 6. 접근성 · 포커스

- 모달 오픈 시 포커스를 **첫 편집 가능 필드 또는 편집 버튼**으로 옮기는 것은 BUILD에서 검토; 최소한 **닫기**는 기존 `Modal`과 동일.
- `DraftTemplateManageDialog` 포털 **z-index** > 파이프라인 모달 — BUILD에서 스택 확인.
- 카드 진입이 버튼이면 **`aria-haspopup="dialog"`** (선택).

---

## 7. Anti-patterns (하지 말 것)

- 모달 안에 **두 번째** 전체 높이 “카드 스택” 그리드로 세로 공간 낭비.
- **마케팅 오렌지** 또는 **새로운 강조색** 도입.
- draft 탭 본문을 **그대로 복붙**한 긴 서술형 인트로 — 다이얼로그는 **짧고 도구 중심**.

---

## 8. BUILD 검수 체크리스트

- [ ] `VISUAL_LANGUAGE_V2` P2/P4: 앱 셸에서 primary만 상호작용 강조.
- [ ] `DASHBOARD_UX_PRINCIPLES`: 포인터·100–150ms 전환 일치.
- [ ] 한 모달 뷰포트에서 **스크롤 영역이 하나**로 읽히는지 (헤더 제외).

---

## 9. Changelog

- **2026-04-17:** 초안 — PLAN G3.1.2 후 CREATIVE 잠금.
