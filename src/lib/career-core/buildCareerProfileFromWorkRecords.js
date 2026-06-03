import { buildCareerProfileFromResumeProfile } from "./buildCareerProfileFromResumeProfile.js";
import { normalizeCareerProfile } from "./careerProfileModel.js";

const ADAPTER_SCHEMA_VERSION = "passmap.workRecordsCareerProfileAdapter.v0";
const SOURCE = "work_records";
const DURATION_PRECISION = "record_based_reference";
const RECORD_DATE_WARNING = "record_date_is_not_duration";
const MISSING_DURATION_WARNING = "work_record_duration_unknown";

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && safeString(item) !== "");
  const text = safeString(value);
  return text ? [text] : [];
}

function safeRawPayload(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return safeObject(parsed);
    } catch {
      return {};
    }
  }
  return {};
}

function uniqueStrings(values, limit = 30) {
  const out = [];
  const seen = new Set();
  for (const value of values.flatMap((item) => safeArray(item))) {
    const text = safeString(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function compactTextParts(parts, limit = 1600) {
  const text = uniqueStrings(parts, 80).join(" ").trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}

function readCandidates(raw) {
  return Array.isArray(raw.acceptedCandidates) ? raw.acceptedCandidates.filter(Boolean) : [];
}

function readCandidateSkills(candidate) {
  return uniqueStrings([
    candidate?.skills,
  ], 20);
}

function readCandidateJobTags(candidate) {
  return uniqueStrings([
    candidate?.job_tags,
    candidate?.jobTags,
  ], 20);
}

function readCandidateIndustryTags(candidate) {
  return uniqueStrings([
    candidate?.industry_tags,
    candidate?.industryTags,
  ], 20);
}

function readCandidateEvidenceTexts(candidate) {
  return uniqueStrings([
    candidate?.suggestedResumeBullet,
    candidate?.result,
    candidate?.resultCandidate,
    candidate?.actions,
    candidate?.evidenceTexts,
  ], 20);
}

function evidenceTypeForCandidate(candidate) {
  const confidence = safeString(candidate?.confidenceLevel).toLowerCase();
  const potential = safeString(candidate?.resumePotential).toLowerCase();
  if (confidence === "high" || potential === "high") return "strong";
  if (confidence === "low" || potential === "low") return "weak";
  return "unknown";
}

function buildCandidateBullets(candidate, candidateIndex) {
  const texts = readCandidateEvidenceTexts(candidate);
  const tags = uniqueStrings([
    readCandidateSkills(candidate),
    readCandidateJobTags(candidate),
    readCandidateIndustryTags(candidate),
  ], 30);
  const riskHints = uniqueStrings([
    candidate?.riskNotes,
    candidate?.missingInfoQuestions,
  ], 10);

  const bullets = texts.map((text, index) => ({
    id: `candidate-${candidateIndex + 1}:bullet-${index + 1}`,
    text: compactTextParts([text, tags], 900),
    evidenceType: evidenceTypeForCandidate(candidate),
  }));

  if (bullets.length === 0 && tags.length > 0) {
    bullets.push({
      id: `candidate-${candidateIndex + 1}:tags`,
      text: tags.join(" "),
      evidenceType: "unknown",
    });
  }

  if (riskHints.length > 0) {
    bullets.push({
      id: `candidate-${candidateIndex + 1}:risk`,
      text: riskHints.join(" "),
      evidenceType: "weak",
    });
  }

  return bullets;
}

function hasMonth(value) {
  return /^\d{4}[-/.]\d{1,2}/.test(safeString(value));
}

function readExplicitStart(raw, record) {
  const value = raw.startDate ?? raw.start_date ?? record.startDate ?? record.start_date ?? null;
  return hasMonth(value) ? safeString(value).replace(/[/.]/g, "-") : "";
}

function readExplicitEnd(raw, record) {
  const value = raw.endDate ?? raw.end_date ?? record.endDate ?? record.end_date ?? null;
  return hasMonth(value) ? safeString(value).replace(/[/.]/g, "-") : "";
}

function buildExperienceFromWorkRecord(record, index, warnings) {
  const safeRecord = safeObject(record);
  const raw = safeRawPayload(safeRecord.raw_payload ?? safeRecord.rawPayload);
  const candidates = readCandidates(raw);
  const candidateSkills = candidates.flatMap(readCandidateSkills);
  const candidateJobTags = candidates.flatMap(readCandidateJobTags);
  const candidateIndustryTags = candidates.flatMap(readCandidateIndustryTags);
  const candidateTitles = candidates.map((candidate) => safeString(candidate?.title)).filter(Boolean);
  const candidateRoles = candidates.map((candidate) => safeString(candidate?.role)).filter(Boolean);
  const candidateBullets = candidates.flatMap(buildCandidateBullets);
  const experienceSignalLabels = safeArray(raw.experienceSignals)
    .flatMap((signal) => [signal?.label, signal?.evidenceText, signal?.suggestedResumeAngle]);

  const id = safeString(safeRecord.id) || `work-record-${index + 1}`;
  const recordTitle = safeString(safeRecord.title);
  const titleParts = uniqueStrings([
    recordTitle,
    safeRecord.task,
    raw.summary,
    raw.assetJobTags,
    candidateTitles,
    candidateRoles,
    candidateJobTags,
  ], 20);

  const companyParts = uniqueStrings([
    raw.sourceLabel,
    raw.sourceMode,
    candidateIndustryTags,
  ], 12);

  const recordEvidenceText = compactTextParts([
    safeRecord.description,
    safeRecord.task,
    safeRecord.result,
    raw.summary,
    raw.assetSkills,
    raw.assetJobTags,
    raw.assetCollaborationTags,
    safeRecord.strength_tags,
    safeRecord.skill_tags,
    experienceSignalLabels,
  ]);

  const bullets = [...candidateBullets];
  if (recordEvidenceText) {
    bullets.unshift({
      id: `${id}:record-summary`,
      text: recordEvidenceText,
      evidenceType: "unknown",
    });
  }

  const startDate = readExplicitStart(raw, safeRecord);
  const endDate = readExplicitEnd(raw, safeRecord);
  if (!startDate || !endDate) {
    warnings.push({
      experienceId: id,
      warning: MISSING_DURATION_WARNING,
    });
  }
  if (safeString(safeRecord.record_date)) {
    warnings.push({
      experienceId: id,
      warning: RECORD_DATE_WARNING,
      recordDate: safeString(safeRecord.record_date),
    });
  }

  return {
    id,
    company: companyParts.join(" ") || SOURCE,
    title: titleParts.join(" ") || recordTitle || "Work record",
    ...(startDate && endDate ? { startDate, endDate } : {}),
    bullets,
  };
}

function buildResumeProfileLike(workRecords, warnings) {
  const experiences = workRecords.map((record, index) =>
    buildExperienceFromWorkRecord(record, index, warnings)
  );
  const skills = {
    skills: uniqueStrings(workRecords.flatMap((record) => {
      const raw = safeRawPayload(record?.raw_payload ?? record?.rawPayload);
      const candidates = readCandidates(raw);
      return [
        record?.strength_tags,
        record?.skill_tags,
        raw.assetSkills,
        raw.assetJobTags,
        raw.assetCollaborationTags,
        candidates.flatMap(readCandidateSkills),
        candidates.flatMap(readCandidateJobTags),
        candidates.flatMap(readCandidateIndustryTags),
      ];
    }), 80),
  };

  return {
    schemaVersion: ADAPTER_SCHEMA_VERSION,
    headline: {
      summary: "Career profile derived from PASSMAP work records.",
      keywords: skills.skills,
    },
    experiences,
    skills,
  };
}

export function buildCareerProfileFromWorkRecords(workRecords, options = {}) {
  const adapterWarnings = [];
  const rows = Array.isArray(workRecords) ? workRecords.filter((item) => item && typeof item === "object") : [];
  const resumeProfileLike = buildResumeProfileLike(rows, adapterWarnings);

  const profile = buildCareerProfileFromResumeProfile(resumeProfileLike, options);
  const existingWarnings = Array.isArray(profile?.meta?.warnings) ? profile.meta.warnings : [];

  return normalizeCareerProfile({
    ...profile,
    meta: {
      ...profile.meta,
      source: SOURCE,
      adapterSchemaVersion: ADAPTER_SCHEMA_VERSION,
      adapterInputCount: rows.length,
      resumeProfileSchemaVersion: ADAPTER_SCHEMA_VERSION,
      durationPrecision: DURATION_PRECISION,
      warnings: [
        ...existingWarnings,
        ...adapterWarnings,
      ],
    },
  });
}

export default buildCareerProfileFromWorkRecords;
