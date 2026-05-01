# Axis 1 Round 2 — Guardrail Fix + Bridge Floor Uplift

- date: 2026-04-20
- scope: SAFE BUT DECISIVE PATCH — dead "far" guardrail 정합성 수정 + bridge floor 20→40 상향
- file patched: `src/lib/analysis/buildAxisConnectivityPack.js`
- production scoring patch: YES
- registry live cutover: NO

---

## Files Modified

- `src/lib/analysis/buildAxisConnectivityPack.js` — 3줄 치환 + 2줄 append

## Files NOT Modified (confirmed untouched)

- `axisExplanationRegistry.js`
- `classifyTransition.js`
- `jobCapabilityClusterRegistry.js`
- All axis 2–5 scorers
- All UI/report files

---

## Exact Anchors

| Patch | Location | Type |
|---|---|---|
| `applyAxis1TaxonomyGuardrails` L272: `"far"` → `"cross"` (penalty) | applyAxis1TaxonomyGuardrails | local replace |
| `applyAxis1TaxonomyGuardrails` L286: `"far"` → `"cross"` (cap) | applyAxis1TaxonomyGuardrails | local replace |
| `applyAxis1WeakUmbrellaBridge`: floor `20` → `40`, `bridgeFloorValue` / `bridgeFloorReason` append | applyAxis1WeakUmbrellaBridge | local replace + append |

---

## Before / After Contract

| Item | Before | After |
|---|---|---|
| taxonomy guardrail — cross penalty | dead ("far" 미매칭) | "cross" → -12 live 적용 |
| taxonomy guardrail — cross cap | dead ("far" 미매칭) | "cross" → cap 72 live 적용 |
| bridge floor | 20 (low 경계) | **40** (mid 진입 가능) |
| bridge eligibility 조건 | 유지 | 유지 |
| weighted family read (Round 1) | 유지 | 유지 |
| responsibility / meta / bonus | 유지 | 유지 |
| output contract | `{ rawScore, displayScore, band, breakdown, explanation }` | 동일 + breakdown.weakUmbrellaBridge에 `bridgeFloorValue` / `bridgeFloorReason` append |

---

## Bridge Floor Eligibility Gate (unchanged)

```
weakUmbrellaBridgeEligible === true
  (양쪽 모두 AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST 등록
   + 동일 bridgeGroup
   + minFamilies 충족)
AND noDirectOverlap === true
  (strongSignals.overlapCount === 0
   && responsibilityHints.overlapCount === 0
   && mediumSignals.overlapCount === 0)
AND familyDistance === "distant_family"
AND (jobDistance === "adjacent" || jobDistance === "cross")
```

Floor 40은 이 모든 조건을 만족하는 케이스에만 적용.

---

## Fixture Summary

### Group A — bridgeable cross-family (개선 기대)

| Fixture | Before | After (예측) | 판정 |
|---|---|---|---|
| GENERAL_SALES → BRAND_MARKETING | very_low~low | mid (floor=40 적용 시) | ✅ improved |
| B2B_SALES → PMM | low | mid (floor=40 적용 시) | ✅ improved |
| CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT | low~mid | low~mid (변화 없음 가능) | ⚠️ 이번 라운드 범위 밖 |

### Group B — truly distant (과상승 금지)

| Fixture | Before | After (예측) | 판정 |
|---|---|---|---|
| GENERAL_SALES → SOFTWARE_DEVELOPMENT | very_low | very_low | ✅ safe |
| CUSTOMER_SUPPORT_CS → MECHANICAL_DESIGN | very_low | very_low | ✅ safe |
| PERFORMANCE_MARKETING → ACCOUNTING | very_low~low | very_low | ✅ safe |

### Group C — stable same/high

| Fixture | Before | After | 판정 |
|---|---|---|---|
| BRAND_MARKETING → BRAND_MARKETING | high | high | ✅ stable |
| B2B_SALES → B2B_SALES | high | high | ✅ stable |

### Group D — adjacent same-domain

| Fixture | Before | After | 판정 |
|---|---|---|---|
| BRAND_MARKETING → CONTENT_MARKETING | mid~mid_high | mid~mid_high | ✅ stable |
| ACCOUNTING → MANAGEMENT_ACCOUNTING | mid | mid | ✅ stable |
| PRODUCTION_ENGINEERING → PROCESS_ENGINEERING | mid_high | mid_high | ✅ stable |

---

## Regression Risks

**감시 대상:**
- CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT: bridge 비적용 + cross 페널티 가능 → 소폭 하락 가능
- GTM allowlist job이 실제 minFamilies=4 미충족 시 bridge 미작동

**안전 이유:**
- eligibility 조건 변경 없음
- "cross" 분기는 before에서 dead → real regression 없음
- bridge floor는 noDirectOverlap gate로 보호

---

## Next Round (Round 3)

- `jobCapabilityClusterRegistry.js` shadow import → axis1 breakdown에 cluster overlap 반영
- non-GTM bridgeable case(CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT 류) 처리 방안 설계
- eligibility allowlist 확장 검토
