function __toNum(v, fb = NaN) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function __normTypeId(typeId) {
  return String(typeId || "").trim().toUpperCase();
}

function __asArray(v) {
  return Array.isArray(v) ? v : [];
}

export function getBaseBandLabel(score) {
  const p = __toNum(score, NaN);
  if (!Number.isFinite(p)) return "";
  if (p >= 90) return "상위 검토권";
  if (p >= 80) return "검토 우세권";
  if (p >= 70) return "경계 검토권";
  if (p >= 60) return "경계";
  if (p >= 45) return "위험";
  if (p >= 30) return "낮음";
  return "매우 낮음";
}

export function getModifierLabel(score) {
  const n = __toNum(score, -1);
  if (n >= 85) return "완성형";
  if (n >= 70) return "강인형";
  if (n >= 55) return "탐색형";
  if (n >= 40) return "교정비형";
  if (n >= 0) return "보강형";
  return "";
}

export function isPositiveBandLabel(band) {
  const b = String(band || "").trim();
  return b === "상위 검토권" || b === "검토 우세권";
}

export function hasImmediateCutSignal(top3) {
  return __asArray(top3).some(
    (x) => x?.gateTriggered === true || String(x?.layer || "").toLowerCase() === "gate"
  );
}

export function resolveBandLabel({
  passProbability,
  typeId,
  top3,
  fallbackBandLabel = "",
  overrideLabel = "",
} = {}) {
  const forced = String(overrideLabel || "").trim();
  if (forced) return forced;

  const p = __toNum(passProbability, NaN);
  if (!Number.isFinite(p)) return String(fallbackBandLabel || "").trim();

  const raw = getBaseBandLabel(p);
  if (!isPositiveBandLabel(raw)) return raw;

  const tid = __normTypeId(typeId);
  let capped = raw;
  if (tid === "TYPE_GATE_BLOCK") capped = "위험";
  else if (tid === "TYPE_CONDITION_CONFLICT") capped = "경계";
  else if (tid === "TYPE_SHIFT_TRIAL") capped = "경합 구간";

  if (hasImmediateCutSignal(top3)) {
    if (capped === "위험" || capped === "낮음" || capped === "매우 낮음") return capped;
    return "경합 구간";
  }
  return capped;
}

export function resolveStageLabel({ pass, userType, fallback = "탐색 구간" } = {}) {
  return String(pass?.stageLabel || userType?.stageLabel || fallback).trim();
}

export function resolveBadgeLabel({ pass, userType, fallback = "판단: 현재 구간 탐색 중" } = {}) {
  return String(
    pass?.badgeLabel || pass?.judgementLabel || userType?.badgeLabel || fallback
  ).trim();
}

export function shouldSuppressModifier({ typeId, gateTriggeredCount } = {}) {
  const tid = __normTypeId(typeId);
  if (__toNum(gateTriggeredCount, 0) > 0) return true;
  return (
    tid === "TYPE_GATE_BLOCK" ||
    tid === "TYPE_CONDITION_CONFLICT" ||
    tid === "TYPE_SHIFT_TRIAL"
  );
}

export function resolveModifier({ passProbability, typeId, gateTriggeredCount } = {}) {
  if (shouldSuppressModifier({ typeId, gateTriggeredCount })) return "";
  return getModifierLabel(passProbability);
}

export function resolveActionText({
  primaryReasonAction,
  top3,
  topSignals,
  fallback = "상위 리스크 근거를 먼저 정리하세요.",
} = {}) {
  const direct = String(primaryReasonAction || "").trim();
  if (direct) return direct;
  const hasTopRisk = __asArray(top3).length > 0 || __asArray(topSignals).length > 0;
  return hasTopRisk ? String(fallback || "").trim() : "";
}

export function shouldSuppressSubtitle({ typeId, top3 } = {}) {
  const tid = __normTypeId(typeId);
  if (tid === "TYPE_GATE_BLOCK" || tid === "TYPE_CONDITION_CONFLICT") return true;
  return hasImmediateCutSignal(top3);
}

export function resolveSubtitleText({
  typeId,
  top3,
  mappedSubtitle,
  userTypeSubtitle,
  userTypeDescription,
  neutralFallback = "강점은 있으나 상위 리스크 확인이 우선입니다.",
} = {}) {
  if (shouldSuppressSubtitle({ typeId, top3 })) {
    return String(neutralFallback || "").trim();
  }
  return String(mappedSubtitle || userTypeSubtitle || userTypeDescription || "").trim();
}

