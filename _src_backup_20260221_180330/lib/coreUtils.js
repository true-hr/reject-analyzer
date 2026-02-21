// src/lib/coreUtils.js
// 怨듯넻 ?좏떥(遺꾩꽍/?곹깭/臾몄옄?? ?꾩슜: UI??src/lib/utils.js(cn)? 遺꾨━?댁꽌 ?ъ슜?섏꽭??

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function normalizeScore01(x) {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, 0, 1);
}

export function scoreToLabel(n) {
  if (n <= 2) return "??쓬";
  if (n === 3) return "蹂댄넻";
  return "?믪쓬";
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
    // 理쒗썑: ?щ옒??諛⑹? (洹몃?濡?諛섑솚)
    return obj;
  }
}
