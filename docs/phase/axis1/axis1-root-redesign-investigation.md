# Axis 1 Root Redesign — Investigation Report

- date: 2026-04-20
- scope: investigation + design only. production code not touched.
- round: SAFE INVESTIGATION (follows 2026-04-03 initial investigation)

---

## Files Inspected

- `src/lib/analysis/buildAxisConnectivityPack.js` — full read
- `src/lib/transitionLite/classifyTransition.js` — L100–230, L350–369
- `src/data/job/ontology/sales/general_sales.js` — L1–260
- `src/data/job/ontology/marketing/brand_marketing.js` — L1–60
- `src/data/job/ontology/business/business_development.js` — L1–80
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js` — grep for missionType/outputType
- `00_HQ/SSOT_Map.md` — owner map section
- `05_Execution/Transition_5Axis_Redesign_Log.md` — full read

---

## Doc vs Code Discrepancy

The April 3rd redesign log (line 122) states:
> "현재 Axis 1 producer의 실질 입력은 jobDistance, familyDistance, sharedFamiliesCount뿐이다."

This is **outdated**. The live code as of 2026-04-20 already has `computeAxis1Raw()` that uses:
- `strongSignals` overlap (primary family only)
- `responsibilityHints` overlap (all roles)
- `mediumSignals` overlap (primary family only)
- `missionType/outputType` match bonus

**Trust live code.** The April 3rd log describes a prior state, not the current state.

---

## Key Verified Findings

### A. Current axis1 exact scoring pipeline

```
buildAxisConnectivityPack()
  → axis1Signals constructed with:
      jobDistance (from classifyTransition.classifyJobDistance)
      familyDistance (from resolveJobAxisSignals → classifyFamilyDistance)
      sharedFamiliesCount
      currentStrongSignals = getPrimaryFamilyStrongSignals(currentJobItem)  ← PRIMARY ONLY
      targetStrongSignals  = getPrimaryFamilyStrongSignals(targetJobItem)   ← PRIMARY ONLY
      currentResponsibilityHints = getJobResponsibilityHints()              ← ALL ROLES
      targetResponsibilityHints  = getJobResponsibilityHints()              ← ALL ROLES
      currentMediumSignals = getPrimaryFamilyMediumSignals()                ← PRIMARY ONLY
      targetMediumSignals  = getPrimaryFamilyMediumSignals()                ← PRIMARY ONLY
      missionType/outputType from jobTransitionReadMetaRegistry

  → computeAxis1Raw(signals):
      base = 18
      + strong.overlapRatio * 42        (max ~42)
      + min(14, responsibility.overlapCount * 5)
      + min(8,  medium.overlapCount * 2)
      + bonus: strong >= 2 (+6), >= 1 (+3)
      + bonus: responsibility >= 2 (+4), >= 1 (+2)
      + meta: both missionType+outputType match (+6), either (+2)
      → applyAxis1TaxonomyGuardrails()

  → applyAxis1TaxonomyGuardrails():
      jobDistance == "far"      → raw -= 12, cap at 72
      jobDistance == "same"     → raw += 4
      jobDistance == "adjacent" → raw += 0
      jobDistance == "cross"    → (no branch: falls through with 0 adjustment)
      familyDistance == "distant_family" → raw -= 6
      familyDistance == "same_family"    → raw += 3
      familyDistance == "adjacent_family" → raw += 2
      sharedFamiliesCount >= 1 → raw += 2

  → applyAxis1WeakUmbrellaBridge():
      if both jobs are in ALLOWLIST (4 jobs only) AND same bridgeGroup
      AND noDirectOverlap (strong=0, responsibility=0, medium=0)
      AND familyDistance == "distant_family"
      AND jobDistance == "adjacent" OR "cross"
      → floor = 20

  → getAxis1Band(raw):
      >= 88 → high
      >= 56 → mid_high
      >= 40 → mid
      >= 20 → low
      else  → very_low

Raw range: 15–95
```

### B. classifyJobDistance returns "cross", not "far"

`classifyJobDistance()` returns: "same" | "adjacent" | "cross"

But `applyAxis1TaxonomyGuardrails()` checks: `if (jobDistance === "far")` — this branch **never fires**.

Impact: "cross" transitions get no penalty from guardrail but also no cap and no floor. They fall through with 0 adjustment from the distance signal. The only penalty comes from `familyDistance === "distant_family"` (-6).

### C. Primary family dominance confirmed

For general_sales (JOB_SALES_GENERAL_SALES):
- families[0] = NEW_ACCOUNT_SALES
- `getPrimaryFamilyStrongSignals()` returns ONLY NEW_ACCOUNT_SALES.strongSignals

For brand_marketing (JOB_MARKETING_BRAND_MARKETING):
- families[0] = BRAND_STRATEGY_PLANNING

These two primary families have 0 strongSignal overlap (sales closing tasks vs brand positioning tasks).
Secondary families in general_sales (e.g. CHANNEL_ROUTE_SALES) may have signals that overlap with marketing distribution, but these are never read.

### D. responsibilityHints IS multi-role (partial exception)

`getJobResponsibilityHints()` reads from ALL `roles[].responsibilityHints`, not just primary family roles.
But for general_sales → brand_marketing, cross-job role hints ("신규 고객 발굴", "계약 협의" vs brand_marketing role hints) still have near-zero overlap.

### E. WeakUmbrellaBridge floor of 20 is insufficient

For general_sales → brand_marketing:
- noDirectOverlap = true (0/0/0)
- weakUmbrellaBridgeEligible = true
- familyDistance = "distant_family"
- jobDistance = "cross"
→ bridge applies, floor = 20

Result: raw = max(15, 20) = 20
Band: getAxis1Band(20) = "low" (barely)
displayScore: ~25

User-expected band for this bridgeable GTM transition: "mid" (raw 40–56)
Gap: floor lands 20–36 points below user expectation.

### F. Downstream consumer contracts (output shape)

Consumers expect from axis1:
- `rawScore` (int, 15–95)
- `displayScore` (int, 20–100)
- `band` ("high" | "mid_high" | "mid" | "low" | "very_low")
- `breakdown.strongSignals` (overlap stats)
- `breakdown.responsibilityHints` (overlap stats)
- `breakdown.mediumSignals` (overlap stats)
- `breakdown.missionTypeMatch` (bool)
- `breakdown.outputTypeMatch` (bool)
- `breakdown.weakUmbrellaBridge` (bridge result)
- `explanation` (from buildJobStructureExplanation)

These contracts must be preserved in any redesign.

---

## Decision

- Proceed with redesign.
- Round 1 target: expand signal read from primary-family-only to all-families.
- Round 2 target: raise umbrella bridge floor to mid-range OR replace with capability-based overlay.
- Axis 4 is already updated per redesign log (April 3rd) — do NOT touch in this round.
- No production patch in current round.

---

## Next Step

See `docs/axis1-root-redesign-plan.md` for full architecture proposal.

Owner assumptions:
- score owner: `buildAxisConnectivityPack.js > scoreAxis1()`
- signal read owner: `buildAxisConnectivityPack.js > getPrimaryFamilyStrongSignals()` etc.
- explanation owner: `axisExplanationRegistry.js > buildJobStructureExplanation()`
- upstream: `classifyTransition.js > classifyJobDistance()`
