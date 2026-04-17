# INIT — 프로젝트별 배포 채널(1:N) + 씬 렌더 고도화

날짜: 2026-04-17  
목적: 요구사항을 **데이터 모델·권한·UX**와 맞추고, 씬 렌더 개선 작업의 **범위·의존성·단계**를 고정한다.

---

## 1. 현재 구조 (as-is)

| 영역 | 스키마 / 동작 |
|------|----------------|
| **도구 연동** | `studio_org_provider_connections` — **조직(organization)** 단위, API 키 암호화 저장 |
| **배포 채널 URL** | `studio_distribution_channels` — **`organization_id`만** 있음 (`project_id` 없음) |
| **에피소드** | `studio_production_episodes.studio_distribution_channel_id` → 위 채널 |
| **프로젝트** | `studio_projects` + `studio_production_episodes.project_id` (nullable) |
| **YouTube OAuth** | `studio_youtube_channel_tokens` — **조직 + YouTube `channel_id`** 유니크. 업로드는 이 토큰 사용 |

ADR·마이그레이션 상 배포 채널은 처음부터 **“per-org 링크 모음”**으로 설계됨 (`023`, `ADR-003`).

### UX 이슈 (사용자 체감)

- 배포 채널 모달이 **조직 전체**를 대상으로 보이므로 “프로젝트(브랜드)별로 나누고 싶다”는 기대와 어긋남.
- YouTube OAuth 블록이 같은 모달에 있어 **‘채널 URL 저장’**과 **‘업로드 권한’**이 한 덩어리로 느껴짐.

---

## 2. 목표 구조 (to-be) — 제안

### 2.1 원칙

1. **도구 연동**: 그대로 **조직 공통** (Runway, OpenAI, YouTube Data API 키 등).
2. **배포 채널**: **프로젝트 단위 1:N** — 프로젝트마다 여러 개의 “게시 목적지”(라벨 + URL + 플랫폼 + 메모 등).
3. **YouTube 업로드(OAuth)**: Google 계정·토큰은 본질적으로 **조직(또는 연결 주체)** 에 귀속. 권장 패턴:
   - **토큰 저장은 조직 단위 유지** (`studio_youtube_channel_tokens`).
   - 프로젝트의 각 배포 채널 행이 **“업로드에 쓸 연결”**을 선택할 때, 조직에 이미 연결된 YouTube 채널 중 하나를 **참조**(또는 “이 URL과 같은 채널”로 매핑)하는 방식이 마이그레이션·권한 모델이 가장 단순함.
   - 대안: 프로젝트마다 OAuth를 다시 받는 방식은 UX·보안 절차 부담이 큼(필요 시 후속 옵션으로만).

### 2.2 데이터 모델 방향 (초안)

**옵션 A — 컬럼 추가 (마이그레이션 단순)**  
- `studio_distribution_channels`에 `project_id uuid NOT NULL REFERENCES studio_projects(id)` 추가(점진적이면 먼저 nullable → 백필 → NOT NULL).
- 기존 org-only 행: `project_id`를 **기본 프로젝트** 또는 **“미지정”용 더미 프로젝트**로 백필하는 정책 필요.

**옵션 B — 새 테이블**  
- `studio_project_distribution_channels` (project_id + label + url + …)  
- 기존 테이블은 deprecated 후 이전.

**에피소드 정합성**  
- `studio_distribution_channel_id`가 가리키는 채널의 `project_id`가 **`episode.project_id`와 일치**하도록 DB 트리거 또는 앱 검증.

**인덱스·RLS**  
- `project_id` 기준 인덱스, RLS는 `organization_id` 경로 유지(프로젝트가 org에 속하므로 join 또는 denormalized `organization_id` 유지).

### 2.3 UX/UI 방향

| 화면 | 변경 |
|------|------|
| 제작 허브 | “배포 채널”은 **프로젝트 컨텍스트가 있을 때** 해당 프로젝트의 채널만 편집하거나, 모달 상단에 **프로젝트 선택**을 명시 |
| 프로젝트 다이얼로그 / 프로젝트 상세 | (선택) 배포 채널을 프로젝트 설정 안으로 **이동**해 mental model 일치 |
| YouTube OAuth | **연결됨**: 컴팩트 한 줄(채널명 + 재연결). **미연결 + 서버 설정됨**: 연결 CTA. **서버 미설정**: 짧은 안내만. “연결된 경우에만” 긴 설명 블록을 노출해 **시각적 구분** |
| 도구 연동 | YouTube **Data API 키**만; 업로드 OAuth 안내는 “프로젝트 → 배포 채널”로 링크 |

이 INIT에서는 **스키마 확정 전**이므로 구현은 다음 PLAN 단계에서 선택.

---

## 3. 씬 렌더 고도화 — INIT (현재 코드 기준)

### 3.1 현재 파이프라인

- **엔트리**: `src/actions/studio-scene-render.ts` — `renderEpisodeScenes`.
- **분할**: `scene-splitter.ts` — 휴리스틱 `splitScriptToScenes`, LLM JSON `parseLlmScenes`, TTS 기반 `buildScenesFromTtsTimings` (`scenes-from-tts.ts`).
- **렌더**: `runRunwayTextToVideo` — **씬을 `for` 루프로 순차** 호출 (레이트 리밋 회피 주석).
- **UI**: `production-episode-pipeline.tsx` — `target_scene_count` 셀렉트 + `scenes_json` 텍스트 영역.

### 3.2 고도화 후보 (우선순위 초안)

| # | 항목 | 설명 |
|---|------|------|
| P0 | **부분 병렬 + 동시성 제한** | 순차는 안정적이나 느림. `p-limit` 등으로 2~3 동시 + Runway 쿼터 대응 |
| P0 | **씬별 진행 상태** | 아티팩트를 씬마다 즉시 커밋하므로 UI에서 “N/M 완료” 표시 가능 — 폴링·실시간과 연계 |
| P1 | **실패 시 재시도** | 지수 백오프, 특정 씬만 재실행 액션 (`target_scene_indices`) |
| P1 | **프롬프트 일관성** | `buildVisualPromptFromNarration`을 프로젝트 `brand_guide`·포맷·톤과 연동 |
| P1 | **JSON 편집기 검증** | 스키마(zod) + 에피소드 저장 전 프리뷰(씬 개수·총 길이) |
| P2 | **LLM 씬 플래너** | 스크립트만 넣고 `scenes[]` 초안 생성(별도 액션), 이후 수동 수정 |
| P2 | **비용·길이 예산** | 총 초 예산 대비 씬 `duration_seconds` 합 검증 |

### 3.3 의존성 / 비기능

- Runway API: 레이트 리밋·`gen4.5` 파라미터 문서 재확인.
- 서버 액션 타임아웃: 씬 수↑ 시 **비동기 잡(큐)** 검토 — 영상 조립(`studio_video_assembly_jobs`) 패턴 재사용 여부.
- 감사: 기존 `AuditAction.STUDIO_SCENE_RENDER` 유지·확장.

### 3.4 산출물 (다음 단계 PLAN에서)

1. **PRD 스코프** — P0만 vs P0+P1.
2. **마이그레이션/액션 시그니처** 변경 목록.
3. **UI 와이어** — 씬 그리드, 재시도, 진행률.

---

## 4. 다음 액션

1. **프로젝트 배포 채널**: 옵션 A/B 결정 + 백필 정책(기존 org 채널 → 어느 project로).
2. **YouTube OAuth UI**: “연결됨 / 미연결 / 서버미설정” 3상태 와이어 확정 후 구현.
3. **씬 렌더**: P0 설계서(병렬도, 에러 처리) 작성 후 `IMPLEMENT` 착수.

이 문서는 **INIT 종료 시점의 합의안 초안**이며, ADR이 필요하면 `docs/adr/ADR-00x-*.md`로 승격한다.
