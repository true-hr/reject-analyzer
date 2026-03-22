import * as registryModule from "./registry/index.js";

const INDUSTRY_SECTOR_UI_TO_CANONICAL = {
  "제조업": "MANUFACTURING",
  "IT / 소프트웨어 / 플랫폼": "IT_SOFTWARE_PLATFORM",
  "유통 / 커머스 / 소비재": "DISTRIBUTION_COMMERCE_CONSUMER_GOODS",
  "물류 / 운송 / 공급망": "LOGISTICS_TRANSPORT_SUPPLY_CHAIN",
  "금융 / 보험 / 핀테크": "FINANCE_INSURANCE_FINTECH",
  "건설 / 부동산 / 인프라": "CONSTRUCTION_REAL_ESTATE_INFRA",
  "헬스케어 / 제약 / 바이오": "HEALTHCARE_PHARMA_BIO",
  "에너지 / 환경 / 공공인프라": "ENERGY_ENVIRONMENT_PUBLIC_INFRA",
  "미디어 / 콘텐츠 / 교육": "MEDIA_CONTENT_EDUCATION",
  "전문서비스 / B2B 서비스": "PROFESSIONAL_B2B_SERVICES",
  "공공 / 협회 / 비영리": "PUBLIC_ASSOCIATION_NONPROFIT",
};

const INDUSTRY_SECTOR_CANONICAL_TO_UI = Object.freeze(
  Object.entries(INDUSTRY_SECTOR_UI_TO_CANONICAL).reduce((acc, [uiLabel, canonical]) => {
    if (!acc[canonical]) acc[canonical] = [];
    acc[canonical].push(uiLabel);
    return acc;
  }, {})
);

function normalizeIndustryValue(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function splitLookupCandidates(value) {
  const raw = String(value ?? "").normalize("NFKC").trim();
  if (!raw) return [];

  const tokens = raw
    .split(/[\\/|,]+|\s+-\s+|\s+·\s+|\s+•\s+|\s+\(\s*|\s*\)\s*/g)
    .map((part) => normalizeIndustryValue(part))
    .filter(Boolean);

  return [...new Set([normalizeIndustryValue(raw), ...tokens].filter(Boolean))];
}

function toStringArray(value) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    : [];
}

function isRegistryItem(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.sector === "string" &&
    typeof value.subSector === "string"
  );
}

function shouldIncludeRegistryItem(value) {
  return isRegistryItem(value) && !String(value.id).startsWith("IND_PROCUREMENT_");
}

function getSectorCandidates(value) {
  const raw = String(value ?? "").trim();
  const normalized = normalizeIndustryValue(raw);
  const canonical = INDUSTRY_SECTOR_UI_TO_CANONICAL[raw] || raw;
  const canonicalNormalized = normalizeIndustryValue(canonical);
  const uiAliases = INDUSTRY_SECTOR_CANONICAL_TO_UI[canonical] || [];

  return [...new Set([
    normalized,
    canonicalNormalized,
    ...uiAliases.map((alias) => normalizeIndustryValue(alias)),
  ].filter(Boolean))];
}

function getSubSectorCandidates(itemOrValue) {
  if (isRegistryItem(itemOrValue)) {
    return [
      itemOrValue.subSector,
      itemOrValue.label,
      ...toStringArray(itemOrValue.aliases),
    ]
      .flatMap((candidate) => splitLookupCandidates(candidate))
      .filter(Boolean);
  }

  return splitLookupCandidates(itemOrValue);
}

const registryValues = Object.values(registryModule).filter(shouldIncludeRegistryItem);

export const INDUSTRY_REGISTRY_ITEMS = Object.freeze(
  registryValues.map((item) => Object.freeze({ ...item, aliases: toStringArray(item.aliases) }))
);

export const INDUSTRY_REGISTRY_BY_ID = Object.freeze(
  INDUSTRY_REGISTRY_ITEMS.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {})
);

export const INDUSTRY_REGISTRY_BY_LABEL = Object.freeze(
  INDUSTRY_REGISTRY_ITEMS.reduce((acc, item) => {
    const keys = [item.label, ...toStringArray(item.aliases)]
      .map((value) => normalizeIndustryValue(value))
      .filter(Boolean);

    for (const key of keys) {
      if (!acc[key]) acc[key] = item;
    }

    return acc;
  }, {})
);

export const INDUSTRY_REGISTRY_BY_SECTOR_SUBSECTOR = Object.freeze(
  INDUSTRY_REGISTRY_ITEMS.reduce((acc, item) => {
    const key = `${normalizeIndustryValue(item.sector)}::${normalizeIndustryValue(item.subSector)}`;
    if (!acc[key]) acc[key] = item;
    return acc;
  }, {})
);

// [VALIDATION] warning-only, no throw
(function __validateIndustryRegistry() {
  const knownSectorCanonicals = new Set(Object.values(INDUSTRY_SECTOR_UI_TO_CANONICAL));

  // 1) duplicate id + non-canonical prefix
  const seenIds = new Set();
  for (const item of INDUSTRY_REGISTRY_ITEMS) {
    if (seenIds.has(item.id)) {
      console.warn(`[industryRegistry] duplicate id: "${item.id}"`);
    }
    seenIds.add(item.id);
    if (!String(item.id).startsWith("IND_")) {
      console.warn(`[industryRegistry] non-canonical id prefix: "${item.id}" (expected IND_)`);
    }
  }

  // 2) composite-key (sector::subSector) duplicate
  const seenCompositeKeys = new Set();
  for (const item of INDUSTRY_REGISTRY_ITEMS) {
    const key = `${normalizeIndustryValue(item.sector)}::${normalizeIndustryValue(item.subSector)}`;
    if (seenCompositeKeys.has(key)) {
      console.warn(`[industryRegistry] duplicate sector::subSector key: "${key}" on "${item.id}"`);
    }
    seenCompositeKeys.add(key);
  }

  // 3) sector coverage — sector value must map to a known canonical
  for (const item of INDUSTRY_REGISTRY_ITEMS) {
    const canonical = INDUSTRY_SECTOR_UI_TO_CANONICAL[item.sector] || item.sector;
    if (!knownSectorCanonicals.has(canonical)) {
      console.warn(`[industryRegistry] unknown sector "${item.sector}" on "${item.id}" — not in INDUSTRY_SECTOR_UI_TO_CANONICAL`);
    }
  }

  // 4) alias collision
  const aliasToIds = {};
  for (const item of INDUSTRY_REGISTRY_ITEMS) {
    const candidates = [item.label, ...toStringArray(item.aliases)]
      .map((v) => normalizeIndustryValue(v))
      .filter(Boolean);
    for (const alias of candidates) {
      if (!aliasToIds[alias]) aliasToIds[alias] = [];
      aliasToIds[alias].push(item.id);
    }
  }
  for (const [alias, ids] of Object.entries(aliasToIds)) {
    if (ids.length > 1) {
      console.warn(`[industryRegistry] alias collision on "${alias}": ${ids.join(", ")}`);
    }
  }
})();

export function getIndustryRegistryItemById(id) {
  return INDUSTRY_REGISTRY_BY_ID[String(id ?? "").trim()] || null;
}

export function getIndustryRegistryItemByLabel(label) {
  const key = normalizeIndustryValue(label);
  return INDUSTRY_REGISTRY_BY_LABEL[key] || null;
}

export function getIndustryRegistryItemBySectorSubSector(sector, subSector) {
  const sectorCandidates = getSectorCandidates(sector);
  const subSectorCandidates = getSubSectorCandidates(subSector);

  for (const sectorCandidate of sectorCandidates) {
    for (const subSectorCandidate of subSectorCandidates) {
      const key = `${sectorCandidate}::${subSectorCandidate}`;
      if (INDUSTRY_REGISTRY_BY_SECTOR_SUBSECTOR[key]) {
        return INDUSTRY_REGISTRY_BY_SECTOR_SUBSECTOR[key];
      }
    }
  }

  return (
    INDUSTRY_REGISTRY_ITEMS.find((item) => {
      const itemSectorCandidates = getSectorCandidates(item.sector);
      const itemSubSectorCandidates = getSubSectorCandidates(item);
      const hasSectorMatch = sectorCandidates.some((candidate) => itemSectorCandidates.includes(candidate));
      const hasSubSectorMatch = subSectorCandidates.some((candidate) => itemSubSectorCandidates.includes(candidate));
      return hasSectorMatch && hasSubSectorMatch;
    }) || null
  );
}
