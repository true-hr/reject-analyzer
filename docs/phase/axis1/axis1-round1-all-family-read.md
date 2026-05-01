# Axis 1 Round 1 — All-Family Weighted Read

- date: 2026-04-20
- scope: SAFE PATCH — primary-family-only signal read 병목 완화
- file patched: `src/lib/analysis/buildAxisConnectivityPack.js`
- production scoring patch: YES (axis1 strong/medium overlap calculation changed)
- registry live cutover: NO (jobCapabilityClusterRegistry.js not yet imported)

---

## Files Modified

- `src/lib/analysis/buildAxisConnectivityPack.js` — 3-point minimal patch

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
| Add `SECONDARY_FAMILY_WEIGHT = 0.4` constant | after L135 `getPrimaryFamilyMediumSignals` | append |
| Add `getWeightedSignalOverlapStats()` helper | after L135 `getPrimaryFamilyMediumSignals` | append |
| Modify `computeAxis1Raw` — use weighted stats when present | L296-305 | local replace (2 lines) |
| Add `strongSignalsWeightedStats` + `mediumSignalsWeightedStats` to `axis1Signals` | L1171 area | append to object |

---

## Before / After Contract

| Item | Before | After |
|---|---|---|
| strong signal read | `families[0].strongSignals` only | primary (weight=1.0) + secondary (weight=0.4) weighted overlap |
| medium signal read | `families[0].mediumSignals` only | primary (weight=1.0) + secondary (weight=0.4) weighted overlap |
| responsibility read | all roles, unchanged | unchanged |
| mission/output meta bonus | unchanged | unchanged |
| taxonomy guardrail | unchanged (including dead "far" branch) | unchanged |
| bridge floor | 20 (unchanged) | unchanged |
| output contract | `{ rawScore, displayScore, band, breakdown, explanation }` | same — breakdown gains `secondaryContribution` subfield (append-only) |

---

## Implementation Design

### New helper: `getWeightedSignalOverlapStats(currentJobItem, targetJobItem, signalKey)`

Computes 3 overlap types:
- **pp** (primary-vs-primary): full weight 1.0
- **sp** (current secondary-vs-target primary): weight 0.4
- **ps** (current primary-vs-target secondary): weight 0.4
- **ss** (secondary-vs-secondary): NOT included (too noisy, suppressed)

```
virtualOverlapCount = ppOverlap + (spOverlap + psOverlap) * 0.4
overlapRatio = min(1.0, virtualOverlapCount / max(tPrimary.length, 1))
overlapCount = ppOverlap  ← primary-primary only (drives bonus thresholds)
```

The denominator stays `tPrimary.length` — this preserves ratio scale and prevents secondary-heavy jobs from falsely inflating ratios.

### `computeAxis1Raw` change

```js
// Before:
const strong = getOverlapStats(signals.currentStrongSignals, signals.targetStrongSignals);
const medium = getOverlapStats(signals.currentMediumSignals, signals.targetMediumSignals);

// After:
const strong = signals.strongSignalsWeightedStats ??
  getOverlapStats(signals.currentStrongSignals, signals.targetStrongSignals);
const medium = signals.mediumSignalsWeightedStats ??
  getOverlapStats(signals.currentMediumSignals, signals.targetMediumSignals);
```

Backward compatible: if `strongSignalsWeightedStats` is not in signals (e.g. unit test with partial signal object), falls back to old `getOverlapStats`.

---

## Fixture Verification (Expected Behavior)

### Group A — Stable High (변화 없어야 함)

| Fixture | Before band | After band | 판정 | 코멘트 |
|---|---|---|---|---|
| BRAND_MARKETING → BRAND_MARKETING | high | high | ✅ stable | same-job: pp=100%, secondary adds nothing new |
| B2B_SALES → B2B_SALES | high | high | ✅ stable | same-job: pp=100% |

### Group B — Bridgeable Cross-Family (개선 기대)

| Fixture | Before | After (expected) | 판정 | 코멘트 |
|---|---|---|---|---|
| GENERAL_SALES → BRAND_MARKETING | very_low/low | low+ | ✅ improved | GENERAL_SALES 2차 family(CHANNEL_ROUTE_SALES 등)의 시장·고객 관련 신호가 BRAND_MARKETING primary와 partial overlap 가능. 0.4 weight로 virtualOverlapCount 소폭 상승 → raw 소폭 상승 |
| B2B_SALES → PMM | low | low/mid-low | ✅ improved | B2B_SALES secondary families(관계/메시지 조정 신호)가 PMM primary와 partial 교차 가능 |
| CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT | low/mid | low/mid | ✅ stable or small improve | secondary families overlap 있을 경우 소폭 상승 |

### Group C — Unrelated (과상승 금지)

| Fixture | Before | After (expected) | 판정 | 코멘트 |
|---|---|---|---|---|
| GENERAL_SALES → SOFTWARE_DEVELOPMENT | very_low | very_low | ✅ safe | 영업 secondary 신호와 소프트웨어 primary 신호 간 교차 없음 |
| PERFORMANCE_MARKETING → ACCOUNTING | very_low/low | very_low/low | ✅ safe | 마케팅 secondary와 회계 primary 신호 간 교차 없음 |
| CUSTOMER_SUPPORT_CS → MECHANICAL_DESIGN | very_low | very_low | ✅ safe | 고객응대와 기계설계 신호 간 교차 없음 |

### Group D — Adjacent Same-Domain (소폭 개선 가능, 과상승 금지)

| Fixture | Before | After (expected) | 판정 | 코멘트 |
|---|---|---|---|---|
| BRAND_MARKETING → CONTENT_MARKETING | mid~mid_high | mid~mid_high | ✅ stable | same-domain, primary overlap 이미 높음. secondary는 소폭 추가 가능 |
| ACCOUNTING → MANAGEMENT_ACCOUNTING | mid | mid | ✅ stable | finance 내부: 일부 secondary 신호 교차 가능하나 과상승 없음 |
| PRODUCTION_ENGINEERING → PROCESS_ENGINEERING | mid_high | mid_high | ✅ stable | 제조 내부: secondary 포함해도 이미 높은 구간 유지 |

---

## Regression Risks

**Low risk:**
- Secondary families typically have domain-specific signals that don't cross unrelated domains.
- `overlapCount` (bonus threshold) still uses primary-primary only → bonus thresholds unchanged for unrelated cases.
- `denominator = tPrimary.length` → ratio is anchored to target primary signal count, preventing secondary bloat.

**Watch for:**
- Jobs with very long secondary family signal lists: the `spOverlap` could accumulate across many secondary families. Capped by `min(1, virtualOverlapCount / denominator)` and `Math.round(* 42)` = max +42 — same cap as before.
- Same-family adjacent transitions: secondary signals may now slightly inflate already-mid-band cases to upper-mid. This is acceptable.

**Next round targets:**
- Round 2: fix dead `"far"` guardrail branch → `"cross"` penalty; raise bridge floor 20 → 40
- Round 3: shadow import of `jobCapabilityClusterRegistry.js` into breakdown
- Round 4: capability cluster scoring live + explanation routing

---

## Why This Round Is Safe

1. Only 1 file modified
2. New helper is additive (no existing function removed or renamed)
3. `computeAxis1Raw` change is backward compatible (`??` fallback)
4. `overlapCount` (bonus threshold driver) uses primary-primary only → same threshold behavior
5. Cap `Math.min(1, ...)` on ratio prevents runaway inflation
6. Secondary-vs-secondary overlap deliberately excluded (too noisy)
