# Axis 1 (직무 구조 연결성) — Live SSOT

- date locked: 2026-04-20
- status: v1 live (Round 1–6 완료)
- scoring patch: FROZEN (이번 라운드부터 점수 로직 추가 수정 금지)

---

## 의미 정의

**axis1 = 직무 구조 연결성 (Job Structure Connectivity)**

현재 직무의 핵심 과업 구조(강한 신호, 책임 유형, 역할 클러스터)가
목표 직무와 얼마나 구조적으로 이어지는지를 측정한다.

- 직무명이나 산업이 다르더라도, 실제 수행 과업이 겹치면 높게 나온다.
- 산업 맥락·자격·사람·고객 유형은 axis 2–5에서 다룬다.

---

## 현재 Live Scoring 구성요소

### 1. Weighted Family Signal Read
- **owner**: `getWeightedSignalOverlapStats()` — `buildAxisConnectivityPack.js`
- **SECONDARY_FAMILY_WEIGHT**: 0.4
- primary↔primary overlap: ×1.0, secondary 참여: ×0.4
- 도입 라운드: Round 1

### 2. Taxonomy Guardrail
- **owner**: `applyAxis1TaxonomyGuardrails()` — `buildAxisConnectivityPack.js`
- jobDistance=`"cross"` → penalty -12, cap 72
- jobDistance=`"adjacent"` → penalty -4, cap 80
- familyDistance=`"distant_family"` → penalty -6, cap 76
- 도입 라운드: Round 2 (dead "far" branch → "cross" 수정)

### 3. Bridge Floor 40
- **owner**: `applyAxis1WeakUmbrellaBridge()` — `buildAxisConnectivityPack.js`
- raw < 40일 때 floor=40 적용
- **조건**: (allowlist OR registry eligible) AND noDirectOverlap AND isBridgeableDistance
- noDirectOverlap = strongSignals.overlapCount===0 AND responsibilityHints.overlapCount===0 AND mediumSignals.overlapCount===0
- isBridgeableDistance = jobDistance "adjacent" | "cross"
- 도입 라운드: Round 2 (20→40), Round 3 (registry OR 조건 추가)

### 4. Registry Bridge Eligibility
- **owner**: `resolveAxis1RegistryBridgeSignals()` — `buildAxisConnectivityPack.js`
- **data source**: `JOB_CAPABILITY_CLUSTER_REGISTRY` — `jobCapabilityClusterRegistry.js`
- eligibility 조건:
  ```
  sharedBridgeGroups >= 1
  AND sharedCapabilityClusters >= 2
  AND NOT onlyTechnicalBuild
  AND NOT extremeMismatch (technical_build ↔ commercial_gtm 단독 조합)
  AND noDirectOverlap
  AND isBridgeableDistance
  ```
- `bridgeEligibilitySource`: `"registry"` | `"allowlist_fallback"` | null
- allowlist fallback: `AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST` (GTM 4개 job)
- 도입 라운드: Round 3 (shadow), Round 4 (primary path)

### 5. Limited Cluster Uplift
- **owner**: `getRegistryClusterUplift()` — `buildAxisConnectivityPack.js`
- 적용 위치: guardrail 이후, bridge floor 이전
- uplift:
  - sharedCapabilityClusters.length === 2 → +2
  - sharedCapabilityClusters.length >= 3 → +4
  - max cap: +4
- 동일 조건: noDirectOverlap AND isBridgeableDistance AND NOT onlyTechnicalBuild
- 도입 라운드: Round 4

---

## Explanation Routing 구조

### producer
- **owner**: `buildJobStructureExplanation()` — `axisExplanationRegistry.js`
- input: `signals`, `band`, `breakdown`
- registry fields 소스: `breakdown.weakUmbrellaBridge`
  - `registryBridgeEligible`, `sharedBridgeGroups`, `sharedCapabilityClusters`
  - `bridgeEligibilitySource`, `applied`
- output (append-only):
  ```
  {
    available, summary, positives, gaps, reasons, detailVersion,
    explanationSummary,      // band + bridge 여부 기반 동적 문구
    explanationPositives,    // reasons[] positive 방향
    explanationGaps,         // reasons[] negative 방향
    explanationWhyNotHigher, // overlap/cluster 기반 "왜 더 높지 않은지"
    explanationEvidenceSource, // "registry" | "allowlist_fallback" | "signal_overlap"
    explanationBridgeContext,  // bridgeGroup별 Korean 문구
  }
  ```

### consumer
- **owner**: `TransitionLiteResult.jsx` (detail panel 내)
- 렌더 순서:
  1. `summary` → `primaryBody`
  2. `positives` → 강점 신호 ul
  3. `gaps` → 보완 포인트 ul
  4. `explanationBridgeContext` → "연결되는 지점" (axis1 only, 값 있을 때만)
  5. `explanationWhyNotHigher` → "더 높게 보기 어려운 이유" (axis1 only, 값 있을 때만)
- 도입 라운드: Round 6

### fallback
- `explanation.available === false` → consumer는 `narrative` fallback 사용
- `explanationBridgeContext` 없음 → 섹션 미노출 (safe)
- `explanationWhyNotHigher` 없음 → 섹션 미노출 (safe)

---

## Known Conservative Guards

| Guard | 이유 |
|---|---|
| `noDirectOverlap` gate | 직접 겹치는 케이스에 floor/uplift 중복 적용 방지 |
| `technical_build` 단독 차단 | 기술직 오탐 방지 |
| `extremeMismatch` guard | technical_build ↔ commercial_gtm 단독 조합 차단 |
| `isBridgeableDistance` = adjacent/cross only | same distance는 bridge floor 불필요 (이미 충분한 점수) |
| cluster uplift max +4 | inflation 상한 제어 |
| `finance_planning_control` 단독 케이스 | sharedClusters<2 gate로 자연 보호 |

---

## Deferred (아직 적용하지 않은 항목)

| Item | 이유 |
|---|---|
| `industrial_operations` floor 확장 | 내부 케이스 jobDistance="same" → 자동 차단. 추가 검토 필요 없음 |
| `supplier_partner_network` 별도 floor | commercial_gtm 이미 eligible → 불필요 |
| `domain_technical_depth`-heavy pair guard | 아직 fixture 부족 |
| consumer에서 `explanationEvidenceSource` 렌더 | 현재 UI에서 미노출 (내부 필드) |

---

## 다음 수정 시 체크리스트

수정 전 반드시 확인:
1. `applyAxis1WeakUmbrellaBridge` 내 `noDirectOverlap` / `isBridgeableDistance` gate 유지 여부
2. cluster uplift max +4 상한 유지 여부
3. `technical_build` guard 유지 여부
4. `buildJobStructureExplanation` extra field shape — consumer가 spread로 읽음
5. `docs/axis1-gold-fixtures-v1.md` gold set으로 회귀 검증

---

## Owner 파일 맵

| 역할 | 파일 |
|---|---|
| axis1 scoring | `src/lib/analysis/buildAxisConnectivityPack.js` |
| registry data | `src/data/transitionLite/jobCapabilityClusterRegistry.js` |
| explanation producer | `src/data/transitionLite/axisExplanationRegistry.js` |
| explanation consumer | `src/components/report/TransitionLiteResult.jsx` |
| QA gold set | `docs/axis1-gold-fixtures-v1.md` |
| patch history | `COMM_PATCH_NOTES.md` |
