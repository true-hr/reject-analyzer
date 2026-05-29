import { homeDashboardMock } from "./homeDashboardMock.js";

export function adaptExperienceRecordToCareerAssetSignalRecord(record) {
  return {
    id: record?.id,
    title: record?.title,
    description: record?.summary ?? record?.description,
    result: record?.reflectedSentence ?? record?.result,
    strength_tags: Array.isArray(record?.strength_tags)
      ? record.strength_tags
      : Array.isArray(record?.strengthTags) ? record.strengthTags : [],
    skill_tags: Array.isArray(record?.skill_tags)
      ? record.skill_tags
      : Array.isArray(record?.workTags) ? record.workTags : [],
    raw_payload: record?.rawPayload || record?.raw_payload,
  };
}

export const EXPERIENCE_DEMO_RECORDS = homeDashboardMock.records.map(adaptExperienceRecordToCareerAssetSignalRecord);
