// src/lib/analysis/buildCareerEvidenceProfile.js
// Pure function — no side effects, no imports from decision/ or simulation/.
// Classifies careerHistorySafe[] items by employmentType/type for downstream
// interpretation enrichment. Does NOT modify scoring, risk, or UI output.

const TYPE_RANK = {
  fulltime: 3,
  contract: 2,
  freelance: 2,
  intern: 1,
  parttime: 1,
  project: 1,
  other: 0,
  unknown: 0,
};

function _monthsBetween(start, end) {
  try {
    if (!start || typeof start !== "string") return 0;
    const sm = start.match(/^(\d{4})-(\d{2})$/);
    if (!sm) return 0;
    const sy = Number(sm[1]);
    const smo = Number(sm[2]);
    if (!sy || smo < 1 || smo > 12) return 0;

    let ey, emo;
    if (!end || end === "present" || typeof end !== "string") {
      const now = new Date();
      ey = now.getFullYear();
      emo = now.getMonth() + 1;
    } else {
      const em = end.match(/^(\d{4})-(\d{2})$/);
      if (!em) return 0;
      ey = Number(em[1]);
      emo = Number(em[2]);
      if (!ey || emo < 1 || emo > 12) return 0;
    }

    const diff = (ey - sy) * 12 + (emo - smo);
    return diff < 0 ? 0 : diff;
  } catch {
    return 0;
  }
}

function _getTypeKey(item) {
  const raw = item?.employmentType || item?.type;
  if (!raw || typeof raw !== "string") return "unknown";
  const t = raw.trim().toLowerCase();
  if (!t) return "unknown";

  if (t.includes("fulltime") || t.includes("full-time") || t.includes("full time") || t.includes("정규")) return "fulltime";
  if (t.includes("contract") || t.includes("계약") || t.includes("기간제")) return "contract";
  if (t.includes("freelance") || t.includes("프리랜서") || t.includes("외주")) return "freelance";
  if (t.includes("intern") || t.includes("인턴") || t.includes("현장실습")) return "intern";
  if (t.includes("parttime") || t.includes("part-time") || t.includes("part time") || t.includes("파트타임") || t.includes("아르바이트")) return "parttime";
  if (t.includes("project") || t.includes("프로젝트") || t.includes("캡스톤") || t.includes("공모전")) return "project";
  if (t.includes("other") || t.includes("기타")) return "other";

  return "unknown";
}

export function buildCareerEvidenceProfile(careerHistorySafe, parsedResume) {
  if (!Array.isArray(careerHistorySafe) || careerHistorySafe.length === 0) return null;

  // Build enriched items with type metadata
  const enrichedItems = careerHistorySafe.map((item) => {
    const _typeKey = _getTypeKey(item);
    return {
      ...item,
      _typeKey,
      _rank: TYPE_RANK[_typeKey] ?? 0,
      _months: _monthsBetween(item.startDate, item.endDate),
    };
  });

  // Bucket by type
  const byType = {
    fulltime: [],
    contract: [],
    freelance: [],
    intern: [],
    parttime: [],
    project: [],
    other: [],
    unknown: [],
  };
  for (const item of enrichedItems) {
    const bucket = Object.prototype.hasOwnProperty.call(byType, item._typeKey)
      ? item._typeKey
      : "unknown";
    byType[bucket].push(item);
  }

  // Total months per type
  const monthsByType = {};
  for (const [k, arr] of Object.entries(byType)) {
    monthsByType[k] = arr.reduce((s, it) => s + it._months, 0);
  }

  // primaryItems: highest rank (>=1) items, sorted by duration desc, capped at 3
  const rankEligible = enrichedItems.filter((it) => it._rank >= 1);
  const maxRank = rankEligible.length > 0
    ? Math.max(...rankEligible.map((it) => it._rank))
    : 0;

  let primaryItems = [];
  let supportingItems = [];

  if (maxRank > 0) {
    const sorted = [...rankEligible].sort((a, b) => b._rank - a._rank || b._months - a._months);
    const topRankItems = sorted.filter((it) => it._rank === maxRank);
    const lowerRankItems = sorted.filter((it) => it._rank < maxRank);

    primaryItems = topRankItems.slice(0, 3);
    // Items of same maxRank beyond the cap also go to supportingItems
    const maxRankOverflow = topRankItems.slice(3);
    supportingItems = [...maxRankOverflow, ...lowerRankItems];
  }

  const unknownItems = byType.unknown;

  const totalSkillsCount = Array.isArray(parsedResume?.skills) ? parsedResume.skills.length : 0;

  const hasInternOnly =
    monthsByType.fulltime === 0 &&
    monthsByType.contract === 0 &&
    monthsByType.intern > 0;

  const hasMixedCareer =
    (monthsByType.intern + monthsByType.project + monthsByType.parttime + monthsByType.freelance) > 0 &&
    (monthsByType.fulltime + monthsByType.contract) > 0;

  const hasOnlyNonFulltimeCareer =
    monthsByType.fulltime === 0 &&
    monthsByType.contract === 0 &&
    (monthsByType.intern + monthsByType.project + monthsByType.freelance + monthsByType.parttime) > 0;

  return {
    primaryItems,
    supportingItems,
    unknownItems,
    byType,
    monthsByType,
    totalSkillsCount,
    hasInternOnly,
    hasMixedCareer,
    hasOnlyNonFulltimeCareer,
  };
}

export function buildCareerEvidenceHint(profile) {
  if (!profile || typeof profile !== "object") return null;

  const monthsByType =
    profile.monthsByType && typeof profile.monthsByType === "object"
      ? profile.monthsByType
      : {};

  const fulltimeMonths = Number(monthsByType.fulltime || 0);
  const contractMonths = Number(monthsByType.contract || 0);
  const internMonths = Number(monthsByType.intern || 0);
  const projectMonths = Number(monthsByType.project || 0);
  const freelanceMonths = Number(monthsByType.freelance || 0);
  const parttimeMonths = Number(monthsByType.parttime || 0);

  const formalMonths = fulltimeMonths + contractMonths;
  const nonFormalMonths =
    internMonths + projectMonths + freelanceMonths + parttimeMonths;

  if (profile.hasInternOnly) return "intern_only";
  if (profile.hasMixedCareer) return "mixed_career";
  if (profile.hasOnlyNonFulltimeCareer) return "non_fulltime_only";

  if (
    Array.isArray(profile.primaryItems) &&
    profile.primaryItems.length === 0
  ) {
    return "type_unknown";
  }

  if (formalMonths > 0) return "formal_career_dominant";
  if (nonFormalMonths > 0) return "non_fulltime_only";

  return "type_unknown";
}

export function buildCareerEvidenceNote(hint) {
  if (hint === "intern_only") {
    return {
      hint,
      text: "경력 항목은 확인되지만, 주요 경력이 인턴 중심이라 정규직 기준의 책임 범위와 성과를 더 분명히 보여줄 필요가 있습니다.",
    };
  }
  if (hint === "non_fulltime_only") {
    return {
      hint,
      text: "경력 항목은 확인되지만, 정규직·계약직 기준의 실무 경력으로 보기에는 제한이 있어 JD 요구 경력 조건을 보완 설명해야 합니다.",
    };
  }
  if (hint === "mixed_career") {
    return {
      hint,
      text: "정규직 경험과 인턴·프로젝트성 경험이 섞여 있으므로, 지원 직무와 직접 연결되는 정규직 업무와 성과를 앞쪽에 배치하는 것이 좋습니다.",
    };
  }
  return null;
}
