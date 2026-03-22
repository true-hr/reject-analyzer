const TOOL_NAME_RE = /\b(sql|excel|tableau|jira|salesforce|hubspot|erp|crm|bi|etl|aws|gcp|api)\b|도구|툴|플랫폼|시스템/i;
const DIRECT_TASK_RE = /주도|리드|설계|구축|개발|구현|실행|운영|분석|개선|기획|작성|수행|도입|launch|launched|build|built|design|designed|implement|implemented|execute|executed|deliver|delivered|own|owned|lead|led/i;
const OWNERSHIP_RE = /책임|오너|ownership|owner|의사결정|결정|end-to-end|e2e|kpi|총괄|리드|lead|owned/i;
const OUTPUT_RE = /결과|성과|산출물|지표|매출|전환|효율|리포트|보고서|대시보드|프로세스|문서|런칭|출시|kpi|metric|result|output|deliverable|dashboard|report|revenue|conversion/i;
const SUPPORT_RE = /지원|보조|운영지원|대응|참여|assist|assisted|support|supported|coordination|coordinate|coordinated|participant|collaboration/i;
const VENDOR_RE = /vendor|saas|tool sales|solution sales|system sales|제품 영업|솔루션 영업|툴 영업|saas 영업|vendor management|파트너사|리셀러/i;
const ADJACENT_RE = /adjacent|bridgeable|인접/i;
const TITLE_ONLY_RE = /manager|head|lead|senior|junior|pm|기획자|매니저|팀장|리드|담당/i;
const ONTOLOGY_RE = /same_role_family|adjacent_role_family|family|role family|직무 계열|직무군/i;
const YEAR_RE = /years?|seniority|연차|경력\s*\d|[0-9]+\+?\s*년/i;
const GENERIC_KEYWORD_RE = /pm|planning|plan|collaboration|communication|operation|operations|manage|management|project|전략|기획|운영|협업|커뮤니케이션|관리/i;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function collectTexts(...values) {
  return values.flat().map((value) => text(value)).filter(Boolean);
}

function shortKeywordSequence(line) {
  const raw = text(line);
  if (!raw) return false;
  if (/[.!?]/.test(raw)) return false;
  const parts = raw.split(/[,:/|]/).map((part) => text(part)).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((part) => part.split(/\s+/).length <= 3);
}

export function detectVendorContamination(...values) {
  return collectTexts(...values).some((line) => VENDOR_RE.test(line));
}

export function detectSupportWording(...values) {
  return collectTexts(...values).some((line) => SUPPORT_RE.test(line) && !OWNERSHIP_RE.test(line));
}

export function detectBareKeywordOnly(...values) {
  const lines = collectTexts(...values);
  if (!lines.length) return false;
  const joined = lines.join(" ");
  if (DIRECT_TASK_RE.test(joined) || OWNERSHIP_RE.test(joined) || OUTPUT_RE.test(joined)) return false;
  return lines.every((line) => shortKeywordSequence(line) || GENERIC_KEYWORD_RE.test(line));
}

export function detectAdjacentOnlyEvidence({ familyDistance = "", hasDirectTaskEvidence = false, texts = [] } = {}) {
  const joined = collectTexts(texts).join(" ");
  return !hasDirectTaskEvidence && (ADJACENT_RE.test(familyDistance) || ADJACENT_RE.test(joined));
}

export function detectTitleOnlyEvidence(...values) {
  const lines = collectTexts(...values);
  if (!lines.length) return false;
  const joined = lines.join(" ");
  if (DIRECT_TASK_RE.test(joined) || OWNERSHIP_RE.test(joined) || OUTPUT_RE.test(joined)) return false;
  return lines.every((line) => TITLE_ONLY_RE.test(line) && line.split(/\s+/).length <= 5);
}

export function detectOntologyOnlyEvidence({ familyMatchCount = 0, sameFamilyPrior = false, hasDirectEvidence = false, texts = [] } = {}) {
  if (hasDirectEvidence) return false;
  const joined = collectTexts(texts).join(" ");
  return (sameFamilyPrior || familyMatchCount > 0) && ONTOLOGY_RE.test(joined);
}

export function detectToolNameOnlyEvidence(...values) {
  const lines = collectTexts(...values);
  if (!lines.length) return false;
  const joined = lines.join(" ");
  if (!TOOL_NAME_RE.test(joined)) return false;
  return !DIRECT_TASK_RE.test(joined) && !OUTPUT_RE.test(joined);
}

export function classifyEvidenceStrength({
  hasDirectTaskEvidence = false,
  hasOwnershipEvidence = false,
  hasOutputEvidence = false,
  hasResultEvidence = false,
  hasMeaningfulSupportEvidence = false,
  hasContextEvidence = false,
  vendorContamination = false,
  supportWording = false,
  bareKeywordOnly = false,
  adjacentOnly = false,
  titleOnly = false,
  ontologyOnly = false,
  toolNameOnly = false,
  yearsOnly = false,
} = {}) {
  if (vendorContamination && !hasDirectTaskEvidence) return "noise";
  if (adjacentOnly || ontologyOnly) return hasMeaningfulSupportEvidence ? "weak" : "noise";
  if (toolNameOnly || titleOnly || yearsOnly) return hasMeaningfulSupportEvidence ? "weak" : "noise";
  if (bareKeywordOnly) return "weak";
  if (supportWording && !hasOwnershipEvidence && !hasResultEvidence) return hasContextEvidence ? "weak" : "noise";
  if (hasDirectTaskEvidence && hasOwnershipEvidence && (hasOutputEvidence || hasResultEvidence)) return "strong";
  if ((hasDirectTaskEvidence && hasContextEvidence) || hasMeaningfulSupportEvidence || hasOwnershipEvidence) return "medium";
  if (hasContextEvidence) return "weak";
  return "noise";
}

export function hasDirectTaskSignal(...values) {
  return DIRECT_TASK_RE.test(collectTexts(...values).join(" "));
}

export function hasOwnershipSignal(...values) {
  return OWNERSHIP_RE.test(collectTexts(...values).join(" "));
}

export function hasOutputSignal(...values) {
  return OUTPUT_RE.test(collectTexts(...values).join(" "));
}

export function detectYearsOnly(...values) {
  const lines = collectTexts(...values);
  if (!lines.length) return false;
  const joined = lines.join(" ");
  if (DIRECT_TASK_RE.test(joined) || OWNERSHIP_RE.test(joined) || OUTPUT_RE.test(joined)) return false;
  return lines.every((line) => YEAR_RE.test(line));
}
