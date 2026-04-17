# Phase S (Content Factory) vs Phase T — 문서·체크리스트 정합 (SoT)

**목적:** `memory-bank/tasks.md`에 남아 있던 **Phase S 세부 `[ ]` 항목**을 레포 실제 구현과 맞춘다.  
**갱신:** 2026-04-17 — 코드·마이그레이션 기준 감사.

---

## Phase T (멀티채널 팩토리 확장)

| Phase | 상태 | 근거 |
|-------|------|------|
| **T1** Project/Brand | ✅ | `033_studio_projects.sql`, `buildDraftPrompt` brand RAG 등 |
| **T2** 레퍼런스 소스 파이프라인 | ✅ | YouTube STT·LLM 리믹스 모드 등 (`src/lib/studio-productions/` 주변) |
| **T3** FFmpeg 프리셋 | ✅ | `src/lib/studio-productions/video-assembly.ts` 등 |
| **T4** 콘텐츠 팩토리 프리셋 | ✅ | 프리셋 정의·파이프라인 UI |
| **T5** 옴니채널·크로스 분석·AI 추천 | 백로그 | `memory-bank/activeContext.md`와 동일 |

---

## Phase S (YouTube 콘텐츠 팩토리) — `tasks.md` 항목 대응

아래는 **이 저장소에 코드·스키마가 존재함**을 확인한 매핑이다. 제품별로 “스텁 vs 실연동”은 [`STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](./STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md)와 UI 카피를 우선한다.

| 구간 | `tasks.md` 원문 요약 | 구현 앵커 (예시) |
|------|----------------------|-------------------|
| **S1** TTS + 자막 | ElevenLabs·Whisper | 마이그레이션 `030_studio_provider_elevenlabs.sql`, `src/lib/studio-integrations/providers/elevenlabs/`, `elevenlabs-verify.ts` |
| **S2** 씬 + Runway | 씬 분할·병렬 잡 | `runway-text-to-video.ts`, `runway-adapter.ts` `runStep`, 씬 관련 `src/lib/studio-productions/`·에피소드 파이프라인 |
| **S3** FFmpeg 조립 | 클립+오디오+자막 | `034`/`035` `studio_video_assembly_jobs`, `video-assembly.ts`, `workers/video-assembly/`, `studio-video-assembly.ts` 액션 |
| **S4** YouTube | OAuth·업로드 | `031_studio_youtube_channel_tokens`, `youtube-oauth.ts`, `youtube-upload.ts`, `studio-youtube.ts` |
| **S5** 분석·성과 | Analytics·성과 테이블 | `032_studio_episode_performance`, `src/actions/studio-analytics.ts` 등 |

### 남는 갭 (별도 이슈로 쪼개기)

- **제품/운영:** 특정 화경에서 FFmpeg **워커 배포**(Fly 등)·API 키·쿼터는 운영 체크리스트로 추적.
- **문서:** 벤더 가격·ToS 변경 시 `runway-scene-credits-estimate.ts` 등 **추정 상수**는 제품·법무 합의 후 갱신 (`tasks.md` 기존 메모와 동일).
- **S5 심화:** 프롬프트 A/B와 성과의 **완전 자동 연결**은 우선순위에 따라 추가 스코프.

---

## `tasks.md` 유지 방법

- Phase S **긴 체크리스트**는 본 문서를 **SoT**로 두고, `tasks.md`에는 **요약 표 + 본 파일 링크**만 둔다.
- 새 슬라이스는 **GitHub 이슈** + `Closes #N`으로 추적 ([`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md)).
