# Axis 1 Next Rollout Blueprint

- date: 2026-04-20
- scope: DESIGN ONLY. Exact patch targets for Round 1–4 implementation.
- depends on: docs/axis1-capability-registry-draft.md, docs/axis1-root-redesign-plan.md

---

## Round Map

| Round | Title | Status | Risk |
|---|---|---|---|
| Round 1 | All-family signal read expansion | READY TO IMPLEMENT | Low |
| Round 2 | Dead branch fix + bridge floor raise | Pending Round 1 validation | Medium |
| Round 3 | Capability registry shadow mode | Pending Round 2 stable | Low (shadow only) |
| Round 4 | Capability registry live scoring | Pending Round 3 logs | Medium |

---

## Section 10: Exact Future Patch Blueprint

### Round 1 — All-Family Signal Read Expansion

#### Must Change

**`src/lib/analysis/buildAxisConnectivityPack.js`**
- Why: `getPrimaryFamilyStrongSignals()` and `getPrimaryFamilyMediumSignals()` read `families[0]` only — primary root cause.
- Exact anchors:
  - `getPrimaryFamilyStrongSignals(jobItem)` — behavior-changing (expand to all families with weighting)
  - `getPrimaryFamilyMediumSignals(jobItem)` — same
  - `buildAxis1Signals()` — may need to pass weighted set instead of flat union
- Change type: behavior-changing (not append-only — existing function contract changes)
- Proposed new logic:
  ```js
  function getAllFamiliesStrongSignals(jobItem) {
    const families = jobItem?.families ?? [];
    const primary = uniqueNormalizedStrings(families[0]?.strongSignals ?? []);
    const secondary = families.slice(1).flatMap(f => f?.strongSignals ?? []).map(normalizeString).filter(Boolean);
    // primary weight: 1.0 — secondary weight: 0.4 (PROPOSED)
    return { primary, secondary };
  }
  ```
- Note: `computeAxis1Raw()` must be updated to consume weighted signals, not just flat overlap ratio.

**`src/lib/analysis/buildAxisConnectivityPack.js > computeAxis1Raw()`**
- Why: receives signals from helpers — must accept new weighted shape
- Change type: behavior-changing
- Downstream contract (`rawScore`, `displayScore`, `band`) preserved — only internal computation changes.

#### May Change

**`src/lib/analysis/buildAxisConnectivityPack.js > applyAxis1WeakUmbrellaBridge()`**
- Only if Round 1 signals alone do not raise GTM bridge cases to "mid".
- If needed: raise floor from 20 → 40 in same PR. Depends on fixture validation.

#### Should Remain Untouched (Round 1)

- `src/lib/transitionLite/classifyTransition.js` — jobDistance/familyDistance logic untouched
- `src/lib/analysis/axisExplanationRegistry.js` — explanation text untouched
- `src/data/transitionLite/capabilityRegistry.js` — newgrad registry untouched
- All axis 2–5 files — no touch
- All downstream consumers of `{ rawScore, displayScore, band, breakdown, explanation }` — contract preserved

---

### Round 2 — Dead Branch Fix + Bridge Floor Raise

#### Must Change

**`src/lib/analysis/buildAxisConnectivityPack.js > applyAxis1TaxonomyGuardrails()`**
- Dead branch: `if (jobDistance === "far")` — classifyJobDistance never returns "far"
- Fix: change to `if (jobDistance === "cross")` with appropriate penalty (-6 PROPOSED, not -12)
- Or: remove penalty for cross entirely if Round 1 all-family read already handles the gap
- Decision: depends on Round 1 fixture results

**`src/lib/analysis/buildAxisConnectivityPack.js > AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST`**
- Current: 4 hardcoded job IDs
- Round 2: expand ALLOWLIST to cover additional GTM bridge cases as temporary measure
- Round 4: replace with registry `bridgeGroups` lookup (permanent solution)

#### May Change

**`src/lib/analysis/buildAxisConnectivityPack.js > applyAxis1WeakUmbrellaBridge()`**
- Raise floor: 20 → 40
- Condition: both jobs in ALLOWLIST AND noDirectOverlap AND familyDistance=distant_family

#### Should Remain Untouched (Round 2)

- `classifyTransition.js` — do not change what "cross" means, only how it's penalized
- `axisExplanationRegistry.js` — no explanation changes yet

---

### Round 3 — Capability Registry Shadow Mode

#### Must Change (create new)

**`src/data/transitionLite/jobCapabilityClusterRegistry.js`** (NEW FILE)
- Create with full registry draft from `docs/axis1-capability-registry-draft.md > Section 5`
- Exports: `JOB_CAPABILITY_CLUSTER_REGISTRY`, `CAPABILITY_CLUSTER_TAXONOMY`
- No import from production scorer yet in Round 3

**`src/lib/analysis/buildAxisConnectivityPack.js > buildAxis1Signals()`**
- Add: read from registry, compute `clusterOverlapRatio`, `sharedBridgeGroups`
- Write to: `breakdown.capabilityClusterOverlap` (new subfield — safe to add, consumers null-check)
- Do NOT add clusterBonus to `raw` yet (shadow only)

#### Should Remain Untouched (Round 3)

- `computeAxis1Raw()` scoring math — no raw change yet
- `applyAxis1WeakUmbrellaBridge()` — still uses ALLOWLIST from Round 2
- All downstream consumers — `breakdown.capabilityClusterOverlap` is new key, additive-safe

---

### Round 4 — Capability Registry Live Scoring

#### Must Change

**`src/lib/analysis/buildAxisConnectivityPack.js > computeAxis1Raw()`**
- Add: `raw += clusterBonus` (0–12, capped)
- Change: `applyAxis1WeakUmbrellaBridge()` reads from `bridgeGroups` registry match instead of ALLOWLIST
- Preserve: raw range 15–95 (clusterBonus must not push raw above ceiling)

**`src/lib/analysis/buildAxisConnectivityPack.js > applyAxis1WeakUmbrellaBridge()`**
- Replace ALLOWLIST check with: `registryEntry(jobId)?.bridgeGroups` intersection check
- Keep floor logic: if bridgeEligible → floor = 40 (raised from Round 2)

**`src/lib/analysis/axisExplanationRegistry.js > buildJobStructureExplanation()`**
- Add: routing logic based on `breakdown.capabilityClusterOverlap` and `workingMotionTags`
- Select explanation template: identical / adjacent / bridgeable / deceptive / distant
- Templates: from `docs/axis1-capability-registry-draft.md > Section 7`

#### May Change

**`src/data/transitionLite/jobCapabilityClusterRegistry.js`**
- Expand coverage beyond initial 20 jobs
- Refine cluster mappings based on Round 3 shadow log analysis

---

## Verified Anchors

| Anchor | File | Line Area | Note |
|---|---|---|---|
| `getPrimaryFamilyStrongSignals` | buildAxisConnectivityPack.js | ~L200 area | Round 1 target |
| `getPrimaryFamilyMediumSignals` | buildAxisConnectivityPack.js | ~L210 area | Round 1 target |
| `computeAxis1Raw` | buildAxisConnectivityPack.js | ~L250 area | Round 1 + Round 4 |
| `applyAxis1TaxonomyGuardrails` | buildAxisConnectivityPack.js | ~L300 area | Round 2 dead branch |
| `AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST` | buildAxisConnectivityPack.js | ~L350 area | Round 2 + Round 4 |
| `applyAxis1WeakUmbrellaBridge` | buildAxisConnectivityPack.js | ~L360 area | Round 2 + Round 4 |
| `getAxis1Band` | buildAxisConnectivityPack.js | ~L400 area | Unchanged |
| `buildJobStructureExplanation` | axisExplanationRegistry.js | UNVERIFIED line | Round 4 |

Note: Line numbers are approximate from prior read. Re-verify with Grep before patching.

---

## Pre-Round 1 Checklist

Before implementing Round 1:
- [ ] Run current gold fixture suite (25 cases from redesign plan) — capture baseline raw scores
- [ ] Confirm GENERAL_SALES → BRAND_MARKETING current raw (expected ~20, "low")
- [ ] Confirm B2B_SALES → PMM current raw
- [ ] Confirm RECRUITING → HRBP current raw
- [ ] Confirm ACCOUNTING → FP_AND_A current raw
- [ ] After Round 1 patch: re-run all 25 fixtures, compare delta
- [ ] Validate no regressions in same-family transitions (should not change significantly)

---

## Pre-Round 3 Checklist

Before importing registry:
- [ ] Confirm all 11 job ID corrections from Section 5 mismatch table with team
- [ ] Validate 20-job registry draft against live job ontology file reads
- [ ] Review cluster assignments for at least 5 additional jobs beyond priority list
- [ ] Confirm `breakdown` consumer null-check behavior (new key safety)
