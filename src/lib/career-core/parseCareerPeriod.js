const CURRENT_LABEL_RE = /(현재\s*재직|현재|재직\s*중|재직중|present|current|now|ongoing)/i;
const GAP_LABEL_RE = /(공백|개인\s*사유|진로\s*탐색|진로탐색|gap)/i;
const RANGE_SEPARATOR_RE = /(~|∼|–|—|부터|까지|입사|퇴사|\/|-)/;
const KOREAN_MONTH_TOKEN_RE = /(\d{2,4})\s*년\s*(\d{1,2})\s*월/g;
const NUMERIC_MONTH_TOKEN_RE = /(\d{2,4})\s*[./-]\s*(\d{1,2})/g;
const HALF_YEAR_TOKEN_RE = /(\d{2,4})\s*년\s*(상반기|하반기)/;
const YEAR_TOKEN_RE = /\d{2,4}/g;

function safeString(value) {
  return String(value ?? "").trim();
}

function padMonth(month) {
  return String(month).padStart(2, "0");
}

function normalizeYear(year, options = {}) {
  const numeric = Number(year);
  if (!Number.isInteger(numeric)) return null;
  if (numeric >= 1000) return numeric;
  if (numeric < 0 || numeric > 99) return null;

  const pivotYear = Number.isInteger(options.shortYearPivot) ? options.shortYearPivot : 50;
  return numeric >= pivotYear ? 1900 + numeric : 2000 + numeric;
}

function getReferenceMonth(options = {}) {
  const raw = options.testReferenceDate ?? options.currentDate ?? options.referenceDate;
  const date = raw ? new Date(raw) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return {
    year: safeDate.getFullYear(),
    month: safeDate.getMonth() + 1,
    normalized: `${safeDate.getFullYear()}-${padMonth(safeDate.getMonth() + 1)}`,
  };
}

function monthIndex(year, month) {
  return year * 12 + (month - 1);
}

function normalizeYearOnly(value, options = {}) {
  const year = normalizeYear(value, options);
  if (!Number.isInteger(year)) return null;
  return { normalized: String(year), year };
}

function durationRangeForYearOnly(startYear, endYear) {
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || endYear < startYear) {
    return null;
  }
  return {
    min: Math.max(1, (endYear - startYear - 1) * 12 + 1),
    max: (endYear - startYear + 1) * 12,
  };
}

function durationRangeForKnownStartMonth(start, endYear) {
  if (!start || !Number.isInteger(endYear) || endYear < start.year) return null;
  const min = monthIndex(endYear, 1) - monthIndex(start.year, start.month) + 1;
  const max = monthIndex(endYear, 12) - monthIndex(start.year, start.month) + 1;
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

function durationRangeForKnownEndMonth(startYear, end) {
  if (!end || !Number.isInteger(startYear) || end.year < startYear) return null;
  const min = monthIndex(end.year, end.month) - monthIndex(startYear, 12) + 1;
  const max = monthIndex(end.year, end.month) - monthIndex(startYear, 1) + 1;
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

export function normalizeCareerMonthToken(value, options = {}) {
  const raw = safeString(value);
  if (!raw) {
    return {
      raw,
      normalized: null,
      year: null,
      month: null,
      warning: "missing_month_token",
    };
  }

  const match = raw.match(/(\d{2,4})(?:\s*년\s*|\s*[./-]\s*)(\d{1,2})/);
  if (!match) {
    return {
      raw,
      normalized: null,
      year: null,
      month: null,
      warning: "month_token_not_supported",
    };
  }

  const year = normalizeYear(match[1], options);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return {
      raw,
      normalized: null,
      year: null,
      month: null,
      warning: "invalid_month_token",
    };
  }

  return {
    raw,
    normalized: `${year}-${padMonth(month)}`,
    year,
    month,
    warning: null,
  };
}

export function calculateInclusiveMonths(start, end) {
  const startYear = Number(start?.year ?? start?.startYear);
  const startMonth = Number(start?.month ?? start?.startMonth);
  const endYear = Number(end?.year ?? end?.endYear);
  const endMonth = Number(end?.month ?? end?.endMonth);

  if (
    !Number.isInteger(startYear) ||
    !Number.isInteger(startMonth) ||
    !Number.isInteger(endYear) ||
    !Number.isInteger(endMonth) ||
    startMonth < 1 ||
    startMonth > 12 ||
    endMonth < 1 ||
    endMonth > 12
  ) {
    return null;
  }

  const startIndex = monthIndex(startYear, startMonth);
  const endIndex = monthIndex(endYear, endMonth);
  if (endIndex < startIndex) return null;
  return endIndex - startIndex + 1;
}

function extractMonthTokens(raw, options) {
  const tokens = [];
  for (const regex of [KOREAN_MONTH_TOKEN_RE, NUMERIC_MONTH_TOKEN_RE]) {
    regex.lastIndex = 0;
    for (const match of raw.matchAll(regex)) {
      const normalized = normalizeCareerMonthToken(match[0], options);
      if (!normalized.warning) {
        tokens.push({ ...normalized, index: match.index ?? 0, endIndex: (match.index ?? 0) + match[0].length });
      }
    }
  }
  return tokens.sort((a, b) => a.index - b.index);
}

function overlapsAnySpan(index, length, spans) {
  const endIndex = index + length;
  return spans.some((span) => index < span.endIndex && endIndex > span.index);
}

function extractYearTokens(raw, options, monthTokens = []) {
  const tokens = [];
  for (const match of raw.matchAll(YEAR_TOKEN_RE)) {
    const index = match.index ?? 0;
    if (overlapsAnySpan(index, match[0].length, monthTokens)) continue;
    const normalized = normalizeYearOnly(match[0], options);
    if (normalized) tokens.push({ ...normalized, raw: match[0], index });
  }
  return tokens.sort((a, b) => a.index - b.index);
}

function hasOpenEndedSeparator(raw, token) {
  if (!token?.raw) return false;
  const tokenIndex = raw.indexOf(token.raw);
  if (tokenIndex < 0) return false;
  const suffix = raw.slice(tokenIndex + token.raw.length);
  return RANGE_SEPARATOR_RE.test(suffix) && !/\d/.test(suffix);
}

function unsupportedResult(raw, warning, timelineKind = "experience") {
  return {
    raw,
    normalizedStart: null,
    normalizedEnd: null,
    startYear: null,
    startMonth: null,
    endYear: null,
    endMonth: null,
    isCurrent: false,
    datePrecision: "unsupported",
    durationMonthsInclusive: null,
    durationMonthsRange: null,
    timelineKind,
    parseWarnings: [warning],
  };
}

function yearOnlyResult(raw, years, timelineKind) {
  const start = years[0];
  const end = years[1];
  const durationMonthsRange = durationRangeForYearOnly(start.year, end.year);
  if (!durationMonthsRange) return unsupportedResult(raw, "invalid_year_range", timelineKind);

  return {
    raw,
    normalizedStart: start.normalized,
    normalizedEnd: end.normalized,
    startYear: start.year,
    startMonth: null,
    endYear: end.year,
    endMonth: null,
    isCurrent: false,
    datePrecision: "year",
    durationMonthsInclusive: null,
    durationMonthsRange,
    timelineKind,
    parseWarnings: ["month_missing"],
  };
}

function partialMonthResult(raw, monthToken, years, timelineKind) {
  const adjacentYear = years[0];
  if (!adjacentYear) return unsupportedResult(raw, "partial_month_year_missing", timelineKind);

  if (adjacentYear.index > monthToken.index) {
    return {
      raw,
      normalizedStart: monthToken.normalized,
      normalizedEnd: adjacentYear.normalized,
      startYear: monthToken.year,
      startMonth: monthToken.month,
      endYear: adjacentYear.year,
      endMonth: null,
      isCurrent: false,
      datePrecision: "partial_month",
      durationMonthsInclusive: null,
      durationMonthsRange: durationRangeForKnownStartMonth(monthToken, adjacentYear.year),
      timelineKind,
      parseWarnings: ["end_month_missing"],
    };
  }

  return {
    raw,
    normalizedStart: adjacentYear.normalized,
    normalizedEnd: monthToken.normalized,
    startYear: adjacentYear.year,
    startMonth: null,
    endYear: monthToken.year,
    endMonth: monthToken.month,
    isCurrent: false,
    datePrecision: "partial_month",
    durationMonthsInclusive: null,
    durationMonthsRange: durationRangeForKnownEndMonth(adjacentYear.year, monthToken),
    timelineKind,
    parseWarnings: ["start_month_missing"],
  };
}

function halfYearResult(raw, options, timelineKind) {
  const halfMatch = raw.match(HALF_YEAR_TOKEN_RE);
  if (!halfMatch) return null;

  const startYear = normalizeYear(halfMatch[1], options);
  const half = halfMatch[2] === "상반기" ? "H1" : "H2";
  const startMonths = half === "H1" ? { minMonth: 1, maxMonth: 6 } : { minMonth: 7, maxMonth: 12 };
  const monthTokens = extractMonthTokens(raw, options);
  const end = monthTokens.find((token) => token.index > (halfMatch.index ?? 0));
  if (!Number.isInteger(startYear) || !end) return null;

  const min = monthIndex(end.year, end.month) - monthIndex(startYear, startMonths.maxMonth) + 1;
  const max = monthIndex(end.year, end.month) - monthIndex(startYear, startMonths.minMonth) + 1;

  return {
    raw,
    normalizedStart: `${startYear}-${half}`,
    normalizedEnd: end.normalized,
    startYear,
    startMonth: null,
    endYear: end.year,
    endMonth: end.month,
    isCurrent: false,
    datePrecision: "partial_month",
    durationMonthsInclusive: null,
    durationMonthsRange: { min: Math.max(1, min), max: Math.max(1, max) },
    timelineKind,
    parseWarnings: ["start_month_imprecise"],
  };
}

export function parseCareerPeriod(value, options = {}) {
  const raw = safeString(value);
  const timelineKind = GAP_LABEL_RE.test(raw) ? "gap" : "experience";
  if (!raw) return unsupportedResult(raw, "missing_period", timelineKind);

  const halfYear = halfYearResult(raw, options, timelineKind);
  if (halfYear) return halfYear;

  const tokens = extractMonthTokens(raw, options);
  const years = extractYearTokens(raw, options, tokens);
  if (tokens.length === 0) {
    if (years.length >= 2) return yearOnlyResult(raw, years, timelineKind);
    return unsupportedResult(raw, "period_format_not_supported", timelineKind);
  }

  if (tokens.length === 1 && years.length >= 1 && !CURRENT_LABEL_RE.test(raw) && !hasOpenEndedSeparator(raw, tokens[0])) {
    return partialMonthResult(raw, tokens[0], years, timelineKind);
  }

  const start = tokens[0];
  const reference = getReferenceMonth(options);
  const currentByLabel = CURRENT_LABEL_RE.test(raw);
  const openEnded = tokens.length === 1 && hasOpenEndedSeparator(raw, start);
  const isCurrent = currentByLabel || openEnded;
  const end = isCurrent
    ? {
        normalized: reference.normalized,
        year: reference.year,
        month: reference.month,
      }
    : tokens[1];

  if (!end) {
    return unsupportedResult(raw, "end_month_missing", timelineKind);
  }

  const durationMonthsInclusive = calculateInclusiveMonths(start, end);
  const warnings = [];
  if (openEnded && !currentByLabel) warnings.push("open_ended_current_assumed");
  if (!Number.isFinite(durationMonthsInclusive)) warnings.push("end_before_start_or_invalid_range");

  return {
    raw,
    normalizedStart: start.normalized,
    normalizedEnd: end.normalized,
    startYear: start.year,
    startMonth: start.month,
    endYear: end.year,
    endMonth: end.month,
    isCurrent,
    datePrecision: "month",
    durationMonthsInclusive,
    durationMonthsRange: null,
    timelineKind,
    parseWarnings: warnings,
  };
}
