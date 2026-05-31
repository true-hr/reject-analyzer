const METRIC_PATTERN = /(\d[\d,.]*\s*(%|percent|명|건|회|개|원|만원|억원|hours?|days?|weeks?|months?|years?|users?|clients?|projects?)|\b\d+(\.\d+)?x\b)/i;
const OUTCOME_PATTERN = /(개선|감소|증가|절감|달성|향상|자동화|전환|도입|확대|성장|최적화|reduced|increased|improved|saved|achieved|launched|automated|optimized|grew|delivered|converted)/i;
const WEAK_PATTERN = /(담당|수행|관리|참여|지원|보조|진행|handled|managed|participated|supported|assisted|responsible for|worked on)/i;
const TOOL_PATTERN = /\b(SQL|Python|JavaScript|TypeScript|React|Excel|Tableau|Power BI|Figma|GA4|CRM|ERP|SAP|AWS|GCP|Azure)\b/i;

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function normalizeBullet(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function collectBullets(profile) {
  const bullets = [];
  (Array.isArray(profile?.experiences) ? profile.experiences : []).forEach((item) => {
    (Array.isArray(item?.bullets) ? item.bullets : []).forEach((bullet) => bullets.push(bullet));
  });
  (Array.isArray(profile?.projects) ? profile.projects : []).forEach((item) => {
    (Array.isArray(item?.bullets) ? item.bullets : []).forEach((bullet) => bullets.push(bullet));
  });
  (Array.isArray(profile?.awardsAndActivities) ? profile.awardsAndActivities : []).forEach((bullet) => bullets.push(bullet));
  return bullets;
}

export function scoreBulletStrength(text) {
  const value = String(text || "").trim();
  if (!value) return 0;

  let score = 35;
  if (value.length >= 45) score += 10;
  if (value.length >= 90) score += 5;
  if (METRIC_PATTERN.test(value)) score += 25;
  if (OUTCOME_PATTERN.test(value)) score += 25;
  if (TOOL_PATTERN.test(value)) score += 8;
  if (WEAK_PATTERN.test(value) && !OUTCOME_PATTERN.test(value) && !METRIC_PATTERN.test(value)) score -= 18;

  return clamp(score);
}

export function classifyBulletEvidence(text) {
  const value = String(text || "");
  const hasMetric = METRIC_PATTERN.test(value);
  const hasOutcome = OUTCOME_PATTERN.test(value);
  if (hasMetric && hasOutcome) return "metric_outcome";
  if (hasMetric) return "metric";
  if (hasOutcome) return "outcome";
  if (WEAK_PATTERN.test(value)) return "weak";
  return value.trim() ? "descriptive" : "empty";
}

function scoreCompleteness(profile) {
  const sections = [
    Boolean(profile?.identity?.name),
    Boolean(profile?.identity?.email || profile?.identity?.phone),
    Boolean(profile?.headline?.summary),
    (profile?.experiences || []).length > 0,
    (profile?.projects || []).length > 0,
    (profile?.education || []).length > 0,
    Object.values(profile?.skills || {}).some((items) => Array.isArray(items) && items.length > 0),
  ];
  return clamp((sections.filter(Boolean).length / sections.length) * 100);
}

function missingSections(profile) {
  const missing = [];
  if (!profile?.identity?.name) missing.push("identity.name");
  if (!profile?.identity?.email && !profile?.identity?.phone) missing.push("identity.contact");
  if (!profile?.headline?.summary) missing.push("headline.summary");
  if (!Array.isArray(profile?.experiences) || profile.experiences.length === 0) missing.push("experiences");
  if (!Array.isArray(profile?.projects) || profile.projects.length === 0) missing.push("projects");
  if (!Array.isArray(profile?.education) || profile.education.length === 0) missing.push("education");
  if (!Object.values(profile?.skills || {}).some((items) => Array.isArray(items) && items.length > 0)) missing.push("skills");
  return missing;
}

function duplicateBullets(bullets) {
  const seen = new Map();
  const dupes = [];
  bullets.forEach((bullet) => {
    const key = normalizeBullet(bullet?.text);
    if (!key) return;
    if (seen.has(key)) {
      dupes.push(bullet?.text || seen.get(key));
      return;
    }
    seen.set(key, bullet?.text);
  });
  return [...new Set(dupes)];
}

export function scoreResumeProfileQuality(profile = {}) {
  const bullets = collectBullets(profile);
  const scoredBullets = bullets.map((bullet) => ({
    ...bullet,
    strengthScore: scoreBulletStrength(bullet?.text),
    evidenceType: classifyBulletEvidence(bullet?.text),
  }));
  const evidenceScore = scoredBullets.length
    ? clamp(scoredBullets.reduce((sum, bullet) => sum + bullet.strengthScore, 0) / scoredBullets.length)
    : 0;
  const atsSignals = [
    Boolean(profile?.headline?.summary),
    (profile?.experiences || []).some((item) => item?.company && item?.title),
    Object.values(profile?.skills || {}).some((items) => Array.isArray(items) && items.length > 0),
    bullets.length >= 3,
    bullets.some((bullet) => METRIC_PATTERN.test(bullet?.text || "")),
  ];
  const riskyClaims = [
    ...(Array.isArray(profile?.quality?.riskyClaims) ? profile.quality.riskyClaims : []),
    ...scoredBullets.filter((bullet) => bullet.evidenceType === "weak").map((bullet) => bullet.text),
  ].filter(Boolean);

  return {
    completenessScore: scoreCompleteness(profile),
    evidenceScore,
    atsScore: clamp((atsSignals.filter(Boolean).length / atsSignals.length) * 100),
    jdFitScore: null,
    missingSections: missingSections(profile),
    riskyClaims: [...new Set(riskyClaims)],
    duplicateBullets: duplicateBullets(scoredBullets),
  };
}

export default scoreResumeProfileQuality;
