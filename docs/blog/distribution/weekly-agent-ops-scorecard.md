# 배포 팩: weekly-agent-ops-scorecard

이 문서는 **운영자(당신)가 전략을 이해한 뒤** 스케줄러에 넣을 때 쓰는 메모입니다.

**배포된 MDX:** content/blog/en/weekly-agent-ops-scorecard.mdx, content/blog/ko/weekly-agent-ops-scorecard.mdx  
**기준일:** 2026-05-18  
**콘텐츠 필라:** **P3** (일하는 방식의 AI / 워크플로) - [memory-bank/marketing-pillars-m2.md](../../../memory-bank/marketing-pillars-m2.md)

**프로덕션 호스트:** https://elevate.ai.kr

---

## 1. 이번 캠페인 한눈에

| 항목 | 내용 |
|------|------|
| **타깃(ICP)** | AI 제품 PM, 그로스 운영자, 기술 창업자. |
| **메시지** | 에이전트 개선은 모델 감상평이 아니라 실행 수, 통과율, 개입률, 수정 시간, 실패 분류를 매주 보는 운영 습관에서 나온다. |
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
| EN | `#AI` `#MachineLearning` | `#AIAgents` `#AIProduct` `#MarketingOps` `#ProductOps` | `#Elevate` |
| KO | `#AI` `#생성형AI` | `#AI에이전트` `#제품기획` `#마케팅운영` `#업무자동화` | `#Elevate` |

**권장:** X/Threads는 3-5개, LinkedIn은 3-5개를 하단에 배치. 매 포스트마다 같은 조합을 반복하지 말 것.

---

## 5. 채널·언어별 최종 포스트 (각 1개)

### 5.1 X - 영어

Most agent reviews get stuck on "the output feels better."

Better than what? On which inputs? With how much human cleanup?

The weekly scorecard is the missing operating layer.

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=x&utm_content=en

#AIAgents #AIProduct #Elevate

---

### 5.2 X - 한국어

에이전트 리뷰가 "답변이 좋아진 것 같아요"에서 멈추면 개선이 어렵습니다.

실행 수, 통과율, 개입률, 수정 시간, 실패 분류를 매주 보면 대화가 달라집니다.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=x&utm_content=ko

#AI에이전트 #제품기획 #Elevate

---

### 5.3 Threads - 영어

A better model can help. But if your team cannot reproduce why an agent run improved, you still do not have an improvement loop.

New Elevate post: a practical weekly agent ops scorecard for product, growth, and engineering teams. Runs completed, pass rate, intervention rate, rework minutes, failure categories, and one change at a time.

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=threads&utm_content=en

#AI #AIAgents #ProductOps #Elevate

---

### 5.4 Threads - 한국어

모델이 좋아지는 건 중요합니다. 하지만 팀이 왜 좋아졌는지 재현하지 못하면 개선 루프는 아직 없습니다.

이번 Elevate 글은 제품, 그로스, 엔지니어링이 함께 볼 수 있는 주간 에이전트 운영 스코어카드를 다룹니다. 실행 수, 통과율, 개입률, 수정 시간, 실패 분류, 그리고 한 번에 하나의 변경.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=threads&utm_content=ko

#생성형AI #AI에이전트 #마케팅운영 #Elevate

---

### 5.5 LinkedIn - 영어

The most useful agent review question is not "which model feels best?"

It is: "what actually improved this week?"

That question gets uncomfortable fast if the team is only comparing outputs by taste. The prompt changed, the examples changed, the reviewer changed, the input set changed, and now everyone has a story but nobody has a loop.

The new Elevate post lays out a weekly agent ops scorecard for teams moving from AI demos into product, growth, support, research, and internal workflows.

Start with simple operational metrics:

- Runs completed
- Review pass rate
- Human intervention rate
- Rework minutes
- Failure categories
- Evidence coverage
- Change notes

The point is not dashboard theater. It is giving product, growth, and engineering a shared way to decide what to improve next.

If your agent loop matters, measure it weekly.

https://elevate.ai.kr/blog/weekly-agent-ops-scorecard?utm_source=linkedin&utm_content=en

#AIAgents #AIProduct #MarketingOps #ProductOps #Elevate

---

### 5.6 LinkedIn - 한국어

에이전트 리뷰에서 가장 중요한 질문은 "어떤 모델이 더 좋아 보이나?"가 아닙니다.

"이번 주에 무엇이 실제로 나아졌나?"입니다.

이 질문은 생각보다 빨리 불편해집니다. 프롬프트가 바뀌고, 예시가 바뀌고, 리뷰어 기준이 바뀌고, 입력도 달라졌는데 결과물만 보고 이야기하면 모두 자기만의 해석을 갖게 됩니다. 루프는 남지 않습니다.

새 Elevate 글에서는 AI 데모를 넘어 제품, 그로스, 고객지원, 리서치, 내부 운영에 에이전트를 넣는 팀을 위한 주간 운영 스코어카드를 다룹니다.

처음 볼 지표는 단순합니다.

- 완료 실행 수
- 리뷰 통과율
- 사람 개입률
- 수정 시간
- 실패 분류
- 근거 연결
- 변경 메모

목적은 대시보드를 꾸미는 것이 아닙니다. 제품, 그로스, 엔지니어링이 다음에 무엇을 개선할지 같은 언어로 정하게 만드는 것입니다.

에이전트 루프가 중요하다면 매주 측정해야 합니다.

https://elevate.ai.kr/ko/blog/weekly-agent-ops-scorecard?utm_source=linkedin&utm_content=ko

#AI에이전트 #생성형AI #제품기획 #마케팅운영 #Elevate

---

## 6. 한 줄 요약 (뉴스레터·슬랙·DM)

- **영문:** A weekly agent ops scorecard turns agent improvement from output taste debates into measurable product, growth, and engineering work.
- **한글:** 주간 에이전트 운영 스코어카드는 "답변이 좋아 보인다"는 감상평을 제품·그로스·엔지니어링이 함께 개선할 수 있는 루프로 바꿉니다.

---

## 7. 후속 (48시간 안에)

| 시기 | 제안 |
|------|------|
| **+1일** | 본문의 "Better than what? On which inputs?" 질문을 인용해 X/Threads 리마인드. |
| **+2일** | 웨이트리스트 직행 포스트: "Prompt Studio is for teams turning agent work into reviewable, repeatable loops." |
| **댓글 대응** | 측정 시작을 묻는 댓글에는 "실행 수, 통과율, 개입률, 수정 시간부터 2주만 기록" 팁으로 답변하고 글 링크 연결. |

---

## 8. SEO·메타·OG (참고)

MDX frontmatter: title, description, date, slug, tags, access_tier, locale. 이 글은 별도 `ogImage`를 지정하지 않았으므로 사이트 기본 OG 이미지를 사용합니다.

**배포 후:** [Sharing Debugger](https://developers.facebook.com/tools/debug/) · [X Card Validator](https://cards-dev.twitter.com/validator)

---

## 9. 마무리

[MARKETING_OPS_CHECKLIST.md](../../MARKETING_OPS_CHECKLIST.md) B4 · [BLOG_POST_PIPELINE.md](../../BLOG_POST_PIPELINE.md) §6 · [_TEMPLATE.md](_TEMPLATE.md) · [README.md](README.md)
