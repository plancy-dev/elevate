# PostHog — 마케팅 대시보드 저장하기 (M5)

**목적:** **M5**(“PostHog UI에 퍼널을 저장”)를 **한 번에** 끝냅니다. 코드 배포는 필요 없습니다.  
**전제:** 프로덕션에 `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (`phc_…`)이 설정되어 있고, PostHog에서 **Activity** 또는 **Live events**로 이벤트가 보여야 합니다. 안 보이면 먼저 환경을 맞추세요. [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md)의 문제 해결(troubleshooting) 절을 따릅니다.

**공식 문서:** [Funnels](https://posthog.com/docs/product-analytics/funnels) · [Dashboards](https://posthog.com/docs/product-analytics/dashboards) (UI는 영문일 수 있음)

---

## 소요 시간

이벤트가 들어오기 시작한 뒤, 대략 **15분** 안에 끝낼 수 있도록 잡으면 됩니다.

---

## 절차 (순서대로)

1. **대시보드 만들기** (없을 때만)  
   - 왼쪽/상단 메뉴에서 **Dashboards** → **New dashboard** → 이름: **`Elevate — Marketing`**.

2. **퍼널 A — 블로그 → 대기명단**  
   - **New insight** → **Funnel**  
   - 1단계: `elevate_blog_post_viewed`  
   - 2단계: `elevate_waitlist_submitted`  
   - 전환 기간(Conversion window): **14 days** (나중에 조정 가능)  
   - **Save** → 인사이트 이름: **`Elevate — Funnel A — blog → waitlist`**  
   - **Add to dashboard** → `Elevate — Marketing` 선택.

3. **퍼널 B — 히어로 CTA → 대기명단** (최소 CTA 하나)  
   - 새 **Funnel** → 1단계: `elevate_marketing_cta_click` 에 필터 **`cta_id` = `hero_waitlist_anchor`** → 2단계: `elevate_waitlist_submitted`  
   - 저장 이름: **`Elevate — Funnel B — hero_waitlist_anchor → waitlist`** → 같은 대시보드에 추가.

4. **트렌드(주간)**  
   - **Trends** → 이벤트 `elevate_blog_post_viewed` → 간격(interval) **Week** → 저장 이름 **`Elevate — Trend — blog_post_viewed (weekly)`** → 대시보드에 추가.  
   - 동일하게 **`elevate_waitlist_submitted`** 도 한 번 더 만듭니다.

5. **고정 / 공유**  
   - **`Elevate — Marketing`** 대시보드를 열어 타일이 모두 로드되는지 확인 → 대시보드 URL을 Slack·북마크 등에 복사해 팀과 공유합니다.

추가 제품 타일(선택): 같은 레시피 모음은 [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md)의 Funnel D, E 및 인사이트 이름 표를 참고하세요.

---

## 완료 조건

- [ ] **`Elevate — Marketing`** 대시보드가 있고, 비어 있지 않다.  
- [ ] **퍼널 A**와 **트렌드 최소 1개**가 **저장**된 상태다(임시 초안만이 아님).  
- [ ] 팀이 그 대시보드를 가리키는 **정식 링크 하나**를 갖고 있다.

**레포 / Phase M5:** 위 단계는 **PostHog 웹 UI에서 하는 운영 작업**이며 git에 커밋되지 않습니다. `memory-bank/tasks.md`의 M5는 “레시피 + 절차 문서화”까지를 범위로 두고, 여기 체크박스를 채우면 제품·운영 관점에서 M5를 완료한 것으로 보면 됩니다.

---

## 자동화하지 않는 이유

PostHog 대시보드는 **프로젝트 UI**에서 만드는 것을 전제로 해서, 필터·분해(breakdown)·소유권이 운영자에게 남도록 되어 있습니다. 레포에는 **이벤트 이름**(`src/lib/analytics/posthog-events.ts`)과 **레시피**만 두고, API로 대시보드를 자동 생성하는 것은 다루지 않습니다.
