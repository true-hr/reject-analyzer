const CURRENT_LABEL_RE = /(현재\s*재직|현재|재직\s*중|재직중|present|current|now|ongoing)/i;
const GAP_LABEL_RE = /(공백|개인\s*사유|gap)/i;
const RANGE_SEPARATOR_RE = /(~|∼|–|—|부터|까지|입사|퇴사|\/|-)/;
const MONTH_TOKEN_RE = /(\d{2,4})\D{1,8}(\d{1,2})/g;
const YEAR_ONLY_RANGE_RE = /^\s*\d{2,4}\D+\d{2,4}\s*$/;

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

  const match = raw.match(/(\d{2,4})\D{1,8}(\d{1,2})/);
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

  const startIndex = startYear * 12 + (startMonth - 1);
  const endIndex = endYear * 12 + (endMonth - 1);
  if (endIndex < startIndex) return null;
  return endIndex - startIndex + 1;
}

function extractMonthTokens(raw, options) {
  const tokens = [];
  for (const match of raw.matchAll(MONTH_TOKEN_RE)) {
    const normalized = normalizeCareerMonthToken(match[0], options);
    if (!normalized.warning) tokens.push(normalized);
  }
  return tokens;
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

export function parseCareerPeriod(value, options = {}) {
  const raw = safeString(value);
  const timelineKind = GAP_LABEL_RE.test(raw) ? "gap" : "experience";
  if (!raw) return unsupportedResult(raw, "missing_period", timelineKind);

  const tokens = extractMonthTokens(raw, options);
  if (tokens.length === 0) {
    const compact = raw.replace(/\s+/g, "");
    const warning = YEAR_ONLY_RANGE_RE.test(compact)
      ? "year_precision_not_supported_yet"
      : "period_format_not_supported";
    return unsupportedResult(raw, warning, timelineKind);
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
