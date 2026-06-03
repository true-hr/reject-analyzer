import { evaluateShortTenureRisk } from "./evaluateShortTenureRisk.js";
import { getEmploymentTypeMetadata } from "./getEmploymentTypeMetadata.js";
import { parseCareerPeriod } from "./parseCareerPeriod.js";

const DEFAULT_TEST_REFERENCE_DATE = "2026-06-04";

function safeString(value) {
  return String(value ?? "").trim();
}

function readRoles(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.roles)) return input.roles;
  if (Array.isArray(input?.resumeInput?.roles)) return input.resumeInput.roles;
  return [];
}

function readCompany(input) {
  return safeString(input?.company ?? input?.resumeInput?.company ?? "");
}

function monthIndexFromNormalized(value) {
  const match = safeString(value).match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .filter((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.endExclusive))
    .sort((a, b) => a.start - b.start || a.endExclusive - b.endExclusive);

  const merged = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.endExclusive) {
      merged.push({ ...interval });
      continue;
    }
    last.endExclusive = Math.max(last.endExclusive, interval.endExclusive);
  }
  return merged;
}

function sumIntervals(intervals) {
  return intervals.reduce((sum, interval) => sum + Math.max(0, interval.endExclusive - interval.start), 0);
}

function inferPrimaryRoleFamily(intervals) {
  const text = intervals.map((interval) => interval.title).join(" ");
  if (/채용|헤드헌팅|후보자/.test(text)) return "hr_recruiting";
  if (/데이터|SQL|분석가/.test(text)) return "data_analysis";
  if (/프로덕트\s*운영|제품\s*운영/.test(text)) return "product_operations";
  if (/콘텐츠|리서치\s*프로젝트|정책\s*정리/.test(text)) return "content_service";
  if (/운영|운영기획|서비스\s*운영/.test(text)) return "operations";
  if (/서비스\s*기획|서비스기획/.test(text)) return "service_planning";
  return "unknown";
}

function intervalWarnings(role, metadata, shortTenure, parsedPeriod) {
  const warnings = [
    ...parsedPeriod.parseWarnings.map((warning) => `period_${warning}`),
    ...metadata.warnings.map((warning) => `employment_${warning}`),
    ...shortTenure.warnings.map((warning) => `short_tenure_${warning}`),
  ];

  if (metadata.normalizedEmploymentType === "freelance") {
    warnings.push("freelance_scope_requires_evidence");
  }
  if (metadata.normalizedEmploymentType === "training") {
    warnings.push("training_not_counted_as_work_experience");
  }
  if (metadata.normalizedEmploymentType === "gap") {
    warnings.push("gap_not_counted_as_experience");
  }
  if (metadata.normalizedEmploymentType === "military_service") {
    warnings.push("military_service_not_counted_as_general_work_experience");
  }
  if (metadata.normalizedEmploymentType === "leave_of_absence") {
    warnings.push("leave_of_absence_not_counted_as_gap");
  }

  return warnings;
}

function roleToInterval(role, index, options = {}) {
  const period = safeString(role?.period ?? role?.dateRange ?? role?.duration ?? "");
  const parsedPeriod = parseCareerPeriod(period, {
    testReferenceDate: options.testReferenceDate ?? DEFAULT_TEST_REFERENCE_DATE,
  });
  const metadata = getEmploymentTypeMetadata(role?.employmentType ?? role?.employmentLabel ?? "");
  const durationMonths = parsedPeriod.durationMonthsInclusive ?? null;
  const shortTenure = evaluateShortTenureRisk({
    durationMonthsInclusive: durationMonths,
    employmentTypeMetadata: metadata,
  });
  const start = monthIndexFromNormalized(parsedPeriod.normalizedStart);
  const end = monthIndexFromNormalized(parsedPeriod.normalizedEnd);
  const endExclusive = Number.isFinite(end) ? end + 1 : null;
  const countsAsExperience = metadata.countsAsExperience === true;
  const countsAsGap = metadata.countsAsGap === true;

  return {
    id: safeString(role?.id) || `date-employment-interval-${index + 1}`,
    title: safeString(role?.title ?? role?.role ?? role?.position ?? ""),
    rawPeriod: period,
    rawEmploymentType: safeString(role?.employmentType ?? role?.employmentLabel ?? ""),
    normalizedEmploymentType: metadata.normalizedEmploymentType,
    metadataVariant: metadata.metadataVariant,
    startMonth: parsedPeriod.normalizedStart,
    endMonth: parsedPeriod.normalizedEnd,
    startMonthIndex: start,
    endExclusiveMonthIndex: endExclusive,
    isCurrent: parsedPeriod.isCurrent,
    datePrecision: parsedPeriod.datePrecision,
    durationMonths,
    countsAsExperience: metadata.countsAsExperience,
    countsAsGap: metadata.countsAsGap,
    countsAsSignal: metadata.countsAsSignal,
    experienceWeight: metadata.experienceWeight,
    shortTenureApplicable: metadata.shortTenureApplicable,
    shortTenureRisk: shortTenure.shortTenureRisk,
    gapMonths: countsAsGap && Number.isFinite(durationMonths) ? durationMonths : 0,
    experienceMonths: countsAsExperience && Number.isFinite(durationMonths) ? durationMonths : 0,
    mappedToCareerProfile: false,
    warnings: intervalWarnings(role, metadata, shortTenure, parsedPeriod),
  };
}

function annotateProjectOverlaps(intervals) {
  const projectIntervals = intervals.filter((interval) => interval.normalizedEmploymentType === "project_contract");
  for (const interval of projectIntervals) {
    interval.overlapsWith = projectIntervals
      .filter((candidate) => candidate !== interval)
      .filter((candidate) =>
        Number.isFinite(interval.startMonthIndex) &&
        Number.isFinite(interval.endExclusiveMonthIndex) &&
        Number.isFinite(candidate.startMonthIndex) &&
        Number.isFinite(candidate.endExclusiveMonthIndex) &&
        interval.startMonthIndex < candidate.endExclusiveMonthIndex &&
        candidate.startMonthIndex < interval.endExclusiveMonthIndex
      )
      .map((candidate) => candidate.title);
    if (interval.overlapsWith.length > 0) {
      interval.warnings.push("overlapping_projects_must_not_be_double_counted");
    } else {
      delete interval.overlapsWith;
    }
  }
}

export function buildDateEmploymentTimeline(input = {}, options = {}) {
  const roles = readRoles(input);
  const company = readCompany(input);
  const employmentTimeline = roles.map((role, index) => roleToInterval(role, index, options));
  annotateProjectOverlaps(employmentTimeline);

  const validIntervals = employmentTimeline
    .filter((interval) => Number.isFinite(interval.startMonthIndex) && Number.isFinite(interval.endExclusiveMonthIndex))
    .map((interval) => ({ start: interval.startMonthIndex, endExclusive: interval.endExclusiveMonthIndex }));
  const mergedIntervals = mergeIntervals(validIntervals);
  const totalDurationMonths = employmentTimeline.reduce(
    (sum, interval) => sum + (Number.isFinite(interval.durationMonths) ? interval.durationMonths : 0),
    0
  );
  const totalCalendarMonths = sumIntervals(mergedIntervals);
  const overlapMonths = Math.max(0, totalDurationMonths - totalCalendarMonths);
  const gapMonths = employmentTimeline.reduce((sum, interval) => sum + interval.gapMonths, 0);
  const workExperienceMonths = employmentTimeline.reduce((sum, interval) => sum + interval.experienceMonths, 0);
  const currentInterval = employmentTimeline.find((interval) => interval.isCurrent && interval.countsAsExperience === true);
  const shortTenureCount = employmentTimeline.filter((interval) => interval.shortTenureRisk === true).length;

  const warnings = [
    ...employmentTimeline.flatMap((interval) => interval.warnings.map((warning) => ({ intervalId: interval.id, warning }))),
  ];

  return {
    company,
    employmentTimeline,
    summary: {
      intervalCount: employmentTimeline.length,
      totalDurationMonths,
      totalCalendarMonths,
      overlapMonths,
      hasGap: gapMonths > 0,
      gapMonths,
      workExperienceMonths,
      currentEmploymentType: currentInterval?.normalizedEmploymentType ?? null,
      shortTenureCount,
      primaryRoleFamily: inferPrimaryRoleFamily(employmentTimeline),
      weightedExperienceMonths: "not_calculated",
    },
    mappedToAnalyzeCareerTimeline: false,
    mappedToCareerProfile: false,
    warnings,
  };
}
