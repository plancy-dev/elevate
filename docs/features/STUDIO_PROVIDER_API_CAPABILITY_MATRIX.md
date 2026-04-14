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
| **Runway** | Dev API: 조직·태스크 등 ([공식 문서](https://docs.dev.runwayml.com/)) | 키 **검증**(`verifyRunwayApiKey` → `GET /v1/organization`), `runStep`은 **스텁** (`not_implemented`) | 앱에서 렌더 **잡을 시작하는 UI는 미연결** — 수동 내보내기 또는 추후 연동 |
| **YouTube Data API** | 업로드·메타 등 (OAuth 정책 별도) | 미구현 / 스텁 수준 | 미연결 |
| **기타** (Kling, Gemini OAuth, …) | 각 벤더 정책 상이 | 없음 | 문서·아티팩트로 수동 기록 (v1 정합) |

## Runway (상세)

| 항목 | 상태 | 코드·비고 |
|------|------|-----------|
| API 키 형식 검증 / 조직 조회 | ✅ 서버에서 사용 | [`src/lib/studio-integrations/runway-verify.ts`](../../src/lib/studio-integrations/runway-verify.ts), `X-Runway-Version` 필수 |
| 어댑터 `healthCheck` | ✅ | [`runway-adapter.ts`](../../src/lib/studio-integrations/providers/runway/runway-adapter.ts) |
| 어댑터 `runStep` (잡 제출·폴링) | ❌ 스텁 | `PLAN-studio-provider-integrations` **Phase 3** — 제출·폴링·아티팩트 반영 |
| UI “Runway로 렌더” | 버튼 → 스텁 액션 | [`triggerRunwayRenderStub`](../../src/actions/studio-episode-llm.ts) → `studioRunwayManualOnly` |

**다음 BUILD (합의):** [`PLAN-runway-integration.md`](./PLAN-runway-integration.md) — 엔드포인트·내부 페이로드·UI 상태머신·아티팩트·BUILD 체크리스트. 구현 시 공식 문서/SDK 최신 기준으로 필드 확정, 잡 ID·결과 URL은 아티팩트/`metadata`에 저장, 멱등·감사는 ADR-006과 정렬.

## 에피소드 초안 (LLM)

| 항목 | 상태 | 비고 |
|------|------|------|
| 훅·제목·대본 JSON 생성 | ✅ | `buildDraftPrompt` + org 키 |
| 짧은 입력 → 풍부한 초안 | 🔄 리팩터 대상 | 니치/포맷/채널 메타·few-shot·섹션 템플릿 강화 — [`episode-llm.ts`](../../src/lib/studio-productions/episode-llm.ts) |

**다음 BUILD (합의):** “최소 입력”만으로도 채널에 맞는 **구조적 초안**(비트·길이·금지어·CTA 슬롯 등)이 나오도록 프롬프트·스키마·옵션 필드 설계.

## 사용자 카피 가이드

- **금지:** “Runway는 API가 없어서 안 된다” (사실과 다를 수 있음)
- **권장:** “Elevate 앱에서 Runway 렌더를 **아직 시작하지 않는다** / **다음 릴리스에서 연결**” + 수동 런북 링크 ([`RUNWAY_SHORTS_RUNBOOK.md`](../RUNWAY_SHORTS_RUNBOOK.md))

i18n 키 `Dashboard.actionErrors.studioRunwayManualOnly`는 이 가이드에 맞게 주기적으로 다듬는다.
