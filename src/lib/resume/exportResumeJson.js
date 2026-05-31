import { normalizeResumeProfile } from "./resumeProfileModel.js";

export function exportResumeJson(profile = {}, { pretty = true, exportedAt } = {}) {
  const backup = {
    schemaVersion: "passmap.resumeProfileBackup.v1",
    exportedAt: exportedAt || new Date().toISOString(),
    exportType: "resume_profile_backup",
    profile: normalizeResumeProfile(profile),
  };

  return JSON.stringify(backup, null, pretty ? 2 : 0);
}

export default exportResumeJson;
