# ADR-007: YouTube Content Factory 아키텍처

**상태:** Accepted  
**날짜:** 2026-04-16  
**결정자:** AI (gstack /office-hours + /plan-ceo-review 기반)  
**관련:** [ADR-003](./ADR-003-studio-productions-mvp.md) · [ADR-006](./ADR-006-studio-provider-integrations-v2.md) · [PLAN](../features/PLAN-studio-content-factory.md)

## 맥락

4개의 AI 영상 자동화 분석 보고서를 기반으로, Elevate Studio를 YouTube 콘텐츠 생성/관리 플랫폼으로 확장하는 아키텍처를 결정한다. 기존 에피소드/아티팩트 원장(ADR-003)과 제공자 연동(ADR-006)을 확장하는 방향으로 설계한다.

## 결정

### D1: Human-in-the-Loop 모델 채택

100% 자동화 파이프라인이 아닌, **AI 90% 생성 + 인간 10% 검수** 모델을 채택한다.

**근거:**
- YouTube 2025-07 "Inauthentic Content" 정책: 완전 자동화 채널은 수익화 박탈
- YouTube API 일일 쿼터(10,000단위, 업로드 1건=1,600단위): 대량 양산 불가
- 검수 단계가 콘텐츠 품질과 브랜드 일관성을 보장

**구현:** 파이프라인의 3개 지점(초안 승인, 영상 조립 승인, 업로드 전 메타데이터 검토)에서 사용자 확인을 강제한다.

### D2: 기존 데이터 모델 확장 (신규 테이블 아닌 역할 확장)

`studio_production_artifacts`의 `artifact_role`에 신규 역할(`tts_audio`, `subtitle_srt`, `assembled_video`, `thumbnail`)을 추가한다. 별도의 TTS/렌더링 테이블을 만들지 않는다.

**근거:**
- ADR-003의 "원장" 패턴이 이미 잘 작동
- 모든 생산물을 에피소드 하위의 아티팩트로 통합 관리
- `metadata` jsonb가 충분히 유연

**예외:** YouTube OAuth 토큰은 아티팩트가 아니므로 별도 테이블(`studio_youtube_channel_tokens`)을 생성한다.

### D3: ElevenLabs 우선, Edge-TTS 폴백

TTS 제공자로 ElevenLabs API를 1차, Edge-TTS를 무료 폴백으로 채택한다.

**근거:**
- ElevenLabs: Artificial Analysis ELO #2(1,179), 70+ 언어, 감정 제어
- Edge-TTS: 비용 $0, 테스트/프로토타이핑에 적합
- 한국어: Supertone Play 또는 Qwen3-TTS를 향후 어댑터로 추가

**기각된 대안:**
- Kokoro-82M (오픈소스): 자체 호스팅 인프라 필요, 서버리스 환경에 부적합
- ChatTTS: CC BY-NC 라이선스, 상용 불가

### D4: FFmpeg 서버사이드 조립 (Remotion 대신)

영상 조립에 FFmpeg subprocess를 채택한다. Remotion Lambda는 채택하지 않는다.

**근거:**
- FFmpeg: 추가 비용 $0, 자막 burn-in/오디오 더킹 네이티브
- Remotion Lambda: AWS 인프라 별도 필요, egress 비용, 초기 과잉 설계
- 숏폼(60초 미만) 조립은 FFmpeg로 충분

**향후:** 멀티테넌트 SaaS로 확장 시 Remotion 재평가

### D5: YouTube Data API v3 공식 경로만 사용

헤드리스 브라우저 자동화, 다중 GCP 프로젝트 순환 등 우회 전략은 사용하지 않는다.

**근거:**
- 계정 정지 리스크 배제
- 쿼터 확장은 정식 Audit 프로세스로 신청
- 일일 6건 업로드 제한 내에서 운영 (주 5회 = 충분)

### D6: 조직별 BYO 키 패턴 유지

`studio_org_provider_connections`의 암호화 + BYO 키 패턴을 ElevenLabs, YouTube OAuth에도 동일하게 적용한다.

**근거:**
- ADR-006의 보안 아키텍처 일관성
- 플랫폼 전역 API 키 대신 조직별 격리
- YouTube OAuth 토큰도 동일한 암호화 경로

## 결과

- 기존 에피소드/아티팩트 스키마를 최대한 재사용
- 신규 마이그레이션 최소화 (provider CHECK 확장 + YouTube 토큰 1개)
- 전체 파이프라인이 `STUDIO_INTEGRATIONS_ENABLED` 단일 플래그로 게이트
- 월 ~$82 비용으로 주 5회 업로드 운영 가능
