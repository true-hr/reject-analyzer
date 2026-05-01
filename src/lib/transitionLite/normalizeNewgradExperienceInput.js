import { normalizeNewgradExperienceRole } from "../../data/transitionLite/newgradExperienceRoleRegistry.js";
import { normalizeNewgradExperienceType } from "../../data/transitionLite/newgradExperienceTypeRegistry.js";
import { normalizeNewgradStakeholder } from "../../data/transitionLite/newgradStakeholderRegistry.js";
import { normalizeNewgradExperienceOrdinal } from "../../data/transitionLite/newgradExperienceOrdinalRegistry.js";
import { resolveNewgradStakeholderKey } from "../../data/transitionLite/newgradStakeholderTaxonomyRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function unique(items = []) {
  return [...new Set(toArr(items).map((item) => toStr(item)).filter(Boolean))];
}

function normalizeText(value) {
  return toStr(value).normalize("NFKC").toLowerCase();
}

function hasAnyKeyword(text, keywords = []) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function collectExperienceContextText(item = {}, extras = []) {
  return [
    item?.type,
    item?.role,
    item?.roleFamily,
    item?.outcomeLevel,
    item?.stakeholderType,
    item?.summary,
    item?.description,
    item?.note,
    ...toArr(extras),
  ].map((value) => toStr(value)).filter(Boolean).join(" ");
}

const AXIS4_CROSS_FUNCTION_KEYWORDS = [
  "개발", "개발자", "디자이너", "디자인", "기획", "운영", "마케터", "마케팅", "영업", "분석", "데이터", "pm", "po",
  "developer", "designer", "marketer", "sales", "analyst", "operator", "planner", "collaboration", "coordination",
  "협업", "협의", "커뮤니케이션", "조율",
];
const AXIS4_MANAGER_KEYWORDS = [
  "발표", "보고", "검토", "리뷰", "피드백", "멘토", "교수", "지도", "면접관", "심사",
  "review", "feedback", "mentor", "professor", "presentation", "report",
];
const AXIS4_CUSTOMER_KEYWORDS = [
  "사용자", "유저", "고객", "인터뷰", "테스트", "voc", "설문", "반응", "유저 리서치",
  "user", "customer", "interview", "test", "survey", "feedback",
];
const AXIS4_LEARNER_KEYWORDS = [
  "교육", "수강생", "참여자", "참가자", "워크숍", "세미나",
  "learner", "participant", "student", "workshop", "seminar",
];
const AXIS4_COMMUNITY_KEYWORDS = [
  "행사", "커뮤니티", "청중", "오디언스",
  "audience", "community", "attendee",
];
const AXIS4_PUBLIC_KEYWORDS = [
  "공공", "시민", "주민", "민원", "행정", "지자체", "구청", "시청", "공공서비스",
  "public", "citizen", "municipality", "government", "resident",
];
const AXIS4_CANDIDATE_KEYWORDS = [
  "지원자", "후보자", "채용", "면접", "서류검토",
  "candidate", "applicant", "recruiting", "interview",
];
const AXIS4_OWNER_KEYWORDS = [
  "총괄", "주도", "책임", "운영", "관리", "lead", "owner", "manage",
];
const AXIS4_DIRECT_KEYWORDS = [
  "발표", "설명", "인터뷰", "조율", "협의", "응대", "리뷰", "피드백",
  "presentation", "explain", "interview", "coordination", "review", "feedback",
];
const AXIS4_ADJACENT_KEYWORDS = [
  "협업", "공유", "전달", "collaboration", "coordination", "handoff",
];
const AXIS4_SUPPORT_KEYWORDS = [
  "참여", "보조", "지원", "assist", "support",
];

function chooseAxis4StakeholderKeys(explicitKey = "", inferredKeys = []) {
  const baseExplicitKey = resolveNewgradStakeholderKey(explicitKey);
  const explicitKeys = ["", "unknown_other"].includes(baseExplicitKey) ? [] : [baseExplicitKey];
  const safeInferredKeys = unique(
    inferredKeys
      .map((item) => resolveNewgradStakeholderKey(item))
      .filter((item) => item && item !== "unknown_other")
  );

  if (baseExplicitKey === "mixed_stakeholders") {
    if (safeInferredKeys.length >= 1) return unique([safeInferredKeys[0], "mixed_stakeholders"]).slice(0, 2);
    return ["mixed_stakeholders"];
  }

  const mergedKeys = unique([...explicitKeys, ...safeInferredKeys]);
  if (mergedKeys.length >= 3) {
    return explicitKeys.length > 0
      ? unique([explicitKeys[0], "mixed_stakeholders"]).slice(0, 2)
      : ["mixed_stakeholders"];
  }
  if (mergedKeys.length >= 1) return mergedKeys.slice(0, 2);
  return ["unknown_other"];
}

function inferProjectStakeholderKeys(row = {}) {
  const contextText = collectExperienceContextText(row, [
    row?.normalizedRoleLabel,
    row?.normalizedTypeLabel,
    row?.normalizedOutcomeLabel,
  ]);
  const inferredKeys = [];

  if (hasAnyKeyword(contextText, AXIS4_CANDIDATE_KEYWORDS)) inferredKeys.push("candidate_applicant");
  if (hasAnyKeyword(contextText, AXIS4_PUBLIC_KEYWORDS)) inferredKeys.push("public_citizen");
  if (hasAnyKeyword(contextText, AXIS4_LEARNER_KEYWORDS)) inferredKeys.push("learner_participant");
  if (hasAnyKeyword(contextText, AXIS4_COMMUNITY_KEYWORDS)) inferredKeys.push("community_audience");
  if (hasAnyKeyword(contextText, AXIS4_CUSTOMER_KEYWORDS)) inferredKeys.push("customer_user");
  if (hasAnyKeyword(contextText, AXIS4_MANAGER_KEYWORDS)) inferredKeys.push("manager_reviewer");
  if (
    hasAnyKeyword(contextText, AXIS4_CROSS_FUNCTION_KEYWORDS)
    || hasAnyKeyword(toStr(row?.normalizedTypeLabel), ["팀프로젝트", "캡스톤", "부트캠프", "해커톤"])
  ) {
    inferredKeys.push("cross_function_partner");
  }

  return chooseAxis4StakeholderKeys(row?.stakeholderType, inferredKeys);
}

function inferProjectInteractionIntensity(row = {}) {
  const contextText = collectExperienceContextText(row, [
    row?.normalizedRoleLabel,
    row?.normalizedTypeLabel,
    row?.normalizedOutcomeLabel,
  ]);
  if (hasAnyKeyword(contextText, AXIS4_OWNER_KEYWORDS)) return "owner";
  if (hasAnyKeyword(contextText, AXIS4_DIRECT_KEYWORDS) || hasAnyKeyword(toStr(row?.normalizedOutcomeLabel), ["발표", "제출", "시연"])) return "direct";
  if (hasAnyKeyword(contextText, AXIS4_ADJACENT_KEYWORDS)) return "adjacent";
  if (hasAnyKeyword(contextText, AXIS4_SUPPORT_KEYWORDS)) return "support";
  return "adjacent";
}

function remapWorkStakeholderKeys(row = {}) {
  const explicitStakeholderKey = resolveNewgradStakeholderKey(row?.canonicalStakeholderId || row?.normalizedStakeholderLabel);
  const contextText = collectExperienceContextText(row, [
    row?.normalizedTypeLabel,
    row?.normalizedStakeholderLabel,
    row?.sourceGroupLabel,
  ]);
  const inferredKeys = [];

  if (hasAnyKeyword(contextText, AXIS4_CANDIDATE_KEYWORDS)) inferredKeys.push("candidate_applicant");
  if (hasAnyKeyword(contextText, AXIS4_PUBLIC_KEYWORDS)) inferredKeys.push("public_citizen");
  if (hasAnyKeyword(contextText, AXIS4_LEARNER_KEYWORDS)) inferredKeys.push("learner_participant");
  if (hasAnyKeyword(contextText, AXIS4_COMMUNITY_KEYWORDS)) inferredKeys.push("community_audience");
  if (hasAnyKeyword(contextText, AXIS4_CUSTOMER_KEYWORDS)) inferredKeys.push("customer_user");
  if (["", "unknown_other", "mixed_stakeholders", "field_practitioner_operator", "internal_team"].includes(explicitStakeholderKey) && hasAnyKeyword(contextText, AXIS4_MANAGER_KEYWORDS)) {
    inferredKeys.push("manager_reviewer");
  }
  if (["", "unknown_other", "mixed_stakeholders", "internal_team"].includes(explicitStakeholderKey) && hasAnyKeyword(contextText, ["협업", "협의", "조율", "coordination", "collaboration", "타직무", "cross functional", "cross-function"])) {
    inferredKeys.push("cross_function_partner");
  }

  return chooseAxis4StakeholderKeys(row?.canonicalStakeholderId || row?.normalizedStakeholderLabel, inferredKeys);
}

function inferWorkInteractionIntensity(row = {}) {
  const contextText = collectExperienceContextText(row, [
    row?.normalizedTypeLabel,
    row?.normalizedStakeholderLabel,
  ]);
  if (hasAnyKeyword(contextText, AXIS4_OWNER_KEYWORDS)) return "owner";
  if (hasAnyKeyword(contextText, AXIS4_DIRECT_KEYWORDS)) return "direct";
  if (hasAnyKeyword(contextText, AXIS4_ADJACENT_KEYWORDS)) return "adjacent";
  if (hasAnyKeyword(contextText, AXIS4_SUPPORT_KEYWORDS)) return "support";
  return "";
}

function inferLooseActivityStakeholderKeys(item) {
  const contextText = collectExperienceContextText(item);
  const inferredKeys = [];

  if (hasAnyKeyword(contextText, AXIS4_CANDIDATE_KEYWORDS)) inferredKeys.push("candidate_applicant");
  if (hasAnyKeyword(contextText, AXIS4_PUBLIC_KEYWORDS)) inferredKeys.push("public_citizen");
  if (hasAnyKeyword(contextText, AXIS4_LEARNER_KEYWORDS)) inferredKeys.push("learner_participant");
  if (hasAnyKeyword(contextText, AXIS4_COMMUNITY_KEYWORDS)) inferredKeys.push("community_audience");
  if (hasAnyKeyword(contextText, AXIS4_CUSTOMER_KEYWORDS)) inferredKeys.push("customer_user");
  if (hasAnyKeyword(contextText, AXIS4_MANAGER_KEYWORDS)) inferredKeys.push("manager_reviewer");
  if (hasAnyKeyword(contextText, AXIS4_CROSS_FUNCTION_KEYWORDS)) inferredKeys.push("cross_function_partner");

  return chooseAxis4StakeholderKeys(item?.stakeholderType, inferredKeys);
}

function inferLooseActivityIntensity(item) {
  const contextText = collectExperienceContextText(item);
  if (hasAnyKeyword(contextText, AXIS4_OWNER_KEYWORDS)) return "owner";
  if (hasAnyKeyword(contextText, AXIS4_DIRECT_KEYWORDS)) return "direct";
  if (hasAnyKeyword(contextText, AXIS4_ADJACENT_KEYWORDS)) return "adjacent";
  if (hasAnyKeyword(contextText, AXIS4_SUPPORT_KEYWORDS)) return "support";
  return "support";
}

function mapStakeholderToAxis4Intensity(stakeholder = {}, sourceKind = "") {
  const key = toStr(stakeholder?.id);
  if (!key) return sourceKind === "project" ? "support" : "adjacent";
  if (["customer_user", "candidate_applicant", "learner_participant", "public_citizen", "external_partner_vendor", "executive_decision_maker"].includes(key)) {
    return "direct";
  }
  if (["cross_function_partner", "manager_reviewer", "field_practitioner_operator", "mixed_stakeholders"].includes(key)) {
    return "adjacent";
  }
  return "support";
}

function buildAxis4EvidenceItem({
  sourceType,
  stakeholderKeys = [],
  interactionIntensity = "support",
  interactionCount = 1,
  rawStakeholderLabel = "",
  confidence = "low",
  durationRank = 0,
}) {
  const normalizedStakeholderKeys = unique(
    stakeholderKeys.map((item) => resolveNewgradStakeholderKey(item)).filter(Boolean)
  );
  return {
    sourceType: toStr(sourceType) || "unknown",
    stakeholderKeys: normalizedStakeholderKeys.length > 0 ? normalizedStakeholderKeys : ["unknown_other"],
    interactionIntensity: toStr(interactionIntensity) || "support",
    interactionCount: Math.max(1, Number(interactionCount || 1)),
    rawStakeholderLabel: toStr(rawStakeholderLabel),
    confidence: toStr(confidence) || "low",
    durationRank: Math.max(0, Number(durationRank || 0)),
  };
}

function buildProjectAxis4Evidence(row = {}) {
  return buildAxis4EvidenceItem({
    sourceType: "project",
    stakeholderKeys: inferProjectStakeholderKeys(row),
    interactionIntensity: inferProjectInteractionIntensity(row),
    interactionCount: 1,
    rawStakeholderLabel: toStr(row?.stakeholderType || row?.normalizedStakeholderLabel),
    confidence: inferProjectStakeholderKeys(row).includes("unknown_other") ? "low" : "medium",
  });
}

function buildWorkAxis4Evidence(row = {}) {
  const remappedStakeholderKeys = remapWorkStakeholderKeys(row);
  const inferredIntensity = inferWorkInteractionIntensity(row);
  return buildAxis4EvidenceItem({
    sourceType:
      toStr(row?.sourceKind) === "contractExperience" ? "contract"
      : toStr(row?.sourceKind) === "partTime" ? "partTime"
      : toStr(row?.sourceKind) || "internship",
    stakeholderKeys: remappedStakeholderKeys,
    interactionIntensity: inferredIntensity || mapStakeholderToAxis4Intensity(
      { id: remappedStakeholderKeys[0] || row?.canonicalStakeholderId },
      toStr(row?.sourceKind)
    ),
    interactionCount: 1,
    rawStakeholderLabel: toStr(row?.normalizedStakeholderLabel),
    confidence: remappedStakeholderKeys.some((key) => key && key !== "unknown_other" && key !== "mixed_stakeholders") ? "high" : "medium",
    durationRank: Number(row?.durationRank || 0),
  });
}

function buildLooseActivityAxis4Evidence(item) {
  const text = typeof item === "string"
    ? item
    : Object.values(item || {})
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
      .join(" ");

  return buildAxis4EvidenceItem({
    sourceType: "extracurricular",
    stakeholderKeys: inferLooseActivityStakeholderKeys(item),
    interactionIntensity: inferLooseActivityIntensity(item),
    interactionCount: 1,
    rawStakeholderLabel: text,
    confidence: text ? "medium" : "low",
  });
}

function mergeNormalizedExperienceRows(...groups) {
  const merged = [];
  const seen = new Set();
  for (const item of groups.flatMap((group) => toArr(group))) {
    const dedupeKey = [
      toStr(item?.sourceKind),
      toStr(item?.canonicalRoleId),
      toStr(item?.canonicalTypeId),
      toStr(item?.canonicalStakeholderId),
      String(Number(item?.durationRank || 0)),
      String(Number(item?.outcomeRank || 0)),
      toStr(item?.normalizedRoleLabel),
      toStr(item?.normalizedTypeLabel),
      toStr(item?.normalizedStakeholderLabel),
      toStr(item?.normalizedDurationLabel),
      toStr(item?.normalizedOutcomeLabel),
    ].join("||");
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    merged.push(item);
  }
  return merged;
}

function normalizeProject(item, index) {
  const safeItem = item && typeof item === "object" ? item : {};
  const role = normalizeNewgradExperienceRole(safeItem.role, { sourceField: "role", inputGroup: "projects" });
  const type = normalizeNewgradExperienceType(safeItem.type, { sourceField: "type", inputGroup: "projects" });
  const stakeholder = normalizeNewgradStakeholder(safeItem.stakeholderType, { sourceField: "stakeholderType", inputGroup: "projects" });
  const outcome = normalizeNewgradExperienceOrdinal(safeItem.outcomeLevel, "outcome");

  return {
    ...safeItem,
    inputGroup: "projects",
    sourceGroupLabel: "프로젝트",
    rowIndex: index,
    sourceKind: "project",
    canonicalRoleId: toStr(role?.id),
    canonicalTypeId: toStr(type?.id),
    canonicalStakeholderId: toStr(stakeholder?.id),
    outcomeRank: Number(outcome?.rank || 0),
    durationRank: 0,
    normalizedRoleLabel: toStr(role?.label),
    normalizedTypeLabel: toStr(type?.label),
    normalizedStakeholderLabel: toStr(stakeholder?.label),
    normalizedOutcomeLabel: toStr(outcome?.label),
    normalizedDurationLabel: "",
    industrySignalLevel: toStr(type?.industrySignalLevel) || "none",
    stakeholderInteractionWeight: toStr(stakeholder?.interactionWeight) || "none",
    stakeholderIndustryContextWeight: toStr(stakeholder?.industryContextWeight) || "none",
    roleAxisEligible: toArr(role?.axisEligible),
    typeAxisEligible: toArr(type?.axisEligible),
    stakeholderAxisEligible: toArr(stakeholder?.axisEligible),
    outcomeAxisEligible: toArr(outcome?.axisEligible),
    durationAxisEligible: [],
  };
}

function normalizeWorkExperience(item, index, inputGroup, sourceKind, sourceGroupLabel) {
  const safeItem = item && typeof item === "object" ? item : {};
  const role = normalizeNewgradExperienceRole(safeItem.roleFamily, { sourceField: "roleFamily", inputGroup });
  const type = normalizeNewgradExperienceType(safeItem.type, { sourceField: "type", inputGroup });
  const stakeholder = normalizeNewgradStakeholder(safeItem.stakeholderType, { sourceField: "stakeholderType", inputGroup });
  const duration = normalizeNewgradExperienceOrdinal(safeItem.duration, "duration");

  return {
    ...safeItem,
    inputGroup,
    sourceGroupLabel,
    rowIndex: index,
    sourceKind,
    canonicalRoleId: toStr(role?.id),
    canonicalTypeId: toStr(type?.id),
    canonicalStakeholderId: toStr(stakeholder?.id),
    outcomeRank: 0,
    durationRank: Number(duration?.rank || 0),
    normalizedRoleLabel: toStr(role?.label),
    normalizedTypeLabel: toStr(type?.label),
    normalizedStakeholderLabel: toStr(stakeholder?.label),
    normalizedOutcomeLabel: "",
    normalizedDurationLabel: toStr(duration?.label),
    industrySignalLevel: toStr(type?.industrySignalLevel) || "none",
    stakeholderInteractionWeight: toStr(stakeholder?.interactionWeight) || "none",
    stakeholderIndustryContextWeight: toStr(stakeholder?.industryContextWeight) || "none",
    roleAxisEligible: toArr(role?.axisEligible),
    typeAxisEligible: toArr(type?.axisEligible),
    stakeholderAxisEligible: toArr(stakeholder?.axisEligible),
    outcomeAxisEligible: [],
    durationAxisEligible: toArr(duration?.axisEligible),
  };
}

export function normalizeNewgradExperienceInput(payload = {}) {
  const normalizedProjects = toArr(payload.projects).map((item, index) => normalizeProject(item, index));
  const normalizedInternships = toArr(payload.internships).map((item, index) =>
    normalizeWorkExperience(item, index, "internships", "internship", "인턴")
  );
  const normalizedContractExperiences = toArr(payload.contractExperiences).map((item, index) =>
    normalizeWorkExperience(item, index, "contractExperiences", "contractExperience", "계약직 / 단기 실무")
  );
  const normalizedPartTimeExperience = toArr(payload.partTimeExperience).length > 0
    ? toArr(payload.partTimeExperience).map((item, index) =>
      normalizeWorkExperience(item, index, "contractExperiences", "partTime", "아르바이트 / 단기 실무")
    )
    : normalizedContractExperiences;
  const canonicalWorkRows = mergeNormalizedExperienceRows(normalizedInternships, normalizedPartTimeExperience);
  // Summary/visibility용 병합 행이다. scorer primary source로 쓰지 않는다.
  const mergedExperienceRows = mergeNormalizedExperienceRows(normalizedProjects, canonicalWorkRows);

  // Axis2 read contract용 상위 분류. 기존 필드 호환 유지하면서 append-only 추가.
  const exploratoryExperienceRows = normalizedProjects; // 학업/탐색형: 프로젝트, 공모전, 논문, 졸업과제
  const practicalExperienceRows = canonicalWorkRows;    // 실무형: 인턴, 현장실습, 계약직, 단기 실무, 아르바이트
  const axis4InteractionEvidenceList = [
    ...normalizedProjects.map((row) => buildProjectAxis4Evidence(row)),
    ...canonicalWorkRows.map((row) => buildWorkAxis4Evidence(row)),
    ...toArr(payload.extracurriculars).map((item) => buildLooseActivityAxis4Evidence(item)),
  ];

  return {
    registryVersion: "newgradExperience.v1",
    normalizedProjects,
    normalizedInternships,
    normalizedContractExperiences,
    normalizedPartTimeExperience,
    canonicalWorkRows,
    mergedExperienceRows,
    allRows: mergedExperienceRows,
    exploratoryExperienceRows,
    practicalExperienceRows,
    axis4InteractionEvidenceList,
  };
}

export default normalizeNewgradExperienceInput;
