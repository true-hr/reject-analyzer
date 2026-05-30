import { homeDashboardMock } from "./homeDashboardMock.js";

function normalizeDemoTagLabel(value) {
  const safeValue = String(value || "").trim();
  return safeValue === "문서/보고" ? "문서·보고" : safeValue;
}

export function adaptExperienceRecordToCareerAssetSignalRecord(record) {
  return {
    id: record?.id,
    title: record?.title,
    description: record?.summary ?? record?.description,
    result: record?.reflectedSentence ?? record?.result,
    strength_tags: Array.isArray(record?.strength_tags)
      ? record.strength_tags.map(normalizeDemoTagLabel).filter(Boolean)
      : Array.isArray(record?.strengthTags) ? record.strengthTags.map(normalizeDemoTagLabel).filter(Boolean) : [],
    skill_tags: Array.isArray(record?.skill_tags)
      ? record.skill_tags.map(normalizeDemoTagLabel).filter(Boolean)
      : Array.isArray(record?.workTags) ? record.workTags.map(normalizeDemoTagLabel).filter(Boolean) : [],
    raw_payload: record?.rawPayload || record?.raw_payload,
  };
}

export const EXPERIENCE_DEMO_RECORDS = homeDashboardMock.records.map(adaptExperienceRecordToCareerAssetSignalRecord);
