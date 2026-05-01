# Axis 1 Round 3 — Registry Shadow Bridge

- date: 2026-04-20
- scope: SAFE INVESTIGATION + NARROW PATCH — registry shadow import + structured bridge eligibility 확장
- file patched: `src/lib/analysis/buildAxisConnectivityPack.js`
- production scoring patch: YES (eligibility 구조에 영향)
- registry meaning change: NO
- explanation/UI change: NO

---

## Files Modified

- `src/lib/analysis/buildAxisConnectivityPack.js` — 4-point patch (import + helper + function modify + signals append)

## Files NOT Modified (confirmed untouched)

- `jobCapabilityClusterRegistry.js` (data only, read-only)
- `axisExplanationRegistry.js`
- `classifyTransition.js`
- All axis 2–5 scorers
- All UI/report files

---

## Exact Anchors

| Patch | Location | Type |
|---|---|---|
| `import { JOB_CAPABILITY_CLUSTER_REGISTRY }` | L25 (after existing imports) | append |
| `resolveAxis1RegistryBridgeSignals()` helper | before `resolveAxis5MetaSignals` | append |
| `applyAxis1WeakUmbrellaBridge` — `allowlistShouldApply` + `registryShouldApply` OR | function body | local replace + append |
| `axis1Signals` — `registryBridgeSignals` field | buildAxisConnectivityPack body | append |

---

## Registry Bridge Eligibility Contract

### Eligible 조건 (Round 3)

```
currentEntry exists (registry에 등록된 job)
AND targetEntry exists
AND sharedBridgeGroups.length >= 1
AND sharedCapabilityClusters.length >= 2
AND NOT (sharedBridgeGroups.length === 1 && sharedBridgeGroups[0] === "technical_build")
AND NOT (sharedBridgeGroups.length === 1 && sharedBridgeGroups[0] === "finance_planning_control")
AND NOT (technical_build ∈ sharedBridgeGroups && commercial_gtm ∈ one side only)
```

### Floor 적용 조건 (OR gate)

```
(allowlistShouldApply — 기존 GTM umbrella 4개)
OR
(registryBridgeEligible === true
 AND noDirectOverlap  — strong/responsibility/medium overlapCount 모두 0
 AND (jobDistance === "adjacent" || jobDistance === "cross"))
→ floorApplied = 40
```

---

## Before / After Contract

| Item | Before | After |
|---|---|---|
| registry import | 없음 | JOB_CAPABILITY_CLUSTER_REGISTRY shadow import |
| weak bridge eligibility | GTM allowlist 4개 특례만 | GTM allowlist OR registry-based (sharedBridgeGroups >= 1, sharedClusters >= 2, safety guards) |
| bridge floor | 40 (GTM eligible only) | 40 (GTM allowlist OR registry eligible) |
| taxonomy guardrail (Round 2) | 유지 | 유지 |
| weighted family read (Round 1) | 유지 | 유지 |
| output contract | `{ rawScore, displayScore, band, breakdown, explanation }` | 동일 + breakdown.weakUmbrellaBridge에 registry 6 fields append |

### New breakdown fields (append-only)

| Field | 설명 |
|---|---|
| `currentRegistryJobId` | current job의 registry key |
| `targetRegistryJobId` | target job의 registry key |
| `sharedBridgeGroups` | 양쪽 공유 bridgeGroup 배열 |
| `sharedCapabilityClusters` | 양쪽 공유 capabilityCluster 배열 |
| `registryBridgeEligible` | boolean — registry 기반 bridge 적격 여부 |
| `registryBridgeReason` | string | null — 적격 이유 |

---

## Fixture Summary

| fixture | registryBridgeEligible | after band | 판정 |
|---|---|---|---|
| CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT | ✅ true | mid (floor=40, noDirectOverlap 시) | ✅ improved |
| HR_OPS → HR_PLANNING | ✅ true | mid (floor=40, noDirectOverlap 시) | ✅ improved |
| SERVICE_OPERATIONS → OPERATION_PLANNING | ✅ true | mid (floor=40, noDirectOverlap 시) | ✅ improved |
| ACCOUNTING → MANAGEMENT_ACCOUNTING | ❌ false (finance-only guard) | mid (변화 없음) | ✅ conservative |
| GENERAL_SALES → SOFTWARE_DEVELOPMENT | ❌ false | very_low | ✅ safe |
| CUSTOMER_SUPPORT_CS → MECHANICAL_DESIGN | ❌ false | very_low | ✅ safe |
| PERFORMANCE_MARKETING → ACCOUNTING | ❌ false | very_low | ✅ safe |
| BRAND_MARKETING → BRAND_MARKETING | true (but noDirectOverlap=false) | high | ✅ stable |

---

## Regression Risks

**감시 대상:**
- `business_planning_ops` 참여 job이 多 → 의도치 않은 조합 가능. noDirectOverlap gate가 방어.
- `industrial_operations` 내부 케이스: 직무 신호 overlap 존재 가능 → floor 미적용 예상.

**안전 이유:**
- noDirectOverlap 이중 gate — 실질 overlap 있는 케이스 차단
- technical_build / finance_planning_control 단독 guard
- numeric scoring skeleton 완전 유지

---

## Next Round (Round 4)

- `finance_planning_control` 제한 해제 여부 결정 (ACCOUNTING → FP&A)
- `industrial_operations` floor eligibility 검토
- capability cluster scoring을 raw 가산점에 제한적 연결 시작 (shadow score 비교)
- GTM umbrella allowlist를 registry 기반으로 완전 교체 검토
