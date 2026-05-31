const STOP_WORDS = new Set([
  "and",
  "or",
  "the",
  "with",
  "for",
  "to",
  "of",
  "in",
  "on",
  "a",
  "an",
  "및",
  "또는",
  "관련",
  "업무",
  "경험",
  "역량",
  "우대",
  "필수",
  "자격",
  "요건",
]);

const MUST_PATTERNS = /(필수|자격요건|required|must|requirement|requirements)/i;
const PREFERRED_PATTERNS = /(우대|preferred|nice to have|plus|우대사항)/i;
const TOKEN_PATTERN = /[a-z0-9+#.]{2,}|[가-힣]{2,}/gi;

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function unique(values) {
  const seen = new Set();
  const out = [];
  values.forEach((value) => {
    const text = normalize(value);
    if (!text || STOP_WORDS.has(text) || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out;
}

function tokens(text) {
  return unique(String(text || "").match(TOKEN_PATTERN) || []);
}

function importantLines(jdText, pattern) {
  return String(jdText || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => pattern.test(line));
}

export function extractJdKeywords(jdText = {}) {
  const allTokens = tokens(jdText);
  const mustHaveKeywords = unique(importantLines(jdText, MUST_PATTERNS).flatMap(tokens));
  const preferredKeywords = unique(importantLines(jdText, PREFERRED_PATTERNS).flatMap(tokens));
  const jdKeywords = unique([...mustHaveKeywords, ...preferredKeywords, ...allTokens]).slice(0, 40);

  return {
    jdKeywords,
    mustHaveKeywords: mustHaveKeywords.length ? mustHaveKeywords.slice(0, 16) : jdKeywords.slice(0, 8),
    preferredKeywords: preferredKeywords.slice(0, 16),
  };
}

function collectBullets(profile) {
  const items = [];
  (Array.isArray(profile?.experiences) ? profile.experiences : []).forEach((experience) => {
    (Array.isArray(experience?.bullets) ? experience.bullets : []).forEach((bullet) => {
      items.push({
        bullet,
        experienceId: experience.id,
        experienceTitle: experience.title,
        company: experience.company,
      });
    });
  });
  return items;
}

function matchedKeywords(text, keywords) {
  const normalizedText = normalize(text);
  return keywords.filter((keyword) => normalizedText.includes(keyword));
}

function recommendationFor({ score, evidenceType, strengthScore, matches }) {
  if (matches.length && (score >= 75 || Number(strengthScore || 0) >= 80)) return "promote";
  if (!matches.length && evidenceType === "weak") return "deprioritize";
  if (matches.length) return "keep";
  return "deprioritize";
}

export function buildResumeJdFit({ profile, jdText, options = {} } = {}) {
  const { jdKeywords, mustHaveKeywords, preferredKeywords } = extractJdKeywords(jdText);
  const allKeywords = unique([...mustHaveKeywords, ...preferredKeywords, ...jdKeywords]);
  const bulletMatches = collectBullets(profile).map(({ bullet, experienceId, experienceTitle, company }) => {
    const text = String(bullet?.text || "");
    const matches = matchedKeywords(text, allKeywords);
    const mustMatches = matchedKeywords(text, mustHaveKeywords);
    const strengthScore = Number(bullet?.strengthScore || 0);
    const evidenceType = bullet?.evidenceType || "unknown";
    const score = Math.min(100, Math.round((matches.length * 18) + (mustMatches.length * 12) + (strengthScore * 0.45)));

    return {
      bulletId: bullet?.id,
      experienceId,
      experienceTitle,
      company,
      text,
      score,
      matchedKeywords: matches,
      evidenceType,
      strengthScore,
      recommendation: recommendationFor({ score, evidenceType, strengthScore, matches }),
    };
  }).sort((a, b) => b.score - a.score || String(a.bulletId).localeCompare(String(b.bulletId)));

  const matchedMust = new Set(bulletMatches.flatMap((item) => item.matchedKeywords.filter((keyword) => mustHaveKeywords.includes(keyword))));
  const profileText = normalize(JSON.stringify({
    headline: profile?.headline,
    skills: profile?.skills,
    bullets: bulletMatches.map((item) => item.text),
  }));
  const gaps = mustHaveKeywords
    .filter((keyword) => !profileText.includes(keyword))
    .map((keyword) => ({
      keyword,
      severity: options.highPriorityKeywords?.includes(keyword) ? "high" : "medium",
      message: `${keyword} 요건은 이력서 근거가 부족합니다.`,
    }));
  const promoted = bulletMatches.filter((item) => item.recommendation === "promote");
  const fitScore = Math.min(100, Math.round(
    (mustHaveKeywords.length ? (matchedMust.size / mustHaveKeywords.length) * 55 : 30) +
    Math.min(25, promoted.length * 6) +
    Math.min(20, bulletMatches.filter((item) => item.score >= 60).length * 4)
  ));

  return {
    jdKeywords,
    mustHaveKeywords,
    preferredKeywords,
    bulletMatches,
    gaps,
    summary: {
      fitScore,
      matchedMustHaveCount: matchedMust.size,
      totalMustHaveCount: mustHaveKeywords.length,
      strongBulletCount: promoted.length,
      gapCount: gaps.length,
    },
  };
}

export default buildResumeJdFit;
