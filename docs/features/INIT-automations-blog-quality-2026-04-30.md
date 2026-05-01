# INIT — Automations Stabilization + Blog Quality Uplift (2026-04-30)

## 요청 요약

- Slack/Linear 없이 운영 가능한 자동화를 안정화한다.
- 블로그 자동 생성 결과물의 품질을 높이고, 실패 시 안전하게 복구 가능한 운영 루프를 만든다.
- Cursor Cloud Agent Automations 템플릿을 Elevate 운영 방식(GitHub 중심)으로 변환한다.

## 현재 상태 (기준선)

- Blog autopublish SDK 경로 구축 완료:
  - Script: `scripts/blog-autopublish-sdk.mjs`
  - Workflow: `.github/workflows/blog-autopublish.yml`
  - Queue: `docs/blog/automation/topics.json`
- 실제 자동화 실행으로 PR 생성 확인:
  - `chore(blog): auto-publish weekly post via Cursor SDK` PR 생성 성공
- No-Slack 운영형 자동화 설계 문서 추가:
  - `docs/AUTOMATIONS_NO_SLACK_OPS.md`

## INIT에서 확인된 리스크/교훈

1. **조직 정책 제약**
   - 기본 GitHub Actions workflow permission이 `read`로 고정되어 `GITHUB_TOKEN`으로 PR 생성 실패.
   - 해결: `AUTOMATION_GH_TOKEN` secret 사용.

2. **SDK 런타임 안정성**
   - 로컬 환경에서 `sqlite3` native binding 이슈로 초기 실행 실패 가능.
   - 해결: build script 허용/재설치(`pnpm approve-builds --all`) + 환경 문서화 필요.

3. **품질 게이트 미흡**
   - 현재 자동 생성 후 lint/typecheck는 있으나, 블로그 콘텐츠 품질(사실성/톤/CTA/링크) gate가 약함.

4. **운영 가시성 부족**
   - "왜 실패했는지"와 "수동 개입이 필요한지"를 빠르게 판단할 대시보드/이슈 룰이 아직 약함.

## 복잡도

**L3** (워크플로우/운영 자동화 + 콘텐츠 품질 게이트 + 문서/운영 루프 정합).

- 파일 수: 6-12 예상
- 설계 결정: 필요 (품질 gate 기준, 실패 정책, PR/Issue 라우팅)
- DB 변경: 없음

## 범위 (이번 INIT의 대상)

### 포함

- Blog autopublish 안정화 (실행 신뢰도, 실패 내구성, 운영 문서)
- 콘텐츠 품질 게이트 정의 (자동/수동 경계 포함)
- Cloud Agent Automations 샘플 1~2개를 GitHub 출력 중심으로 변환

### 제외

- 결제/구독 도메인 로직 변경
- PostHog 대시보드 신규 제품 분석 설계
- 대규모 콘텐츠 전략 리브랜딩

## Plan 입력용 체크리스트 (다음 모드)

### P1. 운영 안정화 (Automation Reliability)

- [ ] `.github/workflows/blog-autopublish.yml` 실패 분기 강화:
  - SDK 생성 단계 timeout/재시도 정책
  - 실패 시 run summary에 root-cause 요약
- [ ] 워크플로 실행 환경 호환성 업데이트:
  - Node 20 deprecation 경고 대응(액션 버전/런타임 정책)
- [ ] `AUTOMATION_GH_TOKEN` 최소 권한 가이드 문서화

### P2. 콘텐츠 품질 게이트 (Quality Gate)

- [ ] 자동 검증 스크립트 추가(또는 워크플로 단계):
  - frontmatter 필수 키
  - locale/slug/date/cta 링크 정합
  - 금지 패턴(과도한 AI 템플릿 문구) 점검
- [ ] 품질 점수 카드 정의:
  - 정확성, 실행 가능성, 톤 일관성, CTA 명확성
- [ ] fail-open vs fail-closed 정책 확정

### P3. No-Slack 운영형 Automations 실행화

- [ ] Daily Critical Bug Finder를 GitHub Issue output으로 PoC
- [ ] Weekly Docs Drift Guard를 docs-only PR output으로 PoC
- [ ] 실행 로그를 운영자가 5분 내 판단 가능한 형태로 표준화

## 성공 기준 (REFLECT에서 검증)

- 자동화 2주 연속 성공률 >= 90% (수동 재실행 제외 기준)
- 생성 결과물 중 "수정 없이 merge 가능한 초안" 비율 >= 60%
- 실패 케이스 100%에서 원인 분류(권한/환경/프롬프트/품질) 가능

## 다음 모드

### PLAN

- 산출물:
  1) `PLAN-automations-blog-quality-stabilization.md`
  2) 작업 슬라이스(신뢰성/품질게이트/운영가시성)별 PR 단위 계획
  3) 품질 게이트 fail 정책 확정(차단 vs 라벨링)
