const SECTION_KEYWORDS = {
  experience: [
    "경력", "경험", "재직", "회사", "근무", "담당업무", "업무", "이직", "퇴사",
    "experience", "work experience", "employment", "career", "company", "responsibilities",
  ],
  education: [
    "학력", "교육", "대학교", "대학", "졸업", "전공", "학사", "석사", "박사",
    "education", "university", "college", "degree", "major", "bachelor", "master", "phd",
  ],
  projects: [
    "프로젝트", "과제", "런칭", "구축", "개발", "도입",
    "project", "launch", "implementation", "built", "developed",
  ],
  skills: [
    "스킬", "기술", "역량", "툴", "도구", "언어", "자격",
    "skills", "technical skills", "tools", "stack", "language", "competency",
  ],
  certificates: [
    "자격증", "인증", "면허", "수료",
    "certificate", "certification", "license", "licensed",
  ],
  awardsAndActivities: [
    "수상", "활동", "대외활동", "동아리", "봉사", "공모전",
    "award", "honor", "activity", "activities", "volunteer", "competition",
  ],
  contact: [
    "이메일", "전화", "연락처", "휴대폰", "주소", "깃허브", "포트폴리오",
    "email", "phone", "mobile", "contact", "address", "github", "portfolio", "linkedin",
  ],
  summary: [
    "요약", "소개", "자기소개", "프로필", "핵심역량", "강점",
    "summary", "profile", "objective", "about", "strengths",
  ],
};

const METRIC_PATTERN = /(\d[\d,.]*\s*(%|원|만원|억원|명|건|회|시간|일|월|년|개|배|점)|증가|감소|개선|단축|절감|달성|향상|reduced|increased|improved|saved|grew|achieved|users?|hours?|days?|months?|years?)/i;
const DATE_RANGE_PATTERN = /((19|20)\d{2}[.\-/년\s]*(0?[1-9]|1[0-2])?|((0?[1-9]|1[0-2])[.\-/]\d{4}))\s*([~\-–]|부터|to|until|현재|present)\s*((19|20)\d{2}[.\-/년\s]*(0?[1-9]|1[0-2])?|((0?[1-9]|1[0-2])[.\-/]\d{4})|현재|present)?/i;
const BULLET_PATTERN = /^\s*(?:[-*•·▪◦]|\d+[.)]|[가-힣A-Za-z][.)])\s+/;
const CONTACT_PATTERN = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|01[016789][-\s]?\d{3,4}[-\s]?\d{4}|\+?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|linkedin\.com|github\.com)/i;
const WEAK_VERB_PATTERN = /(담당|수행|관리|참여|보조|지원|진행|handled|managed|participated|supported|assisted|responsible for)/i;

function countKeywordHits(lowerText, words) {
  return words.reduce((count, word) => {
    const key = String(word || "").toLowerCase();
    return key && lowerText.includes(key) ? count + 1 : count;
  }, 0);
}

function uniqLines(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const value = String(line || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function detectResumeSections(text) {
  const raw = String(text || "");
  const lower = raw.toLowerCase();
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {};
  for (const [key, words] of Object.entries(SECTION_KEYWORDS)) {
    const keywordHits = countKeywordHits(lower, words);
    sections[key] = {
      detected: keywordHits > 0,
      keywordHits,
    };
  }

  if (!sections.contact.detected && CONTACT_PATTERN.test(raw)) {
    sections.contact = { ...sections.contact, detected: true, keywordHits: sections.contact.keywordHits + 1 };
  }

  const bulletLikeLines = uniqLines(lines.filter((line) => BULLET_PATTERN.test(line)));
  const metricLines = uniqLines(lines.filter((line) => METRIC_PATTERN.test(line)));
  const weakBulletLines = uniqLines(
    lines.filter((line) => WEAK_VERB_PATTERN.test(line) && !METRIC_PATTERN.test(line))
  );
  const dateRanges = uniqLines(lines.filter((line) => DATE_RANGE_PATTERN.test(line)));

  return {
    sections,
    dateRanges,
    bulletLikeLines,
    metricLines,
    weakBulletLines,
    counts: {
      dateRanges: dateRanges.length,
      bulletLikeLines: bulletLikeLines.length,
      metricLines: metricLines.length,
      weakBulletLines: weakBulletLines.length,
    },
  };
}

export default detectResumeSections;
