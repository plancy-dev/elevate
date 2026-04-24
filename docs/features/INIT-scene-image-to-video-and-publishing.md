# INIT: 씬 이미지 생성 → Runway I2V → 웹 편집 → Buffer 예약 발행 (AI 콘텐츠 자동화 스튜디오 v3)

**상태:** INIT 준비 (2026-04-23) — **구현 아님** · 다음: **PLAN (3개 슬라이스로 분할) → (필요 시) ADR 초안 → CREATIVE → BUILD**
**복잡도:** **L4** (신규 provider × 3계열 + 신규 데이터 모델 + 신규 UI 서피스 2개 + 기존 파이프라인 확장)
**관련 기존 SoT:**
- [`ADR-003-studio-productions-mvp.md`](../adr/ADR-003-studio-productions-mvp.md) — 에피소드·아티팩트 원장
- [`ADR-006-studio-provider-integrations-v2.md`](../adr/ADR-006-studio-provider-integrations-v2.md) — 조직 자격 증명 v2
- [`ADR-007-youtube-content-factory.md`](../adr/ADR-007-youtube-content-factory.md) — TTS→씬→조립→업로드
- [`PLAN-studio-ai-content-os.md`](./PLAN-studio-ai-content-os.md) — “AI 콘텐츠 OS” 범위
- [`INIT-scene-user-media-assembly.md`](./INIT-scene-user-media-assembly.md) — 씬 사용자 업로드 (현행)
- [`STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](./STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md) — provider 가능/구현 매트릭스

---

## 1. 제품 한 줄 (사용자 체감)

> **“키만 넣어두면, 스크립트부터 예약 발행까지 딸깍딸깍.”**
> 사용자는 LLM·이미지·영상·TTS·발행 API **키를 각자 넣어두고**, 스튜디오는 **각 태스크에 맞게 프롬프트를 최적화**해 전달하고 결과를 **원장(Productions)**과 **편집기**에서 바로 다룬다.
> 이번 확장의 **금본위 원칙**: **“씬의 시작(First Frame)·끝(Last Frame) 이미지를 고정하면 AI 영상 결과의 구조적 일관성이 급증한다.”**

---

## 2. 세 가지 새 능력 (기존 무엇을 확장/재활용하는지)

| # | 이번 능력 | 기존에 있는 것 (재활용) | 새로 만들어야 하는 것 |
|---|----------|-------------------------|-----------------------|
| **F1** | **씬 키프레임 이미지 생성 + First/Last Frame 지정** | `studio_production_artifacts` 원장, `scene_index`/metadata 패턴, OpenAI Images(썸네일 전용 DALL·E 3) 경로, 조직 자격 증명 테이블 (`024`), 씬 플래너·씬 예산, `scene_visual_brand` | ① 이미지 **provider 추상화** (Gemini/Nano Banana 2, FLUX, Seedream, OpenAI Images 재사용) · ② 새 아티팩트 역할 `scene_keyframe_first` / `scene_keyframe_last` / `scene_keyframe_candidate` · ③ **씬 이미지 갤러리 UI** (씬별 N장 생성→선택→First/Last 지정) · ④ Runway **image-to-video 프롬프트** 자동 생성 (기존 text-to-video 프롬프트 로직 확장) · ⑤ (선택) Runway **image-to-video 어댑터** — 첫 프레임 + (지원 시) 마지막 프레임 파라미터 |
| **F2** | **웹 타임라인 편집기 + 서버 렌더링 확장** | `assembleVideo` (FFmpeg concat + TTS + SRT burn-in), `studio_video_assembly_jobs` (034/035), 워커 (`workers/video-assembly`), 영상 편집 프리셋(필터 시스템 — 제목 오버레이·자막 스타일·워터마크), scene timeline 유틸 | ① **타임라인 편집 state 모델** (씬 트림·순서·트랜지션·텍스트 오버레이·BGM) · ② **프리뷰 UI** (9:16, 스크럽) · ③ 편집 state → FFmpeg **그래프 확장** (xfade, drawtext, amix) · ④ **잡 입력 v2** (편집 DSL) · ⑤ 텍스트 스타일 **프리셋 저장**(조직 스코프) |
| **F3** | **Buffer 예약 발행 + 플랫폼별 캡션 자동 생성** | YouTube OAuth + 업로드 경로, `studio_youtube_channel_tokens` (031), `studio_distribution_channels`, `packaging_draft` LLM 경로, 조직 자격 증명 v2 | ① **Buffer 공급자 추가** (`studio_org_provider_connections` `provider = 'buffer'`) + 채널 ID 저장 · ② `generateCaptionsForPlatforms` (Instagram/TikTok/YouTube, LLM, 기존 `packaging_draft` 재활용) · ③ **예약 발행 액션** (3채널 동시, 재시도 3회, 멱등 키) · ④ **PublishScheduler UI** (캡션 편집 + DateTimePicker + 플랫폼 토글) · ⑤ 새 테이블 `studio_scheduled_posts` (플랫폼·Buffer ID·상태) |

> **설계 원칙:** 각 provider는 **서버 전용 어댑터**로 감싼다. 키는 조직별 `studio_org_provider_connections`에 암호화 저장. UI는 **프롬프트 스튜디오의 발전형**으로서 각 태스크에 가장 적절한 **프롬프트 템플릿**을 자동 적용(+ 사용자가 편집/저장 가능).

---

## 3. 현재 코드 앵커 (반드시 읽을 파일)

### 원장·스키마
- [`supabase/migrations/017_studio_productions.sql`](../../supabase/migrations/017_studio_productions.sql) — episodes + artifacts + RLS
- [`supabase/migrations/024_studio_org_provider_connections.sql`](../../supabase/migrations/024_studio_org_provider_connections.sql) — 조직 자격 증명
- [`supabase/migrations/025_studio_org_provider_anthropic.sql`](../../supabase/migrations/025_studio_org_provider_anthropic.sql) — provider CHECK 확장 예시
- [`supabase/migrations/033_studio_projects.sql`](../../supabase/migrations/033_studio_projects.sql) — 프로젝트(브랜드) 계층
- [`supabase/migrations/034_studio_video_assembly_jobs.sql`](../../supabase/migrations/034_studio_video_assembly_jobs.sql)·[`035`](../../supabase/migrations/035_studio_video_assembly_jobs_realtime.sql) — 조립 잡
- [`supabase/migrations/031_studio_youtube_channel_tokens.sql`](../../supabase/migrations/031_studio_youtube_channel_tokens.sql) — OAuth 토큰 패턴(Buffer OAuth 참고용)

### Provider 어댑터
- [`src/lib/studio-integrations/types.ts`](../../src/lib/studio-integrations/types.ts) — **신규 provider ID 추가 지점** (현재: openai, anthropic, runway, youtube_data, google_gemini, elevenlabs → **추가:** `gemini_imagen` · `flux` · `seedream` · `buffer`)
- [`src/lib/studio-integrations/providers/runway/runway-text-to-video.ts`](../../src/lib/studio-integrations/providers/runway/runway-text-to-video.ts) — text-to-video (gen4.5/veo 계열) — **image-to-video로 확장**
- [`src/lib/studio-integrations/providers/runway/runway-scene-models.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-models.ts) — 모델 허용 목록
- [`src/lib/studio-integrations/providers/elevenlabs/elevenlabs-adapter.ts`](../../src/lib/studio-integrations/providers/elevenlabs/elevenlabs-adapter.ts) — 어댑터 패턴 샘플
- [`src/lib/studio-integrations/providers/youtube/youtube-upload.ts`](../../src/lib/studio-integrations/providers/youtube/youtube-upload.ts) — 발행 어댑터 패턴 샘플

### 이미지 생성 (현행 — 썸네일 전용)
- [`src/actions/studio-pipeline-presteps.ts`](../../src/actions/studio-pipeline-presteps.ts) `generateThumbnailImageFromEpisode` — OpenAI Images API 경로. **씬 이미지용 추상화**의 시작점.

### 씬·조립
- [`src/lib/studio-productions/scene-rows-json.ts`](../../src/lib/studio-productions/scene-rows-json.ts) — 씬 DTO
- [`src/lib/studio-productions/scene-timeline.ts`](../../src/lib/studio-productions/scene-timeline.ts) — 월드 타임라인
- [`src/lib/studio-productions/scene-clip-metadata.ts`](../../src/lib/studio-productions/scene-clip-metadata.ts) — `source: runway | upload` → **`image_to_video` 추가 후보**
- [`src/lib/studio-productions/scene-visual-brand.ts`](../../src/lib/studio-productions/scene-visual-brand.ts) — 캐릭터/브랜드 비주얼 일관성
- [`src/lib/studio-productions/video-assembly.ts`](../../src/lib/studio-productions/video-assembly.ts) — FFmpeg 조립 (F2에서 그래프 확장)
- [`src/lib/studio-productions/video-presets.ts`](../../src/lib/studio-productions/video-presets.ts) — 편집 프리셋 (F2 재활용)
- [`src/lib/studio-productions/scene-clip-storage.ts`](../../src/lib/studio-productions/scene-clip-storage.ts) — Supabase Storage 업로드 패턴
- [`workers/video-assembly/run.ts`](../../workers/video-assembly/run.ts)·[`src/lib/studio-productions/process-video-assembly-job.ts`](../../src/lib/studio-productions/process-video-assembly-job.ts) — 워커

### UI 파이프라인
- [`src/components/dashboard/production-episode-pipeline.tsx`](../../src/components/dashboard/production-episode-pipeline.tsx) — 파이프라인 6단계
- [`src/components/dashboard/scene-render-pipeline-step.tsx`](../../src/components/dashboard/scene-render-pipeline-step.tsx) — 씬 렌더 카드 (**이번에 이미지 단계 선행**으로 확장)
- [`src/components/dashboard/scene-clip-upload-rows.tsx`](../../src/components/dashboard/scene-clip-upload-rows.tsx) — 씬별 업로드 로우 (갤러리 UX 참고)
- [`src/components/dashboard/studio-integrations-provider-tabs.tsx`](../../src/components/dashboard/studio-integrations-provider-tabs.tsx) — provider 연동 탭 (Buffer 탭 추가)
- [`src/components/dashboard/studio-distribution-channels-panel.tsx`](../../src/components/dashboard/studio-distribution-channels-panel.tsx) — 현행 배포 설정 (F3와 관계)

---

## 4. 제품 결정

> **INIT 단계 확정 (2026-04-23 · 사용자 합의):** 아래 §4.0에 정리. PLAN 문서에서는 스키마·프롬프트 템플릿·UI 와이어 등 구현 레벨만 마저 확정한다.

### 4.0 확정된 설계 결정 (INIT)

| # | 결정 | 내용 |
|---|------|------|
| **D1** | **이미지 provider 범위 (Phase 1)** | **4개 어댑터 모두 Phase 1에 포함** — Gemini Imagen(Nano Banana 2), **FLUX via Replicate**, **FLUX via fal.ai**, Seedream(BytePlus). 조직은 Integrations 탭에서 원하는 provider 키를 저장한다. |
| **D2** | **FLUX 엔드포인트** | **Replicate + fal.ai 둘 다 지원**. 각각 별도 provider 슬롯(`flux_replicate`, `flux_fal`) — 키·엔드포인트·모델 버전이 다르므로 분리. UI는 **"FLUX (Replicate)" / "FLUX (fal.ai)"**로 표기. |
| **D3** | **Character Bible 저장 모델** | **`studio_projects.brand_guide` JSONB 확장** + Master Reference Image는 **프로젝트 level 아티팩트** (역할 `character_master_reference`). 마이그레이션 0건. |
| **D4** | **First/Last Frame — UI vs 어댑터** | **UI는 두 슬롯 모두 지정 가능**. 씬 이미지 갤러리에서 생성된 후보 중 **임의 썸네일을 First/Last 슬롯에 드롭**한다. **어댑터는 provider 능력에 따라 선별 주입**: Runway 현재 SDK는 **첫 프레임만**, Last Frame은 I2V 프롬프트의 "끝 상태 설명"으로 합성. Runway가 End Frame Guidance를 공식 지원하거나 ElevenLabs 류 I2V(First+Last 지원) provider 추가 시 **어댑터 레이어만 수정**하면 UI는 그대로 확장된다. |
| **D5** | **캐릭터 일관성 전략 (Phase 1)** | **IDENTITY LOCK 프롬프트 블록 + Master Reference Image를 provider의 공식 reference 기능으로 주입.** 구체: Gemini Flash Image의 이미지 편집/참조, FLUX Redux/Subject Reference, Seedream reference image, Runway `referenceImages`. LoRA/파인튜닝은 **비목표** — 별 ADR(후보 ADR-010). |
| **D6** | **provider 선택 UI 위치** | **조직 기본값 + 에피소드별 오버라이드**. 씬별 선택은 UX 복잡도 대비 이득 낮음. |
| **D7** | **비용 cap** | Phase 1은 **preflight 예상 크레딧 표시**만(기존 `runway-scene-credits-estimate.ts` 패턴을 이미지용으로 확장). 조직·프로젝트 cap은 Phase 4 백로그. |
| **D8** | **Phase 1 완성도 기준** | **"완성도 높은 MVP"** — 한 일반 사용자가 **키만 넣으면 한 에피소드를 끝까지** 돌릴 수 있고, 각 provider 카드·화면에 **공식 문서 앵커 링크**가 있어 사용자가 자율 학습 가능한 수준. |
| **D9** | **provider 공식 문서 링크 (신규 요구)** | 모든 provider 카드 · 이미지 갤러리 · 편집기 · 예약 발행 UI에 **"공식 가이드 보기" 링크**를 i18n 키로 노출. 링크 SoT는 `src/lib/studio-integrations/provider-docs.ts`(신설) 상수 맵 — provider ID → {`apiDocsUrl`, `pricingUrl`, `tosUrl`}. |

### 4.1 F1 — 이미지 → Runway I2V (PLAN에서 상세화)

1. **이미지 provider MVP 세트** (D1·D2 확정): Gemini Imagen · FLUX Replicate · FLUX fal.ai · Seedream.
2. **이미지 저장 위치** (PLAN 확정 필요): 새 아티팩트 역할 **3개** — `scene_keyframe_candidate` (씬별 생성 후보 N장) · `scene_keyframe_first` · `scene_keyframe_last`. 프로젝트 레벨 아티팩트 역할 **1개** — `character_master_reference`. 바이너리는 **Supabase Storage** (scene-clip 패턴 재사용), `external_url` = 공개 URL, metadata에 `provider`, `model`, `watermark_free`, `prompt_used`, `reference_image_id` 기록.
3. **워터마크 보증** (PLAN에서 정책): 어댑터에서 **워터마크 없음**이 기본값이 아닌 provider 는 (i) 파라미터로 off 요청 (ii) 응답 검증 (iii) metadata `watermark_free: true` 기록 — 실패 시 UI 경고·차단.
4. **캐릭터 일관성** (D5 확정): (i) **IDENTITY LOCK 블록** 자동 프리펜드 — Character Bible JSON에서 합성 (ii) **Master Reference Image**를 provider의 공식 reference 필드로 주입 (Gemini image editing · FLUX Redux · Seedream reference · Runway referenceImages).
5. **Runway I2V 확장** (D4 확정): (a) `runRunwayImageToVideo` 어댑터 신설 — SDK `imageToVideo` 엔드포인트 · First Frame 필수 · Runway `referenceImages`로 Master Reference 전달. (b) UI에 Last Frame 슬롯 유지하되 어댑터에서 "끝 상태 설명"으로 합성. (c) End Frame 공식 지원 모델이 나오면 어댑터 분기만 추가.
6. **I2V 프롬프트 자동 생성** (PLAN에서 템플릿): 현행 `scene-llm-planner`에 **I2V 전용 템플릿** 추가 — 카메라 무빙(dolly/pan/static) · 주 동작 · 조명 · 30–80단어 · 부정 프롬프트 없음 · 단일 씬 원칙 · locale별 표현(영어 주 모델). `draft-prompt-templates` 패턴 재활용.
7. **provider 공식 문서 SoT** (D9 확정): `src/lib/studio-integrations/provider-docs.ts` 맵 신설 — Gemini(`ai.google.dev/gemini-api/docs/image-generation`), FLUX Replicate(`replicate.com/black-forest-labs/flux-1.1-pro`), FLUX fal.ai(`fal.ai/models/fal-ai/flux-pro`), Seedream(`docs.byteplus.com`), Runway(`docs.dev.runwayml.com`), Buffer(`buffer.com/developers/api`). UI는 provider ID → 링크로 조회.

### F2 — 웹 편집기
1. **편집 DSL**: 새 테이블 필요 없음 — `studio_video_assembly_jobs.input_json` v2 스키마 확장(트랙/트림/텍스트/BGM). PLAN에서 **스키마 v2 확정**.
2. **프리뷰 기술**: FFmpeg.wasm(브라우저 렌더) vs 서버 프리뷰 스트림. **1차 권장: 클라이언트 준-프리뷰 (원본 클립 직접 재생 + CSS/Canvas 오버레이)**; 최종은 서버 FFmpeg 렌더.
3. **최대 영상 길이**: 60초 (Shorts/Reels 기준)·해상도 1080×1920.
4. **텍스트 스타일 프리셋**: 조직 스코프 `studio_text_overlay_presets` 테이블 (P2에서 검토) vs 현행 `episode_pipeline_prefs` JSONB에 저장 (P1 권장).
5. **BGM 소스**: 기존 `artifact_role: bgm` 또는 신규 `background_music` 아티팩트 역할 검토.

### F3 — Buffer
1. **인증 방식**: Buffer **API Key 방식(서버 저장)** → v2 GraphQL 엔드포인트. OAuth는 2차.
2. **채널 저장**: `buffer_channels` 테이블 vs 조직 연동 행 metadata JSON — PLAN 결정.
3. **멱등성**: `studio_scheduled_posts.idempotency_key = (episode_id, platform, scheduled_at)` UNIQUE.
4. **캡션 LLM 경로**: 기존 `packaging_draft` 에 `instagram` / `tiktok` 섹션 추가 vs 신규 아티팩트 역할 `social_captions`. 재활용 우선 → **동일 액션 확장**.
5. **재시도·실패 처리**: 3회 지수 백오프 + `failed` 상태 + UI 재시도 버튼.
6. **크레덴셜 분리**: Buffer 웹앱 크레딧 ≠ API 크레딧 — 연동 UI 설명문 명시(요구사항 §주의사항 반영).

---

## 5. 복잡도 근거 (L4)

| 축 | 이유 |
|----|------|
| **데이터** | 마이그레이션 3~4개(provider CHECK 확장·Buffer 연결·예약 발행 테이블·옵션 텍스트 프리셋), 새 아티팩트 역할 ≥3개, 잡 input_json v2 |
| **Provider** | 이미지 3계열(Gemini Imagen/FLUX/Seedream) + Runway I2V 확장 + Buffer — **총 5개 신규 어댑터** 후보 (우선순위별 단계화) |
| **UI** | 씬 이미지 갤러리(신규), 타임라인 편집기(신규 대형), 예약 발행 UI(신규), 파이프라인 재카피(변경) |
| **FFmpeg** | concat 중심 → **그래프**(xfade, drawtext, amix, loop) 확장 — 품질·성능 재검증 필요 |
| **비용/안전** | 이미지·영상·LLM 비용 스파이크, 저작권(캐릭터 일관성 주의 문구), 워터마크 차단, rate limit(Buffer 60/분, Runway/이미지 provider별) |
| **다국어** | 4개 locale i18n(en/ko/ja/zh-CN/zh-TW) — 캡션 생성 프롬프트도 다국어 |

---

## 6. 권장 슬라이스 (PR/스프린트 단위)

| 슬라이스 | 목표 | 대략 크기 |
|---------|------|-----------|
| **U1 — 이미지 provider 추상화 + 4개 어댑터** (D1·D2·D9) | `generateSceneKeyframe()` 서버 유틸 + Gemini Imagen · FLUX Replicate · FLUX fal.ai · Seedream 어댑터 + 각 provider `*-verify.ts` + `provider-docs.ts` 링크 맵 + Integrations 탭 확장(provider 카드 × 4 + 공식 문서 링크) | L3 |
| **U2 — 씬 이미지 갤러리 + Character Bible + First/Last 지정** (D3·D4·D5) | 파이프라인에 **"씬 키프레임"** 단계 추가, 씬별 N장 생성·선택·First/Last 슬롯 드롭, 프로젝트 `brand_guide` JSONB Character Bible 확장, Master Reference 업로드/선택 UI, 아티팩트 역할 4개(`scene_keyframe_candidate`/`first`/`last`, `character_master_reference`) | L4 |
| **U3 — Runway I2V 어댑터 + I2V 프롬프트 생성** (D4) | `runRunwayImageToVideo` + `referenceImages` 주입 + I2V 전용 프롬프트 템플릿 + 씬 카드에서 I2V 실행(기존 T2V와 병존) + preflight 크레딧 표시 | L3 |
| **U5 — 타임라인 편집기 MVP (트림·순서·오버레이)** | 편집기 UI 스켈레톤 + 편집 DSL v2 + FFmpeg 그래프 확장(drawtext) | L4 |
| **U6 — 편집기 고급 (전환/BGM/프리셋)** | xfade, amix, 텍스트 스타일 프리셋 저장 | L3 |
| **U7 — Buffer 연동 + 채널 저장 + 검증** | provider 추가, 연결 UI, 채널 목록 조회·저장 | L2 |
| **U8 — 캡션 자동 생성 (3 플랫폼)** | `packaging_draft` 확장, 편집 가능 UI | L2 |
| **U9 — 예약 발행 UI + 3채널 예약 + 재시도** | `studio_scheduled_posts`, PublishScheduler 컴포넌트 | L3 |

**Phase 1 = U1 + U2 + U3** (U4는 U1에 흡수 — 확정). **Phase 2 = U5 + U6.** **Phase 3 = U7 + U8 + U9.**

---

## 7. 비목표 (INIT 스코프 아님)

- 영상 생성 자체의 무료화(비용 민감) — 1차에서는 **Runway 키 사용자 옵션**으로만. 완전 자동화는 Runway 정책·가격 안정 후 ADR-009 후보.
- 얼굴/립싱크·성우 더빙(HeyGen, D-ID 등) — 별도 provider 트랙.
- A/B 테스트·성과 기반 재전략 — Phase 4 백로그(Phase T5에 합류 고려).
- 멀티 캐릭터 동시 프로젝트 — 데이터 모델은 열려 있으나 UI는 단일 프로젝트 기준.
- 브라우저에서 최종 렌더링(FFmpeg.wasm 최종본) — 서버 렌더만.

---

## 8. 위험 & 완화

| 위험 | 완화 |
|------|------|
| **이미지 provider 워터마크/ToS 변동** | 어댑터에서 응답 검증 → `watermark_free: true` metadata 없으면 UI 경고·차단. provider별 ToS 요약 런북. |
| **Runway I2V 크레딧 급증** | 기존 `runway-scene-credits-estimate.ts` 확장 — preflight UI에 예상 크레딧 + “budget cap” 가드. |
| **Buffer 발행 실패(URL 만료 등)** | 3회 재시도 + 발행 전 URL HEAD 체크 + 공개 URL(Storage public) 보장 정책. |
| **편집 DSL 스키마 불안정** | PLAN에서 **Zod 스키마** 고정 → 잡 input_json v2 명시적 버전 필드 포함. |
| **Rate limit 엉킴** | 조직별 `provider_calls_audit` (Phase T5 예정) 또는 최소 `logAudit` 활용. |
| **캐릭터 일관성 미흡** | Character Bible + Master Reference Image + 프롬프트 IDENTITY LOCK + “2D photo-real only” 룰 — CREATIVE에서 템플릿 확정. |
| **다국어 캡션 품질** | LLM 프롬프트에 locale별 톤 + 해시태그 규칙(플랫폼별) — `draft-prompt-templates` 패턴 재활용. |

---

## 9. 다음 단계 (사용자 확인 필요)

1. **PLAN 문서 생성** — 위 U1~U9 중 **Phase 1(U1+U2+U3)**만 먼저 PLAN 하거나, 전체 PLAN을 상위 수준으로 작성 후 U 단위로 드릴다운할지 결정.
2. **ADR-008 후보**: “이미지 provider 다중화 + 씬 키프레임 모델” — 새 provider CHECK, 새 아티팩트 역할, 워터마크 정책을 ADR로 고정.
3. **ADR-009 후보 (선택)**: “편집 DSL + Buffer 예약 발행” — 잡 input_json v2와 예약 발행 스키마 고정.
4. **CREATIVE 산출**: 씬 이미지 갤러리 와이어 + 타임라인 편집기 와이어 + PublishScheduler 와이어.

**권장 진입 순서:** 사용자에게 3가지 선택지 제공 →
- (A) Phase 1 집중 PLAN (빠르게 U1~U3 착수)
- (B) 3 Phase 상위 PLAN + ADR 2개 먼저 (아키텍처 안정성 우선)
- (C) 현행 에피소드 파이프라인에 **이미지 단계만** 얇게 끼우는 초미니 슬라이스(U1+일부 U2)만 PLAN

---

## 10. 체크리스트

- [ ] **PLAN:** Phase 선정·슬라이스 확정·스키마(마이그레이션 N개)·프롬프트 템플릿 목록
- [ ] **ADR-008 (이미지/키프레임):** provider 허용 목록·역할·워터마크 정책
- [ ] **ADR-009 (편집 DSL/Buffer):** 잡 input_json v2·예약 발행 스키마
- [ ] **CREATIVE:** 갤러리/편집기/PublishScheduler 와이어 + DS 토큰 정렬
- [ ] **BUILD (슬라이스별 PR):** U1 → … → U9
- [ ] **i18n:** `Dashboard.productions` 하위 신규 키 (en/ko/ja/zh-CN/zh-TW)
- [ ] **VERIFY:** `pnpm verify` + 각 provider 어댑터 단위 테스트 (현행 `*-verify.ts` 패턴)
- [ ] **REFLECT / ARCHIVE:** 슬라이스별 — 교훈·비용 실측·후속 제안

---

## 11. 메모

- **프롬프트 스튜디오의 발전형**: F1의 I2V 프롬프트·F2의 오버레이 카피·F3의 캡션까지 모두 **태스크별 템플릿 세트**로 `draft-prompt-templates` 경로에 확장한다. 사용자가 **템플릿을 커스텀·저장**할 수 있게 한다(P2 `studio_episode_draft_templates` 패턴 재사용).
- **현행 파이프라인 카피 변경**: “씬 렌더 (Runway)” → “씬” 은 이미 `INIT-scene-user-media-assembly.md`에서 다룸. 이번 INIT은 그 위에 **“씬 이미지 → 씬 비디오”** 단계를 끼운다.
- **gstack 지원:** PLAN 후 `/plan-eng-review` · `/plan-design-review` · 이후 `/qa` 권장.
