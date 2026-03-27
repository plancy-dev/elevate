# CREATIVE — Settings: 조직명·프로필·알림

> **목적**: `/dashboard/settings`의 플레이스홀더를 제거하고, RLS·역할과 맞는 최소 실구현을 정의한다.  
> **상태**: 설계 확정 → BUILD 시 `005_*` 마이그레이션 + 서버 액션 + 페이지 개편 순으로 진행.

---

## 1. 현재 스냅샷 (코드·DB)

| 영역 | 현재 | 막히는 이유 |
|------|------|-------------|
| 조직명 | `organizations.name` 읽기만, 입력 `readOnly` | `organizations`에 **UPDATE 정책 없음** (`001`/`004`는 SELECT만) |
| 프로필 표시 이름 | `profiles.display_name` 읽기만 | 정책상 **본인 `profiles` 업데이트는 이미 허용** (`Users can update own profile`) — UI만 편집·저장 연결하면 됨 |
| 알림 체크박스 | DOM만, 저장 없음 | **컬럼 없음** — 스키마 추가 필요 |

---

## 2. 설계 결정

### 2.1 조직명 수정

- **누가**: `admin` · `organizer`만 (venue 관리과 동일한 “조직 설정” 권한). `coordinator`·`viewer`는 읽기만.
- **무엇을**: `organizations.name`만 변경. **`slug`는 이름 변경 시 자동 변경하지 않음** (북마크·링크 안정). 별도 “URL 슬러그” 편집은 로드맵.
- **서버**: `getVenueManagerContext`와 동일한 역할 집합을 재사용하거나 `getOrgSettingsManagerContext`로 분리해 `updateOrganizationName` 서버 액션에서 호출.
- **DB**: `005` 마이그레이션에 예시:

```sql
-- organizations: org-bound editors may update name (and updated_at via trigger)
create policy "Org admins and organizers can update own organization"
  on public.organizations for update
  using (
    id = public.user_organization_id()
    and public.user_organization_id() is not null
    and public.user_role() in ('admin'::public.user_role, 'organizer'::public.user_role)
  )
  with check (
    id = public.user_organization_id()
  );
```

- **검증**: `name` trim, 비어 있으면 거부, 최대 길이(예: 200자).

### 2.2 프로필 표시 이름

- **누가**: 본인 (`auth.uid() = id`) — 기존 RLS와 일치.
- **무엇을**: `profiles.display_name`만.
- **서버 액션**: `updateProfileDisplayName` — `getUser()` 후 `profiles.update({ display_name })` where `id = user.id`.
- **UX**: 저장 후 `revalidatePath('/dashboard')` 또는 `router.refresh()`로 사이드바 `loadSidebarUser`와 동기화.

### 2.3 알림 (MVP)

- **저장 위치**: **사용자 단위**가 가장 단순 — `profiles`에 불리언 추가.
  - 예: `email_milestone_digest boolean not null default true`
- **이유**: “이벤트 마일스톤 이메일”은 개인 수신 선호에 가깝고, 마이그레이션·RLS가 기존 `update own profile`로 커버됨.
- **조직 단위 기본값**이 나중에 필요하면 `organizations`에 기본값만 두고 프로필에서 override하는 모델로 확장 가능 (Phase 2).

---

## 3. BUILD 순서 (권장)

1. **`supabase/migrations/005_settings_org_update_and_profile_prefs.sql`**
   - `organizations` UPDATE 정책 (위).
   - `profiles`에 `email_milestone_digest` (또는 합의된 컬럼명) 추가.
2. **`src/actions/settings.ts`** (또는 `organization.ts` / `profile.ts` 분리)
   - `updateOrganizationName`, `updateProfileDisplayName`, `updateNotificationPreferences`
3. **`src/app/(dashboard)/dashboard/settings/page.tsx`**
   - 프로필·알림은 클라이언트 폼 + 서버 액션 또는 작은 `SettingsForm` 컴포넌트로 분리.
   - 조직명은 권한 없으면 `readOnly` + 안내 문구 유지.
4. **테스트**
   - 단위: trim/검증 로직.
   - 통합(선택): 서비스 롤로 컬럼 존재 확인.

---

## 4. 의존성·리스크

- **RLS**: 새 UPDATE 정책은 **반드시** `004`의 `user_organization_id()` / `user_role()`과 동일 패턴으로 작성 (재귀 금지).
- **역할**: UI에서 `viewer`에게는 Save 비활성 또는 조직 섹션만 읽기 전용.
- **Connected accounts**: 기존 `ConnectedIdentities`는 그대로; 별도 범위.

---

## 5. 다음 단계 (워크플로)

- **PLAN**: 위 순서대로 티켓 쪼개기.
- **BUILD**: `005` → actions → 페이지.
- **REFLECT**: 수동으로 admin / organizer / viewer 계정 각각 설정 저장 시도.
