# Axis 1 Round 5 — SAFE EXPLANATION PATCH + TARGETED ELIGIBILITY REVIEW

- date: 2026-04-20
- scope: Producer-side explanation routing 강화, industrial/supplier 정책 확정
- files patched: `src/data/transitionLite/axisExplanationRegistry.js` (1 file)
- production scoring patch: NO
- registry meaning change: NO
- explanation/UI change: explanation producer only (consumer contract 유지)

---

## Files Modified

- `src/data/transitionLite/axisExplanationRegistry.js` — 4-point append + function body local replace

## Files NOT Modified

- `src/lib/analysis/buildAxisConnectivityPack.js`
- `jobCapabilityClusterRegistry.js`
- `TransitionLiteResult.jsx`
- All axis 2–5 scorers

---

## Exact Anchors

| Patch | Location | Type |
|---|---|---|
| `cross` entry 추가 | `JOB_DISTANCE_REASON` | append |
| `BRIDGE_GROUP_LABEL_MAP` constant | before `buildJobStructureExplanation` | append |
| `buildAxis1Summary()` helper | before `buildJobStructureExplanation` | append |
| `buildAxis1BridgeContext()` helper | before `buildJobStructureExplanation` | append |
| `buildAxis1WhyNotHigher()` helper | before `buildJobStructureExplanation` | append |
| `buildJobStructureExplanation` body — registry breakdown 추출 + extra fields | function body | local replace |

---

## Before / After Contract

| Item | Before (R4) | After (R5) |
|---|---|---|
| `explanationAvailable` | 없음 | 항상 true (producer 채움) |
| `explanationSummary` | band 기반 static 문구 | registry/bridge 여부 반영 동적 문구 |
| `explanationPositives` | signal overlap 기반 | + registryBridgeEligible, clusterUplift reason |
| `explanationGaps` | signal 기반 | 동일 (negative 방향 reasons) |
| `explanationWhyNotHigher` | 없음 | band / overlap / clusterCount 기반 생성 |
| `explanationEvidenceSource` | 없음 | `"registry"` \| `"allowlist_fallback"` \| `"signal_overlap"` |
| `explanationBridgeContext` | 없음 | bridgeGroup별 Korean 문구 생성 |
| output contract | `{ available, summary, positives, gaps, reasons, detailVersion }` | 동일 + extra fields spread (append-only, consumer safe) |

---

## Explanation Copy Contract

### bridgeable cross-family (registry eligible + bridgeFloorApplied + jobDistance=cross)
> "직무명은 다르지만, 실제로는 이어지는 핵심 업무 구조가 있습니다."

### adjacent same-domain (registry eligible + bridgeFloorApplied + jobDistance=adjacent)
> "같은 도메인 안에서 초점이 달라지는 전환입니다."

### industrial bridge (industrial_operations in sharedBridgeGroups)
> "현장/공정/품질처럼 연결되는 운영 구조는 있으나, 목표 직무의 기준 설계나 검증 책임까지 동일하진 않습니다."

### supplier/partner corridor (supplier_partner_network in sharedBridgeGroups)
> "외부 파트너·계정·사업기회 관리 경험은 이어질 수 있지만, 목표 직무의 구조화 수준과 의사결정 범위는 다를 수 있습니다."

### whyNotHigher — no direct overlap + not eligible
> "핵심 업무 신호와 책임 영역에서 직접 겹치는 부분이 확인되지 않아, 구조적 연결이 제한됩니다."

### whyNotHigher — eligible but no direct overlap
> "공통된 역할군/클러스터는 있으나, 목표 직무의 직접 수행 경험까지 갖췄다고 보긴 어렵습니다."

---

## Industrial / Supplier Policy Decision

### industrial_operations
- **결론**: explanation-only
- **이유**: 내부 케이스(PRODUCTION_ENGINEERING→PROCESS_ENGINEERING 등) 전부 jobDistance="same" → isBridgeableDistance=false → bridge floor 자동 차단. 실질 점수 변경 불필요.
- **설명 문구**: "현장/공정/품질처럼 연결되는 운영 구조는 있으나, 목표 직무의 기준 설계나 검증 책임까지 동일하진 않습니다."

### supplier_partner_network
- **결론**: explanation-only
- **이유**: PARTNER_CHANNEL_SALES, KEY_ACCOUNT_MANAGEMENT 모두 commercial_gtm 공유 → 이미 allowlist_fallback 또는 registry eligibility로 bridge floor 진입 가능. 별도 floor 확장 불필요.
- **설명 문구**: "외부 파트너·계정·사업기회 관리 경험은 이어질 수 있지만, 목표 직무의 구조화 수준과 의사결정 범위는 다를 수 있습니다."

---

## Fixture Verification

| fixture | band | registryBridgeEligible | bridgeFloorApplied | explanationAvailable | policyDecision | 판정 |
|---|---|---|---|---|---|---|
| CUSTOMER_SUCCESS → PRODUCT_MANAGEMENT | mid | true | true | true | registry (R4) | ✅ |
| HR_OPS → HR_PLANNING | mid | true | true | true | registry (R4) | ✅ |
| SERVICE_OPERATIONS → OPERATION_PLANNING | mid | true | true | true | registry (R4) | ✅ |
| GENERAL_SALES → BRAND_MARKETING | mid | false | true | true | allowlist_fallback (R4) | ✅ |
| B2B_SALES → PMM | mid | true | true | true | registry (R4) | ✅ |
| PRODUCTION_ENGINEERING → PROCESS_ENGINEERING | low/mid | true | false | true | explanation-only | ✅ |
| PARTNER_CHANNEL_SALES → BUSINESS_DEVELOPMENT | mid | true | true | true | explanation-only (supplier copy) | ✅ |
| GENERAL_SALES → SOFTWARE_DEVELOPMENT | very_low | false | false | true | blocked | ✅ |
| CS_SUPPORT → MECHANICAL_DESIGN | very_low | false | false | true | blocked | ✅ |
| BRAND_MARKETING → BRAND_MARKETING | high | — | — | true | stable | ✅ |

---

## Regression Risks

- explanation extra fields는 spread(append-only) → consumer fallback 안전
- `explanationWhyNotHigher: undefined` → consumer가 undefined 체크 필요 (기존 UI contract 미수정)
- `bridgeContext` null → spread 시 undefined key → consumer 무시 가능

---

## Next Round (Round 6)

- consumer(TransitionLiteResult.jsx)에서 `explanationWhyNotHigher`, `explanationBridgeContext` 렌더링 연결
- `domain_technical_depth`-heavy pair별 별도 guard 검토
- industrial_operations 내부에서 추가 floor 허용 여부 재검토 (fixture 기반)
