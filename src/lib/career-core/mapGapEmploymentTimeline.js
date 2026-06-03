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

function normalizeBooleanLike(value) {
  return value === true;
}

function roleToGapTimelineInterval(role, index, options = {}) {
  const period = safeString(role?.period ?? role?.dateRange ?? role?.duration ?? "");
  const parsedPeriod = parseCareerPeriod(period, {
    testReferenceDate: options.testReferenceDate ?? DEFAULT_TEST_REFERENCE_DATE,
  });
  const employmentTypeMetadata = getEmploymentTypeMetadata(role?.employmentType ?? role?.employmentLabel ?? "");
  const durationMonths = parsedPeriod.durationMonthsInclusive ?? null;
  const shortTenure = evaluateShortTenureRisk({
    durationMonthsInclusive: durationMonths,
    employmentTypeMetadata,
  });

  const countsAsGap = normalizeBooleanLike(employmentTypeMetadata.countsAsGap);
  const countsAsExperience = employmentTypeMetadata.countsAsExperience === true;
  const gapMonths = countsAsGap && Number.isFinite(durationMonths) ? durationMonths : 0;
  const experienceMonths = countsAsExperience && Number.isFinite(durationMonths) ? durationMonths : 0;
  const warnings = [
    ...parsedPeriod.parseWarnings.map((warning) => `period_${warning}`),
    ...employmentTypeMetadata.warnings.map((warning) => `employment_${warning}`),
    ...shortTenure.warnings.map((warning) => `short_tenure_${warning}`),
  ];

  if (countsAsGap) warnings.push("gap_not_counted_as_experience");

  return {
    id: safeString(role?.id) || `employment-interval-${index + 1}`,
    title: safeString(role?.title ?? role?.role ?? role?.position ?? ""),
    rawPeriod: period,
    rawEmploymentType: safeString(role?.employmentType ?? role?.employmentLabel ?? ""),
    normalizedEmploymentType: employmentTypeMetadata.normalizedEmploymentType,
    metadataVariant: employmentTypeMetadata.metadataVariant,
    startMonth: parsedPeriod.normalizedStart,
    endMonth: parsedPeriod.normalizedEnd,
    isCurrent: parsedPeriod.isCurrent,
    datePrecision: parsedPeriod.datePrecision,
    durationMonths,
    timelineKind: countsAsGap ? "gap" : "employment_or_signal",
    countsAsExperience: employmentTypeMetadata.countsAsExperience,
    countsAsGap: employmentTypeMetadata.countsAsGap,
    countsAsSignal: employmentTypeMetadata.countsAsSignal,
    experienceWeight: employmentTypeMetadata.experienceWeight,
    shortTenureApplicable: employmentTypeMetadata.shortTenureApplicable,
    shortTenureRisk: shortTenure.shortTenureRisk,
    gapMonths,
    experienceMonths,
    mappedToTimeline: false,
    mappedToCareerProfile: false,
    warnings,
  };
}

export function mapGapEmploymentTimeline(input = {}, options = {}) {
  const roles = readRoles(input);
  const company = readCompany(input);
  const employmentTimeline = roles.map((role, index) => roleToGapTimelineInterval(role, index, options));
  const explicitGapIntervals = employmentTimeline.filter((interval) => interval.countsAsGap === true);
  const gapMonths = explicitGapIntervals.reduce((sum, interval) => sum + (interval.gapMonths ?? 0), 0);
  const experienceMonths = employmentTimeline.reduce((sum, interval) => sum + (interval.experienceMonths ?? 0), 0);
  const totalCalendarMonthsFromIntervals = employmentTimeline.reduce(
    (sum, interval) => sum + (Number.isFinite(interval.durationMonths) ? interval.durationMonths : 0),
    0
  );

  return {
    company,
    employmentTimeline,
    explicitGapIntervals,
    summary: {
      intervalCount: employmentTimeline.length,
      hasExplicitGap: explicitGapIntervals.length > 0,
      explicitGapCount: explicitGapIntervals.length,
      gapMonths,
      experienceMonths,
      totalCalendarMonthsFromIntervals,
    },
    mappedToAnalyzeCareerTimeline: false,
    mappedToCareerProfile: false,
    warnings: employmentTimeline.flatMap((interval) =>
      interval.warnings.map((warning) => ({ intervalId: interval.id, warning }))
    ),
  };
}
