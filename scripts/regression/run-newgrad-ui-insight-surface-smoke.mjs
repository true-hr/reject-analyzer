/**
 * run-newgrad-ui-insight-surface-smoke.mjs
 *
 * 신입 P0 7개 fixture의 uiInsightExpected axis explanation surface 계약을
 * 실제 buildNewgradTransitionLiteResult VM 출력과 대조하는 smoke runner.
 *
 * 검증 내용:
 *   1. hasSlots 조건 — explanation 4개 슬롯(lead/criteria/scoreReason/liftOrLimit) 중 2개 이상 채워짐
 *   2. visibleSurfaces 각 surfacePath 실제 값 존재 여부
 *   3. shouldMention 키워드 포함 여부 (substring 검사, 실패 시 ISSUE로 분류)
 *   4. shouldNotMention 금지 표현 미포함 여부 (substring 검사, 실패 시 FAIL로 분류)
 *   5. visibleStrength 분류
 *
 * 실행 방법:
 *   node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs
 *   node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs --case NG-INVARIANT-AXIS1-001
 *   node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs --json
 *
 * 근거 문서:
 *   docs/PASSMAP_NEWGRAD_UI_INSIGHT_PATH_INVESTIGATION.md
 */

import { buildNewgradTransitionLiteResult } from "../../src/lib/transitionLite/buildNewgradTransitionLiteResult.js";
import { NEWGRAD_CORE_INVARIANT_CASES } from "./newgrad-core-invariant-cases.js";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI 파싱 ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const caseFlag = args.indexOf("--case");
const filterCaseId = caseFlag !== -1 ? args[caseFlag + 1] : null;
const saveJson = args.includes("--json");

// ─── surfacePath → explanation field 이름 추출 ────────────────────────────────

const SURFACE_PATH_FIELD_RE = /explanation\.(\w+)$/;

function extractFieldFromSurfacePath(surfacePath) {
  const m = SURFACE_PATH_FIELD_RE.exec(surfacePath ?? "");
  return m ? m[1] : null;
}

// ─── visibleStrength 분류 ─────────────────────────────────────────────────────

function classifyVisibleStrength(filledFields) {
  const has = (f) => filledFields.includes(f);
  if (has("lead") && has("scoreReason")) return "STRONG_VISIBLE";
  if (has("lead") && has("liftOrLimit")) return "VISIBLE_WITH_LIMIT";
  if (has("lead") && has("criteria"))   return "EXPANDABLE_OR_WEAK_VISIBLE";
  if (has("lead"))                       return "WEAK_OR_HIDDEN";
  return "WEAK_OR_HIDDEN";
}

// ─── shouldMention alias 매칭 ─────────────────────────────────────────────────
// exact includes가 실패한 경우에만 alias 후보를 확인한다.
// shouldNotMention에는 적용하지 않는다 (엄격한 exact match 유지).

const SHOULD_MENTION_ALIASES = {
  "전공 연결성은 약할 수 있음": [
    "전공 연결성은 약할 수",
    "전공 직접 연결성은 제한적",
    "서비스기획과 전공 직접 연결성은 제한적",
  ],
};

function matchesShouldMention(actualText, expectedPhrase) {
  if (actualText.includes(expectedPhrase)) return true;
  const aliases = SHOULD_MENTION_ALIASES[expectedPhrase] ?? [];
  return aliases.some((alias) => actualText.includes(alias));
}

// ─── 케이스별 검증 ────────────────────────────────────────────────────────────

const SLOT_FIELDS = ["lead", "criteria", "scoreReason", "liftOrLimit"];

function verifySurfaces(vm, uiInsightExpected, caseId) {
  const axes = vm?.axisPack?.axes ?? {};
  const surfaces = Array.isArray(uiInsightExpected?.visibleSurfaces)
    ? uiInsightExpected.visibleSurfaces
    : [];
  const slotRule = uiInsightExpected?.minimumVisibleSlotRule ?? null;

  const issues = [];      // shouldMention 누락
  const failures = [];    // shouldNotMention 위반, hasSlots 미충족, 필드 부재
  const surfaceResults = [];

  // ── 1. hasSlots 조건 검증 ────────────────────────────────────────────────────

  // axisKey 목록 수집 (surfaces에서 unique)
  const allAxisKeys = [...new Set(surfaces.map((s) => s.axisKey).filter(Boolean))];

  // 케이스 전체 대표 hasSlots 검사: 첫 번째 등장 axisKey 기준으로 수행
  // (각 surface의 axisKey가 다를 수 있으므로 per-axis로 검사)
  const perAxisSlotStatus = {};
  for (const axisKey of allAxisKeys) {
    const explanation = axes[axisKey]?.explanation ?? null;
    if (!explanation || explanation.available === false) {
      perAxisSlotStatus[axisKey] = { filled: [], count: 0, pass: false };
      continue;
    }
    const filled = SLOT_FIELDS.filter((f) => {
      const v = explanation[f];
      return typeof v === "string" && v.trim().length > 0;
    });
    const required = slotRule?.requiredFilledCount ?? 2;
    perAxisSlotStatus[axisKey] = {
      filled,
      count: filled.length,
      pass: filled.length >= required,
      visibleStrength: classifyVisibleStrength(filled),
    };
  }

  // hasSlots 종합 판정 (검사 대상 axisKey 모두 pass여야 PASS)
  const hasSlotsOverall = allAxisKeys.length > 0
    ? allAxisKeys.every((k) => perAxisSlotStatus[k]?.pass)
    : false;
  const hasSlotsFirstKey = allAxisKeys[0] ?? null;
  const firstSlotStatus = hasSlotsFirstKey ? perAxisSlotStatus[hasSlotsFirstKey] : null;

  if (!hasSlotsOverall) {
    for (const axisKey of allAxisKeys) {
      const st = perAxisSlotStatus[axisKey];
      if (!st?.pass) {
        failures.push(
          `hasSlots FAIL [${axisKey}]: ` +
          `filled=${st?.filled?.join(", ") || "none"} ` +
          `(need >= ${slotRule?.requiredFilledCount ?? 2})`
        );
      }
    }
  }

  // ── 2. visibleSurfaces 검증 ──────────────────────────────────────────────────

  for (const surface of surfaces) {
    const { axisKey, surfacePath, role, shouldMention = [], shouldNotMention = [] } = surface;
    const fieldName = extractFieldFromSurfacePath(surfacePath);
    const explanation = axes[axisKey]?.explanation ?? null;

    if (!explanation || explanation.available === false) {
      failures.push(`[${axisKey}] explanation unavailable (available=false or missing)`);
      surfaceResults.push({
        axisKey, surfacePath, role,
        actualValue: null,
        status: "FAIL",
        reason: "explanation unavailable",
      });
      continue;
    }

    const actualValue = fieldName ? (explanation[fieldName] ?? null) : null;
    const actualText = typeof actualValue === "string" ? actualValue.trim() : "";

    if (!actualText) {
      // 필드 자체가 없거나 비어 있음
      const verdict = role === "primaryBody" || role === "secondaryBody"
        ? "FAIL"
        : "ISSUE";
      (verdict === "FAIL" ? failures : issues).push(
        `[${axisKey}.${fieldName}] value is empty or missing (role=${role})`
      );
      surfaceResults.push({
        axisKey, surfacePath, role,
        actualValue: null,
        status: verdict,
        reason: "empty or missing",
      });
      continue;
    }

    const missingKeywords = [];
    for (const keyword of shouldMention) {
      if (!matchesShouldMention(actualText, keyword)) {
        missingKeywords.push(keyword);
      }
    }

    const forbiddenFound = [];
    for (const phrase of shouldNotMention) {
      if (actualText.includes(phrase)) {
        forbiddenFound.push(phrase);
      }
    }

    if (forbiddenFound.length > 0) {
      for (const phrase of forbiddenFound) {
        failures.push(
          `[${axisKey}.${fieldName}] shouldNotMention VIOLATION: "${phrase}"`
        );
      }
    }

    if (missingKeywords.length > 0) {
      for (const kw of missingKeywords) {
        issues.push(
          `[${axisKey}.${fieldName}] MISSING_KEYWORD: "${kw}" not found in actual text`
        );
      }
    }

    const surfaceStatus = forbiddenFound.length > 0
      ? "FAIL"
      : missingKeywords.length > 0
        ? "ISSUE"
        : "PASS";

    surfaceResults.push({
      axisKey, surfacePath, role,
      actualValue: actualText.slice(0, 120) + (actualText.length > 120 ? "…" : ""),
      status: surfaceStatus,
      missingKeywords,
      forbiddenFound,
    });
  }

  // ── visibleStrength 종합 (첫 번째 axisKey 기준으로 출력용 대표값 계산) ────────

  // 실제로는 per-axis지만 표시는 첫 번째 axisKey로 대표
  const representativeAxisKey = allAxisKeys[0] ?? null;
  const visibleStrength = representativeAxisKey
    ? (perAxisSlotStatus[representativeAxisKey]?.visibleStrength ?? "WEAK_OR_HIDDEN")
    : "WEAK_OR_HIDDEN";

  const hasForbiddenViolation = failures.some((f) => f.includes("shouldNotMention VIOLATION"));
  const hasHasSlotsFailure    = failures.some((f) => f.includes("hasSlots FAIL"));

  return {
    surfaceCount: surfaces.length,
    surfaceResults,
    perAxisSlotStatus,
    hasSlotsOverall,
    visibleStrength,
    issues,
    failures,
    hasForbiddenViolation,
    hasHasSlotsFailure,
  };
}

// ─── 최종 판정 ────────────────────────────────────────────────────────────────

function finalVerdict(result) {
  if (result.runError) return "FAIL";
  if (!result.axisPack) return "FAIL";
  if (result.verify.failures.length > 0) return "FAIL";
  if (result.verify.issues.length > 0)   return "ISSUE";
  const str = result.verify.visibleStrength;
  if (str === "EXPANDABLE_OR_WEAK_VISIBLE" || str === "WEAK_OR_HIDDEN") return "ISSUE";
  return "PASS";
}

// ─── 실행 ─────────────────────────────────────────────────────────────────────

const allCases = NEWGRAD_CORE_INVARIANT_CASES.filter(
  (c) => c.uiInsightExpected && c.uiInsightExpected.targetLayer === "UI_VISIBLE_AXIS_EXPLANATION"
);

const targetCases = filterCaseId
  ? allCases.filter((c) => c.caseId === filterCaseId)
  : allCases;

if (targetCases.length === 0) {
  console.error(`케이스를 찾을 수 없음: ${filterCaseId ?? "(전체 0개)"}`);
  process.exit(1);
}

let countPass  = 0;
let countIssue = 0;
let countFail  = 0;
let forbiddenFailCount    = 0;
let hasSlotsFailCount     = 0;
let weakVisibleCount      = 0;
let patternMismatchCount  = 0;

const allResults = [];

console.log("\n신입 P0 UI-visible Axis Explanation Surface Smoke Runner\n");

for (const testCase of targetCases) {
  const { caseId, caseName, input, uiInsightExpected } = testCase;

  let vm = null;
  let runError = null;
  try {
    vm = buildNewgradTransitionLiteResult(input);
  } catch (err) {
    runError = err?.message ?? String(err);
  }

  const result = { caseId, caseName, runError, axisPack: vm?.axisPack ?? null };

  if (runError || !vm?.axisPack) {
    result.verify = {
      surfaceCount: 0, surfaceResults: [], perAxisSlotStatus: {},
      hasSlotsOverall: false, visibleStrength: "WEAK_OR_HIDDEN",
      issues: [], failures: [runError ? `실행 오류: ${runError}` : "axisPack null"],
      hasForbiddenViolation: false, hasHasSlotsFailure: true,
    };
  } else {
    result.verify = verifySurfaces(vm, uiInsightExpected, caseId);

    // ── pattern ID 검증 (fixture.expected.expectedPatternIds가 있을 때만) ──────
    const expectedPatternIds = testCase.expected?.expectedPatternIds;
    if (Array.isArray(expectedPatternIds) && expectedPatternIds.length > 0) {
      const firedPatternIds = Array.isArray(
        vm?.axisPack?.meta?.caseInsightOverlays?.firedPatternIds
      ) ? vm.axisPack.meta.caseInsightOverlays.firedPatternIds : [];
      const missingPatterns = expectedPatternIds.filter((pid) => !firedPatternIds.includes(pid));
      if (missingPatterns.length > 0) {
        for (const pid of missingPatterns) {
          result.verify.failures.push(
            `pattern MISMATCH: expected "${pid}" in firedPatternIds but not found ` +
            `(fired: [${firedPatternIds.join(", ") || "none"}])`
          );
        }
        result.verify.hasPatternMismatch = true;
      } else {
        result.verify.hasPatternMismatch = false;
      }
      result.verify.firedPatternIds    = firedPatternIds;
      result.verify.expectedPatternIds = expectedPatternIds;
    }
  }

  const verdict = finalVerdict(result);
  result.verdict = verdict;

  if (verdict === "PASS")  countPass++;
  else if (verdict === "ISSUE") countIssue++;
  else countFail++;

  if (result.verify.hasForbiddenViolation) forbiddenFailCount++;
  if (result.verify.hasHasSlotsFailure)    hasSlotsFailCount++;
  if (result.verify.hasPatternMismatch)    patternMismatchCount++;
  const str = result.verify.visibleStrength;
  if (str === "EXPANDABLE_OR_WEAK_VISIBLE" || str === "WEAK_OR_HIDDEN") weakVisibleCount++;

  allResults.push(result);

  // ── 콘솔 출력 ───────────────────────────────────────────────────────────────

  const icon = verdict === "PASS" ? "✓" : verdict === "ISSUE" ? "△" : "✗";
  console.log(`  ${icon}  [${verdict}] ${caseId}`);
  console.log(`       ${caseName}`);

  if (result.verify.surfaceCount > 0) {
    console.log(`       surfaces: ${result.verify.surfaceCount} checked`);
  }

  // per-axis hasSlots 출력
  const slotStatus = result.verify.perAxisSlotStatus;
  for (const [axisKey, st] of Object.entries(slotStatus)) {
    const slotVerdict = st.pass ? "PASS" : "FAIL";
    console.log(
      `       hasSlots [${axisKey}]: ${slotVerdict}` +
      (st.filled?.length > 0 ? ` (${st.filled.join(", ")})` : " (none)")
    );
  }

  console.log(`       visibleStrength: ${result.verify.visibleStrength}`);

  if (result.verify.issues.length > 0) {
    console.log("       missing keywords:");
    for (const issue of result.verify.issues) {
      console.log(`         - ${issue}`);
    }
  }

  if (result.verify.failures.length > 0) {
    const forbiddenItems = result.verify.failures.filter((f) => f.includes("shouldNotMention"));
    const patternItems   = result.verify.failures.filter((f) => f.includes("pattern MISMATCH"));
    const otherFailures  = result.verify.failures.filter(
      (f) => !f.includes("shouldNotMention") && !f.includes("pattern MISMATCH")
    );
    if (forbiddenItems.length > 0) {
      console.log("       forbidden violations:");
      for (const f of forbiddenItems) console.log(`         ✗ ${f}`);
    }
    if (patternItems.length > 0) {
      console.log("       pattern mismatch:");
      for (const f of patternItems) console.log(`         ✗ ${f}`);
    }
    if (otherFailures.length > 0) {
      console.log("       failures:");
      for (const f of otherFailures) console.log(`         ✗ ${f}`);
    }
  } else {
    console.log("       forbidden: PASS");
  }

  // pattern ID 검증 결과 (contract가 있고 PASS인 경우)
  if (Array.isArray(result.verify.expectedPatternIds) && !result.verify.hasPatternMismatch) {
    const fired = result.verify.firedPatternIds ?? [];
    console.log(`       pattern IDs: PASS (fired: [${fired.join(", ")}])`);
  }

  // 실제 surface 값 간략 미리보기 (primaryBody만)
  for (const sr of result.verify.surfaceResults) {
    if (sr.role === "primaryBody" && sr.actualValue) {
      console.log(
        `       actual [${sr.axisKey}.lead]: "${sr.actualValue.slice(0, 80)}…"`
      );
    }
  }

  console.log();
}

// ─── 최종 요약 ────────────────────────────────────────────────────────────────

console.log("─".repeat(70));
console.log(`결과: ${countPass} PASS / ${countIssue} ISSUE / ${countFail} FAIL / ${targetCases.length} 총`);
console.log(`      shouldNotMention 위반: ${forbiddenFailCount}건`);
console.log(`      hasSlots 미충족: ${hasSlotsFailCount}건`);
console.log(`      visibleStrength 약함 (EXPANDABLE/HIDDEN): ${weakVisibleCount}건`);
console.log(`      pattern mismatch: ${patternMismatchCount}건`);

if (countFail === 0 && countIssue === 0) {
  console.log("\n✅ 모든 케이스 PASS — UI-visible surface 계약 충족.");
} else if (countFail === 0) {
  console.log("\n△  ISSUE 케이스 있음 — shouldMention 누락 또는 visibleStrength 약함.");
  console.log("   위 ISSUE 항목을 확인하고 axis explanation 문구 보강을 검토하세요.");
} else {
  console.log("\n⚠  FAIL 케이스 있음 — 위 오류 내용을 확인하세요.");
  if (forbiddenFailCount > 0) {
    console.log("   shouldNotMention 위반이 있습니다. 금지 표현이 실제 출력에 포함됩니다.");
  }
  if (hasSlotsFailCount > 0) {
    console.log("   hasSlots 조건 미충족 케이스가 있습니다. explanation 슬롯 생성 로직을 확인하세요.");
  }
}

// ─── JSON 저장 (--json 옵션) ──────────────────────────────────────────────────

if (saveJson) {
  const outputDir = path.resolve(__dirname, "output");
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outputDir, `${timestamp}-newgrad-ui-insight-surface.json`);
  const summary = {
    runAt: new Date().toISOString(),
    runner: "run-newgrad-ui-insight-surface-smoke.mjs",
    cases: allResults.map((r) => ({
      caseId: r.caseId,
      caseName: r.caseName,
      verdict: r.verdict,
      hasSlotsOverall: r.verify.hasSlotsOverall,
      visibleStrength: r.verify.visibleStrength,
      issues: r.verify.issues,
      failures: r.verify.failures,
      surfaceResults: r.verify.surfaceResults.map((sr) => ({
        axisKey: sr.axisKey,
        surfacePath: sr.surfacePath,
        role: sr.role,
        status: sr.status,
        actualValue: sr.actualValue,
        missingKeywords: sr.missingKeywords ?? [],
        forbiddenFound: sr.forbiddenFound ?? [],
      })),
      perAxisSlotStatus: Object.fromEntries(
        Object.entries(r.verify.perAxisSlotStatus).map(([k, v]) => [
          k, { filled: v.filled, count: v.count, pass: v.pass, visibleStrength: v.visibleStrength }
        ])
      ),
    })),
    stats: {
      total: targetCases.length,
      pass: countPass,
      issue: countIssue,
      fail: countFail,
      forbiddenFailCount,
      hasSlotsFailCount,
      weakVisibleCount,
    },
  };
  writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nJSON 저장됨: ${outPath}`);
}

if (countFail > 0) process.exit(1);
