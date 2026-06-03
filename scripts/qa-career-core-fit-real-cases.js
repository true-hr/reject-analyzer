import assert from "node:assert/strict";
import {
  CAREER_CORE_FIT_QA_CURRENT_DATE,
  careerCoreFitQaCases,
} from "../src/lib/career-core/__fixtures__/careerCoreFitQaCases.js";
import { buildCareerProfileFromResumeProfile } from "../src/lib/career-core/index.js";

function years(months) {
  return `${(months / 12).toFixed(1)}y`;
}

function summarizeFit(fit) {
  const summary = fit.summary;
  return {
    direct: summary.directlyRelevantMonths,
    adjacent: summary.adjacentRelevantMonths,
    transferable: summary.transferableMonths,
    unrelated: summary.unrelatedMonths,
    unknown: summary.unknownMonths,
    total: summary.totalClassifiedMonths,
    primary: summary.primaryFitLevel,
  };
}

function evaluateCase(qaCase, fit) {
  const summary = summarizeFit(fit);
  const checks = qaCase.checks ?? {};
  const failures = [];
  const reviews = [];
  const hasRoleDirectWithoutOverallDirect = fit.experienceFits.some(
    (item) => item.roleFitLevel === "direct" && item.overallFitLevel !== "direct"
  );

  if (Number.isFinite(checks.directMonthsMin) && summary.direct < checks.directMonthsMin) {
    failures.push(`direct months ${summary.direct} < ${checks.directMonthsMin}`);
  }
  if (Number.isFinite(checks.directMonthsMax) && summary.direct > checks.directMonthsMax) {
    failures.push(`direct months ${summary.direct} > ${checks.directMonthsMax}`);
  }
  if (
    Number.isFinite(checks.adjacentOrTransferableMonthsMin) &&
    summary.adjacent + summary.transferable < checks.adjacentOrTransferableMonthsMin
  ) {
    failures.push(
      `adjacent+transferable months ${summary.adjacent + summary.transferable} < ${checks.adjacentOrTransferableMonthsMin}`
    );
  }
  if (Number.isFinite(checks.unknownMonthsMin) && summary.unknown < checks.unknownMonthsMin) {
    failures.push(`unknown months ${summary.unknown} < ${checks.unknownMonthsMin}`);
  }
  if (Number.isFinite(checks.totalClassifiedMonths) && summary.total !== checks.totalClassifiedMonths) {
    failures.push(`total classified months ${summary.total} !== ${checks.totalClassifiedMonths}`);
  }
  if (checks.disallowAnyDirect && summary.direct > 0) {
    failures.push(`direct months should be 0 but got ${summary.direct}`);
  }
  if (checks.disallowAllDirect && summary.direct === summary.total && summary.total > 0) {
    failures.push("all classified months are direct");
  }

  if (summary.primary === "unknown" && !checks.unknownMonthsMin) {
    reviews.push("primary fit is unknown");
  }
  if (summary.transferable > 0 && summary.unrelated === 0 && qaCase.id.includes("bio-quality-to-pm")) {
    reviews.push("bio to PM/SaaS is transferable rather than unrelated");
  }
  if (hasRoleDirectWithoutOverallDirect && qaCase.id.includes("data-assist")) {
    reviews.push("data support case has role direct while overall remains transferable");
  }

  return {
    judgment: failures.length > 0 ? "FAIL" : reviews.length > 0 ? "REVIEW" : "PASS",
    failures,
    reviews,
    summary,
  };
}

const rows = [];
const details = [];

for (const qaCase of careerCoreFitQaCases) {
  const careerProfile = buildCareerProfileFromResumeProfile(qaCase.resumeProfile, {
    currentDate: CAREER_CORE_FIT_QA_CURRENT_DATE,
    target: qaCase.target,
  });
  const fit = careerProfile.fit;
  const result = evaluateCase(qaCase, fit);

  rows.push({
    id: qaCase.id,
    target: `${qaCase.target.roleFamily}/${qaCase.target.industryDomain}`,
    expected: qaCase.expected,
    primary: result.summary.primary,
    direct: result.summary.direct,
    adjacent: result.summary.adjacent,
    transferable: result.summary.transferable,
    unrelated: result.summary.unrelated,
    unknown: result.summary.unknown,
    total: result.summary.total,
    judgment: result.judgment,
  });

  details.push({
    id: qaCase.id,
    title: qaCase.title,
    judgment: result.judgment,
    failures: result.failures,
    reviews: result.reviews,
    experienceFits: fit.experienceFits.map((item) => ({
      id: item.experienceId,
      role: item.roleFitLevel,
      industry: item.industryFitLevel,
      overall: item.overallFitLevel,
      months: item.durationMonths,
      years: years(item.durationMonths),
    })),
  });
}

console.table(rows);

for (const detail of details) {
  console.log(`\n${detail.id} ${detail.title} :: ${detail.judgment}`);
  console.table(detail.experienceFits);
  if (detail.failures.length > 0) console.log(`failures: ${detail.failures.join("; ")}`);
  if (detail.reviews.length > 0) console.log(`reviews: ${detail.reviews.join("; ")}`);
}

const failRows = rows.filter((row) => row.judgment === "FAIL");
assert.equal(failRows.length, 0, `QA hard failures: ${failRows.map((row) => row.id).join(", ")}`);

console.log("\nPASS career-core fit synthetic QA checks");
