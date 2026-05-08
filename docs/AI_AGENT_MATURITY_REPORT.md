# AI 에이전트 활용 성숙도 리포트 — Elevate

**기준일**: 2026-05-03  
**범위**: (1) **개발 단계**에서의 Cursor / gstack / 문서 기반 에이전트 활용, (2) **제품** 측면의 AI 피벗·분석·결제 루프, (3) 측정 가능한 벤치마크와 개선안.  
**주의**: “에이전트”가 **인앱 LLM 기능**만을 뜻하지 않음 — 본 리포트는 **소프트웨어 엔지니어링에서의 AI 보조 성숙도**와 **비즈니스 루프 성숙도**를 함께 다룸.

---

## 1. 구조 요약 (현재 상태)

### 1.1 개발 워크플로 (강점)

| 구성요소 | 역할 | 근거 |
|----------|------|------|
| **3 레이어** | A 규칙(AGENTS, hooks) → B memory-bank(SoT) → C gstack(리뷰 스킬) | `docs/AI_ORCHESTRATION.md` |
| **세션 부트스트랩** | 구현·버그·기능 시 `tasks.md` / `activeContext.md` 자동 로드 | `.cursor/rules/ai-session-bootstrap.mdc` |
| **INIT→BUILD** | 복잡도·모드 매핑 | `workflow-modes.mdc`, `auto-workflow.mdc` |
| **검증 단일 명령** | `pnpm verify` = `gstack:check`(비치명) + lint + tsc + unit + build | `package.json` |
| **North Star·로드맵** | `creative-elevate-ai-pivot.md`, `tasks.md` | `memory-bank/` |

→ **의도적으로 설계된 “컨텍스트 엔지니어링”**이 있으며, 팀 확장 시에도 같은 패턴으로 옮기기 쉽다 (`docs/AI_WORKFLOW_PORTABILITY.md`).

### 1.2 제품·비즈니스 루프 (진행 중)

| 영역 | 상태 |
|------|------|
| 콘텐츠 카탈로그·엔타이틀먼트·`product_kind` | 스키마·Library UI 반영 (`009`/`010`) |
| 전자책 퍼널 문서 | `docs/CONTENT_FUNNEL.md` |
| Lemon 웹훅 ↔ 카탈로그 entitlement | **진행·점검** (ADR-004/PLAN-lemon-squeezy-webhook) |
| 자산 전달(Storage·서명 URL) | **백로그** |
| PostHog 퍼널 이벤트 | **최소** (`posthog-events.ts` 이벤트 2종, 퍼널용 이벤트는 문서상 backlog) |

### 1.3 인앱 “AI 에이전트” 제품

- 로드맵 **Phase C** (에이전트 워크스페이스 등)는 **아직 제품화 전**.  
- 현재 점수에서 **별도 차원**으로 분리해 평가함 (아래 루브릭).

---

## 2. 벤치마크 지표 (정의)

업계에서 흔히 쓰는 **DORA / SPACE / 플랫폼 엔지니어링** 아이디어를, **AI 보조 개발**에 맞게 축소해 아래처럼 **운영 가능한 지표**로 정의한다.

### 2.1 개발 프로세스 (AI 보조)

| ID | 지표 | 정의 | 측정 방법 (Elevate) |
|----|------|------|---------------------|
| **P1** | 컨텍스트 단일성 | 로드맵·우선순위가 한 곳에 있는가 | `tasks.md` 존재·갱신 빈도(정성) |
| **P2** | 에이전트 부트스트랩 성공률 | 구현 요청 시 SoT 문서가 규칙에 의해 로드되는가 | `.cursor/rules/ai-session-bootstrap.mdc` 적용 여부 |
| **P3** | 품질 게이트 통과 | PR 전 lint·typecheck·test·build | CI `ci.yml` + 로컬 `pnpm verify` (둘 다 install/검증 흐름 선행 **`pnpm run gstack:check`**, 비치명) |
| **P4** | 회귀 방지 깊이 | 단위 vs E2E 커버리지 | `tests/unit` 파일 수; `test:e2e`·`e2e.yml` (수동 트리거) |
| **P5** | 문서 최신성 | 오케스트레이션·North Star·ADR 정합 | 정기 리뷰(정성) |

### 2.2 제품·성장 (AI 피벗 GTM)

| ID | 지표 | 정의 | 측정 방법 |
|----|------|------|-----------|
| **B1** | 전환 퍼널 가시성 | Awareness→Conversion 이벤트 존재 | PostHog 대시보드·이벤트 스키마 |
| **B2** | 결제→권한 자동화 | 결제 성공 시 entitlement 생성 | DB·웹훅·주문 ID 연동 여부 |
| **B3** | 콘텐츠 전달 | 구매 후 파일 접근 가능 | Storage·signed URL·감사 로그 |
| **B4** | 실험 속도 | 피처 플래그·이벤트 네이밍 일관 | `posthog-integration.mdc` 준수 |

### 2.3 도구 체인

| ID | 지표 | 정의 |
|----|------|------|
| **T1** | gstack 가용성 | `./setup` 후 슬래시 스킬 사용 가능 여부 (Bun 의존) |
| **T2** | CI와 로컬 정합 | `pnpm verify` ≈ CI job (`gstack:check` → lint → typecheck → test → build 동일) |

### 2.4 프로세스 준수 (에이전트 품질)

| ID | 지표 | 정의 | 측정·개선 |
|----|------|------|-----------|
| **PR1** | 페이즈 준수 | [`AGENTS.md`](../AGENTS.md) INIT→ARCHIVE가 L1–L4에 맞게 수행됐는가(생략 시 사용자 **fast path** 명시) | `progress.md` 등에 단계 한 줄 |
| **PR2** | 외부 리뷰 근거 | L3+ 또는 고리스크 변경에 `/review`(gstack) 또는 동등 리뷰 | PR·이슈에 증거 링크 |
| **PR3** | 학습 루프 | REFLECT에서 P1–P5 중 최소 1개 개선 액션 | `tasks.md`·본 문서 갱신 |

gstack **`/retro`**, **`/qa`** 산출물은 PR 항목 **증거**로 쓰고, **`pnpm verify`/CI를 대체하지 않는다** (`docs/AI_ORCHESTRATION.md`).

---

## 3. 현재 분석 — 잘하는 점

1. **오케스트레이션 문서가 한 허브로 모임** — gstack과 memory-bank를 **역할 분리**해 둔 것은 드리프트를 줄이는 좋은 결정이다.  
2. **에이전트 세션 부트스트랩 규칙** — “버그만 던져도” `tasks`/`activeContext`를 읽게 한 것은 **재현 가능한 개발 습관**으로 이어진다.  
3. **CI가 핵심 게이트를 커버** — push/PR에 install 직후 **`gstack:check`**(벤더 gstack 미빌드 시 경고·exit 0), 이어 lint, typecheck, unit test, build (`.github/workflows/ci.yml`).  
4. **제품 방향 문서화** — North Star, CONTENT_FUNNEL, REFLECT 감사 문서가 있어 **에이전트/인간 모두 같은 맥락**을 참조할 수 있다.  
5. **결제·분석 통합 지점이 문서화됨** — Lemon/Polar 웹훅·PostHog 등 **확장 경로가 경로 단위로 잡혀 있다**.

---

## 4. 현재 분석 — 부족한 점

1. **관측(Analytics)이 North Star 대비 얇음** — `PostHogEvent`가 2개뿐이며, `CONTENT_FUNNEL.md`에 적힌 `purchase_completed`, `library_view` 등은 **정의·구현 backlog**.  
2. **상업 루프 일부** — Lemon 웹훅·entitlement 경로는 있으나 **관측·환불·E2E** 등은 여전히 백로그 (`tasks`, `CONTENT_FUNNEL`).  
3. **E2E가 기본 CI에 없음** — `e2e.yml`은 `workflow_dispatch` — **회귀 비용이 사람에게 기대**는 구조.  
4. **인앱 에이전트/워크스페이스** — 비전과 문서는 있으나 **제품 점수 항목에서는 아직 낮음**.  
5. **자동 에이전트 eval 부재** — gstack `/review`·`/qa` 등은 증거로 쓰나, Anthropic식 **격리·회귀 eval 스위트**(수십 과제·주기 실행) 수준은 아직 없음.

---

## 5. 개선 방향 (기술 / 수동 / 연결 서비스)

### 5.1 기술적으로 도입·강화 권장

| 우선순위 | 항목 |
|----------|------|
| P0 | Lemon 주문 처리 ↔ `content_products` / `organization_content_entitlements` 안정화·관측 (B2/B4) |
| P0 | Supabase Storage + signed URL + (선택) 감사 로그 |
| P1 | PostHog 이벤트 스키마 고정: 퍼널 단계별 최소 세트 (`CONTENT_FUNNEL.md` 반영) |
| P1 | Playwright 스모크를 주기 실행 또는 PR 라벨 트리거로 안정화 |
| P2 | `pnpm db:types`를 마이그레이션 적용 프로세스와 묶기 (CI 또는 문서화된 체크) |
| P2 | (Phase C) 에이전트 워크스페이스 POC — 별도 ADR |

### 5.2 수동으로 해야 할 일 (운영·거버넌스)

- Lemon·Polar 대시보드·웹훅 URL·시크릿 로테이션, 상용 계약 전 컴플라이언스 검토.  
- PostHog 프로젝트·대시보드·퍼널 정의, 이벤트 네이밍 합의 (규칙 파일 참조).  
- `memory-bank/activeContext.md` / `tasks.md` 스프린트 갱신.  
- gstack 사용 시 Bun 설치·`./setup` — **선택**이지만 YC식 리뷰 루프를 쓰려면 필요.

### 5.3 연결·통합 서비스 (이미 또는 예정)

| 서비스 | 역할 |
|--------|------|
| **Supabase** | Auth, DB, RLS, (예정) Storage |
| **Vercel** | 배포 |
| **Lemon Squeezy / Polar** | 카탈로그·구독 결제 (운영 경로) |
| **PostHog** | 제품 분석 (확대 필요) |

---

## 6. 점수 (100점 만점)

### 6.1 루브릭 (가중치)

| 영역 | 배점 | 설명 |
|------|------|------|
| 개발 AI 거버넌스·문서 | 25 | 오케스트레이션, SoT, 이식성 |
| 에이전트 자동화·규칙 | 15 | 부트스트랩, INIT, 워크플로 |
| 품질 게이트·CI | 15 | verify, CI 일치, **gstack:check**로 침묵 실패 방지(로그 가시성) |
| 테스트·회귀 | 10 | 단위·통합·E2E 현실 |
| 제품 관측(PostHog·퍼널) | 10 | 이벤트·대시보드 정합 |
| 상업·콘텐츠 루프 | 15 | 결제→권한→전달 |
| 인앱 AI 제품 (워크스페이스 등) | 10 | 로드맵 대비 구현도 |

### 6.2 채점 (전문가 추정)

| 영역 | 배점 | 획득 | 비고 |
|------|------|------|------|
| 거버넌스·문서 | 25 | **22** | 허브·포터빌리티·North Star 우수 |
| 자동화·규칙 | 15 | **13** | 부트스트랩·워크플로 강함 |
| CI·게이트 | 15 | **14** | main/PR CI에 **`gstack:check`** 포함(2026-05 PR #69); Actions 로그에서 vendored gstack 미빌드 시 한 줄 경고 확인 가능; `verify`와 동일 선행 스텝 |
| 테스트 | 10 | **5** | 단위만 verify에 포함, E2E 수동 |
| 관측 | 10 | **4** | 식별·ready 수준, 퍼널 이벤트 미흡 |
| 상업 루프 | 15 | **5** | 스키마·PoC 있으나 자동화·전달 미완 |
| 인앱 AI 제품 | 10 | **2** | Phase C 전, 랜딩·카탈로그 수준 |

**합계: 65 / 100**

- **해석**: **개발자 경험·문서·에이전트 보조 개발**은 상위권에 가깝고, **수익·전달·관측·E2E**가 아래를 끌어 내린 상태. 제품 비전(AI 플랫폼)과 **아직 맞지 않는 부분**이 바로 이 격차다.

### 6.3 개선 후 상한 (현실적 상한)

동일 루브릭에서 아래를 달성하면:

- 퍼널 이벤트 + 대시보드, B4 완료, Storage 전달, E2E 스모크 주기화, Phase C 최소 POC

**예상: 82~88 / 100** (인앱 에이전트가 “완제품”이 되면 90대 후반까지 여지는 있으나, 본 추정은 **12~18개월 로드맵** 가정).

| 구간 | 의미 |
|------|------|
| **65** | 현재 (본 리포트, 기준 2026-05-03) |
| **~85** | 상업 루프 + 관측 + 회귀 테스트가 “팀이 신뢰하는” 수준 |
| **90+** | 인앱 AI 워크스페이스·에코시스템까지 포함한 장기 목표 |

---

## 7. 결론

Elevate는 **AI를 써서 소프트웨어를 만드는 쪽**에서는 이미 **체계적**이다. 반면 **AI를 팔고 측정하는 쪽**(결제·권한·전달·퍼널 분석)은 **카탈로그 결제는 Lemon/Polar로 수렴**했으나 관측·환불·E2E 등 **일부는 여전히 backlog**에 가깝다.  
다음 분기의 점수를 올리는 가장 큰 레버는 **B2/B4(웹훅·퍼널) + PostHog + Storage 전달**이며, 그다음이 **E2E 신뢰도**다.

---

## 8. 관련 문서

| 문서 | 용도 |
|------|------|
| [`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) | 개발 에이전트 레이어 |
| [`CONTENT_FUNNEL.md`](./CONTENT_FUNNEL.md) | 전자책 퍼널 vs 코드 |
| [`memory-bank/tasks.md`](../memory-bank/tasks.md) | 로드맵 SoT |
| [`adr/ADR-004-lemon-squeezy-global-payments.md`](./adr/ADR-004-lemon-squeezy-global-payments.md) | 카탈로그 결제·웹훅 |
| [`adr/ADR-001-toss-payments-poc.md`](./adr/ADR-001-toss-payments-poc.md) | 역사적 Toss PoC (앱 코드 제거됨) |
