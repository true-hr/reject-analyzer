const SCHEMA_VERSION = "passmap.resumeProfile.v1";

const ALLOWED_SOURCE_TYPES = new Set([
  "imported_resume",
  "manual_edit",
  "work_record",
  "ai_inbox",
  "career_asset",
  "jd_rewrite",
  "unknown",
]);

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || null;
}

function cleanList(value) {
  const seen = new Set();
  const out = [];
  (Array.isArray(value) ? value : []).forEach((item) => {
    const text = cleanText(item);
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  });
  return out;
}

export function createStableResumeId(prefix, parts = []) {
  const raw = parts
    .map((part) => String(part || "").toLowerCase().trim())
    .filter(Boolean)
    .join("|") || `${prefix}|empty`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  return `${prefix}_${(hash >>> 0).toString(36)}`;
}

export function createResumeSource({ type, refId, label, confidence } = {}) {
  const sourceType = ALLOWED_SOURCE_TYPES.has(type) ? type : "unknown";
  const score = Number(confidence);
  return {
    type: sourceType,
    refId: cleanText(refId),
    label: cleanText(label),
    confidence: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : null,
  };
}

export function createResumeBullet({ text, source, id, strengthScore, evidenceType, ...rest } = {}) {
  const normalizedText = cleanText(text);
  return {
    id: id || createStableResumeId("bullet", [normalizedText, source?.type, source?.refId, source?.label]),
    text: normalizedText,
    source: createResumeSource(source),
    strengthScore: Number.isFinite(Number(strengthScore)) ? Number(strengthScore) : null,
    evidenceType: cleanText(evidenceType),
    ...rest,
  };
}

export function createResumeExperience(input = {}) {
  const source = createResumeSource(input.source);
  const bullets = (Array.isArray(input.bullets) ? input.bullets : [])
    .map((bullet, index) => createResumeBullet({
      ...(typeof bullet === "string" ? { text: bullet } : bullet),
      source: bullet?.source || source,
      id: bullet?.id || createStableResumeId("bullet", [input.company, input.title, index, bullet?.text || bullet]),
    }))
    .filter((bullet) => bullet.text);

  return {
    id: input.id || createStableResumeId("exp", [input.company, input.title, input.startDate, input.endDate]),
    company: cleanText(input.company),
    title: cleanText(input.title),
    startDate: cleanText(input.startDate),
    endDate: cleanText(input.endDate),
    employmentType: cleanText(input.employmentType),
    location: cleanText(input.location),
    bullets,
    source,
  };
}

export function createResumeProject(input = {}) {
  const source = createResumeSource(input.source);
  const bullets = (Array.isArray(input.bullets) ? input.bullets : [])
    .map((bullet, index) => createResumeBullet({
      ...(typeof bullet === "string" ? { text: bullet } : bullet),
      source: bullet?.source || source,
      id: bullet?.id || createStableResumeId("bullet", [input.name, index, bullet?.text || bullet]),
    }))
    .filter((bullet) => bullet.text);

  return {
    id: input.id || createStableResumeId("project", [input.name, input.role, input.startDate, input.endDate]),
    name: cleanText(input.name),
    role: cleanText(input.role),
    startDate: cleanText(input.startDate),
    endDate: cleanText(input.endDate),
    bullets,
    source,
  };
}

export function createResumeEducation(input = {}) {
  return {
    id: input.id || createStableResumeId("edu", [input.school, input.degree, input.major, input.startDate, input.endDate]),
    school: cleanText(input.school),
    degree: cleanText(input.degree),
    major: cleanText(input.major),
    startDate: cleanText(input.startDate),
    endDate: cleanText(input.endDate),
    source: createResumeSource(input.source),
  };
}

export function createResumeProfileVersion(input = {}) {
  const createdAt = cleanText(input.createdAt) || nowIso();
  return {
    id: input.id || createStableResumeId("version", [createdAt, input.label]),
    label: cleanText(input.label),
    createdAt,
    source: createResumeSource(input.source),
    notes: cleanText(input.notes),
  };
}

export function createEmptyResumeProfile() {
  const createdAt = nowIso();
  return {
    schemaVersion: SCHEMA_VERSION,
    identity: {
      name: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    },
    headline: {
      targetTitle: null,
      summary: null,
      keywords: [],
    },
    experiences: [],
    projects: [],
    education: [],
    skills: {
      technical: [],
      tools: [],
      domain: [],
      language: [],
      certificates: [],
    },
    awardsAndActivities: [],
    quality: {
      completenessScore: 0,
      evidenceScore: 0,
      atsScore: 0,
      jdFitScore: null,
      missingSections: [],
      riskyClaims: [],
      duplicateBullets: [],
    },
    versions: [],
    meta: {
      createdAt,
      updatedAt: createdAt,
      sources: [],
    },
  };
}

export function normalizeResumeProfile(input = {}) {
  const empty = createEmptyResumeProfile();
  const profile = input && typeof input === "object" ? input : {};
  const createdAt = cleanText(profile.meta?.createdAt) || empty.meta.createdAt;
  const updatedAt = cleanText(profile.meta?.updatedAt) || createdAt;

  return {
    ...empty,
    schemaVersion: SCHEMA_VERSION,
    identity: {
      name: cleanText(profile.identity?.name),
      email: cleanText(profile.identity?.email),
      phone: cleanText(profile.identity?.phone),
      location: cleanText(profile.identity?.location),
      links: cleanList(profile.identity?.links),
    },
    headline: {
      targetTitle: cleanText(profile.headline?.targetTitle),
      summary: cleanText(profile.headline?.summary),
      keywords: cleanList(profile.headline?.keywords),
    },
    experiences: (Array.isArray(profile.experiences) ? profile.experiences : []).map(createResumeExperience),
    projects: (Array.isArray(profile.projects) ? profile.projects : []).map(createResumeProject),
    education: (Array.isArray(profile.education) ? profile.education : []).map(createResumeEducation),
    skills: {
      technical: cleanList(profile.skills?.technical),
      tools: cleanList(profile.skills?.tools),
      domain: cleanList(profile.skills?.domain),
      language: cleanList(profile.skills?.language),
      certificates: cleanList(profile.skills?.certificates),
    },
    awardsAndActivities: (Array.isArray(profile.awardsAndActivities) ? profile.awardsAndActivities : [])
      .map((item, index) => createResumeBullet({
        ...(typeof item === "string" ? { text: item } : item),
        id: item?.id || createStableResumeId("activity", [index, item?.text || item]),
      }))
      .filter((item) => item.text),
    quality: {
      ...empty.quality,
      ...(profile.quality && typeof profile.quality === "object" ? profile.quality : {}),
      missingSections: cleanList(profile.quality?.missingSections),
      riskyClaims: cleanList(profile.quality?.riskyClaims),
      duplicateBullets: cleanList(profile.quality?.duplicateBullets),
      jdFitScore: profile.quality?.jdFitScore == null ? null : Number(profile.quality.jdFitScore),
    },
    versions: (Array.isArray(profile.versions) ? profile.versions : []).map(createResumeProfileVersion),
    meta: {
      ...(profile.meta && typeof profile.meta === "object" ? profile.meta : {}),
      createdAt,
      updatedAt,
      sources: (Array.isArray(profile.meta?.sources) ? profile.meta.sources : []).map(createResumeSource),
    },
  };
}

export { SCHEMA_VERSION as RESUME_PROFILE_SCHEMA_VERSION };
