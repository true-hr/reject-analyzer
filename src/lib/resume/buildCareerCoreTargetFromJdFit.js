function safeString(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return safeString(value).normalize("NFKC").toLowerCase();
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function collectText({ fit, jdText, targetRole, targetCompany, targetIndustry } = {}) {
  return normalizeText([
    targetRole,
    targetIndustry,
    targetCompany,
    jdText,
    ...(Array.isArray(fit?.jdKeywords) ? fit.jdKeywords : []),
    ...(Array.isArray(fit?.mustHaveKeywords) ? fit.mustHaveKeywords : []),
    ...(Array.isArray(fit?.preferredKeywords) ? fit.preferredKeywords : []),
  ].filter(Boolean).join(" "));
}

function hasProductionQualitySignal(text) {
  return matchesAny(text, [
    /\bgmp\b/,
    /\bproduction\b/,
    /\bmanufactur(?:e|ing)\b/,
    /\bprocess control\b/,
    /\bbatch records?\b/,
    /\bdeviation(?:s)?\b/,
    /\bcapa\b/,
    /\binspection\b/,
    /\bvalidation\b/,
    /\bqc\b/,
    /\bqa\b/,
    /\bquality control\b/,
    /품질관리/,
    /제조품질/,
    /생산품질/,
    /공정품질/,
    /제조기록서/,
    /일탈/,
    /실사/,
    /밸리데이션/,
    /바이오 의약품/,
    /의약품 생산/,
    /생산/,
    /제조/,
  ]);
}

function inferRoleFamily(text) {
  if (hasProductionQualitySignal(text)) {
    return "production_quality";
  }
  if (includesAny(text, ["pm", "product manager", "service planning", "product owner", "roadmap", "requirements", "서비스기획", "프로덕트", "요구사항", "기획"])) {
    return "product_planning_pm";
  }
  if (includesAny(text, ["operations", "operation", "sop", "process", "운영", "프로세스"])) {
    return "operations";
  }
  if (includesAny(text, ["marketing", "crm", "campaign", "content", "마케팅", "콘텐츠"])) {
    return "marketing_growth";
  }
  if (includesAny(text, ["data", "sql", "dashboard", "analysis", "analytics", "report", "데이터", "분석"])) {
    return "data_analytics";
  }
  return "";
}

function inferIndustryDomain(text) {
  if (includesAny(text, ["saas", "platform", "b2b", "플랫폼"])) {
    return "b2b_saas";
  }
  if (includesAny(text, ["bio", "pharma", "gmp", "바이오", "제약", "의약품"])) {
    return "bio_pharma";
  }
  if (includesAny(text, ["cosmetics", "beauty", "화장품", "뷰티"])) {
    return "beauty_cosmetics";
  }
  if (includesAny(text, ["career", "recruiting", "resume", "interview", "커리어", "채용", "이력서", "면접"])) {
    return "career_education";
  }
  return "";
}

export function buildCareerCoreTargetFromJdFit({
  fit,
  jdText,
  targetRole,
  targetCompany,
  targetIndustry,
} = {}) {
  const text = collectText({ fit, jdText, targetRole, targetCompany, targetIndustry });
  const roleFamily = inferRoleFamily(text);
  const industryDomain = inferIndustryDomain(text);

  if (!roleFamily && !industryDomain) return null;

  return {
    roleFamily,
    industryDomain,
    targetRoleText: safeString(targetRole),
    targetIndustryText: safeString(targetIndustry),
  };
}

export default buildCareerCoreTargetFromJdFit;
