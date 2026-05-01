function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeToken(value) {
  return toStr(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function registerToken(index, token, entry) {
  const normalized = normalizeToken(token);
  if (!normalized) return;
  if (!index.has(normalized)) {
    index.set(normalized, entry);
  }
}

export const NEWGRAD_EXPERIENCE_ORDINAL_REGISTRY = [
  {
    kind: "outcome",
    id: "in_progress",
    label: "진행 중심",
    aliases: ["진행"],
    rank: 0,
    axisEligible: ["axis3"],
    notes: "성과/산출물보다는 진행 경험 중심",
  },
  {
    kind: "outcome",
    id: "deliverable_completed",
    label: "결과물 완성",
    aliases: ["완성"],
    rank: 1,
    axisEligible: ["axis3"],
    notes: "완성된 산출물 보유",
  },
  {
    kind: "outcome",
    id: "presented_submitted_demoed",
    label: "발표 / 제출 / 시연",
    aliases: ["발표", "제출", "시연"],
    rank: 1,
    axisEligible: ["axis3"],
    notes: "외부 제출/발표 경험",
  },
  {
    kind: "outcome",
    id: "applied_in_operation",
    label: "실제 적용 / 운영 반영",
    aliases: ["운영 반영", "실제 적용"],
    rank: 2,
    axisEligible: ["axis3"],
    notes: "현업 반영 또는 운영 경험",
  },
  {
    kind: "outcome",
    id: "awarded_selected",
    label: "수상 / 선발 / 우수성과",
    aliases: ["수상", "선발", "우수성과"],
    rank: 2,
    axisEligible: ["axis3"],
    notes: "외부 검증된 성과",
  },
  {
    kind: "duration",
    id: "under_six_months",
    label: "6개월 미만",
    aliases: ["6개월이하"],
    rank: 0,
    axisEligible: ["axis3"],
    notes: "짧은 경험 구간",
  },
  {
    kind: "duration",
    id: "six_months",
    label: "6개월",
    aliases: ["반년"],
    rank: 0,
    axisEligible: ["axis3"],
    notes: "초기 누적 구간",
  },
  {
    kind: "duration",
    id: "one_year",
    label: "1년",
    aliases: [],
    rank: 1,
    axisEligible: ["axis3"],
    notes: "장기 누적 기준선",
  },
  {
    kind: "duration",
    id: "over_one_year",
    label: "1년 이상",
    aliases: ["1년이상"],
    rank: 1,
    axisEligible: ["axis3"],
    notes: "가장 긴 실전 경험 구간",
  },
];

const ORDINAL_BY_KIND = (() => {
  const map = new Map();
  for (const entry of NEWGRAD_EXPERIENCE_ORDINAL_REGISTRY) {
    const kind = toStr(entry.kind);
    const kindMap = map.get(kind) || new Map();
    registerToken(kindMap, entry.id, entry);
    registerToken(kindMap, entry.label, entry);
    for (const alias of toArr(entry.aliases)) {
      registerToken(kindMap, alias, entry);
    }
    map.set(kind, kindMap);
  }
  return map;
})();

export function normalizeNewgradExperienceOrdinal(value, kind) {
  const rawLabel = toStr(value);
  const safeKind = toStr(kind);
  if (!rawLabel || !safeKind) return null;

  const entry = ORDINAL_BY_KIND.get(safeKind)?.get(normalizeToken(rawLabel)) || null;
  return {
    kind: safeKind,
    id: entry?.id || "",
    label: entry?.label || rawLabel,
    rawLabel,
    rank: Number(entry?.rank || 0),
    matched: Boolean(entry),
    axisEligible: toArr(entry?.axisEligible),
    notes: toStr(entry?.notes),
  };
}
