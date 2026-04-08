# 배포 팩: the-prompt-is-your-product-surface

이 문서는 **운영자(당신)가 전략을 이해한 뒤** 스케줄러에 넣을 때 쓰는 메모입니다.

**배포된 MDX:** content/blog/en/the-prompt-is-your-product-surface.mdx, content/blog/ko/the-prompt-is-your-product-surface.mdx  
**기준일:** 2026-04-07  
**콘텐츠 필라:** **P1** (프롬프트 작성·모델) — [memory-bank/marketing-pillars-m2.md](../../../memory-bank/marketing-pillars-m2.md)

**프로덕션 호스트:** https://elevate.ai.kr

---

## 1. 이번 캠페인 한눈에

| 항목 | 내용 |
|------|------|
| **타깃(ICP)** | 고객-facing AI 카피를 실제로 싣는 마케팅·운영·프로덕트 리드. |
| **메시지** | 프롬프트는 채팅이 아니라 **제품 표면**(브랜드·컴플라이언스·전환). |
| **산출물** | 채널 3 × 언어 2 = **포스트 6개** (각 1안). |
| **UTM 캠페인명** | blog_prompt_surface (짧은 링크에는 §2의 **경량 UTM**만 사용). |

**영어 URL:** **`/blog/...`** 만 사용 (**`/en/blog/...` 금지** — 307로 X 카드 깨짐). [README.md](README.md).

---

## 2. URL 규칙 (글자 수 vs 분석)

소셜 본문에 넣을 링크는 **짧을수록 좋습니다.** 긴 `utm_medium`·`utm_campaign`은 **스케줄러의 “링크 단축/숨김 UTM”**이나 **리포트에서 캠페인 보정**에 맡기고, 트윗 안에는 아래 **경량**만 씁니다.

| 용도 | 경량 쿼리 (예시) | 비고 |
|------|------------------|------|
| 영어 글 | `?utm_source=x&utm_content=en` (X) / `threads`·`linkedin` 등 소스만 바꿈 | PostHog에서 소스·locale 구분 가능 |
| 한국어 글 | `?utm_source=x&utm_content=ko` | 동일 |

**전체 UTM** (보고용·스케줄러 입력란):

- `https://elevate.ai.kr/blog/the-prompt-is-your-product-surface?utm_source=twitter&utm_medium=social&utm_campaign=blog_prompt_surface&utm_content=en`
- 한국어: `.../ko/blog/...&utm_content=ko`

---

## 3. 채널별 글자·형식 한도

| 채널 | 대략 한도 | 붙여넣기 시 주의 |
|------|-----------|------------------|
| **X** | **280** (무료, **가중치** 기준) | 한글·한자 등은 **글자당 가중치 2**에 가깝고, URL은 실제 길이와 무관하게 **23**으로 칩니다. **유니코드 글자 수만 세면 한도 안에 들어와도 초과**할 수 있으니, 붙여넣기 전 **X 작성창 숫자**를 기준으로 하세요. **마크다운 코드펜스(\`\`\`) 금지** — 링크가 “텍스트 블록”이 되면 카드 미리보기가 안 붙을 수 있음. |
| **Threads** | **500자** | 동일. 링크는 일반 URL 한 줄. |
| **LinkedIn** | **약 3000자** (일반 게시물) | 본문은 여유 있음. URL은 여전히 일반 링크로. |

**Threads 커뮤니티:** 공식 계정이 **AI Threads** 같은 주제 커뮤니티에 참여 중이면, 글을 **커뮤니티에 올릴지 / 일반 피드에 올릴지**에 따라 노출·반응이 달라질 수 있다. §4.3·4.4 카피는 **겸용**으로 두었고, 커뮤니티 전용으로 한 줄 더 대화체·현장감을 붙이는 것은 선택. 운영·UTM 규칙은 [`MARKETING_OPS_CHECKLIST.md`](../../MARKETING_OPS_CHECKLIST.md) **§E1a3**.

아래 각 칸의 **“복사 구간”**은 빈 줄로만 구분했습니다. **백틱(\`)으로 감싸지 말고**, X 작성창에 **드래그해서 한 번에** 넣어도 되고, **본문 / URL / 태그**를 나눠 넣어도 됩니다.

---

## 4. 채널·언어별 최종 포스트 (각 1개)

### 4.1 X — 영어

**전체 길이:** 유니코드 277자 · **가중치 ~211**(추정) / 한도 280

Landing copy drifts, you fix it. Prompt text drifts per reply—no owner. That's the risk.

First post: sentence = surface, 3 habits, Prompt Studio frame.

https://elevate.ai.kr/blog/the-prompt-is-your-product-surface?utm_source=x&utm_content=en

#PromptEngineering #B2B #Elevate

---

### 4.2 X — 한국어

**전체 길이:** 유니코드 227자 · **가중치 ~223**(추정) / 한도 280 — 한글 비중이 높으면 유니코드 길이만으로는 부족할 수 있음(동일 구조 이전안은 유니코드 270·가중치 ~296으로 초과).

랜딩은 잠그는데, 프롬프트는 답마다 흔들리고 주인이 없다. 대시보드엔 안 뜨고, 고객은 느낀다.

첫 글: 문장=제품 표면, 이번 주 습관 3, Prompt Studio를 왜 만드는지—GTM·거버넌스.

https://elevate.ai.kr/ko/blog/the-prompt-is-your-product-surface?utm_source=x&utm_content=ko

#프롬프트 #B2B #Elevate

---

### 4.3 Threads — 영어

**전체 길이:** 476자 / 한도 500자

We fought over homepage copy. Now the brand promise gets rewritten in LLM threads—no owner on the sentence. Dashboards won't show it; customers feel it.

Prompts aren't side chat: sentence-level GTM. Tone, compliance, conversion land there first.

Post: unowned prompts as rework tax, 3 Monday habits, Prompt Studio—practical, not a keynote.

https://elevate.ai.kr/blog/the-prompt-is-your-product-surface?utm_source=threads&utm_content=en

#AI #PromptEngineering #B2B #Elevate

---

### 4.4 Threads — 한국어

**전체 길이:** 432자 / 한도 500자

예전엔 랜딩 카피 한 줄에 회의가 열렸죠. 지금은 LLM 스레드 안에서 브랜드 약속이 매번 다시 쓰이는데, 그 문장의 주인은 없습니다. 대시보드엔 안 뜨고, 고객은 바로 느낍니다.

멀티턴에서는 작은 변형이 쌓여 ‘브랜드가 흔들린다’는 인상으로 번지기 쉽습니다.

프롬프트는 잡담이 아니라 문장 단위 GTM입니다. 톤·컴플라이언스·전환은 거기서 먼저 갈라집니다.

첫 블로그에서 주인 없는 프롬프트가 왜 재작업 세금이 되는지, 이번 주 습관 3가지, Prompt Studio를 왜 만드는지까지—키노트가 아니라 실무 언어로 정리했습니다.

https://elevate.ai.kr/ko/blog/the-prompt-is-your-product-surface?utm_source=threads&utm_content=ko

#프롬프트엔지니어링 #B2B #생성형AI #Elevate

---

### 4.5 LinkedIn — 영어

**전체 길이:** 1042자 / 한도 ~3000자

Your LLM isn't failing in public because the model is "bad." It's failing quietly—one sentence at a time—because nobody owns the prompt as customer-facing product copy.

Here's the uncomfortable pattern I keep seeing:

- Marketing treats prompts like internal chat.
- Compliance sees a PDF policy, not the live thread.
- Product ships a feature, but the wording drifts per reply.

The result isn't a single bug ticket. It's brand drift, rework in Slack, and conversion leaks that never show up on a dashboard.

I wrote the first Elevate post on what changes when you treat prompts as a product surface: the GTM failure mode, three habits you can run this week (no purchase required), and why we're building Prompt Studio with English + Korean content first—because bilingual teams ship bilingual risk.

If a reviewable prompt layer belongs on your roadmap, we're collecting interest on the site.

https://elevate.ai.kr/blog/the-prompt-is-your-product-surface?utm_source=linkedin&utm_content=en

#PromptEngineering #B2B #Marketing #AI #Elevate

---

### 4.6 LinkedIn — 한국어

**전체 길이:** 665자 / 한도 ~3000자

LLM이 ‘공개적으로’ 망가지는 이유가 항상 모델 성능만은 아닙니다. 더 자주 보이는 건 **프롬프트가 고객-facing 문장인데도 조직 안에서 주인이 없는 상태**입니다.

현장에서 반복되는 패턴은 이렇습니다.

- 마케팅은 프롬프트를 ‘내부 채팅’ 취급합니다.
- 컴플라이언스는 PDF 정책만 보고, 실제 스레드의 문장 변형은 못 봅니다.
- 프로덕트는 기능을 올리지만, 답장마다 표현이 미세하게 흔들립니다.

그래서 생기는 건 단일 버그 한 건이 아니라, 브랜드 흔들림·슬랙 재작업·전환 누수처럼 대시보드에 안 잡히는 비용입니다.

Elevate 블로그 첫 글에서 프롬프트를 **제품 표면**으로 보는 관점, 그 실패 모드를 GTM·거버넌스 언어로 풀었고, 이번 주에 바로 돌릴 습관 3가지와 Prompt Studio를 왜 만드는지도 같이 적었습니다. 영·한 콘텐츠를 먼저 다루는 이유도 포함했습니다—이중언어 팀은 이중언어 리스크를 같이 실어나르니까요.

Prompt Studio 방향이 로드맵과 맞으면, 사이트에서 대기명단으로 알려주세요.

https://elevate.ai.kr/ko/blog/the-prompt-is-your-product-surface?utm_source=linkedin&utm_content=ko

#프롬프트엔지니어링 #B2B #마케팅 #AI #Elevate

---

## 5. 한 줄 요약 (뉴스레터·슬랙·DM)

- **영문:** The leak is unowned customer-facing copy (prompts), not “bad models”—plus three habits that stress-test whether your org can govern AI at the sentence.
- **한글:** 먼저 터지는 건 모델이 아니라 ‘문장의 주인 없음’—그리고 조직이 문장 단위로 AI를 통제할 수 있는지 가르는 습관 세 가지.

---

## 6. 후속 (선택)

| 시기 | 제안 |
|------|------|
| **+1~2일** | 같은 글을 **인용**으로 한 줄만 따서 재게시. |
| **별도** | 웨이트리스트 단독 캠페인은 §8 URL + 짧은 한 줄. |

---

## 7. SEO·메타·OG (참고)

MDX: title, description, date, ogImage — 히어로는 public/blog/the-prompt-is-your-product-surface/hero.jpg.

**배포 후:** [Sharing Debugger](https://developers.facebook.com/tools/debug/) · [X Card Validator](https://cards-dev.twitter.com/validator)

---

## 8. UTM·웨이트리스트 직행 URL (후속용)

| 로케일 | URL (전체 UTM 예시) |
|--------|---------------------|
| 영어 | https://elevate.ai.kr/?utm_source={source}&utm_medium=social&utm_campaign=blog_prompt_surface&utm_content=waitlist_en#waitlist |
| 한국어 | https://elevate.ai.kr/ko?utm_source={source}&utm_medium=social&utm_campaign=blog_prompt_surface&utm_content=waitlist_ko#waitlist |

---

## 9. 마무리

[MARKETING_OPS_CHECKLIST.md](../../MARKETING_OPS_CHECKLIST.md) B4 · [BLOG_POST_PIPELINE.md](../../BLOG_POST_PIPELINE.md) §3 · [_TEMPLATE.md](_TEMPLATE.md) · [README.md](README.md)
