import { JOB_ONTOLOGY_ITEMS, getJobOntologyItemById } from "../job/jobOntology.index.js";

export const TRANSITION_READ_MISSION_TYPES = Object.freeze([
  "operate",
  "plan",
  "select_people",
  "develop_people",
  "support_business",
  "drive_business",
  "analyze",
  "create_design",
  "build_technical",
  "control_risk",
]);

export const TRANSITION_READ_OUTPUT_TYPES = Object.freeze([
  "process_operation",
  "strategy_document",
  "people_decision",
  "people_development_program",
  "sales_result",
  "project_delivery",
  "compliance_control",
  "analysis_report",
  "design_output",
  "technical_output",
]);

export const TRANSITION_READ_STAKEHOLDER_PRIMARY_TYPES = Object.freeze([
  "candidate",
  "employee",
  "leader_manager",
  "client_customer",
  "partner_vendor",
  "cross_function_internal",
  "executive_management",
  "public_external",
]);

export const TRANSITION_READ_SUCCESS_METRIC_TYPES = Object.freeze([
  "speed_volume",
  "quality_accuracy",
  "growth_effectiveness",
  "revenue_result",
  "stability_compliance",
  "strategy_alignment",
  "delivery_completion",
]);

export const TRANSITION_READ_HORIZON_TYPES = Object.freeze([
  "short_cycle",
  "mid_cycle",
  "long_cycle",
]);

function makeTransitionReadMeta({
  missionType,
  outputType,
  stakeholderPrimary,
  successMetricType,
  horizonType,
}) {
  return Object.freeze({
    missionType,
    outputType,
    stakeholderPrimary,
    successMetricType,
    horizonType,
  });
}

function assignTransitionReadMeta(jobIds, meta) {
  return jobIds.reduce((acc, jobId) => {
    acc[jobId] = meta;
    return acc;
  }, {});
}

const META_OPERATE_INTERNAL_SHORT = makeTransitionReadMeta({
  missionType: "operate",
  outputType: "process_operation",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "speed_volume",
  horizonType: "short_cycle",
});

const META_OPERATE_CUSTOMER_SHORT = makeTransitionReadMeta({
  missionType: "operate",
  outputType: "process_operation",
  stakeholderPrimary: "client_customer",
  successMetricType: "quality_accuracy",
  horizonType: "short_cycle",
});

const META_OPERATE_CUSTOMER_GROWTH_MID = makeTransitionReadMeta({
  missionType: "operate",
  outputType: "process_operation",
  stakeholderPrimary: "client_customer",
  successMetricType: "growth_effectiveness",
  horizonType: "mid_cycle",
});

const META_PLAN_INTERNAL_MID = makeTransitionReadMeta({
  missionType: "plan",
  outputType: "strategy_document",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "strategy_alignment",
  horizonType: "mid_cycle",
});

const META_PLAN_EXECUTIVE_LONG = makeTransitionReadMeta({
  missionType: "plan",
  outputType: "strategy_document",
  stakeholderPrimary: "executive_management",
  successMetricType: "strategy_alignment",
  horizonType: "long_cycle",
});

const META_PROJECT_INTERNAL_MID = makeTransitionReadMeta({
  missionType: "plan",
  outputType: "project_delivery",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "delivery_completion",
  horizonType: "mid_cycle",
});

const META_GROWTH_CUSTOMER_MID = makeTransitionReadMeta({
  missionType: "drive_business",
  outputType: "sales_result",
  stakeholderPrimary: "client_customer",
  successMetricType: "growth_effectiveness",
  horizonType: "mid_cycle",
});

const META_REVENUE_CUSTOMER_SHORT = makeTransitionReadMeta({
  missionType: "drive_business",
  outputType: "sales_result",
  stakeholderPrimary: "client_customer",
  successMetricType: "revenue_result",
  horizonType: "short_cycle",
});

const META_REVENUE_CUSTOMER_MID = makeTransitionReadMeta({
  missionType: "drive_business",
  outputType: "sales_result",
  stakeholderPrimary: "client_customer",
  successMetricType: "revenue_result",
  horizonType: "mid_cycle",
});

const META_REVENUE_CUSTOMER_LONG = makeTransitionReadMeta({
  missionType: "drive_business",
  outputType: "sales_result",
  stakeholderPrimary: "client_customer",
  successMetricType: "revenue_result",
  horizonType: "long_cycle",
});

const META_PARTNER_REVENUE_MID = makeTransitionReadMeta({
  missionType: "drive_business",
  outputType: "sales_result",
  stakeholderPrimary: "partner_vendor",
  successMetricType: "revenue_result",
  horizonType: "mid_cycle",
});

const META_SUPPORT_INTERNAL_SHORT = makeTransitionReadMeta({
  missionType: "support_business",
  outputType: "process_operation",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "quality_accuracy",
  horizonType: "short_cycle",
});

const META_SUPPORT_INTERNAL_MID = makeTransitionReadMeta({
  missionType: "support_business",
  outputType: "process_operation",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "delivery_completion",
  horizonType: "mid_cycle",
});

const META_SUPPORT_PARTNER_MID = makeTransitionReadMeta({
  missionType: "support_business",
  outputType: "process_operation",
  stakeholderPrimary: "partner_vendor",
  successMetricType: "quality_accuracy",
  horizonType: "mid_cycle",
});

const META_SUPPORT_PARTNER_LONG = makeTransitionReadMeta({
  missionType: "support_business",
  outputType: "strategy_document",
  stakeholderPrimary: "partner_vendor",
  successMetricType: "strategy_alignment",
  horizonType: "long_cycle",
});

const META_SELECT_PEOPLE_SHORT = makeTransitionReadMeta({
  missionType: "select_people",
  outputType: "people_decision",
  stakeholderPrimary: "candidate",
  successMetricType: "delivery_completion",
  horizonType: "short_cycle",
});

const META_DEVELOP_PEOPLE_MID = makeTransitionReadMeta({
  missionType: "develop_people",
  outputType: "people_development_program",
  stakeholderPrimary: "employee",
  successMetricType: "growth_effectiveness",
  horizonType: "mid_cycle",
});

const META_DEVELOP_PEOPLE_LONG = makeTransitionReadMeta({
  missionType: "develop_people",
  outputType: "people_development_program",
  stakeholderPrimary: "employee",
  successMetricType: "growth_effectiveness",
  horizonType: "long_cycle",
});

const META_DEVELOP_CANDIDATE_MID = makeTransitionReadMeta({
  missionType: "develop_people",
  outputType: "people_development_program",
  stakeholderPrimary: "candidate",
  successMetricType: "growth_effectiveness",
  horizonType: "mid_cycle",
});

const META_ANALYZE_INTERNAL_MID = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "quality_accuracy",
  horizonType: "mid_cycle",
});

const META_ANALYZE_EXECUTIVE_MID = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "executive_management",
  successMetricType: "strategy_alignment",
  horizonType: "mid_cycle",
});

const META_ANALYZE_EXECUTIVE_LONG = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "executive_management",
  successMetricType: "strategy_alignment",
  horizonType: "long_cycle",
});

const META_ANALYZE_CLIENT_MID = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "client_customer",
  successMetricType: "strategy_alignment",
  horizonType: "mid_cycle",
});

const META_ANALYZE_PUBLIC_MID = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "public_external",
  successMetricType: "quality_accuracy",
  horizonType: "mid_cycle",
});

const META_ANALYZE_PUBLIC_LONG = makeTransitionReadMeta({
  missionType: "analyze",
  outputType: "analysis_report",
  stakeholderPrimary: "public_external",
  successMetricType: "strategy_alignment",
  horizonType: "long_cycle",
});

const META_CREATE_DESIGN_SHORT = makeTransitionReadMeta({
  missionType: "create_design",
  outputType: "design_output",
  stakeholderPrimary: "client_customer",
  successMetricType: "quality_accuracy",
  horizonType: "short_cycle",
});

const META_CREATE_DESIGN_MID = makeTransitionReadMeta({
  missionType: "create_design",
  outputType: "design_output",
  stakeholderPrimary: "client_customer",
  successMetricType: "quality_accuracy",
  horizonType: "mid_cycle",
});

const META_BUILD_TECH_MID = makeTransitionReadMeta({
  missionType: "build_technical",
  outputType: "technical_output",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "delivery_completion",
  horizonType: "mid_cycle",
});

const META_BUILD_TECH_LONG = makeTransitionReadMeta({
  missionType: "build_technical",
  outputType: "technical_output",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "quality_accuracy",
  horizonType: "long_cycle",
});

const META_BUILD_TECH_STABILITY = makeTransitionReadMeta({
  missionType: "build_technical",
  outputType: "technical_output",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "stability_compliance",
  horizonType: "mid_cycle",
});

const META_CONTROL_INTERNAL_SHORT = makeTransitionReadMeta({
  missionType: "control_risk",
  outputType: "compliance_control",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "quality_accuracy",
  horizonType: "short_cycle",
});

const META_CONTROL_INTERNAL_MID = makeTransitionReadMeta({
  missionType: "control_risk",
  outputType: "compliance_control",
  stakeholderPrimary: "cross_function_internal",
  successMetricType: "stability_compliance",
  horizonType: "mid_cycle",
});

const META_CONTROL_PUBLIC_LONG = makeTransitionReadMeta({
  missionType: "control_risk",
  outputType: "compliance_control",
  stakeholderPrimary: "public_external",
  successMetricType: "stability_compliance",
  horizonType: "long_cycle",
});

export const JOB_TRANSITION_READ_META_REGISTRY = Object.freeze({
  ...assignTransitionReadMeta(
    [
      "JOB_BUSINESS_BUSINESS_SUPPORT",
      "JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS",
      "JOB_EDUCATION_COUNSELING_COACHING_EDUCATION_OPERATIONS",
    ].filter(Boolean),
    META_SUPPORT_INTERNAL_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_BUSINESS_OPERATIONS_MANAGEMENT",
      "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS",
      "JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS",
      "JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS",
      "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE",
      "JOB_PROCUREMENT_SCM_INVENTORY_MANAGEMENT",
      "JOB_PROCUREMENT_SCM_LOGISTICS",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_DOCUMENT_ADMIN_SUPPORT",
      "JOB_SALES_B2C_SALES",
      "JOB_SALES_GENERAL_SALES",
    ],
    META_OPERATE_INTERNAL_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
    ],
    META_OPERATE_CUSTOMER_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS",
    ],
    META_OPERATE_CUSTOMER_GROWTH_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_BUSINESS_PROJECT_MANAGEMENT",
      "JOB_BUSINESS_SERVICE_PLANNING",
      "JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING",
      "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION",
    ],
    META_PROJECT_INTERNAL_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_BUSINESS_STRATEGY",
      "JOB_HR_ORGANIZATION_HR_PLANNING",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_POLICY_SUPPORT",
    ],
    META_PLAN_EXECUTIVE_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_IT_DATA_DIGITAL_IT_PLANNING",
      "JOB_PROCUREMENT_SCM_DEMAND_SUPPLY_PLANNING",
      "JOB_BUSINESS_BUSINESS_PLANNING",
      "JOB_BUSINESS_MERCHANDISING",
    ],
    META_PLAN_INTERNAL_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_BUSINESS_BUSINESS_DEVELOPMENT",
      "JOB_MARKETING_BRAND_MARKETING",
      "JOB_MARKETING_CONTENT_MARKETING",
      "JOB_MARKETING_CRM_MARKETING",
      "JOB_MARKETING_DIGITAL_MARKETING",
      "JOB_MARKETING_PERFORMANCE_MARKETING",
      "JOB_MARKETING_PR_COMMUNICATIONS",
      "JOB_MARKETING_PRODUCT_MARKETING_PMM",
    ],
    META_GROWTH_CUSTOMER_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_SALES_B2B_SALES",
      "JOB_SALES_PROPOSAL_SALES",
      "JOB_SALES_SOLUTION_SALES",
      "JOB_SALES_TECHNICAL_SALES",
    ],
    META_REVENUE_CUSTOMER_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_SALES_KEY_ACCOUNT_MANAGEMENT",
      "JOB_SALES_OVERSEAS_SALES",
    ],
    META_REVENUE_CUSTOMER_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_SALES_PARTNER_CHANNEL_SALES",
    ],
    META_PARTNER_REVENUE_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_HR_ORGANIZATION_HR_OPS",
      "JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS",
      "JOB_IT_DATA_DIGITAL_IT_OPERATIONS_SYSTEMS_MANAGEMENT",
      "JOB_SALES_SALES_OPERATIONS",
      "JOB_PROCUREMENT_SCM_PROCUREMENT",
      "JOB_PROCUREMENT_SCM_SCM",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION",
      "JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS",
    ],
    META_SUPPORT_INTERNAL_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_PROCUREMENT_SCM_PURCHASING",
      "JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT",
    ],
    META_SUPPORT_PARTNER_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING",
    ],
    META_SUPPORT_PARTNER_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_HR_ORGANIZATION_RECRUITING",
    ],
    META_SELECT_PEOPLE_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING",
      "JOB_EDUCATION_COUNSELING_COACHING_JOB_TRAINING",
      "JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN",
      "JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT",
    ],
    META_DEVELOP_PEOPLE_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_HR_ORGANIZATION_LEARNING_OD",
    ],
    META_DEVELOP_PEOPLE_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING",
      "JOB_EDUCATION_COUNSELING_COACHING_CAREER_COUNSELING",
      "JOB_EDUCATION_COUNSELING_COACHING_FACILITATION",
    ],
    META_DEVELOP_CANDIDATE_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
      "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      "JOB_MARKETING_MARKETING_RESEARCH",
      "JOB_RESEARCH_PROFESSIONAL_EXPERT_REVIEW_EVALUATION",
      "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH",
    ],
    META_ANALYZE_INTERNAL_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_FINANCE_ACCOUNTING_FINANCE",
      "JOB_FINANCE_ACCOUNTING_FP_AND_A",
      "JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING",
      "JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE",
      "JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH",
    ],
    META_ANALYZE_EXECUTIVE_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_RESEARCH_PROFESSIONAL_CONSULTING",
    ],
    META_ANALYZE_CLIENT_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH",
    ],
    META_ANALYZE_PUBLIC_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_DESIGN_CONTENT_DESIGN",
      "JOB_DESIGN_GRAPHIC_DESIGN",
      "JOB_DESIGN_MOTION_DESIGN",
      "JOB_DESIGN_UI_DESIGN",
    ],
    META_CREATE_DESIGN_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_DESIGN_BX_BRAND_DESIGN",
      "JOB_DESIGN_INDUSTRIAL_DESIGN",
      "JOB_DESIGN_PRODUCT_DESIGN",
      "JOB_DESIGN_UX_DESIGN",
    ],
    META_CREATE_DESIGN_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN",
      "JOB_ENGINEERING_DEVELOPMENT_EMBEDDED_DEVELOPMENT",
      "JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN",
      "JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT",
      "JOB_ENGINEERING_DEVELOPMENT_SYSTEMS_ENGINEERING",
      "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING",
      "JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING",
      "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
      "JOB_IT_DATA_DIGITAL_DATA_ENGINEERING",
      "JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT",
      "JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT",
      "JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT",
    ],
    META_BUILD_TECH_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT",
    ],
    META_BUILD_TECH_LONG
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA",
    ],
    META_BUILD_TECH_STABILITY
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_CUSTOMER_OPERATIONS_QUALITY_OPERATIONS",
      "JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL",
      "JOB_FINANCE_ACCOUNTING_TAX",
      "JOB_FINANCE_ACCOUNTING_TREASURY",
      "JOB_HR_ORGANIZATION_LABOR_RELATIONS",
      "JOB_HR_ORGANIZATION_HRBP",
      "JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION",
      "JOB_IT_DATA_DIGITAL_SECURITY",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
      "JOB_ENGINEERING_DEVELOPMENT_TESTING_VALIDATION",
    ],
    META_CONTROL_INTERNAL_SHORT
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING",
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING",
    ],
    META_CONTROL_INTERNAL_MID
  ),
  ...assignTransitionReadMeta(
    [
      "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY",
      "JOB_RESEARCH_PROFESSIONAL_LEGAL",
      "JOB_RESEARCH_PROFESSIONAL_PATENT_INTELLECTUAL_PROPERTY",
      "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
    ],
    META_CONTROL_PUBLIC_LONG
  ),
});

function getPrimaryJobFamily(jobItem) {
  if (!jobItem || typeof jobItem !== "object") return null;

  const familyId = Array.isArray(jobItem?.families)
    ? jobItem.families.find((family) => family && typeof family.id === "string")?.id
    : null;

  if (familyId) return String(familyId).trim();

  const roleFamily = Array.isArray(jobItem?.roles)
    ? jobItem.roles.find((role) => role && typeof role.family === "string")?.family
    : null;

  return roleFamily ? String(roleFamily).trim() : null;
}

export function getTransitionReadJobMeta(jobId) {
  const normalizedJobId = String(jobId ?? "").trim();
  if (!normalizedJobId) return null;

  const jobItem = getJobOntologyItemById(normalizedJobId);
  const meta = JOB_TRANSITION_READ_META_REGISTRY[normalizedJobId] ?? null;

  if (!jobItem && !meta) return null;

  return Object.freeze({
    family: getPrimaryJobFamily(jobItem),
    missionType: meta?.missionType ?? null,
    outputType: meta?.outputType ?? null,
    stakeholderPrimary: meta?.stakeholderPrimary ?? null,
    successMetricType: meta?.successMetricType ?? null,
    horizonType: meta?.horizonType ?? null,
  });
}

export function getTransitionReadJobMetaByJobItem(jobItem) {
  if (!jobItem || typeof jobItem !== "object") return null;

  const jobId = String(jobItem?.id ?? "").trim();
  const meta = jobId ? JOB_TRANSITION_READ_META_REGISTRY[jobId] ?? null : null;

  if (!jobId && !meta) return null;

  return Object.freeze({
    family: getPrimaryJobFamily(jobItem),
    missionType: meta?.missionType ?? null,
    outputType: meta?.outputType ?? null,
    stakeholderPrimary: meta?.stakeholderPrimary ?? null,
    successMetricType: meta?.successMetricType ?? null,
    horizonType: meta?.horizonType ?? null,
  });
}

export const JOB_TRANSITION_READ_META_MISSING_IDS = Object.freeze(
  JOB_ONTOLOGY_ITEMS.map((item) => item.id).filter(
    (jobId) => !JOB_TRANSITION_READ_META_REGISTRY[jobId]
  )
);
