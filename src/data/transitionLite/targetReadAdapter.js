import { getTargetJobReadDetailBySubcategory } from "./targetJobReadDetailMap.index.js";
import { getJobIndustrySpecialization } from "./jobIndustrySpecializationRegistry.js";
import { TRANSITION_LITE2_CONSTRUCTION_REAL_ESTATE_INFRA_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/construction_real_estate_infra/support_industry_traits.js";
import { TRANSITION_LITE2_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/distribution_commerce_consumer_goods/support_industry_traits.js";
import { TRANSITION_LITE2_ENERGY_ENVIRONMENT_PUBLIC_INFRA_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/energy_environment_public_infra/support_industry_traits.js";
import { TRANSITION_LITE2_FINANCE_INSURANCE_FINTECH_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/finance_insurance_fintech/support_industry_traits.js";
import { TRANSITION_LITE2_HEALTHCARE_PHARMA_BIO_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/healthcare_pharma_bio/support_industry_traits.js";
import { TRANSITION_LITE2_IT_SOFTWARE_PLATFORM_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/it_software_platform/support_industry_traits.js";
import { TRANSITION_LITE2_LOGISTICS_TRANSPORT_SUPPLY_CHAIN_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/logistics_transport_supply_chain/support_industry_traits.js";
import { TRANSITION_LITE2_MANUFACTURING_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/manufacturing/support_industry_traits.js";
import { TRANSITION_LITE2_MEDIA_CONTENT_EDUCATION_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/media_content_education/support_industry_traits.js";
import { TRANSITION_LITE2_PROFESSIONAL_B2B_SERVICES_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/professional_b2b_services/support_industry_traits.js";
import { TRANSITION_LITE2_PUBLIC_ASSOCIATION_NONPROFIT_SUPPORT_INDUSTRY_TRAITS_REGISTRY } from "../transitionLite2/public_association_nonprofit/support_industry_traits.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniqueStrings(items = []) {
  const seen = new Set();
  return toArr(items)
    .map((item) => toStr(item))
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function takeSingleSentence(value) {
  const text = toStr(value).replace(/\s+/g, " ");
  if (!text) return "";

  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  if (match?.[1]) {
    return match[1].trim();
  }

  if (text.length <= 140) {
    return text;
  }

  return `${text.slice(0, 137).trim()}...`;
}

function resolveIndustryTemplateText(value, label = "") {
  return toStr(value)
    .replace(/\{label\}/gi, toStr(label))
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitParagraphs(value) {
  return toStr(value)
    .split(/\n{2,}/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeIndustryLookupKey(value) {
  return toStr(value)
    .replace(/^IND_/, "")
    .toLowerCase();
}

function normalizeIndustrySectorKey(value) {
  return toStr(value).toLowerCase();
}

function normalizeIndustryTraitsAliasKey(value) {
  return normalizeIndustryLookupKey(value)
    .replace(/_association_group$/, "_association_organization")
    .replace(/_medical_devices$/, "_medical_device")
    .replace(/_hospital_medical_services$/, "_hospital_medical_service")
    .replace(/_pharmaceuticals$/, "_pharma")
    .replace(/_three_pl_/, "_3pl_")
    .replace(/_warehousing_fulfillment$/, "_warehouse_fulfillment")
    .replace(/_ocean_air_forwarding$/, "_shipping_air_forwarding");
}

const TRANSITION_LITE2_INDUSTRY_TRAITS_REGISTRIES = Object.freeze([
  TRANSITION_LITE2_CONSTRUCTION_REAL_ESTATE_INFRA_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_ENERGY_ENVIRONMENT_PUBLIC_INFRA_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_FINANCE_INSURANCE_FINTECH_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_HEALTHCARE_PHARMA_BIO_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_IT_SOFTWARE_PLATFORM_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_LOGISTICS_TRANSPORT_SUPPLY_CHAIN_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_MANUFACTURING_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_MEDIA_CONTENT_EDUCATION_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_PROFESSIONAL_B2B_SERVICES_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
  TRANSITION_LITE2_PUBLIC_ASSOCIATION_NONPROFIT_SUPPORT_INDUSTRY_TRAITS_REGISTRY,
]);

function getTransitionLite2IndustryTraits(targetIndustryItem, targetIndustryContext) {
  const lookupKey = normalizeIndustryLookupKey(
    targetIndustryItem?.id || targetIndustryContext?.id
  );
  const sectorKey = normalizeIndustrySectorKey(
    targetIndustryItem?.sector || targetIndustryContext?.sector
  );

  if (!lookupKey) return null;

  const candidateRegistries = sectorKey
    ? TRANSITION_LITE2_INDUSTRY_TRAITS_REGISTRIES.filter(
        (registry) => normalizeIndustrySectorKey(registry?.sector) === sectorKey
      )
    : TRANSITION_LITE2_INDUSTRY_TRAITS_REGISTRIES;

  for (const registry of candidateRegistries) {
    const matchedItem = toArr(registry?.items).find(
      (item) => normalizeIndustryTraitsAliasKey(toStr(item?.industryKey)) === normalizeIndustryTraitsAliasKey(lookupKey)
    );
    if (matchedItem) return matchedItem;
  }

  return null;
}

function buildTransitionLite2IndustryTraitBullets(supportIndustryTraits) {
  const bullets = [];

  pushUnique(bullets, toArr(supportIndustryTraits?.whyIndustryMatters).slice(0, 4), 4);

  if (bullets.length === 0) {
    pushUnique(bullets, toArr(supportIndustryTraits?.businessStructure).slice(0, 2), 4);
    pushUnique(bullets, toArr(supportIndustryTraits?.customerStructure).slice(0, 2), 4);
  }

  if (bullets.length === 0) {
    pushUnique(bullets, toArr(supportIndustryTraits?.operatingLanguage).slice(0, 2), 4);
    pushUnique(bullets, toArr(supportIndustryTraits?.problemTypes).slice(0, 2), 4);
  }

  return bullets.slice(0, 4);
}

function getCustomerMarketDisplay(rawValue, options = {}) {
  const raw = toStr(rawValue);
  const mode = toStr(options?.mode) === "short" ? "short" : "long";
  const sector = toStr(options?.sector);

  if (!raw) return "";

  const mixedOverrides = {
    CONSTRUCTION_REAL_ESTATE_INFRA: {
      short: "다층 이해관계자 구조",
      long: "발주처, 시행 주체, 시공사 등 여러 이해관계자가 함께 얽힌 고객 구조입니다",
    },
    DISTRIBUTION_COMMERCE_CONSUMER_GOODS: {
      short: "유통·소비자 중심",
      long: "최종 소비자와 유통 채널, 리테일 바이어가 함께 중요한 고객 구조입니다",
    },
    ENERGY_ENVIRONMENT_PUBLIC_INFRA: {
      short: "공공·산업 수요 중심",
      long: "공공 발주와 산업 수요처가 함께 작동하는 프로젝트형 고객 구조입니다",
    },
    FINANCE_INSURANCE_FINTECH: {
      short: "기관·개인 고객 혼합",
      long: "법인 고객, 개인 고객, 제휴 파트너가 함께 얽히는 복합 고객 구조입니다",
    },
    HEALTHCARE_PHARMA_BIO: {
      short: "환자·의료기관 중심",
      long: "환자, 의료진, 병원, 유통 파트너가 함께 얽히는 고객 구조입니다",
    },
    IT_SOFTWARE_PLATFORM: {
      short: "기업·사용자 혼합",
      long: "최종 사용자와 도입 의사결정자, 운영 담당자가 함께 중요한 고객 구조입니다",
    },
    LOGISTICS_TRANSPORT_SUPPLY_CHAIN: {
      short: "기업·현장 운영 중심",
      long: "화주, 운영 조직, 물류 파트너가 함께 얽히는 다층 고객 구조입니다",
    },
    MANUFACTURING: {
      short: "법인·유통 고객 중심",
      long: "법인 고객과 유통 채널, 파트너사가 함께 중요한 고객 구조입니다",
    },
    MEDIA_CONTENT_EDUCATION: {
      short: "이용자·광고주 혼합",
      long: "이용자, 학습자, 광고주, 플랫폼 파트너가 함께 얽히는 고객 구조입니다",
    },
    PROFESSIONAL_B2B_SERVICES: {
      short: "기업 의사결정자 중심",
      long: "실무 담당자뿐 아니라 관리자, 임원, 발주 책임자가 함께 중요한 고객 구조입니다",
    },
    PUBLIC_ASSOCIATION_NONPROFIT: {
      short: "공공·회원·시민 혼합",
      long: "공공기관, 회원 조직, 시민 수요자가 함께 얽히는 고객 구조입니다",
    },
  };

  if (raw === "MIXED" && sector && mixedOverrides[sector]?.[mode]) {
    return mixedOverrides[sector][mode];
  }

  const baseMap = {
    B2B: {
      short: "기업 고객 중심",
      long: "기업 고객과 실무 담당자, 구매자, 의사결정자가 핵심인 고객 구조입니다",
    },
    B2C: {
      short: "일반 소비자 중심",
      long: "최종 소비자 경험과 수요 반응이 핵심인 고객 구조입니다",
    },
    B2G: {
      short: "공공기관 중심",
      long: "공공기관 발주와 승인 절차, 정책 맥락이 중요한 고객 구조입니다",
    },
    B2B2C: {
      short: "기업·소비자 연결",
      long: "중간 사업자와 최종 소비자가 함께 연결되는 고객 구조입니다",
    },
    MIXED: {
      short: "복합 고객 구조",
      long: "여러 고객군과 이해관계자가 함께 작동하는 복합 고객 구조입니다",
    },
    B2B_B2G_MIXED: {
      short: "기업·공공 혼합",
      long: "기업 고객과 공공 발주 주체가 함께 중요한 복합 고객 구조입니다",
    },
    B2G_B2B_B2C_MIXED: {
      short: "공공·기업·소비자 혼합",
      long: "공공기관, 기업 고객, 최종 소비자가 함께 얽히는 복합 고객 구조입니다",
    },
    B2C_B2G_B2B_MIXED: {
      short: "소비자·공공·기업 혼합",
      long: "최종 소비자, 공공기관, 기업 고객이 함께 작동하는 복합 고객 구조입니다",
    },
    B2G_B2C_MIXED: {
      short: "공공·소비자 혼합",
      long: "공공 서비스 수요자와 일반 소비자 접점이 함께 존재하는 고객 구조입니다",
    },
  };

  return baseMap[raw]?.[mode] || raw;
}

function buildSafeIndustrySummary(targetIndustryItem, targetIndustryContext) {
  const label = toStr(targetIndustryItem?.label || targetIndustryContext?.label);
  const candidateSummary =
    takeSingleSentence(resolveIndustryTemplateText(targetIndustryItem?.summaryTemplate, label)) ||
    takeSingleSentence(resolveIndustryTemplateText(toArr(targetIndustryItem?.coreContext)[0], label)) ||
    takeSingleSentence(resolveIndustryTemplateText(toArr(targetIndustryContext?.coreContext)[0], label)) ||
    takeSingleSentence(resolveIndustryTemplateText(targetIndustryItem?.offeringModel, label)) ||
    takeSingleSentence(resolveIndustryTemplateText(toArr(targetIndustryItem?.decisionStructure)[0], label));

  if (candidateSummary) return candidateSummary;
  if (!label) return "";

  const customerMarket = toStr(targetIndustryItem?.customerMarket || targetIndustryContext?.customerMarket);
  if (customerMarket) {
    const displayLong = getCustomerMarketDisplay(customerMarket, {
      mode: "long",
      sector: targetIndustryItem?.sector || targetIndustryContext?.sector,
    });
    return `${label} 산업은 ${displayLong}입니다.`;
  }

  return `${label} 산업은 고객 구조와 운영 방식에 따라 같은 직무 경험도 다르게 해석될 수 있는 영역입니다.`;
}

function getPrimaryFamily(jobItem) {
  const families = toArr(jobItem?.families);
  return families.length > 0 && families[0] && typeof families[0] === "object" ? families[0] : null;
}

function getPrimaryRole(jobItem) {
  const roles = toArr(jobItem?.roles);
  return roles.length > 0 && roles[0] && typeof roles[0] === "object" ? roles[0] : null;
}

function getFamilyById(jobItem, familyId) {
  const normalizedFamilyId = toStr(familyId);
  if (!normalizedFamilyId) return null;

  return (
    toArr(jobItem?.families).find(
      (family) => family && typeof family === "object" && toStr(family?.id) === normalizedFamilyId
    ) || null
  );
}

function getJobResponsibilityHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.responsibilityHints));
}

function getJobLevelHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.levelHints));
}

function pushUnique(list, values, limit = 4) {
  for (const value of toArr(values)) {
    const text = toStr(value);
    if (!text) continue;
    if (list.some((item) => item.toLowerCase() === text.toLowerCase())) continue;
    list.push(text);
    if (list.length >= limit) break;
  }
  return list;
}

function buildSentenceBulletsFromText(text, maxItems = 3) {
  const normalized = toStr(text).replace(/\s+/g, " ");
  const firstMatch = normalized.match(/^(.+?[.!?])(?:\s|$)/);
  if (!firstMatch) return [];
  const rest = normalized.slice(firstMatch[0].length).trim();
  if (!rest) return [];
  const sentences = [];
  let remaining = rest;
  while (remaining.length > 0 && sentences.length < maxItems) {
    const match = remaining.match(/^(.+?[.!?])(?:\s|$)/);
    if (match?.[1]) {
      sentences.push(match[1].trim());
      remaining = remaining.slice(match[0].length).trim();
    } else {
      if (remaining.trim()) sentences.push(remaining.trim());
      break;
    }
  }
  return sentences;
}

function buildBulletsFromDetailAsset(detailAsset = {}) {
  const bullets = [];
  pushUnique(bullets, toArr(detailAsset?.pointCandidates).slice(0, 4));

  if (bullets.length === 0) {
    pushUnique(bullets, splitParagraphs(detailAsset?.summaryTemplate).slice(1, 5));
  }

  return bullets.slice(0, 4);
}

function ensureSentence(value) {
  const text = toStr(value).replace(/\s+/g, " ");
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function dedupeHintItems(values = [], limit = 3) {
  const seen = new Set();
  const selected = [];

  for (const value of toArr(values)) {
    const text = toStr(value).replace(/\s+/g, " ");
    if (!text) continue;

    const key = text
      .toLowerCase()
      .replace(/[0-9]/g, "")
      .replace(/[()]/g, "")
      .replace(/\s+/g, "")
      .replace(/및|와|과|중심|기반|설계|제작|관리|운영|실행|대응|정의|구축|작성|수립|도출|분석/g, "");

    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push(text);

    if (selected.length >= limit) break;
  }

  return selected;
}

function joinHintItems(values = []) {
  const items = dedupeHintItems(values, 3);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}, ${items[1]}`;
  return `${items[0]}, ${items[1]}, ${items[2]}`;
}

function normalizeSemanticToken(value) {
  return toStr(value)
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSemanticTokenSet(value) {
  return new Set(
    normalizeSemanticToken(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );
}

function hasHeavyPointOverlap(primaryRole, primaryFamily) {
  const responsibilityTokens = toSemanticTokenSet(joinHintItems(primaryRole?.responsibilityHints));
  const strongSignalTokens = toSemanticTokenSet(joinHintItems(primaryFamily?.strongSignals));

  let overlapCount = 0;
  for (const token of responsibilityTokens) {
    if (!strongSignalTokens.has(token)) continue;
    overlapCount += 1;
    if (overlapCount >= 2) return true;
  }

  return false;
}

function isOperationalEvaluationFamily(primaryRole, primaryFamily) {
  const familyId = toStr(primaryFamily?.id).toLowerCase();
  const roleId = toStr(primaryRole?.id).toLowerCase();
  const signal = `${familyId} ${roleId}`;

  return /(program|operation|operations|execution|admin|service|support|community|backoffice)/.test(signal);
}

function isCreativeEvaluationFamily(primaryRole, primaryFamily) {
  const familyId = toStr(primaryFamily?.id).toLowerCase();
  const roleId = toStr(primaryRole?.id).toLowerCase();
  const signal = `${familyId} ${roleId}`;

  return /(brand|motion|graphic|visual|content|bx)/.test(signal);
}

function buildJobCharacterTag(primaryRole, primaryFamily) {
  if (isCreativeEvaluationFamily(primaryRole, primaryFamily)) return "제작·표현";
  if (isOperationalEvaluationFamily(primaryRole, primaryFamily)) return "운영 실행";
  const sig = toStr(primaryFamily?.id).toLowerCase();
  if (/(analysis|research|market|insight)/.test(sig)) return "분석 조사";
  if (/(planning|strategy|roadmap)/.test(sig)) return "기획 설계";
  if (/(quality|inspection|safety|ehs)/.test(sig)) return "품질 관리";
  if (/(development|engineering|technical|circuit|mechanical)/.test(sig)) return "기술 구현";
  return null;
}

function buildCreativeEvaluationPoint(primaryFamily) {
  const familyId = toStr(primaryFamily?.id).toLowerCase();

  if (familyId.includes("motion")) {
    return ensureSentence("실무에서는 영상 하나를 잘 만드는 것보다, 전달 목적에 맞춰 톤앤매너와 완성도를 안정적으로 유지할 수 있는지를 중요하게 봅니다");
  }

  if (familyId.includes("brand")) {
    return ensureSentence("이 직무에서는 개별 결과물을 만드는 것보다, 브랜드 메시지에 맞춰 톤앤매너와 완성도를 일관되게 유지할 수 있는지가 중요한 판단 포인트가 됩니다");
  }

  if (familyId.includes("content")) {
    return ensureSentence("이 직무에서는 개별 콘텐츠를 만드는 것보다, 메시지와 전달 목적에 맞는 톤앤매너를 일관되게 유지할 수 있는지가 중요한 판단 포인트가 됩니다");
  }

  if (familyId.includes("graphic") || familyId.includes("visual")) {
    return ensureSentence("이 직무에서는 개별 시각 결과물을 만드는 것보다, 전달 목적에 맞춰 완성도와 일관성을 유지할 수 있는지가 중요한 판단 포인트가 됩니다");
  }

  return ensureSentence("이 직무에서는 개별 결과물을 만드는 것보다, 전달 목적에 맞춰 톤앤매너와 완성도를 일관되게 유지할 수 있는지가 중요한 판단 포인트가 됩니다");
}

function pickTargetJobReadSummary({ primaryRole, primaryFamily, targetJobItem, detailAsset }) {
  return ensureSentence(
    primaryRole?.summaryTemplate ||
      primaryFamily?.summaryTemplate ||
      targetJobItem?.summaryTemplate ||
      detailAsset?.summaryTemplate ||
      toArr(primaryFamily?.coreTraits)[0] ||
      toArr(primaryFamily?.strongSignals)[0] ||
      getJobResponsibilityHints(targetJobItem)[0] ||
      getJobLevelHints(targetJobItem)[0] ||
      primaryFamily?.boundaryNote
  );
}

function buildResponsibilityPoint(primaryRole) {
  const text = joinHintItems(primaryRole?.responsibilityHints);
  if (!text) return "";
  return ensureSentence(`주요 역할은 ${text}처럼 이 직무의 핵심 산출물과 운영 대상을 실제로 다루는 쪽에 가깝습니다`);
}

function buildEvaluationPoint(primaryRole, primaryFamily) {
  const text = joinHintItems(primaryFamily?.strongSignals);
  if (!text) return "";

  if (isOperationalEvaluationFamily(primaryRole, primaryFamily)) {
    return ensureSentence("실무에서는 단순 일정 진행보다, 운영 흐름과 진행 상황을 안정적으로 통제하고 이슈 대응과 운영 품질 유지까지 연결할 수 있는지를 중요하게 보는 경우가 많습니다");
  }

  if (isCreativeEvaluationFamily(primaryRole, primaryFamily)) {
    return buildCreativeEvaluationPoint(primaryFamily);
  }

  if (hasHeavyPointOverlap(primaryRole, primaryFamily)) {
    return ensureSentence("이 직무에서는 개별 업무를 수행하는 것보다, 관련 산출물과 판단 기준을 하나의 완성도로 연결할 수 있는지가 중요한 판단 포인트가 됩니다");
  }

  return ensureSentence(`이 직무에서는 ${text}를 개별 작업으로 처리하는 것보다, 하나의 기준과 완성도로 연결해내는지가 중요한 판단 포인트가 됩니다`);
}

function buildLevelOrBoundaryPoint(primaryRole, primaryFamily, targetJobItem) {
  const levelHints = dedupeHintItems(primaryRole?.levelHints, 2);
  if (levelHints.length === 1) {
    return ensureSentence(levelHints[0]);
  }
  if (levelHints.length >= 2) {
    return ensureSentence(`${levelHints[0]}, ${levelHints[1]}`);
  }

  const boundarySignals = dedupeHintItems(primaryFamily?.boundarySignals, 2);
  if (boundarySignals.length > 0) {
    return ensureSentence(`이 비중이 커지면 ${joinHintItems(boundarySignals)} 쪽으로 경계가 이동할 수 있습니다`);
  }

  return ensureSentence(
    primaryFamily?.boundaryNote ||
      dedupeHintItems(targetJobItem?.boundaryHints, 1)[0]
  );
}

export function buildTransitionLiteTargetJobRead(targetJobItem, targetJobContext) {
  const primaryRole = getPrimaryRole(targetJobItem);
  const primaryFamily =
    getFamilyById(targetJobItem, primaryRole?.family) ||
    getPrimaryFamily(targetJobItem);
  const title = toStr(targetJobItem?.label) ? `${toStr(targetJobItem?.label)} 특징` : "";
  const detailAsset = getTargetJobReadDetailBySubcategory(targetJobItem?.subcategory ?? targetJobItem?.subVertical);
  const summary = pickTargetJobReadSummary({
    primaryRole,
    primaryFamily,
    targetJobItem,
    detailAsset,
  });
  const bullets = [
    buildResponsibilityPoint(primaryRole),
    buildEvaluationPoint(primaryRole, primaryFamily),
    buildLevelOrBoundaryPoint(primaryRole, primaryFamily, targetJobItem),
  ].filter(Boolean).slice(0, 3);

  if (bullets.length === 0) {
    pushUnique(bullets, buildBulletsFromDetailAsset(detailAsset), 3);
    pushUnique(bullets, toArr(targetJobContext?.capabilityHints).slice(0, 1), 3);
  }

  // Normalize: if no structured bullets, promote multi-sentence summary into bullets
  if (bullets.length === 0 && summary) {
    pushUnique(bullets, buildSentenceBulletsFromText(summary, 3), 3);
  }

  // body is always a concise intro sentence; full summary retained separately
  const body = summary ? (takeSingleSentence(summary) || summary) : "";

  const tags = [toStr(primaryFamily?.label).trim(), buildJobCharacterTag(primaryRole, primaryFamily)]
    .filter((s, i, arr) => s && arr.indexOf(s) === i);

  const summarySource = primaryRole?.summaryTemplate
    ? "role.summaryTemplate"
    : primaryFamily?.summaryTemplate
      ? "family.summaryTemplate"
      : targetJobItem?.summaryTemplate
        ? "job.summaryTemplate"
        : detailAsset?.summaryTemplate
          ? "detail.summaryTemplate"
          : "fallback";

  return {
    title,
    body,
    summary,
    bullets,
    tags,
    source: summarySource,
  };
}

function applySpecializationOverlayToBullets(bullets, specialization) {
  const suppress = toArr(specialization?.suppressTerms).map((term) => String(term).toLowerCase());
  const priority = toArr(specialization?.priorityBullets);

  const filtered = bullets.filter((bullet) => {
    const text = String(bullet || "").toLowerCase();
    if (!text) return false;
    return !suppress.some((term) => term && text.includes(term));
  });

  const merged = [];
  pushUnique(merged, priority, 4);
  pushUnique(merged, filtered, 4);
  return merged;
}

export function buildTransitionLiteTargetIndustryRead(
  targetIndustryItem,
  targetIndustryContext,
  options = {}
) {
  const specialization = getJobIndustrySpecialization({
    targetJobItem: options?.targetJobItem,
    targetJobContext: options?.targetJobContext,
    targetIndustryItem,
    targetIndustryContext,
  });

  const supportIndustryTraits = getTransitionLite2IndustryTraits(targetIndustryItem, targetIndustryContext);
  const title = toStr(targetIndustryItem?.label) ? `${toStr(targetIndustryItem?.label)} 특징` : "";

  const resolvedLabel = toStr(targetIndustryItem?.label || targetIndustryContext?.label);
  const baseSummary =
    takeSingleSentence(resolveIndustryTemplateText(supportIndustryTraits?.summaryTemplate, resolvedLabel)) ||
    buildSafeIndustrySummary(targetIndustryItem, targetIndustryContext);
  const summary = specialization?.summary
    ? takeSingleSentence(specialization.summary) || specialization.summary
    : baseSummary;

  let bullets = buildTransitionLite2IndustryTraitBullets(supportIndustryTraits);

  if (bullets.length === 0 && toStr(targetIndustryItem?.customerMarket)) {
    const customerLong = specialization?.customerStructure?.long
      ? specialization.customerStructure.long
      : getCustomerMarketDisplay(toStr(targetIndustryItem.customerMarket), {
          mode: "long",
          sector: targetIndustryItem?.sector || targetIndustryContext?.sector,
        });
    pushUnique(bullets, [`고객 구조: ${customerLong}`]);
  }
  if (bullets.length === 0) {
    pushUnique(bullets, toArr(targetIndustryItem?.buyingMotion).slice(0, 1));
    pushUnique(bullets, toArr(targetIndustryItem?.decisionStructure).slice(0, 1));
    pushUnique(bullets, toArr(targetIndustryItem?.offeringModel).slice(0, 1));
    pushUnique(bullets, toArr(targetIndustryItem?.industryKeywords).slice(0, 1));
    pushUnique(bullets, toArr(targetIndustryItem?.coreContext).slice(0, 1));
  }

  if (specialization) {
    bullets = applySpecializationOverlayToBullets(bullets, specialization);
  }

  return {
    title,
    summary,
    bullets: bullets.slice(0, 4),
  };
}
