import {
  NEWGRAD_STAKEHOLDER_TAXONOMY,
  resolveNewgradStakeholderDisplayLabel,
  resolveNewgradStakeholderKey,
} from "./newgradStakeholderTaxonomyRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

const STAKEHOLDER_COMPATIBILITY_META = Object.freeze({
  customer_user: { interactionWeight: "high", industryContextWeight: "direct", notes: "고객/사용자 직접 접점 신호" },
  candidate_applicant: { interactionWeight: "high", industryContextWeight: "direct", notes: "지원자/후보자 직접 접점 신호" },
  learner_participant: { interactionWeight: "high", industryContextWeight: "direct", notes: "학습자/참여자 직접 접점 신호" },
  public_citizen: { interactionWeight: "high", industryContextWeight: "direct", notes: "공공 이용자 접점 신호" },
  internal_team: { interactionWeight: "none", industryContextWeight: "none", notes: "기본 협업 경험은 인정하되 직접 외부 접점 신호는 아님" },
  cross_function_partner: { interactionWeight: "adjacent", industryContextWeight: "adjacent", notes: "타직무 협업 상대와의 조율 경험" },
  manager_reviewer: { interactionWeight: "adjacent", industryContextWeight: "adjacent", notes: "리더/검토자와의 피드백·조율 경험" },
  external_partner_vendor: { interactionWeight: "high", industryContextWeight: "direct", notes: "협력사/외부 파트너 직접 접점 신호" },
  field_practitioner_operator: { interactionWeight: "adjacent", industryContextWeight: "adjacent", notes: "현업 실무자/운영 담당자 접점" },
  executive_decision_maker: { interactionWeight: "high", industryContextWeight: "direct", notes: "의사결정자 접점 신호" },
  community_audience: { interactionWeight: "direct", industryContextWeight: "adjacent", notes: "행사/커뮤니티 참여자 접점" },
  mixed_stakeholders: { interactionWeight: "direct", industryContextWeight: "adjacent", notes: "복수 이해관계자 경험" },
  unknown_other: { interactionWeight: "none", industryContextWeight: "none", notes: "분류되지 않은 이해관계자" },
});

export const NEWGRAD_STAKEHOLDER_REGISTRY = Object.freeze(
  Object.entries(NEWGRAD_STAKEHOLDER_TAXONOMY).map(([id, taxonomyEntry]) => ({
    id,
    label: taxonomyEntry.displayLabel,
    aliases: taxonomyEntry.aliases || [],
    sourceFields: ["stakeholderType"],
    allowedInputGroups: ["projects", "internships", "contractExperiences"],
    interactionWeight: STAKEHOLDER_COMPATIBILITY_META[id]?.interactionWeight || "none",
    industryContextWeight: STAKEHOLDER_COMPATIBILITY_META[id]?.industryContextWeight || "none",
    axisEligible: ["axis2", "axis4"],
    notes: STAKEHOLDER_COMPATIBILITY_META[id]?.notes || "",
  }))
);

const STAKEHOLDER_BY_ID = new Map(NEWGRAD_STAKEHOLDER_REGISTRY.map((entry) => [entry.id, entry]));

function isAllowed(entry, options = {}) {
  const sourceField = toStr(options.sourceField);
  const inputGroup = toStr(options.inputGroup);
  if (sourceField && !toArr(entry.sourceFields).includes(sourceField)) return false;
  if (inputGroup && !toArr(entry.allowedInputGroups).includes(inputGroup)) return false;
  return true;
}

export function getNewgradStakeholderById(id) {
  return STAKEHOLDER_BY_ID.get(toStr(id)) || null;
}

export function normalizeNewgradStakeholder(value, options = {}) {
  const rawLabel = toStr(value);
  if (!rawLabel) return null;
  const resolvedKey = resolveNewgradStakeholderKey(rawLabel);
  const matchedEntry = STAKEHOLDER_BY_ID.get(resolvedKey) || null;
  const entry = matchedEntry && isAllowed(matchedEntry, options) ? matchedEntry : null;

  return {
    id: entry?.id || "",
    label: entry?.label || resolveNewgradStakeholderDisplayLabel(resolvedKey) || rawLabel,
    rawLabel,
    sourceField: toStr(options.sourceField),
    inputGroup: toStr(options.inputGroup),
    matched: Boolean(entry),
    interactionWeight: toStr(entry?.interactionWeight) || "none",
    industryContextWeight: toStr(entry?.industryContextWeight) || "none",
    axisEligible: toArr(entry?.axisEligible),
    notes: toStr(entry?.notes),
  };
}
