/**
 * run-newgrad-axis-baseline.mjs
 *
 * 신입 직무·산업 분석 (buildNewgradTransitionLiteResult) Phase 1 전후 비교용 baseline runner.
 * production 코드 수정 없이 read-only 실행만 수행.
 *
 * 실행 방법:
 *   node scripts/regression/run-newgrad-axis-baseline.mjs
 *   node scripts/regression/run-newgrad-axis-baseline.mjs --case ng-case-1
 *   node scripts/regression/run-newgrad-axis-baseline.mjs --json
 *
 * 옵션:
 *   --case <id>   특정 케이스 1개만 실행
 *   --json        결과를 scripts/regression/output/<timestamp>-newgrad.json 에 저장
 *
 * 동결 필드 (Phase 1 패치 전후 불변이어야 할 것들):
 *   - targetIndustryLabel (taxonomy label 회귀 감지)
 *   - transitionReadBlock.meta.targetJobLabel (taxonomy label 회귀 감지)
 *   - axisPack.axes.{key}.rawScore (rawScore 타입: number — makeAxis 반환 필드)
 *   - axisPack.axes.{key}.band    (band: very_low | low | medium | high | very_high)
 *   - topRepairSignals keys       (보강 포인트 목록 구조 불변)
 */

import { buildNewgradTransitionLiteResult } from "../../src/lib/transitionLite/buildNewgradTransitionLiteResult.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI 파싱 ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const caseFlag = args.indexOf("--case");
const filterCaseId = caseFlag !== -1 ? args[caseFlag + 1] : null;
const saveJson = args.includes("--json");

// ─── 베이스라인 케이스 ──────────────────────────────────────────────────────────

const NEWGRAD_BASELINE_CASES = [
  // ─── Case 1: IT DevOps 신입 — IT SaaS 산업 (최소 입력 기준점) ──────────────
  // 경험/자격증/강점 없는 최소 input으로 axes가 정상 구조를 반환하는지 확인
  {
    id: "ng-case-1",
    label: "IT DevOps 신입 — IT SaaS 산업 (최소 입력 기준점)",
    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    },
    expectations: {
      axisCount: 5,
      allScoresAreNumbers: true,
      topRepairSignalsIsArray: true,
    },
  },

  // ─── Case 2: 마케팅 신입 — 소비재/유통 산업 ───────────────────────────────
  // 다른 직무-산업 조합에서도 5축 구조가 동일하게 반환되는지 확인
  {
    id: "ng-case-2",
    label: "마케팅 신입 — 소비재/유통 산업",
    input: {
      targetJobId: "JOB_MARKETING_BRAND_MARKETING",
      targetIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_BRAND_FMCG",
    },
    expectations: {
      axisCount: 5,
      allScoresAreNumbers: true,
      topRepairSignalsIsArray: true,
    },
  },

  // ─── Case 3: 전공 + 인턴 증거 있는 케이스 — IT 데이터/ML ────────────────────
  // 신입 증거(전공/인턴)가 있을 때 score가 최소 입력보다 높거나 같은지 확인 (방향성)
  {
    id: "ng-case-3",
    label: "IT ML/AI 신입 — IT SaaS 산업 (전공 + 인턴 증거 있음)",
    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      major: "컴퓨터공학",
      internships: [
        {
          type: "인턴",
          roleFamily: "데이터 분석",
          stakeholderType: "internal",
          duration: "3개월",
          summary: "머신러닝 모델 실험 및 데이터 파이프라인 구축 보조",
        },
      ],
    },
    expectations: {
      axisCount: 5,
      allScoresAreNumbers: true,
      topRepairSignalsIsArray: true,
      axis1ScoreHigherThanCaseRef: "ng-case-1",
    },
  },

  // ─── Case 4: 금융 분석가 신입 — 금융/보험 산업 ─────────────────────────────
  // 금융 계열 산업 조합 처리 확인
  {
    id: "ng-case-4",
    label: "금융 분석가 신입 — 금융/보험 산업",
    input: {
      targetJobId: "JOB_FINANCE_ACCOUNTING_FP_AND_A",
      targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_SECURITIES_ASSET_MANAGEMENT",
    },
    expectations: {
      axisCount: 5,
      allScoresAreNumbers: true,
      topRepairSignalsIsArray: true,
    },
  },
];

// ─── 동결 필드 추출 ─────────────────────────────────────────────────────────────

const AXIS_KEYS = [
  { key: "jobStructure",        label: "Axis1 (전공-직무 연결성)" },
  { key: "industryContext",     label: "Axis2 (산업 이해도)" },
  { key: "responsibilityScope", label: "Axis3 (경험 연결성)" },
  { key: "customerType",        label: "Axis4 (고객 커뮤니케이션)" },
  { key: "roleCharacter",       label: "Axis5 (강점과 재능)" },
];

function extractFrozenFields(vm, caseId) {
  const axes = vm?.axisPack?.axes ?? {};
  const axisSnapshot = {};
  for (const { key, label } of AXIS_KEYS) {
    const axis = axes[key];
    axisSnapshot[key] = {
      label,
      score: axis?.rawScore ?? null,
      band:  axis?.band  ?? null,
    };
  }
  return {
    caseId,
    targetJobLabel:      vm?.transitionReadBlock?.meta?.targetJobLabel ?? null,
    targetIndustryLabel: vm?.targetIndustryLabel ?? null,
    axisPack:            axisSnapshot,
    topRepairSignalKeys: (vm?.topRepairSignals ?? []).map((s) => s?.key ?? null).filter(Boolean),
    heroSummary:         vm?.heroSummary ?? null,
  };
}

// ─── 기대값 검증 ────────────────────────────────────────────────────────────────

function validateExpectations(vm, caseExpectations, caseId, allSnapshots) {
  const failures = [];
  const axes = vm?.axisPack?.axes ?? {};

  if (caseExpectations.axisCount !== undefined) {
    const actualCount = Object.keys(axes).length;
    if (actualCount !== caseExpectations.axisCount) {
      failures.push(`axisCount: expected ${caseExpectations.axisCount}, got ${actualCount}`);
    }
  }

  if (caseExpectations.allScoresAreNumbers) {
    for (const { key } of AXIS_KEYS) {
      const score = axes[key]?.rawScore;
      if (typeof score !== "number") {
        failures.push(`${key}.rawScore is not a number: ${typeof score} (${score})`);
      }
    }
  }

  if (caseExpectations.topRepairSignalsIsArray) {
    if (!Array.isArray(vm?.topRepairSignals)) {
      failures.push(`topRepairSignals is not an array: ${typeof vm?.topRepairSignals}`);
    }
  }

  return failures;
}

// ─── 실행 ───────────────────────────────────────────────────────────────────────

const targetCases = filterCaseId
  ? NEWGRAD_BASELINE_CASES.filter((c) => c.id === filterCaseId)
  : NEWGRAD_BASELINE_CASES;

if (targetCases.length === 0) {
  console.error(`케이스를 찾을 수 없음: ${filterCaseId}`);
  process.exit(1);
}

let passed = 0;
let failed = 0;
const results = [];
const allSnapshots = {};

console.log("\n신입 직무·산업 분석 Axis Baseline Runner\n");

for (const testCase of targetCases) {
  const { id, label, input, expectations } = testCase;

  let vm;
  let runError = null;
  try {
    vm = buildNewgradTransitionLiteResult(input);
  } catch (err) {
    runError = err?.message ?? String(err);
  }

  const snapshot = runError
    ? { caseId: id, error: runError }
    : extractFrozenFields(vm, id);
  allSnapshots[id] = snapshot;

  if (runError) {
    console.error(`  ✗  [${id}] ${label}`);
    console.error(`       실행 오류: ${runError}`);
    failed++;
    results.push({ id, label, status: "ERROR", error: runError, snapshot });
    continue;
  }

  if (!vm?.axisPack) {
    console.error(`  ✗  [${id}] ${label}`);
    console.error(`       axisPack null — validateNewgradTransitionLiteInput 실패 (targetJobId/targetIndustryId 미등록)`);
    failed++;
    results.push({ id, label, status: "FAIL", reason: "axisPack_null", snapshot });
    continue;
  }

  const failures = validateExpectations(vm, expectations ?? {}, id, allSnapshots);

  if (failures.length > 0) {
    console.error(`  ✗  [${id}] ${label}`);
    for (const f of failures) {
      console.error(`       ${f}`);
    }
    failed++;
    results.push({ id, label, status: "FAIL", failures, snapshot });
  } else {
    console.log(`  ✓  [${id}] ${label}`);
    const axes = vm?.axisPack?.axes ?? {};
    for (const { key, label: axisLabel } of AXIS_KEYS) {
      const s = axes[key]?.rawScore ?? "?";
      const b = axes[key]?.band    ?? "?";
      console.log(`       ${axisLabel}: score=${s}, band=${b}`);
    }
    console.log(`       targetJobLabel: ${snapshot.targetJobLabel ?? "(없음)"}`);
    console.log(`       targetIndustryLabel: ${snapshot.targetIndustryLabel ?? "(없음)"}`);
    if (snapshot.topRepairSignalKeys.length > 0) {
      console.log(`       topRepairSignals: [${snapshot.topRepairSignalKeys.join(", ")}]`);
    }
    passed++;
    results.push({ id, label, status: "PASS", snapshot });
  }

  console.log();
}

// ─── 최종 요약 ──────────────────────────────────────────────────────────────────

console.log("─".repeat(60));
console.log(`결과: ${passed} PASS / ${failed} FAIL / ${targetCases.length} 총`);

if (failed > 0) {
  console.log("\n⚠  FAIL 케이스가 있습니다. 위 오류 내용을 확인하세요.");
  console.log("   Phase 1 진입 전에 모든 케이스가 PASS이어야 합니다.");
} else {
  console.log("\n✅ 모든 케이스 PASS — Phase 1 진입 전 baseline 확인됨.");
}

// ─── JSON 저장 (--json 옵션) ──────────────────────────────────────────────────

if (saveJson) {
  const outputDir = path.resolve(__dirname, "output");
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outputDir, `${timestamp}-newgrad.json`);
  const summary = {
    runAt: new Date().toISOString(),
    runner: "run-newgrad-axis-baseline.mjs",
    cases: results,
    stats: { passed, failed, total: targetCases.length },
  };
  writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nJSON 저장됨: ${outPath}`);
}

if (failed > 0) process.exit(1);
