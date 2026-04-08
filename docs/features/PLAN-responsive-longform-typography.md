# PLAN — Responsive long-form typography

**Status:** Phase C shipped (CV tune, marketing long pages aligned).  
**Parent intent:** [`memory-bank/tasks.md`](../../../memory-bank/tasks.md) P2 row — mobile resize에서도 블로그·텍스트 헤비 구간이 **성능**과 **시각적 리듬** 모두 나쁘지 않게 보이도록 한다.  
**Aligns with:** [`docs/design/VISUAL_LANGUAGE_V2.md`](../design/VISUAL_LANGUAGE_V2.md) §5 (typography), §7 (motion / `prefers-reduced-motion`).

---

## Goals

| # | Goal |
|---|------|
| G1 | 본문·제목에 **뷰포트에 따라 부드럽게 변하는** 글자 크기 (`clamp`) — 모바일에서 너무 작거나 덩어리만 크지 않게 |
| G2 | **줄간격·단락 간격**을 토큰으로 통일 — MDX(`prose-blog`), 마케팅 긴 섹션, 대시보드 도움말 |
| G3 | **성능**: 긴 목록에 `content-visibility` 시범 적용; 배포 후 **LCP/스크롤**으로 검증 |
| G4 | **모션**: Pretext처럼 레이아웃을 흔드는 애니메이션은 기본 금지; 있을 경우 `prefers-reduced-motion` 준수 |

---

## Phase A — Foundation (done)

- **`src/app/globals.css`**: `--elevate-prose-*` 토큰 + `.prose-blog` 베이스.
- **`src/components/blog/mdx-components.tsx`**: 본문/리스트가 컨테이너 `clamp` 본문 크기를 따르도록 `text-[1em]` 등 정리.
- **`src/app/[locale]/(marketing)/blog/[slug]/page.tsx`**: 글 제목·리드·아티클 폭.

---

## Phase B — Marketing shell + help + list (done)

| Change | Notes |
|--------|--------|
| **`.elevate-marketing-shell`** | `max-width: 1584px` + `--elevate-marketing-gutter-x` (1rem → 1.5rem @sm → 2rem @lg). 홈·블로그 인덱스·`MarketingSection`에서 동일 패딩. |
| **Marketing tokens** | `--elevate-marketing-home-hero-size`, `section-title`, `page-title`, `lead`, `list-title`, `pretext-hero-line-size`. |
| **`--elevate-app-gutter-x`** | 대시보드 도움말 등 앱 내 텍스트 페이지와 마케팅과 **같은 리듬**으로 좌우 여백 정렬. |
| **Home** | 히어로 그리드 `gap`/`py` 모바일 타이트; 필라·역량·대기명단·리소스·CTA 밴드에 토큰 적용. |
| **`PretextHeroStatement`** | Pretext 측정용 probe와 본문 동일 `clamp` 한 줄 크기. |
| **Blog index** | 행 제목 `list-title`; 본문 `prose-body`; 링크 패딩 `p-5 sm:p-6`. |
| **`.elevate-cv-list-item`** | `content-visibility: auto` + `contain-intrinsic-size` (see Phase C). |
| **Help** | `rounded-lg` 카드, 타이포 토큰, 헤더/본문 `px`를 `app-gutter`로 통일. |

---

## Phase C — Measure & tune (done)

| Step | Action |
|------|--------|
| C1 | **Lighthouse (manual):** 프로덕션 또는 `pnpm build && pnpm start` 후 Chrome → Lighthouse → Mobile. 대상: `/`, `/[locale]/blog`. LCP 요소가 히어로/폰트인지 확인. |
| C2 | **`--elevate-cv-list-row-intrinsic`** 기본값 **8.5rem** (블로그 행 2줄+패딩 근사). `globals.css` `:root`에서 조정. 스크롤 점프가 크면 올리고, 여백이 과하면 내림. 끄려면 클래스 제거 또는 값 `0`에 가깝게. |
| C3 | **`MarketingArticle`** (`product/[slug]`, `solutions/[slug]`): `elevate-marketing-shell` + 제목/리드/섹션 토큰 + `max-w-[min(45rem,100%)]` (블로그 글과 동일 리듬). **Product / Solutions 인덱스** 그리드: `rounded-xl` + 토큰 타이포. **Pricing**: shell + 히어로·비교·FAQ 토큰 정렬. |
| C4 | `container-type` / CQ — **보류** (필요 시 카드 내부만). |

### Lighthouse one-liner (로컬 프로덕션 빌드)

```bash
pnpm build && pnpm start
# Chrome → DevTools → Lighthouse → 모바일, URL /en/blog 등
```

---

## Files (SoT)

| Area | Path |
|------|------|
| Tokens + shells | `src/app/globals.css` |
| MDX mapping | `src/components/blog/mdx-components.tsx` |
| Blog post | `src/app/[locale]/(marketing)/blog/[slug]/page.tsx` |
| Blog list | `src/app/[locale]/(marketing)/blog/page.tsx` |
| Marketing section header | `src/components/marketing/marketing-section.tsx` |
| Long-form marketing article | `src/components/marketing/marketing-article.tsx` |
| Home | `src/app/[locale]/(marketing)/page.tsx` |
| Product index | `src/app/[locale]/(marketing)/product/page.tsx` |
| Solutions index | `src/app/[locale]/(marketing)/solutions/page.tsx` |
| Pricing | `src/app/[locale]/(marketing)/pricing/page.tsx` |
| Pretext | `src/components/marketing/pretext-hero-statement.tsx` |
| Help | `src/app/(dashboard)/dashboard/help/page.tsx` |
| Ebook reader | `src/app/(dashboard)/dashboard/library/[slug]/read/page.tsx` |

---

## Out of scope (for this plan)

- 새 웹폰트 라이선스(V2와 동일하게 Geist 유지).
- 블로그 전체 리디자인(히어로·TOC·댓글 등).

---

## References

- [`VISUAL_LANGUAGE_V2.md`](../design/VISUAL_LANGUAGE_V2.md)  
- [`SYSTEM.md`](../design/SYSTEM.md)
