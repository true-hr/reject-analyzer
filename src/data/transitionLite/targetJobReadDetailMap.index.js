import { BUSINESS_JOB_DETAIL_ASSETS } from "./targetJobReadDetailMap.business.js";
import { SALES_SUMMARY_TEMPLATE_MAP } from "./targetJobReadDetailMap.sales.js";
import { MARKETING_JOB_SUMMARY_TEMPLATE_EXPANSION } from "./targetJobReadDetailMap.marketing.js";
import { CUSTOMER_OPERATIONS_DETAIL_BLOCKS } from "./targetJobReadDetailMap.customerOperations.js";
import { HR_ORGANIZATION_JOB_SUMMARY_TEMPLATE_EXPANSION } from "./targetJobReadDetailMap.hr.js";
import { FINANCE_ACCOUNTING_SUMMARY_TEMPLATE_MAP } from "./targetJobReadDetailMap.finance.js";
import { PROCUREMENT_SCM_JOB_SUMMARY_TEMPLATE_EXPANSION } from "./targetJobReadDetailMap.procurementScm.js";
import { PRODUCTION_QUALITY_MANUFACTURING_DETAIL_BLOCKS } from "./targetJobReadDetailMap.manufacturing.js";
import { ENGINEERING_DEVELOPMENT_JOB_SUMMARY_TEMPLATE_EXPANSION } from "./targetJobReadDetailMap.engineering.js";
import { IT_DATA_DIGITAL_DETAIL_BLOCKS } from "./targetJobReadDetailMap.itData.js";
import { DESIGN_SUMMARY_TEMPLATE_MAP } from "./targetJobReadDetailMap.design.js";
import { RESEARCH_PROFESSIONAL_JOB_SUMMARY_TEMPLATE_EXPANSION } from "./targetJobReadDetailMap.researchProfessional.js";
import { EDUCATION_COACHING_SUMMARY_TEMPLATE_MAP } from "./targetJobReadDetailMap.educationCoaching.js";
import { PUBLIC_ADMIN_SUPPORT_SUMMARY_TEMPLATES } from "./targetJobReadDetailMap.publicAdmin.js";

function normalizeDetailEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    return { summaryTemplate: entry };
  }
  if (typeof entry === "object") {
    return entry;
  }
  return null;
}

function normalizeMapEntries(entries = {}) {
  return Object.fromEntries(
    Object.entries(entries)
      .map(([key, value]) => [key, normalizeDetailEntry(value)])
      .filter(([, value]) => Boolean(value))
  );
}

const BUSINESS_SUBCATEGORY_DETAIL_MAP = {
  STRATEGY: BUSINESS_JOB_DETAIL_ASSETS.STRATEGY_PLANNING,
  BUSINESS_PLANNING: BUSINESS_JOB_DETAIL_ASSETS.BUSINESS_PLANNING,
  SERVICE_PLANNING: BUSINESS_JOB_DETAIL_ASSETS.SERVICE_PLANNING,
  OPERATIONS_MANAGEMENT: BUSINESS_JOB_DETAIL_ASSETS.OPERATIONS_MANAGEMENT,
  PROJECT_MANAGEMENT: BUSINESS_JOB_DETAIL_ASSETS.PROJECT_MANAGEMENT_PM,
  BUSINESS_DEVELOPMENT: BUSINESS_JOB_DETAIL_ASSETS.BUSINESS_DEVELOPMENT_BD,
  BUSINESS_SUPPORT: BUSINESS_JOB_DETAIL_ASSETS.MANAGEMENT_SUPPORT,
};

export const TARGET_JOB_READ_DETAIL_MAP = Object.freeze({
  ...normalizeMapEntries(BUSINESS_SUBCATEGORY_DETAIL_MAP),
  ...normalizeMapEntries(SALES_SUMMARY_TEMPLATE_MAP),
  ...normalizeMapEntries(MARKETING_JOB_SUMMARY_TEMPLATE_EXPANSION),
  ...normalizeMapEntries(CUSTOMER_OPERATIONS_DETAIL_BLOCKS),
  ...normalizeMapEntries(HR_ORGANIZATION_JOB_SUMMARY_TEMPLATE_EXPANSION),
  ...normalizeMapEntries(FINANCE_ACCOUNTING_SUMMARY_TEMPLATE_MAP),
  ...normalizeMapEntries(PROCUREMENT_SCM_JOB_SUMMARY_TEMPLATE_EXPANSION),
  ...normalizeMapEntries(PRODUCTION_QUALITY_MANUFACTURING_DETAIL_BLOCKS),
  ...normalizeMapEntries(ENGINEERING_DEVELOPMENT_JOB_SUMMARY_TEMPLATE_EXPANSION),
  ...normalizeMapEntries(IT_DATA_DIGITAL_DETAIL_BLOCKS),
  ...normalizeMapEntries(DESIGN_SUMMARY_TEMPLATE_MAP),
  ...normalizeMapEntries(RESEARCH_PROFESSIONAL_JOB_SUMMARY_TEMPLATE_EXPANSION),
  ...normalizeMapEntries(EDUCATION_COACHING_SUMMARY_TEMPLATE_MAP),
  ...normalizeMapEntries(PUBLIC_ADMIN_SUPPORT_SUMMARY_TEMPLATES),
});

export function getTargetJobReadDetailBySubcategory(subcategory) {
  return TARGET_JOB_READ_DETAIL_MAP[String(subcategory || "").trim()] || null;
}
