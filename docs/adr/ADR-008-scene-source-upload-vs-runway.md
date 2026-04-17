# ADR-008: Scene video sources — user upload vs Runway

**상태:** Accepted (2026-04-17)  
**관련:** [INIT-scene-user-media-assembly.md](../features/INIT-scene-user-media-assembly.md) · [STUDIO_ARTIFACT_ROLES.md](../STUDIO_ARTIFACT_ROLES.md)

## 결정

- 씬 클립은 동일 `artifact_role: scene_clip`으로 저장하고, `metadata.source`로 **`runway` | `upload`** 를 구분한다.
- 업로드 영상은 **저작권·콘텐츠 정책**은 업로더 책임으로 두고, 앱은 형식·용량만 검증한다.
- 최종 조립은 **per-scene v2** 경로에서 TTS·SRT를 **씬 플랜 월드 타임**에 맞춰 슬라이스한다.

## 비목표

- 자동 저작권 스캔, 상업 음원 분리 검출.
