# PLAN — 파이프라인 탭에서 입력 소스(링크·파일·메모) 참조

**상태:** BUILD 완료 — [`pipeline-reference-sources-strip.tsx`](../../src/components/dashboard/pipeline-reference-sources-strip.tsx) · 진행률 바 아래 표시  
**관련:** [`STUDIO_ARTIFACT_ROLES.md`](../STUDIO_ARTIFACT_ROLES.md) · `artifact_role: reference_source` · [`reference-source.ts`](../../src/lib/studio-productions/reference-source.ts)

## 문제

에피소드 **소스·레퍼런스** 서브탭에서 넣은 URL·텍스트·메모는 `studio_production_artifacts`에 `reference_source`로 저장된다. **파이프라인**(`episodePanel=pipeline`)에서 TTS·씬·조립 등을 할 때 같은 맥락을 보지 않고 탭을 오가야 한다.

## 현재 데이터 (스키마 변경 없음)

| 필드 | 용도 |
|------|------|
| `artifact_role` | `"reference_source"` |
| `metadata.source_type` | `youtube_url` \| `web_url` \| `text` \| `manual_note` (레퍼런스 패널과 동일) |
| `metadata.source_label` | 사용자 라벨 또는 URL 요약 |
| `content_text` | 본문·전사·붙여넣기 텍스트 (미리보기에 사용) |
| `external_url` | (향후 파일·에셋 업로드 시) 스토리지 URL 등 |
| `sort_order` / `created_at` | 목록 정렬 (`listStudioArtifactsForEpisode` 순서와 정합) |

에피소드 페이지는 이미 `artifacts` 전체를 `ProductionEpisodePipeline`에 넘긴다. **추가 fetch는 불필요**하다.

## INIT에서 한 일 (준비)

- [`pipeline-reference-context.ts`](../../src/lib/studio-productions/pipeline-reference-context.ts): `reference_source`만 골라 파이프라인용 **정규화 뷰** (`PipelineReferenceSourceItem`)로 변환하는 순수 함수.
- 단위 테스트로 메타·빈 목록·정렬 가정 고정.

## 다음 BUILD 후보 (PLAN 확정 시 체크)

1. **UI — 읽기 전용 스트립**  
   파이프라인 상단(또는 1단계 카드 위)에 「입력 소스」접기/펼치기: 라벨·종류·짧은 미리보기·`external_url`이면 링크.  
   빈 경우: `Dashboard.productions` 한 줄 + `episodePanel=references` 딥링크.

2. **접근성**  
   목록은 `role="list"` / 링크는 `rel="noopener noreferrer"` / 긴 텍스트는 `line-clamp` + 전체는 아티팩트 탭 또는 툴팁(선택).

3. **비목표 (1차)**  
   파이프라인에서 소스 **편집**·삭제(소스 탭 SoT 유지). 파이프라인에서 LLM 프롬프트에 **자동 주입**은 별 스프린트(프롬프트 설계 필요).

4. **파일 업로드**  
   현재 레퍼런스 액션은 텍스트/URL 중심. Storage 기반 파일이 늘면 `PipelineReferenceSourceItem`의 `href`/`preview` 규칙만 확장하면 된다.

## 수용 기준 (BUILD 완료 시)

- [x] 파이프라인 탭에서 `reference_source` ≥ 1이면 사용자가 **제목 없이도** 무엇이 재료인지 식별 가능.  
- [x] 소스 0개일 때 **소스 탭으로 유도**하는 카피·링크가 있다.  
- [x] 기존 레퍼런스 패널과 **같은 메타 키**를 사용한다 (단일 SoT).
