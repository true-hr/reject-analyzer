import * as businessOntology from "./ontology/business/index.js";
import * as customerOperationsOntology from "./ontology/customer_operations/index.js";
import * as designOntology from "./ontology/design/index.js";
import * as educationCounselingCoachingOntology from "./ontology/education_counseling_coaching/index.js";
import * as engineeringDevelopmentOntology from "./ontology/engineering_development/index.js";
import * as financeAccountingOntology from "./ontology/finance_accounting/index.js";
import * as hrOrganizationOntology from "./ontology/hr_organization/index.js";
import * as itDataDigitalOntology from "./ontology/it_data_digital/index.js";
import * as manufacturingQualityProductionOntology from "./ontology/manufacturing_quality_production/index.js";
import * as marketingOntology from "./ontology/marketing/index.js";
import * as procurementScmOntology from "./ontology/procurement_scm/index.js";
import * as publicAdministrationSupportOntology from "./ontology/public_administration_support/index.js";
import * as researchProfessionalOntology from "./ontology/research_professional/index.js";
import * as salesOntology from "./ontology/sales/index.js";
import { JOB_LEGACY_KEY_TO_TAXONOMY_PATH } from "./jobMigrationMap.js";

const JOB_MAJOR_UI_TO_CANONICAL = {
  "경영비즈니스": "BUSINESS",
  "영업": "SALES",
  "마케팅": "MARKETING",
  "고객운영": "CUSTOMER_OPERATIONS",
  "인사조직": "HR_ORGANIZATION",
  "재무회계": "FINANCE_ACCOUNTING",
  "구매조달SCM": "PROCUREMENT_SCM",
  "생산품질제조": "MANUFACTURING_QUALITY_PRODUCTION",
  "엔지니어링개발": "ENGINEERING_DEVELOPMENT",
  "IT데이터디지털": "IT_DATA_DIGITAL",
  "디자인": "DESIGN",
  "연구전문직": "RESEARCH_PROFESSIONAL",
  "교육상담코칭": "EDUCATION_COUNSELING_COACHING",
  "공공행정지원": "PUBLIC_ADMINISTRATION_SUPPORT",
};

const JOB_MAJOR_CANONICAL_TO_UI = Object.freeze(
  Object.entries(JOB_MAJOR_UI_TO_CANONICAL).reduce((acc, [uiLabel, canonical]) => {
    if (!acc[canonical]) acc[canonical] = [];
    acc[canonical].push(uiLabel);
    return acc;
  }, {})
);

const JOB_ONTOLOGY_MODULES = [
  businessOntology,
  customerOperationsOntology,
  designOntology,
  educationCounselingCoachingOntology,
  engineeringDevelopmentOntology,
  financeAccountingOntology,
  hrOrganizationOntology,
  itDataDigitalOntology,
  manufacturingQualityProductionOntology,
  marketingOntology,
  procurementScmOntology,
  publicAdministrationSupportOntology,
  researchProfessionalOntology,
  salesOntology,
];

function normalizeJobValue(value) {
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
    .map((part) => normalizeJobValue(part))
    .filter(Boolean);

  return [...new Set([normalizeJobValue(raw), ...tokens].filter(Boolean))];
}

function toStringArray(value) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    : [];
}

function titleizeToken(value) {
  return String(value ?? "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

function isOntologyItem(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (typeof value.vertical === "string" || typeof value.majorCategory === "string") &&
    (typeof value.subVertical === "string" || typeof value.subcategory === "string")
  );
}

function toOntologyItem(value, exportKey) {
  if (!isOntologyItem(value)) return null;

  const majorCategory = String(value.majorCategory ?? value.vertical ?? "").trim();
  const subcategory = String(value.subcategory ?? value.subVertical ?? exportKey ?? "").trim();
  if (!majorCategory || !subcategory) return null;

  const id = String(value.id ?? `JOB_${majorCategory}_${subcategory}`).trim();
  const label = String(value.label ?? (titleizeToken(subcategory) || exportKey || subcategory)).trim();
  const aliases = [...new Set([
    ...toStringArray(value.aliases),
    subcategory,
    exportKey,
    titleizeToken(subcategory),
    label,
  ].filter(Boolean))];

  return Object.freeze({
    ...value,
    id,
    label,
    aliases,
    majorCategory,
    subcategory,
  });
}

function getMajorCandidates(value) {
  const raw = String(value ?? "").trim();
  const canonical = JOB_MAJOR_UI_TO_CANONICAL[raw] || raw;
  const uiAliases = JOB_MAJOR_CANONICAL_TO_UI[canonical] || [];

  return [...new Set([
    normalizeJobValue(raw),
    normalizeJobValue(canonical),
    ...uiAliases.map((alias) => normalizeJobValue(alias)),
  ].filter(Boolean))];
}

function getSubcategoryCandidates(itemOrValue) {
  if (isOntologyItem(itemOrValue) || (itemOrValue && typeof itemOrValue === "object")) {
    return [
      itemOrValue.subcategory,
      itemOrValue.subVertical,
      itemOrValue.label,
      ...toStringArray(itemOrValue.aliases),
    ]
      .flatMap((candidate) => splitLookupCandidates(candidate))
      .filter(Boolean);
  }

  return splitLookupCandidates(itemOrValue);
}

const ontologyValues = JOB_ONTOLOGY_MODULES.flatMap((moduleExports) =>
  Object.entries(moduleExports || {})
    .map(([exportKey, value]) => toOntologyItem(value, exportKey))
    .filter(Boolean)
);

export const JOB_ONTOLOGY_ITEMS = Object.freeze(ontologyValues);

export const JOB_ONTOLOGY_BY_ID = Object.freeze(
  JOB_ONTOLOGY_ITEMS.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {})
);

export const JOB_ONTOLOGY_BY_MAJOR_SUBCATEGORY = Object.freeze(
  JOB_ONTOLOGY_ITEMS.reduce((acc, item) => {
    const key = `${normalizeJobValue(item.majorCategory)}::${normalizeJobValue(item.subcategory)}`;
    if (!acc[key]) acc[key] = item;
    return acc;
  }, {})
);

// [VALIDATION] warning-only, no throw
(function __validateJobOntology() {
  const knownMajorCanonicals = new Set(Object.values(JOB_MAJOR_UI_TO_CANONICAL));

  // 1) duplicate id + non-canonical prefix
  const seenIds = new Set();
  for (const item of JOB_ONTOLOGY_ITEMS) {
    if (seenIds.has(item.id)) {
      console.warn(`[jobOntology] duplicate id: "${item.id}"`);
    }
    seenIds.add(item.id);
    if (!String(item.id).startsWith("JOB_")) {
      console.warn(`[jobOntology] non-canonical id prefix: "${item.id}" (expected JOB_)`);
    }
  }

  // 2) composite-key (majorCategory::subcategory) duplicate
  const seenCompositeKeys = new Set();
  for (const item of JOB_ONTOLOGY_ITEMS) {
    const key = `${normalizeJobValue(item.majorCategory)}::${normalizeJobValue(item.subcategory)}`;
    if (seenCompositeKeys.has(key)) {
      console.warn(`[jobOntology] duplicate majorCategory::subcategory key: "${key}" on "${item.id}"`);
    }
    seenCompositeKeys.add(key);
  }

  // 3) majorCategory coverage — must map to a known canonical
  for (const item of JOB_ONTOLOGY_ITEMS) {
    const canonical = JOB_MAJOR_UI_TO_CANONICAL[item.majorCategory] || item.majorCategory;
    if (!knownMajorCanonicals.has(canonical)) {
      console.warn(`[jobOntology] unknown majorCategory "${item.majorCategory}" on "${item.id}" — not in JOB_MAJOR_UI_TO_CANONICAL`);
    }
  }

  // 4) alias collision
  const aliasToIds = {};
  for (const item of JOB_ONTOLOGY_ITEMS) {
    const candidates = toStringArray(item.aliases)
      .flatMap((v) => splitLookupCandidates(v))
      .filter(Boolean);
    for (const alias of candidates) {
      if (!aliasToIds[alias]) aliasToIds[alias] = [];
      aliasToIds[alias].push(item.id);
    }
  }
  for (const [alias, ids] of Object.entries(aliasToIds)) {
    if (ids.length > 1) {
      console.warn(`[jobOntology] alias collision on "${alias}": ${ids.join(", ")}`);
    }
  }

  // 5) migration-map target validity
  for (const [legacyKey, path] of Object.entries(JOB_LEGACY_KEY_TO_TAXONOMY_PATH)) {
    const resolved = getJobOntologyItemByMajorSubcategory(path.majorCategory, path.subcategory);
    if (!resolved) {
      console.warn(`[jobOntology] migration key "${legacyKey}" -> ${path.majorCategory}::${path.subcategory} cannot resolve to any ontology item`);
    }
  }
})();

export function getJobOntologyItemById(id) {
  return JOB_ONTOLOGY_BY_ID[String(id ?? "").trim()] || null;
}

export function getJobOntologyItemByMajorSubcategory(majorCategory, subcategory) {
  const directKey = `${normalizeJobValue(majorCategory)}::${normalizeJobValue(subcategory)}`;
  if (JOB_ONTOLOGY_BY_MAJOR_SUBCATEGORY[directKey]) {
    return JOB_ONTOLOGY_BY_MAJOR_SUBCATEGORY[directKey];
  }

  const majorCandidates = getMajorCandidates(majorCategory);
  const subcategoryCandidates = getSubcategoryCandidates(subcategory);

  return (
    JOB_ONTOLOGY_ITEMS.find((item) => {
      const itemMajorCandidates = getMajorCandidates(item.majorCategory);
      const itemSubcategoryCandidates = getSubcategoryCandidates(item);
      const hasMajorMatch = majorCandidates.some((candidate) => itemMajorCandidates.includes(candidate));
      const hasSubcategoryMatch = subcategoryCandidates.some((candidate) => itemSubcategoryCandidates.includes(candidate));
      return hasMajorMatch && hasSubcategoryMatch;
    }) || null
  );
}
