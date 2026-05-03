# Architecture Decision Records (ADR) — Elevate

## 프로세스 기준 (신규 ADR 작성 시)

새 **저장소 ADR**(`docs/adr/ADR-*.md`)을 작성하거나 CREATIVE 산출물을 ADR로 고정할 때는, 아래 **AWS 권장 ADR 프로세스**를 기본으로 삼는다.

- **참고:** [ADR 프로세스 — AWS Prescriptive Guidance (한국어)](https://docs.aws.amazon.com/ko_kr/prescriptive-guidance/latest/architectural-decision-records/adr-process.html)

요지는 다음과 같다.

- **범위:** 구조, 비기능(보안·가용성), 의존성, 공개 API·계약, 구성(프레임워크·도구) 등 **아키텍처에 영향을 주는 결정**을 ADR로 남긴다.
- **콘텐츠:** 컨텍스트, **결정**, 결과(트레이드오프)를 분리해 쓰고, **“왜 그렇게 결정했는지”**가 나중에 읽히게 한다.
- **수명:** 채택된 ADR은 **불변**으로 취급한다. 방향이 바뀌면 **새 ADR**을 제안·채택하고, 이전 ADR은 **대체됨(superseded)** 등 상태를 명시한다.

Cursor / 에이전트 워크플로에서 PRD·CREATIVE와 ADR을 맞물릴 때는 [`.cursor/rules/prd-adr-integration.mdc`](../../.cursor/rules/prd-adr-integration.mdc)와 [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md)를 함께 본다.

## 이 디렉터리의 ADR 목록

파일명은 `ADR-NNN-short-slug.md` 형태를 유지한다. 최신 목록은 저장소에서 `ls docs/adr` 또는 `docs/adr/ADR-*.md` 검색으로 확인한다.
