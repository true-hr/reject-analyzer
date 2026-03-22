// Temporary migration map scaffold for legacy flat job keys -> new ontology path.

const JOB_LEGACY_KEY_TO_TAXONOMY_PATH_ENTRIES = {
  pm: { majorCategory: "BUSINESS", subcategory: "PROJECT_MANAGEMENT" },
  product: { majorCategory: "BUSINESS", subcategory: "SERVICE_PLANNING" },
  data: { majorCategory: "IT_DATA_DIGITAL", subcategory: "DATA_ANALYSIS" },
  dev: { majorCategory: "IT_DATA_DIGITAL", subcategory: "BACKEND_DEVELOPMENT" },
  design: { majorCategory: "DESIGN", subcategory: "PRODUCT_DESIGN" },
  marketing: { majorCategory: "MARKETING", subcategory: "DIGITAL_MARKETING" },
  sales: { majorCategory: "SALES", subcategory: "B2B_SALES" },
  ops: { majorCategory: "CUSTOMER_OPERATIONS", subcategory: "SERVICE_OPERATIONS" },
  hr: { majorCategory: "HR_ORGANIZATION", subcategory: "HR_OPS" },
  finance: { majorCategory: "FINANCE_ACCOUNTING", subcategory: "FINANCE" },
};

function normalizeLegacyJobKey(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

export const JOB_LEGACY_KEY_TO_TAXONOMY_PATH = Object.freeze(
  Object.entries(JOB_LEGACY_KEY_TO_TAXONOMY_PATH_ENTRIES).reduce((acc, [legacyKey, taxonomyPath]) => {
    acc[legacyKey] = Object.freeze({ ...taxonomyPath });
    return acc;
  }, {})
);

export function resolveLegacyJobKeyToTaxonomyPath(legacyKey) {
  const normalized = normalizeLegacyJobKey(legacyKey);
  return JOB_LEGACY_KEY_TO_TAXONOMY_PATH[normalized] || null;
}
