const PRESENT_VALUES = new Set(["present", "current", "now", "ongoing", "현재", "재직중", "재직 중"]);

function safeString(value) {
  return String(value ?? "").trim();
}

function getCurrentMonthIndex(currentDate = new Date()) {
  const date = currentDate instanceof Date ? currentDate : new Date(currentDate);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return fallback.getFullYear() * 12 + fallback.getMonth();
  }
  return date.getFullYear() * 12 + date.getMonth();
}

function monthIndexToString(monthIndex) {
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonth(value) {
  const raw = safeString(value);
  if (!raw) return { monthIndex: null, warning: "missing_date" };

  const normalized = raw
    .replace(/[./]/g, "-")
    .replace(/\s+/g, "")
    .match(/^(\d{4})-(\d{1,2})/);

  if (!normalized) return { monthIndex: null, warning: `invalid_date:${raw}` };

  const year = Number(normalized[1]);
  const month = Number(normalized[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { monthIndex: null, warning: `invalid_date:${raw}` };
  }

  return { monthIndex: year * 12 + (month - 1), warning: null };
}

function isPresentValue(value) {
  const raw = safeString(value).toLowerCase();
  return PRESENT_VALUES.has(raw);
}

function readExperienceStart(experience) {
  return experience?.startDate ?? experience?.start ?? experience?.from ?? null;
}

function readExperienceEnd(experience) {
  return experience?.endDate ?? experience?.end ?? experience?.to ?? null;
}

function readExperienceTitle(experience) {
  return safeString(experience?.title || experience?.role || experience?.position);
}

function readExperienceCompany(experience) {
  return safeString(experience?.company || experience?.organization || experience?.employer);
}

function isCurrentExperience(experience, rawEnd) {
  if (experience?.isCurrent === true || experience?.current === true) return true;
  if (isPresentValue(rawEnd)) return true;
  return rawEnd == null || safeString(rawEnd) === "";
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

function buildGapIntervals(mergedIntervals) {
  const gaps = [];
  for (let index = 1; index < mergedIntervals.length; index += 1) {
    const previous = mergedIntervals[index - 1];
    const next = mergedIntervals[index];
    const durationMonths = Math.max(0, next.start - previous.endExclusive);
    if (durationMonths <= 0) continue;
    gaps.push({
      startMonth: monthIndexToString(previous.endExclusive),
      endMonth: monthIndexToString(next.start - 1),
      durationMonths,
    });
  }
  return gaps;
}

function recentOverlapMonths(intervals, currentMonthIndex) {
  const recentStart = currentMonthIndex - 35;
  const recentEndExclusive = currentMonthIndex + 1;
  const recentIntervals = intervals
    .map((interval) => ({
      start: Math.max(interval.start, recentStart),
      endExclusive: Math.min(interval.endExclusive, recentEndExclusive),
    }))
    .filter((interval) => interval.endExclusive > interval.start);

  return sumIntervals(mergeIntervals(recentIntervals));
}

export function analyzeCareerTimeline(experiences = [], options = {}) {
  const currentMonthIndex = getCurrentMonthIndex(options.currentDate);
  const rows = Array.isArray(experiences) ? experiences : [];

  const timeline = rows.map((experience, index) => {
    const rawStart = readExperienceStart(experience);
    const rawEnd = readExperienceEnd(experience);
    const warnings = [];
    const start = parseMonth(rawStart);
    const isCurrent = isCurrentExperience(experience, rawEnd);
    const end = isCurrent ? { monthIndex: currentMonthIndex, warning: null } : parseMonth(rawEnd);

    if (start.warning) warnings.push(`start_${start.warning}`);
    if (end.warning) warnings.push(`end_${end.warning}`);
    if (
      Number.isFinite(start.monthIndex) &&
      Number.isFinite(end.monthIndex) &&
      end.monthIndex < start.monthIndex
    ) {
      warnings.push("end_before_start");
    }

    const hasValidRange =
      warnings.every((warning) => warning !== "end_before_start") &&
      Number.isFinite(start.monthIndex) &&
      Number.isFinite(end.monthIndex) &&
      end.monthIndex >= start.monthIndex;

    const durationMonths = hasValidRange ? end.monthIndex - start.monthIndex + 1 : 0;

    return {
      id: safeString(experience?.id) || `experience-${index + 1}`,
      company: readExperienceCompany(experience),
      title: readExperienceTitle(experience),
      startMonth: hasValidRange ? monthIndexToString(start.monthIndex) : null,
      endMonth: hasValidRange ? monthIndexToString(end.monthIndex) : null,
      durationMonths,
      isCurrent,
      isShortTenure: hasValidRange && durationMonths <= 6,
      warnings,
    };
  });

  const validIntervals = timeline
    .filter((item) => item.startMonth && item.endMonth)
    .map((item) => {
      const start = parseMonth(item.startMonth).monthIndex;
      const end = parseMonth(item.endMonth).monthIndex;
      return { start, endExclusive: end + 1 };
    });

  const totalExperienceMonths = timeline.reduce((sum, item) => sum + item.durationMonths, 0);
  const mergedIntervals = mergeIntervals(validIntervals);
  const uniqueExperienceMonths = sumIntervals(mergedIntervals);
  const gaps = buildGapIntervals(mergedIntervals);
  const gapMonths = gaps.reduce((sum, gap) => sum + gap.durationMonths, 0);
  const currentRoleMonths = timeline
    .filter((item) => item.isCurrent)
    .reduce((sum, item) => sum + item.durationMonths, 0);

  return {
    timeline,
    summary: {
      totalExperienceMonths,
      uniqueExperienceMonths,
      overlapMonths: Math.max(0, totalExperienceMonths - uniqueExperienceMonths),
      gapMonths,
      shortTenureCount: timeline.filter((item) => item.isShortTenure).length,
      currentRoleMonths,
      recentExperienceMonths: recentOverlapMonths(validIntervals, currentMonthIndex),
      experienceCount: rows.length,
    },
    gaps,
    meta: {
      currentMonth: monthIndexToString(currentMonthIndex),
      warnings: timeline.flatMap((item) =>
        item.warnings.map((warning) => ({ experienceId: item.id, warning }))
      ),
    },
  };
}
