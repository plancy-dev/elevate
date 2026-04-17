# Archive — 파이프라인 「초안 저장됨」 다이얼로그 (G3.1.2)

**Shipped:** 2026-04-17  
**SoT:** [`../../tasks.md`](../../tasks.md) § G3.1.2

---

## 요약

에피소드 **제작** 서브탭(`episodePanel=pipeline`) 1단계 카드에서 **편집**으로 훅·제목·대본 워크벤치를 `Modal`(`2xl`)로 연다. `EpisodeDraftWorkbench`가 패널/다이얼로그를 공유하고, 미저장 시 닫기는 확인 모달(`z-90`)로 처리한다. 코드: `src/components/dashboard/episode-draft-workbench.tsx`, `production-episode-pipeline.tsx`, `production-episode-draft-panel.tsx`, `ui/modal.tsx`.

---

## 아카이브 문서 (CREATIVE / REFLECT)

| 문서 | 경로 |
|------|------|
| CREATIVE 잠금 | [`creative-pipeline-draft-dialog-2026-04.md`](creative-pipeline-draft-dialog-2026-04.md) |
| REFLECT | [`reflect-pipeline-draft-dialog-2026-04.md`](reflect-pipeline-draft-dialog-2026-04.md) |

---

## 수동 스모크 체크리스트 (운영/출시 전)

로그인된 환경에서 아래를 한 번씩 확인하면 된다. (자동화 에이전트 세션에서는 인증 없이 전 경로 검증을 수행하지 않음.)

1. `/dashboard/productions/[episodeId]?tab=episode&episodePanel=pipeline` — **초안 저장됨** 행에 **편집** 표시.
2. **편집** → 다이얼로그 오픈, 훅/제목/대본 표시·편집 가능.
3. **초안 저장** → 토스트/갱신 후 파이프라인 진행·다음 단계 라벨이 기대와 일치.
4. 텍스트만 바꾼 뒤 **닫기(X/백드롭)** → 미저장 확인 모달 → **저장 없이 닫기** 시 다이얼로그만 닫힘.
5. **조직 커스텀 템플릿 관리** 등 `DraftTemplateManageDialog`가 초안 모달 **위**에 보이는지(스택).
6. 푸터 **전체 작업대** 링크 → `episodePanel=draft`로 이동.

---

## 백로그로 이관된 항목

`tasks.md` **백로그 (공통)** 표에 반영: PostHog 이벤트, a11y 포커스 폴리시. 상세는 REFLECT follow-ups 참고.
