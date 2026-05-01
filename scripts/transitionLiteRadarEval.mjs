/**
 * transitionLiteRadarEval.mjs
 *
 * 5축 레이더 정확도 eval runner.
 * vm.axisPack.axes 값을 검증하고 baseline 대비 delta를 출력한다.
 *
 * 실행 방법:
 *   node ./scripts/transitionLiteRadarEval.mjs
 */

import { buildTransitionLiteResult } from "../src/lib/transitionLite/buildTransitionLiteResult.js";

// ─── axis constants ───────────────────────────────────────────────────────────

const AXIS_KEYS = ["jobStructure", "industryContext", "responsibilityScope", "customerType", "roleCharacter"];

// Per buildAxisConnectivityPack.js comment:
//   Axis 1 jobStructure:        15~95
//   Axis 2 industryContext:     20~90
//   Axis 3 responsibilityScope: 30~80
//   Axis 4 customerType:        30~85
//   Axis 5 roleCharacter:       30~80
const AXIS_RAW_RANGES = {
  jobStructure:       { min: 15, max: 95 },
  industryContext:    { min: 20, max: 90 },
  responsibilityScope:{ min: 30, max: 80 },
  customerType:       { min: 30, max: 85 },
  roleCharacter:      { min: 30, max: 80 },
};

// displayScore is 20~100 per buildAxisConnectivityPack::computeDisplayScore
const DISPLAY_MIN = 20;
const DISPLAY_MAX = 100;

// ─── fixtures ─────────────────────────────────────────────────────────────────
// same-baseline case + sensitivity comparison pairs

const FIXTURES = [
  // ── BASELINE ──────────────────────────────────────────────────────────────
  {
    id: "radar-01-baseline",
    label: "DevOps + B2B SaaS → DevOps + B2B SaaS (완전 동일 — baseline)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    expectedPattern: "near-baseline",
    // For same+same, all axes should be high
    sensGroup: "baseline",
  },
  // ── pair-1: baseline vs cross industry ────────────────────────────────────
  {
    id: "radar-02-same-job-adjacent-industry",
    label: "DevOps + B2B SaaS → DevOps + Enterprise Solution (인접 산업)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    expectedPattern: "industryContext drops; jobStructure stable",
    sensGroup: "pair1_cross_industry",
  },
  {
    id: "radar-03-same-job-cross-industry",
    label: "DevOps + B2B SaaS → DevOps + 공공기관 (cross industry)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION",
    expectedPattern: "industryContext significantly lower than adjacent; jobStructure stable",
    sensGroup: "pair1_cross_industry",
  },
  // ── pair-2: baseline vs cross job ─────────────────────────────────────────
  {
    id: "radar-04-adjacent-job-same-industry",
    label: "QA + B2B SaaS → DevOps + B2B SaaS (인접 직무, 같은 산업)",
    currentJobId: "JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    expectedPattern: "jobStructure drops; industryContext stable",
    sensGroup: "pair2_cross_job",
  },
  {
    id: "radar-05-cross-job-same-industry",
    label: "서비스기획 + B2C → 백엔드개발 + B2C (cross job, 같은 산업)",
    currentJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetJobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    expectedPattern: "jobStructure significantly lower; industryContext stable",
    sensGroup: "pair2_cross_job",
  },
  // ── pair-3: baseline vs full cross ─────────────────────────────────────────
  {
    id: "radar-06-full-cross",
    label: "채용 + HR서비스 → 대외협력 + 협회 (full cross — high risk)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
    targetIndustryId: "IND_PUBLIC_ASSOCIATION_NONPROFIT_ASSOCIATION_ORGANIZATION",
    expectedPattern: "both jobStructure and industryContext significantly lower than baseline",
    sensGroup: "pair3_full_cross",
  },
  // ── additional sensitivity cases ──────────────────────────────────────────
  {
    id: "radar-07-industry-only-change",
    label: "DevOps + B2B SaaS → DevOps + 유통/온라인커머스 (industry-only, cross sector)",
    currentJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetJobId: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    targetIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    expectedPattern: "industryContext drops; jobStructure unchanged",
    sensGroup: "industry_only",
  },
  {
    id: "radar-08-job-only-change",
    label: "채용 + HR서비스 → 채용지원팀 + HR서비스 (job adjacent, industry same)",
    currentJobId: "JOB_HR_ORGANIZATION_RECRUITING",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    targetJobId: "JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_PEOPLE_SERVICES",
    expectedPattern: "jobStructure drops slightly; industryContext unchanged",
    sensGroup: "job_only",
  },
  {
    id: "radar-09-responsibility-shift",
    label: "CS운영 + 온라인커머스 → 운영기획 + 아웃소싱 (responsibility scope shift)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetJobId: "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
    expectedPattern: "responsibilityScope may vary; industryContext reflects transition",
    sensGroup: "responsibility_shift",
  },
  {
    id: "radar-10-manufacturing-cross",
    label: "제조QA + 전자/가전 → 기술지원 + 기계/장비 (cross job + adjacent industry)",
    currentJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
    currentIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
    targetIndustryId: "IND_MANUFACTURING_MACHINERY_INDUSTRIAL_EQUIPMENT",
    expectedPattern: "jobStructure drops; industryContext slight drop",
    sensGroup: "cross_job_adjacent_ind",
  },
  {
    id: "radar-11-execution-to-strategy",
    label: "서비스운영 + 컨설팅리서치 → 전략기획 + 컨설팅리서치 (실행→전략 축 이동)",
    currentJobId: "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
    currentIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    targetJobId: "JOB_BUSINESS_STRATEGY",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedPattern: "roleCharacter and jobStructure drop; industryContext stable (same industry)",
    sensGroup: "strategy_execution",
  },
  {
    id: "radar-12-full-cross-similar-stakeholder",
    label: "B2B영업 + 엔터프라이즈솔루션 → 컨설팅 + 컨설팅리서치 (full cross, B2B이해관계자 유사)",
    currentJobId: "JOB_SALES_B2B_SALES",
    currentIndustryId: "IND_IT_SOFTWARE_PLATFORM_ENTERPRISE_SOLUTION",
    targetJobId: "JOB_RESEARCH_PROFESSIONAL_CONSULTING",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_CONSULTING_RESEARCH",
    expectedPattern: "jobStructure drops significantly; customerType relatively stable vs jobStructure",
    sensGroup: "full_cross_similar_stakeholder",
  },
];

// ─── extraction ───────────────────────────────────────────────────────────────

function extractAxisValues(vm) {
  const axes = vm?.axisPack?.axes;
  if (!axes) return null;
  return Object.fromEntries(
    AXIS_KEYS.map((k) => [
      k,
      {
        rawScore: axes[k]?.rawScore ?? null,
        displayScore: axes[k]?.displayScore ?? null,
        band: axes[k]?.band ?? null,
      },
    ])
  );
}

// ─── FAIL 판정 ────────────────────────────────────────────────────────────────

function validateAxisValues(axisValues, fixture, baselineValues) {
  const failures = [];
  const warnings = [];

  if (!axisValues) {
    failures.push("axisPack.axes 없음 (radar owner unresolved 또는 buildAxisConnectivityPack 실패)");
    return { failures, warnings };
  }

  const missingAxes = AXIS_KEYS.filter((k) => axisValues[k]?.rawScore === null || axisValues[k]?.rawScore === undefined);
  if (missingAxes.length > 0) {
    failures.push(`축 값 null/undefined: ${missingAxes.join(", ")}`);
  }

  const axisCount = AXIS_KEYS.filter((k) => axisValues[k] !== null).length;
  if (axisCount !== 5) {
    failures.push(`축 수 오류: ${axisCount}/5`);
  }

  for (const k of AXIS_KEYS) {
    const v = axisValues[k];
    if (!v || v.rawScore === null) continue;
    const range = AXIS_RAW_RANGES[k];
    if (v.rawScore < range.min || v.rawScore > range.max) {
      failures.push(`${k} rawScore 범위 초과: ${v.rawScore} (정의 범위: ${range.min}~${range.max})`);
    }
    if (v.displayScore !== null && (v.displayScore < DISPLAY_MIN || v.displayScore > DISPLAY_MAX)) {
      failures.push(`${k} displayScore 범위 초과: ${v.displayScore} (정의 범위: ${DISPLAY_MIN}~${DISPLAY_MAX})`);
    }
  }

  // Sensitivity checks (requires baseline)
  if (baselineValues) {
    const { sensGroup } = fixture;

    // pair-1: industry-only change → industryContext should drop, jobStructure should be stable
    if (sensGroup === "pair1_cross_industry" || sensGroup === "industry_only") {
      const indDelta = (axisValues.industryContext?.displayScore ?? 0) - (baselineValues.industryContext?.displayScore ?? 0);
      const jobDelta = (axisValues.jobStructure?.displayScore ?? 0) - (baselineValues.jobStructure?.displayScore ?? 0);
      if (indDelta >= 0) {
        warnings.push(`industry-only 이동인데 industryContext가 baseline 이상 (delta=${indDelta})`);
      }
      if (Math.abs(jobDelta) > 15) {
        warnings.push(`industry-only 이동인데 jobStructure가 크게 흔들림 (delta=${jobDelta})`);
      }
    }

    // pair-2: job-only change → jobStructure should drop, industryContext should be stable
    if (sensGroup === "pair2_cross_job" || sensGroup === "job_only") {
      const jobDelta = (axisValues.jobStructure?.displayScore ?? 0) - (baselineValues.jobStructure?.displayScore ?? 0);
      const indDelta = (axisValues.industryContext?.displayScore ?? 0) - (baselineValues.industryContext?.displayScore ?? 0);
      if (jobDelta >= 0) {
        warnings.push(`job-only 이동인데 jobStructure가 baseline 이상 (delta=${jobDelta})`);
      }
      if (Math.abs(indDelta) > 15) {
        warnings.push(`job-only 이동인데 industryContext가 크게 흔들림 (delta=${indDelta})`);
      }
    }

    // pair-3: full cross → both should drop significantly
    if (sensGroup === "pair3_full_cross") {
      const jobDelta = (axisValues.jobStructure?.displayScore ?? 0) - (baselineValues.jobStructure?.displayScore ?? 0);
      const indDelta = (axisValues.industryContext?.displayScore ?? 0) - (baselineValues.industryContext?.displayScore ?? 0);
      if (jobDelta > -10) {
        warnings.push(`full cross인데 jobStructure가 baseline 대비 거의 안 떨어짐 (delta=${jobDelta})`);
      }
      if (indDelta > -10) {
        warnings.push(`full cross인데 industryContext가 baseline 대비 거의 안 떨어짐 (delta=${indDelta})`);
      }
    }

    // strategy_execution: roleCharacter should shift noticeably (same industry → jobStructure or roleCharacter drops)
    if (sensGroup === "strategy_execution") {
      const roleDelta = (axisValues.roleCharacter?.displayScore ?? 0) - (baselineValues.roleCharacter?.displayScore ?? 0);
      const jobDelta = (axisValues.jobStructure?.displayScore ?? 0) - (baselineValues.jobStructure?.displayScore ?? 0);
      if (Math.abs(roleDelta) < 5 && Math.abs(jobDelta) < 5) {
        warnings.push(`strategy/execution 이동인데 roleCharacter·jobStructure 변화가 모두 미미 (roleCharΔ=${roleDelta}, jobStrΔ=${jobDelta})`);
      }
    }

    // full_cross_similar_stakeholder: jobStructure should drop; customerType should drop less than jobStructure
    if (sensGroup === "full_cross_similar_stakeholder") {
      const jobDelta = (axisValues.jobStructure?.displayScore ?? 0) - (baselineValues.jobStructure?.displayScore ?? 0);
      const custDelta = (axisValues.customerType?.displayScore ?? 0) - (baselineValues.customerType?.displayScore ?? 0);
      if (jobDelta > -5) {
        warnings.push(`full cross인데 jobStructure가 거의 안 떨어짐 (delta=${jobDelta})`);
      }
      if (custDelta < jobDelta - 10) {
        warnings.push(`customerType이 jobStructure보다 크게 더 떨어짐 — B2B 이해관계자 유사성이 반영 안 될 수 있음 (custΔ=${custDelta}, jobΔ=${jobDelta})`);
      }
    }
  }

  // axis flatness warning: for non-baseline, if all 5 displayScores are within 8 points of each other
  if (fixture.sensGroup !== "baseline") {
    const nonNullScores = AXIS_KEYS.map((k) => axisValues[k]?.displayScore).filter((s) => s !== null && s !== undefined);
    if (nonNullScores.length === 5) {
      const scoreRange = Math.max(...nonNullScores) - Math.min(...nonNullScores);
      if (scoreRange < 8) {
        warnings.push(`axis flatness: 5축이 ${scoreRange}점 범위 내 — 이동 특성이 축별로 분별되지 않을 수 있음 (${nonNullScores.map(Math.round).join(", ")})`);
      }
    }
  }

  return { failures, warnings };
}

// ─── runner ───────────────────────────────────────────────────────────────────

function runCase(fixture, baselineValues) {
  const { currentJobId, currentIndustryId, targetJobId, targetIndustryId } = fixture;

  let vm = null;
  let err = null;

  try {
    vm = buildTransitionLiteResult({ currentJobId, currentIndustryId, targetJobId, targetIndustryId });
  } catch (e) {
    err = e;
  }

  const axisValues = err ? null : extractAxisValues(vm);
  const { failures, warnings } = err
    ? { failures: [`EXCEPTION: ${err.message}`], warnings: [] }
    : validateAxisValues(axisValues, fixture, baselineValues);

  return {
    id: fixture.id,
    label: fixture.label,
    sensGroup: fixture.sensGroup,
    expectedPattern: fixture.expectedPattern,
    pass: failures.length === 0,
    failures,
    warnings,
    axisValues,
  };
}

function computeDelta(current, baseline) {
  if (!current || !baseline) return null;
  return Object.fromEntries(
    AXIS_KEYS.map((k) => [
      k,
      {
        delta: current[k]?.displayScore !== null && baseline[k]?.displayScore !== null
          ? Math.round((current[k].displayScore ?? 0) - (baseline[k].displayScore ?? 0))
          : null,
        current: current[k]?.displayScore ?? null,
        baseline: baseline[k]?.displayScore ?? null,
      },
    ])
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

// Run baseline first
const baselineFixture = FIXTURES.find((f) => f.sensGroup === "baseline");
const baselineResult = runCase(baselineFixture, null);
const baselineValues = baselineResult.axisValues;

const results = FIXTURES.map((f) =>
  f.sensGroup === "baseline" ? baselineResult : runCase(f, baselineValues)
);

console.log("\n=== Transition Lite Radar Eval ===\n");

let mostSuspiciousAxis = null;
const axisMismatchCounts = Object.fromEntries(AXIS_KEYS.map((k) => [k, 0]));

for (const r of results) {
  const status = r.pass ? (r.warnings.length > 0 ? "WARN" : "PASS") : "FAIL";
  console.log(`[${status}] ${r.id}`);
  console.log(`       ${r.label}`);
  console.log(`  sensGroup: ${r.sensGroup} | expected: ${r.expectedPattern}`);

  if (r.axisValues) {
    console.log("  axis values (displayScore | rawScore | band):");
    for (const k of AXIS_KEYS) {
      const v = r.axisValues[k];
      if (!v) { console.log(`    ${k.padEnd(20)}: N/A`); continue; }
      console.log(`    ${k.padEnd(20)}: display=${v.displayScore ?? "?"} raw=${v.rawScore ?? "?"} band=${v.band ?? "?"}`);
    }

    // delta vs baseline
    if (r.sensGroup !== "baseline" && baselineValues) {
      const delta = computeDelta(r.axisValues, baselineValues);
      const deltaStr = AXIS_KEYS.map((k) => {
        const d = delta[k]?.delta;
        if (d === null) return `${k.replace(/([A-Z])/g, "_$1").toLowerCase().slice(0, 8)}=N/A`;
        const sign = d > 0 ? "+" : "";
        return `${k.replace("Structure", "Str").replace("Context", "Ctx").replace("Scope", "Scp").replace("Character", "Chr").replace("Type", "Typ")}=${sign}${d}`;
      }).join(" | ");
      console.log(`  Δ vs baseline: ${deltaStr}`);
    }
  } else {
    console.log("  axis values: N/A");
  }

  if (r.failures.length > 0) {
    for (const f of r.failures) {
      console.log(`  ✗ FAIL: ${f}`);
      // count axis mentions
      for (const k of AXIS_KEYS) {
        if (f.includes(k)) axisMismatchCounts[k]++;
      }
    }
  }
  if (r.warnings.length > 0) {
    for (const w of r.warnings) {
      console.log(`  ⚠ WARN: ${w}`);
      for (const k of AXIS_KEYS) {
        if (w.includes(k)) axisMismatchCounts[k]++;
      }
    }
  }
  if (r.pass && r.warnings.length === 0) console.log("  ✓ all axis checks passed");
  console.log();
}

// sensitivity comparison summary
console.log("=== Sensitivity Comparison ===\n");

// pair-1: baseline vs cross industry
const pair1Cases = results.filter((r) => r.sensGroup === "pair1_cross_industry");
if (baselineValues && pair1Cases.length > 0) {
  console.log("pair-1: same baseline vs cross industry");
  for (const r of pair1Cases) {
    if (!r.axisValues) { console.log(`  ${r.id}: N/A`); continue; }
    const delta = computeDelta(r.axisValues, baselineValues);
    const iCtxDelta = delta.industryContext.delta;
    const jStrDelta = delta.jobStructure.delta;
    console.log(`  ${r.id}: industryContext Δ=${iCtxDelta >= 0 ? "+" : ""}${iCtxDelta}  jobStructure Δ=${jStrDelta >= 0 ? "+" : ""}${jStrDelta}`);
  }
  console.log();
}

// pair-2: baseline vs cross job
const pair2Cases = results.filter((r) => r.sensGroup === "pair2_cross_job");
if (baselineValues && pair2Cases.length > 0) {
  console.log("pair-2: same baseline vs cross job");
  for (const r of pair2Cases) {
    if (!r.axisValues) { console.log(`  ${r.id}: N/A`); continue; }
    const delta = computeDelta(r.axisValues, baselineValues);
    const jStrDelta = delta.jobStructure.delta;
    const iCtxDelta = delta.industryContext.delta;
    console.log(`  ${r.id}: jobStructure Δ=${jStrDelta >= 0 ? "+" : ""}${jStrDelta}  industryContext Δ=${iCtxDelta >= 0 ? "+" : ""}${iCtxDelta}`);
  }
  console.log();
}

// pair-3: baseline vs full cross
const pair3Cases = results.filter((r) => r.sensGroup === "pair3_full_cross");
if (baselineValues && pair3Cases.length > 0) {
  console.log("pair-3: same baseline vs full cross");
  for (const r of pair3Cases) {
    if (!r.axisValues) { console.log(`  ${r.id}: N/A`); continue; }
    const delta = computeDelta(r.axisValues, baselineValues);
    const jStrDelta = delta.jobStructure.delta;
    const iCtxDelta = delta.industryContext.delta;
    console.log(`  ${r.id}: jobStructure Δ=${jStrDelta >= 0 ? "+" : ""}${jStrDelta}  industryContext Δ=${iCtxDelta >= 0 ? "+" : ""}${iCtxDelta}  all-axes: ${AXIS_KEYS.map((k) => `${k.slice(0,3)}=${delta[k]?.delta ?? "N/A"}`).join(" ")}`);
  }
  console.log();
}

// pair monotonicity ordering check
console.log("=== Monotonicity Ordering ===\n");
let sameAdjCrossOrderingFailCount = 0;

// pair-1: adjacent industryContext should be > cross industryContext (both vs baseline)
const p1Adjacent = results.find((r) => r.id === "radar-02-same-job-adjacent-industry");
const p1Cross = results.find((r) => r.id === "radar-03-same-job-cross-industry");
if (p1Adjacent?.axisValues && p1Cross?.axisValues) {
  const adjInd = p1Adjacent.axisValues.industryContext?.displayScore;
  const crossInd = p1Cross.axisValues.industryContext?.displayScore;
  const orderOk = adjInd >= crossInd;
  if (!orderOk) sameAdjCrossOrderingFailCount++;
  console.log(`pair-1 industryContext ordering: adjacent(${adjInd}) ${orderOk ? ">=" : "<"} cross(${crossInd}) → ${orderOk ? "PASS" : "FAIL"}`);
}

// pair-2: adjacent jobStructure should be > cross jobStructure
const p2Adjacent = results.find((r) => r.id === "radar-04-adjacent-job-same-industry");
const p2Cross = results.find((r) => r.id === "radar-05-cross-job-same-industry");
if (p2Adjacent?.axisValues && p2Cross?.axisValues) {
  const adjJob = p2Adjacent.axisValues.jobStructure?.displayScore;
  const crossJob = p2Cross.axisValues.jobStructure?.displayScore;
  const orderOk = adjJob >= crossJob;
  if (!orderOk) sameAdjCrossOrderingFailCount++;
  console.log(`pair-2 jobStructure ordering:    adjacent(${adjJob}) ${orderOk ? ">=" : "<"} cross(${crossJob}) → ${orderOk ? "PASS" : "FAIL"}`);
}
console.log();

// dominant changed axis per case (vs baseline)
console.log("=== Dominant Changed Axis Per Case ===\n");
let unexpectedDominantAxisCount = 0;
const INDUSTRY_AXES = new Set(["industryContext", "customerType"]);
const JOB_AXES = new Set(["jobStructure", "roleCharacter", "responsibilityScope"]);
for (const r of results) {
  if (r.sensGroup === "baseline" || !r.axisValues || !baselineValues) continue;
  const deltas = AXIS_KEYS.map((k) => ({
    k,
    delta: (r.axisValues[k]?.displayScore ?? 0) - (baselineValues[k]?.displayScore ?? 0),
  })).filter((d) => d.delta !== null);
  const mostChanged = deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (!mostChanged) continue;
  const dominantAxis = mostChanged.k;
  let unexpected = false;
  if ((r.sensGroup === "pair1_cross_industry" || r.sensGroup === "industry_only") && !INDUSTRY_AXES.has(dominantAxis)) {
    unexpected = true;
  }
  if ((r.sensGroup === "pair2_cross_job" || r.sensGroup === "job_only") && !JOB_AXES.has(dominantAxis)) {
    unexpected = true;
  }
  if (unexpected) unexpectedDominantAxisCount++;
  console.log(`  ${r.id}: dominant=${dominantAxis}(Δ=${mostChanged.delta >= 0 ? "+" : ""}${mostChanged.delta})${unexpected ? " ⚠ unexpected" : ""}`);
}
console.log();

// axis flatness warning count
const axisFlatnessWarningCount = results.flatMap((r) => r.warnings).filter((w) => w.includes("axis flatness")).length;

// summary
const total = results.length;
const passCount = results.filter((r) => r.pass).length;
const failCount = results.filter((r) => !r.pass).length;
const warnCount = results.filter((r) => r.warnings.length > 0).length;
mostSuspiciousAxis = Object.entries(axisMismatchCounts).sort((a, b) => b[1] - a[1])[0];

console.log("=== Summary ===");
console.log(`total cases              : ${total}`);
console.log(`pass                     : ${passCount}`);
console.log(`fail                     : ${failCount}`);
console.log(`warn                     : ${warnCount}`);
console.log(`radar failures           : ${results.flatMap((r) => r.failures).length}`);
console.log(`same/adj/cross ordering  : ${sameAdjCrossOrderingFailCount === 0 ? "PASS" : `FAIL (${sameAdjCrossOrderingFailCount} violations)`}`);
console.log(`unexpected dominant axis : ${unexpectedDominantAxisCount}`);
console.log(`axis flatness warnings   : ${axisFlatnessWarningCount}`);
console.log(`most suspicious axis     : ${mostSuspiciousAxis?.[0] ?? "none"} (${mostSuspiciousAxis?.[1] ?? 0} mentions)`);
console.log();

if (failCount > 0) {
  process.exit(1);
}
