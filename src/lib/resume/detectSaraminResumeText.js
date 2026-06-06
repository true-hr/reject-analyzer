const SARAMIN_ANCHORS = [
  "사람인",
  "saramin",
  "saramin.co.kr",
  "이력서",
  "기본정보",
  "인적사항",
];

const SECTION_DEFINITIONS = [
  { key: "basicInfo", label: "기본정보", aliases: ["기본정보"] },
  { key: "personalInfo", label: "인적사항", aliases: ["인적사항"] },
  { key: "highSchool", label: "고등학교", aliases: ["고등학교"] },
  { key: "university", label: "대학교", aliases: ["대학교"] },
  { key: "graduateSchool", label: "대학원", aliases: ["대학원"] },
  { key: "experience", label: "경력사항", aliases: ["경력사항", "경력"] },
  { key: "attachedCareerDescription", label: "경력기술서 첨부", aliases: ["경력기술서 첨부", "경력기술서"] },
  { key: "awardsLanguageEtc", label: "어학/자격/수상/기타", aliases: ["어학/자격/수상/기타"] },
  { key: "officialLanguageTest", label: "공인외국어시험", aliases: ["공인외국어시험", "외국어시험"] },
  { key: "certificates", label: "자격증", aliases: ["자격증"] },
  { key: "activitiesEducation", label: "경험/활동/교육", aliases: ["경험/활동/교육", "경험", "활동", "교육"] },
  { key: "coverLetter", label: "자기소개서", aliases: ["자기소개서"] },
  { key: "motivation", label: "지원동기", aliases: ["지원동기"] },
  { key: "relatedExperience", label: "관련 경험", aliases: ["관련 경험", "관련경험"] },
  { key: "postHirePlan", label: "입사 후 포부", aliases: ["입사 후 포부", "입사후포부"] },
];

const COVER_LETTER_KEYS = new Set(["coverLetter", "motivation", "relatedExperience", "postHirePlan"]);
const RESUME_SECTION_KEYS = new Set([
  "basicInfo",
  "personalInfo",
  "highSchool",
  "university",
  "graduateSchool",
  "experience",
  "attachedCareerDescription",
  "awardsLanguageEtc",
  "officialLanguageTest",
  "certificates",
  "activitiesEducation",
]);

function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizeHeading(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[:：|\-–—]+$/g, "")
    .trim();
}

function splitLines(text) {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function findSectionForLine(line) {
  const compact = normalizeHeading(line);
  if (!compact) return null;

  for (const section of SECTION_DEFINITIONS) {
    for (const alias of section.aliases) {
      const normalizedAlias = normalizeHeading(alias);
      if (compact === normalizedAlias) {
        return section;
      }
    }
  }

  for (const section of SECTION_DEFINITIONS) {
    for (const alias of section.aliases) {
      const normalizedAlias = normalizeHeading(alias);
      if (compact.startsWith(normalizedAlias)) {
        return section;
      }
    }
  }
  return null;
}

function detectSectionRanges(lines) {
  const headings = [];
  lines.forEach((line, index) => {
    const section = findSectionForLine(line);
    if (!section) return;
    headings.push({
      key: section.key,
      label: section.label,
      heading: line,
      startLine: index,
    });
  });

  return headings.map((heading, index) => {
    const nextHeading = headings[index + 1];
    const endLine = nextHeading ? nextHeading.startLine - 1 : lines.length - 1;
    const bodyLines = lines.slice(heading.startLine + 1, endLine + 1);
    return {
      ...heading,
      endLine,
      bodyLines,
      bodyText: bodyLines.join("\n"),
    };
  });
}

function buildSections(ranges) {
  const sections = {};
  for (const definition of SECTION_DEFINITIONS) {
    const matches = ranges.filter((range) => range.key === definition.key);
    sections[definition.key] = {
      key: definition.key,
      label: definition.label,
      detected: matches.length > 0,
      count: matches.length,
      ranges: matches.map(({ heading, startLine, endLine, bodyText }) => ({
        heading,
        startLine,
        endLine,
        bodyText,
      })),
    };
  }
  return sections;
}

function scoreSaraminConfidence(normalized, sections) {
  const lower = normalized.toLowerCase();
  const anchorHits = SARAMIN_ANCHORS.reduce((count, anchor) => (
    lower.includes(anchor.toLowerCase()) ? count + 1 : count
  ), 0);
  const sectionHits = Object.values(sections).filter((section) => section.detected).length;
  const resumeCoreHits = ["basicInfo", "experience", "certificates", "coverLetter"]
    .filter((key) => sections[key]?.detected).length;

  const rawScore = (anchorHits * 0.12) + (sectionHits * 0.055) + (resumeCoreHits * 0.1);
  return Math.max(0, Math.min(0.98, Number(rawScore.toFixed(2))));
}

function inferDocumentRole(sections) {
  const hasResumeSection = Object.entries(sections).some(([key, section]) => (
    RESUME_SECTION_KEYS.has(key) && section.detected
  ));
  const hasCoverLetterSection = Object.entries(sections).some(([key, section]) => (
    COVER_LETTER_KEYS.has(key) && section.detected
  ));

  if (hasResumeSection && hasCoverLetterSection) return "resume_plus_cover_letter";
  if (hasResumeSection) return "resume";
  return "unknown";
}

export function detectSaraminResumeText(text) {
  const normalized = normalizeText(text);
  const lines = splitLines(normalized);
  const ranges = detectSectionRanges(lines);
  const sections = buildSections(ranges);
  const confidence = scoreSaraminConfidence(normalized, sections);
  const sourceDocumentRole = inferDocumentRole(sections);
  const sourcePlatform = confidence >= 0.35 ? "saramin" : "unknown";

  return {
    sourcePlatform,
    sourceDocumentRole,
    textExtractable: normalized.length > 0,
    ocrRequired: false,
    confidence,
    detectedSections: Object.values(sections)
      .filter((section) => section.detected)
      .map((section) => section.key),
    sections,
    sectionOrder: ranges.map(({ key, label, heading, startLine, endLine }) => ({
      key,
      label,
      heading,
      startLine,
      endLine,
      isCoverLetterSection: COVER_LETTER_KEYS.has(key),
    })),
    experienceSectionText: sections.experience?.ranges?.map((range) => range.bodyText).join("\n\n") || "",
    coverLetterSectionText: Object.entries(sections)
      .filter(([key]) => COVER_LETTER_KEYS.has(key))
      .flatMap(([, section]) => section.ranges.map((range) => range.bodyText))
      .filter(Boolean)
      .join("\n\n"),
  };
}

export default detectSaraminResumeText;
