# Anti-pattern batch — W2 D4 → D5 transition
**Date range:** 2026-05-14 evening → 2026-05-15 afternoon
**Capture method:** Single batch (vs incremental during sprint) — context still fresh, multiple cross-cutting failures
**Related ADR:** ADR-026 (Verification-first principle) codifies common root pattern below

## #26 — OpenAI Images API moderation block (IP/artist mention)

**Surfaced:** W2 D4 morning, image gen iteration v3-v5 (가게점수 vertical)
**Symptom:** API response `moderation_blocked` for prompts mentioning "Studio Ghibli", "Pixar", "Pascal Campion" or other named IP/artists.
**Root cause:** OpenAI safety system applies strict moderation on copyrighted style references regardless of usage context.
**Fix:** Removed all specific IP/artist mention from `STYLE_PRESETS` in vertical's `lib/image-gen.ts`. Replaced with generic descriptive language ("hand-painted editorial illustration with refinement of a senior concept artist (15+ years experience)" instead of "Studio Ghibli style").
**Generalized lesson:** Any external IP/artist/celebrity name in image gen prompt = moderation risk. Use generic style descriptors only (medium, technique, aesthetic adjectives).

## #27 — Vercel prerender Suspense 누락 (useSearchParams)

**Surfaced:** W2 D4 morning, Vercel build fail on 가게점수 `/marketing-image-generator/beta`
**Symptom:** Build error "useSearchParams() should be wrapped in a suspense boundary"
**Root cause:** Next.js 16 prerender phase requires any client component using `useSearchParams()` to be wrapped in `<Suspense>` — otherwise build fails. Dev mode doesn't catch.
**Fix:** Wrapped page in `<Suspense fallback={<LoadingFallback />}>` with separate `BetaPageInner` component.
**User feedback:** "다음부터는 이런 일 없도록 해줘"
**Generalized lesson:** Any client component using `useSearchParams()` — wrap in `<Suspense>` from creation. Default pattern: page-level `<Suspense>` even before adding hooks.

## #28 — Vercel platform capacity number doc verify 누락

**Surfaced:** W2 D5 afternoon, Vercel deploy fail on 가게점수 cron route
**Symptom:** `Builder returned invalid maxDuration value... must have a maxDuration between 1 and 800 for plan pro.`
**Root cause:** `maxDuration = 900`. Vercel Pro plan official max는 800. Memory에서 추정.
**Fix iteration 1 (failed):** Constant import → Next.js segment config가 literal-only → 또 다른 build fail.
**Fix iteration 2 (final):** Route segment literal + comment cross-ref + hook guard (`maxDuration > 800` 검출).
**Generalized lesson:**
- External platform numeric limit memory 추정 금지 → official docs 1회 verify
- Framework convention static analyzer 제약 사전 확인 — single SoT 패턴이 안 통하는 영역 존재
- 3-layer fix: SoT file + hook guard + anti-pattern doc

## #29 — Anti-pattern fix 자체가 anti-pattern reproduce

**Surfaced:** #28 iteration 1 → 2 transition
**Symptom:** #28 fix 시 constant import 패턴 도입 → Next.js segment 제약으로 또 build fail.
**Root cause:** Fix design에 framework 제약 verify 누락.
**Fix:** Iteration 2에서 literal + comment cross-ref. Lib은 non-segment 영역 한정.
**Generalized lesson:** Anti-pattern fix 적용 후 **deploy verify**까지 짧은 iteration. Build fail 1회 추가 발생.

## #30 — Deploy-dependent verify 진행 전 empirical state check 누락

**Surfaced:** W2 D5 cron endpoint 404 진단
**Symptom:** 사장님이 fix commit + push 진행했다고 가정하고 curl test → 404. 실제는 fix commit이 아직 push 안 된 시점.
**Root cause:** Deploy-dependent verify 전 commit SHA + Vercel Status=Ready empirical 확인 routine 없음.
**Fix:** 향후 deploy-dependent verify 전:
1. `git log -1 --oneline` — fix commit SHA 명시
2. Vercel dashboard Status = Ready 확인
3. 그 후에야 endpoint curl test
**Generalized lesson:** "X가 deploy됐을 것"의 가정으로 downstream test 금지. Empirical state check가 default.

## #31 — Threads founder reflection content audience mismatch

**Surfaced:** W2 D4 publish + W2 D5 review (96 views / 0 engagement)
**Symptom:** 가게점수 Threads post (funnel data + 자기 비판) → 96 views, 0 engagement.
**Root cause:** ADR-024 founder framing은 Studio (Elevate) Builder reader 대상. 가게점수 vertical product audience (자영업자)는 founder reflection 흥미 없음. Voice/content mismatch.
**Fix:** W2 D5 콘텐츠를 실용 tip format으로 pivot (2인칭 voice, 즉시 action item).
**Generalized lesson:**
- Voice framework는 audience별 분리 (Builder ≠ 자영업자)
- ADR-024는 Studio only — vertical product용 별도 framework 필요 (ADR 후보)
- Aggregate engagement 0 = audience 또는 voice 문제. 다음 변형으로 hypothesis test 필요

## #32 — Hook 이중 검증 (pre-commit + pre-push 동일)

**Surfaced:** W2 D5 사장님 지적
**Symptom:** Pre-commit과 pre-push가 동일 검증. commit && push 동시 진행 시 dev 속도 손해.
**Root cause:** "안전 위해 이중 gate" reasoning이 actual workflow 측정 없이 적용.
**Fix:** Pre-push 제거. Pre-commit만 유지. `--no-verify` 정책상 금지 (single gate로 충분).
**Generalized lesson:** Tooling 추가 시 사용자 actual workflow 측정 후 적용. "Defense in depth" reasoning이 redundant 발생 가능. Lean 우선.

---

## Common pattern across batch

**"Pre-verify 없이 진행 → fail → iteration → 추가 fail"**

- #28: Capacity number verify 없이 → fail → iteration 1도 verify 없이 → fail
- #30: Deploy state verify 없이 downstream test → 404
- #29: Fix design framework 제약 verify 없이 → 새 fail

**Generalized Gawande layer:** External system constraint (platform limit / framework 제약 / deploy state)는 reasoning 전에 empirical verify가 default. "추정 후 진행" 금지.

→ ADR-026 (Verification-first principle)이 이 routine codify.

## Cross-repo references

- 가게점수 vertical: build fail commit chain 578c0bf → 4b2b8ab → d1eb4fc (3 build attempts), cron 자동화 stack
- Threads 5/14 post (96/0): 가게점수 account, 자영업자 이야기 주제
- Threads 5/15 post (TBD): 실용 tip pivot test, 5/16 18:00 KST result check
