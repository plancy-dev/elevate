# PLAN: Studio Content Factory — AI YouTube 콘텐츠 파이프라인

**상태:** APPROVED (2026-04-16)  
**복잡도:** L4  
**관련:** [`ADR-007`](../adr/ADR-007-youtube-content-factory.md) · [`tasks.md`](../../memory-bank/tasks.md) § Phase S · [`STUDIO_PROVIDER_API_CAPABILITY_MATRIX`](./STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md)

---

## 제품 방향

Elevate Studio의 에피소드/아티팩트 원장 + Runway 연동을 확장하여 **스크립트 → TTS → 영상 클립 → 조립 → 리뷰 → YouTube 업로드**까지 이어지는 Human-in-the-Loop AI 콘텐츠 팩토리를 구축한다.

**핵심 제약 (YouTube 2025-07 정책):**
- "Inauthentic Content" 정책: 100% 자동 채널은 수익화 박탈
- YouTube Data API 일일 쿼터 10,000단위 = 업로드 최대 6건/일
- AI 생성 콘텐츠 라벨링 의무화

**결론:** AI 90% 생성 + 인간 10% 검수. 소량 고품질 전략.

---

## 기술 스택 결정

| 레이어 | 선택 | 근거 |
|--------|------|------|
| LLM (스크립트) | OpenAI / Anthropic | 기존 구현, JSON 스키마 출력 |
| TTS (1차) | ElevenLabs API | ELO #2, 70+ 언어, 감정 제어 |
| TTS (폴백) | Edge-TTS | 비용 $0, 영어 품질 충분 |
| 영상 생성 | Runway Gen-4.5 | 기존 SDK 연동, GWM-1 캐릭터 일관성 |
| 영상 조립 | FFmpeg subprocess | API 비용 $0, 자막 burn-in |
| 자막 | Whisper (OpenAI API) | word-level timestamps |
| YouTube | YouTube Data API v3 + OAuth 2.0 | 공식 경로 |
| 잡 큐 | Supabase Edge Functions + pg_cron | 기존 인프라 |

---

## 기존 코드 재사용

| 기존 | 재사용 |
|------|--------|
| `studio_production_episodes` + `_artifacts` | 그대로. 역할에 `tts_audio`, `subtitle_srt`, `assembled_video`, `thumbnail` 추가 |
| `episode-llm.ts` / `buildDraftPrompt` | 확장: `scenes[]` 배열 포함 JSON 스키마 |
| `draft-prompt-templates.ts` | 확장: Shorts 특화 템플릿 |
| `runway-adapter.ts` | 확장: 씬별 병렬 호출, 9:16 기본값 |
| `studio_org_provider_connections` + 암호화 | 그대로. `elevenlabs` provider 추가 |
| `STUDIO_INTEGRATIONS_ENABLED` 플래그 | 그대로 |

---

## 실행 페이즈

### S1 — TTS + 자막 (1주)

에피소드 스크립트 → ElevenLabs 음성 + Whisper SRT 자막

- 마이그레이션 `030`: `elevenlabs` provider CHECK 추가
- `src/lib/studio-integrations/providers/elevenlabs/`: TTS 어댑터
- `src/actions/studio-tts.ts`: `generateTtsFromScript`, `generateSubtitlesFromAudio`
- 아티팩트 역할: `tts_audio`, `subtitle_srt`
- UI: 에피소드 상세 패널에 "음성 생성" 버튼

### S2 — 씬 분할 + Runway 병렬 생성 (1주)

스크립트를 씬 단위로 분할, 각 씬 Runway 병렬 호출

- `episode-llm.ts`: `scenes[]` JSON 스키마 추가
- `src/lib/studio-productions/scene-splitter.ts`: 스크립트 → 씬 목록
- `runway-adapter.ts`: `runBatchScenes` 추가
- `src/actions/studio-scene-render.ts`: 씬별 잡 제출 + 아티팩트

### S3 — FFmpeg 영상 조립 (1주)

TTS + Runway 클립 + SRT → 최종 9:16 MP4

- `src/lib/studio-productions/video-assembly.ts`: FFmpeg 명령어 빌더
- 클립 연결, 오디오 더킹, 자막 burn-in, H.264/AAC
- `artifact_role: "assembled_video"` 저장
- UI: 미리보기 플레이어 + 승인 버튼

### S4 — YouTube OAuth + 업로드 (1주)

조직 YouTube 채널 연결, 승인된 영상 업로드

- 마이그레이션 `031`: `studio_youtube_channel_tokens` 테이블
- `src/lib/studio-integrations/providers/youtube/`: OAuth + upload
- `triggerYoutubeUploadStub` → 실제 업로드로 교체
- 업로드: private → 메타데이터 확인 → public/scheduled

### S5 — 채널 대시보드 + 성과 추적 (1주)

업로드 영상의 조회수/CTR/수익 추적, A/B 프롬프트 실험

- YouTube Analytics API 연동
- 마이그레이션 `032`: `studio_episode_performance` 테이블
- UI: `/dashboard/productions/analytics`
- 프롬프트 A/B: 스냅샷 메타데이터 + 성과 데이터 연결

---

## 비용 추정 (월간, 주 5회 기준)

| 항목 | 월 비용 |
|------|---------|
| Runway Gen-4.5 (600초) | ~$72 |
| ElevenLabs TTS (30K자) | ~$9 |
| OpenAI (스크립트+Whisper) | ~$1 |
| YouTube API | $0 |
| **합계** | **~$82/월** |

---

## 채널 전략

**첫 니치:** AI/기술 교육 (한국어 + 영어)  
**포맷:** Shorts 40-60초, 주 3-5회  
**시각:** Runway 고정 캐릭터 + 채널별 컬러 팔레트 + 랜덤 시드 변형

---

## YouTube 정책 준수

| 제재 기준 | 대응 |
|----------|------|
| 템플릿 반복 | FFmpeg 렌더링 시 랜덤 시드 (자막 색상/크기, 트랜지션, 줌) |
| 정보 가치 부재 | LLM 멀티 에이전트 검수: "후크-본문-CTA" 비율 |
| AI 라벨 미부착 | YouTube API 업로드 시 AI disclosure 자동 |
| 기계음 TTS | ElevenLabs 감정 제어 + SSML |
| 스톡 이미지 반복 | Runway 캐릭터 일관성 + 채널 고유 아이덴티티 |

**Human-in-the-Loop 강제:**
1. LLM 초안 → 사용자 확인
2. 영상 조립 → 미리보기 + 승인
3. YouTube 업로드 → 메타데이터 검토
4. 초기 `private`, 사용자가 `public` 전환
