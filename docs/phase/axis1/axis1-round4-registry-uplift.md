# Axis 1 Round 4 — Registry SSOT + Limited Cluster Uplift

- date: 2026-04-20
- scope: SAFE BUT STRUCTURAL PATCH — GTM allowlist 실질 퇴역, registry primary, cluster uplift 도입
- file patched: `src/lib/analysis/buildAxisConnectivityPack.js`
- production scoring patch: YES
- registry meaning change: NO
- explanation/UI change: NO

---

## Files Modified

- `src/lib/analysis/buildAxisConnectivityPack.js` — 4-point patch

## Files NOT Modified

- `jobCapabilityClusterRegistry.js`
- `axisExplanationRegistry.js`
- All axis 2–5 scorers, all UI/report files

---

## Exact Anchors

| Patch | Location | Type |
|---|---|---|
| `resolveAxis1RegistryBridgeSignals` — `onlyFinancePlanning` guard 제거, @MX:NOTE 갱신 | function body | local replace |
| `getRegistryClusterUplift()` 신규 helper | before `resolveAxis5MetaSignals` | append |
| `scoreAxis1` — `rawAfterGuardrail` + `clusterUplift` + `rawWithUplift`, breakdown append | function body | local replace |
| `applyAxis1WeakUmbrellaBridge` return — `bridgeEligibilitySource` append | return object | append |

---

## Before / After Contract

| Item | Before (R3) | After (R4) |
|---|---|---|
| bridge eligibility primary path | allowlist OR registry (동등) | registry primary, allowlist fallback |
| `bridgeEligibilitySource` | 없음 | `"registry"` \| `"allowlist_fallback"` \| `null` |
| cluster raw uplift | 없음 | +2 (2 clusters) / +4 (3+ clusters), max +4 |
| `registryClusterUplift` / `Reason` | 없음 | breakdown append-only |
| `finance_planning_control` 단독 guard | 완전 차단 | **제거** (sharedClusters≥2 + isBridgeableDistance gate로 자연 보호) |
| weighted family read / cross guardrail / floor 40 | 유지 | 유지 |
| output contract | `{ rawScore, displayScore, band, breakdown, explanation }` | 동일 + `registryClusterUplift`, `registryClusterUpliftReason`, `bridgeEligibilitySource` append |

---

## Cluster Uplift Contract

```
조건:
  sharedBridgeGroups.length >= 1
  AND sharedCapabilityClusters.length >= 2
  AND (jobDistance === "adjacent" || "cross")
  AND noDirectOverlap (strong/responsibility/medium overlapCount 모두 0)
  AND NOT (technical_build 단독)

uplift:
  sharedCapabilityClusters.length === 2 → +2
  sharedCapabilityClusters.length >= 3 → +4
  max cap: +4

적용 위치: computeAxis1Raw (guardrail 포함) 이후, applyAxis1WeakUmbrellaBridge (floor) 이전
```

---

## Finance Corridor Decision

| Case | sharedBridgeGroups | sharedClusters | eligibility | score change |
|---|---|---|---|---|
| ACCOUNTING → MANAGEMENT_ACCOUNTING | finance_planning_control (1) | 2 | ✅ eligible (guard 제거) | **없음** (jobDistance="same" → isBridgeableDistance=false) |
| ACCOUNTING → FP_AND_A | finance_planning_control (1) | 1 | ❌ ineligible (cluster<2) | 없음 |
| FP_AND_A → MANAGEMENT_ACCOUNTING | finance_planning_control, business_planning_ops (2) | 3 | ✅ eligible (Round 3부터) | **없음** (jobDistance="same") |

결론: 실질 score 변화 없음. breakdown에 `registryBridgeEligible: true` 표시만 개선됨. 이번 라운드 보수적 처리 완료.

---

## Fixture Summary

| fixture | after band | eligibilitySource | clusterUplift | 판정 |
|---|---|---|---|---|
| CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT | mid (floor+uplift) | registry | +2 | ✅ improved |
| HR_OPS → HR_PLANNING | mid | registry | +2 | ✅ improved |
| SERVICE_OPERATIONS → OPERATION_PLANNING | mid | registry | +2 | ✅ improved |
| GENERAL_SALES → BRAND_MARKETING | mid (floor only) | allowlist_fallback | +0 | ✅ stable |
| B2B_SALES → PMM | mid (floor+uplift) | registry | +2 | ✅ improved |
| ACCOUNTING → MANAGEMENT_ACCOUNTING | mid | null | +0 | ✅ conservative |
| GENERAL_SALES → SOFTWARE_DEVELOPMENT | very_low | null | +0 | ✅ safe |
| BRAND_MARKETING → BRAND_MARKETING | high | null | +0 | ✅ stable |

---

## Regression Risks

**감시:**
- `business_planning_ops` + `customer_service_ops` 다중 참여 job 조합
- cluster uplift + floor 40 결합 → max raw ≈ 44 (mid 하단, high 불가)

**안전 근거:**
- cluster uplift max +4
- noDirectOverlap + isBridgeableDistance 이중 gate
- technical_build 단독 guard 유지
- allowlist fallback → GTM regression 없음

---

## Next Round (Round 5)

- `industrial_operations` 케이스 floor/uplift 검토
- `supplier_partner_network` bridge 필요 여부 결정
- axis1 explanation routing — `bridgeEligibilitySource` 기반 text 개선
- `domain_technical_depth`-heavy job pair 별도 guard 도입 검토
