/**
 * run-career-transition-profile-smoke.mjs
 *
 * Career mode transition profile의 activation / boundary / nonfire 계약 검증.
 * D/E의 run-newgrad-ui-insight-surface-smoke.mjs와 독립적으로 실행.
 *
 * 검증 내용:
 *   ACTIVATION    - firedProfileIds ⊇ expectedProfileIds
 *                   expectedAxisSlots 각 slot 값 존재 여부
 *                   shouldMention 키워드 포함 여부 → ISSUE
 *                   shouldNotMention 미포함 여부 → FAIL
 *   BOUNDARY_COPY - firedProfileIds ⊇ expectedProfileIds
 *                   shouldMention 키워드 포함 여부 → ISSUE
 *                   shouldNotMention 미포함 여부 → FAIL
 *   NONFIRE       - firedProfileIds ∩ forbiddenProfileIds = ∅ → FAIL if violated
 *                   shouldNotMention 미포함 여부 → FAIL
 *
 * status가 LOCKED인 케이스만 실행. PROPOSED/SKIPPED_ID_UNRESOLVED는 SKIPPED.
 *
 * 실행 방법:
 *   node scripts/regression/run-career-transition-profile-smoke.mjs
 *   node scripts/regression/run-career-transition-profile-smoke.mjs --case TR-PROFILE-CS-TO-SERVICE-001
 */

import { buildTransitionLiteResult } from "../../src/lib/transitionLite/buildTransitionLiteResult.js";
import { CAREER_TRANSITION_CASES } from "./career-transition-case-matrix.js";

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const caseFlag = args.indexOf("--case");
const filterCaseId = caseFlag !== -1 ? args[caseFlag + 1] : null;

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

// ─── Runner ──────────────────────────────────────────────────────────────────

const targetCases = filterCaseId
  ? CAREER_TRANSITION_CASES.filter((c) => c.caseId === filterCaseId)
  : CAREER_TRANSITION_CASES;

if (filterCaseId && targetCases.length === 0) {
  console.error(`[ERROR] 케이스를 찾을 수 없습니다: "${filterCaseId}"`);
  process.exit(1);
}

let totalPass = 0;
let totalIssue = 0;
let totalFail = 0;
let totalSkipped = 0;

console.log("\nCAREER TRANSITION PROFILE SMOKE");
console.log("─".repeat(70));

for (const fixture of targetCases) {
  // Skip non-LOCKED
  if (fixture.status !== "LOCKED") {
    console.log(`\n  ⊘  [SKIP] ${fixture.caseId}`);
    console.log(`       ${fixture.description}`);
    console.log(`       reason: status=${fixture.status}`);
    totalSkipped++;
    continue;
  }

  let result;
  try {
    result = buildTransitionLiteResult({
      currentJobId: fixture.currentJobId,
      currentIndustryId: fixture.currentIndustryId,
      targetJobId: fixture.targetJobId,
      targetIndustryId: fixture.targetIndustryId,
    });
  } catch (err) {
    console.log(`\n  ✗  [FAIL] ${fixture.caseId}`);
    console.log(`       runtime error: ${err.message}`);
    totalFail++;
    continue;
  }

  const firedProfileIds = result?.careerTransitionFiredProfileIds ?? [];
  const allText = collectAllOverlayText(result);

  const violations = [];   // FAIL
  const notices = [];      // ISSUE

  if (fixture.caseType === "ACTIVATION" || fixture.caseType === "BOUNDARY_COPY") {
    // expected profile must fire
    for (const expectedId of (fixture.expectedProfileIds ?? [])) {
      if (!firedProfileIds.includes(expectedId)) {
        violations.push(`expected profile not fired: ${expectedId}`);
      }
    }
  }

  if (fixture.caseType === "ACTIVATION") {
    // slot checks
    for (const [axisKey, slots] of Object.entries(fixture.expectedAxisSlots ?? {})) {
      for (const slot of slots) {
        if (!checkSlotFilled(result, axisKey, slot)) {
          violations.push(`slot missing: ${axisKey}.${slot}`);
        }
      }
    }
  }

  if (fixture.caseType === "NONFIRE") {
    // forbidden profile must not fire
    for (const forbiddenId of (fixture.forbiddenProfileIds ?? [])) {
      if (firedProfileIds.includes(forbiddenId)) {
        violations.push(`forbidden profile fired: ${forbiddenId}`);
      }
    }
  }

  // shouldMention → ISSUE
  for (const keyword of (fixture.shouldMention ?? [])) {
    if (!allText.includes(keyword)) {
      notices.push(`shouldMention missing: "${keyword}"`);
    }
  }

  // shouldNotMention → FAIL
  for (const keyword of (fixture.shouldNotMention ?? [])) {
    if (allText.includes(keyword)) {
      violations.push(`shouldNotMention violated: "${keyword}"`);
    }
  }

  const hasFail = violations.length > 0;
  const hasIssue = notices.length > 0;
  const statusLabel = hasFail ? "[FAIL]" : hasIssue ? "[ISSUE]" : "[PASS]";
  const statusIcon = hasFail ? "✗" : hasIssue ? "△" : "✓";

  console.log(`\n  ${statusIcon}  ${statusLabel} ${fixture.caseId}`);
  console.log(`       ${fixture.description}`);
  console.log(`       caseType: ${fixture.caseType}`);
  console.log(`       firedProfileIds: [${firedProfileIds.join(", ")}]`);

  if (fixture.caseType !== "NONFIRE" && (fixture.expectedAxisSlots && Object.keys(fixture.expectedAxisSlots).length > 0)) {
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

  for (const v of violations) {
    console.log(`       ✗ ${v}`);
  }
  for (const n of notices) {
    console.log(`       △ ${n}`);
  }

  if (hasFail) {
    totalFail++;
  } else if (hasIssue) {
    totalIssue++;
  } else {
    totalPass++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const locked = CAREER_TRANSITION_CASES.filter((c) => c.status === "LOCKED").length;

console.log("\n" + "─".repeat(70));
console.log(`결과: ${totalPass} PASS / ${totalIssue} ISSUE / ${totalFail} FAIL / ${totalSkipped} SKIPPED`);
console.log(`      (실행 대상 LOCKED: ${locked}개 / 전체: ${CAREER_TRANSITION_CASES.length}개)`);

if (totalFail > 0) {
  console.log("\n✗ FAIL 케이스가 있습니다. 구현 또는 gate 확인 필요.");
} else if (totalIssue > 0) {
  console.log("\n△ ISSUE 케이스가 있습니다. shouldMention 문구 확인 권장.");
} else {
  console.log("\n✅ 모든 LOCKED 케이스 PASS — career transition profile 계약 충족.");
}
