# Archive — Scene → Publish Pipeline (Phase 1 + Phase 2 + Phase 3)

**Shipped:** 2026-04-23 → 2026-04-24
**SoT:** [`../../tasks.md`](../../tasks.md) § G3.1.5 · [`docs/features/INIT-scene-image-to-video-and-publishing.md`](../../../docs/features/INIT-scene-image-to-video-and-publishing.md)
**ADRs:**
- [`ADR-009 — Studio Image Providers + Keyframes`](../../../docs/adr/ADR-009-studio-image-providers-and-keyframes.md)
- [`ADR-010 — Fullscreen Timeline Editor`](../../../docs/adr/ADR-010-fullscreen-timeline-editor.md)

---

## 요약

한 에피소드에 대해 **씬 이미지 키프레임 생성 → First/Last Frame 고정 → Runway I2V →
편집기에서 오버레이/오디오 편집 → Export → Buffer 예약 발행**까지 단일 경로를 제공한다.
사용자는 각 툴의 API 키만 제공하면 **딸깍딸깍**으로 클립 단일 생성부터 다채널 예약까지
끝낼 수 있다. 편집 중 상태는 `episode.pipeline_prefs.editor`(JSONB)에 3초 debounce로
autosave하고, 확정 Export 시 `studio_video_assembly_jobs.input_json.editor_extensions`로
스냅샷 된다.

---

## 배포 범위 (Phase별)

| Phase | 내용 | 핵심 코드/마이그레이션 |
|-------|------|------------------------|
| **Phase 1 — Scene Keyframes + I2V** | 4개 이미지 provider 어댑터, Character Bible 하이브리드 JSONB, Master Reference, First/Last Frame 지정, Runway I2V (veo3.1 기본) | `src/lib/studio-integrations/providers/images/` · `runway-image-to-video.ts` · 마이그레이션 `038` · `039` |
| **Phase 2 — Fullscreen Editor** | 편집 DSL v3, 풀스크린 라우트, autosave, Preview + Scene/Overlay/Audio 트랙과 Inspector, FFmpeg 오버레이/xfade/amix, Export 플로우 | `editor-dsl.ts` · `src/app/(dashboard)/dashboard/productions/[episodeId]/editor/` · `ffmpeg-overlay-filter.ts` · `ffmpeg-common.ts` · 마이그레이션 0건 (JSONB 재활용) |
| **Phase 3 — Publish** | Buffer GraphQL 어댑터, 플랫폼별 캡션 LLM, PublishScheduler UI, 예약/재시도(단건·일괄)/취소, Idempotency key | `studio-buffer.ts` · `publish-scheduler.tsx` · 마이그레이션 `040` · `041` |

---

## 문서 트리

| 문서 | 경로 |
|------|------|
| ADR (Phase 1) | [`ADR-009`](../../../docs/adr/ADR-009-studio-image-providers-and-keyframes.md) |
| ADR (Phase 2) | [`ADR-010`](../../../docs/adr/ADR-010-fullscreen-timeline-editor.md) |
| REFLECT (Phase 1 + Phase 3) | [`reflect-scene-keyframes-i2v-buffer-2026-04.md`](reflect-scene-keyframes-i2v-buffer-2026-04.md) |
| REFLECT (Phase 2 + Reliability Hardening) | [`reflect-fullscreen-editor-phase2-2026-04.md`](reflect-fullscreen-editor-phase2-2026-04.md) |
| Ops 체크리스트 | [`../../docs/MANUAL_OPERATOR_CHECKLIST.md`](../../../docs/MANUAL_OPERATOR_CHECKLIST.md) |
| Worker 런북 | [`../../docs/VIDEO_ASSEMBLY_WORKER.md`](../../../docs/VIDEO_ASSEMBLY_WORKER.md) |
| E2E 가이드 | [`../../docs/TESTING.md`](../../../docs/TESTING.md) |

---

## 재현 경로 (운영 스모크)

로그인된 상태 기준.

1. 대시보드 → **제작(Productions)** → 기존 에피소드 선택 → **Pipeline** 서브탭.
2. Scene keyframe 생성(또는 수동 업로드) → First/Last Frame 지정.
3. **Runway I2V 렌더링** 버튼 → `scene_clip` 아티팩트 생성까지 대기.
4. **편집기 열기** → 오버레이/전환/오디오 편집 → 3초 뒤 자동 저장 확인.
5. **Export** → Render → `studio_video_assembly_jobs` 신규 row + `assembled_video` 아티팩트 생성까지 대기.
6. 에피소드 상세 → **발행 & 예약** 섹션 → AI로 캡션 생성 → 채널 선택 → Schedule.
7. 실패/재시도는 **실패 재시도(개별/에피소드 단위)**로 처리.

---

## 안정화 포함 (REFLECT Readiness Plan, 2026-04-24)

- **P0 (buffer correctness):** 벌크 재시도 에러 집계 정정 · DB update 실패를 `dbError`로 표면화 · `pending` row 개별 재시도 UX.
- **P1 (assembly maintainability):** `ffmpeg-common.ts` 공용 헬퍼 · 에러 union 정렬 · `editor_extensions` 현재 소비 필드 주석.
- **P1 (E2E stability):** 로케일 안정 auth selector · `domcontentloaded` + 명시적 assert · 하이드레이션 가드(`tests/e2e/helpers/hydration-guard.ts`) · `button:visible` + `requireVisibleBufferChannelChip()`.
- **P2 (ops docs):** 수동 운영 체크리스트 · worker 인시던트 런북 · live-smoke 전제조건 + mutation warning · IMPLEMENT validation gate.

세부는 [`reflect-fullscreen-editor-phase2-2026-04.md`](reflect-fullscreen-editor-phase2-2026-04.md) 참고.

---

## 운영 전제조건 (live smoke / 실사용 검증)

아래는 자동화로 대체 불가 — 테스트 전에 반드시 사람이 확인한다.

- [ ] Supabase 마이그레이션 `038`–`041` 적용 여부.
- [ ] `elevate-content` 버킷 public 또는 signed-URL 어댑터 분기.
- [ ] Video assembly worker Fly 머신 running + `/health` 정상.
- [ ] 조직에 이미지 provider 키 저장 (Gemini/FLUX/Seedream 중 ≥1).
- [ ] 조직 Buffer API 키 + **Buffer 채널 ≥1개 연결** (Instagram/TikTok/YouTube/…).
- [ ] Runway 크레딧 충전 여부 (선택).
- [ ] 24h rate-limit 창에 남은 예산 여부 (Buffer).

---

## 백로그 (이관)

`tasks.md`로 이동된 후속 작업:

| 항목 | 메모 |
|------|------|
| Phase 2 polish — overlay DnD on timeline, transition preview, export 진행률 realtime 토스트 | 사용자 피드백/우선순위에 따라 별도 스프린트 |
| 실사용 E2E end-to-end 최종 확인 | Buffer 채널 연결 + 24h 창 대기 후 수동 실행 |
| Private 버킷 + signed-URL 어댑터 (prod) | Runway I2V가 public HTTPS를 요구 |
| Buffer remote 취소 reconciliation worker | 현재 cancel은 로컬 row만 업데이트 |
| LoRA / 파인튜닝 | ADR 후보 (고객 요구 확인 후) |

---

**상태: DONE (문서).** 실사용 End-to-End 1회전 증빙은 Buffer 채널 연결 후 별도 스모크 리포트로 추가.
