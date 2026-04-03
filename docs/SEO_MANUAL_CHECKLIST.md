# SEO — 수동 점검 체크리스트 (Elevate)

코드에 포함된 항목(메타, `robots.txt`, `sitemap.xml`, Naver 인증 메타)과 **배포 후 직접 해야 할 작업**을 구분했습니다.

## 배포 전 환경 변수

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | 프로덕션에서는 **`https://elevate.ai.kr`** (끝 슬래시 없음). sitemap·canonical·JSON-LD의 기준이 됩니다. 로컬은 `http://localhost:3000`. |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | (선택) Naver가 새 `content` 값을 주면 설정. 미설정 시 기본값은 `src/lib/seo/site-verification.ts`에 있습니다. |

## 코드에 이미 있는 것

- **Naver 사이트 소유 확인**: 루트 `layout`의 `metadata.other['naver-site-verification']` → 공개 페이지 `<head>`에 메타 태그 출력
- **`/robots.txt`**: 전체 허용 + `/dashboard/`, `/admin/`, `/api/`, `/auth/` 차단 + `sitemap` URL
- **`/sitemap.xml`**: 로케일별 URL + 가능한 항목에 **`hreflang` 대응 `alternates`**
- **메타 `hreflang`**: 홈·블로그 목록·블로그 글 `alternates.languages` + `x-default`
- **구조화 데이터**: 마케팅 레이아웃에 Organization + WebSite; 글에 BlogPosting + `inLanguage` + `isPartOf`
- **`/llms.txt`**: 동적 응답(환경별 `NEXT_PUBLIC_APP_URL` 반영)

## 배포 후 직접 할 일 (권장 순서)

### 1. 프로덕션에서 메타 확인

1. `https://elevate.ai.kr` (또는 대표 로케일 URL) 열기 → **페이지 소스 보기**
2. `<meta name="naver-site-verification" content="…" />` 존재 여부 확인  
3. 캐시/CDN을 쓰면 배포 직후 **몇 분 뒤** 다시 확인

### 2. Naver Search Advisor (네이버 서치어드바이저)

1. [Search Advisor](https://searchadvisor.naver.com/)에서 사이트 등록(이미 진행 중이면 생략)
2. **사이트 소유 확인**: HTML 태그 방식이면 위 메타로 검증 완료 가능  
   - 파일 업로드 방식(`naver….html`)을 쓰려면 `public/`에 동일 파일을 두고 배포해도 됨(현재는 태그 방식으로 충분)
3. **사이트맵 제출**: `https://elevate.ai.kr/sitemap.xml` 등록
4. **수집 요청**: 주요 URL(홈, 블로그 목록, 대표 글)에 대해 필요 시 URL 등록/점검

### 3. Google Search Console (이미 등록했다면)

- **사이트맵**: `https://elevate.ai.kr/sitemap.xml` 제출 상태가 “성공”인지 확인
- **페이지 색인**: 중요 URL이 “색인 생성됨”인지, 오류는 없는지 주기적 확인
- **hreflang / 다국어**: 동일 콘텐츠의 로케일별 URL이 의도대로만 색인되는지(중복이면 `SEO_ROADMAP.md`의 hreflang 작업 검토)

### 4. 정기 점검

- 블로그 새 글 배포 후 sitemap에 URL이 포함되는지(현재 빌드 시 `getAllPostMetaForLocale` 기준)
- `NEXT_PUBLIC_APP_URL`이 스테이징/프로덕션에서 섞이지 않았는지

## 다음 구현 후보 (코드)

1. **남은 마케팅 페이지** — `/product`, `/pricing` 등에도 `alternates.languages` 패턴 적용(현재 홈·블로그 중심)
2. **BreadcrumbList** JSON-LD — 블로그·제품 하위 경로
3. **사이트 검색** 도입 시 `WebSite` + `SearchAction` schema

상세 로드맵: [`docs/SEO_ROADMAP.md`](./SEO_ROADMAP.md)
