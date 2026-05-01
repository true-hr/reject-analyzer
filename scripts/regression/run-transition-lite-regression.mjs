/**
 * run-transition-lite-regression.mjs  (v2 — hardened)
 *
 * Transition Lite 8케이스 방향성 회귀 검증 실행기.
 * production 코드 수정 없이 read-only 실행만 수행.
 *
 * 실행 방법:
 *   node ./scripts/regression/run-transition-lite-regression.mjs
 *   node ./scripts/regression/run-transition-lite-regression.mjs --case case-3
 *   node ./scripts/regression/run-transition-lite-regression.mjs --json
 *   node ./scripts/regression/run-transition-lite-regression.mjs --case case-8 --json
 *
 * 옵션:
 *   --case <id>   특정 케이스 1개만 실행
 *   --json        결과를 scripts/regression/output/<timestamp>.json 에 저장
 */

import { buildTransitionLiteResult } from "../../src/lib/transitionLite/buildTransitionLiteResult.js";
import { classifyTransition } from "../../src/lib/transitionLite/classifyTransition.js";
import { REGRESSION_CASES } from "./transition-lite-cases.js";
import {
  evaluateCase,
  extractOneLinerSurfaces,
  countByCategory,
} from "./transition-lite-evaluator.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI 파싱 ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const caseFlag = args.indexOf("--case");
const filterCaseId = caseFlag !== -1 ? args[caseFlag + 1] : null;
const saveJson = args.includes("--json");

// ─── 실행 대상 필터링 ──────────────────────────────────────────────────────────

const targetCases = filterCaseId
  ? REGRESSION_CASES.filter((c) => c.id === filterCaseId)
  : REGRESSION_CASES;

if (targetCases.length === 0) {
  console.error(`[ERROR] 케이스를 찾을 수 없습니다: "${filterCaseId}"`);
  console.error(`사용 가능한 id: ${REGRESSION_CASES.map((c) => c.id).join(", ")}`);
  process.exit(1);
}

// ─── runner ─────────────────────────────────────────────────────────────────

function runCase(fixture) {
  const payload = {
    currentJobId: fixture.input.currentJobId,
    currentIndustryId: fixture.input.currentIndustryId,
    targetJobId: fixture.input.targetJobId,
    targetIndustryId: fixture.input.targetIndustryId,
  };

  let classification = null;
  let report = null;
  const errors = [];

  try {
    classification = classifyTransition(payload);
  } catch (err) {
    errors.push(`classifyTransition 오류: ${err?.message ?? String(err)}`);
  }

  try {
    report = buildTransitionLiteResult(payload);
  } catch (err) {
    errors.push(`buildTransitionLiteResult 오류: ${err?.message ?? String(err)}`);
  }

  return {
    id: fixture.id,
    label: fixture.label,
    input: payload,
    classification: classification ?? {},
    report: report ?? {},
    errors,
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

const results = [];
let passCount = 0;
let failCount = 0;
let totalWarnings = 0;
const failedIds = [];

console.log(`\n${"─".repeat(68)}`);
console.log(`Transition Lite 방향성 회귀 검증  (v2 hardened)`);
console.log(`케이스: ${targetCases.length}개`);
console.log(`${"─".repeat(68)}\n`);

for (const fixture of targetCases) {
  const runResult = runCase(fixture);
  const { pass, failReasons, warningReasons } = evaluateCase(fixture, runResult);
  const surfaces = extractOneLinerSurfaces(runResult.report);

  totalWarnings += warningReasons.length;

  if (pass) {
    passCount += 1;
    const warnSuffix = warningReasons.length > 0 ? ` (warn: ${warningReasons.length})` : "";
    console.log(`[PASS] ${fixture.id} / ${fixture.label}${warnSuffix}`);
  } else {
    failCount += 1;
    failedIds.push(fixture.id);
    console.log(`[FAIL] ${fixture.id} / ${fixture.label}`);
    const catCounts = countByCategory(failReasons);
    console.log(`       categories: ${Object.entries(catCounts).map(([k, v]) => `${k}×${v}`).join(", ")}`);
    for (const reason of failReasons) {
      console.log(`       - ${reason}`);
    }
    if (warningReasons.length > 0) {
      for (const w of warningReasons) {
        console.log(`       ~ ${w}`);
      }
    }
  }

  if (pass && warningReasons.length > 0) {
    for (const w of warningReasons) {
      console.log(`       ~ ${w}`);
    }
  }

  console.log(`       topRiskKey    : ${surfaces.topRiskKey}`);
  console.log(`       whyThisRead   : ${surfaces.whySummary}`);
  console.log(`       targetJobRead : ${surfaces.jobSummary}`);
  console.log(`       targetIndRead : ${surfaces.indSummary}`);
  console.log();

  results.push({
    id: fixture.id,
    label: fixture.label,
    pass,
    failReasons,
    warningReasons,
    failCategories: countByCategory(failReasons),
    surfaces,
    classification: {
      jobDistance: runResult.classification?.jobDistance ?? null,
      industryDistance: runResult.classification?.industryDistance ?? null,
      roleWeightShift: runResult.classification?.roleWeightShift ?? null,
      responsibilityShift: runResult.classification?.responsibilityShift ?? null,
    },
    errors: runResult.errors,
  });
}

// ─── 전체 요약 ─────────────────────────────────────────────────────────────────

// fail category 집계
const allFailReasons = results.flatMap((r) => r.failReasons);
const globalCats = countByCategory(allFailReasons);

console.log(`${"─".repeat(68)}`);
console.log(`[요약]`);
console.log(`  total    : ${results.length}`);
console.log(`  pass     : ${passCount}`);
console.log(`  fail     : ${failCount}`);
console.log(`  warnings : ${totalWarnings}`);
if (failedIds.length > 0) {
  console.log(`  failed   : ${failedIds.join(", ")}`);
}
if (Object.keys(globalCats).length > 0) {
  console.log(`  by category: ${Object.entries(globalCats).map(([k, v]) => `${k}=${v}`).join(", ")}`);
}
console.log(`${"─".repeat(68)}\n`);

// ─── JSON 저장 (--json) ────────────────────────────────────────────────────────

if (saveJson) {
  const outputDir = path.resolve(__dirname, "output");
  mkdirSync(outputDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputFile = path.join(outputDir, `regression-${ts}.json`);
  writeFileSync(
    outputFile,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        total: results.length,
        pass: passCount,
        fail: failCount,
        totalWarnings,
        failedIds,
        failCategorySummary: globalCats,
        cases: results,
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`JSON 저장 완료: ${outputFile}`);
}

process.exit(failCount > 0 ? 1 : 0);
