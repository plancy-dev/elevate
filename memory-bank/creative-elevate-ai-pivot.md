# North Star — Elevate AI 플랫폼 피벗

**Single source of truth** for product narrative (Gemini/VC 플라이휠·듀얼 GTM과 정합).  
구현 세부는 `memory-bank/tasks.md`와 ADR로 갱신한다.

## 한 줄 포지셔닝

콘텐츠(가이드·프롬프트)는 **고객 획득용 트로이 목마**이고, 장기 목표는 **AI 기반 B2B 업무 자동화·에이전트 워크스페이스**로 락인(Lock-in)과 반복 매출(MRR)을 만든다.

## Phase 0 킬러 — Prompt Studio (프롬프트 품질 UX)

초기 **마케팅·제품 스토리의 중심**은 **Prompt Studio**: 사용자가 **대상 AI 모델**을 고르고, 작성한 프롬프트를 **분석·개선 제안**하며, **Cursor에 가까운 UX**(검토·자동완성·수락/유지)로 **개선된 프롬프트**를 얻는 경험이다. (구현 단계는 [`docs/adr/ADR-002-prompt-studio-mvp.md`](../docs/adr/ADR-002-prompt-studio-mvp.md) 참고.)

전자책·디지털 가이드 판매는 **동시에** 현금 흐름·신뢰 확보용 **트로이 목마**로 유지한다(아래 Phase 0 상업).

## 상업 Phase 0 — 전자책·디지털 콘텐츠 우선

최초 런칭은 **전자책(E-book) 및 디지털 패키지** 판매로 현금 흐름·시장 검증을 한다. 카탈로그(`content_products`)의 기본 `product_kind`는 **`ebook`**이며, 이후 가이드·템플릿·번들로 확장. 상세 퍼널·여정은 [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md), 검수 기록은 [`archive/work-history/reflect-ebook-content-funnel.md`](archive/work-history/reflect-ebook-content-funnel.md).

## 플라이휠 (4단계)

1. **공급**: 산업별 고품질 가이드·템플릿·(향후) 노코드 에이전트가 플랫폼에 쌓인다.
2. **저비용 유입**: SEO·소셜·실무 성공 사례로 CAC를 낮춘다.
3. **수익화·락인**: 조직 단위 결제·워크플로우·데이터 연동으로 전환·이탈 방어.
4. **데이터 해자**: 사용·성과 데이터가 축적되어 추천·품질·(선택) 파인튜닝 후보로 순환한다.

## 듀얼 GTM

- **Bottom-up (PLG)**: 실무자·SME가 저마찰로 쓰게 한다.
- **Top-down (B2B)**: 전사 도입·보안·거버넌스 스토리로 ACV를 올린다.

## 피벗 단계 (롤맵 요약)

| 단계 | 초점 |
|------|------|
| **Now** | Prompt Studio 내러티브·랜딩·대시보드 IA; 전자책 카탈로그·결제·Library; Pretext·gstack |
| **Next** | Prompt Studio **제품 MVP**(LLM 연동·수락 UX) + 콘텐츠 판매·Toss 고도화 |
| **Later** | 에이전트 워크스페이스·노코드 빌더·마켓플레이스 |

## 모회사 Plancy와의 관계

- 단기 서비스명 **Elevate** 유지.
- “Plancy가 만든 Elevate” 서사는 도메인·푸터·About에서 정리 가능.

## 레거시 MICE

- 기존 이벤트·venue·참석자 기능은 **레거시**로 보존하되, 내비·카피는 신규 비전 우선.
- 스키마 삭제는 데이터 마이그레이션·고객 영향 검토 후 별도 결정.
