function safeStr(v) {
  return (v ?? "").toString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, lo, hi) {
  const n = safeNum(v, lo);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}

export function normalizeScoreBand(score) {
  const s = clamp(safeNum(score, 0), 0, 100);
  if (s <= 39) return "S0";
  if (s <= 54) return "S1";
  if (s <= 69) return "S2";
  if (s <= 84) return "S3";
  return "S4";
}

export function normalizeGatePresence(gatePresence, gateMax = null) {
  const raw = safeStr(gatePresence).trim().toLowerCase();
  if (raw === "none" || raw === "soft" || raw === "hard") return raw;
  const gm = safeNum(gateMax, 0);
  if (gm >= 0.82) return "hard";
  if (gm >= 0.25) return "soft";
  return "none";
}

export function normalizeEvidenceStrength(v, hasEvidence = false) {
  const raw = safeStr(v).trim().toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return hasEvidence ? "medium" : "low";
}

export function buildPolicyInput(raw = {}) {
  const score = clamp(safeNum(raw?.score, 0), 0, 100);
  const gatePresence = normalizeGatePresence(raw?.gatePresence, raw?.gateMax);
  const domainMismatch = Boolean(raw?.domainMismatch);
  const evidenceStrength = normalizeEvidenceStrength(
    raw?.evidenceStrength,
    Boolean(raw?.hasEvidence)
  );
  return {
    score,
    scoreBand: normalizeScoreBand(score),
    gatePresence,
    domainMismatch,
    evidenceStrength,
    quickNoResume: Boolean(raw?.quickNoResume),
  };
}

function isReadinessBlocked(policyInput = {}) {
  const gatePresence = safeStr(policyInput?.gatePresence).toLowerCase();
  return (
    gatePresence === "hard" ||
    Boolean(policyInput?.domainMismatch) ||
    safeStr(policyInput?.evidenceStrength).toLowerCase() === "low"
  );
}

const READINESS_PATTERNS = [
  /즉전/gi,
  /핵심형/gi,
  /핵심 역량/gi,
  /저위험/gi,
  /유력/gi,
  /무난 통과/gi,
  /즉시 투입/gi,
  /준비도가 높/gi,
];

export function sanitizeReadinessWording(policyInput = {}, text, fallback = "근거 확인형") {
  const raw = safeStr(text).trim();
  if (!raw) return fallback;
  if (!isReadinessBlocked(policyInput)) return raw;
  for (const re of READINESS_PATTERNS) {
    if (re.test(raw)) return fallback;
  }
  return raw;
}

export function resolveTypeTitle(policyInput = {}, rawTypeTitle) {
  const fallback =
    policyInput?.evidenceStrength === "low" ? "탐색형" : "근거 확인형";
  const sanitized = sanitizeReadinessWording(policyInput, rawTypeTitle, fallback);
  if (policyInput?.evidenceStrength === "low") return "탐색형";
  return sanitized || fallback;
}

function sanitizePassText(policyInput = {}, text, fallback) {
  let out = safeStr(text).trim();
  if (!out) return fallback;

  // pass-related labels must avoid direct "합격" implication.
  out = out.replace(/합격\s*유력권/g, "상위 검토 구간");
  out = out.replace(/합격/g, "검토");
  out = out.replace(/우선\s*검토권/g, "우선 검토 구간");

  const blocked = isReadinessBlocked(policyInput);
  if (blocked) {
    out = sanitizeReadinessWording(policyInput, out, fallback);
  }

  return out || fallback;
}

const JOB_HOPPING_SIGNAL_ID = "JOB_HOPPING_DENSITY";
const JOB_HOPPING_PRIMARY_LABEL = "짧은 재직 반복";
const JOB_HOPPING_FALLBACK_LABEL = "경력 이동 빈도";

export function resolveJobHoppingDisplayLabel(priority = 1) {
  return Number(priority) === 2 ? JOB_HOPPING_FALLBACK_LABEL : JOB_HOPPING_PRIMARY_LABEL;
}

function __containsJobHoppingExposure(text) {
  const t = safeStr(text);
  return t.includes(JOB_HOPPING_SIGNAL_ID) || /이직\s*밀도/.test(t);
}

export function sanitizeJobHoppingText(text, { short = false } = {}) {
  const raw = safeStr(text);
  if (!raw) return raw;
  if (!__containsJobHoppingExposure(raw)) return raw;
  const label = short ? JOB_HOPPING_PRIMARY_LABEL : JOB_HOPPING_FALLBACK_LABEL;
  return raw
    .replaceAll(JOB_HOPPING_SIGNAL_ID, JOB_HOPPING_PRIMARY_LABEL)
    .replace(/이직\s*밀도/g, label);
}

export function sanitizeRiskTitle(id, title) {
  const rid = safeStr(id).trim().toUpperCase();
  const rawTitle = safeStr(title).trim();
  if (rid === JOB_HOPPING_SIGNAL_ID || __containsJobHoppingExposure(rawTitle)) {
    return JOB_HOPPING_PRIMARY_LABEL;
  }
  return sanitizeJobHoppingText(rawTitle, { short: true });
}

export function sanitizeRiskDescription(id, text) {
  const rid = safeStr(id).trim().toUpperCase();
  const raw = safeStr(text).trim();
  if (!raw) {
    if (rid === JOB_HOPPING_SIGNAL_ID) {
      return "최근 경력에서 재직 기간이 짧은 이동이 반복된 것으로 보일 수 있습니다.";
    }
    return raw;
  }
  return sanitizeJobHoppingText(raw, { short: false });
}

export function sanitizeRiskIdForDisplay(id) {
  const rid = safeStr(id).trim().toUpperCase();
  if (rid === JOB_HOPPING_SIGNAL_ID) return JOB_HOPPING_PRIMARY_LABEL;
  return safeStr(id).trim();
}

export function resolvePassLabels(policyInput = {}, rawPassData = {}) {
  const isQuickNoResume = Boolean(policyInput?.quickNoResume || rawPassData?.preliminary);
  const sectionTag = isQuickNoResume ? "예비진단" : "검토 우선순위 지표";
  const sectionTitle = isQuickNoResume ? "공고 기준 준비도" : "현재 검토 구간";
  const metricCaption = null;
  const currentLabel = isQuickNoResume ? "현재 준비도" : "현재 검토 위치";
  const percentileCaption = isQuickNoResume ? "준비도 지표" : "상대 검토 구간";

  const gatePresence = safeStr(policyInput?.gatePresence).toLowerCase();
  const defaultBandLabel =
    gatePresence === "hard"
      ? "구조적 검토 필요 구간"
      : policyInput?.domainMismatch
        ? "도메인 전이 검토 구간"
        : policyInput?.evidenceStrength === "low"
          ? "탐색 검토 구간"
          : "검토 구간";

  const headlineFallback = isQuickNoResume ? "예비진단" : "현재 검토 해석";
  const judgementFallback = isQuickNoResume
    ? "판단: 이력서 근거 확인 전 단계"
    : "판단: 근거 확인 단계";

  return {
    sectionTag,
    sectionTitle,
    metricCaption,
    currentLabel,
    percentileCaption,
    bandLabel: sanitizePassText(policyInput, rawPassData?.bandLabel, defaultBandLabel),
    headline: sanitizePassText(policyInput, rawPassData?.headline, headlineFallback),
    judgementLabel: sanitizePassText(
      policyInput,
      rawPassData?.judgementLabel,
      judgementFallback
    ),
  };
}

export function resolveDefenseLabel(policyInput = {}, rawDefenseLabel, mappingStatus = "unknown") {
  const status = safeStr(mappingStatus).trim().toLowerCase();
  if (status === "unknown") return "방어 난이도 미확정(근거 부족)";

  const raw = safeStr(rawDefenseLabel).trim();
  if (!raw) return "방어 난이도 미확정(근거 부족)";

  const gatePresence = safeStr(policyInput?.gatePresence).toLowerCase();
  if (gatePresence === "hard") return "방어 어려움";

  if (safeStr(policyInput?.evidenceStrength).toLowerCase() === "low") {
    if (raw === "방어 쉬움") return "방어 가능(조건부)";
    if (raw === "방어 보통") return "방어 가능(조건부)";
  }

  return raw;
}
