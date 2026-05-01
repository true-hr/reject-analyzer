# Axis 1 Root Redesign — Architecture Plan

- date: 2026-04-20
- scope: design only. implementation in future rounds.
- status: DESIGN LOCK (no code change in this round)

---

## 1. Executive Summary

- Root problem: axis1 scores bridgeable transitions (e.g. sales → brand marketing) as "low" or "very_low" because it reads only the PRIMARY family's signals, producing 0 overlap even when real task/capability transfer exists.
- The April 3rd investigation doc is partially outdated — live code already uses strongSignals/responsibilityHints/mediumSignals in `computeAxis1Raw()`, but ONLY from the primary family.
- The WeakUmbrellaBridge floor (20 = "low" band) is structurally insufficient for bridgeable GTM transitions where users expect "mid" (raw 40+).
- `classifyJobDistance()` returns "cross" not "far" — the guardrail `if (jobDistance === "far")` never fires. This is a dead branch, not a crash, but the cap/penalty logic it contains is unreachable.
- The cause is data modeling + score formula combined: narrow primary-family read + low umbrella floor = irrational scores for umbrella jobs.
- Top recommendation: expand signal read from primary-family-only to all-families (weighted), and replace the umbrella floor-only bridge with a transferability band overlay.
- Do NOT use LLM/embeddings. Stay deterministic, registry-based.
- Do NOT redesign axis3, axis4, axis5 in this round.
- The downstream output shape (rawScore, displayScore, band, breakdown, explanation) must be preserved.
- Gold fixtures must be built BEFORE any live cutover.

---

## 2. Current Live Axis1 Map

### Owner Files
- Score owner: `src/lib/analysis/buildAxisConnectivityPack.js > scoreAxis1()` → `computeAxis1Raw()` → `applyAxis1TaxonomyGuardrails()` → `applyAxis1WeakUmbrellaBridge()`
- Signal read: `getPrimaryFamilyStrongSignals()`, `getPrimaryFamilyMediumSignals()`, `getJobResponsibilityHints()` (multi-role), `resolveAxis1MetaSignals()`, `resolveAxis1WeakUmbrellaBridgeSignals()`
- Upstream: `classifyTransition.js > classifyJobDistance()` → jobDistance ("same"/"adjacent"/"cross")
- Explanation: `axisExplanationRegistry.js > buildJobStructureExplanation()`
- UI: `TransitionLiteResult.jsx`

### Scoring Flow (verified)
```
base = 18
+ strong.overlapRatio * 42      (reads families[0].strongSignals ONLY)
+ min(14, responsibility * 5)   (reads ALL roles[].responsibilityHints)
+ min(8, medium * 2)            (reads families[0].mediumSignals ONLY)
+ bonus for overlapCount
+ missionType/outputType match (+6 or +2)
→ guardrails (jobDistance/familyDistance/shared)
→ umbrella bridge (floor 20 if noDirectOverlap + allowlist)
→ clamp(15, 95)
```

### Downstream Output Contract
- `rawScore`: int, 15–95
- `displayScore`: int, 20–100
- `band`: "high"|"mid_high"|"mid"|"low"|"very_low"
- `breakdown`: { strongSignals, responsibilityHints, mediumSignals, missionTypeMatch, outputTypeMatch, weakUmbrellaBridge }
- `explanation`: built by axisExplanationRegistry

### Fragile/Coupled Points
- `getAxis1FamilyReadPack()` collects secondaryFamilyIds but only uses them for umbrella eligibility check, NOT for actual signal overlap.
- The AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST has only 4 jobs — any umbrella job not in this list gets no protection at all.
- `applyAxis1TaxonomyGuardrails()` checks `jobDistance === "far"` which is a dead branch (classifyJobDistance never returns "far").
- `resolveJobAxisSignals()` uses `majorCategory` / `subcategory` to classify family distance — this depends on consistent tagging in job ontology items.

---

## 3. Root Cause Analysis

### Critical

**PRIMARY FAMILY ONLY SIGNAL READ**
- Owner: `getPrimaryFamilyStrongSignals()` at L129, `getPrimaryFamilyMediumSignals()` at L133
- Behavior: reads only `families[0].strongSignals` / `families[0].mediumSignals`
- Why irrational: for umbrella jobs (general_sales, brand_marketing etc.), the primary family is just ONE of 4+ behavioral clusters. Cross-family overlap is real but invisible.
- Affected pattern: general_sales (NEW_ACCOUNT_SALES family) → brand_marketing (BRAND_STRATEGY_PLANNING family) → strongSignal overlap = 0 even though both jobs share market-facing execution, target audience definition, and go-to-market motion.
- Result: computeAxis1Raw produces base 18, no signal bonus → raw ≈ 15–20 before guardrails.

### High

**UMBRELLA BRIDGE FLOOR TOO LOW**
- Owner: `applyAxis1WeakUmbrellaBridge()` at L308
- Behavior: when both jobs are in ALLOWLIST and noDirectOverlap, floor = 20
- Why irrational: floor 20 → band "low" (barely), displayScore ~25. User expectation for sales→marketing bridgeable transition: "mid" (raw 40+).
- Only 4 jobs protected (GENERAL_SALES, B2B_SALES, BRAND_MARKETING, PMM). Any umbrella job outside this list gets floor=15 (very_low).
- The bridge only fires when noDirectOverlap — if even 1 signal overlaps by chance, the bridge is bypassed entirely.

**DEAD GUARDRAIL BRANCH**
- Owner: `applyAxis1TaxonomyGuardrails()` at L235
- Behavior: `if (jobDistance === "far")` checks for a value that `classifyJobDistance()` never produces (returns "cross" instead).
- Why this matters: the -12 penalty and cap-at-72 for far transitions are unreachable. "cross" gets 0 adjustment.
- Impact: both negative (no penalty for truly distant transitions) and positive (no artificial cap on bridgeable cross transitions).
- UNVERIFIED: whether "cross" should be treated identically to "far" or differently. This needs a policy decision before patching.

### Medium

**NO MULTI-FAMILY OVERLAP COMPUTATION**
- Owner: same as critical, but structural gap rather than a bug
- Behavior: secondary families' signals exist in ontology (verified: general_sales has 4+ families with full strongSignals) but are never read.
- Why irrational: for a user who worked in general_sales doing both account management AND channel work, the axis1 score doesn't reflect multi-family breadth.
- Affected pattern: any cross-family transition where secondary family signals would show overlap.

**SMALL TRANSFERABILITY BONUS (+6 MAX)**
- Owner: `computeAxis1Raw()` missionType/outputType block
- Behavior: even both matches give only +6 on base 18 = 24. Band threshold for "mid" is 40.
- Why insufficient: meta-level alignment (same mission type, same output type) is a meaningful transferability signal, but the current weight can't move the needle past "low" without signal overlap.

---

## 4. Redesign Target Definition

**One-sentence definition:**
Axis 1 measures how much of the current job's core task structure and working motions can transfer into the target job's core task structure — not whether the two job titles are taxonomically close.

### Band Anchor Table

| band | raw | user-facing meaning |
|---|---|---|
| high (5/5) | ≥88 | 현재 직무의 핵심 과업 구조가 목표 직무와 직접 겹친다. 설명 없이도 상당 부분 연결된다. |
| mid_high (4/5) | ≥56 | 핵심 과업이 상당히 겹치고 일부 보완 설명이 있으면 연결이 자연스럽다. |
| mid (3/5) | ≥40 | 과업 일부가 겹치거나 working motion이 유사하다. 연결 논리를 설명하면 이해 가능하다. **bridgeable transitions should land here or above.** |
| low (2/5) | ≥20 | 직접 겹치는 과업은 적지만 일부 방향성 유사점은 있다. 설명 없이는 연결이 어렵다. |
| very_low (1/5) | <20 | 직무 구조 겹침이 거의 없다. 전환 시 완전한 재정의가 필요하다. |

### Key Boundary Decisions

- **2↔3 boundary (raw 20 vs 40):** For a transition to land in "mid", at least one of these must be true:
  (a) some multi-family strongSignal overlap exists, OR
  (b) the working motion type (market-facing, execution-focused, etc.) is shared, OR
  (c) responsibilityHints overlap >= 3 despite no strongSignal match

- **3↔4 boundary (raw 40 vs 56):** "mid_high" requires either:
  (a) strongSignal overlap ratio ≥ 0.25 from any family combination, OR
  (b) multiple responsibility hint overlaps + missionType match

- **bridgeable-but-not-identical treatment:**
  A bridgeable transition (same GTM umbrella, different family) should score 2.5–3.5/5 depending on:
  - whether secondary family signals overlap
  - whether working motion is shared
  - whether context gap (domain retraining) is small

---

## 5. Proposed New Scoring Architecture

### Scorer Stages

```
Stage 1: Multi-Family Signal Expansion
  → collect strongSignals/mediumSignals from ALL families (not just families[0])
  → weight: primary family signals × 1.0, secondary family signals × 0.5

Stage 2: Task Similarity Score (replaces computeAxis1Raw primary)
  → weighted strong overlap ratio: (primary_overlap × 1.0 + secondary_overlap × 0.5) / normalization
  → responsibilityHints overlap (unchanged — already multi-role)
  → mediumSignals from all families (weighted same as strong)

Stage 3: Working Motion Overlay (new)
  → missionType match: existing signal, weight raised
  → outputType match: existing signal, weight raised
  → optional: capability cluster registry (see below)

Stage 4: Context Gap Penalty
  → retain familyDistance penalty (-6 for distant_family)
  → retain sharedFamiliesCount bonus (+2)
  → drop "far" check (dead branch), add "cross" check instead

Stage 5: Guardrail Band Clamp
  → jobDistance "cross": cap at 78 (not 72 — allow mid_high for strong signal overlap)
  → jobDistance "adjacent": cap at 88
  → jobDistance "same": no cap

Stage 6: Bridge Overlay (replaces applyAxis1WeakUmbrellaBridge)
  → if bridgeable (same capability cluster) AND working motion overlap exists:
      floor = 40 (= "mid" band floor)
  → if bridgeable AND no working motion overlap:
      floor = 25 (= "low" band, slightly above current floor of 20)
  → non-bridgeable allowlist check: removed or replaced with broader capability cluster registry
```

### Evidence Packs

**A. Recommended registry model:**
Add a `JOB_CAPABILITY_CLUSTER_REGISTRY` (new file in `src/data/transitionLite/`):
```js
// Maps jobId → capability clusters
// cluster examples: "market_facing_execution", "data_driven_growth", "stakeholder_mgmt", etc.
const JOB_CAPABILITY_CLUSTER_REGISTRY = {
  JOB_SALES_GENERAL_SALES: ["market_facing_execution", "deal_closing", "relationship_mgmt"],
  JOB_SALES_B2B_SALES: ["market_facing_execution", "deal_closing", "stakeholder_mgmt"],
  JOB_MARKETING_BRAND_MARKETING: ["market_facing_execution", "message_strategy", "audience_targeting"],
  JOB_MARKETING_PRODUCT_MARKETING_PMM: ["market_facing_execution", "product_positioning", "go_to_market"],
  // ... more jobs
};
```

This is append-only, deterministic, and reviewer-controllable.

**B. How current and target jobs are read:**
- Primary family signals: `families[0].strongSignals`, `families[0].mediumSignals` (unchanged, weight 1.0)
- Secondary family signals: `families[1..n].strongSignals`, `families[1..n].mediumSignals` (new, weight 0.5)
- Responsibility hints: `roles[].responsibilityHints` from ALL roles (unchanged)
- Meta signals: `jobTransitionReadMetaRegistry` missionType/outputType (unchanged but higher weight)
- Capability clusters: from new registry (optional overlay)

**C. Core task similarity computation:**
```js
// weighted multi-family strong overlap
const primaryStrong = getOverlapStats(families[0].strongSignals, target.families[0].strongSignals);
const secondaryStrong = getBestSecondaryOverlap(currentAllFamilies, targetAllFamilies);
// weighted sum:
const taskSimilarityRaw = primaryStrong.overlapRatio * 35 + secondaryStrong.bestOverlapRatio * 14;
```

**D. Transferable capability overlap:**
```js
// if capability cluster registry available:
const currentClusters = JOB_CAPABILITY_CLUSTER_REGISTRY[currentJobId] ?? [];
const targetClusters = JOB_CAPABILITY_CLUSTER_REGISTRY[targetJobId] ?? [];
const clusterOverlapCount = intersection(currentClusters, targetClusters).length;
const capabilityBonus = clusterOverlapCount >= 2 ? 8 : clusterOverlapCount === 1 ? 4 : 0;
```

**E. Context gap computation:**
```js
// retain from current:
familyDistance === "distant_family" → -6
jobDistance === "cross" → cap at 78 (not 72 — rename the branch)
```

**F. Confidence:**
```js
// how many signal types had data:
const confidence = (hasStrong ? 1 : 0) + (hasResponsibility ? 1 : 0) + (hasMeta ? 1 : 0);
// if confidence === 0: apply conservative floor (stay at low band max, not very_low)
```

**G. Final score/band derivation:**
```
raw = base(18)
    + taskSimilarityRaw (primary + secondary weighted)
    + responsibilityBonus (unchanged logic)
    + mediumBonus (extended to all families)
    + metaBonus (raised from +6 to +8 max)
    + capabilityBonus (new, +0 to +8)
    → contextGapModifier
    → guardrailClamp
    → bridgeFloor (new: 40 if bridgeable + working motion, 25 if bridgeable only)
```

**H. Signal reuse status:**

| signal | status | change |
|---|---|---|
| families[0].strongSignals | reused | extend to all families |
| families[0].mediumSignals | reused | extend to all families |
| roles[].responsibilityHints | reused | unchanged |
| missionType/outputType | reused | weight raised |
| jobDistance | reused | rename "cross" branch from dead to active |
| familyDistance | reused | unchanged as modifier |
| sharedFamiliesCount | reused | unchanged |
| weakUmbrellaBridge allowlist | deprecated | replaced by capability cluster registry |
| summaryTemplate | evidence-only | never in score |

---

## 6. Safe Migration Plan

### Round 0 — Investigation/Doc Lock (current round)
- Purpose: confirm live code state, identify root cause, design architecture
- Files touched: docs only (this file + investigation.md)
- Risk: none
- Validation: read-only review of findings
- Rollback: n/a

### Round 1 — Multi-Family Signal Read Expansion
- Purpose: expand getPrimaryFamilyStrongSignals/Medium to include secondary families at 0.5 weight
- Files likely touched:
  - `src/lib/analysis/buildAxisConnectivityPack.js` (getPrimaryFamilyStrongSignals → getAllFamiliesSignals)
- Risk: LOW — additive only, existing primary family unchanged, secondary adds 0.5-weighted bonus
- Validation: run existing test fixtures, confirm no regressions; spot-check 5 transition pairs
- Rollback: revert getAllFamiliesSignals back to getPrimaryFamily

### Round 2 — Bridge Floor Raise + Cross Branch Fix
- Purpose: raise umbrella bridge floor to 40 (mid), fix "cross" dead branch
- Files likely touched:
  - `src/lib/analysis/buildAxisConnectivityPack.js` (applyAxis1WeakUmbrellaBridge floor 20→40, "far"→"cross")
- Risk: MEDIUM — affects all umbrella job pairs, score will rise; may affect explanation consistency
- Validation: must have gold fixtures from Round 2 QA run BEFORE going live
- Rollback: revert floor value and branch condition

### Round 3 — Capability Cluster Registry (Shadow Scorer)
- Purpose: build JOB_CAPABILITY_CLUSTER_REGISTRY and attach as shadow overlay (not live yet)
- Files likely touched:
  - `src/data/transitionLite/jobCapabilityClusterRegistry.js` (new file)
  - `src/lib/analysis/buildAxisConnectivityPack.js` (shadow read, log only)
- Risk: LOW — shadow only, no UI impact
- Validation: compare shadow output vs live output for 20 fixtures

### Round 4 — Live Cutover (with Explanation Update)
- Purpose: replace umbrella allowlist bridge with capability cluster bridge; raise meta bonus weights
- Files likely touched:
  - `src/lib/analysis/buildAxisConnectivityPack.js`
  - `src/data/transitionLite/axisExplanationRegistry.js` (buildJobStructureExplanation update)
  - `00_HQ/SSOT_Map.md`, `01_Product/Passmap_5Axis_Guide.md`
- Risk: HIGH — live score change for many transitions
- Validation: full gold fixture suite must pass; regression baseline check
- Rollback: feature flag or revert to Round 2 state

### Round 5 — Explanation/UI Cleanup
- Purpose: update explanation copy to reflect multi-family evidence language
- Files likely touched:
  - `src/data/transitionLite/axisExplanationRegistry.js`
  - `01_Product/Passmap_5Axis_Guide.md`
- Risk: LOW — explanation only, no score change
- Validation: spot-check explanation quality for 10 transitions

---

## 7. Gold Fixture Plan

Fixture format: `{ currentJobId, targetJobId, expectedBand, expectedRaw range, rationale }`

### Group A: Identical / High-Stability (expect high or mid_high)
1. GENERAL_SALES → GENERAL_SALES: expected high (same job)
2. B2B_SALES → B2B_SALES: expected high (same job)
3. BRAND_MARKETING → BRAND_MARKETING: expected high (same job)
4. GENERAL_SALES → B2B_SALES: expected mid_high–high (same subcategory, strong signal overlap)
5. BRAND_MARKETING → PMM: expected mid_high (adjacent families, some signal overlap)

### Group B: Adjacent Same-Domain (expect mid or mid_high)
6. GENERAL_SALES → BUSINESS_DEVELOPMENT: expected mid–mid_high (sales motion overlap)
7. B2B_SALES → ACCOUNT_MANAGEMENT: expected mid–mid_high (account retention overlap)
8. BRAND_MARKETING → CONTENT_MARKETING: expected mid (campaign/messaging overlap)
9. PMM → BUSINESS_PLANNING: expected mid (strategy output overlap)
10. GENERAL_SALES → CHANNEL_SALES: expected mid (same major category, partial family overlap)

### Group C: Bridgeable Cross-Family (expect mid, current produces low — KEY TEST CASES)
11. GENERAL_SALES → BRAND_MARKETING: expected mid [2.5–3/5], current low [1–2/5]
12. B2B_SALES → PMM: expected mid [2.5–3/5], current low [1–2/5]
13. GENERAL_SALES → PMM: expected mid [2.5–3/5], current low [1–2/5]
14. B2B_SALES → BRAND_MARKETING: expected mid [2.5–3/5], current low
15. BRAND_MARKETING → BUSINESS_DEVELOPMENT: expected low–mid [2/5], some overlap expected

### Group D: Deceptive Lookalikes (must NOT score high even if titles sound similar)
16. BRAND_MARKETING → PERFORMANCE_MARKETING: expected mid–mid_high (different signal clusters despite "marketing")
17. GENERAL_SALES → CUSTOMER_SUCCESS: expected low–mid (different motion: closing vs retention/support)
18. PMM → SERVICE_PLANNING: expected low (product-market positioning vs feature specification are different)
19. B2B_SALES → FINANCIAL_SALES (보험영업): expected low–mid (same sales motion but domain gap is large)
20. BRAND_MARKETING → HR_RECRUITING: expected low–very_low (both "people-facing" but no task overlap)

### Group E: Truly Distant Negatives (must score low or very_low)
21. GENERAL_SALES → SOFTWARE_ENGINEER: expected very_low (no signal overlap)
22. BRAND_MARKETING → ACCOUNTING: expected very_low
23. B2B_SALES → DATA_SCIENCE: expected very_low
24. PMM → LEGAL: expected very_low
25. GENERAL_SALES → NURSE (if in ontology): expected very_low

Note: ranges given where current data model cannot justify precise single-point precision.

---

## 8. Exact Future Patch Surface

### Scorer Owners
- `src/lib/analysis/buildAxisConnectivityPack.js`
  - `getPrimaryFamilyStrongSignals()` → LIKELY REQUIRED (rename + expand)
  - `getPrimaryFamilyMediumSignals()` → LIKELY REQUIRED (rename + expand)
  - `computeAxis1Raw()` → LIKELY REQUIRED (secondary signal input)
  - `applyAxis1TaxonomyGuardrails()` → LIKELY REQUIRED (fix dead "far" branch)
  - `applyAxis1WeakUmbrellaBridge()` → LIKELY REQUIRED (replace with capability cluster bridge)
  - `AXIS1_MULTI_FAMILY_UMBRELLA_ALLOWLIST` → LIKELY REQUIRED (deprecate or expand)
  - `getAxis1FamilyReadPack()` → MAYBE REQUIRED (if bridge redesigned)
  - `scoreAxis1()` → MAYBE REQUIRED (if output shape needs breakdown fields)
  - all other axis scorers (scoreAxis2–5) → SHOULD REMAIN UNTOUCHED

### Registry / Data Owners
- `src/data/transitionLite/jobCapabilityClusterRegistry.js` → LIKELY REQUIRED (new file, Round 3)
- `src/data/job/ontology/sales/general_sales.js` → SHOULD REMAIN UNTOUCHED (data is fine)
- `src/data/job/ontology/marketing/brand_marketing.js` → SHOULD REMAIN UNTOUCHED
- `src/data/transitionLite/jobTransitionReadMetaRegistry.js` → SHOULD REMAIN UNTOUCHED

### Output / Builder Owners
- `src/data/transitionLite/axisExplanationRegistry.js > buildJobStructureExplanation()` → LIKELY REQUIRED (Round 4+)
- `src/lib/transitionLite/classifyTransition.js` → SHOULD REMAIN UNTOUCHED (upstream classification)
- `src/components/report/TransitionLiteResult.jsx` → SHOULD REMAIN UNTOUCHED

### QA / Docs Owners
- `docs/axis1-root-redesign-investigation.md` → done (this round)
- `docs/axis1-root-redesign-plan.md` → done (this round)
- `00_HQ/SSOT_Map.md` → LIKELY REQUIRED (update after Round 4)
- `01_Product/Passmap_5Axis_Guide.md` → LIKELY REQUIRED (update after Round 4)
- `05_Execution/Transition_5Axis_Redesign_Log.md` → LIKELY REQUIRED (append each round)
- `05_Execution/Decision_Log.md` → LIKELY REQUIRED (log final design decision)

---

## 9. Decision Recommendation

**Recommend proceeding** with the multi-round redesign plan.

**Preferred strategy:** Incremental, append-only, no big-bang rewrite.
- Round 1 (multi-family signal expansion) is the highest ROI with lowest risk.
- Round 2 (bridge floor raise) directly fixes the reported "weird score" cases.
- Rounds 3–4 (capability cluster) are optional enhancement, not required for immediate fix.

**Biggest benefit:** Bridgeable GTM transitions (sales ↔ marketing) move from "low" to "mid" band without any ad-hoc allowlist exception. The fix is structural, not a patch.

**Biggest risk:** Round 2 bridge floor raise may cause explanation text to become inconsistent with new score levels. Explanation owner (`buildJobStructureExplanation`) must be updated in sync, not after.

**Must be locked before patching begins:**
1. Gold fixtures for Group C (bridgeable cross-family) — at least 5 cases with verified expected bands
2. Decision: should "cross" distance be treated same as "far" in guardrails, or differently?
3. Decision: what is the maximum score an umbrella bridge transition can achieve without any actual signal overlap? (Proposed: 40 = mid floor, not higher)

---

## 10. Repository Documentation Update

Files created this round:
- `docs/axis1-root-redesign-investigation.md` (investigation findings, doc vs code discrepancy, verified signal inventory)
- `docs/axis1-root-redesign-plan.md` (this file — architecture plan)

Append to `05_Execution/Transition_5Axis_Redesign_Log.md` next round after design lock confirmation.

Update `00_HQ/SSOT_Map.md` only after Round 4 live cutover (code change must precede doc update per SSOT rules).
