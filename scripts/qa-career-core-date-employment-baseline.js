import { analyzeCareerTimeline } from "../src/lib/career-core/index.js";
import {
  DATE_FORMAT_TEST_REFERENCE_DATE,
  dateFormatMatrix,
} from "../src/lib/career-core/__fixtures__/dateFormatMatrix.js";
import { expectedDateParseResults } from "../src/lib/career-core/__fixtures__/expectedDateParseResults.js";
import { employmentTypeMatrix } from "../src/lib/career-core/__fixtures__/employmentTypeMatrix.js";
import { expectedEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedEmploymentProfiles.js";
import { dateEmploymentCombinedCases } from "../src/lib/career-core/__fixtures__/dateEmploymentCombinedCases.js";
import { expectedDateEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedDateEmploymentProfiles.js";

const MONTH_RE = /^\d{4}-\d{2}$/;

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedCategoryEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function hasMonthRangeExpected(expected) {
  return (
    expected &&
    MONTH_RE.test(expected.normalizedStart ?? "") &&
    MONTH_RE.test(expected.normalizedEnd ?? "") &&
    Number.isFinite(expected.durationMonthsInclusive)
  );
}

function isCurrentCase(id, expected) {
  return id.startsWith("present_") || expected?.isCurrent === true;
}

function compareDateCase(item, expected) {
  if (!hasMonthRangeExpected(expected)) {
    const warnings = expected?.parseWarnings ?? [];
    if (warnings.includes("month_missing") || expected?.datePrecision === "year") {
      return { status: "unsupported", category: "expected_future_parser_case" };
    }
    return { status: "unsupported", category: "raw_range_parser_missing" };
  }

  const currentCase = isCurrentCase(item.id, expected);
  const row = {
    id: item.id,
    title: "date baseline comparable row",
    startDate: expected.normalizedStart,
    endDate: currentCase ? null : expected.normalizedEnd,
    isCurrent: currentCase || undefined,
  };

  const result = analyzeCareerTimeline([row], { currentDate: DATE_FORMAT_TEST_REFERENCE_DATE });
  const actual = result.timeline[0];
  const mismatches = [];

  if (actual.startMonth !== expected.normalizedStart) {
    mismatches.push(`start:${actual.startMonth}!=${expected.normalizedStart}`);
  }
  if (actual.endMonth !== expected.normalizedEnd) {
    mismatches.push(`end:${actual.endMonth}!=${expected.normalizedEnd}`);
  }
  if (actual.isCurrent !== expected.isCurrent) {
    mismatches.push(`isCurrent:${actual.isCurrent}!=${expected.isCurrent}`);
  }
  if (actual.durationMonths !== expected.durationMonthsInclusive) {
    mismatches.push(`duration:${actual.durationMonths}!=${expected.durationMonthsInclusive}`);
  }

  return {
    status: mismatches.length ? "fail" : "pass",
    category: mismatches.length ? "timeline_month_comparison_mismatch" : "supported_by_current_timeline",
    mismatches,
  };
}

function auditDateMatrix() {
  const failureCategories = new Map();
  const examples = [];
  let comparable = 0;
  let unsupported = 0;
  let pass = 0;
  let review = 0;
  let fail = 0;

  for (const item of dateFormatMatrix) {
    const expected = expectedDateParseResults[item.id];
    if (!expected) {
      fail += 1;
      increment(failureCategories, "expected_date_result_missing");
      examples.push({ id: item.id, category: "expected_date_result_missing" });
      continue;
    }

    const comparison = compareDateCase(item, expected);
    if (comparison.status === "unsupported") {
      unsupported += 1;
      review += 1;
      increment(failureCategories, comparison.category);
      if (examples.length < 8) examples.push({ id: item.id, category: comparison.category });
      continue;
    }

    comparable += 1;
    if (comparison.status === "pass") {
      pass += 1;
    } else {
      fail += 1;
      increment(failureCategories, comparison.category);
      if (examples.length < 8) {
        examples.push({ id: item.id, category: comparison.category, mismatches: comparison.mismatches });
      }
    }
  }

  return {
    total: dateFormatMatrix.length,
    comparable,
    unsupported,
    pass,
    review,
    fail,
    failureCategories,
    examples,
  };
}

function auditEmploymentMatrix() {
  const failureCategories = new Map();
  const missingExpected = [];

  for (const item of employmentTypeMatrix) {
    if (!expectedEmploymentProfiles[item.id]) {
      missingExpected.push(item.id);
      increment(failureCategories, "expected_employment_profile_missing");
      continue;
    }
    increment(failureCategories, "employment_classifier_missing");
    increment(failureCategories, "employment_weighting_missing");
    if (item.expected.shortTenureApplicable === false || item.expected.shortTenureApplicable === "contextual") {
      increment(failureCategories, "short_tenure_employment_override_missing");
    }
    if (item.normalizedEmploymentType === "gap") {
      increment(failureCategories, "gap_employment_type_mapping_missing");
    }
  }

  return {
    total: employmentTypeMatrix.length,
    comparable: 0,
    unsupported: employmentTypeMatrix.length,
    missingExpected,
    failureCategories,
  };
}

function combinedMissingCategories(caseId) {
  const categories = ["combined_timeline_adapter_missing", "employment_weighted_duration_missing"];
  if (caseId.includes("overlapping_project")) categories.push("overlapping_project_dedup_missing");
  if (caseId.includes("leave_inside_fulltime")) categories.push("leave_inside_fulltime_not_modeled");
  if (caseId.includes("military")) categories.push("military_service_not_modeled");
  return categories;
}

function auditCombinedCases() {
  const failureCategories = new Map();
  const missingExpected = [];

  for (const item of dateEmploymentCombinedCases) {
    if (!expectedDateEmploymentProfiles[item.id]) {
      missingExpected.push(item.id);
      increment(failureCategories, "expected_combined_profile_missing");
      continue;
    }
    for (const category of combinedMissingCategories(item.id)) {
      increment(failureCategories, category);
    }
  }

  return {
    total: dateEmploymentCombinedCases.length,
    comparable: 0,
    unsupported: dateEmploymentCombinedCases.length,
    missingExpected,
    failureCategories,
  };
}

function mergeCategories(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [key, value] of map.entries()) {
      merged.set(key, (merged.get(key) ?? 0) + value);
    }
  }
  return merged;
}

function recommendedNextPatchCandidates(categories) {
  const candidates = [];
  if (categories.has("raw_range_parser_missing") || categories.has("expected_future_parser_case")) {
    candidates.push("Add a raw period string parser that can normalize Korean, short-year, separator, current, year-only, and partial-month date ranges.");
  }
  if (categories.has("employment_classifier_missing")) {
    candidates.push("Add an employment type classifier for full_time, contract, internship, freelance, training, gap, military, leave, and project_contract labels.");
  }
  if (categories.has("employment_weighting_missing")) {
    candidates.push("Add non-blocking employment weighting metadata before using it in CareerProfile scoring.");
  }
  if (categories.has("combined_timeline_adapter_missing")) {
    candidates.push("Add a combined date + employment timeline adapter that preserves employment type per interval.");
  }
  if (categories.has("overlapping_project_dedup_missing")) {
    candidates.push("Add overlap deduplication rules for project-contract timelines.");
  }
  if (categories.has("leave_inside_fulltime_not_modeled")) {
    candidates.push("Model leave inside full-time employment separately from gaps.");
  }
  if (categories.has("military_service_not_modeled")) {
    candidates.push("Model military service as a special timeline interval, not general work experience or gap.");
  }
  return candidates;
}

function printSummary(dateAudit, employmentAudit, combinedAudit) {
  const allCategories = mergeCategories(
    dateAudit.failureCategories,
    employmentAudit.failureCategories,
    combinedAudit.failureCategories
  );
  const conclusion = dateAudit.fail > 0 ? "FAIL" : allCategories.size > 0 ? "REVIEW" : "PASS";

  console.log("Career Core Date & Employment Baseline Harness");
  console.log("Mode: non-blocking audit");
  console.log(`Conclusion: ${conclusion}`);
  console.log("");
  console.log(
    `Date matrix total/comparable/unsupported/pass/review/fail: ${dateAudit.total}/${dateAudit.comparable}/${dateAudit.unsupported}/${dateAudit.pass}/${dateAudit.review}/${dateAudit.fail}`
  );
  console.log(
    `Employment matrix total/comparable/unsupported: ${employmentAudit.total}/${employmentAudit.comparable}/${employmentAudit.unsupported}`
  );
  console.log(
    `Combined cases total/comparable/unsupported: ${combinedAudit.total}/${combinedAudit.comparable}/${combinedAudit.unsupported}`
  );
  console.log("");
  console.log("Top failure categories:");
  for (const [category, count] of sortedCategoryEntries(allCategories).slice(0, 12)) {
    console.log(`- ${category}: ${count}`);
  }
  console.log("");
  console.log("Date unsupported/failure examples:");
  for (const example of dateAudit.examples) {
    const details = example.mismatches ? ` (${example.mismatches.join(", ")})` : "";
    console.log(`- ${example.id}: ${example.category}${details}`);
  }
  console.log("");
  console.log("Recommended next patch candidates:");
  for (const candidate of recommendedNextPatchCandidates(allCategories)) {
    console.log(`- ${candidate}`);
  }

  return conclusion;
}

try {
  const dateAudit = auditDateMatrix();
  const employmentAudit = auditEmploymentMatrix();
  const combinedAudit = auditCombinedCases();
  printSummary(dateAudit, employmentAudit, combinedAudit);
  process.exitCode = 0;
} catch (error) {
  console.error("FAIL fixture import/runtime error");
  console.error(error);
  process.exitCode = 1;
}
