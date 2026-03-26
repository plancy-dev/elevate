# i18n 미적용 범위 & 네임스페이스 설계 초안

> 코드 기준 스냅샷. `messages/*.json` 키 패리티는 유지된 상태에서, **아래 네임스페이스를 추가·연동**하면 마케팅 전역 다국어를 완성할 수 있다.

---

## 1. 라우트별 적용 여부

### 1.1 이미 `messages` + `getTranslations` / `useTranslations` 연동됨

| 경로 | 파일 | 사용 중인 네임스페이스 |
|------|------|------------------------|
| `/[locale]` (홈) | `src/app/[locale]/(marketing)/page.tsx` | `Metadata`, `Home` |
| `/[locale]/privacy` | `.../privacy/page.tsx` | `Metadata`, `Privacy` |
| `/[locale]/terms` | `.../terms/page.tsx` | `Metadata`, `Terms` |

### 1.2 레이아웃·공통 컴포넌트 (마케팅 셸)

| 구분 | 파일 | 네임스페이스 |
|------|------|----------------|
| 헤더 | `src/components/layout/header.tsx` | `Nav` |
| 푸터 | `src/components/layout/footer.tsx` | `Footer`, `Nav` |
| KPI 미리보기 | `src/components/marketing/kpi-dashboard-preview.tsx` | `KpiPreview` |
| 언어/테마 | `language-switcher.tsx`, `theme-toggle.tsx` | `LanguageSwitcher`, `ThemeToggle` |

### 1.3 미적용 — 본문·메타가 영어 하드코딩 또는 로컬 `copy` 객체

아래는 **`messages`를 읽지 않음**. 우선순위는 트래픽·전환 기준으로 조정.

| 우선순위 | 경로 | 파일 | 비고 |
|----------|------|------|------|
| P1 | `/[locale]/pricing` | `pricing/page.tsx` | `metadata` 영문 고정, 본문 전부 영어 |
| P1 | `/[locale]/contact` | `contact/page.tsx` | 동일 |
| P1 | `/[locale]/demo` | `demo/page.tsx` | 동일 |
| P2 | `/[locale]/product` | `product/page.tsx` | 동일 |
| P2 | `/[locale]/product/[slug]` | `product/[slug]/page.tsx` | `copy` Record로 영어 (4슬러그) |
| P2 | `/[locale]/solutions` | `solutions/page.tsx` | 동일 |
| P2 | `/[locale]/solutions/[slug]` | `solutions/[slug]/page.tsx` | `copy` Record로 영어 (4슬러그) |
| P3 | `/[locale]/about` | `about/page.tsx` | 동일 |
| P3 | `/[locale]/resources` | `resources/page.tsx` | 동일 |
| P3 | `/[locale]/case-studies` | `case-studies/page.tsx` | 동일 |
| P3 | `/[locale]/security` | `security/page.tsx` | 동일 |
| P3 | `/[locale]/compliance` | `compliance/page.tsx` | 동일 |
| P3 | `/[locale]/blog` | `blog/page.tsx` | 동일 |
| P3 | `/[locale]/careers` | `careers/page.tsx` | 동일 |

**동적 슬러그 ↔ 코드 키 (이미 존재하는 링크와 일치해야 함)**

- Product: `event-management`, `attendee-engagement`, `analytics`, `ai-concierge`
- Solutions: `conferences`, `exhibitions`, `incentive-travel`, `corporate-meetings`

### 1.4 마케팅 범위 밖 (의도적 비번역 가능)

| 경로 그룹 | 이유 |
|-----------|------|
| `(auth)/*`, `(dashboard)/*` | 앱 셸; 별도 로드맵에서 `messages` 또는 별도 번들 |

---

## 2. 네임스페이스 설계 초안

### 2.1 원칙

1. **페이지 단위 상위 네임스페이스** — `Pricing`, `Contact`, `About`처럼 라우트와 1:1에 가깝게 둔다.
2. **슬러그 페이지** — 중첩 객체로 슬러그 키를 고정해 오타를 줄인다.
3. **`Metadata` 확장** — 탭 제목·OG는 `Metadata.pages.*` 또는 각 페이지 네임스페이스의 `metaTitle` / `metaDescription` 중 하나로 통일.
4. **기존 키 이름 변경 금지** — `Home`, `Nav` 등 이미 쓰는 키는 깨지지 않게 유지.

### 2.2 현재 `messages`에 이미 있는 네임스페이스 (유지)

```
Metadata
Nav
Footer
Home
KpiPreview
Privacy
Terms
LanguageSwitcher
ThemeToggle
```

### 2.3 추가 제안 (초안)

#### A. 정적 단일 페이지 (각각 독립 네임스페이스)

| 네임스페이스 | 용도 | 대표 키 예시 |
|--------------|------|----------------|
| `Pricing` | 요금 | `metaTitle`, `heroTitle`, `heroSub`, `planStarterName`, `ctaContact`, … |
| `Contact` | 연락 | `metaTitle`, `heading`, `formLabels.*`, … |
| `Demo` | 데모 요청 | `metaTitle`, `heading`, `sub`, … |
| `About` | 소개 | `metaTitle`, `heading`, … |
| `Resources` | 리소스 | `metaTitle`, `heading`, … |
| `CaseStudies` | 사례 | `metaTitle`, `heading`, … |
| `Security` | 보안 | `metaTitle`, `sections.*` |
| `Compliance` | 컴플라이언스 | `metaTitle`, `sections.*` |
| `Blog` | 블로그 | `metaTitle`, `heading`, … |
| `Careers` | 채용 | `metaTitle`, `heading`, … |

#### B. 인덱스 + 슬러그 분리

| 네임스페이스 | 용도 |
|--------------|------|
| `Product` | `/product` 랜딩 — `metaTitle`, `heroTitle`, 카드 링크 문구 등 |
| `ProductSlug` | `/product/[slug]` — 아래 구조 |

```json
"ProductSlug": {
  "event-management": {
    "metaTitle": "...",
    "title": "...",
    "body": "..."
  },
  "attendee-engagement": { ... },
  "analytics": { ... },
  "ai-concierge": { ... }
}
```

| 네임스페이스 | 용도 |
|--------------|------|
| `Solutions` | `/solutions` 인덱스 |
| `SolutionsSlug` | `/solutions/[slug]` — `conferences`, `exhibitions`, `incentive-travel`, `corporate-meetings` 동일 패턴 |

```json
"SolutionsSlug": {
  "conferences": { "metaTitle": "...", "title": "...", "body": "..." },
  "exhibitions": { ... },
  "incentive-travel": { ... },
  "corporate-meetings": { ... }
}
```

#### C. `Metadata` 확장 (선택)

전 페이지 `<title>`을 한곳에서 쓰려면:

```json
"Metadata": {
  "homeTitle": "...",
  "pages": {
    "pricing": "Pricing | Elevate",
    "contact": "Contact | Elevate",
    "product": "Product | Elevate"
  }
}
```

또는 각 페이지 네임스페이스에만 `metaTitle`을 두고 `generateMetadata`에서 `getTranslations('Pricing')('metaTitle')` 형태로 통일.

---

## 3. 구현 시 코드 패턴 (참고)

- 정적 페이지: `setRequestLocale(locale)` + `getTranslations('Pricing')`.
- 슬러그: `const t = await getTranslations('ProductSlug');` 후 `t(\`${slug}.title\`)`는 **next-intl에서 동적 키**가 까다로울 수 있음 → `t.has(slug)` 검증 후 `useMemo` 대신 **객체 전체를 `getTranslations`로 받지 말고**, `getTranslations({ namespace: 'ProductSlug' })` + `raw` 또는 **키를 명시적으로 매핑**:

  ```ts
  const keys = { "event-management": "eventManagement" } as const;
  // 또는 messages JSON에서 camelCase 서브키로 통일
  ```

실무에서는 **슬러그를 JSON 키와 동일**하게 두는 현재 방식(`event-management`)이 가장 단순하다.

---

## 4. 권장 롤아웃 순서

1. **P1** — `Pricing`, `Contact`, `Demo` (네임스페이스 + 페이지 연동 + `generateMetadata`)
2. **P2** — `Product`, `ProductSlug`, `Solutions`, `SolutionsSlug`
3. **P3** — 나머지 정적 페이지 + `Metadata.pages` 정리
4. **CI** — 스크립트로 `en.json` 기준 다른 로케일 키 동일성 검사 (`package.json`에 `i18n:check` 등)

---

## 5. 파일 체크리스트 (미적용 페이지 = 아래 파일 수정 필요)

- [ ] `src/app/[locale]/(marketing)/pricing/page.tsx`
- [ ] `src/app/[locale]/(marketing)/contact/page.tsx`
- [ ] `src/app/[locale]/(marketing)/demo/page.tsx`
- [ ] `src/app/[locale]/(marketing)/product/page.tsx`
- [ ] `src/app/[locale]/(marketing)/product/[slug]/page.tsx`
- [ ] `src/app/[locale]/(marketing)/solutions/page.tsx`
- [ ] `src/app/[locale]/(marketing)/solutions/[slug]/page.tsx`
- [ ] `src/app/[locale]/(marketing)/about/page.tsx`
- [ ] `src/app/[locale]/(marketing)/resources/page.tsx`
- [ ] `src/app/[locale]/(marketing)/case-studies/page.tsx`
- [ ] `src/app/[locale]/(marketing)/security/page.tsx`
- [ ] `src/app/[locale]/(marketing)/compliance/page.tsx`
- [ ] `src/app/[locale]/(marketing)/blog/page.tsx`
- [ ] `src/app/[locale]/(marketing)/careers/page.tsx`

이 문서는 구현 시 삭제·갱신해도 된다.
