import { ROLE_FAMILY_MAP, DISTANCE_MATRIX, DOMAIN_OVERRIDES } from "./canonicalRoleMap.js";

function _norm(v) {
  return String(v == null ? "" : v).toLowerCase().trim();
}

// --- inferCanonicalFamily ---
// 텍스트에서 canonical family ID를 추론한다.
// primary 키워드 = 2점, secondary 키워드 = 1점 — score 합산 후 최고점 반환.
// 점수가 같으면 선언 순서 우선(earlier wins).
// 총점 0이면 "UNKNOWN" 반환.
export function inferCanonicalFamily(text) {
  const t = _norm(text);
  if (!t) return "UNKNOWN";

  let bestFamily = "UNKNOWN";
  let bestScore = 0;

  for (const [family, { primary, secondary }] of Object.entries(ROLE_FAMILY_MAP)) {
    let score = 0;
    for (const kw of primary) {
      if (t.includes(_norm(kw))) score += 2;
    }
    for (const kw of secondary) {
      if (t.includes(_norm(kw))) score += 1;
    }
    // 엄격한 strictly-greater: 동점 시 먼저 선언된 family 유지
    if (score > bestScore) {
      bestScore = score;
      bestFamily = family;
    }
  }

  return bestFamily;
}

// --- computeRoleDistance ---
// from/to canonical family + domain 기반 tier를 반환한다.
// 반환: { tier, from, to, override: boolean }
//   tier 값: "same" | "adjacent" | "transferable" | "distant" | "unknown"
//   "hard_mismatch"는 이 함수가 반환하지 않음 —
//   decision/index.js에서 evidenceRank <= 1일 때 distant를 승격한다.
export function computeRoleDistance(fromFamily, toFamily, domain) {
  const from = String(fromFamily || "UNKNOWN").toUpperCase();
  const to   = String(toFamily   || "UNKNOWN").toUpperCase();

  // UNKNOWN family는 tier 판단 불가 → fallback 경로 사용
  if (from === "UNKNOWN" || to === "UNKNOWN") {
    return { tier: "unknown", from, to, override: false };
  }

  // base tier — matrix에 없는 family 조합은 "distant" fallback
  const baseTier = DISTANCE_MATRIX[from]?.[to] ?? "distant";

  // domain override 체크
  let finalTier = baseTier;
  let override  = false;

  if (domain) {
    const domainNorm = _norm(domain);
    for (const [domainKey, overrides] of Object.entries(DOMAIN_OVERRIDES)) {
      if (domainNorm.includes(_norm(domainKey))) {
        const key = `${from}\u2192${to}`; // "FROM→TO"
        if (overrides[key]) {
          finalTier = overrides[key];
          override  = true;
          break;
        }
      }
    }
  }

  return { tier: finalTier, from, to, override };
}
