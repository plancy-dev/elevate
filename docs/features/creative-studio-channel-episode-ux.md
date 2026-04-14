# CREATIVE — 채널 중심 에피소드 UX (primary 플로우)

**Status:** Decision record for implementation alignment with [channel-centric plan](.cursor/plans/channel-centric_studio_episodes_4c2383f9.plan.md) (not the plan file itself).

## Primary journey (locked)

1. **목록** [`/dashboard/productions`](/dashboard/productions): 조직의 모든 에피소드를 보되, **채널 필터**로 한 배포 라인에 집중한다.
2. **새 에피소드** [`/dashboard/productions/new`](/dashboard/productions/new): 기본은 전체 프리셋과 동일하되, **채널 컨텍스트**는 `?channel=<uuid>` 쿼리로 전달해 해당 채널이 미리 선택되도록 한다 (채널 목록·목록 필터에서 “이 채널로 만들기” 진입).
3. **에피소드 상세**: 원장 편집 + **LLM 초안 패널** (훅·제목·대본) + 기존 아티팩트 워크벤치. Runway·YouTube 단계는 플래그/어댑터 성숙도에 따라 노출.

## 페르소나

- **크리에이터/운영자:** 채널마다 톤이 다르다는 전제. 배포 프리셋·저장된 채널 링크·(선택) 니치/포맷이 **한 화면에서 읽히고**, LLM 호출 시 서버가 이 맥락을 프롬프트에 넣는다.
- **뷰어 역할 org 멤버:** 초안 생성·수정은 **편집자( admin · organizer · coordinator )**만 (서버 액션에서 검사).

## 채널 vs Shorts 플랜

- **YouTube Shorts** 니치/포맷/채널 번들 UI는 유지.
- **YouTube 롱폼·X·기타**는 니치/포맷 없이 **배포 채널만** 붙일 수 있게 한다 (같은 `studio_distribution_channels` 행, `platform` 확장).

## 시각 계층

- 목록: 채널 뱃지/필터로 스캔 가능.
- 상세: 헤더에 링크된 채널 CTA 유지 + 초안 패널을 편집 폼 위에 배치해 “만들기” 흐름이 위에서 아래로 진행되도록 한다.
