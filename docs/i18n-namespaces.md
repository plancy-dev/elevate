# i18n — namespaces & route coverage (Elevate)

**갱신: 2026-04.** 권위 있는 키 목록은 **`messages/en.json`** (다른 로케일은 동일 키 — [`tests/unit/messages-locale-parity.test.ts`](../tests/unit/messages-locale-parity.test.ts)).

---

## 1. 원칙

1. **페이지/기능별 네임스페이스** — `Dashboard`, `Pricing`, `AccessPending` 등으로 나누고, `generateMetadata`는 `Metadata` 또는 해당 네임스페이스의 `metaTitle`을 사용한다.
2. **키 패리티** — `en` 기준으로 `ko`, `ja`, `zh-CN`, `zh-TW`가 동일 키를 갖는다 (CI 테스트).
3. **마케팅** — `[locale]/(marketing)/*`는 `setRequestLocale(locale)` + `getTranslations`가 일반적이다.

---

## 2. `messages/en.json` 상위 네임스페이스 (요약)

| Namespace | 용도 |
|-----------|------|
| `Metadata`, `Nav`, `Footer`, `Waitlist`, `Home`, `KpiPreview` | 글로벌 마케팅·홈 |
| `Privacy`, `Terms`, `LanguageSwitcher`, `ThemeToggle` | 법적·크롬 |
| `Contact`, `Demo`, `About`, `Blog`, `Careers`, `CaseStudies` | 정적 마케팅 페이지 |
| `SecurityPage`, `CompliancePage` | 보안·컴플라이언스 |
| `Product`, `ProductSlug`, `Solutions`, `SolutionsSlug`, `Pricing` | 제품·솔루션·가격 |
| `AccessPending` | `/access-pending` (대시보드 접근 대기) |
| `Dashboard` | 앱 셸·대시보드 페이지 (`(dashboard)`) |

세부 키는 JSON을 직접 참고한다.

---

## 3. 라우트 ↔ 메시지 (대표)

| 경로 그룹 | 메시지 사용 |
|-----------|-------------|
| `/[locale]/(marketing)/*` | 위 마케팅 네임스페이스 (페이지별로 `getTranslations` 연동) |
| `(auth)/login`, `signup`, … | 앱 복사 — 일부 `messages` 또는 컴포넌트 로컬 (기존 패턴 유지) |
| `(auth)/access-pending` | `AccessPending` + `getAppLocale()` |
| `(dashboard)/*` | `Dashboard.*` 및 하위 네임스페이스 |

`/resources`는 `/blog` 등으로 **리다이렉트**된다 (`next.config.ts` / `proxy`).

---

## 4. 구현 패턴 (참고)

- **슬러그 페이지** (`ProductSlug`, `SolutionsSlug`): JSON 키가 URL 슬러그와 맞춰져 있다 (`event-management` 등). 동적 키 접근 시 `t.has()` 또는 명시적 매핑으로 타입·런타임 안전성 확보.
- **대시보드**: `AppShellIntlProvider`가 로케일별 `messages`를 주입한다.

---

## 5. 롤아웃·품질

- 새 네임스페이스 추가 시 **다섯 로케일 동시 추가** 후 `pnpm verify`.
- 이 문서는 스키마가 아니라 **인덱스**다. 상세는 `messages/*.json`과 실제 페이지 import가 최종이다.
