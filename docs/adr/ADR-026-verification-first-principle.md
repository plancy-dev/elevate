# ADR-026 — Verification-first principle

**Status:** Draft (W2 D5 ready for sprint sync review)
**Context:** 2026-05-15 W2 D4-5 transition, anti-pattern batch #28-#30 공통 root pattern
**Related:** ADR-018 v2 verification rule (확장 — broader scope)

## Background

W2 D4 evening → W2 D5 afternoon 동안 cron 자동화 stack 완성 과정에서 build/deploy fail 3회 연속 발생:

- **#28 (Vercel deploy fail #1):** `maxDuration = 900` — Pro plan max는 800. Memory 추정 후 작성.
- **#29 (Vercel deploy fail #2):** Anti-pattern #28 fix 적용 시 constant import 패턴 → Next.js segment config 제약 (literal-only) verify 누락 → 또 다른 build fail.
- **#30 (Cron endpoint 404 false positive):** 사장님이 fix commit + push 진행했을 거라 가정 후 curl test → 404. 실제는 fix commit이 아직 push 안 된 시점.

세 case 모두 동일 root pattern: **"외부 시스템 제약 (platform limit / framework convention / deploy state)를 reasoning 전에 empirical verify 없이 진행 → fail → iteration → 추가 fail"**.

## Decision

**Verification-first principle:** 외부 시스템 또는 deployed state에 의존하는 모든 reasoning 시작 전, 해당 상태/제약을 empirical하게 verify한다. 추정 후 진행 금지.

### 적용 범위 (verify 의무화)

**Category A — External platform constraints (numeric):**
- Vercel: function timeout, function size, bandwidth, cron count, build memory
- OpenAI: rate limit per minute, max tokens, model context window, image quality cost
- Supabase: row limit, storage size, RLS performance, REST query limit
- Resend: per-domain send limit, attachment size
- Polar: webhook payload size, refund window

**Verify routine:** 코드에 numeric 사용 전 → official docs 1회 read → 검증된 limit 명시 (comment + lib constant) → memory 추정 금지.

**Category B — Framework conventions / static analyzer 제약:**
- Next.js: route segment exports (literal-only), middleware constraints, dynamic params resolution
- TypeScript: const enum, type-only imports, strict mode behavior
- React: hook rules (called unconditionally), server/client component boundary

**Verify routine:** 새 framework convention 사용 시 → official docs read → 제약 사항 확인 → 그 후에야 code 작성. Single-source-of-truth 패턴이 framework 제약과 충돌 가능성 사전 인지.

**Category C — Deploy / state-dependent verification:**
- 사장님 host에서 fix 진행했는지 (commit SHA empirical)
- Vercel deployment Status (Ready / Error / Building)
- Production endpoint live 여부 (HTTP status)
- DB migration applied 여부 (직접 Supabase query)

**Verify routine:** Deploy-dependent verify 진행 전:
1. `git log -1 --oneline` SHA 명시
2. Vercel dashboard Status = Ready empirical 확인
3. 그 후에야 endpoint test
4. "사장님이 했을 것"의 가정 금지

## Mechanisms (재발방지 layer)

### Layer 1 — `lib/{platform}-limits.ts` constants
- 검증된 numeric limit single source
- Comment에 source (docs URL + verify date) 명시
- Non-segment 영역에서만 import 사용

### Layer 2 — Pre-commit hook guard
- Vercel maxDuration > 800 검출 + 차단 (현재 적용)
- 추후 추가: OpenAI rate limit, Supabase batch size 등
- `--no-verify` 사용 금지 (사장님 정책)

### Layer 3 — Anti-pattern doc + sprint sync batch
- 발견된 each anti-pattern capture
- Generalized lesson 명시
- 향후 같은 류 mistake 시 reference

### Layer 4 — Deploy verification routine
- Deploy-dependent verify command template:
  ```
  cd <repo> && git log -1 --oneline
  # Then check Vercel dashboard manually
  # Then curl with expected HTTP code
  ```

## Trade-offs

**Cost:** Empirical verify에 추가 시간 (docs read 1-5분, dashboard click 30초)
**Benefit:** Build fail iteration ↓, 사장님 attention loss ↓, downstream false positive ↓
**Anti-pattern cost (이번 batch):** 3 build fail + 1 false 404 진단 = 약 30-60분 손실 + 사장님 confusion

→ Empirical verify cost는 매번 ~5분, anti-pattern cost는 매 case ~15-30분. Break-even ratio 3:1 이상.

## Rejected alternatives

### "추정 후 fail 시 fix" 방식 (현재 default 패턴)
- Pros: 첫 시도 시간 ↓
- Cons: build fail → iteration cycle. 사장님 attention block. 3개 batch 모두 이 방식.
- 거부 이유: cost 누적 시 verify-first보다 더 비쌈.

### Pre-commit hook으로 모든 외부 제약 검증
- Pros: 자동화 high
- Cons: 모든 platform/framework 제약을 grep-able 패턴으로 표현 불가. Static analyzer 제약은 codegen 단계에만 발견됨.
- 거부 이유: Layer 2는 numeric만 cover. Framework convention은 layer 3 (anti-pattern doc + 개발자 인식) 의존.

### "Verify-first" 별도 ADR vs 기존 ADR-018 update
- ADR-018 v1/v2가 vertical-specific (가게점수 product scope verification)이라 generic principle은 별도 ADR이 깔끔.
- ADR-018은 product/marketing alignment, ADR-026은 external system constraint — 영역 분리 명확.

## Out of scope

- **Test coverage 강화** (안티패턴 fix는 단위 test로 catchable한 영역 일부) — 별도 ADR (test strategy)
- **CI integration** (pre-deploy GitHub Actions 등) — W3+ 검토
- **AI agent self-verification** (이 ADR의 principle을 사장님 + 컨트롤타워 AI 둘 다 적용) — W3 D1 첫 적용 case로 monitor

## Empirical trigger (이 ADR 채택 이유)

- 2026-05-15 W2 D5 single afternoon에 3 build/deploy fail 발생 (Vercel cron 도입 과정)
- 사장님 명시 요청: "재발방지를 위해 철저하게 관리해줘"
- 이 ADR이 verify routine을 codify

## Adoption (즉시 적용)

W3 D1 morning부터:
1. 모든 external numeric limit 코드 작성 전 docs verify
2. 새 framework convention 사용 시 제약 확인 (예: Next.js 17 새 segment config 시)
3. Deploy-dependent test 진행 전 commit SHA + Status empirical 확인
4. 컨트롤타워 답변 시 "X가 됐을 거야" 가정 금지 — empirical state check 명시

## References

- Anti-pattern batch: `docs/anti-patterns-w2-d4-d5.md` (#26-#32, 함께 commit)
- ADR-018 v2: vertical product scope verification (이 ADR은 v3 진화 또는 분리 ADR)
- Vercel cron commit chain in 가게점수 repo: 578c0bf → 4b2b8ab → d1eb4fc (3 build attempts)
