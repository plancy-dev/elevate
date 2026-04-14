# Studio provider API — capability vs implementation (SoT)

**목적:** INIT·릴리스·기획 전에 **외부 API에 실제로 무엇이 있는지**와 **Elevate에 무엇이 붙었는지**를 한 표로 맞춘다.  
**원칙:** 사용자 카피에서는 **(A) 벤더가 API를 제공하지 않음**과 **(B) API는 있으나 우리가 아직 앱에 연결하지 않음**을 구분한다. (B)는 “불가”가 아니라 **미출시 / 로드맵**으로 표현한다.

**관련:** [`PLAN-studio-provider-integrations.md`](./PLAN-studio-provider-integrations.md) · [`ADR-006`](../adr/ADR-006-studio-provider-integrations-v2.md) · [`PLAN-studio-ai-content-os.md`](./PLAN-studio-ai-content-os.md) · 코드 `src/lib/studio-integrations/`

## 유지 방법 (가벼운 프로세스)

| 시점 | 할 일 |
|------|--------|
| **INIT** (새 스프린트·큰 기능) | 이 문서 표를 읽고, 바뀐 행만 업데이트 |
| **벤더 API 메이저 변경** | 공식 changelog / `docs.dev.*` 확인 후 “API capability” 열 수정 |
| **새 어댑터 머지** | “Implemented in Elevate”를 ✅로 바꾸고 링크(파일 경로) 추가 |

## 요약 표

| Provider | API 쪽 (요약) | Elevate 구현 | 사용자에게 |
|----------|----------------|--------------|------------|
| **OpenAI** | Chat Completions 등 — BYO key | 에피소드 초안 생성·다듬기 (`episode-llm`) | 키 연결 시 사용 가능 |
| **Anthropic** | Messages API — BYO key | 동일 | 키 연결 시 사용 가능 |
| **Runway** | Dev API: 조직·태스크 등 ([공식 문서](https://docs.dev.runwayml.com/)) | 키 검증 + **`@runwayml/sdk`** `textToVideo` (gen4.5) → `waitForTaskOutput`; [`runway-adapter`](../../src/lib/studio-integrations/providers/runway/runway-adapter.ts) `runStep`; 에피소드 패널 [`submitRunwayRenderJob`](../../src/actions/studio-episode-llm.ts) | `STUDIO_INTEGRATIONS_ENABLED` + 암호화 + 조직 Runway 키일 때 에피소드에서 **텍스트→비디오** 시작 가능; 결과는 `render_output` 아티팩트 |
| **YouTube Data API** | 업로드·메타 등 (OAuth 정책 별도) | 미구현 / 스텁 수준 | 미연결 |
| **기타** (Kling, Gemini OAuth, …) | 각 벤더 정책 상이 | 없음 | 문서·아티팩트로 수동 기록 (v1 정합) |

## Runway (상세)

| 항목 | 상태 | 코드·비고 |
|------|------|-----------|
| API 키 형식 검증 / 조직 조회 | ✅ 서버에서 사용 | [`src/lib/studio-integrations/runway-verify.ts`](../../src/lib/studio-integrations/runway-verify.ts), `X-Runway-Version` 필수 |
| 어댑터 `healthCheck` | ✅ | [`runway-adapter.ts`](../../src/lib/studio-integrations/providers/runway/runway-adapter.ts) |
| 어댑터 `runStep` (잡 제출·폴링) | ✅ 텍스트→비디오 (gen4.5) | SDK 폴링 내장; 타임아웃 기본 120s — [`runway-text-to-video.ts`](../../src/lib/studio-integrations/providers/runway/runway-text-to-video.ts) |
| UI “Runway · text-to-video” | 에피소드 초안 패널 | [`submitRunwayRenderJob`](../../src/actions/studio-episode-llm.ts); 미구성 시 통합 페이지 안내 |

**추가 확장 (선택):** 이미지→비디오, 폴링 분리(장시간 잡), 멱등 키 — [`PLAN-runway-integration.md`](./PLAN-runway-integration.md).

## 에피소드 초안 (LLM)

| 항목 | 상태 | 비고 |
|------|------|------|
| 훅·제목·대본 JSON 생성 | ✅ | `buildDraftPrompt` + org 키 |
| 짧은 입력 → 풍부한 초안 | 🔄 리팩터 대상 | 니치/포맷/채널 메타·few-shot·섹션 템플릿 강화 — [`episode-llm.ts`](../../src/lib/studio-productions/episode-llm.ts) |

**다음 BUILD (합의):** “최소 입력”만으로도 채널에 맞는 **구조적 초안**(비트·길이·금지어·CTA 슬롯 등)이 나오도록 프롬프트·스키마·옵션 필드 설계.

## 사용자 카피 가이드

- **금지:** “Runway는 API가 없어서 안 된다” (사실과 다를 수 있음)
- **권장:** 키·플래그가 없을 때는 **통합 설정** 안내 + 수동 런북 ([`RUNWAY_SHORTS_RUNBOOK.md`](../RUNWAY_SHORTS_RUNBOOK.md)) 유지.

i18n: Runway 관련 오류는 `studioRunwayPromptRequired` 등 구체 코드를 사용; `studioRunwayManualOnly`는 레거시 문구로 남길 수 있음.
