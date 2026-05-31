export function normalizeResumeIoText(value) {
  return String(value || "").trim();
}

export function normalizeResumeIoList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  value.forEach((item) => {
    const text = normalizeResumeIoText(item);
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  });
  return out;
}

export function normalizeResumeIoTimeline(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      company: normalizeResumeIoText(item?.company),
      role: normalizeResumeIoText(item?.role),
      start: normalizeResumeIoText(item?.start || item?.startDate),
      end: normalizeResumeIoText(item?.end || item?.endDate),
      type: normalizeResumeIoText(item?.type),
      bullets: normalizeResumeIoList(item?.bullets),
    }))
    .filter((item) => item.company || item.role || item.start || item.end || item.type || item.bullets.length);
}

export function hasParsedResumeContent(parsedResume) {
  if (!parsedResume || typeof parsedResume !== "object") return false;
  return Boolean(
    normalizeResumeIoText(parsedResume.summary) ||
      normalizeResumeIoTimeline(parsedResume.timeline).length ||
      normalizeResumeIoList(parsedResume.skills).length ||
      normalizeResumeIoList(parsedResume.achievements).length ||
      normalizeResumeIoList(parsedResume.projects).length ||
      normalizeResumeIoList(parsedResume.gaps).length ||
      normalizeResumeIoList(parsedResume.transitionNarrative).length
  );
}

export function buildResumeProfileFromParsedResume(parsedResume, options = {}) {
  if (!hasParsedResumeContent(parsedResume)) return null;

  const rawText = normalizeResumeIoText(options.rawText);
  const sourceLabel = normalizeResumeIoText(options.sourceLabel) || "가져온 이력서";
  const timeline = normalizeResumeIoTimeline(parsedResume.timeline);
  const skills = normalizeResumeIoList(parsedResume.skills);
  const achievements = normalizeResumeIoList(parsedResume.achievements);
  const projects = normalizeResumeIoList(parsedResume.projects);
  const gaps = normalizeResumeIoList(parsedResume.gaps);
  const transitionNarrative = normalizeResumeIoList(parsedResume.transitionNarrative);

  return {
    sourceLabel,
    summary: normalizeResumeIoText(parsedResume.summary),
    timeline,
    skills,
    achievements,
    projects,
    gaps,
    transitionNarrative,
    rawTextCharCount: rawText.length,
  };
}
