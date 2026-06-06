import { detectSaraminResumeText } from "./detectSaraminResumeText.js";

const COVER_LETTER_SECTION_KEYS = new Set(["coverLetter", "motivation", "relatedExperience", "postHirePlan"]);
const EDUCATION_SECTION_KEYS = new Set(["highSchool", "university", "graduateSchool"]);
const COMPANY_SPECIFIC_PATTERN = /(귀사|지원|입사|해당\s*직무|이\s*회사|고객군|영업\s*전략)/;
const DATE_RANGE_PATTERN = /((?:19|20)\d{2}[./-]?\s*(?:0?[1-9]|1[0-2])?)\s*(?:~|-|–|—|부터|까지)\s*((?:19|20)\d{2}[./-]?\s*(?:0?[1-9]|1[0-2])?|현재|재직중)?/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+?82[-.\s]?)?0?1[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

function cleanText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function cleanLine(value) {
  return cleanText(value).replace(/\n+/g, " ").trim();
}

function getSectionRanges(detectionResult, key) {
  return detectionResult?.sections?.[key]?.ranges || [];
}

function getSectionText(detectionResult, key) {
  return getSectionRanges(detectionResult, key)
    .map((range) => cleanText(range.bodyText))
    .filter(Boolean)
    .join("\n");
}

function splitLines(text) {
  return cleanText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripLabel(line) {
  return String(line || "").replace(/^[^:：]{1,20}[:：]\s*/, "").trim();
}

function findByLabel(lines, labels) {
  for (const line of lines) {
    const compact = line.replace(/\s+/g, "");
    for (const label of labels) {
      if (compact.startsWith(label.replace(/\s+/g, ""))) {
        return stripLabel(line);
      }
    }
  }
  return "";
}

function buildIdentity(detectionResult) {
  const text = [getSectionText(detectionResult, "basicInfo"), getSectionText(detectionResult, "personalInfo")]
    .filter(Boolean)
    .join("\n");
  const lines = splitLines(text);
  const email = text.match(EMAIL_PATTERN)?.[0] || "";
  const phone = text.match(PHONE_PATTERN)?.[0] || "";

  return {
    name: findByLabel(lines, ["이름", "성명"]),
    email,
    phone,
    address: findByLabel(lines, ["주소", "거주지"]),
    confidence: lines.length > 0 ? 0.74 : 0,
    sourceSections: ["basicInfo", "personalInfo"].filter((key) => getSectionRanges(detectionResult, key).length > 0),
  };
}

function buildEducation(detectionResult) {
  return Array.from(EDUCATION_SECTION_KEYS).flatMap((key) => (
    getSectionRanges(detectionResult, key).flatMap((range) => {
      const lines = splitLines(range.bodyText);
      return lines.map((line) => ({
        level: key,
        schoolName: cleanLine(line).replace(/\s*(졸업|재학|수료|해당 없음).*$/, "").trim(),
        rawText: cleanLine(line),
        confidence: line.includes("해당 없음") ? 0.3 : 0.68,
        sourceSection: key,
      }));
    })
  )).filter((item) => item.rawText);
}

function parseExperienceHeader(line) {
  const dateMatch = line.match(DATE_RANGE_PATTERN);
  const period = dateMatch ? {
    raw: dateMatch[0],
    start: cleanLine(dateMatch[1]),
    end: cleanLine(dateMatch[2] || ""),
  } : null;
  const remainder = dateMatch ? cleanLine(line.replace(dateMatch[0], "")) : cleanLine(line);
  const parts = remainder.split(/\s{2,}|\s+-\s+|\s+\|\s+/).map((part) => part.trim()).filter(Boolean);
  const compactParts = remainder.split(/\s+/).filter(Boolean);

  return {
    companyName: parts[0] || compactParts[0] || "",
    department: "",
    title: parts[1] || compactParts.slice(1).join(" "),
    period,
    rawText: cleanLine(line),
  };
}

function isBulletLine(line) {
  return /^\s*(?:[-*•]|\d+[.)])\s+/.test(line);
}

function normalizeBullet(line) {
  return cleanLine(line).replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
}

function buildExperiences(detectionResult, warnings) {
  return getSectionRanges(detectionResult, "experience").flatMap((range) => {
    const lines = splitLines(range.bodyText);
    if (lines.length === 0) return [];
    const headerIndex = lines.findIndex((line) => DATE_RANGE_PATTERN.test(line));
    const header = parseExperienceHeader(lines[headerIndex >= 0 ? headerIndex : 0]);
    if (!header.period) warnings.push("date_parse_uncertain");
    if (!header.title) warnings.push("employment_type_uncertain");

    const bulletSourceLines = lines.filter((line, index) => index !== headerIndex && isBulletLine(line));
    const bullets = bulletSourceLines.map(normalizeBullet).filter(Boolean);
    const longNarrativeLines = lines.filter((line, index) => (
      index !== headerIndex && !isBulletLine(line) && line.length >= 60
    ));
    if (longNarrativeLines.length > 0) warnings.push("section_boundary_unclear");

    return [{
      companyName: header.companyName,
      department: header.department,
      title: header.title,
      period: header.period,
      responsibilities: bullets,
      achievements: bullets.filter((line) => /증가|개선|달성|수상|절감|매출|성과|%|\d/.test(line)),
      rawText: cleanText(range.bodyText),
      confidence: header.period ? 0.68 : 0.52,
      sourceSection: "experience",
    }];
  });
}

function buildCertificates(detectionResult) {
  return getSectionRanges(detectionResult, "certificates").flatMap((range) => (
    splitLines(range.bodyText).map((line) => ({
      name: cleanLine(line),
      rawText: cleanLine(line),
      confidence: 0.66,
      sourceSection: "certificates",
    }))
  )).filter((item) => item.name);
}

function buildAwardsAndActivities(detectionResult) {
  const sourceKeys = ["awardsLanguageEtc", "officialLanguageTest", "activitiesEducation"];
  return sourceKeys.flatMap((key) => (
    getSectionRanges(detectionResult, key).flatMap((range) => (
      splitLines(range.bodyText).map((line) => ({
        type: key,
        title: cleanLine(line),
        rawText: cleanLine(line),
        confidence: 0.58,
        sourceSection: key,
      }))
    ))
  )).filter((item) => item.title);
}

function buildSkills(text, detectionResult) {
  const skillText = [
    text,
    getSectionText(detectionResult, "awardsLanguageEtc"),
    getSectionText(detectionResult, "activitiesEducation"),
  ].join("\n");
  const skills = new Set();
  const keywordPattern = /\b(Salesforce|Excel|PowerPoint|CRM|SQL|Python|Tableau|GA4|Notion)\b/gi;
  let match;
  while ((match = keywordPattern.exec(skillText)) !== null) {
    skills.add(match[1]);
  }
  if (/커뮤니케이션|고객\s*관리|영업\s*전략/.test(skillText)) skills.add("커뮤니케이션");
  return Array.from(skills).map((name) => ({
    name,
    confidence: 0.54,
    sourceSection: "keyword_scan",
  }));
}

function buildEvidenceBankCandidate(detectionResult, warnings) {
  const evidenceItems = [];
  for (const [key, section] of Object.entries(detectionResult?.sections || {})) {
    if (!COVER_LETTER_SECTION_KEYS.has(key) || !section.detected) continue;
    for (const range of section.ranges || []) {
      const bodyText = cleanText(range.bodyText);
      if (!bodyText) continue;
      const item = {
        type: key === "coverLetter" ? "cover_letter" : key,
        prompt: cleanLine(range.heading),
        text: bodyText,
        sourceSection: key,
        riskFlags: [],
        confidence: 0.64,
      };
      if (COMPANY_SPECIFIC_PATTERN.test(bodyText)) {
        item.riskFlags.push("company_specific_content");
        warnings.push("company_specific_content");
      }
      if (bodyText.length >= 60 || key === "relatedExperience") {
        item.riskFlags.push("long_narrative_experience");
      }
      evidenceItems.push(item);
    }
  }
  return { evidenceItems };
}

function uniqueWarnings(warnings) {
  return Array.from(new Set(warnings.filter(Boolean)));
}

export function buildSaraminResumeProfileCandidate(text, detectionResult = null) {
  const rawText = cleanText(text);
  const detection = detectionResult || detectSaraminResumeText(rawText);
  const warnings = [];

  if (detection.sourcePlatform !== "saramin") warnings.push("source_platform_uncertain");
  if (detection.sourceDocumentRole === "resume_plus_cover_letter" && !detection.coverLetterSectionText) {
    warnings.push("cover_letter_mixed_with_resume");
  }

  const resumeProfileCandidate = {
    identity: buildIdentity(detection),
    education: buildEducation(detection),
    experiences: buildExperiences(detection, warnings),
    skills: buildSkills(rawText, detection),
    certificates: buildCertificates(detection),
    awardsAndActivities: buildAwardsAndActivities(detection),
  };
  const evidenceBankCandidate = buildEvidenceBankCandidate(detection, warnings);

  const mappedSectionCount = [
    resumeProfileCandidate.identity.sourceSections.length,
    resumeProfileCandidate.education.length,
    resumeProfileCandidate.experiences.length,
    resumeProfileCandidate.skills.length,
    resumeProfileCandidate.certificates.length,
    resumeProfileCandidate.awardsAndActivities.length,
    evidenceBankCandidate.evidenceItems.length,
  ].reduce((sum, count) => sum + count, 0);

  return {
    sourcePlatform: detection.sourcePlatform,
    sourceDocumentRole: detection.sourceDocumentRole,
    resumeProfileCandidate,
    evidenceBankCandidate,
    importWarnings: uniqueWarnings(warnings),
    confidence: Math.max(0, Math.min(0.98, Number(((detection.confidence || 0) * 0.7 + Math.min(mappedSectionCount, 10) * 0.025).toFixed(2)))),
  };
}

export default buildSaraminResumeProfileCandidate;
