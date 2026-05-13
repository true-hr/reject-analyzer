// industryExperienceTagProfileResolver.js
// Resolves flexible industry input (string, label, object) to one of the 10
// sector-level profile keys in industryExperienceTagProfileRegistry.js.
// Not wired into axis scoring yet.

import {
  INDUSTRY_EXPERIENCE_TAG_PROFILE_REGISTRY,
  getIndustryExperienceTagProfile,
  getIndustryExperienceTagProfileSummary,
} from "./industryExperienceTagProfileRegistry.js";

// ── ALIAS DICTIONARY ─────────────────────────────────────────────────────────
// Maps normalized alias strings → sector profile key.
// Normalization: lower-case, trimmed, single-spaced.

export const INDUSTRY_EXPERIENCE_TAG_PROFILE_KEY_ALIASES = Object.freeze({
  // ── Commerce / consumer / retail ──────────────────────────────────────────
  "커머스": "IND_COMMERCE_CONSUMER_RETAIL",
  "이커머스": "IND_COMMERCE_CONSUMER_RETAIL",
  "온라인 커머스": "IND_COMMERCE_CONSUMER_RETAIL",
  "리테일": "IND_COMMERCE_CONSUMER_RETAIL",
  "유통": "IND_COMMERCE_CONSUMER_RETAIL",
  "소비재": "IND_COMMERCE_CONSUMER_RETAIL",
  "화장품": "IND_COMMERCE_CONSUMER_RETAIL",
  "패션": "IND_COMMERCE_CONSUMER_RETAIL",
  "식품": "IND_COMMERCE_CONSUMER_RETAIL",
  "d2c": "IND_COMMERCE_CONSUMER_RETAIL",
  "commerce": "IND_COMMERCE_CONSUMER_RETAIL",
  "ecommerce": "IND_COMMERCE_CONSUMER_RETAIL",
  "retail": "IND_COMMERCE_CONSUMER_RETAIL",
  "consumer goods": "IND_COMMERCE_CONSUMER_RETAIL",

  // ── Finance / fintech / insurance / securities ─────────────────────────────
  "금융": "IND_FINANCE_FINTECH_INSURANCE",
  "핀테크": "IND_FINANCE_FINTECH_INSURANCE",
  "보험": "IND_FINANCE_FINTECH_INSURANCE",
  "증권": "IND_FINANCE_FINTECH_INSURANCE",
  "자산운용": "IND_FINANCE_FINTECH_INSURANCE",
  "은행": "IND_FINANCE_FINTECH_INSURANCE",
  "카드": "IND_FINANCE_FINTECH_INSURANCE",
  "결제": "IND_FINANCE_FINTECH_INSURANCE",
  "투자": "IND_FINANCE_FINTECH_INSURANCE",
  "finance": "IND_FINANCE_FINTECH_INSURANCE",
  "fintech": "IND_FINANCE_FINTECH_INSURANCE",
  "insurance": "IND_FINANCE_FINTECH_INSURANCE",
  "securities": "IND_FINANCE_FINTECH_INSURANCE",
  "banking": "IND_FINANCE_FINTECH_INSURANCE",

  // ── B2B SaaS / IT platform / enterprise software ──────────────────────────
  "saas": "IND_B2B_SAAS_IT_PLATFORM",
  "b2b saas": "IND_B2B_SAAS_IT_PLATFORM",
  "it 플랫폼": "IND_B2B_SAAS_IT_PLATFORM",
  "엔터프라이즈 소프트웨어": "IND_B2B_SAAS_IT_PLATFORM",
  "소프트웨어": "IND_B2B_SAAS_IT_PLATFORM",
  "클라우드": "IND_B2B_SAAS_IT_PLATFORM",
  "협업툴": "IND_B2B_SAAS_IT_PLATFORM",
  "업무툴": "IND_B2B_SAAS_IT_PLATFORM",
  "b2b platform": "IND_B2B_SAAS_IT_PLATFORM",
  "enterprise software": "IND_B2B_SAAS_IT_PLATFORM",
  "cloud": "IND_B2B_SAAS_IT_PLATFORM",

  // ── Healthcare / pharma / medical / bio ───────────────────────────────────
  "헬스케어": "IND_HEALTHCARE_PHARMA_BIO",
  "의료": "IND_HEALTHCARE_PHARMA_BIO",
  "병원": "IND_HEALTHCARE_PHARMA_BIO",
  "제약": "IND_HEALTHCARE_PHARMA_BIO",
  "바이오": "IND_HEALTHCARE_PHARMA_BIO",
  "의료기기": "IND_HEALTHCARE_PHARMA_BIO",
  "디지털 헬스케어": "IND_HEALTHCARE_PHARMA_BIO",
  "pharma": "IND_HEALTHCARE_PHARMA_BIO",
  "healthcare": "IND_HEALTHCARE_PHARMA_BIO",
  "medical": "IND_HEALTHCARE_PHARMA_BIO",
  "bio": "IND_HEALTHCARE_PHARMA_BIO",
  "biotech": "IND_HEALTHCARE_PHARMA_BIO",

  // ── Education / edtech / learning / coaching ───────────────────────────────
  "교육": "IND_EDUCATION_EDTECH_LEARNING",
  "에듀테크": "IND_EDUCATION_EDTECH_LEARNING",
  "학습": "IND_EDUCATION_EDTECH_LEARNING",
  "강의": "IND_EDUCATION_EDTECH_LEARNING",
  "커리어교육": "IND_EDUCATION_EDTECH_LEARNING",
  "코칭": "IND_EDUCATION_EDTECH_LEARNING",
  "부트캠프": "IND_EDUCATION_EDTECH_LEARNING",
  "edtech": "IND_EDUCATION_EDTECH_LEARNING",
  "education": "IND_EDUCATION_EDTECH_LEARNING",
  "learning": "IND_EDUCATION_EDTECH_LEARNING",
  "coaching": "IND_EDUCATION_EDTECH_LEARNING",

  // ── Manufacturing / industrial goods / materials ───────────────────────────
  "제조": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "제조업": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "산업재": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "소재": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "부품": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "장비": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "기계": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "전기전자": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "반도체": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "자동차부품": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "manufacturing": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "industrial": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "materials": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "machinery": "IND_MANUFACTURING_INDUSTRIAL_GOODS",
  "semiconductor": "IND_MANUFACTURING_INDUSTRIAL_GOODS",

  // ── Logistics / mobility / fulfillment ────────────────────────────────────
  "물류": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "운송": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "배송": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "풀필먼트": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "창고": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "모빌리티": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "라스트마일": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "logistics": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "fulfillment": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "mobility": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "delivery": "IND_LOGISTICS_MOBILITY_FULFILLMENT",
  "warehouse": "IND_LOGISTICS_MOBILITY_FULFILLMENT",

  // ── Media / content / entertainment ──────────────────────────────────────
  "미디어": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "콘텐츠": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "엔터테인먼트": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "방송": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "출판": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "광고": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "게임": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "음악": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "영상": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "media": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "content": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "entertainment": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "game": "IND_MEDIA_CONTENT_ENTERTAINMENT",
  "gaming": "IND_MEDIA_CONTENT_ENTERTAINMENT",

  // ── Public / nonprofit / government ──────────────────────────────────────
  "공공": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "정부": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "지자체": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "협회": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "비영리": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "공기업": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "공공기관": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "public": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "government": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "nonprofit": "IND_PUBLIC_NONPROFIT_GOVERNMENT",
  "association": "IND_PUBLIC_NONPROFIT_GOVERNMENT",

  // ── HR / recruitment / people service ────────────────────────────────────
  "hr": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "인사": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "채용": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "리크루팅": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "헤드헌팅": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "인사서비스": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "커리어": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "조직": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "recruitment": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "recruiting": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "people": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
  "talent": "IND_HR_RECRUITMENT_PEOPLE_SERVICE",
});

// ── NORMALIZATION ─────────────────────────────────────────────────────────────

function normalize(str) {
  return String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ── RESOLVER ──────────────────────────────────────────────────────────────────

/**
 * Resolves flexible industry input to one of the 10 sector profile keys.
 * Accepts: direct key string, alias string, or object with industry fields.
 * Returns null when no confident single match is found.
 */
export function resolveIndustryExperienceTagProfileKey(input) {
  if (!input) return null;

  // ── Object input: try each field in priority order ─────────────────────────
  if (typeof input === "object" && !Array.isArray(input)) {
    const fields = [
      input.archetypeKey,
      input.industryId,
      input.industryLabel,
      input.sector,
      input.subsector,
      input.archetypeLabel,
    ].filter(Boolean);

    for (const field of fields) {
      const resolved = resolveIndustryExperienceTagProfileKey(field);
      if (resolved) return resolved;
    }
    return null;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // ── Direct profile key match ───────────────────────────────────────────────
  if (INDUSTRY_EXPERIENCE_TAG_PROFILE_REGISTRY[raw]) return raw;

  // ── Exact normalized alias match ──────────────────────────────────────────
  const norm = normalize(raw);
  if (INDUSTRY_EXPERIENCE_TAG_PROFILE_KEY_ALIASES[norm]) {
    return INDUSTRY_EXPERIENCE_TAG_PROFILE_KEY_ALIASES[norm];
  }

  // ── Substring includes match (normalized) ─────────────────────────────────
  // Collect all matching keys to detect ambiguity.
  const matches = new Set();
  for (const [alias, key] of Object.entries(INDUSTRY_EXPERIENCE_TAG_PROFILE_KEY_ALIASES)) {
    if (norm.includes(alias) || alias.includes(norm)) {
      matches.add(key);
    }
  }

  // Return only when a single sector matches to avoid false positives.
  if (matches.size === 1) return [...matches][0];

  return null;
}

/**
 * Resolves input and returns the full industry experience tag profile object.
 * Returns null if unresolved.
 */
export function resolveIndustryExperienceTagProfile(input) {
  const key = resolveIndustryExperienceTagProfileKey(input);
  return key ? getIndustryExperienceTagProfile(key) : null;
}

/**
 * Resolves input and returns a lightweight summary with resolution metadata.
 * source values: "directKey" | "alias" | "objectField" | "unresolved"
 */
export function getResolvedIndustryExperienceTagProfileSummary(input) {
  const key = resolveIndustryExperienceTagProfileKey(input);
  if (!key) {
    return Object.freeze({ resolvedIndustryKey: null, primaryTags: [], profileBasis: null, source: "unresolved" });
  }

  const summary = getIndustryExperienceTagProfileSummary(key);
  const raw = typeof input === "string" ? input.trim() : null;

  let source;
  if (raw && INDUSTRY_EXPERIENCE_TAG_PROFILE_REGISTRY[raw]) {
    source = "directKey";
  } else if (typeof input === "object" && input !== null) {
    source = "objectField";
  } else {
    source = "alias";
  }

  return Object.freeze({
    resolvedIndustryKey: key,
    primaryTags: summary?.primaryTags ?? [],
    profileBasis: summary?.profileBasis ?? null,
    source,
  });
}
