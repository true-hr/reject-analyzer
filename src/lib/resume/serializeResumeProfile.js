import { normalizeResumeProfile, RESUME_PROFILE_SCHEMA_VERSION } from "./resumeProfileModel.js";

export function validateResumeProfileShape(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object") errors.push("profile must be an object");
  if (profile?.schemaVersion !== RESUME_PROFILE_SCHEMA_VERSION) errors.push("unsupported schemaVersion");
  if (!profile?.identity || typeof profile.identity !== "object") errors.push("identity is required");
  if (!profile?.headline || typeof profile.headline !== "object") errors.push("headline is required");
  if (!Array.isArray(profile?.experiences)) errors.push("experiences must be an array");
  if (!Array.isArray(profile?.projects)) errors.push("projects must be an array");
  if (!Array.isArray(profile?.education)) errors.push("education must be an array");
  if (!profile?.skills || typeof profile.skills !== "object") errors.push("skills is required");
  if (!profile?.quality || typeof profile.quality !== "object") errors.push("quality is required");
  if (!profile?.meta || typeof profile.meta !== "object") errors.push("meta is required");

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function serializeResumeProfile(profile) {
  const normalized = normalizeResumeProfile(profile);
  const validation = validateResumeProfileShape(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid ResumeProfile: ${validation.errors.join(", ")}`);
  }
  return JSON.stringify(normalized, null, 2);
}

export function parseResumeProfileJson(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  const normalized = normalizeResumeProfile(parsed);
  const validation = validateResumeProfileShape(normalized);
  if (!validation.ok) {
    throw new Error(`Invalid ResumeProfile JSON: ${validation.errors.join(", ")}`);
  }
  return normalized;
}

export default serializeResumeProfile;
