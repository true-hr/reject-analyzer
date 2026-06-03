import {
  classifyEmploymentType,
  evaluateShortTenureRisk,
  getEmploymentTypeMetadata,
  parseCareerPeriod,
} from "../src/lib/career-core/index.js";
import {
  DATE_FORMAT_TEST_REFERENCE_DATE,
  dateFormatMatrix,
} from "../src/lib/career-core/__fixtures__/dateFormatMatrix.js";
import { expectedDateParseResults } from "../src/lib/career-core/__fixtures__/expectedDateParseResults.js";
import { employmentTypeMatrix } from "../src/lib/career-core/__fixtures__/employmentTypeMatrix.js";
import { expectedEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedEmploymentProfiles.js";
import { dateEmploymentCombinedCases } from "../src/lib/career-core/__fixtures__/dateEmploymentCombinedCases.js";
import { expectedDateEmploymentProfiles } from "../src/lib/career-core/__fixtures__/expectedDateEmploymentProfiles.js";

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedCategoryEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function compareRawParserCase(item, expected) {
  const actual = parseCareerPeriod(item.input, { testReferenceDate: DATE_FORMAT_TEST_REFERENCE_DATE });
  const mismatches = [];

  if (actual.normalizedStart !== expected.normalizedStart) {
    mismatches.push(`start:${actual.normalizedStart}!=${expected.normalizedStart}`);
  }
  if (actual.normalizedEnd !== expected.normalizedEnd) {
    mismatches.push(`end:${actual.normalizedEnd}!=${expected.normalizedEnd}`);
  }
  if (actual.isCurrent !== expected.isCurrent) {
    mismatches.push(`isCurrent:${actual.isCurrent}!=${expected.isCurrent}`);
  }
  if (actual.datePrecision !== expected.datePrecision) {
    mismatches.push(`precision:${actual.datePrecision}!=${expected.datePrecision}`);
  }
  const actualDuration = actual.durationMonthsInclusive ?? null;
  const expectedDuration = expected.durationMonthsInclusive ?? null;
  if (actualDuration !== expectedDuration) {
    mismatches.push(`duration:${actualDuration}!=${expectedDuration}`);
  }
  const actualRange = JSON.stringify(actual.durationMonthsRange ?? null);
  const expectedRange = JSON.stringify(expected.durationMonthsRange ?? null);
  if (actualRange !== expectedRange) {
    mismatches.push(`durationRange:${actualRange}!=${expectedRange}`);
  }
  if (expected.timelineKind && actual.timelineKind !== expected.timelineKind) {
    mismatches.push(`timelineKind:${actual.timelineKind}!=${expected.timelineKind}`);
  }
  for (const warning of expected.parseWarnings ?? []) {
    if (!actual.parseWarnings.includes(warning)) {
      mismatches.push(`missingWarning:${warning}`);
    }
  }

  return {
    status: mismatches.length ? "fail" : "pass",
    category: mismatches.length ? "raw_period_parser_mismatch" : "supported_by_raw_period_parser",
    mismatches,
  };
}

function compareDateCase(item, expected) {
  return compareRawParserCase(item, expected);
}

function auditDateMatrix() {
  const failureCategories = new Map();
  const examples = [];
  let comparable = 0;
  let unsupported = 0;
  let pass = 0;
  let review = 0;
  let fail = 0;
  let rawParserComparable = 0;
  let rawParserPass = 0;

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
    if (comparison.category === "supported_by_raw_period_parser") {
      rawParserComparable += 1;
    }
    if (comparison.status === "pass") {
      pass += 1;
      if (comparison.category === "supported_by_raw_period_parser") {
        rawParserPass += 1;
      }
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
    rawParserComparable,
    rawParserPass,
    failureCategories,
    examples,
  };
}

function auditEmploymentMatrix() {
  const failureCategories = new Map();
  const missingExpected = [];
  const examples = [];
  let comparable = 0;
  let classifierPass = 0;
  let classifierFail = 0;
  let metadataComparable = 0;
  let metadataPass = 0;
  let metadataReview = 0;
  let metadataFail = 0;

  for (const item of employmentTypeMatrix) {
    const expected = expectedEmploymentProfiles[item.id];
    if (!expected) {
      missingExpected.push(item.id);
      classifierFail += 1;
      metadataFail += 1;
      increment(failureCategories, "expected_employment_profile_missing");
      continue;
    }

    comparable += 1;
    metadataComparable += 1;
    const classifierMismatches = [];
    const metadataMismatches = [];
    for (const label of item.inputLabels) {
      const classified = classifyEmploymentType(label);
      if (classified.normalizedEmploymentType !== item.normalizedEmploymentType) {
        classifierMismatches.push(`${label}:${classified.normalizedEmploymentType}!=${item.normalizedEmploymentType}`);
      }
      if (classified.normalizedEmploymentType !== expected.normalizedEmploymentType) {
        classifierMismatches.push(`${label}:${classified.normalizedEmploymentType}!=expected:${expected.normalizedEmploymentType}`);
      }

      const metadata = getEmploymentTypeMetadata(classified);
      if (metadata.normalizedEmploymentType !== expected.normalizedEmploymentType) {
        metadataMismatches.push(`${label}:metadataType:${metadata.normalizedEmploymentType}!=${expected.normalizedEmploymentType}`);
      }
      if (metadata.countsAsExperience !== expected.countsAsExperience) {
        metadataMismatches.push(`${label}:countsAsExperience:${metadata.countsAsExperience}!=${expected.countsAsExperience}`);
      }
      if (metadata.countsAsGap !== expected.countsAsGap) {
        metadataMismatches.push(`${label}:countsAsGap:${metadata.countsAsGap}!=${expected.countsAsGap}`);
      }
      if (metadata.countsAsSignal !== expected.countsAsSignal) {
        metadataMismatches.push(`${label}:countsAsSignal:${metadata.countsAsSignal}!=${expected.countsAsSignal}`);
      }
      if (metadata.experienceWeight !== expected.experienceWeight) {
        metadataMismatches.push(`${label}:experienceWeight:${metadata.experienceWeight}!=${expected.experienceWeight}`);
      }
      if (metadata.shortTenureApplicable !== expected.shortTenureApplicable) {
        metadataMismatches.push(`${label}:shortTenureApplicable:${metadata.shortTenureApplicable}!=${expected.shortTenureApplicable}`);
      }
      const actualRisks = JSON.stringify(metadata.riskSignalsPossible);
      const expectedRisks = JSON.stringify(expected.expectedCareerProfileImpact.riskSignals);
      if (actualRisks !== expectedRisks) {
        metadataMismatches.push(`${label}:riskSignalsPossible:${actualRisks}!=${expectedRisks}`);
      }
      if (metadata.metadataAppliedToTimeline !== false) {
        metadataMismatches.push(`${label}:metadataAppliedToTimeline:${metadata.metadataAppliedToTimeline}!=false`);
      }
      if (metadata.metadataAppliedToCareerProfile !== false) {
        metadataMismatches.push(`${label}:metadataAppliedToCareerProfile:${metadata.metadataAppliedToCareerProfile}!=false`);
      }
    }

    if (classifierMismatches.length) {
      classifierFail += 1;
      increment(failureCategories, "employment_classifier_mismatch");
      if (examples.length < 8) {
        examples.push({ id: item.id, category: "employment_classifier_mismatch", mismatches: classifierMismatches });
      }
      continue;
    }

    classifierPass += 1;

    if (metadataMismatches.length) {
      metadataFail += 1;
      increment(failureCategories, "employment_metadata_mismatch");
      if (examples.length < 8) {
        examples.push({ id: item.id, category: "employment_metadata_mismatch", mismatches: metadataMismatches });
      }
      continue;
    }

    metadataPass += 1;
    metadataReview += 1;
    increment(failureCategories, "employment_metadata_not_applied_to_timeline");
    increment(failureCategories, "employment_metadata_not_applied_to_career_profile");
    increment(failureCategories, "weighted_experience_months_not_calculated");
    if (item.normalizedEmploymentType === "gap") {
      increment(failureCategories, "gap_employment_type_mapping_not_applied");
    }
  }

  return {
    total: employmentTypeMatrix.length,
    comparable,
    unsupported: 0,
    classifierPass,
    classifierFail,
    metadataComparable,
    metadataPass,
    metadataReview,
    metadataFail,
    missingExpected,
    failureCategories,
    examples,
  };
}

const CONTEXTUAL_SHORT_TENURE_TYPES = new Set([
  "contract",
  "dispatch",
  "freelance",
  "founder_or_self_employed",
  "part_time",
  "project_contract",
  "unpaid_activity",
]);

function expectedShortTenureApplicable(normalizedEmploymentType) {
  if (normalizedEmploymentType === "full_time") return true;
  if (CONTEXTUAL_SHORT_TENURE_TYPES.has(normalizedEmploymentType)) return "contextual";
  return false;
}

function expectedShortTenureRisk(normalizedEmploymentType) {
  const applicable = expectedShortTenureApplicable(normalizedEmploymentType);
  if (applicable === true) return true;
  if (applicable === "contextual") return "contextual";
  return false;
}

function representativeEmploymentLabel(item) {
  return item.inputLabels.find((label) => /^[\x00-\x7F]+$/.test(label)) ?? item.inputLabels[0];
}

function auditShortTenureOverride() {
  const failureCategories = new Map();
  const missingExpected = [];
  const examples = [];
  let comparable = 0;
  let pass = 0;
  let review = 0;
  let fail = 0;

  for (const item of employmentTypeMatrix) {
    if (!expectedEmploymentProfiles[item.id]) {
      missingExpected.push(item.id);
      fail += 1;
      increment(failureCategories, "expected_employment_profile_missing");
      continue;
    }

    comparable += 1;
    const durationMonthsInclusive = item.normalizedEmploymentType === "military_service" ? 18 : 5;
    const actual = evaluateShortTenureRisk({
      durationMonthsInclusive,
      employmentType: representativeEmploymentLabel(item),
    });
    const expectedApplicable = expectedShortTenureApplicable(item.normalizedEmploymentType);
    const expectedRisk = durationMonthsInclusive < 12
      ? expectedShortTenureRisk(item.normalizedEmploymentType)
      : false;
    const mismatches = [];

    if (actual.normalizedEmploymentType !== item.normalizedEmploymentType) {
      mismatches.push(`type:${actual.normalizedEmploymentType}!=${item.normalizedEmploymentType}`);
    }
    if (actual.shortTenureApplicable !== expectedApplicable) {
      mismatches.push(`applicable:${actual.shortTenureApplicable}!=${expectedApplicable}`);
    }
    if (actual.shortTenureRisk !== expectedRisk) {
      mismatches.push(`risk:${actual.shortTenureRisk}!=${expectedRisk}`);
    }
    if (actual.appliedToCareerProfile !== false) {
      mismatches.push(`appliedToCareerProfile:${actual.appliedToCareerProfile}!=false`);
    }

    if (mismatches.length) {
      fail += 1;
      increment(failureCategories, "short_tenure_override_mismatch");
      if (examples.length < 8) {
        examples.push({ id: item.id, category: "short_tenure_override_mismatch", mismatches });
      }
      continue;
    }

    pass += 1;
    review += 1;
    increment(failureCategories, "short_tenure_override_not_applied_to_timeline");
    increment(failureCategories, "short_tenure_override_not_applied_to_career_profile");
  }

  return {
    total: employmentTypeMatrix.length,
    comparable,
    pass,
    review,
    fail,
    missingExpected,
    failureCategories,
    examples,
  };
}

function combinedMissingCategories(caseId) {
  const categories = ["combined_timeline_adapter_missing", "weighted_experience_months_not_calculated"];
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
  if (categories.has("expected_future_parser_case") || categories.has("partial_precision_not_supported_yet")) {
    candidates.push("Extend raw period parsing for year-only, partial-month, and half-year precision ranges.");
  }
  if (categories.has("employment_classifier_mismatch")) {
    candidates.push("Fix employment type classifier aliases that do not match the baseline matrix.");
  }
  if (categories.has("gap_employment_type_mapping_not_applied")) {
    candidates.push("Add gap employment type mapping into timeline calculation as a separate batch.");
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

function printSummary(dateAudit, employmentAudit, shortTenureAudit, combinedAudit) {
  const allCategories = mergeCategories(
    dateAudit.failureCategories,
    employmentAudit.failureCategories,
    shortTenureAudit.failureCategories,
    combinedAudit.failureCategories
  );
  const conclusion = dateAudit.fail > 0 ||
    employmentAudit.classifierFail > 0 ||
    employmentAudit.metadataFail > 0 ||
    shortTenureAudit.fail > 0
    ? "FAIL"
    : allCategories.size > 0
      ? "REVIEW"
      : "PASS";

  console.log("Career Core Date & Employment Baseline Harness");
  console.log("Mode: non-blocking audit");
  console.log(`Conclusion: ${conclusion}`);
  console.log("");
  console.log(
    `Date matrix total/comparable/unsupported/pass/review/fail: ${dateAudit.total}/${dateAudit.comparable}/${dateAudit.unsupported}/${dateAudit.pass}/${dateAudit.review}/${dateAudit.fail}`
  );
  console.log(
    `Date raw period parser comparable/pass: ${dateAudit.rawParserComparable}/${dateAudit.rawParserPass}`
  );
  console.log(
    `Employment classifier total/comparable/pass/fail: ${employmentAudit.total}/${employmentAudit.comparable}/${employmentAudit.classifierPass}/${employmentAudit.classifierFail}`
  );
  console.log(
    `Employment metadata total/comparable/pass/review/fail: ${employmentAudit.total}/${employmentAudit.metadataComparable}/${employmentAudit.metadataPass}/${employmentAudit.metadataReview}/${employmentAudit.metadataFail}`
  );
  console.log(
    "Employment metadata status: metadata comparable/pass, not applied to timeline or CareerProfile"
  );
  console.log(
    `Employment short tenure override total/comparable/pass/review/fail: ${shortTenureAudit.total}/${shortTenureAudit.comparable}/${shortTenureAudit.pass}/${shortTenureAudit.review}/${shortTenureAudit.fail}`
  );
  console.log(
    "Employment short tenure status: override comparable/pass, not applied to timeline or CareerProfile"
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
  console.log("Employment failure examples:");
  for (const example of [...employmentAudit.examples, ...shortTenureAudit.examples]) {
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
  const shortTenureAudit = auditShortTenureOverride();
  const combinedAudit = auditCombinedCases();
  printSummary(dateAudit, employmentAudit, shortTenureAudit, combinedAudit);
  process.exitCode = 0;
} catch (error) {
  console.error("FAIL fixture import/runtime error");
  console.error(error);
  process.exitCode = 1;
}
