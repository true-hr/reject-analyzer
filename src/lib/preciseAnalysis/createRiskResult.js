// src/lib/preciseAnalysis/createRiskResult.js
// [PRECISE-RISK-V1] 공통 리스크 엔진 output contract helper
// 향후 모든 리스크 엔진이 이 shape를 따름

/**
 * @typedef {Object} RiskResult
 * @property {string} key
 * @property {string} title
 * @property {"fatal"|"important"|"bonus"|"composite"} category
 * @property {"critical"|"high"|"medium"|"low"|"none"} severity
 * @property {boolean} triggered
 * @property {string} summaryText
 * @property {string} detailText
 * @property {string[]} evidence
 * @property {object} raw
 */

/**
 * 공통 contract shape object 반환.
 * 필수 필드 누락 보정, evidence falsy 제거, raw 기본값 보장.
 * @param {Partial<RiskResult>} fields
 * @returns {RiskResult}
 */
export function createRiskResult({
  key,
  title,
  category,
  severity,
  triggered,
  summaryText,
  detailText,
  evidence,
  raw,
} = {}) {
  return {
    key: key ?? "",
    title: title ?? "",
    category: category ?? "important",
    severity: severity ?? "none",
    triggered: triggered ?? false,
    summaryText: summaryText ?? "",
    detailText: detailText ?? "",
    evidence: Array.isArray(evidence) ? evidence.filter(Boolean) : [],
    raw: (raw && typeof raw === "object") ? raw : {},
  };
}
