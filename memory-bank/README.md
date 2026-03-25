# Memory Bank — Elevate

이 디렉터리는 **Elevate** 프로젝트의 단일 요약 컨텍스트입니다. 다른 저장소에서 복사한 내용은 **본 README·tasks.md 기준으로 덮어쓴 상태**입니다.

## 파일

| 파일 | 용도 |
|------|------|
| **tasks.md** | 로드맵·페이즈·우선순위 (SoT) |
| **activeContext.md** | 지금 페이즈, 다음 작업 앵커 |
| **progress.md** | 완료 vs 남은 일 |
| **creative-architecture.md** | 아키텍처·스키마·라우트 구조 결정 |
| **techStack.md** | 기술 스택 한 페이지 요약 |
| **domainKnowledge.md** | MICE 용어·도메인 메모 |
| **archive/** | 완료된 큰 결정만 (선택) |

## 갱신 규칙

- **페이즈 전환·스프린트 시작**: `activeContext.md` + `tasks.md` 체크박스
- **기능 완료 시**: `progress.md`
- **아키텍처 변경 시**: `creative-architecture.md`

## Cursor

- 규칙: `.cursor/rules/memory-bank-guide.mdc`
- 워크플로우: `.cursor/rules/workflow-modes.mdc`
- AI 진입점 요약: `docs/AI_USAGE.md`

## 시크릿

저장소에 **Supabase 서비스 롤**, **MCP 토큰**, **Stitch/Google API 키**를 커밋하지 않습니다. `.env.local` 및 Cursor MCP UI에서만 설정합니다.
