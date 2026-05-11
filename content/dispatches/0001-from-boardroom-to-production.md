---
title: "From boardroom to production: what actually shipped"
description: "가게점수 went live in production. Twelve attributes (not ten), AI scoring (not manual), KRW (not USD). The three deltas between boardroom plan and what shipped, the mechanism behind them, and the beta opening this week."
date: "2026-05-14"
issue: 1
publication: "Studio Dispatch"
tags:
  - "Vertical product building"
  - "Founder insights"
---

# From boardroom to production: what actually shipped

가게점수 went live in production over the past two weeks — Studio's first vertical product. The boardroom plan and what shipped differ in three specific ways. Production cycle validated end-to-end (founder self-test: payment + refund). Verification rounds wrapped. External paid count: zero. I'm opening the beta cohort this week in three stages — first five free for product validation, next five at ₩1,990 for pricing validation at low friction, then production at ₩9,900.

## The plan, the ship

The boardroom locked Path C-tight: 가게점수, ten attributes, manual scoring, USD pricing. Ten attributes was the headline cut — twenty-five pruned to ten on user-need grounds, defended in writing by Marc and three other personas in the session. Manual scoring meant founder-or-operator review per submission; AI in the scoring loop was deferred to post-PMF iteration. USD pricing followed the Studio-wide payment default. Five weeks of build from that locked spec, with the strategic question already settled.

What 가게점수 shipped with, twelve days from boardroom close: twelve attributes, AI scoring via Claude sonnet-4-6 with deterministic post-process, ₩9,900 through Polar.sh. The attribute count rose by two — review-velocity and address-standardization signals that read as one feature in plan but split in build when the user-facing diagnosis screen needed both rendered separately. Scoring moved to AI not for sophistication but for response time: manual review at submission scale broke the diagnosis-in-five-minutes promise the product was anchored on. Currency switched on the first concrete user-facing screen: a Seoul restaurant owner does not pay $7-and-change for a Korean-language diagnosis.

The 가게점수 spec drifted in build, but not in the way "spec drift" usually means. I left the boardroom with ten attributes locked. I shipped twelve. The two added back were not drift. Boardroom articulation pressure ran one direction — cut what solo cognition had been protecting. Build articulation pressure ran the other — add back what plan abstraction had cut without seeing concrete users. Marc was not wrong to cut to ten; ten was the right answer for the question the boardroom could see. The 12-item return is the upstream half of a mechanism whose downstream half ships items, not cuts them. Same pressure, rotated ninety degrees: solo vagueness exposed by personas in plan, plan abstraction exposed by users in production. One build, one cycle — the rotation may not generalize. The pattern was concrete here.

## On the currency exception

USD-only payment (Studio-wide default per ADR-005) gave way to KRW for the vertical. ₩9,900 is the price a Korean small-business owner reads as fair without converting; $7-and-change at floating FX is not. The trade was explicit and not absorbed: friction-free Korean self-employed payment over Studio-wide currency consistency. ADR-005 still holds for future verticals serving USD-native audiences. For 가게점수, ADR-017 is pending (vertical payment localization amendment) — to name the KRW exception rather than fold it into precedent. The architectural choice is to keep the default sharp and the exception visible, not to dilute the default toward a multi-currency middle that fits no single vertical well.

## What the beta tells

Each stage tests one question. Stage 1: does the product land at zero friction. Stage 2: does pricing land at low friction. Stage 3: does the diagnosis-as-product framing convert at full price. Invite codes through Instagram DM, no public signup. The branch point — scenario A (continue) versus scenario D (kill or pivot) — closes when Stage 2 lands. The math says continue. Conversion says what the math cannot, stage by stage.
