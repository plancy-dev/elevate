# 배포 팩: weekly-agent-ops-scorecard

이 문서는 **운영자(당신)가 전략을 이해한 뒤** 스케줄러에 넣을 때 쓰는 메모입니다.

**배포된 MDX:** content/blog/en/weekly-agent-ops-scorecard.mdx, content/blog/ko/weekly-agent-ops-scorecard.mdx  
**기준일:** 2026-04-30  
**콘텐츠 필라:** **P2** (AI 운영·워크플로 개선) - [memory-bank/marketing-pillars-m2.md](../../../memory-bank/marketing-pillars-m2.md)

**프로덕션 호스트:** https://elevate.ai.kr

---

## 1. 이번 캠페인 한눈에

| 항목 | 내용 |
|------|------|
| **타깃(ICP)** | AI 제품 PM, 그로스 운영자, 기술 창업자. |
| **메시지** | 생성 품질만 보면 에이전트 루프의 병목을 놓친다. 주간 운영 스코어카드가 제품·그로스·엔지니어링을 같은 개선 우선순위에 맞춘다. |
| **주요 CTA** | 글 읽기 -> 홈페이지 대기명단. |
| **산출물** | 채널 3 x 언어 2 = **포스트 6개** (각 1안) + 후속 웨이트리스트 각도. |
| **UTM 캠페인명** | blog_agent_scorecard |

**영어 URL:** **`/blog/...`** 만 사용 (**`/en/blog/...` 금지** - 307로 X 카드 깨질 수 있음). [README.md](README.md).

---

## 2. URL 규칙 (글자 수 vs 분석)

소셜 본문에 넣을 링크는 **짧을수록 좋습니다.** 긴 `utm_medium`·`utm_campaign`은 스케줄러의 링크 추적 필드나 리포트 보정에 맡기고, 본문에는 아래 경량 UTM을 우선 사용합니다.

| 용도 | 경량 쿼리 (예시) | 비고 |
|------|------------------|------|
| 영어 글 | `?utm_source=x&utm_content=en` (X) / `threads`·`linkedin` 등 소스만 바꿈 | PostHog에서 소스·locale 구분 |
| 한국어 글 | `?utm_source=x&utm_content=ko` | 동일 |

**전체 UTM** (보고용·스케줄러 입력란):

- `https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=twitter&utm_medium=social&utm_campaign=blog_agent_scorecard&utm_content=en`
- `https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=twitter&utm_medium=social&utm_campaign=blog_agent_scorecard&utm_content=ko`

**웨이트리스트 직행 URL** (후속용):

- 영어: `https://elevate.ai.kr/?utm_source={source}&utm_medium=social&utm_campaign=blog_agent_scorecard&utm_content=waitlist_en#waitlist`
- 한국어: `https://elevate.ai.kr/ko?utm_source={source}&utm_medium=social&utm_campaign=blog_agent_scorecard&utm_content=waitlist_ko#waitlist`

---

## 3. 채널별 글자·형식 한도

| 채널 | 대략 한도 | 붙여넣기 시 주의 |
|------|-----------|------------------|
| **X** | **280** (무료, 가중치 기준) | 한글·한자 등은 글자당 가중치가 높을 수 있음. 붙여넣기 전 X 작성창 숫자를 기준으로 확인. 마크다운 코드펜스 금지. |
| **Threads** | **500자** | 링크는 일반 URL 한 줄. 커뮤니티에 올릴 때는 첫 문장을 더 대화체로 바꿔도 됨. |
| **LinkedIn** | **약 3000자** | B2B 독자에게 문제 -> 관점 -> 실무 액션 -> 링크 순서가 자연스러움. |

아래 각 칸의 **복사 구간**은 빈 줄로만 구분했습니다. 백틱으로 감싸지 말고, 본문·URL·태그를 그대로 붙여 넣으세요.

---

## 4. 해시태그 티어

| 언어 | Tier A (넓은 발견) | Tier B (ICP·문제) | Tier C (브랜드) |
|------|---------------------|-------------------|-----------------|
| EN | `#AI` `#MachineLearning` | `#AIAgents` `#AIProduct` `#MarketingOps` `#GrowthOps` | `#Elevate` |
| KO | `#AI` `#생성형AI` | `#AI에이전트` `#제품기획` `#마케팅운영` `#그로스` | `#Elevate` |

**권장:** X/Threads는 3-5개, LinkedIn은 3-5개를 하단에 배치. 매 포스트마다 같은 조합을 반복하지 말 것.

---

## 5. 채널·언어별 최종 포스트 (각 1개)

### 5.1 X - 영어

Most teams can debate model quality for an hour.

Fewer can answer: how often did the agent loop finish, where did humans repair it, and what changed last week?

New Elevate post: the weekly agent ops scorecard.

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=x&utm_content=en

#AIAgents #AIProduct #Elevate

---

### 5.2 X - 한국어

에이전트가 "좋아졌는지" 말하려면 먼저 루프를 봐야 합니다.

완료율, 사람 수리 시간, 실패 이유, 다음 실험. 주간 스코어카드 하나가 모델 토론보다 더 많은 것을 알려줄 때가 많습니다.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=x&utm_content=ko

#AI에이전트 #생성형AI #Elevate

---

### 5.3 Threads - 영어

A polished agent output can hide a messy loop.

Maybe the operator reformatted the input, deleted invented claims, reran twice, and asked a PM to verify one detail. If nobody tracks that repair work, next week's "improvement" meeting becomes a taste debate.

New Elevate post: how to run a lightweight weekly scorecard for agent workflows.

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=threads&utm_content=en

#AI #AIAgents #MarketingOps #Elevate

---

### 5.4 Threads - 한국어

보기 좋은 에이전트 출력 뒤에는 지저분한 루프가 숨어 있을 수 있습니다.

입력을 다시 정리하고, 지어낸 주장을 지우고, 두 번 재시도하고, PM에게 사실 확인까지 했다면 결과물이 좋아도 운영 비용은 큽니다.

이번 글은 에이전트 워크플로를 매주 개선하기 위한 작은 스코어카드 이야기입니다.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=threads&utm_content=ko

#AI에이전트 #마케팅운영 #제품기획 #Elevate

---

### 5.5 LinkedIn - 영어

Generation quality matters, but it is not enough to improve an agent workflow.

The hidden cost is usually in the loop:

- Did the agent complete the job?
- How much human repair did the output need?
- Where did reviewers lose time?
- What failure reason kept repeating?
- What single experiment should the team test next week?

Those questions are not as exciting as a new model announcement. They are more useful when product, growth, and engineering need to prioritize real improvements.

In the new Elevate post, we outline a weekly agent ops scorecard: seven fields, a 30-minute ritual, and a concrete launch-agent example. The goal is simple: move from "the agent feels better" to "we know what changed, why it changed, and what to test next."

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=linkedin&utm_content=en

#AIAgents #AIProduct #MarketingOps #GrowthOps #Elevate

---

### 5.6 LinkedIn - 한국어

생성 품질은 중요합니다. 하지만 에이전트 워크플로를 개선하기에는 그것만으로 부족합니다.

숨은 비용은 보통 루프 안에 있습니다.

- 에이전트가 일을 끝냈는가?
- 사람 손으로 고친 시간은 얼마나 되는가?
- 리뷰어는 어디서 시간을 잃었는가?
- 어떤 실패 이유가 반복되는가?
- 다음 주에는 무엇 하나를 실험할 것인가?

새 모델 이야기보다 덜 화려하지만, 제품·그로스·엔지니어링이 실제 개선 우선순위를 정할 때는 이런 질문이 더 쓸모 있습니다.

새 Elevate 글에서는 주간 에이전트 운영 스코어카드를 다룹니다. 일곱 가지 항목, 30분짜리 리뷰 리듬, 런칭 에이전트 예시까지 담았습니다. 목표는 단순합니다. "좋아진 것 같다"가 아니라 "무엇이 바뀌었고, 왜 바뀌었고, 다음에는 무엇을 테스트할지 안다"로 가는 것입니다.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=linkedin&utm_content=ko

#AI에이전트 #생성형AI #마케팅운영 #제품기획 #Elevate

---

## 6. 한 줄 요약 (뉴스레터·슬랙·DM)

- **영문:** A weekly agent ops scorecard helps teams improve agent workflows by tracking completion rate, repair time, failure reasons, rubric score, and one next experiment.
- **한글:** 주간 에이전트 운영 스코어카드는 완료율, 수리 시간, 실패 이유, 루브릭 점수, 다음 실험을 함께 보게 만들어 에이전트 개선을 감이 아니라 학습으로 바꿉니다.

---

## 7. 후속 (48시간 안에)

| 시기 | 제안 |
|------|------|
| **+1일** | 본문의 "Most AI teams can tell you which model..." 문장을 인용해 X/Threads에 리마인드. |
| **+2일** | 웨이트리스트 직행 포스트: "Prompt Studio is for teams that want agent and prompt work to become reviewable work." |
| **댓글 대응** | 지표를 어디서 시작할지 묻는 댓글에는 "완료율 + 사람 수리 시간 + 주요 실패 이유" 세 개부터 추천하고 글 링크 연결. |

---

## 8. SEO·메타·OG (참고)

MDX frontmatter: title, description, date, slug, tags, access_tier, locale. 이 글은 별도 `ogImage`를 지정하지 않았으므로 사이트 기본 OG 이미지를 사용합니다.

**배포 후:** [Sharing Debugger](https://developers.facebook.com/tools/debug/) · [X Card Validator](https://cards-dev.twitter.com/validator)

---

## 9. 마무리

[MARKETING_OPS_CHECKLIST.md](../../MARKETING_OPS_CHECKLIST.md) B4 · [BLOG_POST_PIPELINE.md](../../BLOG_POST_PIPELINE.md) §6 · [_TEMPLATE.md](_TEMPLATE.md) · [README.md](README.md)
