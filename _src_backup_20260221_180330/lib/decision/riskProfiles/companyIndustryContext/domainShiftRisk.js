// src/lib/decision/riskProfiles/companyIndustryContext/domainShiftRisk.js
export const domainShiftRisk = {
  id: "domainShiftRisk",
  group: "domain",
  layer: "document",
  priority: 40,

  // A-stage: explanation-only (no scoring impact)
  score: () => 0,

  // A-stage: conservative trigger (avoid false positives)
  when: (ctx) => {
    try {
      const st = ctx?.state || {};

      const pick = (...keys) => {
        for (const k of keys) {
          if (k && Object.prototype.hasOwnProperty.call(st, k)) {
            const v = String(st[k] ?? "").trim();
            if (v && v !== "unknown") return v;
          }
        }
        return "";
      };

      const industryCur = pick("industryCurrent", "currentIndustry");
      const industryTgt = pick("industryTarget", "targetIndustry");

      const roleCur = pick("currentRole", "roleCurrent");
      const roleTgt = pick("roleTarget", "targetRole", "role"); // App.jsx fallback order

      const hasIndustryShift = !!(industryCur && industryTgt && industryCur !== industryTgt);

      // role distance only if both known and different
      const dist = __roleDistance(roleCur, roleTgt);
      const hasRoleShift = dist != null && dist >= 2;

      return hasIndustryShift || hasRoleShift;
    } catch {
      return false;
    }
  },

  explain: (ctx) => {
    const st = ctx?.state || {};

    const pick = (...keys) => {
      for (const k of keys) {
        if (k && Object.prototype.hasOwnProperty.call(st, k)) {
          const v = String(st[k] ?? "").trim();
          if (v && v !== "unknown") return v;
        }
      }
      return "";
    };

    const industryCur = pick("industryCurrent", "currentIndustry");
    const industryTgt = pick("industryTarget", "targetIndustry");

    const roleCur = pick("currentRole", "roleCurrent");
    const roleTgt = pick("roleTarget", "targetRole", "role");

    const reasons = [];
    reasons.push(`industryCurrent: ${industryCur || "unknown"}`);
    reasons.push(`industryTarget: ${industryTgt || "unknown"}`);
    reasons.push(`roleCurrent: ${roleCur || "unknown"}`);
    reasons.push(`roleTarget: ${roleTgt || "unknown"}`);

    const hasIndustryShift = !!(industryCur && industryTgt && industryCur !== industryTgt);
    const roleDistance = __roleDistance(roleCur, roleTgt); // 0..3 or null
    const roleDistanceScore = roleDistance === 0 ? 0 : roleDistance === 1 ? 5 : roleDistance === 2 ? 12 : roleDistance === 3 ? 25 : 0;

    // keyword overlap (mitigation) - best effort
    const overlap01 = __getKeywordOverlap01(ctx);
    const overlapAdjust = overlap01 != null ? overlap01 * 10 : 0; // 0~10 감점(설명용)

    // A-stage weight (display only, NOT used for priority/scoring)
    let w = 1.0;

    if (hasIndustryShift) {
      w += 0.15;
      reasons.push("weightUp: industry mismatch detected");
    }

    if (roleDistance != null) {
      reasons.push(`roleDistance: ${roleDistance} (0 same, 1 adjacent, 2 mid, 3 hard)`);
      if (roleDistance === 1) w += 0.05;
      if (roleDistance === 2) w += 0.10;
      if (roleDistance === 3) w += 0.15;
    }

    if (overlap01 != null) {
      // overlap이 높으면 전이 가능성 ↑ → weight 완화
      const down = Math.min(0.10, overlap01 * 0.10); // 최대 -0.10
      w -= down;
      reasons.push(`weightDown: keyword overlap ${Math.round(overlap01 * 100)}% (transferability mitigation)`);
    } else {
      reasons.push("overlap: unknown (no mitigation applied)");
    }

    // clamp (display only)
    if (w < 0.7) w = 0.7;
    if (w > 1.35) w = 1.35;

    const impactLevel = w >= 1.2 ? "높음" : w >= 0.95 ? "중간" : "낮음";

    const chips = [];
    if (hasIndustryShift) chips.push("산업 전환");
    if (roleDistance != null && roleDistance > 0) chips.push(`직무 전이:${roleDistance}`);
    if (overlap01 != null) chips.push(`키워드매칭:${Math.round(overlap01 * 100)}%`);

    const breakdownText = [
      hasIndustryShift ? "산업 mismatch: 있음" : "산업 mismatch: 없음/불명",
      roleDistance != null ? `직무 전이 난이도: ${roleDistance} (점수 ${roleDistanceScore})` : "직무 전이 난이도: 불명",
      overlap01 != null ? `키워드 매칭 완화: -${overlapAdjust.toFixed(1)}` : "키워드 매칭 완화: 미적용",
    ].join(" / ");

    const whyParts = [];
    if (hasIndustryShift) {
      whyParts.push(`산업이 ${industryCur} → ${industryTgt}로 전환됩니다.`);
    }
    if (roleDistance != null && roleDistance > 0) {
      whyParts.push(`직무 전이 난이도(distance=${roleDistance})가 감지됩니다.`);
    }
    if (!whyParts.length) {
      whyParts.push("산업/직무 전환 신호가 약하거나 정보가 부족합니다.");
    }

    return {
      title: "도메인(산업)·직무 전환 리스크",
      why: `${whyParts.join(" ")} (A단계: 전이 난이도/전이 가능성 기반 설명)`,
      fix:
        "직무/산업 전환의 ‘전이 가능성’을 증거로 보강하세요. (유사 과제/지표/도메인 키워드/프로젝트, JD 핵심 키워드 반영, 인접 직무 연결 논리, 성과 기반 스토리)",
      impactLevel,
      importanceWeight: w,
      impactReasons: reasons,
      contextSummary: breakdownText,
      contextChips: chips,
    };
  },
};

// ------------------------------
// helpers (local, safe, no external deps)
// ------------------------------
function __roleDistance(from, to) {
  const a = String(from || "").trim().toLowerCase();
  const b = String(to || "").trim().toLowerCase();
  if (!a || !b) return null;
  if (a === "unknown" || b === "unknown") return null;
  if (a === b) return 0;

  // role codes expected from App.jsx options:
  // pm, product, data, dev, design, marketing, sales, ops, hr, finance
  const key = `${a}__${b}`;
  const keyR = `${b}__${a}`;

  const map = {
    // adjacent-ish (1)
    "pm__product": 1,
    "pm__data": 1,
    "product__data": 1,
    "dev__data": 1,
    "marketing__sales": 1,
    "ops__hr": 1,
    "ops__finance": 1,

    // mid (2)
    "dev__pm": 2,
    "dev__product": 2,
    "design__pm": 2,
    "design__product": 2,
    "data__marketing": 2,
    "data__finance": 2,
    "sales__product": 2,
    "marketing__product": 2,

    // hard (3)
    "dev__sales": 3,
    "dev__marketing": 3,
    "dev__hr": 3,
    "design__sales": 3,
    "finance__design": 3,
    "hr__dev": 3,
  };

  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  if (Object.prototype.hasOwnProperty.call(map, keyR)) return map[keyR];

  // default conservative: unknown pairs -> mid(2) is risky to assume.
  // We choose null (no claim) to preserve trust.
  return null;
}

function __getKeywordOverlap01(ctx) {
  try {
    // Prefer already-computed fields if present
    const ks =
      ctx?.keywordSignals ||
      ctx?.analysis?.keywordSignals ||
      ctx?.base?.keywordSignals ||
      ctx?.result?.keywordSignals ||
      null;

    if (!ks || typeof ks !== "object") return null;

    // Common variants
    const s01 = ks?.matchScore01 ?? ks?.score01;
    if (typeof s01 === "number" && Number.isFinite(s01)) {
      if (s01 < 0) return 0;
      if (s01 > 1) return 1;
      return s01;
    }

    const s100 = ks?.matchScore100 ?? ks?.score100;
    if (typeof s100 === "number" && Number.isFinite(s100)) {
      const v = s100 / 100;
      if (v < 0) return 0;
      if (v > 1) return 1;
      return v;
    }

    // Fallback: matchedKeywords / jdKeywords ratio
    const matched = Array.isArray(ks?.matchedKeywords) ? ks.matchedKeywords.length : null;
    const jd = Array.isArray(ks?.jdKeywords) ? ks.jdKeywords.length : null;
    if (typeof matched === "number" && typeof jd === "number" && jd > 0) {
      const v = matched / jd;
      if (v < 0) return 0;
      if (v > 1) return 1;
      return v;
    }

    return null;
  } catch {
    return null;
  }
}