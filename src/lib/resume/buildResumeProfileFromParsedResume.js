import {
  createEmptyResumeProfile,
  createResumeBullet,
  createResumeExperience,
  createResumeProject,
  createResumeSource,
  createStableResumeId,
  normalizeResumeProfile,
} from "./resumeProfileModel.js";
import {
  classifyBulletEvidence,
  scoreBulletStrength,
  scoreResumeProfileQuality,
} from "./scoreResumeProfileQuality.js";

const TOOL_SKILL_PATTERN = /\b(Excel|PowerPoint|SQL|Python|R|JavaScript|TypeScript|React|Vue|Node|Figma|Tableau|Power BI|GA4|CRM|ERP|SAP|AWS|GCP|Azure|Notion|Jira|Git)\b/i;
const LANGUAGE_PATTERN = /\b(English|Korean|Japanese|Chinese|Spanish|French|TOEIC|TOEFL|IELTS|OPIc|JLPT|HSK)\b|영어|한국어|일본어|중국어/i;
const CERT_PATTERN = /(certificate|certification|license|licensed|기사|자격|자격증|certified|PMP|CPA|CFA|SQLD|ADsP)/i;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function textOrNull(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || null;
}

function scoreBullet(input) {
  const bullet = typeof input === "string" ? { text: input } : input;
  return {
    ...bullet,
    strengthScore: scoreBulletStrength(bullet?.text),
    evidenceType: classifyBulletEvidence(bullet?.text),
  };
}

function distributeSkills(skills) {
  const result = {
    technical: [],
    tools: [],
    domain: [],
    language: [],
    certificates: [],
  };
  asArray(skills).forEach((skill) => {
    const value = textOrNull(skill);
    if (!value) return;
    if (CERT_PATTERN.test(value)) result.certificates.push(value);
    else if (LANGUAGE_PATTERN.test(value)) result.language.push(value);
    else if (TOOL_SKILL_PATTERN.test(value)) result.tools.push(value);
    else result.technical.push(value);
  });
  return result;
}

function buildProject(project, index, source) {
  if (typeof project === "string") {
    return createResumeProject({
      id: createStableResumeId("project", [index, project]),
      name: project,
      bullets: [scoreBullet({ text: project, source })],
      source,
    });
  }
  return createResumeProject({
    id: project?.id || createStableResumeId("project", [index, project?.name || project?.title, project?.role]),
    name: project?.name || project?.title,
    role: project?.role,
    startDate: project?.start || project?.startDate,
    endDate: project?.end || project?.endDate,
    bullets: asArray(project?.bullets).map((bullet, bulletIndex) => scoreBullet({
      text: bullet?.text || bullet,
      source: bullet?.source || source,
      id: bullet?.id || createStableResumeId("bullet", ["project", index, bulletIndex, bullet?.text || bullet]),
    })),
    source: project?.source || source,
  });
}

export function buildResumeProfileFromParsedResume({
  parsedResume,
  rawText,
  importMeta,
  sourceLabel,
} = {}) {
  const parsed = parsedResume && typeof parsedResume === "object" ? parsedResume : {};
  const source = createResumeSource({
    type: "imported_resume",
    refId: importMeta?.id || importMeta?.fileId || importMeta?.refId || null,
    label: sourceLabel || importMeta?.fileName || importMeta?.label || "Imported resume",
    confidence: importMeta?.confidence,
  });
  const profile = createEmptyResumeProfile();

  profile.headline.summary = textOrNull(parsed.summary);
  profile.headline.keywords = asArray(parsed.transitionNarrative).map(textOrNull).filter(Boolean);
  profile.experiences = asArray(parsed.timeline).map((item, index) => createResumeExperience({
    id: item?.id || createStableResumeId("exp", [index, item?.company, item?.role, item?.start, item?.end]),
    company: item?.company,
    title: item?.role,
    startDate: item?.start,
    endDate: item?.end,
    employmentType: item?.type,
    bullets: asArray(item?.bullets).map((bullet, bulletIndex) => scoreBullet({
      text: bullet?.text || bullet,
      source: bullet?.source || source,
      id: bullet?.id || createStableResumeId("bullet", ["timeline", index, bulletIndex, bullet?.text || bullet]),
    })),
    source,
  }));
  profile.projects = asArray(parsed.projects).map((project, index) => buildProject(project, index, source));
  profile.skills = distributeSkills(parsed.skills);
  profile.awardsAndActivities = asArray(parsed.achievements).map((achievement, index) => createResumeBullet(scoreBullet({
    text: achievement?.text || achievement,
    source: achievement?.source || source,
    id: achievement?.id || createStableResumeId("activity", [index, achievement?.text || achievement]),
  })));
  profile.quality.riskyClaims = asArray(parsed.gaps).map(textOrNull).filter(Boolean);
  profile.meta.sources = [source];
  profile.meta.rawTextCharCount = String(rawText || "").length;
  profile.meta.importMeta = importMeta && typeof importMeta === "object" ? { ...importMeta } : {};
  profile.meta.transitionNarrative = asArray(parsed.transitionNarrative).map(textOrNull).filter(Boolean);
  profile.quality = scoreResumeProfileQuality(profile);

  return normalizeResumeProfile(profile);
}

export default buildResumeProfileFromParsedResume;
