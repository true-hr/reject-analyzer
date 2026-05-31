const PASSMAP_RESUME_DRAFT_SOURCE = "passmap_resume_draft";
const PASSMAP_RESUME_DRAFT_SCHEMA_VERSION = 1;

function safeString(value) {
  return String(value ?? "").trim();
}

function safeTextList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter(Boolean);
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeProfile(value) {
  const profile = safeObject(value);
  return {
    name: safeString(profile.name),
    phone: safeString(profile.phone),
    email: safeString(profile.email),
    location: safeString(profile.location),
    portfolioUrl: safeString(profile.portfolioUrl),
  };
}

function normalizeTarget(value) {
  const target = safeObject(value);
  return {
    job: safeString(target.job),
    industry: safeString(target.industry),
  };
}

function normalizeExperienceItem(value) {
  const item = safeObject(value);
  return {
    company: safeString(item.company),
    role: safeString(item.role),
    startDate: safeString(item.startDate),
    endDate: safeString(item.endDate),
    description: safeString(item.description),
    bullets: safeTextList(item.bullets),
  };
}

function normalizeEducationItem(value) {
  const item = safeObject(value);
  return {
    school: safeString(item.school),
    major: safeString(item.major),
    startDate: safeString(item.startDate),
    endDate: safeString(item.endDate),
    description: safeString(item.description),
  };
}

function normalizeSourceTrack(value) {
  if (typeof value === "string") {
    return { track: safeString(value) };
  }
  const trackObject = safeObject(value);
  return {
    ...trackObject,
    track: safeString(trackObject.track),
  };
}

function normalizeLastInput(value) {
  return safeObject(value);
}

function normalizeResumeDraft(value) {
  const draft = safeObject(value);
  return {
    schemaVersion: PASSMAP_RESUME_DRAFT_SCHEMA_VERSION,
    source: PASSMAP_RESUME_DRAFT_SOURCE,
    exportedAt: safeString(draft.exportedAt) || new Date().toISOString(),
    profile: normalizeProfile(draft.profile),
    target: normalizeTarget(draft.target),
    summary: safeTextList(draft.summary),
    experiences: Array.isArray(draft.experiences)
      ? draft.experiences.map(normalizeExperienceItem)
      : [],
    education: Array.isArray(draft.education)
      ? draft.education.map(normalizeEducationItem)
      : [],
    skills: safeTextList(draft.skills),
    sourceTrack: normalizeSourceTrack(draft.sourceTrack),
    lastInput: normalizeLastInput(draft.lastInput),
  };
}

export function buildPassmapResumeDraft(input = {}) {
  return normalizeResumeDraft({
    ...input,
    schemaVersion: PASSMAP_RESUME_DRAFT_SCHEMA_VERSION,
    source: PASSMAP_RESUME_DRAFT_SOURCE,
    exportedAt: new Date().toISOString(),
  });
}

export function parsePassmapResumeDraftJson(jsonText) {
  try {
    const parsed = JSON.parse(String(jsonText ?? ""));
    if (parsed?.schemaVersion !== PASSMAP_RESUME_DRAFT_SCHEMA_VERSION) {
      return { ok: false, error: "invalid_schema_version" };
    }
    if (safeString(parsed?.source) !== PASSMAP_RESUME_DRAFT_SOURCE) {
      return { ok: false, error: "invalid_source" };
    }
    return { ok: true, draft: normalizeResumeDraft(parsed) };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

function buildDateRange(startDate, endDate) {
  const start = safeString(startDate);
  const end = safeString(endDate);
  if (start && end) return `${start} ~ ${end}`;
  return start || end;
}

function pushSection(lines, title, items) {
  const cleanItems = items.filter((item) => safeString(item));
  if (!cleanItems.length) return;
  lines.push(`## ${title}`);
  lines.push("");
  cleanItems.forEach((item) => lines.push(item));
  lines.push("");
}

export function buildPassmapResumeMarkdown(draftInput = {}) {
  const draft = normalizeResumeDraft(draftInput);
  const lines = [];
  const headerName = "PASSMAP 이력서 초안";

  lines.push(`# ${headerName}`);
  lines.push("");

  pushSection(lines, "기본 정보", [
    draft.profile.name ? `- 이름: ${draft.profile.name}` : "",
    draft.profile.phone ? `- 연락처: ${draft.profile.phone}` : "",
    draft.profile.email ? `- 이메일: ${draft.profile.email}` : "",
    draft.profile.location ? `- 지역: ${draft.profile.location}` : "",
    draft.profile.portfolioUrl ? `- 포트폴리오: ${draft.profile.portfolioUrl}` : "",
  ]);

  pushSection(lines, "목표", [
    draft.target.job ? `- 직무: ${draft.target.job}` : "",
    draft.target.industry ? `- 산업: ${draft.target.industry}` : "",
  ]);

  if (draft.summary.length) {
    lines.push("## 소개");
    lines.push("");
    draft.summary.forEach((item) => {
      lines.push(item);
      lines.push("");
    });
  }

  if (draft.experiences.length) {
    lines.push("## 경력");
    lines.push("");
    draft.experiences.forEach((item) => {
      const headingParts = [item.company, item.role].filter(Boolean);
      lines.push(`### ${headingParts.join(" | ") || "경력 항목"}`);
      const dateRange = buildDateRange(item.startDate, item.endDate);
      if (dateRange) lines.push(dateRange);
      if (item.description) lines.push(item.description);
      if (item.bullets.length) {
        item.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
      }
      lines.push("");
    });
  }

  if (draft.education.length) {
    lines.push("## 학력");
    lines.push("");
    draft.education.forEach((item) => {
      const headingParts = [item.school, item.major].filter(Boolean);
      lines.push(`### ${headingParts.join(" | ") || "학력 항목"}`);
      const dateRange = buildDateRange(item.startDate, item.endDate);
      if (dateRange) lines.push(dateRange);
      if (item.description) lines.push(item.description);
      lines.push("");
    });
  }

  if (draft.skills.length) {
    lines.push("## 스킬");
    lines.push("");
    draft.skills.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

export function buildResumeDraftDownloadName(extension, date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `passmap-resume-draft-${yyyy}${mm}${dd}.${extension}`;
}

export function resolveResumeDraftTrack(draft) {
  const explicitTrack = safeString(draft?.sourceTrack?.track);
  if (explicitTrack === "weekly" || explicitTrack === "project") return explicitTrack;
  const lastInputTrack = safeString(draft?.lastInput?.track);
  if (lastInputTrack === "weekly" || lastInputTrack === "project") return lastInputTrack;
  return "";
}

function safeProfileName(profile) {
  return safeString(profile?.identity?.name)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "resume-profile";
}

function normalizeExportFormat(format) {
  const value = safeString(format).toLowerCase();
  if (value === "markdown") return "md";
  if (value === "text") return "txt";
  if (value === "clipboard") return "txt";
  if (value === "pdf") return "pdf";
  if (value === "json") return "json";
  if (value === "md" || value === "txt") return value;
  return "txt";
}

export function buildResumeExportWarnings(profile = {}) {
  const quality = safeObject(profile?.quality);
  const warnings = [];
  const missingSections = Array.isArray(quality.missingSections) ? quality.missingSections : [];
  const riskyClaims = Array.isArray(quality.riskyClaims) ? quality.riskyClaims : [];
  const duplicateBullets = Array.isArray(quality.duplicateBullets) ? quality.duplicateBullets : [];
  const experiences = Array.isArray(profile?.experiences) ? profile.experiences : [];

  if (!experiences.length || missingSections.includes("experiences")) {
    warnings.push("경력 정보가 비어 있습니다.");
  }
  if (missingSections.includes("education")) {
    warnings.push("학력 정보가 비어 있습니다.");
  }
  if (Number(quality.evidenceScore || 0) < 60) {
    warnings.push("성과 문장에 수치/결과가 부족합니다.");
  }
  if (riskyClaims.length) {
    warnings.push("근거 확인이 필요한 문장이 있습니다.");
  }
  if (duplicateBullets.length) {
    warnings.push("중복 가능성이 있는 문장이 있습니다.");
  }

  return [...new Set(warnings)];
}

export function buildResumeExportFilename(profile = {}, format = "txt", date = new Date()) {
  const extension = normalizeExportFormat(format);
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${safeProfileName(profile)}-${yyyy}${mm}${dd}.${extension}`;
}

export function summarizeResumeExportReadiness(profile = {}) {
  const warnings = buildResumeExportWarnings(profile);
  const score = Math.max(0, Math.min(100, Number(profile?.quality?.completenessScore || 0)));
  const level = warnings.length === 0 && score >= 80 ? "ready" : warnings.length <= 2 ? "review" : "needs_work";
  const label = level === "ready" ? "내보내기 가능" : level === "review" ? "검수 권장" : "보강 필요";

  return {
    level,
    label,
    score,
    warnings,
  };
}

export {
  PASSMAP_RESUME_DRAFT_SCHEMA_VERSION,
  PASSMAP_RESUME_DRAFT_SOURCE,
};
