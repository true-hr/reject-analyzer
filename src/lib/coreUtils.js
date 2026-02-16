// src/lib/coreUtils.js
// 공통 유틸(분석/상태/문자열) 전용: UI용 src/lib/utils.js(cn)와 분리해서 사용하세요.

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function normalizeScore01(x) {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, 0, 1);
}

export function scoreToLabel(n) {
  if (n <= 2) return "낮음";
  if (n === 3) return "보통";
  return "높음";
}

export function safeToString(v) {
  return (v ?? "").toString();
}

export function safeLower(v) {
  return safeToString(v).toLowerCase();
}

export function uniq(arr) {
  return Array.from(new Set(Array.isArray(arr) ? arr : []));
}

export function escapeRegExp(s) {
  return safeToString(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function clone(obj) {
  try {
    if (typeof structuredClone === "function") return structuredClone(obj);
  } catch (_) {}

  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (_) {
    // 최후: 크래시 방지 (그대로 반환)
    return obj;
  }
}
