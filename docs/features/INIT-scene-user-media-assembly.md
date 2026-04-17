# INIT: 씬 단계 — 사용자 영상 업로드 + TTS/자막 정렬 (운영 수준 준비)

**상태:** INIT 완료 (2026-04-17) — **구현 아님** · 다음: **PLAN → (필요 시) ADR 초안 → CREATIVE → BUILD**  
**복잡도:** **L4** (스토리지·조립 파이프라인·UI·멀티씬 동기화)  
**관련:** [`PLAN-studio-content-factory.md`](./PLAN-studio-content-factory.md) · [`ADR-007`](../adr/ADR-007-youtube-content-factory.md) · [`src/lib/studio-productions/video-assembly.ts`](../../src/lib/studio-productions/video-assembly.ts) · [`STUDIO_ARTIFACT_ROLES.md`](../STUDIO_ARTIFACT_ROLES.md)

---

## 1. 제품 한 줄

**파이프라인 6단계 카피를 “씬 렌더 (Runway)” 중심에서 “씬”으로 바꾸고**, 각 씬에 대해 **Runway 생성 클립 대신(또는 병행)** 사용자가 **임의 영상 파일**을 올리면, **에피소드 TTS·전체 자막(SRT/VTT)**을 **씬 길이·월드 타임라인**에 맞게 잘라 **최종 조립 영상**에 맞춘다.

- 영상이 씬보다 짧으면 **루프**(운영 1차는 FFmpeg `loop` / 타일).  
- 길면 **0초부터 씬 길이만큼 자동 트림**(고급: 사용자 지정 `trim_start_sec`).  
- 자막은 **씬 구간 큐만 슬라이스 + 로컬 타임 리셋** 후 해당 씬에 번인(또는 소프트 트랙 — 1차는 기존 burn-in 패턴 유지).

---

## 2. 왜 L4인가

| 축 | 이유 |
|----|------|
| **데이터** | 씬별 소스 선택(`runway` \| `upload`)·Storage 경로·메타(JSON)·기존 `scene_clip` 아티팩트와의 관계 정의 필요 |
| **조립** | 현재 `assembleVideo`는 **클립 concat + 단일 TTS + 단일 SRT** — **씬별 트랙 슬라이스·전처리** 또는 **그래프 확장** 필요 |
| **비용** | 추가 SaaS 없이 **기존 FFmpeg 워커**·스토리지 이그레스만 증가 — 설계로 상한 통제 |
| **UX** | 업로드·검증·진행률·실패 복구 — 운영 품질(용량 제한·포맷·타임아웃) 명시 필요 |

---

## 3. 현재 구현 앵커 (반드시 읽을 파일)

| 레이어 | 파일 | 메모 |
|--------|------|------|
| UI 스텝 카드 | [`scene-render-pipeline-step.tsx`](../../src/components/dashboard/scene-render-pipeline-step.tsx) | 제목 `draftSceneRenderCta` · Runway 실행·씬 플랜 모달 |
| 파이프라인 조립 | [`production-episode-pipeline.tsx`](../../src/components/dashboard/production-episode-pipeline.tsx) | `SceneRenderPipelineStep` props |
| 조립 액션 | [`studio-video-assembly.ts`](../../src/actions/studio-video-assembly.ts) | 클립 URL 수집·TTS·SRT·배경음 |
| FFmpeg | [`video-assembly.ts`](../../src/lib/studio-productions/video-assembly.ts) | `concat` · 단일 오디오 · 단일 SRT burn-in |
| 워커 | [`process-video-assembly-job.ts`](../../src/lib/studio-productions/process-video-assembly-job.ts) · [`workers/video-assembly/run.ts`](../../workers/video-assembly/run.ts) | 잡 입력 JSON |
| 씬 메타 | [`scene-rows-json`](../../src/lib/studio-productions/scene-rows-json.ts) · `pipeline_prefs.sceneRender` | 씬별 duration·인덱스 |

---

## 4. 제품 결정 (PLAN에서 확정할 항목)

1. **소스 모드:** 씬마다 **(A)** Runway만 **(B)** 업로드만 **(C)** 혼합(씬별 선택). INIT 권장: **C** — 기존 사용자·런웨이 비용 민감 사용자 모두 수용.  
2. **오디오 정책:** 업로드 영상의 **원음 끄고 TTS만** vs **덕킹** — 1차는 **TTS 우선 + 비디오 무음 또는 고정 믹스 규칙**으로 단순화 권장.  
3. **자막:** 전체 SRT를 서버에서 **씬 경계(월드 초 단위)**로 자른 뒤 **씬 로컬 SRT** 생성 — 클라이언트는 미리보기용으로 동일 알고리즘 재사용 가능.  
4. **저장 위치:** `studio_production_artifacts`에 `artifact_role: scene_clip` 유지 vs **`scene_source_upload`** 등 역할 분리 — [`STUDIO_ARTIFACT_ROLES.md`](../STUDIO_ARTIFACT_ROLES.md) 갱신 + 마이그레이션 여부.  
5. **용량·포맷:** MP4/MOV 상한·길이 상한·조직별 쿼터 — **PLAN에 숫자**로 박기 (예: 500MB/씬, 10분 cap — 실제는 인프라에 맞춰 조정).

---

## 5. 기술 방향 (운영 가능·비용 통제)

| 주제 | 방향 |
|------|------|
| **업로드** | Supabase Storage(기존 패턴) + 서명 URL 또는 서버 업로드 액션 · **바이러스 스캔은 비목표**(정책 문서에 “신뢰 경계” 명시) |
| **씬 전처리** | **선처리(권장):** 씬마다 “정규화 클립”(해상도·fps·길이 D) 생성 후 **기존 concat** 경로 재사용 — 디버깅·재시도 쉬움. |
| **자막** | 순수 TS/서버 유틸: SRT 파스 → 월드 타임 구간 필터 → 타임 오프셋 — **외부 API 비용 0** |
| **FFmpeg** | 워커 CPU·시간 상한 기존 잡과 동일 패턴; 긴 영상은 **사전 프로브**로 거절 |
| **Runway** | 기존 경로 유지; 플래그/씬 메타로 “이 씬은 스킵” |

---

## 6. 카피·i18n (1차 BUILD 전 PLAN에서 확정)

| 키 | 현재 (예) | 목표 방향 |
|----|-----------|-----------|
| `draftSceneRenderCta` | `씬 렌더 (Runway)` / `Render scenes (Runway)` | **짧게 “씬”** — 부제에 도구는 고급/툴팁 |
| `pipelineSceneSceneListHeading` 등 | “씬 렌더 …” | **중립적** (“씬 진행” 등) |
| `studioAssemblyNoClips` | “먼저 씬 렌더…” | **업로드/생성 중 하나라도** 있으면 조립 가능하도록 문구 정합 |

---

## 7. 산출물 체크리스트 (다음 모드)

| 단계 | 산출물 |
|------|--------|
| **PLAN** | ERD 스케치(아티팩트·메타)·업로드 API·조립 잡 입력 JSON 스키마 v2·실패/재시도·i18n 목록 |
| **CREATIVE** | 씬 카드 UI: 소스 토글·업로드 존·(선택) 트림 UI 와이어 · Storage 경로 명명 규칙 |
| **BUILD** | 마이그레이션(필요 시)·액션·UI·`assembleVideo` 확장 또는 전처리 단계·`pnpm verify` |
| **ADR** | `ADR-008` 후보: “씬 소스 이원화(Runway vs upload)” — Runway 비용·ToS·저작권 고지 |

---

## 8. 비목표 (INIT)

- 자동 **립싱크**·**얼굴 교체**  
- **실시간** 프리뷰 편집 타임라인 (Premiere 급)  
- **외부 트랜스코딩 SaaS** (비용·거버넌스) — 필요 시 후속 ADR

---

## 9. 성공 기준 (BUILD 완료 시)

1. 한 에피소드에서 **씬별로** Runway 클립 **또는** 업로드 파일이 섞여도 **조립 성공**.  
2. TTS+자막이 **씬 경계**에 맞게 들어맞고, 최종 MP4에서 **음성·자막 싱크**가 사용자 검수 가능 수준.  
3. 실패 시 **어느 씬에서 실패했는지** 잡 로그·토스트로 추적 가능.  
4. **추가 구독 Saa스 없음**(스토리지·워커 CPU만).

---

## 10. 다음 액션

1. **PLAN 모드**에서 §4·§5 숫자·정책 확정.  
2. **GitHub 이슈** 1건 권장: `feat(studio): scene user upload + per-scene assembly` — 본 INIT 링크.  
3. **BUILD**는 한 번에 전부가 아니라 **스토리지+메타 → 전처리 클립 → 조립** 순으로 스플릿 PR 가능.
