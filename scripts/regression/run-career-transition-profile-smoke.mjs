/**
 * run-career-transition-profile-smoke.mjs
 *
 * Career mode transition profile의 activation / boundary / nonfire 계약 검증.
 * D/E의 run-newgrad-ui-insight-surface-smoke.mjs와 독립적으로 실행.
 *
 * AUTO CASES (registry 기반 자동 생성):
 *   ACTIVATION    - profile 발화 확인 + slot/shouldMention 검증
 *   BOUNDARY_COPY - 과대평가 문구 금지 확인
 *   NONFIRE       - profile A 입력 시 profile B 미발화 확인 (cross-nonfire)
 *
 * SUPPLEMENTAL CASES (career-transition-case-matrix.js):
 *   SUPPLEMENTAL_LOCKED - auto case로 이미 커버된 경우 SKIP
 *   수동 설계 edge case 또는 추가 coverage에만 활용
 *
 * 실행 방법:
 *   node scripts/regression/run-career-transition-profile-smoke.mjs
 *   node scripts/regression/run-career-transition-profile-smoke.mjs --case AUTO-ACTIVATION-CUSTOMER_SUPPORT_TO_SERVICE_PLANNING
 */

import { buildTransitionLiteResult } from "../../src/lib/transitionLite/buildTransitionLiteResult.js";
import { CAREER_TRANSITION_CASE_PROFILES } from "../../src/lib/analysis/careerTransitionCaseProfiles.js";
import { CAREER_TRANSITION_SUPPLEMENTAL_CASES } from "./career-transition-case-matrix.js";

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const caseFlag = args.indexOf("--case");
const filterCaseId = caseFlag !== -1 ? args[caseFlag + 1] : null;

// ─── Auto case generation ────────────────────────────────────────────────────

const implemented = CAREER_TRANSITION_CASE_PROFILES.filter((p) => p.status === "IMPLEMENTED");

function buildAutoCases(profiles) {
  const cases = [];

  for (const profile of profiles) {
    const srcId = profile.sourceJobIds[0];
    const tgtId = profile.targetJobIds[0];
    const input = {
      currentJobId: srcId,
      currentIndustryId: profile.smokeInput.currentIndustryId,
      targetJobId: tgtId,
      targetIndustryId: profile.smokeInput.targetIndustryId,
    };

    // A. Activation
    cases.push({
      caseId: `AUTO-ACTIVATION-${profile.id}`,
      caseType: "ACTIVATION",
      description: `${profile.id} 발화 확인`,
      ...input,
      expectedProfileIds: [profile.id],
      forbiddenProfileIds: [],
      expectedAxisSlots: profile.smoke.activation.expectedAxisSlots ?? {},
      shouldMention: profile.smoke.activation.shouldMention ?? [],
      shouldNotMention: profile.smoke.activation.shouldNotMention ?? [],
    });

    // B. Boundary Copy
    cases.push({
      caseId: `AUTO-BOUNDARY-${profile.id}`,
      caseType: "BOUNDARY_COPY",
      description: `${profile.id} 과대평가 문구 금지 확인`,
      ...input,
      expectedProfileIds: [profile.id],
      forbiddenProfileIds: [],
      expectedAxisSlots: {},
      shouldMention: profile.smoke.boundaryCopy.shouldMention ?? [],
      shouldNotMention: profile.smoke.boundaryCopy.shouldNotMention ?? [],
    });
  }

  // C. Cross Nonfire — profile A 입력에서 profile B 미발화
  for (const profileA of profiles) {
    const srcId = profileA.sourceJobIds[0];
    const tgtId = profileA.targetJobIds[0];
    const input = {
      currentJobId: srcId,
      currentIndustryId: profileA.smokeInput.currentIndustryId,
      targetJobId: tgtId,
      targetIndustryId: profileA.smokeInput.targetIndustryId,
    };

    for (const profileB of profiles) {
      if (profileA.id === profileB.id) continue;
      cases.push({
        caseId: `AUTO-NONFIRE-FROM-${profileA.id}-BLOCKS-${profileB.id}`,
        caseType: "NONFIRE",
        description: `${profileA.id} 입력에서 ${profileB.id} 오발화 방지`,
        ...input,
        expectedProfileIds: [],
        forbiddenProfileIds: [profileB.id],
        expectedAxisSlots: {},
        shouldMention: [],
        shouldNotMention: profileB.smoke.nonfire.shouldNotMention ?? [],
      });
    }
  }

  return cases;
}

const autoCases = buildAutoCases(implemented);

// Build auto coverage set for supplemental deduplication
const autoCoverage = new Set();
for (const c of autoCases) {
  if (c.caseType === "ACTIVATION") {
    autoCoverage.add(`ACTIVATION:${(c.expectedProfileIds ?? [])[0]}`);
  } else if (c.caseType === "BOUNDARY_COPY") {
    autoCoverage.add(`BOUNDARY:${(c.expectedProfileIds ?? [])[0]}`);
  } else if (c.caseType === "NONFIRE") {
    autoCoverage.add(`NONFIRE:${c.currentJobId}:${c.targetJobId}:${(c.forbiddenProfileIds ?? [])[0]}`);
  }
}

function getSupplementalCoverageKey(c) {
  if (c.caseType === "ACTIVATION") return `ACTIVATION:${(c.expectedProfileIds ?? [])[0]}`;
  if (c.caseType === "BOUNDARY_COPY") return `BOUNDARY:${(c.expectedProfileIds ?? [])[0]}`;
  if (c.caseType === "NONFIRE") return `NONFIRE:${c.currentJobId}:${c.targetJobId}:${(c.forbiddenProfileIds ?? [])[0]}`;
  return null;
}

// ─── Text aggregation ────────────────────────────────────────────────────────

function collectAllOverlayText(result) {
  const texts = [];
  const axes = result?.axisPack?.axes ?? {};
  for (const axisData of Object.values(axes)) {
    const exp = axisData?.explanation ?? {};
    for (const slot of ["lead", "scoreReason", "liftOrLimit", "criteria", "summary"]) {
      if (typeof exp[slot] === "string" && exp[slot].trim()) {
        texts.push(exp[slot]);
      }
    }
  }
  return texts.join("\n");
}

function checkSlotFilled(result, axisKey, slot) {
  const exp = result?.axisPack?.axes?.[axisKey]?.explanation ?? {};
  return typeof exp[slot] === "string" && exp[slot].trim().length > 0;
}

// ─── Case runner ─────────────────────────────────────────────────────────────

function runCase(fixture) {
  let result;
  try {
    result = buildTransitionLiteResult({
      currentJobId: fixture.currentJobId,
      currentIndustryId: fixture.currentIndustryId,
      targetJobId: fixture.targetJobId,
      targetIndustryId: fixture.targetIndustryId,
    });
  } catch (err) {
    return { status: "FAIL", violations: [`runtime error: ${err.message}`], notices: [], firedProfileIds: [], result: null };
  }

  const firedProfileIds = result?.careerTransitionFiredProfileIds ?? [];
  const allText = collectAllOverlayText(result);
  const violations = [];
  const notices = [];

  if (fixture.caseType === "ACTIVATION" || fixture.caseType === "BOUNDARY_COPY") {
    for (const expectedId of (fixture.expectedProfileIds ?? [])) {
      if (!firedProfileIds.includes(expectedId)) {
        violations.push(`expected profile not fired: ${expectedId}`);
      }
    }
  }

  if (fixture.caseType === "ACTIVATION") {
    for (const [axisKey, slots] of Object.entries(fixture.expectedAxisSlots ?? {})) {
      for (const slot of slots) {
        if (!checkSlotFilled(result, axisKey, slot)) {
          violations.push(`slot missing: ${axisKey}.${slot}`);
        }
      }
    }
  }

  if (fixture.caseType === "NONFIRE") {
    for (const forbiddenId of (fixture.forbiddenProfileIds ?? [])) {
      if (firedProfileIds.includes(forbiddenId)) {
        violations.push(`forbidden profile fired: ${forbiddenId}`);
      }
    }
  }

  for (const keyword of (fixture.shouldMention ?? [])) {
    if (!allText.includes(keyword)) {
      notices.push(`shouldMention missing: "${keyword}"`);
    }
  }

  for (const keyword of (fixture.shouldNotMention ?? [])) {
    if (allText.includes(keyword)) {
      violations.push(`shouldNotMention violated: "${keyword}"`);
    }
  }

  const status = violations.length > 0 ? "FAIL" : notices.length > 0 ? "ISSUE" : "PASS";
  return { status, violations, notices, firedProfileIds, result };
}

function printCaseResult(fixture, { status, violations, notices, firedProfileIds, result }) {
  const statusIcon = status === "FAIL" ? "✗" : status === "ISSUE" ? "△" : "✓";
  const statusLabel = `[${status}]`;
  console.log(`\n  ${statusIcon}  ${statusLabel} ${fixture.caseId}`);
  console.log(`       ${fixture.description}`);
  console.log(`       caseType: ${fixture.caseType}`);
  console.log(`       firedProfileIds: [${firedProfileIds.join(", ")}]`);

  if (fixture.caseType === "ACTIVATION" && Object.keys(fixture.expectedAxisSlots ?? {}).length > 0) {
    for (const [axisKey, slots] of Object.entries(fixture.expectedAxisSlots)) {
      for (const slot of slots) {
        const filled = checkSlotFilled(result, axisKey, slot);
        const val = result?.axisPack?.axes?.[axisKey]?.explanation?.[slot];
        console.log(`       ${axisKey}.${slot}: ${filled ? "PASS" : "MISSING"}`);
        if (filled && typeof val === "string") {
          console.log(`         → "${val.slice(0, 60)}..."`);
        }
      }
    }
  }

  for (const v of violations) console.log(`       ✗ ${v}`);
  for (const n of notices) console.log(`       △ ${n}`);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const filterAuto = filterCaseId ? autoCases.filter((c) => c.caseId === filterCaseId) : autoCases;
const filterSupplemental = filterCaseId
  ? CAREER_TRANSITION_SUPPLEMENTAL_CASES.filter((c) => c.caseId === filterCaseId)
  : CAREER_TRANSITION_SUPPLEMENTAL_CASES;

if (filterCaseId && filterAuto.length === 0 && filterSupplemental.length === 0) {
  console.error(`[ERROR] 케이스를 찾을 수 없습니다: "${filterCaseId}"`);
  process.exit(1);
}

let totalPass = 0;
let totalIssue = 0;
let totalFail = 0;
let suppSkipped = 0;
let suppExecuted = 0;

// ─── AUTO CASES ───────────────────────────────────────────────────────────────

console.log("\nCAREER TRANSITION PROFILE SMOKE [REGISTRY AUTO]");
console.log("─".repeat(70));
console.log(`  registry profiles (IMPLEMENTED): ${implemented.length}`);
console.log(`  auto-generated cases: ${autoCases.length}`);

for (const fixture of filterAuto) {
  const outcome = runCase(fixture);
  printCaseResult(fixture, outcome);
  if (outcome.status === "FAIL") totalFail++;
  else if (outcome.status === "ISSUE") totalIssue++;
  else totalPass++;
}

// ─── SUPPLEMENTAL CASES ──────────────────────────────────────────────────────

const hasSupplemental = filterSupplemental.some(
  (c) => c.status === "SUPPLEMENTAL_LOCKED" || c.status === "LOCKED"
);

if (hasSupplemental) {
  console.log("\n" + "─".repeat(70));
  console.log("SUPPLEMENTAL MANUAL CASES");
  console.log("─".repeat(70));

  for (const fixture of filterSupplemental) {
    const runnable = fixture.status === "SUPPLEMENTAL_LOCKED" || fixture.status === "LOCKED";
    if (!runnable) {
      console.log(`\n  ⊘  [SKIP] ${fixture.caseId}`);
      console.log(`       reason: status=${fixture.status}`);
      continue;
    }

    const key = getSupplementalCoverageKey(fixture);
    if (key && autoCoverage.has(key)) {
      console.log(`\n  ⊘  [SUPPLEMENTAL_SKIP] ${fixture.caseId}`);
      suppSkipped++;
      continue;
    }

    // Run if not auto-covered
    const outcome = runCase(fixture);
    printCaseResult(fixture, outcome);
    suppExecuted++;
    if (outcome.status === "FAIL") totalFail++;
    else if (outcome.status === "ISSUE") totalIssue++;
    else totalPass++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(70));
console.log(`전체 결과: ${totalPass} PASS / ${totalIssue} ISSUE / ${totalFail} FAIL`);
console.log(`           auto: ${autoCases.length}개 실행`);
if (hasSupplemental) {
  console.log(`           supplemental: ${suppExecuted}개 실행 / ${suppSkipped}개 auto-covered(skip)`);
}

if (totalFail > 0) {
  console.log("\n✗ FAIL 케이스가 있습니다. 구현 또는 gate 확인 필요.");
} else if (totalIssue > 0) {
  console.log("\n△ ISSUE 케이스가 있습니다. shouldMention 문구 확인 권장.");
} else {
  console.log("\n✅ 모든 auto case PASS — career transition profile 계약 충족.");
}

// ─── Profile Conflict Guard (registry-based) ─────────────────────────────────

function buildRegistryConflictSummary(profiles) {
  const impl = profiles.filter((p) => p.status === "IMPLEMENTED");

  // targetJobId → [profiles]
  const byTarget = {};
  for (const p of impl) {
    for (const tid of p.targetJobIds) {
      if (!byTarget[tid]) byTarget[tid] = [];
      byTarget[tid].push(p);
    }
  }

  // axisSlot → [profileIds] (all implemented, for reference)
  const bySlot = {};
  for (const p of impl) {
    for (const [axisKey, slots] of Object.entries(p.targetSlots ?? {})) {
      for (const slot of slots) {
        const key = `${axisKey}.${slot}`;
        if (!bySlot[key]) bySlot[key] = [];
        if (!bySlot[key].includes(p.id)) bySlot[key].push(p.id);
      }
    }
  }

  const highRisk = [];
  const mediumRisk = [];
  const seen = new Set();

  for (const [targetId, targetProfiles] of Object.entries(byTarget)) {
    if (targetProfiles.length < 2) continue;

    for (let i = 0; i < targetProfiles.length; i++) {
      for (let j = i + 1; j < targetProfiles.length; j++) {
        const pA = targetProfiles[i];
        const pB = targetProfiles[j];
        const pairKey = [pA.id, pB.id].sort().join("|");
        if (seen.has(`${targetId}:${pairKey}`)) continue;
        seen.add(`${targetId}:${pairKey}`);

        const sharedSources = pA.sourceJobIds.filter((id) => pB.sourceJobIds.includes(id));
        const slotsA = Object.entries(pA.targetSlots ?? {}).flatMap(([ax, ss]) => ss.map((s) => `${ax}.${s}`));
        const slotsB = Object.entries(pB.targetSlots ?? {}).flatMap(([ax, ss]) => ss.map((s) => `${ax}.${s}`));
        const sharedSlots = slotsA.filter((s) => slotsB.includes(s));

        if (sharedSources.length > 0 && sharedSlots.length > 0) {
          highRisk.push({ targetId, profiles: [pA.id, pB.id], sharedSources, sharedSlots });
        } else if (sharedSlots.length > 0) {
          mediumRisk.push({ targetId, profiles: [pA.id, pB.id], sharedSlots });
        }
      }
    }
  }

  const overallRisk = highRisk.length > 0 ? "HIGH" : mediumRisk.length > 0 ? "MEDIUM" : "LOW";
  return { impl, byTarget, bySlot, highRisk, mediumRisk, overallRisk };
}

const conflictSummary = buildRegistryConflictSummary(CAREER_TRANSITION_CASE_PROFILES);

console.log("\n" + "─".repeat(70));
console.log("PROFILE CONFLICT SUMMARY (registry-based)");
console.log("─".repeat(70));
console.log(`  implementedProfiles: ${conflictSummary.impl.length}`);
console.log(`    [${conflictSummary.impl.map((p) => p.id).join(", ")}]`);

const overlappingTargets = Object.entries(conflictSummary.byTarget).filter(
  ([, ps]) => ps.length > 1
);
if (overlappingTargets.length === 0) {
  console.log("  overlappingTargetJobIds: none");
} else {
  console.log("  overlappingTargetJobIds:");
  for (const [targetId, ps] of overlappingTargets) {
    console.log(`    ${targetId}: [${ps.map((p) => p.id).join(", ")}]`);
  }
}

const overlappingSlots = Object.entries(conflictSummary.bySlot).filter(
  ([, ids]) => ids.length > 1
);
if (overlappingSlots.length === 0) {
  console.log("  sharedAxisSlots: none");
} else {
  console.log("  sharedAxisSlots (reference — co-fire requires same source+target):");
  for (const [slot, ids] of overlappingSlots) {
    console.log(`    ${slot}: [${ids.join(", ")}]`);
  }
}

if (conflictSummary.highRisk.length > 0) {
  console.log("  highRiskConflicts:");
  for (const r of conflictSummary.highRisk) {
    console.log(`    ✗ target(${r.targetId}), sharedSources: [${r.sharedSources.join(", ")}], slots: [${r.sharedSlots.join(", ")}]`);
    console.log(`      profiles: [${r.profiles.join(", ")}]`);
  }
} else {
  console.log("  highRiskConflicts: none");
}

if (conflictSummary.mediumRisk.length > 0) {
  console.log("  mediumRiskConflicts:");
  for (const r of conflictSummary.mediumRisk) {
    console.log(`    △ target(${r.targetId}): [${r.profiles.join(", ")}]`);
    console.log(`      sharedSlots: [${r.sharedSlots.join(", ")}]`);
    console.log(`      source separation: disjoint (runtime co-fire impossible)`);
  }
} else {
  console.log("  mediumRiskConflicts: none");
}

console.log(`  overallRisk: ${conflictSummary.overallRisk}`);
